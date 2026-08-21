import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
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
    queryFn: () => {
      const url = new URL(`${import.meta.env.VITE_API_URL || 'https://server-e6y4.onrender.com'}/api/suppliers`);
      if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v as string);
      console.log('[useSuppliers] FETCH URL:', url.toString());
      console.log('[useSuppliers] REQUEST PARAMS:', params);
      return api<ListResponse>('/suppliers', { params: params as Record<string, string> }).then(raw => {
        console.log('[useSuppliers] RAW RESPONSE:', raw);
        console.log('[useSuppliers] items.length:', raw?.items?.length);
        console.log('[useSuppliers] meta:', raw?.meta);
        return raw;
      });
    },
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Supplier>) =>
      api<SingleResponse>('/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Supplier> }) =>
      api<SingleResponse>(`/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(`/suppliers/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); },
  });
}
