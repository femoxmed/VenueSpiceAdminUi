import { useState } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { PhoneNumberField } from '@/components/shared/phone-number-field';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/components/shared/toast-provider';
import { useCreateCustomer, useCustomers } from '@/features/customers/hooks';
import type { CustomerRow } from '@/features/customers/api';

const columns: ColumnDef<CustomerRow>[] = [
	{
		key: 'fullName',
		header: 'Customer',
		render: (row) => (
			<div>
				<p className='font-medium text-slate-900'>
					{row.fullName ?? row.name ?? 'Unnamed Customer'}
				</p>
				<p className='text-xs text-slate-500'>{row.phone ?? 'No phone'}</p>
			</div>
		),
		searchValue: (row) =>
			`${row.fullName ?? row.name ?? ''} ${row.phone ?? ''}`,
	},
	{
		key: 'email',
		header: 'Email',
		render: (row) => row.email,
		searchValue: (row) => row.email,
	},
	{
		key: 'status',
		header: 'Status',
		render: () => <StatusBadge value='active' />,
		searchValue: () => 'active',
	},
	{
		key: 'machines',
		header: 'Installed Units',
		render: (row) => row.machines ?? row.installedProducts ?? 0,
		searchValue: (row) => String(row.machines ?? row.installedProducts ?? 0),
	},
	{
		key: 'actions',
		header: 'Actions',
		render: (row) => (
			<div className='flex items-center gap-2'>
				<button
					className='text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50'
					onClick={(e) => {
						e.stopPropagation();
					}}>
					View
				</button>
				<button
					className='text-sm text-gray-600 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-50'
					onClick={(e) => {
						e.stopPropagation();
					}}>
					Edit
				</button>
			</div>
		),
	},
];

export function CustomersPage() {
	const { data } = useCustomers();
	const createCustomerMutation = useCreateCustomer();
	const { push } = useToast();
	const rows = data ?? [];
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState({
		fullName: '',
		email: '',
		phone: '',
		subscriptionPlan: '',
	});
	const [phoneError, setPhoneError] = useState('');

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Customers'
				description='Manage customer accounts, contact details, service status, and installed machines.'
			/>
			<DataTable
				rows={rows}
				columns={columns}
				searchPlaceholder='Search customers by name, email, or phone'
				actions={
					<button
						className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
						onClick={() => setOpen(true)}>
						Create Customer
					</button>
				}
			/>

			<Modal
				open={open}
				onClose={() => setOpen(false)}
				title='Create customer'
				description='Create a new customer profile. Aquzera will queue a welcome email automatically.'
				footer={
					<>
						<button
							className='rounded-xl border border-slate-200 px-4 py-2 text-sm'
							onClick={() => setOpen(false)}>
							Cancel
						</button>
						<button
							className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
							disabled={createCustomerMutation.isPending}
							onClick={async () => {
								if (form.phone.trim() && !isValidPhoneNumber(form.phone.trim())) {
									setPhoneError('Enter a valid phone number');
									return;
								}
								try {
									await createCustomerMutation.mutateAsync({
										fullName: form.fullName,
										email: form.email,
										phone: form.phone,
										subscriptionPlan: form.subscriptionPlan || undefined,
									});
									push({
										title: 'Customer created',
										description:
											'A welcome email has been queued successfully.',
									});
									setForm({
										fullName: '',
										email: '',
										phone: '',
										subscriptionPlan: '',
									});
									setPhoneError('');
									setOpen(false);
								} catch (error) {
									push({
										title: 'Unable to create customer',
										description:
											error instanceof Error
												? error.message
												: 'An unexpected error occurred.',
										variant: 'error',
									});
								}
							}}>
							{createCustomerMutation.isPending
								? 'Creating...'
								: 'Create customer'}
						</button>
					</>
				}>
				<div className='grid gap-4 md:grid-cols-2'>
					<input
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Full name'
						value={form.fullName}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								fullName: event.target.value,
							}))
						}
					/>
					<input
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Email'
						value={form.email}
						onChange={(event) =>
							setForm((current) => ({ ...current, email: event.target.value }))
						}
					/>
					<PhoneNumberField
						placeholder='Phone number'
						value={form.phone}
						error={phoneError}
						onChange={(value) => {
							setForm((current) => ({ ...current, phone: value }));
							setPhoneError('');
						}}
					/>
					<input
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Subscription plan (optional)'
						value={form.subscriptionPlan}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								subscriptionPlan: event.target.value,
							}))
						}
					/>
				</div>
			</Modal>
		</section>
	);
}
