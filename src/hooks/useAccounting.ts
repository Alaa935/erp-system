import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useProtectedMutation } from './useProtectedMutation';

export function useAccountingOverview() {
  return useQuery({
    queryKey: ['accounting', 'overview'],
    queryFn: () => api<any>('/accounting/overview'),
    staleTime: 60_000,
  });
}

export function useUpdateCapital() {
  return useProtectedMutation(
    (amount: number) =>
      api('/accounting/capital', { method: 'PUT', body: JSON.stringify({ amount }) }),
    { invalidates: [['accounting']] },
  );
}

export function useCreateTransaction() {
  return useProtectedMutation(
    (data: { type: string; amount: number; category: string; description?: string; referenceId?: number }) =>
      api('/accounting/transactions', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['accounting']] },
  );
}

export function usePaymentHistory(referenceId: number | undefined, category: string) {
  return useQuery({
    queryKey: ['accounting', 'payment-history', referenceId, category],
    queryFn: () => api<any>(`/accounting/payment-history/${referenceId}`, { params: { category } as any }),
    enabled: !!referenceId,
  });
}

export function useConfirmCollection() {
  return useProtectedMutation(
    (id: number) => api(`/accounting/collections/${id}/confirm`, { method: 'POST' }),
    { invalidates: [['accounting'], ['paymentCollections'], ['pendingSettlement']] },
  );
}

export function useCreatePayroll() {
  return useProtectedMutation(
    (data: { employeeId: number; baseSalary: number; advances?: number; bonuses?: number; deductions?: number; month: number }) =>
      api('/accounting/payroll', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['accounting']] },
  );
}

export function useConfirmSalaryPayroll() {
  return useProtectedMutation(
    (id: number) => api(`/accounting/payroll/${id}/confirm`, { method: 'POST' }),
    { invalidates: [['accounting']] },
  );
}

export function useUpdatePayroll() {
  return useProtectedMutation(
    ({ id, data }: { id: number; data: any }) =>
      api(`/accounting/payroll/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    { invalidates: [['accounting']] },
  );
}

export function useCreateVehicle() {
  return useProtectedMutation(
    (data: { name: string; plateNumber: string; model?: string; fuelType?: string }) =>
      api('/accounting/vehicles', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['accounting']] },
  );
}

export function useAddVehicleExpense() {
  return useProtectedMutation(
    (data: { vehicleId: number; amount: number; description: string }) =>
      api('/accounting/vehicles/expense', { method: 'POST', body: JSON.stringify(data) }),
    { invalidates: [['accounting']] },
  );
}
