'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FlyerActions({ publicId, status }: { publicId: string; status: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const setStatus = async (s: string) => {
    await fetch(`/api/reports/${publicId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: s }) });
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button onClick={() => window.print()} className="px-4 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800">🖨️ Print flyer / save PDF</button>
      <button onClick={copyLink} className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 text-sm font-semibold rounded-xl hover:bg-zinc-50">{copied ? '✓ Copied' : '🔗 Copy link'}</button>
      {status !== 'recovered' ? (
        <button onClick={() => setStatus('recovered')} className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100">🎉 I got it back</button>
      ) : (
        <button onClick={() => setStatus('open')} className="px-4 py-2 bg-white border border-zinc-300 text-zinc-600 text-sm font-semibold rounded-xl hover:bg-zinc-50">Re-open case</button>
      )}
    </div>
  );
}
