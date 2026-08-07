import { apiClient } from '@/lib/api-client';

export type WithdrawalRequest = {
	id: string;
	status: 'pending_review' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed' | 'cancelled';
	amount: number;
	currency: string;
	availableBalanceSnapshot: number;
	stripeAccountId?: string | null;
	requestedByEmail?: string | null;
	reviewedByEmail?: string | null;
	requesterNote?: string | null;
	adminNote?: string | null;
	stripeTransferId?: string | null;
	organization?: {
		id: string;
		name: string;
		organizerUsername?: string | null;
		contactEmail?: string | null;
	};
	sourceEntryIds?: string[] | null;
	createdAt: string;
	updatedAt: string;
	reviewedAt?: string | null;
	paidAt?: string | null;
	failedAt?: string | null;
};

export function getWithdrawalRequests(status?: string) {
	const query = status ? `?status=${encodeURIComponent(status)}` : '';
	return apiClient<WithdrawalRequest[]>(`/organizer-sales/admin/withdrawal-requests${query}`);
}

export function approveWithdrawalRequest(id: string, note?: string) {
	return apiClient<WithdrawalRequest>(`/organizer-sales/admin/withdrawal-requests/${id}/approve`, {
		method: 'PATCH',
		body: JSON.stringify({ note }),
	});
}

export function rejectWithdrawalRequest(id: string, note?: string) {
	return apiClient<WithdrawalRequest>(`/organizer-sales/admin/withdrawal-requests/${id}/reject`, {
		method: 'PATCH',
		body: JSON.stringify({ note }),
	});
}

export function payWithdrawalRequest(id: string) {
	return apiClient<WithdrawalRequest>(`/organizer-sales/admin/withdrawal-requests/${id}/pay`, {
		method: 'POST',
	});
}
