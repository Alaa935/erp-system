import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StockTransfer>) =>
      api<SingleResponse>('/stock-transfers', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stockTransfers'] }); },
  });
}

export function useUpdateStockTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StockTransfer> }) =>
      api<SingleResponse>(`/stock-transfers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stockTransfers'] }); },
  });
}

export function useDeleteStockTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(`/stock-transfers/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stockTransfers'] }); },
  });
}
