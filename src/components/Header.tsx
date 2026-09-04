import Link from 'next/link';

export default function Header({ caseCount, imageCount }: { caseCount?: number; imageCount?: number }) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg shadow-sm">🚲</div>
          <div>
            <h1 className="font-black text-zinc-900 text-base leading-tight">Hjólið Mitt</h1>
            <p className="text-xs text-zinc-400 leading-tight">Iceland Bicycle Recovery</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-xs">
          <Link href="/cases" className="px-3 py-1.5 rounded-full text-zinc-600 hover:bg-zinc-100 font-semibold">Cases</Link>
          <Link href="/admin" className="px-3 py-1.5 rounded-full text-zinc-600 hover:bg-zinc-100 font-semibold">Data ops</Link>
          {typeof imageCount === 'number' && (
            <div className="hidden sm:flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 font-semibold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {imageCount.toLocaleString()} images · {caseCount ?? 0} cases
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
