import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';

export function useNotifications(limit?: number, enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'list', limit],
    queryFn: () => api<any>('/notifications', { params: { limit: String(limit ?? 50) } as any }),
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled,
  });
}

export function useUnreadNotifications(enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api<any>('/notifications/unread'),
    staleTime: 10_000,
    refetchInterval: 20_000,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/notifications/${id}/read`, { method: 'PUT' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'PUT' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; message: string; type: string }) =>
      api('/notifications', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}
