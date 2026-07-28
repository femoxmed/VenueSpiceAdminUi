import { apiClient } from '@/lib/api-client';

export type TicketMessage = {
	id: string;
	content: string;
	isInternalNote: boolean;
	attachments?: string[];
	source?: 'app' | 'email' | 'chat' | 'admin';
	externalMessageId?: string | null;
	emailThreadId?: string | null;
	createdAt: string;
	author?: { id: string; fullName?: string; email?: string };
};

export type SupportTicketRow = {
	id: string;
	subject: string;
	description?: string;
	status: string;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	category: 'technical' | 'billing' | 'order' | 'installation' | 'general';
	createdAt: string;
	updatedAt: string;
	customer?: { id: string; fullName?: string; email?: string };
	assignedUser?: { id: string; fullName?: string; email?: string };
	request?: {
		id: string;
		status?: string;
		issue?: string;
		serviceType?: { name?: string };
	} | null;
	product?: { id: string; name?: string; sku?: string } | null;
	chatThreadId?: string | null;
	emailThreadId?: string | null;
	messages?: TicketMessage[];
};

export type TicketStats = {
	total: number;
	open: number;
	inProgress: number;
	resolved: number;
	closed: number;
};

export const supportTicketsApi = {
	getAll: (): Promise<SupportTicketRow[]> => {
		return apiClient('/support-tickets');
	},

	getById: (id: string): Promise<SupportTicketRow> => {
		return apiClient(`/support-tickets/${id}`);
	},

	getStats: (): Promise<TicketStats> => {
		return apiClient('/support-tickets/stats');
	},

	create: (data: Partial<SupportTicketRow>): Promise<SupportTicketRow> => {
		return apiClient('/support-tickets', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	update: (
		id: string,
		data: Partial<SupportTicketRow>,
	): Promise<SupportTicketRow> => {
		return apiClient(`/support-tickets/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	assign: (
		id: string,
		assignedTo: string | null,
	): Promise<SupportTicketRow> => {
		return apiClient(`/support-tickets/${id}/assign`, {
			method: 'PATCH',
			body: JSON.stringify({ assignedTo }),
		});
	},

	updateStatus: (id: string, status: string): Promise<SupportTicketRow> => {
		return apiClient(`/support-tickets/${id}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ status }),
		});
	},

	delete: (id: string): Promise<void> => {
		return apiClient(`/support-tickets/${id}`, { method: 'DELETE' });
	},

	getByIdWithMessages: (id: string): Promise<SupportTicketRow> => {
		return apiClient(`/support-tickets/${id}/messages`);
	},

	addMessage: (
		id: string,
		data: {
			content: string;
			isInternalNote?: boolean;
			attachments?: string[];
		},
	): Promise<TicketMessage> => {
		return apiClient(`/support-tickets/${id}/messages`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},
};
