import { CircleDollarSign, Receipt, RefreshCcw, Ticket } from 'lucide-react';
import { MetricCard } from '@/components/shared/metric-card';
import { PageHeader } from '@/components/shared/page-header';
import { useEvents } from '@/features/ticketing/hooks';
import { useOrders } from '@/features/orders/hooks';
import { currency } from '@/lib/utils';

export function RevenuePage() {
	const { data: events = [] } = useEvents();
	const { data: orders = [] } = useOrders();
	const paidOrders = orders.filter((order) => order.status === 'paid');
	const estimatedRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
	const ticketsSold = events.reduce(
		(sum, event) =>
			sum +
			(event.ticketTypes?.reduce((ticketSum, ticket) => ticketSum + Number(ticket.quantitySold || 0), 0) ?? 0),
		0,
	);

	return (
		<section>
			<PageHeader
				title='Revenue'
				description='Track Stripe-backed ticket revenue, paid orders, ticket volume, and refund exposure.'
			/>
			<div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
				<MetricCard title='Ticket Revenue' value={currency(estimatedRevenue)} helper='Confirmed paid ticket orders' icon={<CircleDollarSign size={22} />} />
				<MetricCard title='Paid Orders' value={String(paidOrders.length)} helper='Checkout sessions confirmed as paid' icon={<Receipt size={22} />} />
				<MetricCard title='Tickets Sold' value={String(ticketsSold)} helper='Issued or payment-confirmed ticket quantity' icon={<Ticket size={22} />} />
				<MetricCard title='Refund Review' value='0' helper='Refunds and disputes awaiting action' icon={<RefreshCcw size={22} />} />
			</div>
		</section>
	);
}
