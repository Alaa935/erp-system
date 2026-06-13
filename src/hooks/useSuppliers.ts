import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';
import type { Supplier } from '../types';

interface ListResponse {
  success: boolean;
  items: Supplier[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: Supplier;
}

export function useSuppliers(params?: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => api<ListResponse>('/suppliers', { params: params as Record<string, string> }),
  });
}

export function useSupplier(id: number | undefined) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => api<SingleResponse>(`/suppliers/${id}`),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  return useProtectedMutation(
    (data: Partial<Supplier>) =>
      api<SingleResponse>('/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    { invalidates: [['suppliers']] },
  );
}

export function useUpdateSupplier() {
  return useProtectedMutation(
    ({ id, data }: { id: number; data: Partial<Supplier> }) =>
      api<SingleResponse>(`/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    { invalidates: [['suppliers']] },
  );
}

export function useDeleteSupplier() {
  return useProtectedMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api(`/suppliers/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }),
    { invalidates: [['suppliers']] },
  );
}
