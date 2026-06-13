import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';
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
  return useProtectedMutation(
    (data: Partial<StockRequest>) =>
      api<SingleResponse>('/stock-requests', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['stockRequests']] },
  );
}

export function useUpdateStockRequest() {
  return useProtectedMutation(
    ({ id, data }: { id: number; data: Partial<StockRequest> }) =>
      api<SingleResponse>(`/stock-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    { invalidates: [['stockRequests']] },
  );
}

export function useDeleteStockRequest() {
  return useProtectedMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api(`/stock-requests/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    { invalidates: [['stockRequests']] },
  );
}
