import { AdminRefundTools } from './admin-refund-tools';
import { useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCcw, ShieldCheck, TicketX, XCircle } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { MetricCard } from '@/components/shared/metric-card';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useRefundRequests, useApproveRefundRequest, useDeclineRefundRequest } from '@/features/refunds/hooks';
import { useQuery } from '@tanstack/react-query';
import { getRefundDiagnostics, reconcileStripeRefund, reconcileExternalRefund, cancelRefundRequest, type RefundRequest } from '@/features/refunds/api';
import { currency } from '@/lib/utils';

export function RefundsPage() {
	const { data: refunds = [], isLoading } = useRefundRequests();
	const approve = useApproveRefundRequest();
	const decline = useDeclineRefundRequest();
	const [requestToApprove,setRequestToApprove]=useState<RefundRequest|null>(null);
	const [selected, setSelected] = useState<RefundRequest | null>(null);
	const [reviewMode, setReviewMode] = useState<'approve' | 'decline' | null>(null);
	const [note, setNote] = useState('');

	const [diagnosticId, setDiagnosticId] = useState<string | null>(null);
	const diagnostics = useQuery({
		queryKey: ['refund-diagnostics', diagnosticId],
		queryFn: () => getRefundDiagnostics(diagnosticId!),
		enabled: !!diagnosticId, retry: false, refetchOnWindowFocus: false,
	});
	const result = diagnostics.data;
	const reconcileStripe = async (id: string) => { await reconcileStripeRefund(id); window.location.reload(); };
	const reconcileExternal = async (row: RefundRequest) => { const method = window.prompt('External refund method (cash, bank transfer, other):'); if (!method) return; const reference = window.prompt('External reference (optional):') || undefined; const note = window.prompt('Reconciliation note (required):'); if (!note) return; await reconcileExternalRefund(row.id, { amount: Number(row.amount), method, reference, note }); window.location.reload(); };
	const cancelRequest = async (id: string) => { const reason = window.prompt('Cancellation reason (required):'); if (!reason) return; await cancelRefundRequest(id, reason); window.location.reload(); };

	const refunded = refunds.filter((refund) => refund.status === 'succeeded');
	const requested = refunds.filter((refund) => refund.status === 'requested');
	const refundExposure = refunded.reduce((sum, refund) => sum + Number(refund.amount || 0), 0);
	const requestedExposure = requested.reduce((sum, refund) => sum + Number(refund.amount || 0), 0);

	const columns: ColumnDef<RefundRequest>[] = [
		{
			key: 'createdAt',
			header: 'Requested',
			render: (row) => new Date(row.createdAt).toLocaleString(),
			searchValue: (row) => row.createdAt,
			sortValue: (row) => new Date(row.createdAt),
		},
		{
			key: 'customer',
			header: 'Customer',
			render: (row) => (
				<div>
					<p className='font-medium text-slate-900'>{row.order?.customerName ?? row.customerEmail}</p>
					<p className='text-xs text-slate-500'>{row.customerEmail}</p>
				</div>
			),
			searchValue: (row) => `${row.order?.customerName ?? ''} ${row.customerEmail}`,
			sortValue: (row) => row.customerEmail,
		},
		{
			key: 'event',
			header: 'Event',
			render: (row) => row.order?.event?.title ?? 'Unknown event',
			searchValue: (row) => row.order?.event?.title ?? '',
			sortValue: (row) => row.order?.event?.title ?? '',
		},
		{
			key: 'amount',
			header: 'Amount',
			render: (row) => currency(Number(row.amount || 0)),
			searchValue: (row) => String(row.amount),
			sortValue: (row) => Number(row.amount || 0),
		},
		{
			key: 'status',
			header: 'Status',
			render: (row) => <StatusBadge value={row.status} />,
			searchValue: (row) => row.status,
			sortValue: (row) => row.status,
		},
		{
			key: 'actions',
			header: 'Actions',
			sortable: false,
			render: (row) => (
				<div className='flex flex-wrap items-center gap-2'>
					<button
						className='rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50'
						onClick={() => setSelected(row)}>
						View
					</button>
					<button type="button" className="rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50" onClick={() => setDiagnosticId(row.id)}>Diagnose refund</button>
					<button type="button" className="rounded-lg px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50" onClick={() => reconcileStripe(row.id)}>Retry Stripe reconciliation</button>
					<button type="button" className="rounded-lg px-2 py-1 text-sm font-medium text-emerald-600 hover:bg-emerald-50" onClick={() => reconcileExternal(row)}>External refund</button>
					{!['succeeded','manually_reconciled','cancelled'].includes(row.status) ? <button type="button" className="rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50" onClick={() => cancelRequest(row.id)}>Cancel request</button> : null}
					{row.status === 'requested' ? (
						<>
							<button
								className='rounded-lg px-2 py-1 text-sm font-medium text-emerald-600 hover:bg-emerald-50'
								onClick={() => {
									setRequestToApprove(row);
								}}>
								Approve
							</button>
							<button
								className='rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50'
								onClick={() => {
									setSelected(row);
									setReviewMode('decline');
									setNote('');
								}}>
								Decline
							</button>
						</>
					) : null}
				</div>
			),
		},
	];

	async function submitReview() {
		if (!selected || !reviewMode) return;
		if (reviewMode === 'approve') {
			await approve.mutateAsync({ id: selected.id, note });
		} else {
			await decline.mutateAsync({ id: selected.id, note });
		}
		setReviewMode(null);
		setSelected(null);
		setNote('');
	}

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Refunds & Disputes'
				description='Review refund requests, enforce cutoff rules, process Stripe refunds, and keep audit history.'
			/>
			<div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
				<MetricCard title='Pending Requests' value={String(requested.length)} helper={currency(requestedExposure)} icon={<RefreshCcw size={22} />} />
				<MetricCard title='Refunded Orders' value={String(refunded.length)} helper='Orders with completed refunds' icon={<TicketX size={22} />} />
				<MetricCard title='Refund Exposure' value={currency(refundExposure)} helper='Value returned to payment methods' icon={<CheckCircle2 size={22} />} />
				<MetricCard title='Disputes' value='0' helper='Chargebacks requiring evidence' icon={<AlertTriangle size={22} />} />
			</div>

			<Modal open={!!diagnosticId} onClose={() => setDiagnosticId(null)} title="Refund diagnostics" description="Reads Venue Spice and Stripe records. No money is moved.">
				{diagnostics.isFetching ? <p role="status">Checking this refund…</p> : diagnostics.isError ? <p role="alert">Could not load diagnostics. <button onClick={() => diagnostics.refetch()}>Try again</button></p> : result ? <div className="space-y-3 text-sm">
					<p><strong>{result.finding.replace(/_/g,' ')}</strong> · {result.detail}</p>
					<p>{result.retry}</p>
					<dl className="grid grid-cols-[auto_1fr] gap-2 break-all">
						<dt>Order</dt><dd>{result.orderId}</dd><dt>Refund request</dt><dd>{result.id}</dd>
						<dt>Venue Spice</dt><dd>{result.localStatus} · {new Intl.NumberFormat(undefined,{style:'currency',currency:result.currency}).format(result.localAmount)}</dd>
						<dt>Approval time</dt><dd>{result.reviewedAt ? new Date(result.reviewedAt).toISOString() : 'Not recorded'}</dd>
						<dt>Approval audit entry</dt><dd>{result.approvalAuditFound ? 'Found' : 'Not found'}</dd>
						<dt>Stripe payment</dt><dd>{result.paymentId || 'Not recorded'}</dd>
						<dt>Saved refund ID</dt><dd>{result.localRefundId || 'Not recorded'}</dd>
						<dt>Saved Stripe error</dt><dd>{result.providerError || 'None recorded'}</dd>
					</dl>
					{result.providerRefunds.map(p => <p key={p.id}>{p.id} · {p.status} · {p.amount} {p.currency.toUpperCase()}</p>)}
				</div> : null}
			</Modal>
			<AdminRefundTools requestToApprove={requestToApprove} onCloseRequest={()=>setRequestToApprove(null)} />

			<DataTable
				rows={refunds}
				columns={columns}
				pageSize={10}
				searchPlaceholder='Search refunds by customer, event, status, or amount'
				actions={
					<div className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500'>
						<ShieldCheck size={16} />
						{isLoading ? 'Loading...' : `${refunds.length} requests`}
					</div>
				}
			/>

			<Modal
				open={Boolean(selected)}
				onClose={() => {
					setSelected(null);
					setReviewMode(null);
					setNote('');
				}}
				title={reviewMode ? `${reviewMode === 'approve' ? 'Approve' : 'Decline'} refund` : 'Refund details'}
				description={selected ? `Order ${selected.orderId}` : undefined}
				footer={
					reviewMode && selected ? (
						<>
							<button className='rounded-xl border border-slate-200 px-4 py-2 text-sm' onClick={() => setReviewMode(null)}>
								Cancel
							</button>
							<button
								disabled={approve.isPending || decline.isPending}
								className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white ${reviewMode === 'approve' ? 'bg-emerald-600' : 'bg-red-600'}`}
								onClick={submitReview}>
								{reviewMode === 'approve' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
								{approve.isPending || decline.isPending ? 'Saving...' : reviewMode === 'approve' ? 'Approve refund' : 'Decline refund'}
							</button>
						</>
					) : null
				}>
				{selected ? (
					<div className='space-y-4 text-sm'>
						<div className='grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2'>
							<Detail label='Customer' value={`${selected.order?.customerName ?? 'Unknown'} (${selected.customerEmail})`} />
							<Detail label='Event' value={selected.order?.event?.title ?? 'Unknown event'} />
							<Detail label='Amount' value={currency(Number(selected.amount || 0))} />
							<Detail label='Status' value={selected.status} />
                            {selected.policySnapshot ? <>
                             <Detail label='Cancellation reason' value={selected.policySnapshot.cancellationReason.replace(/_/g,' ')} />
                             <Detail label='Processing fee retained' value={currency(selected.policySnapshot.retainedProcessingFee)} />
                             <Detail label='Tickets / add-ons refunded' value={currency(selected.policySnapshot.refundedSubtotal)} />
                             <Detail label='Buyer fees refunded' value={currency(selected.policySnapshot.refundedFees)} />
                             {selected.policySnapshot.refundComponents ? <>
                              <Detail label='Service fee refunded' value={currency(selected.policySnapshot.refundComponents.serviceFee)} />
                              <Detail label='Processing fee refunded' value={currency(selected.policySnapshot.refundComponents.processingFee)} />
                              <Detail label='Admin allocation' value={selected.policySnapshot.adminOverride ? 'Custom selection' : 'Policy recommendation'} />
                             </> : null}
                             <Detail label='Tax refunded' value={currency(selected.policySnapshot.taxPortion)} />
                             <Detail label='Total retained' value={currency(selected.policySnapshot.totalRetained)} />
                            </> : null}
							<Detail label='Stripe refund' value={selected.stripeRefundId ?? 'Not processed'} />
							<Detail label='Requested' value={new Date(selected.createdAt).toLocaleString()} />
						</div>
						<div>
							<p className='font-medium text-slate-900'>Customer reason</p>
							<p className='mt-1 rounded-xl border border-slate-200 p-3 text-slate-600'>{selected.reason || 'No reason provided.'}</p>
						</div>
						{reviewMode ? (
							<label className='block'>
								<span className='font-medium text-slate-900'>Review note</span>
								<textarea
									value={note}
									onChange={(event) => setNote(event.target.value)}
									className='mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-secondary'
									placeholder='Add an internal note for this refund decision'
								/>
							</label>
						) : null}
					</div>
				) : null}
			</Modal>
		</section>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className='text-xs font-medium uppercase tracking-wide text-slate-500'>{label}</p>
			<p className='mt-1 break-words text-slate-900'>{value}</p>
		</div>
	);
}
