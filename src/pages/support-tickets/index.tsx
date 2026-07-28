import { useMemo, useState } from 'react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { MetricCard } from '@/components/shared/metric-card';
import { Modal } from '@/components/shared/modal';
import { FormShell } from '@/components/shared/form-shell';
import {
	useSupportTickets,
	useSupportTicketStats,
	useCreateTicket,
} from '@/features/support-tickets/hooks';
import { useUsers } from '@/features/users/hooks';
import { useServiceTypes } from '@/features/service-types/hooks';
import { useCreateServiceBooking } from '@/features/jobs/hooks';
import { useOrders } from '@/features/orders/hooks';
import { useToast } from '@/components/shared/toast-provider';
import type { SupportTicketRow } from '@/features/support-tickets/api';
import { formatDate } from '@/lib/utils';
import {
	Eye,
	Clock,
	CheckCircle,
	AlertCircle,
	MessageSquare,
	Plus,
} from 'lucide-react';

export function SupportTicketsPage() {
	const { data: tickets } = useSupportTickets();
	const { data: stats } = useSupportTicketStats();
	const { data: users } = useUsers();
	const { data: serviceTypes } = useServiceTypes();
	const { data: orders } = useOrders();
	const customers = (users ?? []).filter((u) =>
		['customer', 'user'].includes(u.role),
	);
	const technicians = (users ?? []).filter((u) => u.role === 'technician');
	const createTicket = useCreateTicket();
	const createAssignment = useCreateServiceBooking();
	const { push } = useToast();

	const [selectedTicket, setSelectedTicket] = useState<SupportTicketRow | null>(
		null,
	);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [assignmentTicket, setAssignmentTicket] =
		useState<SupportTicketRow | null>(null);
	const [formData, setFormData] = useState({
		subject: '',
		customerId: '',
		description: '',
	});
	const [assignmentForm, setAssignmentForm] = useState({
		serviceTypeId: '',
		technicianId: '',
		preferredDate: '',
		issue: '',
		paidItemId: '',
	});
	const paidItems = useMemo(() => {
		if (!assignmentTicket?.customer?.id) return [];
		return (orders ?? [])
			.filter((order) => order.user?.id === assignmentTicket.customer?.id && order.status === 'paid')
			.flatMap((order) =>
				(order.items ?? []).map((item) => ({
					...item,
					label: `${item.product?.name || 'Paid item'}${item.deviceSerial ? ` • ${item.deviceSerial}` : ''}`,
				})),
			);
	}, [assignmentTicket?.customer?.id, orders]);
	const [assignmentFilter, setAssignmentFilter] = useState('all');
	const [statusFilter, setStatusFilter] = useState('all');
	const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt'>('updatedAt');

	const filteredTickets = useMemo(() => {
		return [...(tickets ?? [])]
			.filter((ticket) => {
				if (assignmentFilter === 'assigned') return Boolean(ticket.assignedUser);
				if (assignmentFilter === 'unassigned') return !ticket.assignedUser;
				return true;
			})
			.filter((ticket) =>
				statusFilter === 'all' ? true : ticket.status === statusFilter,
			)
			.sort((a, b) => {
				const aDate = new Date(a[sortBy] ?? 0).getTime();
				const bDate = new Date(b[sortBy] ?? 0).getTime();
				return bDate - aDate;
			});
	}, [assignmentFilter, sortBy, statusFilter, tickets]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createTicket.mutate(
			{
				...formData,
				status: 'open',
			},
			{
				onSuccess: () => {
					setShowCreateModal(false);
					setFormData({ subject: '', customerId: '', description: '' });
				},
			},
		);
	};

	const columns: ColumnDef<SupportTicketRow>[] = [
		{
			key: 'subject',
			header: 'Subject',
			render: (row) => (
				<div className='max-w-xs'>
					<div className='font-medium text-slate-900 truncate'>
						{row.subject}
					</div>
					<div className='text-xs text-slate-500 truncate'>
						{row.description?.slice(0, 60)}...
					</div>
				</div>
			),
			searchValue: (row) => row.subject,
		},
		{
			key: 'customer',
			header: 'Customer',
			render: (row) => row.customer?.fullName ?? 'Unknown customer',
			searchValue: (row) => row.customer?.fullName ?? '',
		},
		{
			key: 'assignedUser',
			header: 'Assigned To',
			render: (row) =>
				row.assignedUser ? (
					<span className='text-slate-700'>{row.assignedUser.fullName}</span>
				) : (
					<span className='text-slate-400 italic'>Unassigned</span>
				),
			searchValue: (row) => row.assignedUser?.fullName ?? '',
		},
		{
			key: 'status',
			header: 'Status',
			render: (row) => <StatusBadge value={row.status} />,
			searchValue: (row) => row.status,
		},
		{
			key: 'createdAt',
			header: 'Created',
			render: (row) => (
				<span className='text-slate-500 text-sm'>
					{formatDate(row.createdAt)}
				</span>
			),
			searchValue: (row) => row.createdAt ?? '',
		},
		{
			key: 'updatedAt',
			header: 'Updated',
			render: (row) => (
				<span className='text-slate-500 text-sm'>
					{formatDate(row.updatedAt)}
				</span>
			),
			searchValue: (row) => row.updatedAt ?? '',
		},
		{
			key: 'actions',
			header: '',
			render: (row) => (
				<div className='flex items-center gap-2'>
					<button
						onClick={(e) => {
							e.stopPropagation();
							window.location.href = `/support-tickets/${row.id}`;
						}}
						className='flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50'>
						<Eye size={16} />
						<span className='text-sm'>View</span>
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							setAssignmentTicket(row);
							setAssignmentForm({
								serviceTypeId: '',
								technicianId: '',
								preferredDate: '',
								issue: row.description || row.subject,
								paidItemId: '',
							});
						}}
						className='text-sm rounded-lg px-2 py-1 text-emerald-700 hover:bg-emerald-50'>
						Schedule
					</button>
				</div>
			),
		},
	];

	return (
		<section>
			<PageHeader
				title='Support Tickets'
				description='Track open customer issues, response ownership, and resolution status.'
				action={
					<button
						onClick={() => setShowCreateModal(true)}
						className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition'>
						<Plus size={18} />
						Create Ticket
					</button>
				}
			/>

			{stats && (
				<div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4 mb-6'>
					<MetricCard
						title='Open Tickets'
						value={String(stats.open)}
						helper='Waiting for response'
						icon={<AlertCircle size={22} className='text-red-500' />}
					/>
					<MetricCard
						title='In Progress'
						value={String(stats.inProgress)}
						helper='Being handled'
						icon={<Clock size={22} className='text-amber-500' />}
					/>
					<MetricCard
						title='Resolved'
						value={String(stats.resolved)}
						helper='This period'
						icon={<CheckCircle size={22} className='text-green-500' />}
					/>
					<MetricCard
						title='Total Tickets'
						value={String(stats.total)}
						helper='All time'
						icon={<MessageSquare size={22} className='text-blue-500' />}
					/>
				</div>
			)}

			<DataTable
				rows={filteredTickets}
				columns={columns}
				searchPlaceholder='Search support tickets by subject, customer, or status'
				filters={
					<div className='flex flex-wrap gap-2'>
						<select
							value={assignmentFilter}
							onChange={(event) => setAssignmentFilter(event.target.value)}
							className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-secondary'>
							<option value='all'>All assignment</option>
							<option value='assigned'>Assigned</option>
							<option value='unassigned'>Unassigned</option>
						</select>
						<select
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value)}
							className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-secondary'>
							<option value='all'>All status</option>
							<option value='open'>Open</option>
							<option value='in-progress'>In Progress</option>
							<option value='resolved'>Resolved</option>
							<option value='closed'>Closed</option>
						</select>
						<select
							value={sortBy}
							onChange={(event) =>
								setSortBy(event.target.value as 'updatedAt' | 'createdAt')
							}
							className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-secondary'>
							<option value='updatedAt'>Updated newest</option>
							<option value='createdAt'>Created newest</option>
						</select>
					</div>
				}
			/>

			<Modal
				open={!!selectedTicket}
				onClose={() => setSelectedTicket(null)}
				title='Ticket Details'>
				{selectedTicket && (
					<div className='space-y-4'>
						<div className='border-b pb-4'>
							<div className='font-medium text-lg'>
								{selectedTicket.subject}
							</div>
							<div className='text-sm text-slate-500 mt-1'>
								From: {selectedTicket.customer?.fullName || 'Unknown'} •{' '}
								{formatDate(selectedTicket.createdAt)}
							</div>
							<div className='mt-2'>
								<StatusBadge value={selectedTicket.status} />
							</div>
						</div>

						<div>
							<h4 className='font-medium mb-2'>Description</h4>
							<p className='text-slate-700 whitespace-pre-wrap'>
								{selectedTicket.description}
							</p>
						</div>
					</div>
				)}
			</Modal>

			<Modal
				open={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				title='Create New Ticket'
				footer={
					<div className='flex justify-end gap-2'>
						<button
							onClick={() => setShowCreateModal(false)}
							className='px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50'>
							Cancel
						</button>
						<button
							type='submit'
							form='create-ticket-form'
							disabled={createTicket.isPending}
							className='px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'>
							{createTicket.isPending ? 'Creating...' : 'Create Ticket'}
						</button>
					</div>
				}>
				<form
					id='create-ticket-form'
					onSubmit={handleSubmit}
					className='space-y-4'>
					<div>
						<label className='block text-sm font-medium mb-1'>Subject</label>
						<input
							type='text'
							value={formData.subject}
							onChange={(e) =>
								setFormData({ ...formData, subject: e.target.value })
							}
							required
							className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500'
							placeholder='Brief description of the issue'
						/>
					</div>

					<div>
						<label className='block text-sm font-medium mb-1'>Customer</label>
						<select
							value={formData.customerId}
							onChange={(e) =>
								setFormData({ ...formData, customerId: e.target.value })
							}
							required
							className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500'>
							<option value=''>Select customer...</option>
							{customers.map((customer) => (
								<option key={customer.id} value={customer.id}>
									{customer.fullName} ({customer.email})
								</option>
							))}
						</select>
					</div>

					<div>
						<label className='block text-sm font-medium mb-1'>
							Description
						</label>
						<textarea
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							required
							rows={5}
							className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none'
							placeholder='Detailed description of the issue'
						/>
					</div>
				</form>
			</Modal>

			<Modal
				open={!!assignmentTicket}
				onClose={() => setAssignmentTicket(null)}
				title='Schedule technician'
				description={assignmentTicket ? `Create an assignment for ${assignmentTicket.subject}` : undefined}
				footer={
					<div className='flex justify-end gap-2'>
						<button
							onClick={() => setAssignmentTicket(null)}
							className='px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50'>
							Cancel
						</button>
						<button
							disabled={createAssignment.isPending}
							onClick={async () => {
								if (!assignmentTicket?.customer?.id || !assignmentForm.serviceTypeId || !assignmentForm.preferredDate || !assignmentForm.issue || !assignmentForm.paidItemId) {
									push({ title: 'Missing fields', description: 'Customer paid item, service type, date, and issue are required.', variant: 'error' });
									return;
								}
								try {
									await createAssignment.mutateAsync({
										customerId: assignmentTicket.customer.id,
										serviceTypeId: assignmentForm.serviceTypeId,
										technicianId: assignmentForm.technicianId || undefined,
										paidItemId: assignmentForm.paidItemId,
										preferredDate: assignmentForm.preferredDate,
										issue: assignmentForm.issue,
										status: 'assigned',
									});
									push({ title: 'Assignment scheduled', description: 'The technician assignment has been created.' });
									setAssignmentTicket(null);
								} catch (error) {
									push({ title: 'Unable to schedule assignment', description: error instanceof Error ? error.message : 'An unexpected error occurred.', variant: 'error' });
								}
							}}
							className='px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50'>
							{createAssignment.isPending ? 'Scheduling...' : 'Schedule'}
						</button>
					</div>
				}>
				<div className='grid gap-4 md:grid-cols-2'>
					<select value={assignmentForm.serviceTypeId} onChange={(e) => setAssignmentForm((current) => ({ ...current, serviceTypeId: e.target.value }))} className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'>
						<option value=''>Select service type</option>
						{(serviceTypes ?? []).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
					</select>
					<select value={assignmentForm.technicianId} onChange={(e) => setAssignmentForm((current) => ({ ...current, technicianId: e.target.value }))} className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'>
						<option value=''>Select technician</option>
						{technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.fullName ?? tech.email}</option>)}
					</select>
					<select value={assignmentForm.paidItemId} onChange={(e) => setAssignmentForm((current) => ({ ...current, paidItemId: e.target.value }))} className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2'>
						<option value=''>Select customer paid item</option>
						{paidItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
					</select>
					<input type='date' value={assignmentForm.preferredDate} onChange={(e) => setAssignmentForm((current) => ({ ...current, preferredDate: e.target.value }))} className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm' />
					<textarea value={assignmentForm.issue} onChange={(e) => setAssignmentForm((current) => ({ ...current, issue: e.target.value }))} className='min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2' />
				</div>
			</Modal>
		</section>
	);
}
