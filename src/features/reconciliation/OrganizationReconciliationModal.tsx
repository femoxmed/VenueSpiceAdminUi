import { useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/shared/modal';
import { useToast } from '@/components/shared/toast-provider';
import {
	useApplyOrganizationReconciliation,
	useOrganizationReconciliation,
} from './hooks';

type Props = {
	organizationId: string;
	organizationName?: string;
	open: boolean;
	onClose: () => void;
};

function formatMoney(amount: number | undefined, currency = 'USD') {
	const val = Number(amount || 0);
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
	}).format(val);
}

export function OrganizationReconciliationModal({
	organizationId,
	organizationName,
	open,
	onClose,
}: Props) {
	const { push } = useToast();
	const { data, isLoading, isError, refetch, isFetching } = useOrganizationReconciliation(organizationId, open);
	const applyReconciliation = useApplyOrganizationReconciliation();

	const [note, setNote] = useState('');
	const [overrideAmount, setOverrideAmount] = useState<string>('');
	const [showOverride, setShowOverride] = useState(false);

	const handleClose = () => {
		if (applyReconciliation.isPending) return;
		setNote('');
		setOverrideAmount('');
		setShowOverride(false);
		onClose();
	};

	const handleApply = async () => {
		if (!note.trim() || note.trim().length < 5) {
			push({
				title: 'Admin reason required',
				description: 'Please provide a clear admin note / audit reason of at least 5 characters.',
				variant: 'error',
			});
			return;
		}

		try {
			const parsedOverride = showOverride && overrideAmount.trim() ? parseFloat(overrideAmount) : undefined;
			await applyReconciliation.mutateAsync({
				orgId: organizationId,
				payload: {
					note: note.trim(),
					overrideAmount: Number.isFinite(parsedOverride) ? parsedOverride : undefined,
				},
			});

			push({
				title: 'Balance reconciled successfully',
				description: 'An audit log has been recorded and the ledger balance has been updated.',
			});
			handleClose();
		} catch (error) {
			push({
				title: 'Reconciliation failed',
				description: error instanceof Error ? error.message : 'An error occurred while reconciling balance.',
				variant: 'error',
			});
		}
	};

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title={`Balance Reconciliation - ${organizationName || 'Organization'}`}
			description="Compare the stated ledger balance against actual order and payout transaction history, and apply an audited correction if a discrepancy exists."
			footer={
				<div className="flex w-full items-center justify-between">
					<button
						type="button"
						onClick={() => refetch()}
						disabled={isFetching || applyReconciliation.isPending}
						className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
					>
						<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
						Re-check Query
					</button>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleClose}
							disabled={applyReconciliation.isPending}
							className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
						>
							Cancel
						</button>
						{data && !data.isConsistent ? (
							<button
								type="button"
								onClick={handleApply}
								disabled={applyReconciliation.isPending || note.trim().length < 5}
								className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
							>
								{applyReconciliation.isPending ? 'Reconciling...' : 'Approve & Reconcile'}
							</button>
						) : null}
					</div>
				</div>
			}
		>
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-12 text-slate-500">
					<RefreshCw size={28} className="animate-spin text-primary" />
					<p className="mt-3 text-sm">Querying ticket order history & ledger entries...</p>
				</div>
			) : isError || !data ? (
				<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
					Failed to inspect reconciliation data for this organization.
				</div>
			) : (
				<div className="space-y-6">
					{/* Status Banner */}
					{data.isConsistent ? (
						<div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
							<CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
							<div>
								<h4 className="font-semibold">Balance is completely consistent</h4>
								<p className="mt-1 text-xs text-emerald-700">
									The organization's ledger entries match order history perfectly. Discrepancy is{' '}
									{formatMoney(data.discrepancy, data.currency)}. No adjustment is needed.
								</p>
							</div>
						</div>
					) : (
						<div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
							<AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
							<div>
								<h4 className="font-semibold">
									Discrepancy Detected:{' '}
									{data.discrepancy > 0 ? '+' : ''}
									{formatMoney(data.discrepancy, data.currency)}
								</h4>
								<p className="mt-1 text-xs text-amber-800">
									{data.discrepancy > 0
										? `Completed order history net earnings (${formatMoney(data.orderHistorySummary.netEarnings, data.currency)}) exceed current ledger earned total (${formatMoney(data.ledgerSummary.totalEarned, data.currency)}). A credit adjustment is recommended.`
										: `Ledger total earned (${formatMoney(data.ledgerSummary.totalEarned, data.currency)}) exceeds actual completed order net earnings (${formatMoney(data.orderHistorySummary.netEarnings, data.currency)}). A debit adjustment is recommended.`}
								</p>
							</div>
						</div>
					)}

					{/* Comparison Grid */}
					<div className="grid gap-4 sm:grid-cols-2">
						{/* Order History Side */}
						<div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
							<div className="border-b border-slate-200 pb-2">
								<h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
									Order History (Source of Truth)
								</h5>
							</div>
							<div className="mt-3 space-y-2 text-xs">
								<div className="flex justify-between">
									<span className="text-slate-500">Paid Completed Orders:</span>
									<span className="font-medium text-slate-800">
										{data.orderHistorySummary.completedPaidOrdersCount} orders
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Gross Sales:</span>
									<span className="font-medium text-slate-800">
										{formatMoney(data.orderHistorySummary.grossSales, data.currency)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Platform Fees:</span>
									<span className="font-medium text-slate-800">
										-{formatMoney(data.orderHistorySummary.platformFees, data.currency)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Processing Fees:</span>
									<span className="font-medium text-slate-800">
										-{formatMoney(data.orderHistorySummary.processingFees, data.currency)}
									</span>
								</div>
								{data.orderHistorySummary.influencerCommissions > 0 ? (
									<div className="flex justify-between">
										<span className="text-slate-500">Influencer Commissions:</span>
										<span className="font-medium text-slate-800">
											-{formatMoney(data.orderHistorySummary.influencerCommissions, data.currency)}
										</span>
									</div>
								) : null}
								{data.orderHistorySummary.partialRefundsCount && data.orderHistorySummary.partialRefundsCount > 0 ? (
									<div className="flex justify-between text-amber-700">
										<span>Partial Refunds ({data.orderHistorySummary.partialRefundsCount}):</span>
										<span className="font-medium">
											-{formatMoney(data.orderHistorySummary.partialRefundsDeduction, data.currency)}
										</span>
									</div>
								) : null}
								<div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
									<span>Expected Net Earnings:</span>
									<span className="text-sm text-primary">
										{formatMoney(data.orderHistorySummary.netEarnings, data.currency)}
									</span>
								</div>
							</div>
						</div>

						{/* Ledger Entries Side */}
						<div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
							<div className="border-b border-slate-200 pb-2">
								<h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
									Current Financial Ledger
								</h5>
							</div>
							<div className="mt-3 space-y-2 text-xs">
								<div className="flex justify-between">
									<span className="text-slate-500">Available Balance:</span>
									<span className="font-medium text-slate-800">
										{formatMoney(data.ledgerSummary.available, data.currency)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Pending Hold:</span>
									<span className="font-medium text-slate-800">
										{formatMoney(data.ledgerSummary.pending, data.currency)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Paid Out:</span>
									<span className="font-medium text-slate-800">
										{formatMoney(data.ledgerSummary.paidOut, data.currency)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Reversed/Refunds:</span>
									<span className="font-medium text-slate-800">
										{formatMoney(data.ledgerSummary.reversed, data.currency)}
									</span>
								</div>
								<div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
									<span>Ledger Total Earned:</span>
									<span className="text-sm">
										{formatMoney(data.ledgerSummary.totalEarned, data.currency)}
									</span>
								</div>
								{data.payoutSummary.inFlightWithdrawalsCount && data.payoutSummary.inFlightWithdrawalsCount > 0 ? (
									<div className="flex justify-between pt-1 text-[11px] text-amber-600">
										<span>In-flight withdrawals ({data.payoutSummary.inFlightWithdrawalsCount}):</span>
										<span>{formatMoney(data.payoutSummary.inFlightWithdrawalTotal, data.currency)}</span>
									</div>
								) : null}
							</div>
						</div>
					</div>

					{/* Admin approval & note form when inconsistent */}
					{!data.isConsistent ? (
						<div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
								<ShieldAlert size={16} className="text-amber-600" />
								<span>Admin Approval & Audit Trail</span>
							</div>
							<p className="mt-1 text-xs text-slate-500">
								Approving this reconciliation will insert a verified adjustment entry into the financial ledger and record an immutable audit history event with your administrator identity.
							</p>

							<div className="mt-4 space-y-3">
								<div>
									<label className="block text-xs font-semibold text-slate-700">
										Adjustment Amount ({data.currency})
									</label>
									<div className="mt-1 flex items-center gap-2">
										<input
											type="text"
											readOnly={!showOverride}
											value={showOverride ? overrideAmount : `${data.discrepancy > 0 ? '+' : ''}${data.discrepancy.toFixed(2)}`}
											onChange={(e) => setOverrideAmount(e.target.value)}
											className={`w-40 rounded-xl border px-3 py-1.5 text-sm font-medium ${
												showOverride ? 'border-amber-300 bg-white' : 'border-slate-200 bg-slate-50 text-slate-700'
											}`}
										/>
										<button
											type="button"
											onClick={() => {
												setShowOverride(!showOverride);
												if (!showOverride) setOverrideAmount(data.discrepancy.toString());
											}}
											className="text-xs text-primary underline"
										>
											{showOverride ? 'Reset to calculated' : 'Customize amount'}
										</button>
									</div>
									{data.currentBalance.available + (showOverride && overrideAmount ? parseFloat(overrideAmount) || 0 : data.discrepancy) < 0 ? (
										<p className="mt-1.5 text-xs text-rose-600 font-medium">
											Notice: This debit adjustment will result in a negative available balance ({formatMoney(data.currentBalance.available + (showOverride && overrideAmount ? parseFloat(overrideAmount) || 0 : data.discrepancy), data.currency)}). Subsequent ticket sales will recover this deficit before payouts become available.
										</p>
									) : null}
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-700">
										Reason for Reconciliation <span className="text-rose-500">*</span>
									</label>
									<textarea
										rows={2}
										value={note}
										onChange={(e) => setNote(e.target.value)}
										placeholder="e.g. Approved reconciliation of missed order ledger entry from manual review..."
										className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
									/>
									<span className="text-[10px] text-slate-400">
										Required for audit compliance (minimum 5 characters).
									</span>
								</div>
							</div>
						</div>
					) : null}
				</div>
			)}
		</Modal>
	);
}
