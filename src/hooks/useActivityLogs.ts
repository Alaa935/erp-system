import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';

interface ActivityLogsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  entity?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export function useActivityLogs(params?: ActivityLogsParams) {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () => api<any>('/activity-logs', { params: params as any }),
    staleTime: 30_000,
  });
}

export function useActivityLog(id: number | undefined) {
  return useQuery({
    queryKey: ['activity-logs', id],
    queryFn: () => api<any>(`/activity-logs/${id}`),
    enabled: !!id,
  });
}
