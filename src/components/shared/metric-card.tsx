import type { ReactNode } from "react";

type MetricCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
};

export function MetricCard({ title, value, helper, icon }: MetricCardProps) {
  return (
    <div className="card p-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-primary/15 p-3 text-secondary">{icon}</div>
      </div>
      <p className="text-sm text-slate-500">{helper}</p>
    </div>
  );
}
