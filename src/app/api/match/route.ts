import { db } from '@/db';
import { datasetImages } from '@/db/schema';
import { scoreMatch } from '@/lib/matching';
import { defaultProfile, type BikeProfile } from '@/lib/vocabulary';

export const dynamic = 'force-dynamic';

/** Live preview matching while the victim is still filling the form (no report saved). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<BikeProfile>;
  const p: BikeProfile = { ...defaultProfile, ...body };
  const images = await db.select().from(datasetImages);
  const matches = images
    .map((img) => ({ image: img, ...scoreMatch(p, img.analysis || {}, img.postText || '') }))
    .filter((m) => m.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return Response.json({ matches, searched: images.length });
}
