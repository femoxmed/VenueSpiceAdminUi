import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useInvoices, useResendInvoice } from '@/features/invoices/hooks';
import type { InvoiceRow } from '@/features/invoices/api';
import {
	useCreatePaymentIntent,
	useVerifyPaymentIntent,
} from '@/features/payments/hooks';
import { currency } from '@/lib/utils';
import { useToast } from '@/components/shared/toast-provider';

export function InvoicesPage() {
	const { push } = useToast();
	const { data } = useInvoices();
	const resendInvoiceMutation = useResendInvoice();
	const createPaymentIntentMutation = useCreatePaymentIntent();
	const verifyPaymentIntentMutation = useVerifyPaymentIntent();
	const rows = data ?? [];
	const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(
		null,
	);
	const [recipientEmail, setRecipientEmail] = useState('');
	const [paymentCheckoutUrl, setPaymentCheckoutUrl] = useState('');
	const [paymentIntentId, setPaymentIntentId] = useState('');

	const feedback = useMemo(() => {
		if (verifyPaymentIntentMutation.isSuccess) {
			return (
				'Payment intent verified. Latest status: ' +
				verifyPaymentIntentMutation.data.status
			);
		}
		if (createPaymentIntentMutation.isSuccess) {
			return 'Paystack checkout initialized successfully.';
		}
		if (resendInvoiceMutation.isSuccess) {
			return (
				'Invoice queued successfully for ' + resendInvoiceMutation.data.sentTo
			);
		}
		if (verifyPaymentIntentMutation.isError) {
			return verifyPaymentIntentMutation.error.message;
		}
		if (createPaymentIntentMutation.isError) {
			return createPaymentIntentMutation.error.message;
		}
		if (resendInvoiceMutation.isError) {
			return resendInvoiceMutation.error.message;
		}
		return 'Invoices can be resent to customers and linked to Paystack checkout from here.';
	}, [
		createPaymentIntentMutation.data,
		createPaymentIntentMutation.error,
		createPaymentIntentMutation.isError,
		createPaymentIntentMutation.isSuccess,
		resendInvoiceMutation.data,
		resendInvoiceMutation.error,
		resendInvoiceMutation.isError,
		resendInvoiceMutation.isSuccess,
		verifyPaymentIntentMutation.data,
		verifyPaymentIntentMutation.error,
		verifyPaymentIntentMutation.isError,
		verifyPaymentIntentMutation.isSuccess,
	]);

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Invoices'
				description='Invoices are generated automatically whenever an order is created. You can resend them or initialize Paystack checkout for payment.'
			/>

			<div className='card p-4'>
				<div className='mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
					<p className='text-sm text-slate-500'>{feedback}</p>
					{selectedInvoice ? (
						<div className='flex flex-col gap-2 xl:flex-row xl:items-center'>
							<input
								className='w-72 rounded-xl border border-slate-200 px-3 py-2 text-sm'
								placeholder='Override recipient email (optional)'
								value={recipientEmail}
								onChange={(event) => setRecipientEmail(event.target.value)}
							/>
							<button
								className='rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700'
								disabled={resendInvoiceMutation.isPending}
								onClick={async () => {
									await resendInvoiceMutation.mutateAsync({
											invoiceId: selectedInvoice.id,
											email: recipientEmail || selectedInvoice.user?.email,
										});
								}}>
								{resendInvoiceMutation.isPending
									? 'Sending...'
									: 'Resend invoice'}
							</button>
							<button
								className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
								disabled={createPaymentIntentMutation.isPending}
								onClick={async () => {
									try {
										// const intent =
										// 	await createPaymentIntentMutation.mutateAsync({
										// 		invoiceId: selectedInvoice.id,
										// 		idempotencyKey: 'invoice:' + selectedInvoice.id,
										// 	});

										// setPaymentIntentId(intent.id);
										// setPaymentCheckoutUrl(intent.authorizationUrl ?? '');

										// push({
										// 	title: 'Checkout created',
										// 	description:
										// 		'Paystack checkout was initialized successfully.',
										// });
										const intent =
											await createPaymentIntentMutation.mutateAsync({
												invoiceId: selectedInvoice.id,
												idempotencyKey: 'invoice:' + selectedInvoice.id,
											});
										console.log('intent', intent);
										if (intent.authorizationUrl) {
											window.location.href = intent.authorizationUrl;
										}
									} catch (error) {
										push({
											title: 'Unable to create checkout',
											description:
												error instanceof Error
													? error.message
													: 'An unexpected error occurred.',
											variant: 'error',
										});
									}
								}}>
								{createPaymentIntentMutation.isPending
									? 'Initializing...'
									: 'Create Paystack checkout'}
							</button>
							<button
								className='rounded-xl border border-primary px-4 py-2 text-sm font-medium text-secondary'
								disabled={
									!paymentIntentId || verifyPaymentIntentMutation.isPending
								}
								onClick={async () => {
									try {
										await verifyPaymentIntentMutation.mutateAsync(
											paymentIntentId,
										);
										push({
											title: 'Payment verified',
											description:
												'The latest payment status was fetched successfully.',
										});
									} catch (error) {
										push({
											title: 'Payment verification failed',
											description:
												error instanceof Error
													? error.message
													: 'Unable to verify this Paystack transaction.',
											variant: 'error',
										});
									}
								}}>
								{verifyPaymentIntentMutation.isPending
									? 'Verifying...'
									: 'Verify payment'}
							</button>
						</div>
					) : (
						<p className='text-sm text-slate-400'>
							Select an invoice from the table below to act on it.
						</p>
					)}
				</div>

				{paymentCheckoutUrl ? (
					<div className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'>
						<p className='text-xs uppercase tracking-wide text-slate-500'>
							Latest checkout URL
						</p>
						<a
							className='mt-2 block text-sm font-medium text-secondary underline'
							href={paymentCheckoutUrl}
							target='_blank'
							rel='noreferrer'>
							Open Paystack checkout
						</a>
					</div>
				) : null}
			</div>

			<div className='table-shell overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full border-collapse'>
						<thead>
							<tr>
								<th className='bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
									Invoice
								</th>
								<th className='bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
									Customer
								</th>
								<th className='bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
									Total
								</th>
								<th className='bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
									Status
								</th>
								<th className='bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
									Issued
								</th>
								<th className='bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
									Recipient
								</th>
								<th className='bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
									Sends
								</th>
								<th className='bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
									Action
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={row.id}>
									<td className='border-t border-slate-100 px-4 py-3 text-sm text-slate-700'>
										{row.invoiceNumber}
									</td>
									<td className='border-t border-slate-100 px-4 py-3 text-sm text-slate-700'>
										{row.user?.fullName ??
											(row as InvoiceRow & { customerName?: string })
												.customerName ??
											'Unknown customer'}
									</td>
									<td className='border-t border-slate-100 px-4 py-3 text-sm text-slate-700'>
										{currency(Number(row.total ?? 0))}
									</td>
									<td className='border-t border-slate-100 px-4 py-3 text-sm text-slate-700'>
										<StatusBadge value={row.status} />
									</td>
									<td className='border-t border-slate-100 px-4 py-3 text-sm text-slate-700'>
										{row.issuedAt ?? '—'}``
									</td>
									<td className='border-t border-slate-100 px-4 py-3 text-sm text-slate-700'>
										{row.lastSentTo ?? row.user?.email ?? '—'}
									</td>
									<td className='border-t border-slate-100 px-4 py-3 text-sm text-slate-700'>
										{row.sendCount ?? 0}
									</td>
									<td className='border-t border-slate-100 px-4 py-3 text-sm text-slate-700'>
										<button
											className='rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50'
											onClick={() => {
												setSelectedInvoice(row);
												setRecipientEmail(
													row.user?.email ?? row.lastSentTo ?? '',
												);
												setPaymentCheckoutUrl('');
												setPaymentIntentId('');
											}}>
											Select
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}
