import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPaymentIntent, getPaymentIntents, verifyPaymentIntent } from './api';

export function usePaymentIntents() {
  return useQuery({
    queryKey: ['payment-intents'],
    queryFn: getPaymentIntents,
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
