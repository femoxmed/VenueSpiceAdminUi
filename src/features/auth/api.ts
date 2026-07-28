import { apiClient } from '@/lib/api-client';
import type { LoginResponse } from '@/features/auth/types';
import type { GuestCartItem } from '@/features/cart/types';

export function login(payload: { email: string; password: string; guestCartItems?: GuestCartItem[] }) {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function verifyAdminOtp(payload: { email: string; code: string }) {
  return apiClient<Extract<LoginResponse, { accessToken: string }>>('/auth/verify-admin-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return apiClient<Extract<LoginResponse, { accessToken: string }>['user']>('/auth/me');
}
