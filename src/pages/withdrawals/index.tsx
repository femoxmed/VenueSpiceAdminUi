import { useState } from 'react';
import { CheckCircle2, Clock3, DollarSign, Send, XCircle } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { MetricCard } from '@/components/shared/metric-card';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/components/shared/toast-provider';
import type { WithdrawalRequest } from '@/features/withdrawals/api';
import {
	useApproveWithdrawalRequest,
	usePayWithdrawalRequest,
	useRejectWithdrawalRequest,
	useStripeBalance,
	useWithdrawalRequests,
} from '@/features/withdrawals/hooks';
import { currency, formatDate } from '@/lib/utils';

type ReviewMode = 'approve' | 'reject' | 'pay';

export function WithdrawalsPage() {
	const { push: pushToast } = useToast();
	const { data: requests = [], isLoading } = useWithdrawalRequests();
	const stripeBalance = useStripeBalance();
	const approve = useApproveWithdrawalRequest();
	const reject = useRejectWithdrawalRequest();
	const pay = usePayWithdrawalRequest();
	const [selected, setSelected] = useState<WithdrawalRequest | null>(null);
	const [reviewMode, setReviewMode] = useState<ReviewMode | null>(null);
	const [note, setNote] = useState('');

	const pending = requests.filter((request) => request.status === 'pending_review');
	const approved = requests.filter((request) => request.status === 'approved');
	const paid = requests.filter((request) => request.status === 'paid');
	const pendingAmount = pending.reduce((sum, request) => sum + Number(request.amount || 0), 0);
	const paidAmount = paid.reduce((sum, request) => sum + Number(request.amount || 0), 0);
	const stripeAvailable = sumStripeBalance(stripeBalance.data?.available);
	const stripePending = sumStripeBalance(stripeBalance.data?.pending);

	const columns: ColumnDef<WithdrawalRequest>[] = [
		{
			key: 'createdAt',
			header: 'Requested',
			render: (row) => formatDate(row.createdAt),
			searchValue: (row) => row.createdAt,
			sortValue: (row) => new Date(row.createdAt),
		},
		{
			key: 'organization',
			header: 'Payee / Event',
			render: (row) => (
				<div>
					<p className='font-medium text-slate-900'>{row.organization?.name ?? 'Payee'}</p>
					<div className='flex items-center gap-1.5'>
						<span className='text-xs font-medium text-indigo-600'>{isInfluencerWithdrawal(row) ? 'Influencer' : 'Organizer'}</span>
						{Boolean(row.event?.title || (row.metadata?.eventTitle as string)) ? (
							<>
								<span className='text-slate-300'>•</span>
								<span className='text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded'>
									{row.event?.title || (row.metadata?.eventTitle as string)}
								</span>
							</>
						) : (
							<>
								<span className='text-slate-300'>•</span>
								<span className='text-xs text-slate-400'>All Events</span>
							</>
						)}
					</div>
					<p className='text-xs text-slate-500'>{row.organization?.contactEmail ?? row.requestedByEmail ?? 'No email'}</p>
				</div>
			),
			searchValue: (row) => `${row.organization?.name ?? ''} ${row.organization?.contactEmail ?? ''} ${row.event?.title ?? ''}`,
			sortValue: (row) => row.organization?.name ?? '',
		},
		{
			key: 'amount',
			header: 'Amount',
			render: (row) => <div><div>{currency(row.amount, row.currency)}</div><div className='text-xs text-slate-500'>{withdrawalTypeLabel(row)}</div></div>,
			searchValue: (row) => String(row.amount),
			sortValue: (row) => Number(row.amount || 0),
		},
		{
			key: 'snapshot',
			header: 'Available snapshot',
			render: (row) => currency(row.availableBalanceSnapshot, row.currency),
			searchValue: (row) => String(row.availableBalanceSnapshot),
			sortValue: (row) => Number(row.availableBalanceSnapshot || 0),
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
					<button className='rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50' onClick={() => setSelected(row)}>
						View
					</button>
					{['pending_review', 'failed'].includes(row.status) ? (
						<button className='rounded-lg px-2 py-1 text-sm font-medium text-emerald-600 hover:bg-emerald-50' onClick={() => openReview(row, 'approve')}>
							Approve
						</button>
					) : null}
					{['pending_review', 'approved', 'failed'].includes(row.status) ? (
						<button className='rounded-lg px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50' onClick={() => openReview(row, 'pay')}>
							Pay
						</button>
					) : null}
					{['pending_review', 'approved', 'failed'].includes(row.status) ? (
						<button className='rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50' onClick={() => openReview(row, 'reject')}>
							Reject
						</button>
					) : null}
				</div>
			),
		},
	];

	function openReview(request: WithdrawalRequest, mode: ReviewMode) {
		setSelected(request);
		setReviewMode(mode);
		setNote('');
	}

	async function submitReview() {
		if (!selected || !reviewMode) return;
		try {
			if (reviewMode === 'approve') {
				await approve.mutateAsync({ id: selected.id, note });
				pushToast({ title: 'Withdrawal approved', description: 'The withdrawal request has been approved for payout.', variant: 'success' });
			} else if (reviewMode === 'reject') {
				await reject.mutateAsync({ id: selected.id, note });
				pushToast({ title: 'Withdrawal rejected', description: 'The withdrawal request has been rejected.' });
			} else {
				await pay.mutateAsync(selected.id);
				pushToast({ title: 'Payout released', description: 'Transfer was initiated successfully.', variant: 'success' });
			}
			setSelected(null);
			setReviewMode(null);
			setNote('');
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || 'Failed to process withdrawal action.';
			pushToast({
				title: reviewMode === 'pay' ? 'Payment failed' : reviewMode === 'approve' ? 'Approval failed' : 'Rejection failed',
				description: Array.isArray(message) ? message.join(', ') : String(message),
				variant: 'error',
			});
		}
	}

	const busy = approve.isPending || reject.isPending || pay.isPending;

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Withdrawals'
				description='Review organizer and influencer withdrawal requests, check available balance snapshots, and release approved payouts.'
			/>
			<div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
				<MetricCard title='Pending Review' value={String(pending.length)} helper={currency(pendingAmount)} icon={<Clock3 size={22} />} />
				<MetricCard title='Stripe Available' value={currency(stripeAvailable)} helper={stripeBalance.isLoading ? 'Loading Stripe balance' : 'Platform transfer balance'} icon={<DollarSign size={22} />} />
				<MetricCard title='Stripe Pending' value={currency(stripePending)} helper='Not yet available for transfer' icon={<Clock3 size={22} />} />
				<MetricCard title='Paid Requests' value={String(paid.length)} helper={currency(paidAmount)} icon={<Send size={22} />} />
			</div>

			<DataTable
				rows={requests}
				columns={columns}
				pageSize={10}
				searchPlaceholder='Search withdrawals by organizer, status, email, or amount'
				actions={<div className='rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500'>{isLoading ? 'Loading...' : `${requests.length} requests`}</div>}
			/>

			<Modal
				open={Boolean(selected)}
				onClose={() => {
					setSelected(null);
					setReviewMode(null);
					setNote('');
				}}
				title={reviewMode ? `${reviewMode === 'pay' ? 'Pay' : reviewMode === 'approve' ? 'Approve' : 'Reject'} withdrawal` : 'Withdrawal details'}
				description={selected ? `${selected.organization?.name ?? 'Payee'} requested ${currency(selected.amount, selected.currency)}` : undefined}
				footer={
					reviewMode && selected ? (
						<>
							<button className='rounded-xl border border-slate-200 px-4 py-2 text-sm' onClick={() => setReviewMode(null)}>
								Cancel
							</button>
							<button
								disabled={busy}
								className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white ${reviewMode === 'reject' ? 'bg-red-600' : reviewMode === 'pay' ? 'bg-indigo-600' : 'bg-emerald-600'}`}
								onClick={submitReview}>
								{reviewMode === 'reject' ? <XCircle size={16} /> : reviewMode === 'pay' ? <Send size={16} /> : <CheckCircle2 size={16} />}
								{busy ? 'Saving...' : reviewMode === 'pay' ? 'Pay request' : reviewMode === 'approve' ? 'Approve request' : 'Reject request'}
							</button>
						</>
					) : null
				}>
				{selected ? (
					<div className='space-y-4 text-sm'>
						<div className='rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-4'>
							<p className='text-xs font-semibold uppercase tracking-wider text-indigo-700'>Financial Breakdown</p>
							<div className='mt-3 grid gap-3 sm:grid-cols-3'>
								<div className='rounded-lg bg-white p-3 shadow-xs border border-slate-100'>
									<p className='text-xs font-medium text-slate-500'>Requested Gross</p>
									<p className='mt-1 text-lg font-semibold text-slate-900'>{currency(selected.amount, selected.currency)}</p>
									<p className='text-xs text-slate-400'>Organizer withdrawal claim</p>
								</div>
								<div className='rounded-lg bg-white p-3 shadow-xs border border-slate-100'>
									<p className='text-xs font-medium text-slate-500'>Venue Spice Fee</p>
									<p className='mt-1 text-lg font-semibold text-emerald-700'>{currency(Number(selected.feeAmount || 0), selected.currency)}</p>
									<p className='text-xs text-slate-400'>
										{Number(selected.feePercent || 0) > 0 ? `${(Number(selected.feePercent) * 100).toFixed(Number(selected.feePercent) * 100 % 1 === 0 ? 0 : 1)}% platform retention` : 'No fee deducted'}
									</p>
								</div>
								<div className='rounded-lg bg-white p-3 shadow-xs border border-slate-100'>
									<p className='text-xs font-medium text-slate-500'>Organizer Receives</p>
									<p className='mt-1 text-lg font-semibold text-indigo-700'>{currency(Number(selected.netAmount ?? (Number(selected.amount) - Number(selected.feeAmount || 0))), selected.currency)}</p>
									<p className='text-xs text-slate-400'>Net payout via Stripe</p>
								</div>
							</div>
						</div>

						<div className='grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2'>
							<Detail label='Payee type' value={isInfluencerWithdrawal(selected) ? 'Influencer' : 'Organizer'} />
							<Detail label='Payee' value={selected.organization?.name ?? 'Unknown'} />
							<Detail label='Attributed event' value={selected.event?.title || (selected.metadata?.eventTitle as string) || 'All Events (Org-wide)'} />
							<Detail label='Requested by' value={selected.requestedByEmail ?? 'Unknown'} />
							<Detail label='Withdrawal type' value={withdrawalTypeLabel(selected)} />
							<Detail label='Available at request' value={currency(selected.availableBalanceSnapshot, selected.currency)} />
							<Detail label='Status' value={selected.status.replace(/_/g, ' ')} />
							<Detail label='Stripe account' value={selected.stripeAccountId ?? 'Not available'} />
							<Detail label='Stripe transfer' value={selected.stripeTransferId ?? 'Not paid yet'} />
							<Detail label='Stripe payout' value={selected.stripePayoutId ?? 'Not paid yet'} />
							<Detail label='Requested date' value={formatDate(selected.createdAt)} />
						</div>
						<DetailBlock label='Payee note' value={selected.requesterNote || 'No note provided.'} />
						{selected.status === 'failed' ? (
							<>
								<DetailBlock label='Failure reason' value={adminWithdrawalFailureReason(selected)} />
								<DetailBlock label='Payee-facing message' value={organizerWithdrawalMessage(selected)} />
							</>
						) : (
							<DetailBlock label='Admin note' value={selected.adminNote || 'No admin note yet.'} />
						)}
						{reviewMode === 'approve' ? (
							<div className='rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-900'>
								<p className='font-medium'>Approval summary:</p>
								<p className='mt-1 text-xs text-emerald-800 leading-relaxed'>
									Approving this request verifies that the organizer's account has sufficient eligible balance ({currency(Number(selected.amount), selected.currency)}). Once approved, the request moves to the admin payout queue where an admin can release the net transfer of {currency(Number(selected.netAmount ?? (Number(selected.amount) - Number(selected.feeAmount || 0))), selected.currency)}.
								</p>
							</div>
						) : null}
						{reviewMode && reviewMode !== 'pay' ? (
							<label className='block'>
								<span className='font-medium text-slate-900'>Review note</span>
								<textarea
									value={note}
									onChange={(event) => setNote(event.target.value)}
									className='mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-secondary'
									placeholder='Add an optional internal note for this decision'
								/>
							</label>
						) : null}
						{reviewMode === 'pay' ? (
							<div className='space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900'>
								<p className='font-medium'>Payment confirmation:</p>
								<p className='text-xs text-amber-800 leading-relaxed'>
									{isInfluencerWithdrawal(selected)
										? 'Paying this request will attempt a Stripe transfer and mark the reserved influencer commissions as withdrawn.'
										: `Paying this request will transfer ${currency(Number(selected.netAmount ?? (Number(selected.amount) - Number(selected.feeAmount || 0))), selected.currency)} directly to the organizer's connected Stripe account (${selected.stripeAccountId ?? 'account'}). Venue Spice retains ${currency(Number(selected.feeAmount || 0), selected.currency)} as platform fees. Current Stripe platform available balance is ${currency(stripeAvailable)}.`}
								</p>
							</div>
						) : null}
					</div>
				) : null}
			</Modal>
		</section>
	);
}

function adminWithdrawalFailureReason(request: WithdrawalRequest) {
	const value = request.metadata?.adminMessage ?? request.metadata?.stripeErrorMessage ?? request.metadata?.errorMessage ?? request.adminNote;
	return typeof value === 'string' && value.trim() ? value : 'Payout failed.';
}

function organizerWithdrawalMessage(request: WithdrawalRequest) {
	const value = request.metadata?.userMessage ?? request.adminNote ?? request.metadata?.errorMessage;
	return typeof value === 'string' && value.trim() ? value : 'No organizer message yet.';
}

function isInfluencerWithdrawal(request: WithdrawalRequest) {
	return request.metadata?.beneficiaryType === 'influencer';
}

	function withdrawalTypeLabel(request: WithdrawalRequest) {
		const feePct = Number(request.feePercent ?? 0);
		const feeLabel = feePct > 0 ? ` (${(feePct * 100).toFixed(feePct * 100 % 1 === 0 ? 0 : 1)}% fee)` : ' (no fee)';
		if (request.withdrawalType === 'instant') return `Instant${feeLabel}`;
		if (request.withdrawalType === 'early') return `Early standard${feeLabel}`;
		return 'Standard (no fee after hold)';
	}

function sumStripeBalance(items?: Array<{ amount: number; currency: string }>) {
	return (items ?? [])
		.filter((item) => item.currency === 'USD')
		.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className='text-xs font-medium uppercase tracking-wide text-slate-500'>{label}</p>
			<p className='mt-1 break-words text-slate-900'>{value}</p>
		</div>
	);
}

function DetailBlock({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className='font-medium text-slate-900'>{label}</p>
			<p className='mt-1 rounded-xl border border-slate-200 p-3 text-slate-600'>{value}</p>
		</div>
	);
}
