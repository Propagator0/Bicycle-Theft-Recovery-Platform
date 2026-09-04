'use client';
import { useRef, useState } from 'react';
import type { BikeProfile } from '@/lib/vocabulary';
import { inputCls } from '@/components/ui';

interface Props { profile: BikeProfile; onChange: (u: Partial<BikeProfile>) => void; onSubmit: () => Promise<void>; onBack: () => void; submitting: boolean; error: string }

export default function StepContact({ profile, onChange, onSubmit, onBack, submitting, error }: Props) {
  const photoRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map((f) => URL.createObjectURL(f));
    const next = [...previews, ...urls];
    setPreviews(next);
    onChange({ photoCount: next.length });
  };
  const removePhoto = (i: number) => {
    const next = previews.filter((_, idx) => idx !== i);
    setPreviews(next);
    onChange({ photoCount: next.length });
  };

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.contactEmail);
  const isValid = profile.ownerName.trim() && emailOk && profile.theftDate;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Your details & theft info</h2>
        <p className="text-zinc-500 mt-1">So we can contact you if your bike is found. Contact details are never shown publicly.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Your name *</label>
        <input type="text" className={inputCls} placeholder="Full name" value={profile.ownerName} onChange={(e) => onChange({ ownerName: e.target.value })} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Email *</label>
          <input type="email" className={inputCls} placeholder="you@email.com" value={profile.contactEmail} onChange={(e) => onChange({ contactEmail: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Phone <span className="text-zinc-400 font-normal">(optional)</span></label>
          <input type="tel" className={inputCls} placeholder="+354 xxx xxxx" value={profile.contactPhone} onChange={(e) => onChange({ contactPhone: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Date of theft *</label>
        <input type="date" className={inputCls} max={new Date().toISOString().split('T')[0]} value={profile.theftDate} onChange={(e) => onChange({ theftDate: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Where was it stolen? <span className="text-zinc-400 font-normal">(optional but helpful)</span></label>
        <input type="text" className={inputCls} placeholder="e.g. Hlemmur, outside Bónus on Laugavegur, BSÍ, Kringlan bike racks…" value={profile.theftLocation} onChange={(e) => onChange({ theftLocation: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Anything else? <span className="text-zinc-400 font-normal">(optional)</span></label>
        <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Police case number, reward offered, seen it somewhere…" value={profile.additionalNotes} onChange={(e) => onChange({ additionalNotes: e.target.value })} />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-700">Photos of your bike <span className="text-zinc-400 font-normal">(optional but very helpful)</span></label>
        <input ref={photoRef} type="file" multiple accept="image/*" className="hidden" onChange={handlePhotos} />
        <button type="button" onClick={() => photoRef.current?.click()} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-sm font-semibold text-zinc-700 transition">📷 Add photos</button>
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {previews.map((url, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-zinc-200">
                <img src={url} alt="" className="w-full h-24 object-cover" />
                <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 border-2 border-zinc-200 text-zinc-600 rounded-xl py-3 font-semibold hover:bg-zinc-50 transition">← Back</button>
        <button type="button" onClick={onSubmit} disabled={!isValid || submitting} className="flex-1 bg-emerald-600 text-white rounded-xl py-3 font-bold text-base hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-100">
          {submitting ? 'Searching…' : '🔍 Register & search for matches →'}
        </button>
      </div>
    </div>
  );
}
