import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createProduct,
	deleteProduct,
	getProducts,
	getProduct,
	updateProduct,
	CreateProductPayload,
} from './api';

export function useProducts() {
	return useQuery({
		queryKey: ['products'],
		queryFn: getProducts,
	});
}

export function useCreateProduct() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateProductPayload | FormData) =>
			createProduct(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
		},
	});
}

export function useProduct(productId: string) {
	return useQuery({
		queryKey: ['products', productId],
		queryFn: () => getProduct(productId),
		enabled: Boolean(productId),
	});
}

export function useUpdateProduct() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			productId,
			payload,
		}: {
			productId: string;
			payload: Partial<CreateProductPayload> | FormData;
		}) => updateProduct(productId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
		},
	});
}

export function useDeleteProduct() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (productId: string) => deleteProduct(productId),
		onSuccess: (_data, productId) => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			queryClient.removeQueries({ queryKey: ['products', productId] });
		},
	});
}
