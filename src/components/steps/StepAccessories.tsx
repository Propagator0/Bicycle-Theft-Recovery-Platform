'use client';
import { ACCESSORIES, ACCESSORY_CATEGORIES, LOCK_TYPES, type BikeProfile } from '@/lib/vocabulary';
import { Chip, NavButtons, inputCls } from '@/components/ui';

interface Props { profile: BikeProfile; onChange: (u: Partial<BikeProfile>) => void; onNext: () => void; onBack: () => void }

export default function StepAccessories({ profile, onChange, onNext, onBack }: Props) {
  const toggle = (id: string) => {
    const cur = profile.accessories;
    onChange({ accessories: cur.includes(id) ? cur.filter((a) => a !== id) : [...cur, id] });
  };
  const hasLock = profile.accessories.includes('lock_attached');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Accessories & add-ons</h2>
        <p className="text-zinc-500 mt-1">Select everything that was on your bike when it was taken. Watch the preview update.</p>
      </div>

      {ACCESSORY_CATEGORIES.map((cat) => {
        const items = ACCESSORIES.filter((a) => a.category === cat.id);
        if (!items.length) return null;
        return (
          <div key={cat.id} className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{cat.label}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((acc) => {
                const selected = profile.accessories.includes(acc.id);
                return (
                  <button key={acc.id} type="button" onClick={() => toggle(acc.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <span>{acc.icon}</span>{acc.label}{selected && <span className="ml-1">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {hasLock && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-yellow-900 flex items-center gap-2">🔒 Lock still attached — describe it</h3>
          <p className="text-xs text-yellow-700">A lock still on the bike is a huge visual identifier in photos.</p>
          <div className="flex flex-wrap gap-2">
            {LOCK_TYPES.map((lt) => <Chip key={lt.id} tone="yellow" active={profile.lockType === lt.id} onClick={() => onChange({ lockType: lt.id })}>{lt.label}</Chip>)}
          </div>
          <input type="text" className={`${inputCls} border-yellow-200 focus:ring-yellow-300`} placeholder="Lock colour / brand: e.g. Red Kryptonite U-lock, black Abus chain…" value={profile.lockColor} onChange={(e) => onChange({ lockColor: e.target.value })} />
        </div>
      )}

      <div className="text-sm text-zinc-500 text-center">
        {profile.accessories.length === 0 ? 'No accessories selected yet' : `${profile.accessories.length} accessor${profile.accessories.length === 1 ? 'y' : 'ies'} selected`}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
