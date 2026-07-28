import { useState } from 'react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/components/shared/toast-provider';
import {
	useCreateServiceType,
	useServiceTypes,
	useUpdateServiceType,
} from '@/features/service-types/hooks';
import type { ServiceTypeRow } from '@/features/service-types/api';
import { currency } from '@/lib/utils';

const getColumns = (
	handleEdit: (row: ServiceTypeRow) => void,
): ColumnDef<ServiceTypeRow>[] => [
	{
		key: 'name',
		header: 'Service Type',
		render: (row) => (
			<div>
				<p className='font-medium text-slate-900'>{row.name}</p>
				<p className='text-xs text-slate-500'>{row.code}</p>
			</div>
		),
		searchValue: (row) => `${row.name} ${row.code}`,
	},
	{
		key: 'billingMode',
		header: 'Billing',
		render: (row) => <StatusBadge value={row.billingMode} />,
		searchValue: (row) => row.billingMode,
	},
	{
		key: 'basePrice',
		header: 'Base Price',
		render: (row) => currency(Number(row.basePrice)),
		searchValue: (row) => String(row.basePrice),
	},
	{
		key: 'duration',
		header: 'Duration',
		render: (row) => `${row.estimatedDurationMinutes} mins`,
		searchValue: (row) => String(row.estimatedDurationMinutes),
	},
	{
		key: 'status',
		header: 'Status',
		render: (row) => (
			<StatusBadge value={row.isActive ? 'active' : 'inactive'} />
		),
		searchValue: (row) => (row.isActive ? 'active' : 'inactive'),
	},
	{
		key: 'actions',
		header: '',
		render: (row) => (
			<button
				className='text-sm text-secondary hover:underline'
				onClick={(e) => {
					e.stopPropagation();
					handleEdit(row);
				}}>
				Edit
			</button>
		),
	},
];

export function ServiceTypesPage() {
	const { data } = useServiceTypes();
	const createServiceTypeMutation = useCreateServiceType();
	const updateServiceTypeMutation = useUpdateServiceType();
	const { push } = useToast();
	const rows = (data ?? []) as ServiceTypeRow[];
	const [open, setOpen] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState({
		name: '',
		code: '',
		description: '',
		basePrice: '0',
		billingMode: 'fixed',
		requiresTechnician: true,
		estimatedDurationMinutes: '60',
		isActive: true,
	});

	const handleEdit = (row: ServiceTypeRow) => {
		setEditMode(true);
		setEditingId(row.id);
		setForm({
			name: row.name,
			code: row.code,
			description: row.description || '',
			basePrice: String(row.basePrice),
			billingMode: row.billingMode,
			requiresTechnician: row.requiresTechnician,
			estimatedDurationMinutes: String(row.estimatedDurationMinutes),
			isActive: row.isActive,
		});
		setOpen(true);
	};

	const columns = getColumns(handleEdit);

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Service Types'
				description='Define service categories, billing rules, and base pricing used by technician assignments.'
			/>

			<DataTable
				rows={rows}
				columns={columns}
				searchPlaceholder='Search service types by name, code, or billing mode'
				actions={
					<button
						className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
						onClick={() => {
							setEditMode(false);
							setEditingId(null);
							setForm({
								name: '',
								code: '',
								description: '',
								basePrice: '0',
								billingMode: 'fixed',
								requiresTechnician: true,
								estimatedDurationMinutes: '60',
								isActive: true,
							});
							setOpen(true);
						}}>
						Create Service Type
					</button>
				}
			/>

			<Modal
				open={open}
				onClose={() => setOpen(false)}
				title={editMode ? 'Edit service type' : 'Create service type'}
				description='Service types control pricing and whether service bookings should immediately generate invoices.'
				footer={
					<>
						<button
							className='rounded-xl border border-slate-200 px-4 py-2 text-sm'
							onClick={() => setOpen(false)}>
							Cancel
						</button>
						<button
							className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
							disabled={
								createServiceTypeMutation.isPending ||
								updateServiceTypeMutation.isPending
							}
							onClick={async () => {
								try {
									const payload = {
										name: form.name,
										code: form.code,
										description: form.description || undefined,
										basePrice: Number(form.basePrice),
										billingMode: form.billingMode as
											| 'fixed'
											| 'quote'
											| 'warranty'
											| 'free',
										requiresTechnician: form.requiresTechnician,
										estimatedDurationMinutes: Number(
											form.estimatedDurationMinutes,
										),
										isActive: form.isActive,
									};

									if (editMode && editingId) {
										await updateServiceTypeMutation.mutateAsync({
											id: editingId,
											payload,
										});
										push({
											title: 'Service type updated',
											description: 'Changes have been saved successfully.',
										});
									} else {
										await createServiceTypeMutation.mutateAsync(payload);
										push({
											title: 'Service type created',
											description:
												'Pricing and billing rules have been saved successfully.',
										});
									}

									setForm({
										name: '',
										code: '',
										description: '',
										basePrice: '0',
										billingMode: 'fixed',
										requiresTechnician: true,
										estimatedDurationMinutes: '60',
										isActive: true,
									});
									setEditMode(false);
									setEditingId(null);
									setOpen(false);
								} catch (error) {
									push({
										title: editMode
											? 'Unable to update service type'
											: 'Unable to create service type',
										description:
											error instanceof Error
												? error.message
												: 'An unexpected error occurred.',
										variant: 'error',
									});
								}
							}}>
							{editMode
								? updateServiceTypeMutation.isPending
									? 'Saving...'
									: 'Save changes'
								: createServiceTypeMutation.isPending
									? 'Creating...'
									: 'Create service type'}
						</button>
					</>
				}>
				<div className='grid gap-4 md:grid-cols-2'>
					<input
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Name'
						value={form.name}
						onChange={(event) =>
							setForm((current) => ({ ...current, name: event.target.value }))
						}
					/>
					<input
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Code'
						value={form.code}
						onChange={(event) =>
							setForm((current) => ({ ...current, code: event.target.value }))
						}
					/>
					<input
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Base price'
						value={form.basePrice}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								basePrice: event.target.value,
							}))
						}
					/>
					<select
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						value={form.billingMode}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								billingMode: event.target.value,
							}))
						}>
						<option value='fixed'>Fixed</option>
						<option value='quote'>Quote</option>
						<option value='warranty'>Warranty</option>
						<option value='free'>Free</option>
					</select>
					<input
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Estimated duration (mins)'
						value={form.estimatedDurationMinutes}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								estimatedDurationMinutes: event.target.value,
							}))
						}
					/>
					<label className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600'>
						<input
							type='checkbox'
							checked={form.requiresTechnician}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									requiresTechnician: event.target.checked,
								}))
							}
						/>
						Requires technician
					</label>
				</div>
				<label className='mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600'>
					<input
						type='checkbox'
						checked={form.isActive}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								isActive: event.target.checked,
							}))
						}
					/>
					Active (visible for selection)
				</label>
				<textarea
					className='mt-4 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
					placeholder='Description (optional)'
					value={form.description}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							description: event.target.value,
						}))
					}
				/>
			</Modal>
		</section>
	);
}
