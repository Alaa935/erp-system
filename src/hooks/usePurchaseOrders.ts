import { useQuery } from '@tanstack/react-query'; import api from '../lib/api-client'; import { useProtectedMutation } from './useProtectedMutation';
import type { PurchaseOrder } from '../types';

interface ListResponse {
  success: boolean;
  orders: PurchaseOrder[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: PurchaseOrder;
}

export function usePurchaseOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['purchaseOrders', params],
    queryFn: () => api<ListResponse>('/purchase-orders', { params }),
  });
}

export function usePurchaseOrder(id: number | undefined) {
  return useQuery({
    queryKey: ['purchaseOrders', id],
    queryFn: () => api<SingleResponse>(`/purchase-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  return useProtectedMutation(
    (data: Partial<PurchaseOrder>) =>
      api<SingleResponse>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['purchaseOrders']] },
  );
}

export function useUpdatePurchaseOrder() {
  return useProtectedMutation(
    ({ id, data }: { id: number; data: Partial<PurchaseOrder> }) =>
      api<SingleResponse>(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    { invalidates: [['purchaseOrders']] },
  );
}

export function useDeletePurchaseOrder() {
  return useProtectedMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api(`/purchase-orders/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    { invalidates: [['purchaseOrders']] },
  );
}
