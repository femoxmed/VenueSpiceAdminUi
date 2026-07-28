import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/features/orders/api';

export function useOrders() {
	return useQuery({
		queryKey: ['ticket-orders'],
		queryFn: getOrders,
	});
}
