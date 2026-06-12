import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';

export function useAccountingOverview() {
  return useQuery({
    queryKey: ['accounting', 'overview'],
    queryFn: () => api<any>('/accounting/overview'),
    staleTime: 60_000,
  });
}

export function useUpdateCapital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) =>
      api('/accounting/capital', { method: 'PUT', body: JSON.stringify({ amount }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; amount: number; category: string; description?: string; referenceId?: number }) =>
      api('/accounting/transactions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }),
  });
}

export function usePaymentHistory(referenceId: number | undefined, category: string) {
  return useQuery({
    queryKey: ['accounting', 'payment-history', referenceId, category],
    queryFn: () => api<any>(`/accounting/payment-history/${referenceId}`, { params: { category } as any }),
    enabled: !!referenceId,
  });
}

export function useConfirmCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/accounting/collections/${id}/confirm`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting'] });
      qc.invalidateQueries({ queryKey: ['paymentCollections'] });
      qc.invalidateQueries({ queryKey: ['pendingSettlement'] });
    },
  });
}

export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeId: number; baseSalary: number; advances?: number; bonuses?: number; deductions?: number; month: number }) =>
      api('/accounting/payroll', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }),
  });
}

export function useConfirmSalaryPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/accounting/payroll/${id}/confirm`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }),
  });
}

export function useUpdatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api(`/accounting/payroll/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }),
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; plateNumber: string; model?: string; fuelType?: string }) =>
      api('/accounting/vehicles', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }),
  });
}

export function useAddVehicleExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { vehicleId: number; amount: number; description: string }) =>
      api('/accounting/vehicles/expense', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }),
  });
}
