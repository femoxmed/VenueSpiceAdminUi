import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approveRefundRequest, declineRefundRequest, getRefundRequests } from '@/features/refunds/api';

export function useRefundRequests() {
	return useQuery({
		queryKey: ['refund-requests'],
		queryFn: getRefundRequests,
	});
}

export function useApproveRefundRequest() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, note }: { id: string; note?: string }) => approveRefundRequest(id, note),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
			queryClient.invalidateQueries({ queryKey: ['ticket-orders'] });
		},
	});
}

export function useDeclineRefundRequest() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, note }: { id: string; note?: string }) => declineRefundRequest(id, note),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
		},
	});
}
