import {
	ArrowLeft,
	AtSign,
	BadgePercent,
	Building2,
	CalendarDays,
	Globe2,
	Mail,
	MapPin,
	Phone,
	Radio,
	Store,
	UsersRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useAgents, useEvents, useOrganization } from '@/features/ticketing/hooks';
import type { Organization } from '@/features/ticketing/api';

const typeCopy: Record<
	NonNullable<Organization['type']>,
	{ title: string; description: string; icon: ReactNode; accent: string }
> = {
	organization: {
		title: 'Organisation Profile',
		description: 'Registered business account for managing owned events and ticket sales.',
		icon: <Building2 size={30} />,
		accent: 'bg-primary-10 text-primary',
	},
	vendor: {
		title: 'Vendor Profile',
		description: 'Service provider profile used for event operations, fulfilment, and vendor ownership.',
		icon: <Store size={30} />,
		accent: 'bg-secondary-10 text-secondary',
	},
	influencer: {
		title: 'Influencer Profile',
		description: 'Creator profile for event promotion, audience reach, referrals, and social selling.',
		icon: <Radio size={30} />,
		accent: 'bg-tertiary-10 text-tertiary-80',
	},
};

export function OrganizationDetailPage() {
	const { id = '' } = useParams();
	const { data: organization, isLoading, error } = useOrganization(id);
	const { data: events = [] } = useEvents(id);
	const { data: agents = [] } = useAgents();

	if (isLoading) {
		return <div className='card p-6 text-sm text-slate-500'>Loading organization...</div>;
	}

	if (error || !organization) {
		return (
			<section className='space-y-4'>
				<Link to='/organizations' className='inline-flex items-center gap-2 text-sm font-medium text-primary'>
					<ArrowLeft size={16} />
					Back to organizations
				</Link>
				<div className='card p-6 text-sm text-rose-600'>Unable to load this organization.</div>
			</section>
		);
	}

	const type = organization.type ?? 'organization';
	const copy = typeCopy[type];
	const organizationAgents = agents.filter((agent) => agent.organization?.id === organization.id);
	const publishedEvents = events.filter((event) => event.status === 'published').length;
	const stripeReady = Boolean(organization.stripeChargesEnabled && organization.stripePayoutsEnabled && organization.stripeDetailsSubmitted);

	return (
		<section className='space-y-6'>
			<PageHeader
				title={organization.name}
				description={copy.description}
				action={
					<Link
						to='/organizations'
						className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'>
						<ArrowLeft size={16} />
						Back
					</Link>
				}
			/>

			<div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
				<div className='card overflow-hidden'>
					<div className='border-b border-slate-100 p-6'>
						<div className='flex items-start gap-4'>
							<div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${copy.accent}`}>
								{copy.icon}
							</div>
							<div className='min-w-0'>
								<p className='text-sm font-semibold text-slate-500'>{copy.title}</p>
								<h2 className='mt-1 break-words text-2xl font-semibold text-slate-950'>
									{organization.name}
								</h2>
								<p className='mt-1 break-all text-sm text-slate-500'>/{organization.slug}</p>
								<div className='mt-4 flex flex-wrap gap-2'>
									<StatusBadge value={type} />
									<StatusBadge value={organization.status} />
								</div>
							</div>
						</div>
					</div>

					<div className='grid gap-3 p-6 text-sm'>
						<IconLine icon={<Mail size={16} />} label='Contact email' value={organization.contactEmail} />
						<IconLine icon={<Phone size={16} />} label='Contact phone' value={organization.contactPhone} />
						<IconLine icon={<MapPin size={16} />} label='Country' value={organization.country} />
						<IconLine icon={<CalendarDays size={16} />} label='Created' value={formatDateTime(organization.createdAt)} />
					</div>
				</div>

				<div className='grid gap-4 sm:grid-cols-3'>
					<Metric label='Events' value={events.length} helper={`${publishedEvents} published`} />
					<Metric label='Agents' value={organizationAgents.length} helper='Assigned to this org' />
					<Metric label='Type' value={formatLabel(type)} helper='Account classification' />
					<Metric label='Payouts' value={stripeReady ? 'Ready' : 'Pending'} helper={organization.stripeAccountId ?? 'No Stripe account'} />
				</div>
			</div>

			<div className='card p-6'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
					<div>
						<h3 className='text-lg font-semibold text-slate-950'>Stripe Connect Express</h3>
						<p className='mt-1 text-sm text-slate-500'>Stripe-hosted payout onboarding status for paid event publishing.</p>
					</div>
					<StatusBadge value={stripeReady ? 'stripe ready' : organization.stripeAccountId ? 'stripe pending' : 'not connected'} />
				</div>
				<div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
					<DetailItem label='Account ID' value={organization.stripeAccountId} />
					<DetailItem label='Account type' value={organization.stripeAccountType} />
					<DetailItem label='Charges enabled' value={organization.stripeChargesEnabled ? 'Yes' : 'No'} />
					<DetailItem label='Payouts enabled' value={organization.stripePayoutsEnabled ? 'Yes' : 'No'} />
					<DetailItem label='Details submitted' value={organization.stripeDetailsSubmitted ? 'Yes' : 'No'} />
					<DetailItem label='Onboarding completed' value={formatDateTime(organization.stripeOnboardingCompletedAt)} />
				</div>
			</div>

			{type === 'influencer' ? (
				<TypePanel
					title='Creator Data'
					description='Influencer-specific fields used for audience qualification and campaign matching.'
					items={[
						['Primary platform', organization.influencerPlatform],
						['Handle', organization.influencerHandle],
						['Profile URL', organization.influencerProfileUrl],
						['Niche', organization.influencerNiche],
						['Audience size', formatNumber(organization.influencerAudienceSize)],
						['Engagement rate', formatPercent(organization.influencerEngagementRate)],
					]}
					icon={<AtSign size={18} />}
				/>
			) : type === 'vendor' ? (
				<TypePanel
					title='Vendor Data'
					description='Operational vendor fields for service category, location, and fulfilment contact.'
					items={[
						['Service category', organization.businessCategory],
						['Country', organization.country],
						['Postal code', organization.postalCode],
						['Contact email', organization.contactEmail],
						['Contact phone', organization.contactPhone],
						['Description', organization.description],
					]}
					icon={<BadgePercent size={18} />}
				/>
			) : (
				<TypePanel
					title='Organisation Data'
					description='Business identity and location fields for ticket ownership and admin scoping.'
					items={[
						['Business category', organization.businessCategory],
						['Country', organization.country],
						['Postal code', organization.postalCode],
						['Owner user ID', organization.ownerUserId],
						['Contact email', organization.contactEmail],
						['Description', organization.description],
					]}
					icon={<Globe2 size={18} />}
				/>
			)}

			<div className='card p-6'>
				<h3 className='text-lg font-semibold text-slate-950'>All Fields</h3>
				<div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
					<DetailItem label='Organization ID' value={organization.id} />
					<DetailItem label='Name' value={organization.name} />
					<DetailItem label='Slug' value={organization.slug} />
					<DetailItem label='Type' value={formatLabel(type)} />
					<DetailItem label='Status' value={organization.status} />
					<DetailItem label='Owner user ID' value={organization.ownerUserId} />
					<DetailItem label='Contact email' value={organization.contactEmail} />
					<DetailItem label='Contact phone' value={organization.contactPhone} />
					<DetailItem label='Business category' value={organization.businessCategory} />
					<DetailItem label='Country' value={organization.country} />
					<DetailItem label='Postal code' value={organization.postalCode} />
					<DetailItem label='Influencer platform' value={organization.influencerPlatform} />
					<DetailItem label='Influencer handle' value={organization.influencerHandle} />
					<DetailItem label='Influencer profile URL' value={organization.influencerProfileUrl} />
					<DetailItem label='Influencer niche' value={organization.influencerNiche} />
					<DetailItem label='Influencer audience size' value={formatNumber(organization.influencerAudienceSize)} />
					<DetailItem label='Influencer engagement rate' value={formatPercent(organization.influencerEngagementRate)} />
					<DetailItem label='Stripe account ID' value={organization.stripeAccountId} />
					<DetailItem label='Stripe account type' value={organization.stripeAccountType} />
					<DetailItem label='Stripe charges enabled' value={organization.stripeChargesEnabled ? 'Yes' : 'No'} />
					<DetailItem label='Stripe payouts enabled' value={organization.stripePayoutsEnabled ? 'Yes' : 'No'} />
					<DetailItem label='Stripe details submitted' value={organization.stripeDetailsSubmitted ? 'Yes' : 'No'} />
					<DetailItem label='Stripe onboarding completed' value={formatDateTime(organization.stripeOnboardingCompletedAt)} />
					<DetailItem label='Created at' value={formatDateTime(organization.createdAt)} />
				</div>
			</div>
		</section>
	);
}

function TypePanel({
	title,
	description,
	items,
	icon,
}: {
	title: string;
	description: string;
	items: Array<[string, string | number | null | undefined]>;
	icon: ReactNode;
}) {
	return (
		<div className='card p-6'>
			<div className='flex items-start gap-3'>
				<div className='grid h-10 w-10 place-items-center rounded-xl bg-primary-10 text-primary'>{icon}</div>
				<div>
					<h3 className='text-lg font-semibold text-slate-950'>{title}</h3>
					<p className='mt-1 text-sm text-slate-500'>{description}</p>
				</div>
			</div>
			<div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
				{items.map(([label, value]) => (
					<DetailItem key={label} label={label} value={value} />
				))}
			</div>
		</div>
	);
}

function IconLine({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value?: string | number | null;
}) {
	return (
		<div className='flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-slate-700'>
			<span className='text-slate-400'>{icon}</span>
			<span className='font-medium'>{label}</span>
			<span className='ml-auto min-w-0 truncate text-slate-500'>{value || 'Not set'}</span>
		</div>
	);
}

function Metric({
	label,
	value,
	helper,
}: {
	label: string;
	value: string | number;
	helper: string;
}) {
	return (
		<div className='card p-5'>
			<div className='flex items-center gap-2 text-sm font-medium text-slate-500'>
				<UsersRound size={15} />
				{label}
			</div>
			<p className='mt-3 text-2xl font-semibold text-slate-950'>{value}</p>
			<p className='mt-1 text-xs text-slate-500'>{helper}</p>
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

function formatLabel(value: string) {
	return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value?: number | null) {
	if (value === null || value === undefined) return null;
	return new Intl.NumberFormat().format(Number(value));
}

function formatPercent(value?: number | string | null) {
	if (value === null || value === undefined || value === '') return null;
	return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}
