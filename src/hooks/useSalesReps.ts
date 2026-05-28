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
    queryFn: () => api<ListResponse>('/sales-reps', { params }),
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
