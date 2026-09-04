'use client';
import { FRAME_COLORS, HANDLEBAR_TYPES, SADDLE_COLORS, GRIP_COLORS, type BikeProfile } from '@/lib/vocabulary';
import { Chip, NavButtons, inputCls } from '@/components/ui';

interface Props { profile: BikeProfile; onChange: (u: Partial<BikeProfile>) => void; onNext: () => void; onBack: () => void }

export default function StepAppearance({ profile, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Color & appearance</h2>
        <p className="text-zinc-500 mt-1">Colors and details that make your bike visually distinct.</p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-700">Primary frame color *</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {FRAME_COLORS.map((c) => (
            <button key={c.id} type="button" onClick={() => onChange({ frameColor: c.id, frameColorHex: c.hex === 'gradient' ? profile.frameColorHex || '#818cf8' : c.hex })}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${profile.frameColor === c.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 bg-white'}`}>
              <div className="w-5 h-5 rounded-full flex-shrink-0 border border-zinc-200" style={{ background: c.hex === 'gradient' ? 'linear-gradient(135deg, #f472b6, #818cf8, #34d399, #fb923c)' : c.hex }} />
              <span className="leading-tight text-left">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {profile.frameColor === 'custom' && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Pick the closest custom colour</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={profile.frameColorHex.startsWith('#') ? profile.frameColorHex : '#818cf8'} className="h-11 w-16 rounded-lg border border-zinc-300 cursor-pointer" onChange={(e) => onChange({ frameColorHex: e.target.value })} />
            <span className="text-xs text-zinc-500 font-mono">{profile.frameColorHex}</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Secondary / accent colour or colourway name <span className="text-zinc-400 font-normal">(if any)</span></label>
        <input type="text" className={inputCls} placeholder="e.g. White logos, red decals, orange fork, 'Lithium Grey'…" value={profile.secondaryColor} onChange={(e) => onChange({ secondaryColor: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Handlebar type <span className="text-zinc-400 font-normal">(optional)</span></label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HANDLEBAR_TYPES.map((h) => (
            <button key={h.id} type="button" onClick={() => onChange({ handlebarType: h.id })} className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all text-left ${profile.handlebarType === h.id ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-blue-300'}`}>
              {h.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Saddle colour <span className="text-zinc-400 font-normal">(optional)</span></label>
        <div className="flex flex-wrap gap-2">{SADDLE_COLORS.map((c) => <Chip key={c} active={profile.saddleColor === c} onClick={() => onChange({ saddleColor: c })}>{c}</Chip>)}</div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Grip / bar tape colour <span className="text-zinc-400 font-normal">(optional)</span></label>
        <div className="flex flex-wrap gap-2">{GRIP_COLORS.map((c) => <Chip key={c} active={profile.gripColor === c} onClick={() => onChange({ gripColor: c })}>{c}</Chip>)}</div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} disabled={!profile.frameColor} />
    </div>
  );
}
