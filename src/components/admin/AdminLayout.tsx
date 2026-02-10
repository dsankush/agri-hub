'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, Upload, Columns3, Users, FileText, LogOut, Menu, X, Leaf, ChevronRight
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Bulk Upload', href: '/admin/upload', icon: Upload },
  { label: 'Columns', href: '/admin/columns', icon: Columns3 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Audit Logs', href: '/admin/audit', icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.success) setUser(d.data);
      else router.push('/admin/login');
    }).catch(() => router.push('/admin/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-base">AgriHub</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                )}>
                <item.icon className={cn('w-5 h-5', active ? 'text-emerald-600' : 'text-gray-400')} />
                {item.label}
                {active && <ChevronRight className="w-4 h-4 ml-auto text-emerald-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-sm">
              {user.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                ← View Public Site
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
