'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, Button, Input, Select, Toggle, Modal, Badge, Spinner, EmptyState } from '@/components/ui/components';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { Plus, Columns3, Trash2, Edit } from 'lucide-react';
import type { ProductColumn } from '@/types';

function ColumnsContent() {
  const toast = useToast();
  const [columns, setColumns] = useState<ProductColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', label: '', type: 'text', visible: true, filterable: false, required: false, display_order: 999 });

  const fetchColumns = async () => {
    try {
      const res = await fetch('/api/admin/columns');
      const data = await res.json();
      if (data.success) setColumns(data.data);
    } catch { toast.error('Failed to fetch columns'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchColumns(); }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/admin/columns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Column created');
        setShowModal(false);
        setForm({ name: '', label: '', type: 'text', visible: true, filterable: false, required: false, display_order: 999 });
        fetchColumns();
      } else toast.error('Failed', data.error);
    } catch { toast.error('Failed to create column'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this column?')) return;
    try {
      const res = await fetch(`/api/admin/columns/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Column deleted'); fetchColumns(); }
      else toast.error('Failed to delete');
    } catch { toast.error('Failed'); }
  };

  const toggleVisibility = async (col: ProductColumn) => {
    try {
      await fetch(`/api/admin/columns/${col.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !col.visible }),
      });
      fetchColumns();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dynamic Columns</h1>
            <p className="text-gray-500 text-sm">Manage custom fields for products</p>
          </div>
          <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Add Column</Button>
        </div>

        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : columns.length === 0 ? (
          <Card><EmptyState title="No custom columns" description="Add dynamic columns to extend product data" icon={Columns3} /></Card>
        ) : (
          <div className="space-y-3">
            {columns.map(col => (
              <Card key={col.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{col.label}</p>
                    <p className="text-xs text-gray-400">{col.name} · {col.type}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {col.visible && <Badge variant="success">Visible</Badge>}
                    {col.filterable && <Badge variant="info">Filterable</Badge>}
                    {col.required && <Badge variant="warning">Required</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle checked={col.visible} onChange={() => toggleVisibility(col)} />
                  <button onClick={() => handleDelete(col.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Custom Column">
          <div className="space-y-4">
            <Input label="Column Name (snake_case)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="custom_field" />
            <Input label="Display Label" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Custom Field" />
            <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              options={[{ value: 'text', label: 'Text' }, { value: 'number', label: 'Number' }, { value: 'boolean', label: 'Boolean' },
                { value: 'array', label: 'Multi-select' }, { value: 'date', label: 'Date' }, { value: 'url', label: 'URL' }]} />
            <div className="flex gap-6">
              <Toggle checked={form.visible} onChange={v => setForm({ ...form, visible: v })} label="Visible" />
              <Toggle checked={form.filterable} onChange={v => setForm({ ...form, filterable: v })} label="Filterable" />
              <Toggle checked={form.required} onChange={v => setForm({ ...form, required: v })} label="Required" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Column</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

export default function ColumnsPage() {
  return <ToastProvider><ColumnsContent /></ToastProvider>;
}
