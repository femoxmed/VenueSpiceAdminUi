import { apiClient } from '@/lib/api-client';

export type JobRow = {
  id: string;
  customerName?: string;
  type?: string;
  scheduledDate?: string;
  status: string;
  customer?: { fullName?: string; email?: string };
  technician?: { fullName?: string; email?: string };
  issue?: string;
  preferredDate?: string;
  serviceType?: {
    id: string;
    name: string;
    billingMode: string;
    basePrice: number;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
  } | null;
  billingMode?: string;
  price?: number;
};

export type CreateServiceBookingPayload = {
  customerId: string;
  preferredDate: string;
  issue: string;
  technicianId?: string;
  paidItemId?: string;
  serviceTypeId: string;
  overridePrice?: number;
  status?: string;
};

export function getJobs() {
  return apiClient<JobRow[]>('/service-bookings');
}

export function createServiceBooking(payload: CreateServiceBookingPayload) {
  return apiClient<JobRow>('/service-bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
