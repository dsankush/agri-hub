'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, Badge, Spinner, Pagination, EmptyState } from '@/components/ui/components';
import { FileText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit?page=${page}&limit=30`).then(r => r.json()).then(d => {
      if (d.success) { setLogs(d.logs); setTotalPages(d.pagination.totalPages); }
    }).finally(() => setLoading(false));
  }, [page]);

  const actionColors: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'default'> = {
    PRODUCT_CREATE: 'success', PRODUCT_UPDATE: 'info', PRODUCT_DELETE: 'danger',
    LOGIN: 'success', LOGOUT: 'default', PRODUCT_BULK_UPLOAD: 'warning',
    USER_CREATE: 'success', COLUMN_CREATE: 'info',
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-gray-500 text-sm">Track all system activity</p>
        </div>

        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : logs.length === 0 ? (
          <Card><EmptyState title="No audit logs" icon={FileText} /></Card>
        ) : (
          <>
            <div className="space-y-2">
              {logs.map(log => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-700">{log.user_name || log.user_email || 'System'}</span>
                          <Badge variant={actionColors[log.action] || 'default'}>{log.action}</Badge>
                          {log.entity_type && <span className="text-xs text-gray-400">on {log.entity_type}</span>}
                        </div>
                        {log.entity_id && <p className="text-xs text-gray-400 mt-0.5">ID: {log.entity_id}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(log.created_at)}</span>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
