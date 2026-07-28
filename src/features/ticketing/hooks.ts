import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketingApi, type CreateEventPayload, type Event, type OrganizationPayload } from './api';

export function useOrganizations() {
	return useQuery({
		queryKey: ['organizations'],
		queryFn: ticketingApi.organizations,
	});
}

export function useOrganization(id: string) {
	return useQuery({
		queryKey: ['organizations', id],
		queryFn: () => ticketingApi.organization(id),
		enabled: Boolean(id),
	});
}

export function useCreateOrganization() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: OrganizationPayload) =>
			ticketingApi.createOrganization(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
	});
}

export function useUpdateOrganization() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: Partial<OrganizationPayload> }) =>
			ticketingApi.updateOrganization(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
	});
}

export function useEvents(organizationId?: string) {
	return useQuery({
		queryKey: ['events', organizationId ?? 'all'],
		queryFn: () => ticketingApi.events(organizationId),
	});
}

export function useAgents() {
	return useQuery({
		queryKey: ['agents'],
		queryFn: ticketingApi.agents,
	});
}

export function useCreateEvent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateEventPayload) => ticketingApi.createEvent(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
	});
}

export function useUpdateEventStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: Event['status'] }) =>
			ticketingApi.updateEventStatus(id, status),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
	});
}
