import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPaymentIntent, getPaymentIntents, verifyPaymentIntent } from './api';

export function usePaymentIntents(status?: string) {
  return useQuery({
    queryKey: ['payment-intents', status ?? 'all'],
    queryFn: () => getPaymentIntents(status),
  });
}

export function useCreatePaymentIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaymentIntent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payment-intents'] });
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
      queryClient.invalidateQueries({ queryKey: ['payment-intents'] });
    },
  });
}
