import { apiClient } from '@/lib/api-client';

export type ServiceTypeRow = {
	id: string;
	name: string;
	code: string;
	description?: string | null;
	basePrice: number;
	billingMode: 'fixed' | 'quote' | 'warranty' | 'free';
	requiresTechnician: boolean;
	estimatedDurationMinutes: number;
	isActive: boolean;
};

export type CreateServiceTypePayload = {
	name: string;
	code: string;
	description?: string;
	basePrice: number;
	billingMode: 'fixed' | 'quote' | 'warranty' | 'free';
	requiresTechnician?: boolean;
	estimatedDurationMinutes?: number;
	isActive?: boolean;
};

export function getServiceTypes() {
	return apiClient<ServiceTypeRow[]>('/service-types');
}

export function createServiceType(payload: CreateServiceTypePayload) {
	return apiClient<ServiceTypeRow>('/service-types', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function getServiceType(id: string) {
	return apiClient<ServiceTypeRow>(`/service-types/${id}`);
}

export function updateServiceType(
	id: string,
	payload: Partial<CreateServiceTypePayload>,
) {
	return apiClient<ServiceTypeRow>(`/service-types/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
}
