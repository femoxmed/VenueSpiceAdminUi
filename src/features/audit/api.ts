import { apiClient } from '@/lib/api-client';

export type AuditLog = {
	id: string;
	userId?: string | null;
	userEmail?: string | null;
	userRole?: string | null;
	action: string;
	entityType?: string | null;
	entityId?: string | null;
	changes?: Record<string, unknown> | null;
	metadata?: Record<string, unknown> | null;
	ipAddress?: string | null;
	userAgent?: string | null;
	createdAt: string;
};

export type AuditLogsResponse = {
	data: AuditLog[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

export type AuditLogFilters = {
	page?: number;
	limit?: number;
};

export function getAuditLogs(filters: AuditLogFilters = {}) {
	return apiClient<AuditLogsResponse>('/audit', {
		query: {
			page: filters.page ?? 1,
			limit: filters.limit ?? 100,
		},
	});
}
