import { ArrowLeft, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useUser } from '@/features/users/hooks';

const roleLabels: Record<string, string> = {
	super_admin: 'Super Admin',
	platform_admin: 'Platform Admin',
	org_admin: 'Vendor Admin',
	org_staff: 'Vendor Staff',
	agent: 'Agent',
	customer: 'Customer',
	admin: 'Legacy Admin',
	user: 'Legacy User',
};

export function UserDetailPage() {
	const { id = '' } = useParams();
	const { data: user, isLoading, error } = useUser(id);

	if (isLoading) {
		return <div className='card p-6 text-sm text-slate-500'>Loading user...</div>;
	}

	if (error || !user) {
		return (
			<section className='space-y-4'>
				<Link to='/users' className='inline-flex items-center gap-2 text-sm font-medium text-primary'>
					<ArrowLeft size={16} />
					Back to users
				</Link>
				<div className='card p-6 text-sm text-rose-600'>Unable to load this user.</div>
			</section>
		);
	}

	const isActive = user.active === false || user.isActive === false ? false : true;

	return (
		<section className='space-y-6'>
			<PageHeader
				title={user.fullName || user.email}
				description='Complete account, role, profile, and business details for this user.'
				action={
					<Link
						to='/users'
						className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'>
						<ArrowLeft size={16} />
						Back
					</Link>
				}
			/>

			<div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
				<div className='card p-6'>
					<div className='flex items-start gap-4'>
						<div className='grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-10 text-primary'>
							<UserRound size={30} />
						</div>
						<div className='min-w-0'>
							<h2 className='text-xl font-semibold text-slate-950'>
								{user.fullName || 'Unnamed user'}
							</h2>
							<p className='mt-1 break-all text-sm text-slate-500'>{user.email}</p>
							<div className='mt-4 flex flex-wrap gap-2'>
								<StatusBadge value={roleLabels[user.role] || user.role} />
								<StatusBadge value={isActive ? 'active' : 'inactive'} />
							</div>
						</div>
					</div>

					<div className='mt-6 grid gap-3 text-sm'>
						<IconLine icon={<Mail size={16} />} label='Email' value={user.email} />
						<IconLine icon={<Phone size={16} />} label='Phone' value={user.phone} />
						<IconLine icon={<ShieldCheck size={16} />} label='Role' value={roleLabels[user.role] || user.role} />
					</div>
				</div>

				<div className='card p-6'>
					<h3 className='text-lg font-semibold text-slate-950'>All Fields</h3>
					<div className='mt-5 grid gap-4 md:grid-cols-2'>
						<DetailItem label='User ID' value={user.id} />
						<DetailItem label='Full name' value={user.fullName} />
						<DetailItem label='Email' value={user.email} />
						<DetailItem label='Phone' value={user.phone} />
						<DetailItem label='Role' value={roleLabels[user.role] || user.role} />
						<DetailItem label='Status' value={isActive ? 'Active' : 'Inactive'} />
						<DetailItem label='Verified at' value={formatDateTime(user.verifiedAt)} />
						<DetailItem label='Active at' value={formatDateTime(user.activeAt)} />
						<DetailItem label='Subscription plan' value={user.subscriptionPlan} />
						<DetailItem label='Installed products' value={user.installedProducts ?? 0} />
						<DetailItem label='Created at' value={formatDateTime(user.createdAt)} />
						<DetailItem label='Updated at' value={formatDateTime(user.updatedAt)} />
					</div>
				</div>
			</div>
		</section>
	);
}

function IconLine({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value?: string | null;
}) {
	return (
		<div className='flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-slate-700'>
			<span className='text-slate-400'>{icon}</span>
			<span className='font-medium'>{label}</span>
			<span className='ml-auto min-w-0 truncate text-slate-500'>{value || 'Not set'}</span>
		</div>
	);
}

function DetailItem({
	label,
	value,
}: {
	label: string;
	value?: string | number | null;
}) {
	return (
		<div className='rounded-xl border border-slate-100 bg-slate-50 px-4 py-3'>
			<p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
				{label}
			</p>
			<p className='mt-1 break-words text-sm font-medium text-slate-900'>
				{value === null || value === undefined || value === '' ? 'Not set' : value}
			</p>
		</div>
	);
}

function formatDateTime(value?: string | null) {
	if (!value) return null;
	return new Date(value).toLocaleString();
}
