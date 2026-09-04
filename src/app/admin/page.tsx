import Header from '@/components/Header';
import AdminPanel from '@/components/AdminPanel';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Header />
      <main className="max-w-5xl mx-auto px-4 pb-20 pt-8">
        <h2 className="text-2xl font-bold text-zinc-900">Data ops</h2>
        <p className="text-zinc-500 text-sm mt-1 mb-6">
          The pipeline: <strong>1)</strong> harvest shop catalogs → <strong>2)</strong> import catalog here → <strong>3)</strong> export Apify image jobs → <strong>4)</strong> import Apify results → <strong>5)</strong> import the analysed FB-group dataset.
        </p>
        <AdminPanel />
      </main>
    </div>
  );
}
