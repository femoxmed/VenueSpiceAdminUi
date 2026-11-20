import { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, RefreshCw, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/shared/modal';
import { useToast } from '@/components/shared/toast-provider';
import {
	useApplyUserReconciliation,
	useUserReconciliation,
} from './hooks';

type Props = {
	userId: string;
	userName?: string;
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

export function UserReconciliationModal({
	userId,
	userName,
	open,
	onClose,
}: Props) {
	const { push } = useToast();
	const { data, isLoading, isError, refetch, isFetching } = useUserReconciliation(userId, open);
	const applyReconciliation = useApplyUserReconciliation();

	const [note, setNote] = useState('');
	const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({});

	const handleClose = () => {
		if (applyReconciliation.isPending) return;
		setNote('');
		setExpandedOrgs({});
		onClose();
	};

	const toggleOrg = (orgId: string) => {
		setExpandedOrgs((prev) => ({ ...prev, [orgId]: !prev[orgId] }));
	};

	const handleApply = async (organizationId?: string) => {
		if (!note.trim() || note.trim().length < 5) {
			push({
				title: 'Admin reason required',
				description: 'Please provide a clear admin note / audit reason of at least 5 characters.',
				variant: 'error',
			});
			return;
		}

		try {
			await applyReconciliation.mutateAsync({
				userId,
				payload: {
					note: note.trim(),
					organizationId,
				},
			});

			push({
				title: 'Reconciliation completed',
				description: 'The balance adjustment has been saved and recorded in the audit history.',
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
			title={`User Balance Reconciliation - ${userName || 'User'}`}
			description="Audit and reconcile financial balance across all organizations and profiles owned by this user."
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
						{data && !data.allConsistent && data.organizationsCount > 0 ? (
							<button
								type="button"
								onClick={() => handleApply()}
								disabled={applyReconciliation.isPending || note.trim().length < 5}
								className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
							>
								{applyReconciliation.isPending ? 'Reconciling...' : 'Approve All Inconsistent'}
							</button>
						) : null}
					</div>
				</div>
			}
		>
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-12 text-slate-500">
					<RefreshCw size={28} className="animate-spin text-primary" />
					<p className="mt-3 text-sm">Querying user accounts, order history, and balances...</p>
				</div>
			) : isError || !data ? (
				<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
					Failed to inspect reconciliation data for this user.
				</div>
			) : data.organizationsCount === 0 ? (
				<div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
					This user does not own any vendor, organizer, or influencer organizations. No financial balances to reconcile.
				</div>
			) : (
				<div className="space-y-6">
					{/* Status Overview */}
					{data.allConsistent ? (
						<div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
							<CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
							<div>
								<h4 className="font-semibold">All User Accounts Consistent</h4>
								<p className="mt-1 text-xs text-emerald-700">
									All {data.organizationsCount} account(s) owned by this user match their transaction history perfectly. No discrepancy found.
								</p>
							</div>
						</div>
					) : (
						<div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
							<AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
							<div>
								<h4 className="font-semibold">
									Discrepancy Detected Across Accounts:{' '}
									{data.totalDiscrepancy > 0 ? '+' : ''}
									{formatMoney(data.totalDiscrepancy, data.organizations[0]?.currency || 'USD')}
								</h4>
								<p className="mt-1 text-xs text-amber-800">
									One or more organizations owned by this user have a mismatch between completed order history and ledger balances. Review details below.
								</p>
							</div>
						</div>
					)}

					{/* List of Organizations */}
					<div className="space-y-3">
						<h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
							User Accounts & Organizations ({data.organizationsCount})
						</h5>

						{data.organizations.map((org) => {
							const isExpanded = expandedOrgs[org.organizationId] ?? false;

							return (
								<div
									key={org.organizationId}
									className={`overflow-hidden rounded-2xl border transition ${
										org.isConsistent
											? 'border-slate-200 bg-slate-50/40'
											: 'border-amber-200 bg-amber-50/20'
									}`}
								>
									<div
										className="flex cursor-pointer items-center justify-between p-4"
										onClick={() => toggleOrg(org.organizationId)}
									>
										<div className="flex items-center gap-3">
											{org.isConsistent ? (
												<CheckCircle2 size={18} className="text-emerald-600" />
											) : (
												<AlertCircle size={18} className="text-amber-600" />
											)}
											<div>
												<div className="flex items-center gap-2">
													<span className="font-semibold text-slate-900">{org.organizationName}</span>
													<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-600">
														{org.organizationType}
													</span>
													{org.userRelationship && org.userRelationship !== 'owner' ? (
														<span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
															{org.userRelationship.replace('_', ' ')}
														</span>
													) : (
														<span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
															Owner
														</span>
													)}
												</div>
												<span className="text-xs text-slate-500">/{org.organizationSlug}</span>
											</div>
										</div>

										<div className="flex items-center gap-4">
											<div className="text-right">
												<div className="text-xs font-medium text-slate-500">
													Ledger: {formatMoney(org.currentBalance.available, org.currency)}
												</div>
												<div
													className={`text-xs font-semibold ${
														org.isConsistent ? 'text-emerald-600' : 'text-amber-600'
													}`}
												>
													{org.isConsistent
														? 'Consistent'
														: `Discrepancy: ${org.discrepancy > 0 ? '+' : ''}${formatMoney(
																org.discrepancy,
																org.currency,
															)}`}
												</div>
											</div>
											{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
										</div>
									</div>

									{/* Expanded Details */}
									{isExpanded ? (
										<div className="border-t border-slate-200/80 bg-white p-4">
											<div className="grid gap-4 sm:grid-cols-2 text-xs">
												<div className="space-y-1.5 rounded-xl bg-slate-50 p-3">
													<span className="font-semibold text-slate-700">Order History</span>
													<div className="flex justify-between text-slate-600">
														<span>Paid Orders:</span>
														<span>{org.orderHistorySummary.completedPaidOrdersCount}</span>
													</div>
													<div className="flex justify-between text-slate-600">
														<span>Gross Sales:</span>
														<span>{formatMoney(org.orderHistorySummary.grossSales, org.currency)}</span>
													</div>
													<div className="flex justify-between text-slate-600">
														<span>Fees (Platform & Proc):</span>
														<span>
															-{formatMoney(org.orderHistorySummary.platformFees + org.orderHistorySummary.processingFees, org.currency)}
														</span>
													</div>
													<div className="flex justify-between font-semibold text-primary pt-1 border-t border-slate-200">
														<span>Calculated Net Earnings:</span>
														<span>{formatMoney(org.orderHistorySummary.netEarnings, org.currency)}</span>
													</div>
												</div>

												<div className="space-y-1.5 rounded-xl bg-slate-50 p-3">
													<span className="font-semibold text-slate-700">Ledger Balances</span>
													<div className="flex justify-between text-slate-600">
														<span>Available:</span>
														<span>{formatMoney(org.ledgerSummary.available, org.currency)}</span>
													</div>
													<div className="flex justify-between text-slate-600">
														<span>Pending:</span>
														<span>{formatMoney(org.ledgerSummary.pending, org.currency)}</span>
													</div>
													<div className="flex justify-between text-slate-600">
														<span>Paid Out:</span>
														<span>{formatMoney(org.ledgerSummary.paidOut, org.currency)}</span>
													</div>
													<div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-200">
														<span>Ledger Total:</span>
														<span>{formatMoney(org.ledgerSummary.totalEarned, org.currency)}</span>
													</div>
												</div>
											</div>

											{!org.isConsistent ? (
												<div className="mt-3 flex justify-end">
													<button
														type="button"
														onClick={() => handleApply(org.organizationId)}
														disabled={applyReconciliation.isPending || note.trim().length < 5}
														className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
													>
														Reconcile This Account Only
													</button>
												</div>
											) : null}
										</div>
									) : null}
								</div>
							);
						})}
					</div>

					{/* Note Input */}
					{!data.allConsistent ? (
						<div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
								<ShieldAlert size={16} className="text-amber-600" />
								<span>Admin Approval Reason (Mandatory for Audit Trail)</span>
							</div>
							<p className="mt-1 text-xs text-slate-500">
								Provide the administrative reason for this reconciliation. This will be permanently recorded in the audit logs.
							</p>
							<div className="mt-3">
								<textarea
									rows={2}
									value={note}
									onChange={(e) => setNote(e.target.value)}
									placeholder="e.g. Discrepancy confirmed after reviewing missing ticket order entries; approved sync..."
									className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<span className="text-[10px] text-slate-400">
									Minimum 5 characters required.
								</span>
							</div>
						</div>
					) : null}
				</div>
			)}
		</Modal>
	);
}
