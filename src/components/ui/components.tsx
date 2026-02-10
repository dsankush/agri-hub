'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes } from 'react';

// Button
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'text-gray-600 hover:bg-gray-100',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    };
    const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

    return (
      <button ref={ref} disabled={disabled || loading}
        className={cn('inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
        {...props}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input ref={ref}
        className={cn('w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
          error ? 'border-red-300' : 'border-gray-300', className)}
        {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// Textarea
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea ref={ref}
        className={cn('w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[80px]',
          error ? 'border-red-300' : 'border-gray-300', className)}
        {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

// Select
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select ref={ref}
        className={cn('w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white',
          error ? 'border-red-300' : 'border-gray-300', className)}
        {...props}>
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

// Badge
export function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'; className?: string;
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>{children}</span>;
}

// Card
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)} {...props}>{children}</div>;
}

// Spinner
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('w-6 h-6 animate-spin text-emerald-600', className)} />;
}

// Empty State
export function EmptyState({ title, description, icon: Icon, action }: {
  title: string; description?: string; icon?: any; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && <Icon className="w-12 h-12 text-gray-300 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Modal
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><span className="text-xl">&times;</span></button>
          </div>
        )}
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// Pagination
export function Pagination({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const p = page <= 3 ? i + 1 : page + i - 2;
        if (p < 1 || p > totalPages) return null;
        return (
          <Button key={p} variant={p === page ? 'primary' : 'outline'} size="sm" onClick={() => onPageChange(p)}>
            {p}
          </Button>
        );
      })}
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
    </div>
  );
}

// Toggle
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button type="button" role="switch" aria-checked={checked}
        className={cn('relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-emerald-600' : 'bg-gray-200')}
        onClick={() => onChange(!checked)}>
        <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5',
          checked ? 'translate-x-5 ml-0.5' : 'translate-x-0.5')} />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
