import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	approveWithdrawalRequest,
	getStripeBalance,
	getWithdrawalRequests,
	payWithdrawalRequest,
	rejectWithdrawalRequest,
} from './api';

export function useWithdrawalRequests(status?: string) {
	return useQuery({
		queryKey: ['withdrawal-requests', status ?? 'all'],
		queryFn: () => getWithdrawalRequests(status),
	});
}

export function useStripeBalance() {
	return useQuery({
		queryKey: ['stripe-balance'],
		queryFn: getStripeBalance,
	});
}

export function useApproveWithdrawalRequest() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, note }: { id: string; note?: string }) => approveWithdrawalRequest(id, note),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
			void queryClient.invalidateQueries({ queryKey: ['stripe-balance'] });
		},
	});
}

export function useRejectWithdrawalRequest() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, note }: { id: string; note?: string }) => rejectWithdrawalRequest(id, note),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
		},
	});
}

export function usePayWithdrawalRequest() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: payWithdrawalRequest,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
			void queryClient.invalidateQueries({ queryKey: ['stripe-balance'] });
		},
	});
}
