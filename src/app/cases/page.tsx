import Link from 'next/link';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { BIKE_TYPES, FRAME_COLORS } from '@/lib/vocabulary';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

export default async function CasesPage() {
  const rows = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(200);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Header />
      <main className="max-w-4xl mx-auto px-4 pb-20 pt-8">
        <h2 className="text-2xl font-bold text-zinc-900">Registered stolen bikes</h2>
        <p className="text-zinc-500 text-sm mt-1 mb-6">Public board — no contact details are shown. If you recognise one, open it and use the report ID when you post in the group.</p>
        {rows.length === 0 && <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-500 text-sm">No reports yet. <Link href="/" className="text-blue-600 underline">Register the first one</Link>.</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map((r) => {
            const t = BIKE_TYPES.find((x) => x.id === r.bikeType);
            const c = FRAME_COLORS.find((x) => x.id === r.frameColor);
            return (
              <Link key={r.id} href={`/report/${r.publicId}`} className="bg-white rounded-2xl border border-zinc-200 p-4 hover:border-blue-300 hover:shadow-sm transition flex gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-zinc-200" style={{ backgroundColor: c && c.hex !== 'gradient' ? c.hex : '#e5e7eb' }}>{t?.icon || '🚲'}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-zinc-900 truncate">{[r.brand !== 'Unknown / Custom' ? r.brand : 'Unknown brand', r.model].filter(Boolean).join(' ')}</div>
                    <span className={`ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.status === 'recovered' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                  </div>
                  <div className="text-xs text-zinc-500">{t?.label}{c ? ` · ${c.label}` : ''}{r.year ? ` · ${r.year}` : ''}</div>
                  <div className="text-xs text-zinc-400 mt-1 truncate">{r.theftDate}{r.theftLocation ? ` · ${r.theftLocation}` : ''}</div>
                </div>
                <div className="text-xs font-mono text-zinc-400 self-end">{r.publicId}</div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
