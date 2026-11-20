import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	applyOrganizationReconciliation,
	applyUserReconciliation,
	inspectOrganizationReconciliation,
	inspectUserReconciliation,
	type ApplyReconciliationPayload,
} from './api';

export function useOrganizationReconciliation(orgId: string, enabled = true) {
	return useQuery({
		queryKey: ['reconciliation', 'organization', orgId],
		queryFn: () => inspectOrganizationReconciliation(orgId),
		enabled: Boolean(orgId) && enabled,
	});
}

export function useApplyOrganizationReconciliation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ orgId, payload }: { orgId: string; payload: ApplyReconciliationPayload }) =>
			applyOrganizationReconciliation(orgId, payload),
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({ queryKey: ['reconciliation', 'organization', variables.orgId] });
			void queryClient.invalidateQueries({ queryKey: ['organizations'] });
			void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
		},
	});
}

export function useUserReconciliation(userId: string, enabled = true) {
	return useQuery({
		queryKey: ['reconciliation', 'user', userId],
		queryFn: () => inspectUserReconciliation(userId),
		enabled: Boolean(userId) && enabled,
	});
}

export function useApplyUserReconciliation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, payload }: { userId: string; payload: ApplyReconciliationPayload }) =>
			applyUserReconciliation(userId, payload),
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({ queryKey: ['reconciliation', 'user', variables.userId] });
			void queryClient.invalidateQueries({ queryKey: ['users'] });
			void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
		},
	});
}
