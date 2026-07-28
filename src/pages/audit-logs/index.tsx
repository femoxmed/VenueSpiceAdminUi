import { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useAuditLogs } from '@/features/audit/hooks';
import type { AuditLog } from '@/features/audit/api';

const actionOptions = [
	'all',
	'user.created',
	'user.updated',
	'user.activated',
	'user.deactivated',
	'organization.created',
	'organization.updated',
	'vendor_catalogue.created',
	'vendor_catalogue.updated',
	'vendor_catalogue.archived',
];

export function AuditLogsPage() {
	const { data, isLoading } = useAuditLogs({ limit: 100 });
	const [actionFilter, setActionFilter] = useState('all');
	const [entityFilter, setEntityFilter] = useState('all');
	const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

	const rows = data?.data ?? [];
	const entityTypes = useMemo(
		() => Array.from(new Set(rows.map((row) => row.entityType).filter(Boolean))).sort(),
		[rows],
	);
	const filteredRows = rows.filter((row) => {
		const matchesAction = actionFilter === 'all' || row.action === actionFilter;
		const matchesEntity = entityFilter === 'all' || row.entityType === entityFilter;
		return matchesAction && matchesEntity;
	});

	const columns: ColumnDef<AuditLog>[] = [
		{
			key: 'createdAt',
			header: 'Time',
			render: (row) => new Date(row.createdAt).toLocaleString(),
			searchValue: (row) => row.createdAt,
			sortValue: (row) => new Date(row.createdAt),
		},
		{
			key: 'actor',
			header: 'Actor',
			render: (row) => (
				<div>
					<p className='font-medium text-slate-900'>{row.userEmail ?? 'System'}</p>
					<p className='text-xs text-slate-500'>{row.userRole ?? 'No role'}</p>
				</div>
			),
			searchValue: (row) => `${row.userEmail ?? ''} ${row.userRole ?? ''}`,
			sortValue: (row) => row.userEmail ?? '',
		},
		{
			key: 'action',
			header: 'Action',
			render: (row) => <StatusBadge value={row.action} />,
			searchValue: (row) => row.action,
			sortValue: (row) => row.action,
		},
		{
			key: 'entity',
			header: 'Entity',
			render: (row) => (
				<div>
					<p className='font-medium text-slate-900'>{row.entityType ?? 'Unknown'}</p>
					<p className='max-w-[180px] truncate text-xs text-slate-500'>{row.entityId ?? 'No id'}</p>
				</div>
			),
			searchValue: (row) => `${row.entityType ?? ''} ${row.entityId ?? ''}`,
			sortValue: (row) => row.entityType ?? '',
		},
		{
			key: 'ipAddress',
			header: 'IP',
			render: (row) => row.ipAddress ?? 'Not captured',
			searchValue: (row) => row.ipAddress ?? '',
			sortValue: (row) => row.ipAddress ?? '',
		},
		{
			key: 'actions',
			header: 'Details',
			sortable: false,
			render: (row) => (
				<button
					className='rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800'
					onClick={() => setSelectedLog(row)}>
					View
				</button>
			),
		},
	];

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Audit Logs'
				description='Review sensitive admin and vendor activity across users, organizations, and catalogue changes.'
				action={
					<div className='flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600'>
						<ShieldCheck size={16} />
						{isLoading ? 'Loading...' : `${data?.total ?? 0} records`}
					</div>
				}
			/>

			<DataTable
				rows={filteredRows}
				columns={columns}
				pageSize={12}
				searchPlaceholder='Search actor, action, entity, or IP'
				filters={
					<div className='flex flex-col gap-2 sm:flex-row'>
						<select
							value={actionFilter}
							onChange={(event) => setActionFilter(event.target.value)}
							className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary'>
							{actionOptions.map((action) => (
								<option key={action} value={action}>
									{action === 'all' ? 'All actions' : action}
								</option>
							))}
						</select>
						<select
							value={entityFilter}
							onChange={(event) => setEntityFilter(event.target.value)}
							className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary'>
							<option value='all'>All entities</option>
							{entityTypes.map((entityType) => (
								<option key={entityType} value={entityType ?? ''}>
									{entityType}
								</option>
							))}
						</select>
					</div>
				}
			/>

			<Modal
				open={Boolean(selectedLog)}
				onClose={() => setSelectedLog(null)}
				title='Audit details'
				description={selectedLog ? `${selectedLog.action} on ${new Date(selectedLog.createdAt).toLocaleString()}` : undefined}>
				{selectedLog ? (
					<div className='space-y-4 text-sm'>
						<DetailGrid log={selectedLog} />
						<JsonBlock title='Changes' value={selectedLog.changes} />
						<JsonBlock title='Metadata' value={selectedLog.metadata} />
						<JsonBlock title='User agent' value={selectedLog.userAgent ? { userAgent: selectedLog.userAgent } : null} />
					</div>
				) : null}
			</Modal>
		</section>
	);
}

function DetailGrid({ log }: { log: AuditLog }) {
	const details = [
		['Actor', log.userEmail ?? 'System'],
		['Role', log.userRole ?? 'No role'],
		['Entity type', log.entityType ?? 'Unknown'],
		['Entity id', log.entityId ?? 'No id'],
		['IP address', log.ipAddress ?? 'Not captured'],
	];

	return (
		<div className='grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2'>
			{details.map(([label, value]) => (
				<div key={label}>
					<p className='text-xs font-medium uppercase tracking-wide text-slate-500'>{label}</p>
					<p className='mt-1 break-words text-slate-900'>{value}</p>
				</div>
			))}
		</div>
	);
}

function JsonBlock({ title, value }: { title: string; value?: Record<string, unknown> | null }) {
	return (
		<div>
			<p className='mb-2 font-medium text-slate-900'>{title}</p>
			<pre className='max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100'>
				{JSON.stringify(value ?? {}, null, 2)}
			</pre>
		</div>
	);
}
