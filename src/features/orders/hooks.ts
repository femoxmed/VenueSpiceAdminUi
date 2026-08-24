import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/features/orders/api';

export function useOrders(status?: string) {
	return useQuery({
		queryKey: ['ticket-orders', status ?? 'all'],
		queryFn: () => getOrders(status),
	});
}
