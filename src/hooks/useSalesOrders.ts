import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
import type { SalesOrder } from '../types';

interface ListResponse {
  success: boolean;
  orders: SalesOrder[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: SalesOrder;
}

export function useSalesOrders(params?: { page?: number; pageSize?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['sales-orders', params],
    queryFn: () => api<ListResponse>('/sales-orders', { params: params as Record<string, string> }),
    staleTime: 30_000,
  });
}

export function useSalesOrder(id: number | undefined) {
  return useQuery({
    queryKey: ['sales-orders', id],
    queryFn: () => api<SingleResponse>(`/sales-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { customerId: number; items: { itemId: number; quantity: number; price: number }[]; taxId?: number | null }) =>
      api<SingleResponse>('/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders'] }); },
  });
}

export function useDispatchSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<SingleResponse>(`/sales-orders/${id}/dispatch`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders'] }); },
  });
}

export function useCancelSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<SingleResponse>(`/sales-orders/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders'] }); },
  });
}

export function useDeleteSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(`/sales-orders/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders'] }); },
  });
}

export function useSalesOrderPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, method }: { id: number; amount: number; method: string }) =>
      api(`/sales-orders/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount, method }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders'] }); },
  });
}
