import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
import type { Employee } from '../types';

interface ListResponse {
  success: boolean;
  items: Employee[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: Employee;
}

export function useEmployees(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => api<ListResponse>('/employees', { params }),
  });
}

export function useEmployee(id: number | undefined) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => api<SingleResponse>(`/employees/${id}`),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Employee>) =>
      api<SingleResponse>('/employees', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Employee> }) =>
      api<SingleResponse>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(`/employees/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); },
  });
}
