import { apiClient } from '@/lib/api-client';

export interface CartItem {
	productId: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
	installedProductId?: string;
	type?: string;
}

export interface CartSummary {
	distinctItems: number;
	itemCount: number;
	subtotal: number;
}

export interface Cart {
	userId: string;
	updatedAt: string;
	items: CartItem[];
	summary: CartSummary;
	customerEmail?: string;
	customerName?: string;
}

export const cartApi = {
	getAllCarts: (): Promise<Cart[]> => {
		return apiClient('/cart/admin/all');
	},

	getUserCart: (userId: string): Promise<Cart> => {
		return apiClient(`/cart/admin/user/${userId}`);
	},
};
