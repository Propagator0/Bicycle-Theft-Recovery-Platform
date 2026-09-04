'use client';
import { useState } from 'react';
import BikeVisual from './BikeVisual';
import type { BikeProfile } from '@/lib/vocabulary';

interface Props {
  profile: BikeProfile;
  onChange: (spots: { x: number; y: number; note: string }[]) => void;
}

const QUICK_NOTES = ['Scratch', 'Dent', 'Rust', 'Sticker', 'Paint chip', 'Repaired crack', 'Name written', 'Engraving'];

/** Click on the bike to drop a numbered marker, then label it. */
export default function DamageDiagram({ profile, onChange }: Props) {
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [note, setNote] = useState('');
  const spots = profile.damageSpots;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    setPending({ x, y });
    setNote('');
  };

  const commit = (text: string) => {
    if (!pending || !text.trim()) return;
    onChange([...spots, { ...pending, note: text.trim() }]);
    setPending(null);
    setNote('');
  };

  return (
    <div className="space-y-3">
      <div
        onClick={handleClick}
        className="relative bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-2xl cursor-crosshair hover:border-red-300 transition select-none"
        title="Click to mark a spot"
      >
        <BikeVisual profile={{ ...profile, damageSpots: pending ? [...spots, { ...pending, note: '' }] : spots }} compact />
        <div className="absolute top-2 left-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Click where the mark is</div>
      </div>

      {pending && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="text-xs font-semibold text-red-800">What's at spot #{spots.length + 1}?</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_NOTES.map((q) => (
              <button key={q} type="button" onClick={() => commit(q)} className="px-2.5 py-1 text-xs rounded-full bg-white border border-red-200 text-red-700 hover:bg-red-100">
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commit(note)}
              placeholder="or describe it: 'deep scratch through the logo'"
              className="flex-1 border border-red-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <button type="button" onClick={() => commit(note)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg">Add</button>
            <button type="button" onClick={() => setPending(null)} className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-500 text-xs rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {spots.length > 0 && (
        <ul className="space-y-1">
          {spots.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm bg-white border border-zinc-200 rounded-lg px-3 py-1.5">
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
              <span className="text-zinc-700 flex-1">{s.note}</span>
              <button type="button" onClick={() => onChange(spots.filter((_, idx) => idx !== i))} className="text-xs text-zinc-400 hover:text-red-500">remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
