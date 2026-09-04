import { db } from '@/db';
import { datasetImages, type ImageAnalysis } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';
import { normalizeColor } from '@/lib/vocabulary';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      demo: sql<number>`count(*) filter (where is_demo)::int`,
      found: sql<number>`count(*) filter (where post_kind = 'found')::int`,
      stolen: sql<number>`count(*) filter (where post_kind = 'stolen')::int`,
      analyzed: sql<number>`count(*) filter (where analysis::text <> '{}')::int`,
      newest: sql<string | null>`max(posted_at)`,
    })
    .from(datasetImages);
  if (url.searchParams.get('recent')) {
    const recent = await db.select().from(datasetImages).orderBy(desc(datasetImages.createdAt)).limit(24);
    return Response.json({ stats, recent });
  }
  return Response.json({ stats });
}

/**
 * POST /api/dataset
 * Accepts the merged output of the FB-group scrape + vision analysis:
 * [{ externalId, imageUrl, postUrl, postText, postedAt, postKind, analysis: {...} }]
 * Also tolerates raw Apify facebook-groups-scraper items (uses `attachments` / `media`).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const items: Record<string, unknown>[] = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return Response.json({ error: 'Expected a JSON array' }, { status: 400 });

  const rows: (typeof datasetImages.$inferInsert)[] = [];
  for (const it of items) {
    const explicitUrl = typeof it.imageUrl === 'string' ? it.imageUrl : '';
    const attachments = Array.isArray(it.attachments) ? (it.attachments as Record<string, unknown>[]) : [];
    const urls = explicitUrl
      ? [explicitUrl]
      : attachments.map((a) => (typeof a.image === 'object' && a.image && 'uri' in a.image ? String((a.image as { uri: string }).uri) : typeof a.url === 'string' ? a.url : '')).filter(Boolean);
    if (!urls.length) continue;
    const postUrl = String(it.postUrl || it.url || '');
    const postText = String(it.postText || it.text || '');
    const postedRaw = it.postedAt || it.time || it.date;
    const postedAt = postedRaw ? new Date(String(postedRaw)) : null;
    const kind = String(it.postKind || guessKind(postText));
    const baseId = String(it.externalId || it.postId || it.id || postUrl || urls[0]);
    urls.forEach((u, idx) => {
      const analysis = normalizeAnalysis((it.analysis as ImageAnalysis) || {});
      rows.push({
        externalId: (urls.length > 1 ? `${baseId}#${idx}` : baseId).slice(0, 160),
        imageUrl: u,
        postUrl,
        postText,
        postedAt: postedAt && !isNaN(postedAt.getTime()) ? postedAt : null,
        postKind: kind,
        analysis,
        searchText: buildSearchText(analysis, postText),
        isDemo: Boolean(it.isDemo),
      });
    });
  }

  let upserted = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const res = await db
      .insert(datasetImages)
      .values(chunk)
      .onConflictDoUpdate({
        target: datasetImages.externalId,
        set: {
          analysis: sql`excluded.analysis`,
          searchText: sql`excluded.search_text`,
          postText: sql`excluded.post_text`,
          postKind: sql`excluded.post_kind`,
        },
      })
      .returning({ id: datasetImages.id });
    upserted += res.length;
  }
  return Response.json({ upserted, skipped: items.length - rows.length });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('demo')) {
    await db.delete(datasetImages).where(sql`is_demo = true`);
  } else {
    await db.delete(datasetImages);
  }
  return Response.json({ ok: true });
}

function guessKind(text: string): string {
  const s = text.toLowerCase();
  if (/\b(fannst|fundið|fundum|fann|found)\b/.test(s)) return 'found';
  if (/\b(stolið|stolin|stolinn|stolen|var stolið|tekið)\b/.test(s)) return 'stolen';
  if (/\b(týnt|tapað|tapaði|lost|missti)\b/.test(s)) return 'lost';
  return 'unknown';
}

function normalizeAnalysis(a: ImageAnalysis): ImageAnalysis {
  return {
    ...a,
    frameColor: a.frameColor ? normalizeColor(a.frameColor) || a.frameColor : undefined,
    secondaryColors: (a.secondaryColors || []).map((c) => normalizeColor(c) || c),
    accessories: (a.accessories || []).map((x) => String(x).toLowerCase().replace(/[\s-]+/g, '_')),
    brand: a.brand ? String(a.brand).trim() : undefined,
  };
}

function buildSearchText(a: ImageAnalysis, postText: string) {
  return [a.bikeType, a.brand, a.model, a.frameColor, ...(a.secondaryColors || []), a.handlebarType, ...(a.accessories || []), a.lockType, a.saddleColor, a.gripColor, ...(a.distinctiveFeatures || []), a.notes, postText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .slice(0, 4000);
}
