import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useJobs } from "@/features/jobs/hooks";
import type { JobRow } from "@/features/jobs/api";

const columns: ColumnDef<JobRow>[] = [
  {
    key: "customerName",
    header: "Customer",
    render: (row) => row.customerName ?? "Unknown customer",
    searchValue: (row) => row.customerName ?? ""
  },
  {
    key: "type",
    header: "Job Type",
    render: (row) => row.type ?? "Service booking",
    searchValue: (row) => row.type ?? ""
  },
  {
    key: "scheduledDate",
    header: "Scheduled",
    render: (row) => row.scheduledDate ?? "—",
    searchValue: (row) => row.scheduledDate ?? ""
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusBadge value={row.status} />,
    searchValue: (row) => row.status
  }
];

export function JobsPage() {
  const { data } = useJobs();
  const rows = data ?? [];

  return (
    <section>
      <PageHeader title="Technician Jobs" description="View assigned field tasks, maintenance visits, and service-booking status." />
      <DataTable rows={rows} columns={columns} searchPlaceholder="Search technician jobs by customer, type, or status" />
    </section>
  );
}
