'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Filter, X, Leaf, Package, LayoutGrid, List } from 'lucide-react';
import { cn, truncate } from '@/lib/utils';
import type { Product } from '@/types';

interface FiltersData { companies: string[]; productTypes: string[]; crops: string[]; seasons: string[]; states: string[]; }

function FilterSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 bg-white focus:border-emerald-400 outline-none">
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CertBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
        active ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-200 text-gray-500')}>
      {label}
    </button>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-600 font-medium mb-1">{p.company_name}</p>
            <h3 className="font-semibold text-gray-800 text-sm leading-snug">{p.product_name}</h3>
          </div>
          {p.product_image_url ? (
            <img src={p.product_image_url} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-emerald-300" />
            </div>
          )}
        </div>
        {p.product_description && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{truncate(p.product_description, 100)}</p>}
        {p.product_type && <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-medium mb-3">{p.product_type}</span>}
        <div className="space-y-1.5 text-xs text-gray-500">
          {p.suitable_crops && p.suitable_crops.length > 0 && <p><span className="text-gray-400">Crops:</span> {p.suitable_crops.join(', ')}</p>}
          {p.dosage && <p><span className="text-gray-400">Dosage:</span> {p.dosage}</p>}
          {p.application_method && <p><span className="text-gray-400">Method:</span> {p.application_method}</p>}
        </div>
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {p.organic_certified && <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Organic</span>}
          {p.iso_certified && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium">ISO</span>}
          {p.govt_approved && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Govt</span>}
        </div>
      </div>
      {(p.price_range || p.source_url) && (
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
          {p.price_range && <span className="text-xs font-semibold text-gray-700">{p.price_range}</span>}
          {p.source_url && <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Learn more →</a>}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FiltersData>({ companies: [], productTypes: [], crops: [], seasons: [], states: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showFilters, setShowFilters] = useState(false);
  const [af, setAf] = useState<Record<string, string>>({});

  useEffect(() => { fetch('/api/products/filters').then(r => r.json()).then(d => { if (d.success) setFilters(d.data); }).catch(() => {}); }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (search) params.set('search', search);
    Object.entries(af).forEach(([k, v]) => { if (v) params.set(k, v); });
    try { const r = await fetch(`/api/products?${params}`); const d = await r.json();
      if (d.success) { setProducts(d.data); setTotalPages(d.pagination.totalPages); setTotal(d.pagination.total); }
    } catch {} finally { setLoading(false); }
  }, [page, search, af]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [search, af]);

  const sf = (key: string, v: string) => setAf(p => { const n = { ...p }; if (v) n[key] = v; else delete n[key]; return n; });
  const hasAf = Object.keys(af).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center"><Leaf className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-gray-800 text-lg">AgriHub</span>
          </Link>
          <Link href="/admin/login" className="text-sm text-gray-500 hover:text-emerald-600 font-medium">Admin →</Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight max-w-lg">Agricultural Product Knowledge Hub</h1>
          <p className="text-emerald-100 mt-3 text-base max-w-lg">Discover crop protection solutions, fertilizers, and agri-inputs from top companies across India.</p>
          <div className="mt-8 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search products, companies, crops..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-gray-800 placeholder-gray-400 shadow-xl focus:outline-none text-sm" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border',
                showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-600')}>
              <Filter className="w-4 h-4" /> Filters
              {hasAf && <span className="w-5 h-5 bg-emerald-600 text-white rounded-full text-xs flex items-center justify-center">{Object.keys(af).length}</span>}
            </button>
            {hasAf && <button onClick={() => setAf({})} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Clear</button>}
            <span className="text-sm text-gray-400">{total} products</span>
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            <button onClick={() => setViewMode('card')} className={cn('p-1.5 rounded-md', viewMode === 'card' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400')}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('table')} className={cn('p-1.5 rounded-md', viewMode === 'table' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400')}><List className="w-4 h-4" /></button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <FilterSelect label="Company" options={filters.companies} value={af.company_name || ''} onChange={v => sf('company_name', v)} />
              <FilterSelect label="Type" options={filters.productTypes} value={af.product_type || ''} onChange={v => sf('product_type', v)} />
              <FilterSelect label="Crop" options={filters.crops} value={af.suitable_crops || ''} onChange={v => sf('suitable_crops', v)} />
              <FilterSelect label="Season" options={filters.seasons} value={af.applied_seasons || ''} onChange={v => sf('applied_seasons', v)} />
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Certifications</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  <CertBtn label="Organic" active={af.organic_certified === 'true'} onClick={() => sf('organic_certified', af.organic_certified === 'true' ? '' : 'true')} />
                  <CertBtn label="ISO" active={af.iso_certified === 'true'} onClick={() => sf('iso_certified', af.iso_certified === 'true' ? '' : 'true')} />
                  <CertBtn label="Govt" active={af.govt_approved === 'true'} onClick={() => sf('govt_approved', af.govt_approved === 'true' ? '' : 'true')} />
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No products found</h3>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Company</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Crops</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Dosage</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{p.product_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{p.company_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 hidden lg:table-cell">{p.product_type}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 hidden lg:table-cell">{p.suitable_crops?.join(', ')}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 hidden md:table-cell">{p.dosage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 rounded-lg border bg-white text-sm font-medium text-gray-600 disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500 px-3">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 rounded-lg border bg-white text-sm font-medium text-gray-600 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-sm text-gray-400">AgriHub — Agricultural Product Knowledge Hub &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
