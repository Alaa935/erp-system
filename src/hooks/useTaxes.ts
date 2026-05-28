import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import type { TaxConfig } from '../types';

interface TaxesResponse {
  success: boolean;
  data: TaxConfig[];
}

export function useTaxes() {
  return useQuery({
    queryKey: ['taxes'],
    queryFn: () => api<TaxesResponse>('/sales-orders/taxes'),
    staleTime: 300_000,
  });
}
