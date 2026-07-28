import { useState } from 'react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/components/shared/toast-provider';
import { useJobs, useCreateServiceBooking } from '@/features/jobs/hooks';
import type { JobRow } from '@/features/jobs/api';
import { useUsers } from '@/features/users/hooks';
import { useServiceTypes } from '@/features/service-types/hooks';
import { currency } from '@/lib/utils';

const columns: ColumnDef<JobRow>[] = [
	{
		key: 'customerName',
		header: 'Customer',
		render: (row) =>
			row.customer?.fullName ?? row.customerName ?? 'Unknown customer',
		searchValue: (row) => row.customer?.fullName ?? row.customerName ?? '',
	},
	{
		key: 'type',
		header: 'Service Type',
		render: (row) => row.serviceType?.name ?? row.type ?? 'Service booking',
		searchValue: (row) => row.serviceType?.name ?? row.type ?? '',
	},
	{
		key: 'billing',
		header: 'Billing',
		render: (row) => (
			<StatusBadge
				value={row.billingMode ?? row.serviceType?.billingMode ?? 'fixed'}
			/>
		),
		searchValue: (row) => row.billingMode ?? row.serviceType?.billingMode ?? '',
	},
	{
		key: 'price',
		header: 'Price',
		render: (row) =>
			currency(Number(row.price ?? row.serviceType?.basePrice ?? 0)),
		searchValue: (row) => String(row.price ?? row.serviceType?.basePrice ?? 0),
	},
	{
		key: 'technician',
		header: 'Technician',
		render: (row) => row.technician?.fullName ?? 'Unassigned',
		searchValue: (row) => row.technician?.fullName ?? '',
	},
	{
		key: 'scheduledDate',
		header: 'Scheduled',
		render: (row) => row.preferredDate ?? row.scheduledDate ?? '—',
		searchValue: (row) => row.preferredDate ?? row.scheduledDate ?? '',
	},
	{
		key: 'status',
		header: 'Status',
		render: (row) => <StatusBadge value={row.status} />,
		searchValue: (row) => row.status,
	},
];

export function AssignmentsPage() {
	const { data } = useJobs();
	const { data: users } = useUsers();
	const customers = (users ?? []).filter((u) =>
		['customer', 'user'].includes(u.role),
	);
	const { data: serviceTypesData } = useServiceTypes();
	const createServiceBookingMutation = useCreateServiceBooking();
	const { push } = useToast();
	const rows = data ?? [];
	const technicians = (users ?? []).filter(
		(user) => user.role === 'technician',
	);
	const serviceTypes = serviceTypesData ?? [];
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState({
		customerId: '',
		technicianId: '',
		preferredDate: '',
		issue: '',
		serviceTypeId: '',
		overridePrice: '',
	});

	const selectedServiceType = serviceTypes.find(
		(item) => item.id === form.serviceTypeId,
	);

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Technician Assignments'
				description='Create and monitor technician work orders for installations, repairs, and maintenance visits.'
			/>
			<DataTable
				rows={rows}
				columns={columns}
				searchPlaceholder='Search assignments by customer, type, technician, or status'
				actions={
					<button
						disabled={
							createServiceBookingMutation.isPending ||
							serviceTypes.length === 0
						}
						className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
						onClick={() => setOpen(true)}>
						Create Assignment
					</button>
				}
			/>

			<Modal
				open={open}
				onClose={() => setOpen(false)}
				title='Create assignment'
				description='Assignments now use service types. Fixed-price service types automatically create invoices when the booking is saved.'
				footer={
					<>
						<button
							className='rounded-xl border border-slate-200 px-4 py-2 text-sm'
							onClick={() => setOpen(false)}>
							Cancel
						</button>
						<button
							className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
							disabled={createServiceBookingMutation.isPending}
							onClick={async () => {
								try {
									if (
										!form.customerId ||
										!form.serviceTypeId ||
										!form.preferredDate ||
										!form.issue
									) {
										push({
											title: 'Missing required fields',
											description:
												'Customer, service type, preferred date, and issue are required.',
											variant: 'error',
										});
										return;
									}
									const created =
										await createServiceBookingMutation.mutateAsync({
											customerId: form.customerId,
											technicianId: form.technicianId || undefined,
											preferredDate: form.preferredDate,
											issue: form.issue,
											serviceTypeId: form.serviceTypeId,
											overridePrice: form.overridePrice
												? Number(form.overridePrice)
												: undefined,
											status: 'assigned',
										});
									push({
										title: 'Assignment created',
										description: created.invoice
											? 'Customer and technician emails were queued and an invoice was created for this billable service.'
											: 'Customer and technician emails were queued successfully.',
									});
									setForm({
										customerId: '',
										technicianId: '',
										preferredDate: '',
										issue: '',
										serviceTypeId: '',
										overridePrice: '',
									});
									setOpen(false);
								} catch (error) {
									push({
										title: 'Unable to create assignment',
										description:
											error instanceof Error
												? error.message
												: 'An unexpected error occurred.',
										variant: 'error',
									});
								}
							}}>
							{createServiceBookingMutation.isPending
								? 'Creating...'
								: 'Create assignment'}
						</button>
					</>
				}>
				<div className='grid gap-4 md:grid-cols-2'>
					<select
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						value={form.customerId}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								customerId: event.target.value,
							}))
						}>
						<option value=''>Select customer</option>
						{customers.map((customer) => (
							<option key={customer.id} value={customer.id}>
								{customer.fullName ?? customer.email}
							</option>
						))}
					</select>

					<select
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						value={form.technicianId}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								technicianId: event.target.value,
							}))
						}>
						<option value=''>Select technician</option>
						{technicians.map((technician) => (
							<option key={technician.id} value={technician.id}>
								{technician.fullName ?? technician.email}
							</option>
						))}
					</select>

					<select
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						value={form.serviceTypeId}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								serviceTypeId: event.target.value,
							}))
						}>
						<option value=''>Select service type</option>
						{serviceTypes.map((serviceType) => (
							<option key={serviceType.id} value={serviceType.id}>
								{serviceType.name} — {serviceType.billingMode}
							</option>
						))}
					</select>

					<input
						type='date'
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						value={form.preferredDate}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								preferredDate: event.target.value,
							}))
						}
					/>

					<input
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Override price (optional)'
						value={form.overridePrice}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								overridePrice: event.target.value,
							}))
						}
					/>
					<div className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600'>
						<span>Billing mode:</span>
						<StatusBadge value={selectedServiceType?.billingMode ?? 'fixed'} />
					</div>
				</div>

				<textarea
					className='mt-4 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
					placeholder='Describe the issue or field task'
					value={form.issue}
					onChange={(event) =>
						setForm((current) => ({ ...current, issue: event.target.value }))
					}
				/>
			</Modal>
		</section>
	);
}
