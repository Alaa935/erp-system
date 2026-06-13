import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';

interface ListResponse {
  success: boolean;
  items: any[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function usePaymentCollections(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['paymentCollections', params],
    queryFn: () => api<ListResponse>('/payment-collections', { params: params as Record<string, string> }),
  });
}

export function useConfirmPaymentCollection() {
  return useProtectedMutation(
    ({ id, status }: { id: number; status: string }) =>
      api(`/payment-collections/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    { invalidates: [['paymentCollections']] },
  );
}
