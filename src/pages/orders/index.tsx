import { ExternalLink, LoaderCircle, ReceiptText, RefreshCw, Ticket, X } from 'lucide-react';
import { useState } from 'react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useOrders, useReconcilePendingStripeOrders } from '@/features/orders/hooks';
import type { StripeReconciliationResult, TicketOrderRow } from '@/features/orders/api';
import { useToast } from '@/components/shared/toast-provider';
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
	const [statusFilter, setStatusFilter] = useState('paid');
	const [reconciliationResult, setReconciliationResult] = useState<StripeReconciliationResult | null>(null);
	const { data: rows = [] } = useOrders(statusFilter);
	const reconcile = useReconcilePendingStripeOrders();
	const toast = useToast();

	const handleReconcile = () => {
		if (!window.confirm('Check every pending Stripe ticket order and reconcile it with Stripe?')) return;
		reconcile.mutate(undefined, {
			onSuccess: (result) => {
				setReconciliationResult(result);
				toast.push({
					title: 'Stripe reconciliation complete',
					description: `${result.scanned} checked: ${result.paid} paid, ${result.cancelled} cancelled, ${result.pending} still pending${result.failed ? `, ${result.failed} failed` : ''}.`,
					variant: result.failed ? 'error' : 'success',
				});
			},
			onError: (error) => toast.push({
				title: 'Reconciliation failed',
				description: error instanceof Error ? error.message : 'Unable to check pending Stripe orders.',
				variant: 'error',
			}),
		});
	};

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Orders & Tickets'
				description='Monitor Stripe checkout sessions, paid ticket orders, issued tickets, and referral attribution.'
				action={
					<button
						type='button'
						onClick={handleReconcile}
						disabled={reconcile.isPending}
						className='inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'>
						{reconcile.isPending ? <LoaderCircle size={16} className='animate-spin' /> : <RefreshCw size={16} />}
						{reconcile.isPending ? 'Reconciling...' : 'Reconcile Stripe'}
					</button>
				}
			/>

			<DataTable
				rows={rows}
				columns={columns}
				searchPlaceholder='Search orders by ID, customer, event, or status'
				filters={
					<select
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value)}
						className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary'>
						<option value='all'>All statuses</option>
						<option value='paid'>Paid</option>
						<option value='pending'>Pending</option>
						<option value='refunded'>Refunded</option>
						<option value='cancelled'>Cancelled</option>
					</select>
				}
				actions={<span className='text-sm text-slate-500'>{rows.length} orders</span>}
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

			{reconciliationResult ? (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4' role='dialog' aria-modal='true' aria-labelledby='reconciliation-title'>
					<div className='flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl'>
						<div className='flex items-start justify-between border-b border-slate-200 p-5'>
							<div>
								<h3 id='reconciliation-title' className='text-lg font-semibold text-slate-950'>Stripe reconciliation results</h3>
								<p className='mt-1 text-sm text-slate-500'>
									{reconciliationResult.scanned} checked · {reconciliationResult.paid} recovered · {reconciliationResult.cancelled} cancelled · {reconciliationResult.pending} pending · {reconciliationResult.failed} failed
								</p>
							</div>
							<button type='button' onClick={() => setReconciliationResult(null)} className='rounded-lg p-2 text-slate-500 hover:bg-slate-100' aria-label='Close results'>
								<X size={18} />
							</button>
						</div>
						<div className='overflow-auto p-5'>
							{reconciliationResult.results.length ? (
								<div className='overflow-hidden rounded-lg border border-slate-200'>
									<table className='w-full min-w-[720px] text-left text-sm'>
										<thead className='bg-slate-50 text-xs uppercase text-slate-500'>
											<tr><th className='px-4 py-3'>Order</th><th className='px-4 py-3'>Customer / Event</th><th className='px-4 py-3'>Amount</th><th className='px-4 py-3'>Outcome</th><th className='px-4 py-3'>Details</th><th className='px-4 py-3'>Stripe</th></tr>
										</thead>
										<tbody className='divide-y divide-slate-100'>
											{reconciliationResult.results.map((result) => (
												<tr key={result.orderId}>
													<td className='px-4 py-3 font-mono text-xs text-slate-700'>{result.orderId.slice(0, 8)}</td>
													<td className='px-4 py-3'><p className='font-medium text-slate-900'>{result.customerName}</p><p className='text-xs text-slate-500'>{result.eventTitle}</p></td>
													<td className='whitespace-nowrap px-4 py-3'>{currency(result.amount, result.currency)}</td>
													<td className='px-4 py-3'><StatusBadge value={result.outcome === 'paid' ? 'recovered' : result.outcome} /></td>
													<td className='max-w-xs px-4 py-3 text-slate-600'>{result.reason}</td>
													<td className='px-4 py-3'><a href={`https://dashboard.stripe.com/search?query=${encodeURIComponent(result.sessionId)}`} target='_blank' rel='noreferrer' className='inline-flex items-center gap-1 font-medium text-secondary hover:underline'>Open <ExternalLink size={13} /></a></td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : <p className='py-8 text-center text-sm text-slate-500'>No pending Stripe orders were found.</p>}
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
}
