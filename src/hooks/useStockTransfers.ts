import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';
import type { StockTransfer } from '../types';

interface ListResponse {
  success: boolean;
  items: StockTransfer[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: StockTransfer;
}

export function useStockTransfers(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['stockTransfers', params],
    queryFn: () => api<ListResponse>('/stock-transfers', { params }),
  });
}

export function useStockTransfer(id: number | undefined) {
  return useQuery({
    queryKey: ['stockTransfers', id],
    queryFn: () => api<SingleResponse>(`/stock-transfers/${id}`),
    enabled: !!id,
  });
}

export function useCreateStockTransfer() {
  return useProtectedMutation(
    (data: Partial<StockTransfer>) =>
      api<SingleResponse>('/stock-transfers', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['stockTransfers']] },
  );
}

export function useUpdateStockTransfer() {
  return useProtectedMutation(
    ({ id, data }: { id: number; data: Partial<StockTransfer> }) =>
      api<SingleResponse>(`/stock-transfers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    { invalidates: [['stockTransfers']] },
  );
}

export function useDeleteStockTransfer() {
  return useProtectedMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api(`/stock-transfers/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    { invalidates: [['stockTransfers']] },
  );
}
