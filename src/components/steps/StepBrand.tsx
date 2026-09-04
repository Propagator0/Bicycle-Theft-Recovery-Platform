'use client';
import { useEffect, useState } from 'react';
import { FALLBACK_BRANDS, FRAME_SIZES, type BikeProfile } from '@/lib/vocabulary';
import { NavButtons, inputCls } from '@/components/ui';

interface Props { profile: BikeProfile; onChange: (u: Partial<BikeProfile>) => void; onNext: () => void; onBack: () => void }

type CatalogModel = { model: string; bikeType: string; year: string; colors: { name: string; id: string; imageUrl: string }[]; sizes: string[] };

const YEARS = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i));

export default function StepBrand({ profile, onChange, onNext, onBack }: Props) {
  const [search, setSearch] = useState(profile.brand || '');
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // brand suggestions: catalog first, static fallback merged in
  useEffect(() => {
    const q = search.trim();
    const ctrl = new AbortController();
    fetch(`/api/catalog?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        const fromDb: string[] = (d.brands || []).map((b: { brand: string }) => b.brand);
        const fallback = FALLBACK_BRANDS.filter((b) => b.toLowerCase().includes(q.toLowerCase()));
        setBrands([...new Set([...fromDb, ...fallback])].slice(0, 14));
      })
      .catch(() => setBrands(FALLBACK_BRANDS.filter((b) => b.toLowerCase().includes(q.toLowerCase())).slice(0, 14)));
    return () => ctrl.abort();
  }, [search]);

  // models for chosen brand
  useEffect(() => {
    if (!profile.brand || profile.brand === 'Unknown / Custom') { setModels([]); return; }
    setLoadingModels(true);
    fetch(`/api/catalog?brand=${encodeURIComponent(profile.brand)}`)
      .then((r) => r.json())
      .then((d) => setModels(d.models || []))
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, [profile.brand]);

  const selectBrand = (b: string) => { onChange({ brand: b, model: '' }); setSearch(b); setOpen(false); };
  const modelMatches = models.filter((m) => !profile.model || m.model.toLowerCase().includes(profile.model.toLowerCase()));
  const chosen = models.find((m) => m.model.toLowerCase() === profile.model.toLowerCase());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Brand, model & specs</h2>
        <p className="text-zinc-500 mt-1">As much as you know — some is always better than none.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Brand *</label>
        <div className="relative">
          <input
            type="text"
            className={inputCls}
            placeholder="Start typing — Trek, Giant, Scott…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); onChange({ brand: e.target.value }); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
          />
          {open && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
              <div className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100" onMouseDown={() => selectBrand('Unknown / Custom')}>
                ❓ Unknown / Custom (no brand or can't remember)
              </div>
              {brands.map((b) => (
                <div key={b} className="px-4 py-2.5 text-sm text-zinc-800 hover:bg-blue-50 cursor-pointer font-medium" onMouseDown={() => selectBrand(b)}>{b}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Model <span className="text-zinc-400 font-normal">(optional)</span></label>
        <input type="text" className={inputCls} placeholder="e.g. FX 3 Disc, Marlin 7, Sirrus…" value={profile.model} onChange={(e) => onChange({ model: e.target.value })} />
        {loadingModels && <p className="text-xs text-zinc-400">Loading models from Reykjavík shop catalog…</p>}
        {!loadingModels && models.length > 0 && !chosen && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {modelMatches.slice(0, 12).map((m) => (
              <button key={m.model} type="button" onClick={() => onChange({ model: m.model, year: m.year || profile.year, bikeType: profile.bikeType || m.bikeType })} className="px-2.5 py-1 text-xs rounded-full bg-zinc-100 hover:bg-blue-100 text-zinc-700 border border-zinc-200">
                {m.model}{m.year ? <span className="text-zinc-400"> ’{m.year.slice(-2)}</span> : null}
              </button>
            ))}
          </div>
        )}
        {chosen && chosen.colors.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
            <div className="text-xs font-semibold text-blue-800">This model was sold in these colours — pick yours:</div>
            <div className="flex flex-wrap gap-2">
              {chosen.colors.map((c) => (
                <button key={c.name} type="button" onClick={() => onChange({ frameColor: c.id || profile.frameColor, secondaryColor: c.name })} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs bg-white ${profile.secondaryColor === c.name ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-200 hover:border-blue-400'}`}>
                  {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-8 h-8 object-contain rounded" /> : <span className="w-3 h-3 rounded-full border border-zinc-300 bg-zinc-200" />}
                  {c.name}
                </button>
              ))}
            </div>
            {chosen.sizes.length > 0 && <div className="text-[11px] text-blue-700">Sizes sold: {chosen.sizes.join(', ')}</div>}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Approximate year <span className="text-zinc-400 font-normal">(optional)</span></label>
        <select className={`${inputCls} appearance-none`} value={profile.year} onChange={(e) => onChange({ year: e.target.value })}>
          <option value="">Not sure</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          <option value="older">Older than {new Date().getFullYear() - 20}</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Frame size <span className="text-zinc-400 font-normal">(optional)</span></label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {FRAME_SIZES.map((s) => (
            <button key={s.id} type="button" onClick={() => onChange({ frameSize: s.id })} className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${profile.frameSize === s.id ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-blue-300'}`}>
              {s.label.split(' / ')[0]}
            </button>
          ))}
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} disabled={!(profile.brand || search)} />
    </div>
  );
}
