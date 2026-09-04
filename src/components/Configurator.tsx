'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { defaultProfile, type BikeProfile } from '@/lib/vocabulary';
import { calcUniqueness } from '@/lib/uniqueness';
import { StepIndicator, UniquenessBar } from '@/components/ui';
import BikeVisual from '@/components/BikeVisual';
import StepType from '@/components/steps/StepType';
import StepBrand from '@/components/steps/StepBrand';
import StepAppearance from '@/components/steps/StepAppearance';
import StepIdentifiers from '@/components/steps/StepIdentifiers';
import StepAccessories from '@/components/steps/StepAccessories';
import StepContact from '@/components/steps/StepContact';

const STEPS = [
  { label: 'Type', icon: '🚲' },
  { label: 'Brand', icon: '🏷️' },
  { label: 'Color', icon: '🎨' },
  { label: 'Details', icon: '🔑' },
  { label: 'Extras', icon: '🔧' },
  { label: 'Report', icon: '📋' },
];

type Preview = { image: { id: number; imageUrl: string; postKind: string | null }; score: number };

export default function Configurator({ datasetCount }: { datasetCount: number }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<BikeProfile>(defaultProfile);
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Preview[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const score = calcUniqueness(profile);
  const update = (u: Partial<BikeProfile>) => setProfile((p) => ({ ...p, ...u }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  // Debounced live preview against the dataset once we know at least type + colour
  useEffect(() => {
    if (!profile.bikeType || (!profile.frameColor && !profile.brand)) { setPreview([]); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch('/api/match', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(profile) })
        .then((r) => r.json())
        .then((d) => setPreview(d.matches || []))
        .catch(() => {});
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [profile]);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(profile) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save report');
      router.push(`/report/${data.publicId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 pb-20 pt-6">
      <div className="mb-6"><StepIndicator steps={STEPS} current={step} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 p-6 sm:p-8">
            {step === 0 && <StepType profile={profile} onChange={update} onNext={next} />}
            {step === 1 && <StepBrand profile={profile} onChange={update} onNext={next} onBack={back} />}
            {step === 2 && <StepAppearance profile={profile} onChange={update} onNext={next} onBack={back} />}
            {step === 3 && <StepIdentifiers profile={profile} onChange={update} onNext={next} onBack={back} />}
            {step === 4 && <StepAccessories profile={profile} onChange={update} onNext={next} onBack={back} />}
            {step === 5 && <StepContact profile={profile} onChange={update} onSubmit={submit} onBack={back} submitting={submitting} error={error} />}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-20">
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-4">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 text-center">Live Preview</div>
            <BikeVisual profile={profile} />
            {!profile.bikeType ? (
              <p className="text-xs text-zinc-400 text-center mt-1">Select a bike type to see your preview</p>
            ) : (
              <p className="text-xs text-zinc-500 text-center mt-1">
                {[profile.brand !== 'Unknown / Custom' ? profile.brand : '', profile.model, profile.year].filter(Boolean).join(' ') || 'Does this look right? Keep adding details.'}
              </p>
            )}
          </div>

          <div>
            <button type="button" onClick={() => setScoreExpanded((x) => !x)} className="w-full text-xs text-zinc-400 hover:text-zinc-600 mb-2 text-right">
              {scoreExpanded ? '▲ Hide breakdown' : '▼ Show breakdown'}
            </button>
            <UniquenessBar score={score} expanded={scoreExpanded} />
          </div>

          {preview.length > 0 && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">🔎 Early signals in the dataset</div>
              <div className="grid grid-cols-5 gap-1.5">
                {preview.map((m) => (
                  <div key={m.image.id} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100">
                    <img src={m.image.imageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center font-bold">{m.score}%</div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Finish the report to see full matches with reasons.</p>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4">
            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">💡 Recovery tips</h4>
            <ul className="space-y-1.5 text-xs text-blue-800">
              <li>• A serial number alone can recover a bike — even years later</li>
              <li>• Stickers and custom paint are hard to remove without a trace</li>
              <li>• A lock still attached is a distinctive visual marker in photos</li>
              <li>• The more unique details, the harder it is to deny it's yours</li>
            </ul>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs text-zinc-600 space-y-1">
            <p className="font-bold text-zinc-700">🔍 Matching against</p>
            <p><strong>{datasetCount.toLocaleString()} analysed images</strong> from:</p>
            <p className="italic text-zinc-500">"Hjóladót ofl tapað, fundið eða stolið"</p>
            <p className="text-zinc-400">Iceland's main lost/found/stolen bike Facebook group. Every image is tagged by a vision model using the same vocabulary as this form.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
