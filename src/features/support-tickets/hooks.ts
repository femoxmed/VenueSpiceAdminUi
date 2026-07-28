import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	supportTicketsApi,
	SupportTicketRow,
	TicketStats,
	TicketMessage,
} from './api';

export function useSupportTickets() {
	return useQuery({
		queryKey: ['support-tickets'],
		queryFn: supportTicketsApi.getAll,
	});
}

export function useSupportTicket(id: string) {
	return useQuery({
		queryKey: ['support-tickets', id],
		queryFn: () => supportTicketsApi.getById(id),
		enabled: !!id,
	});
}

export function useSupportTicketStats() {
	return useQuery({
		queryKey: ['support-tickets-stats'],
		queryFn: supportTicketsApi.getStats,
	});
}

export function useCreateTicket() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: supportTicketsApi.create,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
			queryClient.invalidateQueries({ queryKey: ['support-tickets-stats'] });
		},
	});
}

export function useUpdateTicket() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: Partial<SupportTicketRow>;
		}) => supportTicketsApi.update(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
			queryClient.invalidateQueries({ queryKey: ['support-tickets-stats'] });
		},
	});
}

export function useAssignTicket() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			assignedTo,
		}: {
			id: string;
			assignedTo: string | null;
		}) => supportTicketsApi.assign(id, assignedTo),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
		},
	});
}

export function useUpdateTicketStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) =>
			supportTicketsApi.updateStatus(id, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
			queryClient.invalidateQueries({ queryKey: ['support-tickets-stats'] });
		},
	});
}

export function useDeleteTicket() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: supportTicketsApi.delete,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
			queryClient.invalidateQueries({ queryKey: ['support-tickets-stats'] });
		},
	});
}

export function useSupportTicketWithMessages(id: string) {
	return useQuery({
		queryKey: ['support-tickets', id, 'messages'],
		queryFn: () => supportTicketsApi.getByIdWithMessages(id),
		enabled: !!id,
	});
}

export function useAddTicketMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: {
				content: string;
				isInternalNote?: boolean;
				attachments?: string[];
			};
		}) => supportTicketsApi.addMessage(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({
				queryKey: ['support-tickets', id, 'messages'],
			});
		},
	});
}
