import { ExternalLink, ReceiptText, Ticket } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useOrders } from '@/features/orders/hooks';
import type { TicketOrderRow } from '@/features/orders/api';
import { currency } from '@/lib/utils';

const columns: ColumnDef<TicketOrderRow>[] = [
	{
		key: 'id',
		header: 'Order',
		render: (row) => (
			<div>
				<p className='font-medium text-slate-900'>{row.id.slice(0, 8)}</p>
				<p className='text-xs text-slate-500'>{row.stripeCheckoutSessionId ?? 'Local checkout'}</p>
			</div>
		),
		searchValue: (row) => row.id,
	},
	{
		key: 'customerName',
		header: 'Customer',
		render: (row) => (
			<div>
				<p className='font-medium text-slate-900'>{row.customerName}</p>
				<p className='text-xs text-slate-500'>{row.customerEmail}</p>
			</div>
		),
		searchValue: (row) => `${row.customerName} ${row.customerEmail}`,
	},
	{
		key: 'event',
		header: 'Event',
		render: (row) => row.event?.title ?? 'Unknown event',
		searchValue: (row) => row.event?.title ?? '',
	},
	{
		key: 'tickets',
		header: 'Tickets',
		render: (row) => {
			const qty = row.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0;
			return `${row.tickets?.length ?? 0}/${qty} issued`;
		},
		searchValue: (row) => String(row.tickets?.length ?? 0),
	},
	{
		key: 'total',
		header: 'Total',
		render: (row) => currency(Number(row.total ?? 0)),
		searchValue: (row) => String(row.total ?? 0),
	},
	{
		key: 'status',
		header: 'Status',
		render: (row) => <StatusBadge value={row.status} />,
		searchValue: (row) => row.status,
	},
	{
		key: 'createdAt',
		header: 'Date',
		render: (row) => new Date(row.createdAt).toLocaleDateString(),
		searchValue: (row) => row.createdAt,
	},
];

export function OrdersPage() {
	const { data: rows = [] } = useOrders();

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Orders & Tickets'
				description='Monitor Stripe checkout sessions, paid ticket orders, issued tickets, and referral attribution.'
			/>

			<DataTable
				rows={rows}
				columns={columns}
				searchPlaceholder='Search orders by ID, customer, event, or status'
			/>

			<div className='grid gap-4'>
				{rows.map((order) => (
					<article key={order.id} className='card p-5'>
						<div className='flex flex-col justify-between gap-4 md:flex-row md:items-start'>
							<div>
								<p className='text-sm font-semibold uppercase text-secondary'>
									{order.organization?.name ?? 'Vendor'} · {order.referralCode?.code ?? 'Direct sale'}
								</p>
								<h3 className='mt-1 text-lg font-semibold text-slate-950'>{order.event?.title ?? 'Ticket order'}</h3>
								<p className='mt-1 text-sm text-slate-500'>
									{order.customerName} · {order.customerEmail}
								</p>
							</div>
							<div className='flex items-center gap-3'>
								<span className='badge bg-primary-10 text-primary'>{order.status}</span>
								{order.checkoutUrl ? (
									<a
										href={order.checkoutUrl}
										target='_blank'
										rel='noreferrer'
										className='inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'>
										<ExternalLink size={15} />
										Checkout
									</a>
								) : null}
							</div>
						</div>

						<div className='mt-5 grid gap-3 md:grid-cols-2'>
							<div className='rounded-lg border border-slate-100 bg-slate-50 p-4'>
								<p className='inline-flex items-center gap-2 text-sm font-semibold text-slate-900'>
									<ReceiptText size={16} />
									Order Items
								</p>
								<div className='mt-3 space-y-2'>
									{order.items?.map((item) => (
										<div key={item.id} className='flex justify-between text-sm text-slate-600'>
											<span>{item.quantity}x {item.ticketName}</span>
											<span>{currency(Number(item.lineTotal))}</span>
										</div>
									))}
								</div>
							</div>

							<div className='rounded-lg border border-slate-100 bg-slate-50 p-4'>
								<p className='inline-flex items-center gap-2 text-sm font-semibold text-slate-900'>
									<Ticket size={16} />
									Issued Tickets
								</p>
								<div className='mt-3 flex flex-wrap gap-2'>
									{order.tickets?.length ? (
										order.tickets.map((ticket) => (
											<span key={ticket.id} className='rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700'>
												{ticket.code}
											</span>
										))
									) : (
										<p className='text-sm text-slate-500'>Tickets issue automatically after payment confirmation.</p>
									)}
								</div>
							</div>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}
