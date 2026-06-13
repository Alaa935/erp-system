import { useQuery } from '@tanstack/react-query'; import api from '../lib/api-client'; import { useProtectedMutation } from './useProtectedMutation';

export function useNotifications(limit?: number) {
  return useQuery({
    queryKey: ['notifications', 'list', limit],
    queryFn: () => api<any>('/notifications', { params: { limit: String(limit ?? 50) } as any }),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api<any>('/notifications/unread'),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}

export function useMarkNotificationRead() {
  return useProtectedMutation(
    (id: number) => api(`/notifications/${id}/read`, { method: 'PUT' }),
    { invalidates: [['notifications']] },
  );
}

export function useMarkAllNotificationsRead() {
  return useProtectedMutation(
    () => api('/notifications/read-all', { method: 'PUT' }),
    { invalidates: [['notifications']] },
  );
}

export function useDeleteNotification() {
  return useProtectedMutation(
    (id: number) => api(`/notifications/${id}`, { method: 'DELETE' }),
    { invalidates: [['notifications']] },
  );
}

export function useCreateNotification() {
  return useProtectedMutation(
    (data: { title: string; message: string; type: string }) =>
      api('/notifications', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['notifications']] },
  );
}
