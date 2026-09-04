'use client';
import { useRef } from 'react';
import type { BikeProfile } from '@/lib/vocabulary';
import DamageDiagram from '@/components/DamageDiagram';
import { NavButtons, inputCls } from '@/components/ui';

interface Props { profile: BikeProfile; onChange: (u: Partial<BikeProfile>) => void; onNext: () => void; onBack: () => void }

export default function StepIdentifiers({ profile, onChange, onNext, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Unique identifiers</h2>
        <p className="text-zinc-500 mt-1">These are the details that actually recover bikes. The more, the better.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-xl">🔑</span>
          <div>
            <h3 className="font-bold text-amber-900">Serial Number</h3>
            <p className="text-xs text-amber-700 mt-0.5">Usually stamped under the bottom bracket (where the cranks meet the frame). Also check the head tube, rear dropout, or your purchase receipt / shop invoice.</p>
          </div>
        </div>
        <input type="text" className={`${inputCls} border-amber-300 focus:ring-amber-400 font-mono`} placeholder="e.g. WTU224FGXXX — leave blank if unknown" value={profile.serialNumber} onChange={(e) => onChange({ serialNumber: e.target.value.toUpperCase() })} />
        <div>
          <p className="text-xs text-amber-700 font-medium mb-2">Photo of the serial number stamp (if you have one):</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onChange({ serialPhotoName: e.target.files?.[0]?.name || '' })} />
          {profile.serialPhotoName ? (
            <div className="flex items-center gap-3 bg-white border border-amber-200 rounded-xl px-3 py-2">
              <span className="text-green-500 text-lg">✓</span>
              <span className="text-sm text-zinc-700 truncate">{profile.serialPhotoName}</span>
              <button type="button" onClick={() => onChange({ serialPhotoName: '' })} className="ml-auto text-xs text-red-400 hover:text-red-600">remove</button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-sm font-medium text-amber-800 transition">📷 Upload serial number photo</button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2"><span>🏷️</span> Stickers, decals & custom paint</label>
        <p className="text-xs text-zinc-500">Non-brand stickers, custom artwork, name tags, reflective tape, any markings you added.</p>
        <textarea className={`${inputCls} resize-none`} rows={3} placeholder="e.g. Large rainbow sticker on downtube, white star decal on top tube, 'Jón' written in black marker under BB..." value={profile.stickersDecals} onChange={(e) => onChange({ stickersDecals: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2"><span>🔧</span> Scratches, dents & damage</label>
        <textarea className={`${inputCls} resize-none`} rows={3} placeholder="e.g. Long scratch on right chainstay, small dent on downtube near headtube, rust on the seat clamp..." value={profile.damage} onChange={(e) => onChange({ damage: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2"><span>📍</span> Mark the spots on your bike</label>
        <DamageDiagram profile={profile} onChange={(spots) => onChange({ damageSpots: spots })} />
      </div>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
