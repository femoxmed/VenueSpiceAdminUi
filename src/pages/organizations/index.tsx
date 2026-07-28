import { Building2, Eye, Mail, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { Link } from 'react-router-dom';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { PhoneNumberField } from '@/components/shared/phone-number-field';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/components/shared/toast-provider';
import { useCreateOrganization, useOrganizations, useUpdateOrganization } from '@/features/ticketing/hooks';
import type { Organization } from '@/features/ticketing/api';

const emptyForm = {
	name: '',
	slug: '',
	type: 'organization' as 'vendor' | 'organization' | 'influencer',
	contactEmail: '',
	contactPhone: '',
	businessCategory: '',
	country: '',
	postalCode: '',
	influencerPlatform: '',
	influencerHandle: '',
	influencerProfileUrl: '',
	influencerNiche: '',
	influencerAudienceSize: '',
	influencerEngagementRate: '',
	description: '',
};

export function OrganizationsPage() {
	const { data: organizations = [], isLoading } = useOrganizations();
	const createOrganization = useCreateOrganization();
	const updateOrganization = useUpdateOrganization();
	const { push } = useToast();
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState<Organization | null>(null);
	const [form, setForm] = useState(emptyForm);
	const [typeFilter, setTypeFilter] = useState('all');
	const [statusFilter, setStatusFilter] = useState('all');
	const [countryFilter, setCountryFilter] = useState('all');
	const [phoneError, setPhoneError] = useState('');

	const countryOptions = useMemo(
		() =>
			Array.from(
				new Set(
					organizations
						.map((organization) => organization.country)
						.filter((country): country is string => Boolean(country)),
				),
			).sort((a, b) => a.localeCompare(b)),
		[organizations],
	);

	const filteredOrganizations = useMemo(
		() =>
			organizations.filter((organization) => {
				const matchesType = typeFilter === 'all' || (organization.type ?? 'organization') === typeFilter;
				const matchesStatus = statusFilter === 'all' || organization.status === statusFilter;
				const matchesCountry = countryFilter === 'all' || organization.country === countryFilter;
				return matchesType && matchesStatus && matchesCountry;
			}),
		[countryFilter, organizations, statusFilter, typeFilter],
	);

	const columns = useMemo<ColumnDef<Organization>[]>(
		() => [
			{
				key: 'organization',
				header: 'Organization',
				searchValue: (organization) =>
					[
						organization.name,
						organization.slug,
						organization.contactEmail,
						organization.contactPhone,
						organization.influencerHandle,
					]
						.filter(Boolean)
						.join(' '),
				sortValue: (organization) => organization.name,
				render: (organization) => (
					<div className='flex items-center gap-3'>
						<div className='grid h-10 w-10 place-items-center rounded-lg bg-primary-10 text-primary'>
							<Building2 size={18} />
						</div>
						<div>
							<Link to={`/organizations/${organization.id}`} className='font-medium text-slate-900 hover:text-primary'>
								{organization.name}
							</Link>
							<p className='text-sm text-slate-500'>/{organization.slug}</p>
						</div>
					</div>
				),
			},
			{
				key: 'type',
				header: 'Type',
				searchValue: (organization) => organization.type ?? 'organization',
				sortValue: (organization) => organization.type ?? 'organization',
				render: (organization) => <StatusBadge value={organization.type ?? 'organization'} />,
			},
			{
				key: 'contact',
				header: 'Contact',
				searchValue: (organization) => organization.contactEmail ?? '',
				sortValue: (organization) => organization.contactEmail ?? '',
				render: (organization) => (
					<span className='inline-flex items-center gap-2 text-sm text-slate-600'>
						<Mail size={14} />
						{organization.contactEmail ?? 'Not set'}
					</span>
				),
			},
			{
				key: 'country',
				header: 'Country',
				searchValue: (organization) => organization.country ?? '',
				sortValue: (organization) => organization.country ?? '',
				render: (organization) => <span className='text-sm text-slate-600'>{organization.country ?? 'Not set'}</span>,
			},
			{
				key: 'status',
				header: 'Status',
				searchValue: (organization) => organization.status,
				sortValue: (organization) => organization.status,
				render: (organization) => <StatusBadge value={organization.status} />,
			},
			{
				key: 'payouts',
				header: 'Payouts',
				searchValue: (organization) => organization.stripeAccountId ?? '',
				sortValue: (organization) => Number(Boolean(organization.stripePayoutsEnabled && organization.stripeChargesEnabled && organization.stripeDetailsSubmitted)),
				render: (organization) => {
					const ready = Boolean(organization.stripePayoutsEnabled && organization.stripeChargesEnabled && organization.stripeDetailsSubmitted);
					return (
						<div>
							<StatusBadge value={ready ? 'stripe ready' : organization.stripeAccountId ? 'stripe pending' : 'not connected'} />
							<p className='mt-1 max-w-[150px] truncate text-xs text-slate-500'>{organization.stripeAccountId ?? 'No account'}</p>
						</div>
					);
				},
			},
			{
				key: 'created',
				header: 'Created',
				searchValue: (organization) => new Date(organization.createdAt).toLocaleDateString(),
				sortValue: (organization) => new Date(organization.createdAt),
				render: (organization) => (
					<span className='text-sm text-slate-500'>
						{new Date(organization.createdAt).toLocaleDateString()}
					</span>
				),
			},
			{
				key: 'actions',
				header: 'Actions',
				sortable: false,
				render: (organization) => (
					<div className='flex justify-end gap-2'>
						<Link
							to={`/organizations/${organization.id}`}
							className='inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-10'>
							<Eye size={14} />
							View
						</Link>
						<button
							type='button'
							onClick={() => startEdit(organization)}
							className='rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-10'>
							Edit
						</button>
					</div>
				),
			},
		],
		[],
	);

	const close = () => {
		setOpen(false);
		setEditing(null);
		setForm(emptyForm);
		setPhoneError('');
	};

	const startCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setPhoneError('');
		setOpen(true);
	};

	const startEdit = (organization: Organization) => {
		setEditing(organization);
		setForm({
			name: organization.name,
			slug: organization.slug,
			type: organization.type ?? 'organization',
			contactEmail: organization.contactEmail ?? '',
			contactPhone: organization.contactPhone ?? '',
			businessCategory: organization.businessCategory ?? '',
			country: organization.country ?? '',
			postalCode: organization.postalCode ?? '',
			influencerPlatform: organization.influencerPlatform ?? '',
			influencerHandle: organization.influencerHandle ?? '',
			influencerProfileUrl: organization.influencerProfileUrl ?? '',
			influencerNiche: organization.influencerNiche ?? '',
			influencerAudienceSize: organization.influencerAudienceSize?.toString() ?? '',
			influencerEngagementRate: organization.influencerEngagementRate?.toString() ?? '',
			description: organization.description ?? '',
		});
		setPhoneError('');
		setOpen(true);
	};

	const saveOrganization = async () => {
		const payload = {
			name: form.name.trim(),
			slug: form.slug.trim() || undefined,
			type: form.type,
			contactEmail: form.contactEmail.trim() || undefined,
			contactPhone: form.contactPhone.trim() || undefined,
			businessCategory: form.businessCategory.trim() || undefined,
			country: form.country.trim() || undefined,
			postalCode: form.postalCode.trim() || undefined,
			influencerPlatform: form.influencerPlatform.trim() || undefined,
			influencerHandle: form.influencerHandle.trim() || undefined,
			influencerProfileUrl: form.influencerProfileUrl.trim() || undefined,
			influencerNiche: form.influencerNiche.trim() || undefined,
			influencerAudienceSize: form.influencerAudienceSize ? Number(form.influencerAudienceSize) : undefined,
			influencerEngagementRate: form.influencerEngagementRate ? Number(form.influencerEngagementRate) : undefined,
			description: form.description.trim() || undefined,
		};

		if (!payload.name) return;
		if (payload.contactPhone && !isValidPhoneNumber(payload.contactPhone)) {
			setPhoneError('Enter a valid phone number');
			return;
		}

		try {
			if (editing) {
				await updateOrganization.mutateAsync({ id: editing.id, payload });
				push({ title: 'Organization updated', description: `${payload.name} is up to date.` });
			} else {
				await createOrganization.mutateAsync(payload);
				push({ title: 'Organization created', description: `${payload.name} is ready for events.` });
			}
			close();
		} catch (error) {
			push({
				title: 'Unable to save organization',
				description: error instanceof Error ? error.message : 'Please try again.',
				variant: 'error',
			});
		}
	};

	return (
		<section>
			<PageHeader
				title='Organizations'
				description='Vendor accounts and tenant boundaries for EventBox.'
				action={
					<button
						type='button'
						onClick={startCreate}
						className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-80'>
						<Plus size={16} />
						New Organization
					</button>
				}
			/>

			{isLoading ? (
				<div className='card p-6 text-sm text-slate-500'>Loading organizations...</div>
			) : (
				<DataTable
					rows={filteredOrganizations}
					columns={columns}
					pageSize={10}
					searchPlaceholder='Search organizations, slug, email, phone, handle...'
					filters={
						<div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap'>
							<select
								value={typeFilter}
								onChange={(event) => setTypeFilter(event.target.value)}
								className='h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary sm:w-36'>
								<option value='all'>All types</option>
								<option value='organization'>Organisations</option>
								<option value='vendor'>Vendors</option>
								<option value='influencer'>Influencers</option>
							</select>
							<select
								value={statusFilter}
								onChange={(event) => setStatusFilter(event.target.value)}
								className='h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary sm:w-36'>
								<option value='all'>All statuses</option>
								<option value='active'>Active</option>
								<option value='suspended'>Suspended</option>
								<option value='archived'>Archived</option>
							</select>
							<select
								value={countryFilter}
								onChange={(event) => setCountryFilter(event.target.value)}
								className='h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary sm:w-40'>
								<option value='all'>All countries</option>
								{countryOptions.map((country) => (
									<option key={country} value={country}>
										{country}
									</option>
								))}
							</select>
						</div>
					}
				/>
			)}

			<Modal
				open={open}
				onClose={close}
				title={editing ? 'Edit organization' : 'Create organization'}
				description='Add vendor details used for event ownership and admin scoping.'
				footer={
					<>
						<button
							type='button'
							onClick={close}
							className='rounded-xl border border-slate-200 px-4 py-2 text-sm'>
							Cancel
						</button>
						<button
							type='button'
							onClick={saveOrganization}
							disabled={createOrganization.isPending || updateOrganization.isPending}
							className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white disabled:opacity-60'>
							{createOrganization.isPending || updateOrganization.isPending
								? 'Saving...'
								: editing
									? 'Save changes'
									: 'Create organization'}
						</button>
					</>
				}>
				<div className='grid gap-4 md:grid-cols-2'>
					<input
						className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Organization name'
						value={form.name}
						onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
					/>
					<input
						className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Slug'
						value={form.slug}
						onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
					/>
					<select
						className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
						value={form.type}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								type: event.target.value as 'vendor' | 'organization' | 'influencer',
							}))
						}>
						<option value='organization'>Organisation</option>
						<option value='vendor'>Vendor</option>
						<option value='influencer'>Influencer</option>
					</select>
					<input
						className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Contact email'
						value={form.contactEmail}
						onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
					/>
					<PhoneNumberField
						placeholder='Contact phone'
						value={form.contactPhone}
						error={phoneError}
						onChange={(value) => {
							setForm((current) => ({ ...current, contactPhone: value }));
							setPhoneError('');
						}}
					/>
					<input
						className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Business category'
						value={form.businessCategory}
						onChange={(event) => setForm((current) => ({ ...current, businessCategory: event.target.value }))}
					/>
					<input
						className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Country'
						value={form.country}
						onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
					/>
					<input
						className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
						placeholder='Postal code'
						value={form.postalCode}
						onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))}
					/>
					<textarea
						className='min-h-28 rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2'
						placeholder='Description'
						value={form.description}
						onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
					/>
					{form.type === 'influencer' ? (
						<div className='grid gap-4 rounded-xl border border-primary-10 bg-primary-5 p-4 md:col-span-2 md:grid-cols-2'>
							<input
								className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
								placeholder='Primary platform'
								value={form.influencerPlatform}
								onChange={(event) => setForm((current) => ({ ...current, influencerPlatform: event.target.value }))}
							/>
							<input
								className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
								placeholder='Influencer handle'
								value={form.influencerHandle}
								onChange={(event) => setForm((current) => ({ ...current, influencerHandle: event.target.value }))}
							/>
							<input
								className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
								placeholder='Profile URL'
								value={form.influencerProfileUrl}
								onChange={(event) => setForm((current) => ({ ...current, influencerProfileUrl: event.target.value }))}
							/>
							<input
								className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
								placeholder='Niche'
								value={form.influencerNiche}
								onChange={(event) => setForm((current) => ({ ...current, influencerNiche: event.target.value }))}
							/>
							<input
								className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
								placeholder='Audience size'
								type='number'
								value={form.influencerAudienceSize}
								onChange={(event) => setForm((current) => ({ ...current, influencerAudienceSize: event.target.value }))}
							/>
							<input
								className='rounded-xl border border-slate-200 px-3 py-2 text-sm'
								placeholder='Engagement rate (%)'
								type='number'
								value={form.influencerEngagementRate}
								onChange={(event) => setForm((current) => ({ ...current, influencerEngagementRate: event.target.value }))}
							/>
						</div>
					) : null}
				</div>
			</Modal>
		</section>
	);
}
