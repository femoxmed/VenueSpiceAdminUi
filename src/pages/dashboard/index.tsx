import {
	Building2,
	CalendarDays,
	CircleDollarSign,
	Link2,
	ShieldCheck,
	Ticket,
	TrendingUp,
	Users,
} from 'lucide-react';
import { MetricCard } from '@/components/shared/metric-card';
import { PageHeader } from '@/components/shared/page-header';
import { useAgents, useEvents, useOrganizations } from '@/features/ticketing/hooks';
import { currency } from '@/lib/utils';

export function DashboardPage() {
	const {
		data: organizations = [],
		isLoading: organizationsLoading,
		error: organizationsError,
	} = useOrganizations();
	const { data: events = [] } = useEvents();
	const { data: agents = [] } = useAgents();

	const publishedEvents = events.filter((event) => event.status === 'published');
	const ticketsAvailable = events.reduce(
		(sum, event) =>
			sum +
			(event.ticketTypes?.reduce(
				(ticketSum, ticket) => ticketSum + Number(ticket.quantity || 0),
				0,
			) ?? 0),
		0,
	);
	const ticketsSold = events.reduce(
		(sum, event) =>
			sum +
			(event.ticketTypes?.reduce(
				(ticketSum, ticket) => ticketSum + Number(ticket.quantitySold || 0),
				0,
			) ?? 0),
		0,
	);
	const estimatedRevenue = events.reduce(
		(sum, event) =>
			sum +
			(event.ticketTypes?.reduce(
				(ticketSum, ticket) =>
					ticketSum + Number(ticket.price || 0) * Number(ticket.quantitySold || 0),
				0,
			) ?? 0),
		0,
	);
	const referralCodes = agents.reduce(
		(sum, agent) => sum + (agent.referralCodes?.length ?? 0),
		0,
	);

	return (
		<section>
			<PageHeader
				title='Ticketing Dashboard'
				description='Track vendors, events, ticket inventory, revenue, and referral distribution.'
			/>

			<div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
				<MetricCard
					title='Organizations'
					value={String(organizations.length)}
					helper='Vendor accounts onboarded'
					icon={<Building2 size={22} />}
				/>
				<MetricCard
					title='Published Events'
					value={String(publishedEvents.length)}
					helper={`${events.length} total events`}
					icon={<CalendarDays size={22} />}
				/>
				<MetricCard
					title='Tickets Sold'
					value={`${ticketsSold}/${ticketsAvailable}`}
					helper='Confirmed inventory movement'
					icon={<Ticket size={22} />}
				/>
				<MetricCard
					title='Estimated Revenue'
					value={currency(estimatedRevenue)}
					helper='Based on confirmed ticket sales'
					icon={<CircleDollarSign size={22} />}
				/>
				<MetricCard
					title='Agents'
					value={String(agents.length)}
					helper={`${referralCodes} referral codes issued`}
					icon={<Users size={22} />}
				/>
				<MetricCard
					title='Referral Share'
					value={ticketsSold ? '0%' : '0%'}
					helper='Attribution wiring is next'
					icon={<Link2 size={22} />}
				/>
				<MetricCard
					title='Conversion'
					value='0%'
					helper='Checkout analytics pending Stripe flow'
					icon={<TrendingUp size={22} />}
				/>
				<MetricCard
					title='Compliance'
					value='Ready'
					helper='Tenant-aware modules and audit foundation'
					icon={<ShieldCheck size={22} />}
				/>
			</div>

			<div className='mt-6 grid gap-6 xl:grid-cols-2'>
				<div className='card p-6'>
					<div className='flex items-center justify-between gap-4'>
						<h3 className='text-lg font-semibold text-slate-950'>Organizations</h3>
						<span className='badge bg-primary-10 text-primary'>
							{organizations.length} total
						</span>
					</div>
					<div className='mt-4 space-y-3'>
						{organizationsLoading ? (
							<p className='text-sm text-slate-500'>Loading organizations...</p>
						) : organizationsError ? (
							<p className='rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700'>
								{organizationsError instanceof Error
									? organizationsError.message
									: 'Unable to fetch organizations.'}
							</p>
						) : organizations.length ? (
							organizations.slice(0, 5).map((organization) => (
								<div
									key={organization.id}
									className='flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-4 py-3'>
									<div className='min-w-0'>
										<p className='truncate font-medium text-slate-900'>
											{organization.name}
										</p>
										<p className='truncate text-sm text-slate-500'>
											{organization.contactEmail || `/${organization.slug}`}
										</p>
									</div>
									<span className='badge bg-tertiary-10 text-tertiary-80'>
										{organization.status}
									</span>
								</div>
							))
						) : (
							<p className='text-sm text-slate-500'>No organizations have been created yet.</p>
						)}
					</div>
				</div>

				<div className='card p-6'>
					<h3 className='text-lg font-semibold text-slate-950'>Upcoming Events</h3>
					<div className='mt-4 space-y-3'>
						{events.slice(0, 5).map((event) => (
							<div
								key={event.id}
								className='flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3'>
								<div>
									<p className='font-medium text-slate-900'>{event.title}</p>
									<p className='text-sm text-slate-500'>
										{event.organization?.name ?? 'No vendor'} ·{' '}
										{new Date(event.startsAt).toLocaleDateString()}
									</p>
								</div>
								<span className='badge bg-primary-10 text-primary'>{event.status}</span>
							</div>
						))}
						{!events.length ? (
							<p className='text-sm text-slate-500'>No events have been created yet.</p>
						) : null}
					</div>
				</div>

				<div className='card p-6'>
					<h3 className='text-lg font-semibold text-slate-950'>Referral Network</h3>
					<div className='mt-4 space-y-3'>
						{agents.slice(0, 5).map((agent) => (
							<div
								key={agent.id}
								className='flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3'>
								<div>
									<p className='font-medium text-slate-900'>{agent.fullName}</p>
									<p className='text-sm text-slate-500'>{agent.organization?.name ?? agent.email}</p>
								</div>
								<span className='badge bg-tertiary-10 text-tertiary-80'>
									{agent.referralCodes?.length ?? 0} codes
								</span>
							</div>
						))}
						{!agents.length ? (
							<p className='text-sm text-slate-500'>No agents have been onboarded yet.</p>
						) : null}
					</div>
				</div>
			</div>
		</section>
	);
}
