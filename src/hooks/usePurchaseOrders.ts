import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PurchaseOrder>) =>
      api<SingleResponse>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchaseOrders'] }); },
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PurchaseOrder> }) =>
      api<SingleResponse>(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchaseOrders'] }); },
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(`/purchase-orders/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchaseOrders'] }); },
  });
}
