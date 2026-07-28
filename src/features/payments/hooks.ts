import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPaymentIntent, verifyPaymentIntent } from './api';

export function useCreatePaymentIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaymentIntent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useVerifyPaymentIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyPaymentIntent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}
