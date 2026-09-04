'use client';
import { BIKE_TYPES, type BikeProfile } from '@/lib/vocabulary';

interface Props { profile: BikeProfile; onChange: (u: Partial<BikeProfile>) => void; onNext: () => void }

export default function StepType({ profile, onChange, onNext }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">What kind of bike was it?</h2>
        <p className="text-zinc-500 mt-1">Start broad — we'll get into the details next.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {BIKE_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => { onChange({ bikeType: type.id }); onNext(); }}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${profile.bikeType === type.id ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100' : 'border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'}`}
          >
            <span className="text-3xl">{type.icon}</span>
            <div>
              <div className="text-sm font-bold text-zinc-900 text-center">{type.label}</div>
              <div className="text-[11px] text-zinc-400 text-center">{type.is}</div>
              <div className="text-xs text-zinc-500 text-center mt-0.5 leading-tight">{type.desc}</div>
            </div>
            {profile.bikeType === type.id && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><span className="text-white text-xs">✓</span></div>
            )}
          </button>
        ))}
      </div>
      {profile.bikeType && (
        <button type="button" onClick={onNext} className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-base hover:bg-blue-700 transition">Continue →</button>
      )}
    </div>
  );
}
