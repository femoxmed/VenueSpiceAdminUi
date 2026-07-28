import { Server, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useQueueOverview } from "@/features/queues/hooks";

export function QueuesPage() {
  const { data } = useQueueOverview();
  const queue = data ?? { waiting: 0, active: 0, completed: 0, failed: 0, status: 'unknown', redis: 'unknown' };

  return (
    <section>
      <PageHeader title="Queues" description="Monitor Redis-backed jobs, retries, failed tasks, and worker health." />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Waiting" value={String(queue.waiting ?? 0)} helper="Queued jobs awaiting workers" icon={<Server size={22} />} />
        <MetricCard title="Active" value={String(queue.active ?? 0)} helper="Jobs currently being processed" icon={<Activity size={22} />} />
        <MetricCard title="Completed" value={String(queue.completed ?? 0)} helper="Successfully processed jobs" icon={<CheckCircle2 size={22} />} />
        <MetricCard title="Failed" value={String(queue.failed ?? 0)} helper="Jobs needing review or retry" icon={<AlertTriangle size={22} />} />
      </div>

      <div className="card mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Queue health</h3>
          <div className="flex gap-2">
            <StatusBadge value={queue.status ?? "healthy"} />
            <StatusBadge value={queue.redis ?? "connected"} />
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-500">
          This page is prepared for the NestJS queue overview endpoints. Connect it to your BullMQ monitoring routes
          and extend it with job lists, retry actions, and pause or resume controls.
        </p>
      </div>
    </section>
  );
}
