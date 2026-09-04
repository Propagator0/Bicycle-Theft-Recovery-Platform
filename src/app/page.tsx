import { db } from '@/db';
import { datasetImages, reports } from '@/db/schema';
import { sql } from 'drizzle-orm';
import Header from '@/components/Header';
import Configurator from '@/components/Configurator';

export const dynamic = 'force-dynamic';

async function getCounts() {
  try {
    const [[img], [rep]] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(datasetImages),
      db.select({ n: sql<number>`count(*)::int` }).from(reports),
    ]);
    return { images: img?.n ?? 0, reports: rep?.n ?? 0 };
  } catch {
    return { images: 0, reports: 0 };
  }
}

export default async function HomePage() {
  const counts = await getCounts();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Header caseCount={counts.reports} imageCount={counts.images} />
      <Configurator datasetCount={counts.images} />
    </div>
  );
}
