import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
import type { SalesRep } from '../types';

interface ListResponse {
  success: boolean;
  items: SalesRep[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: SalesRep;
}

export function useSalesReps(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['salesReps', params],
    queryFn: () => {
      const url = new URL(`${import.meta.env.VITE_API_URL || 'https://server-e6y4.onrender.com'}/api/sales-reps`);
      if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v as string);
      console.log('[useSalesReps] FETCH URL:', url.toString());
      console.log('[useSalesReps] REQUEST PARAMS:', params);
      return api<ListResponse>('/sales-reps', { params }).then(raw => {
        console.log('[useSalesReps] RAW RESPONSE:', raw);
        console.log('[useSalesReps] items.length:', raw?.items?.length);
        console.log('[useSalesReps] meta:', raw?.meta);
        return raw;
      });
    },
  });
}

export function useSalesRep(id: number | undefined) {
  return useQuery({
    queryKey: ['salesReps', id],
    queryFn: () => api<SingleResponse>(`/sales-reps/${id}`),
    enabled: !!id,
  });
}

export function useCreateSalesRep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SalesRep>) =>
      api<SingleResponse>('/sales-reps', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salesReps'] }); },
  });
}

export function useUpdateSalesRep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SalesRep> }) =>
      api<SingleResponse>(`/sales-reps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salesReps'] }); },
  });
}

export function useDeleteSalesRep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(`/sales-reps/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salesReps'] }); },
  });
}
