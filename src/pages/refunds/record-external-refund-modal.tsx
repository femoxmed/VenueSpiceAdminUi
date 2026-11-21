import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/shared/modal';
import { recordExternalStripeRefund, type RecordExternalRefundPayload } from '@/features/refunds/api';

const button = 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50';
const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Request failed. Please try again.');

export function RecordExternalRefundModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	const queryClient = useQueryClient();
	const [orderId, setOrderId] = useState('');
	const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
	const [amount, setAmount] = useState<string>('');
	const [stripeRefundId, setStripeRefundId] = useState('');
	const [method, setMethod] = useState('stripe');
	const [externalReference, setExternalReference] = useState('');
	const [evidenceUrl, setEvidenceUrl] = useState('');
	const [reason, setReason] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!orderId.trim()) {
			setError('Order ID is required.');
			return;
		}
		const numAmount = Number(amount);
		if (!Number.isFinite(numAmount) || numAmount <= 0) {
			setError('Please enter a valid positive refund amount.');
			return;
		}
		if (reason.trim().length < 5) {
			setError('Reason must be at least 5 characters for auditing.');
			return;
		}

		setBusy(true);
		setError('');
		try {
			const payload: RecordExternalRefundPayload = {
				orderId: orderId.trim(),
				refundType,
				amount: numAmount,
				stripeRefundId: stripeRefundId.trim() || undefined,
				externalReference: externalReference.trim() || undefined,
				method,
				evidenceUrl: evidenceUrl.trim() || undefined,
				reason: reason.trim(),
			};

			const result = await recordExternalStripeRefund(payload);
			setSuccess(`Refund ${result.id} successfully recorded and reconciled with ledger!`);
			await queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
			await queryClient.invalidateQueries({ queryKey: ['ticket-orders'] });
			await queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
			setTimeout(() => {
				setSuccess('');
				onClose();
			}, 1800);
		} catch (err) {
			setError(errorText(err));
		} finally {
			setBusy(false);
		}
	};

	return (
		<Modal
			open={open}
			onClose={() => {
				if (!busy) {
					setError('');
					setSuccess('');
					onClose();
				}
			}}
			title="Record External / Stripe Refund"
			description="Manually reconcile a refund that was issued directly in Stripe Dashboard or via external payment. This automatically deducts the organizer's balance and keeps audit ledgers consistent."
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				{error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
				{success ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 font-medium">{success}</p> : null}

				<div>
					<label className="block text-sm font-medium text-slate-700 mb-1">
						Order ID <span className="text-red-500">*</span>
					</label>
					<input
						className={input}
						placeholder="e.g. 7c9e6679-7425-40de-944b-e07fc1f90ae7"
						value={orderId}
						disabled={busy}
						onChange={(e) => setOrderId(e.target.value)}
						required
					/>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Refund Type</label>
						<select
							className={input}
							value={refundType}
							disabled={busy}
							onChange={(e) => setRefundType(e.target.value as 'full' | 'partial')}
						>
							<option value="full">Full Order Refund</option>
							<option value="partial">Partial Refund</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Refund Amount ($) <span className="text-red-500">*</span>
						</label>
						<input
							type="number"
							step="0.01"
							min="0.01"
							className={input}
							placeholder="e.g. 50.00"
							value={amount}
							disabled={busy}
							onChange={(e) => setAmount(e.target.value)}
							required
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
						<select
							className={input}
							value={method}
							disabled={busy}
							onChange={(e) => setMethod(e.target.value)}
						>
							<option value="stripe">Stripe Dashboard</option>
							<option value="bank_transfer">Bank Wire / Transfer</option>
							<option value="cash">Cash / In-person</option>
							<option value="other">Other External</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Stripe Refund ID (Optional)
						</label>
						<input
							className={input}
							placeholder="re_1N... from Stripe"
							value={stripeRefundId}
							disabled={busy}
							onChange={(e) => setStripeRefundId(e.target.value)}
						/>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-700 mb-1">
						External Reference / Transaction ID (Optional)
					</label>
					<input
						className={input}
						placeholder="e.g. Wire confirmation number or bank ref"
						value={externalReference}
						disabled={busy}
						onChange={(e) => setExternalReference(e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-700 mb-1">
						Evidence / Receipt Document URL (Optional)
					</label>
					<input
						className={input}
						placeholder="https://... or upload link to Stripe receipt/screenshot"
						value={evidenceUrl}
						disabled={busy}
						onChange={(e) => setEvidenceUrl(e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-700 mb-1">
						Administrative Reason / Audit Note <span className="text-red-500">*</span>
					</label>
					<textarea
						className={input}
						rows={2}
						placeholder="e.g. Customer requested refund directly in Stripe due to duplicate charge."
						value={reason}
						disabled={busy}
						onChange={(e) => setReason(e.target.value)}
						required
					/>
				</div>

				<div className="flex justify-end gap-3 pt-2">
					<button
						type="button"
						className={button}
						disabled={busy}
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						type="submit"
						className={`${button} bg-indigo-600 text-white border-transparent hover:bg-indigo-700`}
						disabled={busy}
					>
						{busy ? 'Recording...' : 'Record & Reconcile Refund'}
					</button>
				</div>
			</form>
		</Modal>
	);
}
