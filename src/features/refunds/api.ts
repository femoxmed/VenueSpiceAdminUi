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
	policySnapshot?: AdminRefundPreview | null;
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

export type ReconciliationRow = {
 id:string; orderId:string; customerEmail:string; eventTitle:string;
 localStatus:string; localAmount:number; currency:string; localRefundId:string|null; paymentId:string|null;
 finding:string; detail:string; needsAttention:boolean;
 providerRefunds:Array<{id:string;status:string;amount:number;currency:string}>;
};
export type ReconciliationReport = {generatedAt:string;readOnly:true;page:number;pageSize:number;total:number;rows:ReconciliationRow[]};
export type RefundReason = 'voluntary' | 'organizer_cancellation' | 'platform_error';
export type RefundAmounts = {tickets:number;serviceFee:number;processingFee:number;tax:number};
export type AdminRefundPreview = {availableComponents:RefundAmounts;refundComponents:RefundAmounts;adminOverride:boolean;cancellationReason:RefundReason;policyVersion:string;buyerProcessingFee:number;retainedProcessingFee:number;refundedSubtotal:number;refundedFees:number;totalRetained:number;orderId:string;customerEmail:string;customerName:string;eventTitle:string;currency:string;total:number;subtotal:number;tax:number;buyerFees:number;percentage:number;refundAmount:number;taxPortion:number;taxProvider:string;allTicketsInvalidated:boolean};
export const getRefundReconciliation=(page:number)=>apiClient<ReconciliationReport>('/refunds/reconciliation',{query:{page}});
export const getAdminRefundPreview=(orderId:string,cancellationReason:RefundReason,requestId?:string)=>apiClient<AdminRefundPreview>(requestId?`/refunds/requests/${encodeURIComponent(requestId)}/preview`:`/refunds/admin-preview/${encodeURIComponent(orderId)}`,{query:{cancellationReason}});
export const issueAdminRefund=(orderId:string,reason:string,expectedAmount:number,cancellationReason:RefundReason,refundAmounts:RefundAmounts,requestId?:string)=>apiClient<RefundRequest>(requestId?`/refunds/requests/${encodeURIComponent(requestId)}/approve-selected`:'/refunds/admin-issue',{method:'POST',body:JSON.stringify({orderId,reason,expectedAmount,cancellationReason,refundAmounts,confirmed:true})});
