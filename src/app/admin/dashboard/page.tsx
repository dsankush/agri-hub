'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, Badge, Spinner } from '@/components/ui/components';
import { Package, Building2, Upload, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { DashboardStats } from '@/types';

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: any; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => {
      if (d.success) setStats(d.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your agricultural product platform</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Products" value={stats.totalProducts} icon={Package} color="emerald" />
              <StatCard title="Active Products" value={stats.activeProducts} icon={TrendingUp} color="blue" />
              <StatCard title="Companies" value={stats.totalCompanies} icon={Building2} color="amber" />
              <StatCard title="Bulk Uploads" value={stats.totalUploads} icon={Upload} color="violet" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Products by Type */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-800">Products by Type</h3>
                </div>
                <div className="space-y-3">
                  {stats.productsByType.map((item: any) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.type}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${Math.min((parseInt(item.count) / stats.totalProducts) * 100, 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 8).map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{log.user_name || log.user_email || 'System'}</span>
                          {' '}<Badge>{log.action}</Badge>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {stats.recentActivity.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
                  )}
                </div>
              </Card>
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Failed to load dashboard data</p>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
