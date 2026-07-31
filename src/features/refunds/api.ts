import { apiClient } from '@/lib/api-client';
import type { TicketOrderRow } from '@/features/orders/api';

export type RefundRequest = {
	id: string;
	orderId: string;
	customerEmail: string;
	reason?: string | null;
	status: 'requested' | 'approved' | 'processing' | 'succeeded' | 'declined' | 'failed';
	amount: number | string;
	currency: string;
	stripeRefundId?: string | null;
	reviewNote?: string | null;
	reviewedAt?: string | null;
	completedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	order?: TicketOrderRow;
	reviewedBy?: { id?: string; fullName?: string; email?: string } | null;
};

export function getRefundRequests() {
	return apiClient<RefundRequest[]>('/refunds/requests');
}

export function approveRefundRequest(id: string, note?: string) {
	return apiClient<RefundRequest>(`/refunds/requests/${id}/approve`, {
		method: 'POST',
		body: JSON.stringify({ note }),
	});
}

export function declineRefundRequest(id: string, note?: string) {
	return apiClient<RefundRequest>(`/refunds/requests/${id}/decline`, {
		method: 'POST',
		body: JSON.stringify({ note }),
	});
}
