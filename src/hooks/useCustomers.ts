import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';
import type { Customer } from '../types';

interface ListResponse {
  success: boolean;
  items: Customer[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: Customer;
}

export function useCustomers(params?: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => api<ListResponse>('/customers', { params: params as Record<string, string> }),
  });
}

export function useCustomer(id: number | undefined) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => api<SingleResponse>(`/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  return useProtectedMutation(
    (data: Partial<Customer>) =>
      api<SingleResponse>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    { invalidates: [['customers']] },
  );
}

export function useUpdateCustomer() {
  return useProtectedMutation(
    ({ id, data }: { id: number; data: Partial<Customer> }) =>
      api<SingleResponse>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    { invalidates: [['customers']] },
  );
}

export function useDeleteCustomer() {
  return useProtectedMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api(`/customers/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }),
    { invalidates: [['customers']] },
  );
}
