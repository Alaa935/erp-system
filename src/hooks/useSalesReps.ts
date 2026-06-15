import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';
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
    queryKey: params ? ['salesReps', params] : ['salesReps'],
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
  return useProtectedMutation(
    (data: Partial<SalesRep>) =>
      api<SingleResponse>('/sales-reps', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['salesReps']] },
  );
}

export function useUpdateSalesRep() {
  return useProtectedMutation(
    ({ id, data }: { id: number; data: Partial<SalesRep> }) =>
      api<SingleResponse>(`/sales-reps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    { invalidates: [['salesReps']] },
  );
}

export function useDeleteSalesRep() {
  return useProtectedMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api(`/sales-reps/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    { invalidates: [['salesReps']] },
  );
}
