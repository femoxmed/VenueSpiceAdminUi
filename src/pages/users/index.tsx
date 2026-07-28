import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/components/shared/toast-provider';
import { useCreateUser, useUsers, useUpdateUser } from '@/features/users/hooks';
import type { UserRow, CreateUserPayload } from '@/features/users/api';

export function UsersPage() {
	const navigate = useNavigate();
	const { data } = useUsers();
	const createUserMutation = useCreateUser();
	const updateUserMutation = useUpdateUser();
	const { push } = useToast();
	const [roleFilter, setRoleFilter] = useState('all');
	const [open, setOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
	const [form, setForm] = useState({
		fullName: '',
		email: '',
		password: '',
		role: 'org_staff',
	});

	const rows = data ?? [];

	const filteredRows =
		roleFilter === 'all' ? rows : rows.filter((row) => row.role === roleFilter);

	const columnsWithHandlers: ColumnDef<UserRow>[] = [
		{
			key: 'fullName',
			header: 'Name',
			render: (row) => row.fullName ?? row.email.split('@')[0],
			searchValue: (row) => `${row.fullName ?? ''} ${row.email}`,
			sortValue: (row) => row.fullName ?? row.email,
		},
		{
			key: 'email',
			header: 'Email',
			render: (row) => row.email,
			searchValue: (row) => row.email,
			sortValue: (row) => row.email,
		},
		{
			key: 'role',
			header: 'Role',
			render: (row) => <StatusBadge value={row.role} />,
			searchValue: (row) => row.role,
			sortValue: (row) => row.role,
		},
		{
			key: 'active',
			header: 'Status',
			render: (row) => (
				<StatusBadge
					value={
						row.active === false || row.isActive === false
							? 'inactive'
							: 'active'
					}
				/>
			),
			searchValue: (row) =>
				row.active === false || row.isActive === false ? 'inactive' : 'active',
			sortValue: (row) =>
				row.active === false || row.isActive === false ? 'inactive' : 'active',
		},
		{
			key: 'createdAt',
			header: 'Created',
			render: (row) =>
				row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Not set',
			searchValue: (row) => row.createdAt ?? '',
			sortValue: (row) => row.createdAt ?? '',
		},
		{
			key: 'actions',
			header: 'Actions',
			sortable: false,
			render: (row: UserRow) => (
				<div className='flex items-center gap-2'>
					<button
						className='text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50'
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/users/${row.id}`);
						}}>
						View
					</button>
					<button
						className='text-sm text-gray-600 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-50'
						onClick={(e) => {
							e.stopPropagation();
							setSelectedUser(row);
							setForm({
								fullName: row.fullName ?? '',
								email: row.email,
								password: '',
								role: row.role,
							});
							setEditOpen(true);
						}}>
						Edit
					</button>
				</div>
			),
		},
	];

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Users'
				description='Create and manage platform admins, vendor admins, vendor staff, agents, and customers.'
			/>
			<DataTable
				rows={filteredRows}
				columns={columnsWithHandlers}
				searchPlaceholder='Search by name, email, or role'
				filters={
					<select
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
						className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary'>
						<option value='all'>All Roles</option>
						<option value='platform_admin'>Platform Admins</option>
						<option value='org_admin'>Vendor Admins</option>
						<option value='org_staff'>Vendor Staff</option>
						<option value='agent'>Agents</option>
						<option value='customer'>Customers</option>
						<option value='admin'>Legacy Admins</option>
						<option value='super_admin'>Super Admins</option>
					</select>
				}
				actions={
					<button
						className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
						onClick={() => setOpen(true)}>
						Create User
					</button>
				}
			/>
			<Modal
				open={open}
				onClose={() => setOpen(false)}
				title='Create platform user'
				description='Create an account for platform operations, a vendor team member, an agent, or a customer.'
				footer={
					<>
						<button
							className='rounded-xl border border-slate-200 px-4 py-2 text-sm'
							onClick={() => setOpen(false)}>
							Cancel
						</button>
						<button
							className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
							disabled={createUserMutation.isPending}
							onClick={async () => {
								try {
									await createUserMutation.mutateAsync({
										fullName: form.fullName,
										email: form.email,
										password: form.password,
										role: form.role as
											| 'super_admin'
											| 'platform_admin'
											| 'org_admin'
											| 'org_staff'
											| 'agent'
											| 'customer'
											| 'admin'
											| 'user',
										isActive: true,
									});
									push({
										title: 'User created',
										description:
											'Account credentials have been queued by email.',
									});
									setForm({
										fullName: '',
										email: '',
										password: '',
										role: 'org_staff',
									});
									setOpen(false);
								} catch (error) {
									push({
										title: 'Unable to create user',
										description:
											error instanceof Error
												? error.message
												: 'An unexpected error occurred.',
										variant: 'error',
									});
								}
							}}>
							{createUserMutation.isPending ? 'Creating...' : 'Create user'}
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
					<input
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Temporary password'
						value={form.password}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								password: event.target.value,
							}))
						}
					/>
					<select
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						value={form.role}
						onChange={(event) =>
							setForm((current) => ({ ...current, role: event.target.value }))
						}>
						<option value='platform_admin'>Platform Admin</option>
						<option value='org_admin'>Vendor Admin</option>
						<option value='org_staff'>Vendor Staff</option>
						<option value='agent'>Agent</option>
						<option value='customer'>Customer</option>
						<option value='admin'>Legacy Admin</option>
						<option value='user'>Legacy User</option>
						<option value='super_admin'>Super Admin</option>
					</select>
				</div>
			</Modal>

			<Modal
				open={editOpen}
				onClose={() => {
					setEditOpen(false);
					setSelectedUser(null);
					setForm({
						fullName: '',
						email: '',
						password: '',
						role: 'org_staff',
					});
				}}
				title='Edit user'
				description='Update access details and role assignment for this platform account.'
				footer={
					<>
						<button
							className='rounded-xl border border-slate-200 px-4 py-2 text-sm'
							onClick={() => {
								setEditOpen(false);
								setSelectedUser(null);
								setForm({
									fullName: '',
									email: '',
									password: '',
									role: 'org_staff',
								});
							}}>
							Cancel
						</button>
						<button
							className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
							disabled={updateUserMutation.isPending}
							onClick={async () => {
								if (!selectedUser) return;

								try {
									const payload: Partial<CreateUserPayload> = {
										fullName: form.fullName,
										email: form.email,
										role: form.role as
											| 'super_admin'
											| 'platform_admin'
											| 'org_admin'
											| 'org_staff'
											| 'agent'
											| 'customer'
											| 'admin'
											| 'user',
									};

									if (form.password) {
										payload.password = form.password;
									}

									await updateUserMutation.mutateAsync({
										userId: selectedUser.id,
										payload,
									});

									push({
										title: 'User updated',
										description: 'User details have been updated successfully.',
									});
									setEditOpen(false);
									setSelectedUser(null);
									setForm({
										fullName: '',
										email: '',
										password: '',
										role: 'org_staff',
									});
								} catch (error) {
									push({
										title: 'Unable to update user',
										description:
											error instanceof Error
												? error.message
												: 'An unexpected error occurred.',
										variant: 'error',
									});
								}
							}}>
							{updateUserMutation.isPending ? 'Saving...' : 'Save changes'}
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
					<input
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='New password (leave empty to keep current)'
						value={form.password}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								password: event.target.value,
							}))
						}
					/>
					<select
						className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
						value={form.role}
						onChange={(event) =>
							setForm((current) => ({ ...current, role: event.target.value }))
						}>
						<option value='platform_admin'>Platform Admin</option>
						<option value='org_admin'>Vendor Admin</option>
						<option value='org_staff'>Vendor Staff</option>
						<option value='agent'>Agent</option>
						<option value='customer'>Customer</option>
						<option value='admin'>Legacy Admin</option>
						<option value='user'>Legacy User</option>
						<option value='super_admin'>Super Admin</option>
					</select>
				</div>
			</Modal>
		</section>
	);
}
