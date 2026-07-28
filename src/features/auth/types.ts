import type { GuestCartItem } from '@/features/cart/types';

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
    isActive?: boolean;
  };
  cart?: {
    items: Array<
      GuestCartItem & {
        productName?: string;
        unitPrice?: number;
        lineTotal?: number;
      }
    >;
    summary: {
      distinctItems: number;
      itemCount: number;
      subtotal: number;
    };
  };
};

export type OtpChallengeResponse = {
  requiresOtp: true;
  email: string;
  message: string;
};

export type LoginResponse = AuthSessionResponse | OtpChallengeResponse;
