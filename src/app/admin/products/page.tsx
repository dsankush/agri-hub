'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, Button, Input, Badge, Spinner, Pagination, EmptyState, Modal } from '@/components/ui/components';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { Package, Plus, Search, Edit, Trash2, ExternalLink, Eye } from 'lucide-react';
import { formatDate, truncate } from '@/lib/utils';
import type { Product } from '@/types';

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch { toast.error('Failed to fetch products'); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Product deleted');
        fetchProducts();
      } else toast.error('Delete failed');
    } catch { toast.error('Delete failed'); }
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Products</h1>
            <p className="text-gray-500 text-sm">{total} total products</p>
          </div>
          <Link href="/admin/products/new">
            <Button><Plus className="w-4 h-4" /> Add Product</Button>
          </Link>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search products..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm" />
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : products.length === 0 ? (
          <Card>
            <EmptyState title="No products found" description="Add your first product or adjust your search" icon={Package}
              action={<Link href="/admin/products/new"><Button>Add Product</Button></Link>} />
          </Card>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Company</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Certifications</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.product_image_url ? (
                            <img src={p.product_image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                          ) : (
                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-emerald-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{p.product_name}</p>
                            <p className="text-xs text-gray-400">{p.brand_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{p.company_name}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {p.product_type && <Badge>{truncate(p.product_type, 20)}</Badge>}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex gap-1">
                          {p.organic_certified && <Badge variant="success">Organic</Badge>}
                          {p.iso_certified && <Badge variant="info">ISO</Badge>}
                          {p.govt_approved && <Badge variant="warning">Govt</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400 hidden md:table-cell">{formatDate(p.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/products/${p.id}`}>
                            <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                          </Link>
                          <button onClick={() => setDeleteId(p.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product" size="sm">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}

export default function ProductsPage() {
  return <ToastProvider><ProductsContent /></ToastProvider>;
}
