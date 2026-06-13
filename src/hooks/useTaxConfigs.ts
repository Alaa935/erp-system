import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';
import type { TaxConfig } from '../types';

interface ListResponse {
  success: boolean;
  items: TaxConfig[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface SingleResponse {
  success: boolean;
  data: TaxConfig;
}

export function useTaxConfigs(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['taxConfigs', params],
    queryFn: () => api<ListResponse>('/tax-configs', { params }),
  });
}

export function useTaxConfig(id: number | undefined) {
  return useQuery({
    queryKey: ['taxConfigs', id],
    queryFn: () => api<SingleResponse>(`/tax-configs/${id}`),
    enabled: !!id,
  });
}

export function useCreateTaxConfig() {
  return useProtectedMutation(
    (data: Partial<TaxConfig>) =>
      api<SingleResponse>('/tax-configs', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['taxConfigs']] },
  );
}

export function useUpdateTaxConfig() {
  return useProtectedMutation(
    ({ id, data }: { id: number; data: Partial<TaxConfig> }) =>
      api<SingleResponse>(`/tax-configs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    { invalidates: [['taxConfigs']] },
  );
}

export function useDeleteTaxConfig() {
  return useProtectedMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api(`/tax-configs/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    { invalidates: [['taxConfigs']] },
  );
}
