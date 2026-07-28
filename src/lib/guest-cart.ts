import type { GuestCartItem } from '@/features/cart/types';

const GUEST_CART_KEY = 'aquzera_guest_cart';

export function getGuestCartItems(): GuestCartItem[] {
  const raw = localStorage.getItem(GUEST_CART_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as GuestCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setGuestCartItems(items: GuestCartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function clearGuestCartItems() {
  localStorage.removeItem(GUEST_CART_KEY);
}
