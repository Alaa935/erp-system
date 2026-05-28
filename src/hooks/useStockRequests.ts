import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
import type { StockRequest } from '../types';

interface ListResponse {
  success: boolean;
  items: StockRequest[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: StockRequest;
}

export function useStockRequests(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['stockRequests', params],
    queryFn: () => api<ListResponse>('/stock-requests', { params }),
  });
}

export function useStockRequest(id: number | undefined) {
  return useQuery({
    queryKey: ['stockRequests', id],
    queryFn: () => api<SingleResponse>(`/stock-requests/${id}`),
    enabled: !!id,
  });
}

export function useCreateStockRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StockRequest>) =>
      api<SingleResponse>('/stock-requests', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stockRequests'] }); },
  });
}

export function useUpdateStockRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StockRequest> }) =>
      api<SingleResponse>(`/stock-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stockRequests'] }); },
  });
}

export function useDeleteStockRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(`/stock-requests/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stockRequests'] }); },
  });
}
