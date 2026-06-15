import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';
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
  return useProtectedMutation(
    (data: { customerId: number; items: { itemId: number; quantity: number; price: number }[]; taxId?: number | null }) =>
      api<SingleResponse>('/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['sales-orders'], ['inventory']] },
  );
}

export function useDispatchSalesOrder() {
  return useProtectedMutation(
    (id: number) =>
      api<SingleResponse>(`/sales-orders/${id}/dispatch`, { method: 'POST' }),
    { invalidates: [['sales-orders'], ['inventory'], ['dashboard']] },
  );
}

export function useCancelSalesOrder() {
  return useProtectedMutation(
    (id: number) =>
      api<SingleResponse>(`/sales-orders/${id}/cancel`, { method: 'POST' }),
    { invalidates: [['sales-orders'], ['inventory'], ['dashboard']] },
  );
}

export function useDeleteSalesOrder() {
  return useProtectedMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api(`/sales-orders/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    { invalidates: [['sales-orders']] },
  );
}

export function useSalesOrderPayment() {
  return useProtectedMutation(
    ({ id, amount, method }: { id: number; amount: number; method: string }) =>
      api(`/sales-orders/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount, method }),
      }),
    { invalidates: [['sales-orders']] },
  );
}
