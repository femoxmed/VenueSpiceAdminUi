import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders, reconcilePendingStripeOrders } from '@/features/orders/api';

export function useOrders(status?: string) {
	return useQuery({
		queryKey: ['ticket-orders', status ?? 'all'],
		queryFn: () => getOrders(status),
	});
}

export function useReconcilePendingStripeOrders() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: reconcilePendingStripeOrders,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['ticket-orders'] });
			queryClient.invalidateQueries({ queryKey: ['payment-intents'] });
			queryClient.invalidateQueries({ queryKey: ['invoices'] });
			queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
		},
	});
}
