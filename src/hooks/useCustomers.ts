import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
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
    queryFn: () => {
      const url = new URL(`${import.meta.env.VITE_API_URL || 'https://server-e6y4.onrender.com'}/api/customers`);
      if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v as string);
      console.log('[useCustomers] FETCH URL:', url.toString());
      console.log('[useCustomers] REQUEST PARAMS:', params);
      return api<ListResponse>('/customers', { params: params as Record<string, string> }).then(raw => {
        console.log('[useCustomers] RAW RESPONSE:', raw);
        console.log('[useCustomers] items.length:', raw?.items?.length);
        console.log('[useCustomers] meta:', raw?.meta);
        return raw;
      });
    },
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Customer>) =>
      api<SingleResponse>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      api<SingleResponse>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(`/customers/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); },
  });
}
