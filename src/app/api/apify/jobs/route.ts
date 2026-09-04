import { db } from '@/db';
import { catalogBikes } from '@/db/schema';
import { asc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/apify/jobs?format=json|csv|queries&onlyMissing=1&limit=500
 *
 * Turns the catalog into a clean, deduplicated list of image-search queries
 * ("Trek FX 3 Disc 2023 Lithium Grey bike") and formats it as:
 *   - json     -> ready-to-paste INPUT for an Apify Google Images scraper actor
 *   - csv      -> brand,model,year,colorName,query  (for a spreadsheet / manual review)
 *   - queries  -> one query per line
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'json';
  const onlyMissing = url.searchParams.get('onlyMissing') === '1';
  const limit = Math.min(Number(url.searchParams.get('limit') || 1000), 5000);

  const rows = await db
    .select({
      id: catalogBikes.id,
      brand: catalogBikes.brand,
      model: catalogBikes.model,
      year: catalogBikes.year,
      colorName: catalogBikes.colorName,
      imageUrl: catalogBikes.imageUrl,
    })
    .from(catalogBikes)
    .where(onlyMissing ? sql`image_url = ''` : undefined)
    .orderBy(asc(catalogBikes.brand), asc(catalogBikes.model))
    .limit(limit);

  const seen = new Set<string>();
  const jobs: { catalogId: number; brand: string; model: string; year: string; colorName: string; query: string }[] = [];
  for (const r of rows) {
    const query = [r.brand, r.model, r.year, r.colorName, 'bike'].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    const key = query.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    jobs.push({ catalogId: r.id, brand: r.brand, model: r.model, year: r.year || '', colorName: r.colorName || '', query });
  }

  if (format === 'csv') {
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = ['catalogId,brand,model,year,colorName,query', ...jobs.map((j) => [j.catalogId, j.brand, j.model, j.year, j.colorName, j.query].map((x) => esc(String(x))).join(','))].join('\n');
    return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="apify-image-jobs.csv"' } });
  }
  if (format === 'queries') {
    return new Response(jobs.map((j) => j.query).join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  // Apify "Google Images Scraper" style input. Most image-search actors accept a
  // `queries` array + `maxResultsPerQuery`; adjust field names to the actor you pick.
  const apifyInput = {
    queries: jobs.map((j) => j.query),
    maxResultsPerQuery: 3,
    safeSearch: true,
    imageSize: 'large',
    // custom passthrough so the results can be mapped back to the catalog rows
    _catalogMap: jobs.map((j) => ({ query: j.query, catalogId: j.catalogId })),
  };
  return Response.json({ count: jobs.length, apifyInput });
}

/**
 * POST /api/apify/jobs
 * Body: array of Apify image results: [{ query, imageUrl | url | originalImageUrl, catalogId? }]
 * Writes the first image URL back to the matching catalog rows.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const items: Record<string, unknown>[] = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return Response.json({ error: 'Expected a JSON array' }, { status: 400 });

  let updated = 0;
  const done = new Set<string>();
  for (const it of items) {
    const img = String(it.imageUrl || it.originalImageUrl || it.url || it.image || '');
    const query = String(it.query || it.searchQuery || '');
    const catalogId = Number(it.catalogId || 0);
    if (!img) continue;
    if (catalogId) {
      if (done.has(`id:${catalogId}`)) continue;
      done.add(`id:${catalogId}`);
      const res = await db.update(catalogBikes).set({ imageUrl: img }).where(sql`id = ${catalogId}`).returning({ id: catalogBikes.id });
      updated += res.length;
    } else if (query) {
      if (done.has(`q:${query}`)) continue;
      done.add(`q:${query}`);
      // match "Brand Model Year Color bike" back to rows by concatenation
      const res = await db
        .update(catalogBikes)
        .set({ imageUrl: img })
        .where(sql`lower(trim(concat_ws(' ', brand, model, nullif(year,''), nullif(color_name,''), 'bike'))) = ${query.toLowerCase().trim()}`)
        .returning({ id: catalogBikes.id });
      updated += res.length;
    }
  }
  return Response.json({ updated });
}
