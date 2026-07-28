import { apiClient } from '@/lib/api-client';

export type PaymentIntentRow = {
  id: string;
  status: string;
  provider: string;
  providerReference: string;
  authorizationUrl?: string | null;
  accessCode?: string | null;
  amount: number;
  currency: string;
  customerEmail: string;
  paidAt?: string | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
  } | null;
};

export function createPaymentIntent(payload: { invoiceId: string; idempotencyKey?: string }) {
  return apiClient<PaymentIntentRow>('/payments/intents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function verifyPaymentIntent(paymentIntentId: string) {
  return apiClient<PaymentIntentRow>('/payments/intents/' + paymentIntentId + '/verify', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
