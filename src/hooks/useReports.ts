import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';

export function useFinancialSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'financial-summary', startDate, endDate],
    queryFn: () => api<any>('/reports/financial-summary', { params: { startDate, endDate } as any }),
    staleTime: 60_000,
  });
}

export function useProfitLoss(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'profit-loss', startDate, endDate],
    queryFn: () => api<any>('/reports/profit-loss', { params: { startDate, endDate } as any }),
    staleTime: 60_000,
  });
}

export function useSalesReports(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'sales', startDate, endDate],
    queryFn: () => api<any>('/reports/sales', { params: { startDate, endDate } as any }),
    staleTime: 60_000,
  });
}

export function usePurchaseReports(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'purchases', startDate, endDate],
    queryFn: () => api<any>('/reports/purchases', { params: { startDate, endDate } as any }),
    staleTime: 60_000,
  });
}

export function useInventoryReports() {
  return useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: () => api<any>('/reports/inventory'),
    staleTime: 60_000,
  });
}

export function useCustomerBalances() {
  return useQuery({
    queryKey: ['reports', 'customer-balances'],
    queryFn: () => api<any>('/reports/customer-balances'),
    staleTime: 120_000,
  });
}

export function useSupplierBalances() {
  return useQuery({
    queryKey: ['reports', 'supplier-balances'],
    queryFn: () => api<any>('/reports/supplier-balances'),
    staleTime: 120_000,
  });
}

export function useTaxReports(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'tax', startDate, endDate],
    queryFn: () => api<any>('/reports/tax', { params: { startDate, endDate } as any }),
    staleTime: 60_000,
  });
}

export function useCashflow(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'cashflow', startDate, endDate],
    queryFn: () => api<any>('/reports/cashflow', { params: { startDate, endDate } as any }),
    staleTime: 60_000,
  });
}

export function useActivityLog(limit?: number) {
  return useQuery({
    queryKey: ['reports', 'activity', limit],
    queryFn: () => api<any>('/reports/activity', { params: { limit: String(limit ?? 50) } as any }),
    staleTime: 30_000,
  });
}
