import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';
import type { InvoiceSettings } from '../types';

interface SingleResponse {
  success: boolean;
  data: InvoiceSettings;
}

export function useInvoiceSettings() {
  return useQuery({
    queryKey: ['invoiceSettings'],
    queryFn: () => api<SingleResponse>('/invoice-settings'),
  });
}

export function useUpsertInvoiceSettings() {
  return useProtectedMutation(
    (data: Partial<InvoiceSettings>) =>
      api<SingleResponse>('/invoice-settings', { method: 'PUT', body: JSON.stringify(data) }),
    { invalidates: [['invoiceSettings']] },
  );
}
