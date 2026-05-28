import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
import type { SystemConfig } from '../types';

interface SingleResponse {
  success: boolean;
  data: SystemConfig;
}

export function useSystemConfig() {
  return useQuery({
    queryKey: ['system-config'],
    queryFn: () => api<SingleResponse>('/system-config'),
    staleTime: 300_000,
  });
}

export function useUpdateSystemConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SystemConfig>) =>
      api<SingleResponse>('/system-config', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-config'] }); },
  });
}
