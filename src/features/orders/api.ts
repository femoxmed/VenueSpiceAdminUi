import { apiClient } from '@/lib/api-client';
import type { Event, Organization } from '@/features/ticketing/api';

export type TicketOrderRow = {
	id: string;
	customerName: string;
	customerEmail: string;
	status: string;
	subtotal: number | string;
	tax: number | string;
	total: number | string;
	currency: string;
	checkoutUrl?: string | null;
	stripeCheckoutSessionId?: string | null;
	paidAt?: string | null;
	createdAt: string;
	organization?: Organization;
	event?: Event;
	user?: { id?: string; fullName?: string; email?: string };
	referralCode?: {
		id: string;
		code: string;
		usesCount: number;
	} | null;
	items?: Array<{
		id: string;
		ticketName: string;
		quantity: number;
		qty?: number;
		unitPrice: number | string;
		lineTotal: number | string;
		product?: { id?: string; name?: string };
		deviceSerial?: string | null;
	}>;
	tickets?: Array<{
		id: string;
		code: string;
		status: string;
	}>;
};

export function getOrders(status?: string) {
	return apiClient<TicketOrderRow[]>('/ticket-orders', {
		query: status && status !== 'all' ? { status } : undefined,
	});
}

export type StripeReconciliationResult = {
	scanned: number;
	paid: number;
	cancelled: number;
	pending: number;
	failed: number;
	results: Array<{
		orderId: string;
		sessionId: string;
		customerName: string;
		eventTitle: string;
		amount: number;
		currency: string;
		outcome: 'paid' | 'cancelled' | 'pending' | 'failed';
		reason: string;
	}>;
};

export function reconcilePendingStripeOrders() {
	return apiClient<StripeReconciliationResult>('/ticket-orders/stripe/reconcile-pending', {
		method: 'POST',
	});
}
