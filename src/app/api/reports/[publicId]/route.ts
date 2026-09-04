import { db } from '@/db';
import { reports, datasetImages, matchFeedback } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { scoreMatch } from '@/lib/matching';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await ctx.params;
  const [report] = await db.select().from(reports).where(eq(reports.publicId, publicId.toUpperCase()));
  if (!report) return Response.json({ error: 'Not found' }, { status: 404 });

  const feedback = await db.select().from(matchFeedback).where(eq(matchFeedback.reportId, report.id));
  const rejected = new Set(feedback.filter((f) => f.verdict === 'not_mine').map((f) => f.imageId));
  const confirmed = new Set(feedback.filter((f) => f.verdict === 'mine').map((f) => f.imageId));

  const images = await db.select().from(datasetImages);
  const matches = images
    .map((img) => ({ image: img, ...scoreMatch(
      {
        bikeType: report.bikeType,
        brand: report.brand || '',
        model: report.model || '',
        frameColor: report.frameColor || '',
        secondaryColor: report.secondaryColor || '',
        handlebarType: report.handlebarType || '',
        accessories: report.accessories || [],
        lockType: report.lockType || '',
        saddleColor: report.saddleColor || '',
        gripColor: report.gripColor || '',
        stickersDecals: report.stickersDecals || '',
        damage: report.damage || '',
        serialNumber: report.serialNumber || '',
      },
      img.analysis || {},
      img.postText || '',
    ) }))
    .filter((m) => m.score >= 25 && !rejected.has(m.image.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((m) => ({ ...m, confirmed: confirmed.has(m.image.id) }));

  // Never leak contact details on the public page beyond what the owner typed for themselves.
  return Response.json({ report, matches, searched: images.length });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = ['open', 'recovered', 'closed'].includes(body.status) ? body.status : null;
  if (!status) return Response.json({ error: 'Invalid status' }, { status: 400 });
  const [row] = await db.update(reports).set({ status }).where(eq(reports.publicId, publicId.toUpperCase())).returning();
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ report: row });
}
