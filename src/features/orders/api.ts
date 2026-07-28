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

export function getOrders() {
	return apiClient<TicketOrderRow[]>('/ticket-orders');
}
