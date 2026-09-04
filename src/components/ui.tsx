'use client';
import React from 'react';
import type { ScoreBreakdown } from '@/lib/uniqueness';

export function StepIndicator({ steps, current }: { steps: { label: string; icon: string }[]; current: number }) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max mx-auto px-2">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${done ? 'bg-emerald-500 border-emerald-500 text-white' : active ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-200' : 'bg-white border-zinc-300 text-zinc-400'}`}>
                  {done ? '✓' : step.icon}
                </div>
                <span className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? 'text-blue-700' : done ? 'text-emerald-600' : 'text-zinc-400'}`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 mx-1 mt-[-14px] transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-zinc-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function UniquenessBar({ score, expanded }: { score: ScoreBreakdown; expanded?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Uniqueness Score</span>
          <div className="text-sm font-bold mt-0.5" style={{ color: score.color }}>{score.label}</div>
        </div>
        <div className="text-3xl font-black tabular-nums" style={{ color: score.color }}>
          {score.percentage}<span className="text-lg font-semibold">%</span>
        </div>
      </div>
      <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
        <div className="h-3 rounded-full transition-all duration-700 ease-out" style={{ width: `${score.percentage}%`, backgroundColor: score.color }} />
      </div>
      <div className="text-xs text-zinc-400 mt-1.5 text-right">{score.total} / {score.max} points</div>
      {expanded && (
        <div className="mt-3 space-y-1 border-t border-zinc-100 pt-3">
          {score.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={item.earned ? 'text-emerald-500' : 'text-zinc-300'}>{item.earned ? '✓' : '○'}</span>
              <span className={item.earned ? 'text-zinc-700 font-medium' : 'text-zinc-400'}>{item.label}</span>
              <span className={`ml-auto font-mono ${item.earned ? 'text-emerald-600' : 'text-zinc-300'}`}>+{item.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Chip({ active, onClick, children, tone = 'blue' }: { active: boolean; onClick: () => void; children: React.ReactNode; tone?: 'blue' | 'yellow' }) {
  const on = tone === 'blue' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-yellow-500 border-yellow-500 text-white';
  const off = tone === 'blue' ? 'bg-white border-zinc-200 text-zinc-600 hover:border-blue-300' : 'bg-white border-yellow-200 text-yellow-800 hover:border-yellow-400';
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${active ? on : off}`}>
      {children}
    </button>
  );
}

export function NavButtons({ onBack, onNext, nextLabel = 'Continue →', disabled }: { onBack?: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean }) {
  return (
    <div className="flex gap-3">
      {onBack && <button type="button" onClick={onBack} className="flex-1 border-2 border-zinc-200 text-zinc-600 rounded-xl py-3 font-semibold hover:bg-zinc-50 transition">← Back</button>}
      <button type="button" onClick={onNext} disabled={disabled} className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
        {nextLabel}
      </button>
    </div>
  );
}

export const inputCls = 'w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white';
