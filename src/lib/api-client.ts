import { authStore } from '@/lib/auth-store';

const API_BASE_URL =
	(import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env
		?.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

type ApiOptions = RequestInit & {
	query?: Record<string, string | number | undefined | null>;
};

export async function apiClient<T>(
	path: string,
	options: ApiOptions = {},
): Promise<T> {
	return request<T>(path, options, true);
}

async function request<T>(
	path: string,
	options: ApiOptions,
	allowRefresh: boolean,
): Promise<T> {
	const token = authStore.getToken();
	const url = new URL(`${API_BASE_URL}${path}`);

	if (options.query) {
		Object.entries(options.query).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				url.searchParams.set(key, String(value));
			}
		});
	}

	// Only set Content-Type: application/json for non-FormData requests
	const headers: Record<string, string> = {
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...(options.headers ? Object.fromEntries(new Headers(options.headers).entries()) : {}),
	};

	// ✅ FORCE DELETE Content-Type header for FormData requests
	if (options.body instanceof FormData) {
		// This forces browser to automatically set correct multipart header with boundary
		delete (headers as any)['Content-Type'];
		delete (headers as any)['content-type'];
	} else if (!headers['Content-Type']) {
		// Only set JSON header for normal requests
		headers['Content-Type'] = 'application/json';
	}

	const response = await fetch(url.toString(), {
		...options,
		headers,
	});

	const isJson = response.headers
		.get('content-type')
		?.includes('application/json');
	const payload = isJson ? await response.json().catch(() => null) : null;

	if (!response.ok) {
		if (response.status === 401 && allowRefresh) {
			const refreshed = await refreshSession();
			if (refreshed) {
				return request<T>(path, options, false);
			}
		}

		if (response.status === 401 || response.status === 403) {
			authStore.clear();
			if (window.location.pathname !== '/login') {
				window.location.assign('/login');
			}
		}

		throw new Error(
			payload?.message ?? `Request failed with status ${response.status}`,
		);
	}

	return payload as T;
}

async function refreshSession() {
	const refreshToken = authStore.getRefreshToken();
	if (!refreshToken) return false;

	const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refreshToken }),
	});

	if (!response.ok) return false;

	const data = (await response.json()) as {
		accessToken: string;
		refreshToken?: string;
		user: import('@/lib/auth-store').AuthUser;
	};
	authStore.setSession(data.accessToken, data.user, data.refreshToken ?? refreshToken);
	return true;
}
