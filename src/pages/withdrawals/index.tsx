import { useState } from 'react';
import { CheckCircle2, Clock3, DollarSign, Send, XCircle } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { MetricCard } from '@/components/shared/metric-card';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
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
			header: 'Organizer',
			render: (row) => (
				<div>
					<p className='font-medium text-slate-900'>{row.organization?.name ?? 'Organizer'}</p>
					<p className='text-xs text-slate-500'>{row.organization?.contactEmail ?? row.requestedByEmail ?? 'No email'}</p>
				</div>
			),
			searchValue: (row) => `${row.organization?.name ?? ''} ${row.organization?.contactEmail ?? ''}`,
			sortValue: (row) => row.organization?.name ?? '',
		},
		{
			key: 'amount',
			header: 'Amount',
			render: (row) => currency(row.amount, row.currency),
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
		if (reviewMode === 'approve') {
			await approve.mutateAsync({ id: selected.id, note });
		} else if (reviewMode === 'reject') {
			await reject.mutateAsync({ id: selected.id, note });
		} else {
			await pay.mutateAsync(selected.id);
		}
		setSelected(null);
		setReviewMode(null);
		setNote('');
	}

	const busy = approve.isPending || reject.isPending || pay.isPending;

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Withdrawals'
				description='Review organizer withdrawal requests, check available balance snapshots, and release approved payouts.'
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
				description={selected ? `${selected.organization?.name ?? 'Organizer'} requested ${currency(selected.amount, selected.currency)}` : undefined}
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
						<div className='grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2'>
							<Detail label='Organizer' value={selected.organization?.name ?? 'Unknown'} />
							<Detail label='Requested by' value={selected.requestedByEmail ?? 'Unknown'} />
							<Detail label='Amount' value={currency(selected.amount, selected.currency)} />
							<Detail label='Available at request' value={currency(selected.availableBalanceSnapshot, selected.currency)} />
							<Detail label='Status' value={selected.status.replace(/_/g, ' ')} />
							<Detail label='Stripe account' value={selected.stripeAccountId ?? 'Not available'} />
							<Detail label='Stripe transfer' value={selected.stripeTransferId ?? 'Not paid yet'} />
							<Detail label='Requested' value={formatDate(selected.createdAt)} />
						</div>
						<DetailBlock label='Organizer note' value={selected.requesterNote || 'No note provided.'} />
						<DetailBlock label='Admin note' value={selected.adminNote || 'No admin note yet.'} />
						{selected.status === 'failed' ? (
							<DetailBlock label='Failure reason' value={selected.adminNote || String(selected.metadata?.errorMessage || 'Payout failed.')} />
						) : null}
						{reviewMode && reviewMode !== 'pay' ? (
							<label className='block'>
								<span className='font-medium text-slate-900'>Review note</span>
								<textarea
									value={note}
									onChange={(event) => setNote(event.target.value)}
									className='mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-secondary'
									placeholder='Add an internal note for this decision'
								/>
							</label>
						) : null}
						{reviewMode === 'pay' ? (
							<p className='rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800'>
								Paying this request will attempt a Stripe transfer and mark the selected organizer ledger entries as paid out. Current Stripe available balance is {currency(stripeAvailable)}.
							</p>
						) : null}
					</div>
				) : null}
			</Modal>
		</section>
	);
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
