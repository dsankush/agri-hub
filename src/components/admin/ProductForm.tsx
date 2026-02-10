'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, Button, Input, Textarea, Toggle } from '@/components/ui/components';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { ProductFormData } from '@/types';

const emptyForm: ProductFormData = {
  company_name: '', product_name: '', brand_name: '', product_description: '',
  product_type: '', sub_type: '', applied_seasons: [], suitable_crops: [],
  benefits: '', dosage: '', application_method: '', pack_sizes: [],
  price_range: '', available_states: [], organic_certified: false,
  iso_certified: false, govt_approved: false, product_image_url: '', source_url: '', notes: '',
};

function ProductFormContent({ isEdit }: { isEdit: boolean }) {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const toast = useToast();
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit && id) {
      fetch(`/api/products/${id}`).then(r => r.json()).then(d => {
        if (d.success) {
          setForm({ ...emptyForm, ...d.data });
        }
      }).finally(() => setFetching(false));
    }
  }, [isEdit, id]);

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const updateArrayField = (field: string, value: string) => {
    updateField(field, value.split(',').map((s: string) => s.trim()).filter(Boolean));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit ? `/api/products/${id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(isEdit ? 'Product updated' : 'Product created');
        router.push('/admin/products');
      } else {
        toast.error('Failed to save', data.error);
      }
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  };

  if (fetching) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Product' : 'New Product'}</h1>
            <p className="text-gray-500 text-sm">Fill in the product details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 text-base">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Company Name *" value={form.company_name} onChange={e => updateField('company_name', e.target.value)} required />
              <Input label="Product Name *" value={form.product_name} onChange={e => updateField('product_name', e.target.value)} required />
              <Input label="Brand Name" value={form.brand_name || ''} onChange={e => updateField('brand_name', e.target.value)} />
              <Input label="Product Type" value={form.product_type || ''} onChange={e => updateField('product_type', e.target.value)} placeholder="e.g., Insecticide, Fungicide" />
              <Input label="Sub Type" value={form.sub_type || ''} onChange={e => updateField('sub_type', e.target.value)} />
            </div>
            <Textarea label="Description" value={form.product_description || ''} onChange={e => updateField('product_description', e.target.value)} rows={3} />
          </Card>

          {/* Application */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 text-base">Application Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Applied Seasons (comma-separated)" value={(form.applied_seasons || []).join(', ')}
                onChange={e => updateArrayField('applied_seasons', e.target.value)} placeholder="Kharif, Rabi" />
              <Input label="Suitable Crops (comma-separated)" value={(form.suitable_crops || []).join(', ')}
                onChange={e => updateArrayField('suitable_crops', e.target.value)} placeholder="Wheat, Rice, Maize" />
              <Input label="Dosage" value={form.dosage || ''} onChange={e => updateField('dosage', e.target.value)} />
              <Input label="Application Method" value={form.application_method || ''} onChange={e => updateField('application_method', e.target.value)} />
              <Input label="Pack Sizes (comma-separated)" value={(form.pack_sizes || []).join(', ')}
                onChange={e => updateArrayField('pack_sizes', e.target.value)} placeholder="100 ml, 250 ml, 1 L" />
              <Input label="Price Range" value={form.price_range || ''} onChange={e => updateField('price_range', e.target.value)} placeholder="₹100-500" />
              <Input label="Available States (comma-separated)" value={(form.available_states || []).join(', ')}
                onChange={e => updateArrayField('available_states', e.target.value)} />
            </div>
            <Textarea label="Benefits" value={form.benefits || ''} onChange={e => updateField('benefits', e.target.value)} rows={2} />
          </Card>

          {/* Certifications */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 text-base">Certifications</h3>
            <div className="flex flex-wrap gap-6">
              <Toggle checked={form.organic_certified || false} onChange={v => updateField('organic_certified', v)} label="Organic Certified" />
              <Toggle checked={form.iso_certified || false} onChange={v => updateField('iso_certified', v)} label="ISO Certified" />
              <Toggle checked={form.govt_approved || false} onChange={v => updateField('govt_approved', v)} label="Govt Approved" />
            </div>
          </Card>

          {/* Media & Links */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 text-base">Media & Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Product Image URL" value={form.product_image_url || ''} onChange={e => updateField('product_image_url', e.target.value)} type="url" />
              <Input label="Source URL" value={form.source_url || ''} onChange={e => updateField('source_url', e.target.value)} type="url" />
            </div>
            <Textarea label="Notes" value={form.notes || ''} onChange={e => updateField('notes', e.target.value)} rows={2} />
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={loading}><Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'} Product</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export function NewProductPage() {
  return <ToastProvider><ProductFormContent isEdit={false} /></ToastProvider>;
}

export function EditProductPage() {
  return <ToastProvider><ProductFormContent isEdit={true} /></ToastProvider>;
}
