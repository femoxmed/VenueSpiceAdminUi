import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createUser,
	getUsers,
	getUser,
	updateUser,
	CreateUserPayload,
} from '@/features/users/api';

export function useUsers() {
	return useQuery({
		queryKey: ['users'],
		queryFn: getUsers,
	});
}

export function useCreateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createUser,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
		},
	});
}

export function useUser(userId: string) {
	return useQuery({
		queryKey: ['users', userId],
		queryFn: () => getUser(userId),
	});
}

export function useUpdateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			userId,
			payload,
		}: {
			userId: string;
			payload: Partial<CreateUserPayload>;
		}) => updateUser(userId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
		},
	});
}
