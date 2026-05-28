import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
import type { Branch } from '../types';

interface ListResponse {
  success: boolean;
  items: Branch[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: Branch;
}

export function useBranches(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['branches', params],
    queryFn: () => api<ListResponse>('/branches', { params }),
  });
}

export function useBranch(id: number | undefined) {
  return useQuery({
    queryKey: ['branches', id],
    queryFn: () => api<SingleResponse>(`/branches/${id}`),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Branch>) =>
      api<SingleResponse>('/branches', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); },
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Branch> }) =>
      api<SingleResponse>(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(`/branches/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); },
  });
}
