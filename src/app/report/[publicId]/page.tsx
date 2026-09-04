import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { reports, datasetImages, matchFeedback } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { scoreMatch } from '@/lib/matching';
import { BIKE_TYPES, FRAME_COLORS, defaultProfile } from '@/lib/vocabulary';
import Header from '@/components/Header';
import BikeVisual from '@/components/BikeVisual';
import MatchList from '@/components/MatchList';
import FlyerActions from '@/components/FlyerActions';

export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const [report] = await db.select().from(reports).where(eq(reports.publicId, publicId.toUpperCase()));
  if (!report) notFound();

  const feedback = await db.select().from(matchFeedback).where(eq(matchFeedback.reportId, report.id));
  const rejected = new Set(feedback.filter((f) => f.verdict === 'not_mine').map((f) => f.imageId));
  const confirmed = new Set(feedback.filter((f) => f.verdict === 'mine').map((f) => f.imageId));

  const input = {
    bikeType: report.bikeType, brand: report.brand || '', model: report.model || '', frameColor: report.frameColor || '',
    secondaryColor: report.secondaryColor || '', handlebarType: report.handlebarType || '', accessories: report.accessories || [],
    lockType: report.lockType || '', saddleColor: report.saddleColor || '', gripColor: report.gripColor || '',
    stickersDecals: report.stickersDecals || '', damage: report.damage || '', serialNumber: report.serialNumber || '',
  };
  const images = await db.select().from(datasetImages);
  const matches = images
    .map((img) => ({ image: img, ...scoreMatch(input, img.analysis || {}, img.postText || '') }))
    .filter((m) => m.score >= 25 && !rejected.has(m.image.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((m) => ({
      id: m.image.id, score: m.score, reasons: m.reasons, imageUrl: m.image.imageUrl, postUrl: m.image.postUrl || '',
      postText: m.image.postText || '', postedAt: m.image.postedAt ? m.image.postedAt.toISOString() : null,
      postKind: m.image.postKind || 'unknown', confirmed: confirmed.has(m.image.id), isDemo: !!m.image.isDemo,
    }));

  const profile = {
    ...defaultProfile, bikeType: report.bikeType, brand: report.brand || '', model: report.model || '', year: report.year || '',
    frameColor: report.frameColor || '', frameColorHex: report.frameColorHex || '', secondaryColor: report.secondaryColor || '',
    handlebarType: report.handlebarType || '', accessories: report.accessories || [], lockType: report.lockType || '',
    lockColor: report.lockColor || '', saddleColor: report.saddleColor || '', gripColor: report.gripColor || '',
    stickersDecals: report.stickersDecals || '', damageSpots: report.damageSpots || [],
  };
  const type = BIKE_TYPES.find((t) => t.id === report.bikeType);
  const color = FRAME_COLORS.find((c) => c.id === report.frameColor);
  const strengthColor = (report.uniquenessScore || 0) >= 80 ? '#10b981' : (report.uniquenessScore || 0) >= 60 ? '#3b82f6' : (report.uniquenessScore || 0) >= 40 ? '#8b5cf6' : '#f59e0b';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <div className="print:hidden"><Header /></div>
      <main className="max-w-3xl mx-auto px-4 pb-20 pt-6 space-y-6">
        <div className={`rounded-2xl p-5 border print:hidden ${report.status === 'recovered' ? 'bg-emerald-100 border-emerald-300' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-start gap-3">
            <span className="text-3xl">{report.status === 'recovered' ? '🎉' : '✅'}</span>
            <div>
              <h2 className="text-xl font-bold text-emerald-900">{report.status === 'recovered' ? 'Marked as recovered!' : 'Report filed — matches below'}</h2>
              <p className="text-sm text-emerald-700 mt-1">Report ID: <strong className="font-mono">{report.publicId}</strong> · bookmark this page, it re-runs the search every time you open it.</p>
              <p className="text-xs text-emerald-600 mt-1">Searched {images.length.toLocaleString()} analysed images from “Hjóladót ofl tapað, fundið eða stolið”.</p>
            </div>
          </div>
        </div>

        {/* Flyer / profile card — this is what prints */}
        <section id="flyer" className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 print:shadow-none print:border-0">
          <div className="text-center mb-2">
            <div className="text-3xl font-black text-red-600 tracking-tight">STOLIÐ HJÓL · STOLEN BIKE</div>
            <div className="text-sm text-zinc-500">{report.theftDate ? `Stolið ${report.theftDate}` : ''}{report.theftLocation ? ` · ${report.theftLocation}` : ''}</div>
          </div>
          <BikeVisual profile={profile} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {type && <Cell label="Type">{type.icon} {type.label}</Cell>}
            {report.brand && <Cell label="Brand">{report.brand}</Cell>}
            {report.model && <Cell label="Model">{report.model}</Cell>}
            {color && (
              <Cell label="Colour">
                <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded-full border border-zinc-200 inline-block" style={{ backgroundColor: color.hex === 'gradient' ? report.frameColorHex || '#818cf8' : color.hex }} />{color.label}</span>
              </Cell>
            )}
            {report.year && <Cell label="Year">{report.year}</Cell>}
            {report.frameSize && report.frameSize !== 'unknown' && <Cell label="Size">{report.frameSize.toUpperCase()}</Cell>}
            {report.serialNumber && <Cell label="Serial #" highlight><span className="font-mono">{report.serialNumber}</span></Cell>}
          </div>
          {(report.accessories?.length || 0) > 0 && (
            <div className="mt-3">
              <div className="text-xs text-zinc-500 font-medium mb-1.5">Accessories</div>
              <div className="flex flex-wrap gap-1.5">{report.accessories!.map((a) => <span key={a} className="px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-full font-medium">{a.replace(/_/g, ' ')}</span>)}</div>
            </div>
          )}
          {(report.stickersDecals || report.damage || (report.damageSpots?.length || 0) > 0) && (
            <div className="mt-3 text-sm text-zinc-700 space-y-1">
              {report.stickersDecals && <p>🏷️ <strong>Stickers / paint:</strong> {report.stickersDecals}</p>}
              {report.damage && <p>🔧 <strong>Damage:</strong> {report.damage}</p>}
              {(report.damageSpots?.length || 0) > 0 && <p>📍 <strong>Marked:</strong> {report.damageSpots!.map((s, i) => `${i + 1}. ${s.note}`).join(' · ')}</p>}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-dashed border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
            <span>Seen it? Report ID <strong className="font-mono text-zinc-800">{report.publicId}</strong></span>
            <span className="hidden print:inline">hjolidmitt.is/report/{report.publicId}</span>
            <span className="print:hidden font-semibold" style={{ color: strengthColor }}>Profile strength {report.uniquenessScore}%</span>
          </div>
        </section>

        <FlyerActions publicId={report.publicId} status={report.status || 'open'} />

        <div className="print:hidden">
          <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
            🔍 Potential matches from the Facebook group
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{matches.length} found</span>
          </h3>
          <MatchList publicId={report.publicId} matches={matches} />
        </div>

        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-3 print:hidden">
          <h3 className="font-semibold text-zinc-800">Next steps</h3>
          <div className="space-y-2 text-sm text-zinc-600">
            <p>📋 <strong>File a police report</strong> — <a href="https://www.logreglan.is" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">logreglan.is</a>. You'll need the case number for insurance.</p>
            <p>🌐 <strong>Post in the Facebook group</strong> — paste the flyer text above into “Hjóladót ofl tapað, fundið eða stolið”.</p>
            <p>🔔 <strong>Come back to this page</strong> — new images added to the dataset are matched automatically on every visit.</p>
          </div>
          <Link href="/" className="inline-block text-sm text-blue-600 underline">← Register another bike</Link>
        </div>
      </main>
    </div>
  );
}

function Cell({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-amber-50 border border-amber-200' : 'bg-zinc-50'}`}>
      <div className={`text-xs font-medium ${highlight ? 'text-amber-600' : 'text-zinc-500'}`}>{label}</div>
      <div className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-amber-900' : 'text-zinc-800'}`}>{children}</div>
    </div>
  );
}
