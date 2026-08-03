import { apiClient } from '@/lib/api-client';

export type PaymentIntentRow = {
  id: string;
  status: string;
  provider: string;
  providerReference: string;
  authorizationUrl?: string | null;
  accessCode?: string | null;
  amount: number;
  subtotal?: number | string;
  tax?: number | string;
  platformFee?: number | string;
  processingFee?: number | string;
  total?: number | string;
  currency: string;
  customerEmail: string;
  createdAt?: string;
  providerStatus?: string | null;
  paidAt?: string | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
  } | null;
};

export function getPaymentIntents() {
  return apiClient<PaymentIntentRow[]>('/payments/intents');
}

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
