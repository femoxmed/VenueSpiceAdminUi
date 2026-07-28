import { cn } from '@/lib/utils';

const palette: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-rose-50 text-rose-700',
  assigned: 'bg-sky-50 text-sky-700',
  in_progress: 'bg-violet-50 text-violet-700',
  healthy: 'bg-emerald-50 text-emerald-700',
  connected: 'bg-sky-50 text-sky-700',
  super_admin: 'bg-indigo-50 text-indigo-700',
  admin: 'bg-cyan-50 text-cyan-700',
  technician: 'bg-orange-50 text-orange-700',
  user: 'bg-slate-100 text-slate-700',
  open: 'bg-rose-50 text-rose-700',
  closed: 'bg-emerald-50 text-emerald-700',
  processing: 'bg-sky-50 text-sky-700',
};

export function StatusBadge({ value }: { value: string | number | boolean | null | undefined }) {
  const normalized = String(value ?? 'unknown').toLowerCase();
  const label = String(value ?? 'unknown').replace(/_/g, ' ');

  return <span className={cn('badge', palette[normalized] ?? 'bg-slate-100 text-slate-700')}>{label}</span>;
}
