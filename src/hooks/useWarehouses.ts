import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';

interface Warehouse {
  id: number;
  name: string;
  location: string;
  capacity: number;
  manager: string;
  itemCount?: number;
  createdAt?: number;
  deletedAt?: number;
  deleteReason?: string;
}

interface ListResponse {
  success: boolean;
  data: Warehouse[];
}

interface SingleResponse {
  success: boolean;
  data: Warehouse;
}

export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api<ListResponse>('/warehouses'),
    staleTime: 60_000,
  });
}

export function useWarehouse(id: number | undefined) {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => api<SingleResponse>(`/warehouses/${id}`),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  return useProtectedMutation(
    (data: Partial<Warehouse>) =>
      api<SingleResponse>('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['warehouses']] },
  );
}

export function useUpdateWarehouse() {
  return useProtectedMutation(
    ({ id, data }: { id: number; data: Partial<Warehouse> }) =>
      api<SingleResponse>(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    { invalidates: [['warehouses']] },
  );
}

export function useDeleteWarehouse() {
  return useProtectedMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api(`/warehouses/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    { invalidates: [['warehouses']] },
  );
}
