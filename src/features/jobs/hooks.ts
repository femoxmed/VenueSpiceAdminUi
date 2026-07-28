import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createServiceBooking, getJobs } from '@/features/jobs/api';

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  });
}

export function useCreateServiceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createServiceBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}
