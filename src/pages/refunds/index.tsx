import { AlertTriangle, RefreshCcw, ShieldCheck, TicketX } from 'lucide-react';
import { MetricCard } from '@/components/shared/metric-card';
import { PageHeader } from '@/components/shared/page-header';
import { useOrders } from '@/features/orders/hooks';
import { currency } from '@/lib/utils';

export function RefundsPage() {
	const { data: orders = [] } = useOrders();
	const refundedOrders = orders.filter((order) => order.status === 'refunded');
	const refundExposure = refundedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

	return (
		<section>
			<PageHeader
				title='Refunds & Disputes'
				description='Review vendor refund policy enforcement, cancelled-event refunds, chargeback evidence, and audit history.'
			/>
			<div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
				<MetricCard title='Refunded Orders' value={String(refundedOrders.length)} helper='Ticket orders already marked refunded' icon={<RefreshCcw size={22} />} />
				<MetricCard title='Refund Exposure' value={currency(refundExposure)} helper='Value returned to original payment methods' icon={<TicketX size={22} />} />
				<MetricCard title='Disputes' value='0' helper='Chargebacks requiring transaction evidence' icon={<AlertTriangle size={22} />} />
				<MetricCard title='Audit Trail' value='Ready' helper='Refund actions should be logged for compliance' icon={<ShieldCheck size={22} />} />
			</div>
		</section>
	);
}
