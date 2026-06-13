import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';
import type { Item } from '../types';

interface ListResponse {
  success: boolean;
  items: Item[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: Item;
}

export function useInventory(params?: { page?: number; pageSize?: number; search?: string; category?: string }) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => api<ListResponse>('/inventory', { params: params as Record<string, string> }),
  });
}

export function useInventoryItem(id: number | undefined) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => api<SingleResponse>(`/inventory/${id}`),
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  return useProtectedMutation(
    (data: Partial<Item>) =>
      api<SingleResponse>('/inventory', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['inventory']] },
  );
}

export function useUpdateInventoryItem() {
  return useProtectedMutation(
    ({ id, data }: { id: number; data: Partial<Item> }) =>
      api<SingleResponse>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    { invalidates: [['inventory']] },
  );
}

export function useDeleteInventoryItem() {
  return useProtectedMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api(`/inventory/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    { invalidates: [['inventory']] },
  );
}

export function useAdjustInventoryItem() {
  return useProtectedMutation(
    ({ id, diff, type, reason }: { id: number; diff: number; type: 'increase' | 'decrease'; reason: string }) =>
      api<SingleResponse>(`/inventory/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ diff, type, reason }),
      }),
    { invalidates: [['inventory']] },
  );
}

export function useLowStockItems(minStockLevel?: number) {
  return useQuery({
    queryKey: ['inventory', 'low-stock', minStockLevel],
    queryFn: () => api<{ success: boolean; data: Item[] }>('/inventory/low-stock', {
      params: { minStockLevel: String(minStockLevel ?? 10) },
    }),
  });
}
