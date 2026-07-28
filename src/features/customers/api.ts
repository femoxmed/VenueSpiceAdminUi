import { apiClient } from '@/lib/api-client';

export type CustomerRow = {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
  phone?: string;
  subscriptionPlan?: string;
  status?: string;
  machines?: number;
  installedProducts?: number;
};

export type CreateCustomerPayload = {
  fullName: string;
  email: string;
  phone: string;
  subscriptionPlan?: string;
};

export function getCustomers() {
  return apiClient<CustomerRow[]>('/customers');
}

export function createCustomer(payload: CreateCustomerPayload) {
  return apiClient<CustomerRow>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
