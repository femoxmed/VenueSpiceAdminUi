import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createServiceType, getServiceTypes, updateServiceType } from './api';

export function useServiceTypes() {
	return useQuery({
		queryKey: ['service-types'],
		queryFn: getServiceTypes,
	});
}

export function useCreateServiceType() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createServiceType,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['service-types'] });
			queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
		},
	});
}

export function useUpdateServiceType() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: any }) =>
			updateServiceType(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['service-types'] });
			queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
		},
	});
}
