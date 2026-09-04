'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { confidenceLabel, type MatchReason } from '@/lib/matching';

export type MatchCard = {
  id: number; score: number; reasons: MatchReason[]; imageUrl: string; postUrl: string; postText: string;
  postedAt: string | null; postKind: string; confirmed: boolean; isDemo: boolean;
};

function ago(iso: string | null) {
  if (!iso) return 'date unknown';
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return 'today';
  if (d < 7) return `${Math.floor(d)} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} weeks ago`;
  return `${Math.floor(d / 30)} months ago`;
}

export default function MatchList({ publicId, matches }: { publicId: string; matches: MatchCard[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);

  const vote = async (imageId: number, verdict: 'mine' | 'not_mine', score: number) => {
    setBusy(imageId);
    await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ publicId, imageId, verdict, score }) });
    setBusy(null);
    router.refresh();
  };

  if (!matches.length) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center text-sm text-zinc-500">
        No images in the dataset score above the threshold yet. This page re-runs the search on every visit — check back after new posts are imported.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((m, idx) => {
        const c = confidenceLabel(m.score);
        return (
          <div key={m.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${m.confirmed ? 'border-emerald-500' : m.score >= 70 ? 'border-emerald-300' : m.score >= 50 ? 'border-blue-200' : 'border-zinc-200'}`}>
            {(idx === 0 && m.score >= 70) || m.confirmed ? (
              <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 text-center">{m.confirmed ? '✅ YOU CONFIRMED THIS ONE' : '🌟 BEST MATCH'}</div>
            ) : null}
            <div className="flex gap-4 p-4">
              <a href={m.postUrl || m.imageUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img src={m.imageUrl} alt="potential match" className="w-28 h-28 object-cover rounded-xl bg-zinc-100" />
              </a>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-zinc-100 rounded-full overflow-hidden"><div className="h-2 rounded-full" style={{ width: `${m.score}%`, backgroundColor: c.color }} /></div>
                  <span className="text-xs font-bold" style={{ color: c.color }}>{m.score}% — {c.label}</span>
                  <span className={`ml-auto text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${m.postKind === 'found' ? 'bg-emerald-100 text-emerald-700' : m.postKind === 'stolen' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-500'}`}>{m.postKind}</span>
                </div>
                {m.postText && <p className="text-sm text-zinc-700 line-clamp-2">{m.postText}</p>}
                <div className="flex flex-wrap gap-1">
                  {m.reasons.filter((r) => r.kind !== 'miss').slice(0, 6).map((r, i) => (
                    <span key={i} className={`px-2 py-0.5 text-xs rounded-full ${r.kind === 'hit' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{r.kind === 'hit' ? '✓' : '✗'} {r.label}</span>
                  ))}
                </div>
                <div className="text-xs text-zinc-400">📅 {ago(m.postedAt)}{m.isDemo ? ' · demo record' : ''}</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {!m.confirmed && (
                    <button disabled={busy === m.id} onClick={() => vote(m.id, 'mine', m.score)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition disabled:opacity-50">✅ This is my bike!</button>
                  )}
                  <button disabled={busy === m.id} onClick={() => vote(m.id, 'not_mine', m.score)} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 text-xs font-semibold rounded-lg hover:bg-zinc-200 transition disabled:opacity-50">❌ Not mine</button>
                  {m.postUrl && <a href={m.postUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-200 transition">View on FB →</a>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
