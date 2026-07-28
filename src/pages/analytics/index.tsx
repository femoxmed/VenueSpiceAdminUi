import { BarChart3, Building2, Link2, Ticket } from 'lucide-react';
import { MetricCard } from '@/components/shared/metric-card';
import { PageHeader } from '@/components/shared/page-header';
import { useAgents, useEvents, useOrganizations } from '@/features/ticketing/hooks';

export function AnalyticsPage() {
	const { data: organizations = [] } = useOrganizations();
	const { data: events = [] } = useEvents();
	const { data: agents = [] } = useAgents();

	const ticketsAvailable = events.reduce(
		(sum, event) =>
			sum +
			(event.ticketTypes?.reduce((ticketSum, ticket) => ticketSum + Number(ticket.quantity || 0), 0) ?? 0),
		0,
	);
	const ticketsSold = events.reduce(
		(sum, event) =>
			sum +
			(event.ticketTypes?.reduce((ticketSum, ticket) => ticketSum + Number(ticket.quantitySold || 0), 0) ?? 0),
		0,
	);
	const referralCodes = agents.reduce((sum, agent) => sum + (agent.referralCodes?.length ?? 0), 0);
	const conversion = ticketsAvailable ? Math.round((ticketsSold / ticketsAvailable) * 100) : 0;

	return (
		<section>
			<PageHeader
				title='Ticketing Analytics'
				description='Measure vendor onboarding, event inventory, ticket conversion, and referral distribution.'
			/>
			<div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
				<MetricCard title='Vendors' value={String(organizations.length)} helper='Organizations onboarded to the platform' icon={<Building2 size={22} />} />
				<MetricCard title='Events' value={String(events.length)} helper='Draft, published, and archived events' icon={<BarChart3 size={22} />} />
				<MetricCard title='Ticket Conversion' value={`${conversion}%`} helper={`${ticketsSold} of ${ticketsAvailable} tickets sold`} icon={<Ticket size={22} />} />
				<MetricCard title='Referral Codes' value={String(referralCodes)} helper='Agent links available for attribution' icon={<Link2 size={22} />} />
			</div>
		</section>
	);
}
