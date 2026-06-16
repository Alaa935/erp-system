import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InvoiceSettings>) =>
      api<SingleResponse>('/invoice-settings', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoiceSettings'] }); },
  });
}
