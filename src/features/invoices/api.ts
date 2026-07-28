import { apiClient } from '@/lib/api-client';

export type InvoiceRow = {
	id: string;
	invoiceNumber: string;
	total: number;
	status: string;
	issuedAt?: string;
	sendCount?: number;
	lastSentAt?: string;
	lastSentTo?: string;
	user?: { fullName?: string; email?: string };
};

export function getInvoices() {
	return apiClient<InvoiceRow[]>('/invoices');
}

export function resendInvoice(invoiceId: string, email?: string) {
	return apiClient<{
		message: string;
		invoiceId: string;
		invoiceNumber: string;
		sentTo: string;
		sendCount: number;
		lastSentAt: string;
	}>('/invoices/' + invoiceId + '/resend', {
		method: 'POST',
		body: JSON.stringify(email ? { email } : {}),
	});
}
