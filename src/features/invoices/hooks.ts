import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInvoices, resendInvoice } from './api';

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices,
  });
}

export function useResendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, email }: { invoiceId: string; email?: string }) => resendInvoice(invoiceId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
