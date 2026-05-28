import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';

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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Warehouse>) =>
      api<SingleResponse>('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); },
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Warehouse> }) =>
      api<SingleResponse>(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(`/warehouses/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); },
  });
}
