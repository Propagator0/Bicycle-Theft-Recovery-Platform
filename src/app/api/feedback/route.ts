import { db } from '@/db';
import { matchFeedback, reports } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const publicId = String(body.publicId || '').toUpperCase();
  const imageId = Number(body.imageId);
  const verdict = body.verdict === 'mine' ? 'mine' : body.verdict === 'not_mine' ? 'not_mine' : null;
  if (!publicId || !imageId || !verdict) return Response.json({ error: 'publicId, imageId, verdict required' }, { status: 400 });

  const [report] = await db.select({ id: reports.id }).from(reports).where(eq(reports.publicId, publicId));
  if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

  await db.insert(matchFeedback).values({ reportId: report.id, imageId, verdict, score: Number(body.score || 0) });
  if (verdict === 'mine') await db.update(reports).set({ status: 'recovered' }).where(eq(reports.id, report.id));
  return Response.json({ ok: true });
}
