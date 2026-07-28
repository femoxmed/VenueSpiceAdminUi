import { apiClient } from '@/lib/api-client';

export type UserRow = {
	id: string;
	fullName?: string;
	email: string;
	phone?: string | null;
	role: string;
	active?: boolean;
	isActive?: boolean;
	verifiedAt?: string | null;
	activeAt?: string | null;
	subscriptionPlan?: string | null;
	installedProducts?: number;
	createdAt?: string;
	updatedAt?: string;
};

export type CreateUserPayload = {
	fullName: string;
	email: string;
	password: string;
	role: 'super_admin' | 'platform_admin' | 'org_admin' | 'org_staff' | 'agent' | 'customer' | 'admin' | 'user';
	isActive?: boolean;
};

export function getUsers() {
	return apiClient<UserRow[]>('/auth/users');
}

export function createUser(payload: CreateUserPayload) {
	return apiClient<UserRow>('/auth/users', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function getUser(userId: string) {
	return apiClient<UserRow>(`/auth/users/${userId}`);
}

export function updateUser(
	userId: string,
	payload: Partial<CreateUserPayload>,
) {
	return apiClient<UserRow>(`/auth/users/${userId}`, {
		method: 'PATCH',
		body: JSON.stringify(payload),
	});
}
