'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, Button, Input, Select, Modal, Badge, Spinner, EmptyState } from '@/components/ui/components';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { Users, Plus, Shield } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

function UsersContent() {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'admin' });

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User created');
        setShowModal(false);
        setForm({ email: '', password: '', fullName: '', role: 'admin' });
        fetchUsers();
      } else toast.error('Failed', data.error);
    } catch { toast.error('Failed to create user'); }
  };

  const roleColors: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
    super_admin: 'success', admin: 'info', editor: 'warning', viewer: 'default',
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Users</h1>
            <p className="text-gray-500 text-sm">Manage admin users</p>
          </div>
          <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Add User</Button>
        </div>

        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : users.length === 0 ? (
          <Card><EmptyState title="No users" icon={Users} /></Card>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <Card key={u.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold">
                    {u.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{u.full_name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={roleColors[u.role] || 'default'}>{u.role}</Badge>
                  {u.last_login_at && <span className="text-xs text-gray-400 hidden sm:block">Last login: {formatDateTime(u.last_login_at)}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal open={showModal} onClose={() => setShowModal(false)} title="Create User">
          <div className="space-y-4">
            <Input label="Full Name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <Input label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <Select label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              options={[{ value: 'super_admin', label: 'Super Admin' }, { value: 'admin', label: 'Admin' },
                { value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }]} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create User</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

export default function UsersPage() {
  return <ToastProvider><UsersContent /></ToastProvider>;
}
