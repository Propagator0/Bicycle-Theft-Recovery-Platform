'use client';
import { useCallback, useEffect, useState } from 'react';

type CatalogStats = { rows: number; brands: number; models: number; withImage: number };
type DatasetStats = { total: number; demo: number; found: number; stolen: number; analyzed: number; newest: string | null };
type RecentImage = { id: number; imageUrl: string; postKind: string | null; analysis: Record<string, unknown>; isDemo: boolean | null };

function readFileAsText(f: File) {
  return new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsText(f); });
}

function csvToObjects(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const parse = (line: string) => {
    const out: string[] = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (ch === ',' && !q) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const head = parse(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((l) => Object.fromEntries(parse(l).map((v, i) => [head[i], v.trim()])));
}

export default function AdminPanel() {
  const [catalog, setCatalog] = useState<CatalogStats | null>(null);
  const [dataset, setDataset] = useState<DatasetStats | null>(null);
  const [recent, setRecent] = useState<RecentImage[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);

  const say = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString()} — ${s}`, ...l].slice(0, 30));

  const refresh = useCallback(async () => {
    const [c, d] = await Promise.all([
      fetch('/api/catalog?stats=1').then((r) => r.json()),
      fetch('/api/dataset?recent=1').then((r) => r.json()),
    ]);
    setCatalog(c);
    setDataset(d.stats);
    setRecent(d.recent || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const post = async (url: string, body: unknown, label: string, method = 'POST') => {
    setBusy(true);
    try {
      const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      const j = await r.json();
      say(`${label}: ${r.ok ? JSON.stringify(j) : 'ERROR ' + (j.error || r.status)}`);
      await refresh();
    } catch (e) {
      say(`${label}: failed — ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const parsePayload = async (file?: File | null): Promise<unknown[]> => {
    const text = file ? await readFileAsText(file) : paste;
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Nothing to import');
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const j = JSON.parse(trimmed);
      return Array.isArray(j) ? j : Array.isArray(j.items) ? j.items : [j];
    }
    // NDJSON?
    if (trimmed.split('\n').every((l) => l.trim().startsWith('{'))) return trimmed.split('\n').map((l) => JSON.parse(l));
    return csvToObjects(trimmed);
  };

  const importTo = async (url: string, label: string, file?: File | null) => {
    try {
      const items = await parsePayload(file);
      say(`${label}: parsed ${items.length} rows, uploading…`);
      await post(url, items, label);
    } catch (e) {
      say(`${label}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Catalog rows" value={catalog?.rows} sub={`${catalog?.brands ?? 0} brands · ${catalog?.models ?? 0} models`} />
        <Stat label="Catalog w/ image" value={catalog?.withImage} sub="filled by Apify job" />
        <Stat label="FB images" value={dataset?.total} sub={`${dataset?.found ?? 0} found · ${dataset?.stolen ?? 0} stolen`} />
        <Stat label="Analysed" value={dataset?.analyzed} sub={`${dataset?.demo ?? 0} demo rows`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="1 · Bike catalog (brand → model → colour → sizes)" desc="Paste or upload the JSON/CSV produced by scripts/harvest-catalog.mjs (or any Apify e-commerce scraper). Columns: brand, model, year, colorName, sizes, shop, sourceUrl, imageUrl, priceIsk.">
          <FileButton label="Upload catalog file" onFile={(f) => importTo('/api/catalog', 'Catalog import', f)} />
          <button disabled={busy} onClick={() => importTo('/api/catalog', 'Catalog import (paste)')} className="btn-secondary">Import pasted text</button>
          <button disabled={busy} onClick={() => post('/api/catalog', undefined, 'Catalog cleared', 'DELETE')} className="btn-danger">Clear catalog</button>
        </Card>

        <Card title="2 · Apify reference-image jobs" desc="Download the clean query list generated from the catalog, run it through an image-search actor on Apify, then upload the actor's dataset here — image URLs are written back to the matching catalog rows.">
          <a href="/api/apify/jobs?format=json" download="apify-input.json" className="btn-secondary">⬇ Apify INPUT (json)</a>
          <a href="/api/apify/jobs?format=csv" className="btn-secondary">⬇ Jobs CSV</a>
          <a href="/api/apify/jobs?format=queries&onlyMissing=1" target="_blank" className="btn-secondary">⬇ Queries (missing only)</a>
          <FileButton label="Upload Apify image results" onFile={(f) => importTo('/api/apify/jobs', 'Image write-back', f)} />
        </Card>

        <Card title="3 · FB-group dataset (scrape + vision analysis)" desc="Upload the merged output of the FB scrape and scripts/analyze-images.mjs. Each row: externalId, imageUrl, postUrl, postText, postedAt, postKind, analysis{…}. Raw Apify facebook-groups-scraper items also work (analysis will be empty until you run the analyser).">
          <FileButton label="Upload dataset file" onFile={(f) => importTo('/api/dataset', 'Dataset import', f)} />
          <button disabled={busy} onClick={() => importTo('/api/dataset', 'Dataset import (paste)')} className="btn-secondary">Import pasted text</button>
          <button disabled={busy} onClick={() => post('/api/dataset?demo=1', undefined, 'Demo rows removed', 'DELETE')} className="btn-danger">Remove demo rows</button>
        </Card>

        <Card title="Paste area" desc="JSON array, NDJSON, or CSV with a header row. Used by the 'Import pasted text' buttons.">
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={8} placeholder='[{"brand":"Trek","model":"FX 3 Disc","year":"2024","colorName":"Lithium Grey","sizes":["S","M","L"],"shop":"Örninn"}]' className="w-full font-mono text-xs border border-zinc-300 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </Card>
      </div>

      <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-4 font-mono text-xs min-h-[80px]">
        {log.length === 0 ? <span className="text-zinc-500">// activity log</span> : log.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      {recent.length > 0 && (
        <div>
          <h3 className="font-bold text-zinc-800 mb-2 text-sm">Most recent dataset images</h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {recent.map((r) => (
              <div key={r.id} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200" title={JSON.stringify(r.analysis, null, 1)}>
                <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 truncate">{String(r.analysis?.brand || '')} {String(r.analysis?.frameColor || '')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .btn-secondary{display:inline-flex;align-items:center;padding:.5rem .9rem;border-radius:.75rem;background:#fff;border:1px solid #d4d4d8;font-size:.8rem;font-weight:600;color:#3f3f46;cursor:pointer}
        .btn-secondary:hover{background:#f4f4f5}
        .btn-danger{display:inline-flex;align-items:center;padding:.5rem .9rem;border-radius:.75rem;background:#fef2f2;border:1px solid #fecaca;font-size:.8rem;font-weight:600;color:#b91c1c;cursor:pointer}
        .btn-primary{display:inline-flex;align-items:center;padding:.5rem .9rem;border-radius:.75rem;background:#2563eb;border:1px solid #2563eb;font-size:.8rem;font-weight:600;color:#fff;cursor:pointer}
        button:disabled{opacity:.5;cursor:not-allowed}
      `}</style>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value?: number; sub?: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4">
      <div className="text-xs text-zinc-500 font-medium">{label}</div>
      <div className="text-2xl font-black text-zinc-900">{value ?? '—'}</div>
      {sub && <div className="text-[11px] text-zinc-400">{sub}</div>}
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-zinc-900 text-sm">{title}</h3>
      <p className="text-xs text-zinc-500">{desc}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FileButton({ label, onFile }: { label: string; onFile: (f: File) => void }) {
  return (
    <label className="btn-primary">
      📁 {label}
      <input type="file" accept=".json,.csv,.ndjson,.txt,application/json,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </label>
  );
}
