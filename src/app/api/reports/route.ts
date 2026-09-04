import { db } from '@/db';
import { reports, datasetImages } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';
import { scoreMatch } from '@/lib/matching';
import { calcUniqueness } from '@/lib/uniqueness';
import { defaultProfile, type BikeProfile } from '@/lib/vocabulary';

export const dynamic = 'force-dynamic';

function makePublicId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'ISL-';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function GET() {
  const rows = await db
    .select({
      id: reports.id,
      publicId: reports.publicId,
      bikeType: reports.bikeType,
      brand: reports.brand,
      model: reports.model,
      frameColor: reports.frameColor,
      status: reports.status,
      uniquenessScore: reports.uniquenessScore,
      createdAt: reports.createdAt,
      theftLocation: reports.theftLocation,
    })
    .from(reports)
    .orderBy(desc(reports.createdAt))
    .limit(100);
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(reports);
  return Response.json({ reports: rows, total: count });
}

export async function POST(req: Request) {
  let body: Partial<BikeProfile>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const p: BikeProfile = { ...defaultProfile, ...body };
  if (!p.bikeType) return Response.json({ error: 'bikeType is required' }, { status: 400 });
  if (!p.ownerName?.trim() || !p.contactEmail?.trim()) {
    return Response.json({ error: 'ownerName and contactEmail are required' }, { status: 400 });
  }

  const score = calcUniqueness(p);
  const publicId = makePublicId();

  const [row] = await db
    .insert(reports)
    .values({
      publicId,
      bikeType: p.bikeType,
      brand: p.brand.slice(0, 120),
      model: p.model.slice(0, 160),
      year: p.year.slice(0, 16),
      frameColor: p.frameColor,
      frameColorHex: p.frameColorHex.slice(0, 16),
      secondaryColor: p.secondaryColor,
      frameSize: p.frameSize,
      handlebarType: p.handlebarType,
      serialNumber: p.serialNumber.trim().slice(0, 80),
      stickersDecals: p.stickersDecals,
      damage: p.damage,
      damageSpots: p.damageSpots,
      accessories: p.accessories,
      lockType: p.lockType,
      lockColor: p.lockColor.slice(0, 120),
      saddleColor: p.saddleColor,
      gripColor: p.gripColor,
      ownerName: p.ownerName.trim().slice(0, 120),
      contactEmail: p.contactEmail.trim().slice(0, 160),
      contactPhone: p.contactPhone.slice(0, 40),
      theftDate: p.theftDate.slice(0, 16),
      theftLocation: p.theftLocation,
      additionalNotes: p.additionalNotes,
      uniquenessScore: score.percentage,
    })
    .returning();

  // Run matching against the whole dataset (fine for ~1k–10k rows).
  const images = await db.select().from(datasetImages);
  const matches = images
    .map((img) => {
      const r = scoreMatch(p, img.analysis || {}, img.postText || '');
      return { image: img, ...r };
    })
    .filter((m) => m.score >= 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return Response.json({ report: row, publicId, matches, searched: images.length });
}
