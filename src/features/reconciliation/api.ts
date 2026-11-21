import { apiClient } from '@/lib/api-client';

export type BalanceSnapshot = {
	available: number;
	pending: number;
	paidOut: number;
	reversed: number;
	totalEarned: number;
};

export type OrderHistorySummary = {
	completedPaidOrdersCount: number;
	ticketsSold?: number;
	refundedOrdersCount: number;
	partialRefundsCount?: number;
	partialRefundsDeduction?: number;
	grossSales: number;
	buyerPaid?: number;
	platformFees: number;
	processingFees: number;
	organizerPlatformFees?: number;
	organizerProcessingFees?: number;
	buyerPlatformFees?: number;
	buyerProcessingFees?: number;
	influencerCommissions: number;
	taxes: number;
	netEarnings: number;
	refundedNet: number;
	refundBreakdown?: Array<{
		id: string;
		orderId: string;
		customerEmail?: string;
		customerName?: string;
		refundAmount: number;
		organizerNetDeduction: number;
		status: string;
		reconciliationMethod?: string;
		orderStatus: string;
		isFullOrderRefund: boolean;
		completedAt?: string;
	}>;
};

export type LedgerSummary = {
	available: number;
	pending: number;
	paidOut: number;
	reversed: number;
	totalEarned: number;
	previousAdjustmentsTotal: number;
};

export type PayoutSummary = {
	completedWithdrawalsCount: number;
	totalPaidOutViaWithdrawals: number;
	inFlightWithdrawalsCount?: number;
	inFlightWithdrawalTotal?: number;
};

export type RecommendedAdjustment = {
	amount: number;
	targetStatus: string;
	action: 'credit' | 'debit';
	suggestedReason: string;
};

export type OrganizationReconciliationInspection = {
	organizationId: string;
	organizationName: string;
	organizationSlug: string;
	organizationType: string;
	userRelationship?: 'owner' | string;
	currency: string;
	isConsistent: boolean;
	discrepancy: number;
	currentBalance: BalanceSnapshot;
	orderHistorySummary: OrderHistorySummary;
	ledgerSummary: LedgerSummary;
	payoutSummary: PayoutSummary;
	recommendedAdjustment: RecommendedAdjustment | null;
};

export type UserReconciliationInspection = {
	user: {
		id: string;
		email: string;
		fullName?: string;
		role: string;
	};
	organizationsCount: number;
	allConsistent: boolean;
	totalDiscrepancy: number;
	organizations: OrganizationReconciliationInspection[];
};

export type ApplyReconciliationPayload = {
	note: string;
	overrideAmount?: number;
	organizationId?: string;
};

export type ApplyReconciliationResult = {
	success: boolean;
	adjustmentEntry?: Record<string, unknown>;
	previousBalance?: BalanceSnapshot;
	updatedBalance?: BalanceSnapshot;
	adjustmentAmount?: number;
	note?: string;
	reconciledOrganizationsCount?: number;
	results?: unknown[];
};

export function inspectOrganizationReconciliation(orgId: string) {
	return apiClient<OrganizationReconciliationInspection>(
		`/organizer-sales/admin/organizations/${orgId}/reconciliation`,
	);
}

export function applyOrganizationReconciliation(orgId: string, payload: ApplyReconciliationPayload) {
	return apiClient<ApplyReconciliationResult>(
		`/organizer-sales/admin/organizations/${orgId}/reconcile`,
		{
			method: 'POST',
			body: JSON.stringify(payload),
		},
	);
}

export function inspectUserReconciliation(userId: string) {
	return apiClient<UserReconciliationInspection>(
		`/organizer-sales/admin/users/${userId}/reconciliation`,
	);
}

export function applyUserReconciliation(userId: string, payload: ApplyReconciliationPayload) {
	return apiClient<ApplyReconciliationResult>(
		`/organizer-sales/admin/users/${userId}/reconcile`,
		{
			method: 'POST',
			body: JSON.stringify(payload),
		},
	);
}
