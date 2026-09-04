import { db } from '@/db';
import { catalogBikes } from '@/db/schema';
import { and, asc, ilike, sql } from 'drizzle-orm';
import { guessBikeType, normalizeColor } from '@/lib/vocabulary';

export const dynamic = 'force-dynamic';

/**
 * GET /api/catalog?q=trek            -> distinct brands matching q
 * GET /api/catalog?brand=Trek&q=fx   -> models (+ colorways) for a brand
 * GET /api/catalog?stats=1           -> counts
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const brand = (url.searchParams.get('brand') || '').trim();

  if (url.searchParams.get('stats')) {
    const [row] = await db
      .select({
        rows: sql<number>`count(*)::int`,
        brands: sql<number>`count(distinct brand)::int`,
        models: sql<number>`count(distinct brand || ' ' || model)::int`,
        withImage: sql<number>`count(*) filter (where image_url <> '')::int`,
      })
      .from(catalogBikes);
    return Response.json(row);
  }

  if (brand) {
    const rows = await db
      .select()
      .from(catalogBikes)
      .where(and(ilike(catalogBikes.brand, brand), q ? ilike(catalogBikes.model, `%${q}%`) : undefined))
      .orderBy(asc(catalogBikes.model), asc(catalogBikes.colorName))
      .limit(80);
    // group by model
    const grouped = new Map<string, { model: string; bikeType: string; year: string; colors: { name: string; id: string; hex?: string; imageUrl: string }[]; sizes: Set<string> }>();
    for (const r of rows) {
      const g = grouped.get(r.model) || { model: r.model, bikeType: r.bikeType || 'unknown', year: r.year || '', colors: [], sizes: new Set<string>() };
      if (r.colorName && !g.colors.some((c) => c.name === r.colorName)) g.colors.push({ name: r.colorName, id: r.frameColor || '', imageUrl: r.imageUrl || '' });
      (r.sizes || []).forEach((s) => g.sizes.add(s));
      grouped.set(r.model, g);
    }
    return Response.json({ models: [...grouped.values()].map((g) => ({ ...g, sizes: [...g.sizes] })) });
  }

  const rows = await db
    .select({ brand: catalogBikes.brand, n: sql<number>`count(*)::int` })
    .from(catalogBikes)
    .where(q ? ilike(catalogBikes.brand, `%${q}%`) : undefined)
    .groupBy(catalogBikes.brand)
    .orderBy(asc(catalogBikes.brand))
    .limit(40);
  return Response.json({ brands: rows });
}

type IncomingBike = {
  brand: string; model: string; year?: string; bikeType?: string; colorName?: string; frameColor?: string;
  sizes?: string[] | string; shop?: string; sourceUrl?: string; imageUrl?: string; priceIsk?: number | string | null;
};

/** POST /api/catalog  body: IncomingBike[]  (output of scripts/harvest-catalog.mjs or Apify) */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const items: IncomingBike[] = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return Response.json({ error: 'Expected a JSON array of bikes' }, { status: 400 });

  const values = items
    .filter((b) => b && b.brand && b.model)
    .map((b) => {
      const sizes = Array.isArray(b.sizes) ? b.sizes : typeof b.sizes === 'string' ? b.sizes.split(/[,/|]/).map((s) => s.trim()).filter(Boolean) : [];
      const price = b.priceIsk == null || b.priceIsk === '' ? null : Number(String(b.priceIsk).replace(/[^\d]/g, '')) || null;
      return {
        brand: String(b.brand).trim().slice(0, 120),
        model: String(b.model).trim().slice(0, 160),
        year: String(b.year || '').slice(0, 16),
        bikeType: b.bikeType || guessBikeType(`${b.brand} ${b.model}`),
        colorName: String(b.colorName || '').slice(0, 120),
        frameColor: b.frameColor || normalizeColor(String(b.colorName || '')),
        sizes,
        shop: String(b.shop || '').slice(0, 80),
        sourceUrl: String(b.sourceUrl || ''),
        imageUrl: String(b.imageUrl || ''),
        priceIsk: price,
      };
    });

  let inserted = 0;
  for (let i = 0; i < values.length; i += 200) {
    const chunk = values.slice(i, i + 200);
    const res = await db.insert(catalogBikes).values(chunk).returning({ id: catalogBikes.id });
    inserted += res.length;
  }
  return Response.json({ inserted });
}

export async function DELETE() {
  await db.delete(catalogBikes);
  return Response.json({ ok: true });
}
