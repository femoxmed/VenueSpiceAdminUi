import { useQuery } from '@tanstack/react-query';
import { cartApi } from './api';

export function useAllCarts() {
	return useQuery({
		queryKey: ['carts'],
		queryFn: cartApi.getAllCarts,
	});
}

export function useUserCart(userId: string) {
	return useQuery({
		queryKey: ['cart', userId],
		queryFn: () => cartApi.getUserCart(userId),
		enabled: !!userId,
	});
}
