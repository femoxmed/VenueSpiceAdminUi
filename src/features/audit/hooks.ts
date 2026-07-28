import { useQuery } from '@tanstack/react-query';
import { getAuditLogs, type AuditLogFilters } from '@/features/audit/api';

export function useAuditLogs(filters: AuditLogFilters = {}) {
	return useQuery({
		queryKey: ['audit-logs', filters],
		queryFn: () => getAuditLogs(filters),
	});
}
