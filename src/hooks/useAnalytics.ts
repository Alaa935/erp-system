import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';

function analyticsApi<T>(path: string) {
  return (): Promise<T> => api<T>(`/analytics${path}`);
}

export function useAnalyticsSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'summary', startDate, endDate],
    queryFn: analyticsApi<{
      success: boolean;
      summary: {
        totalSales: number; totalExpenses: number; netProfit: number;
        profit: number; loss: number;
        totalCustomers: number; totalSuppliers: number;
        totalOrders: number; totalPaid: number; totalDue: number;
        inventoryValue: number; inventorySellingValue: number;
        lowStockCount: number; pendingOrders: number; salesRepsCount: number;
      };
      totals: { sales: number; expenses: number; customers: number; suppliers: number; orders: number };
    }>('/summary'),
  });
}

export function useSalesDetails(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'sales', startDate, endDate],
    queryFn: analyticsApi<{
      success: boolean;
      summary: { totalSales: number; totalOrders: number; averageOrderValue: number };
      charts: { trends: { month: string; sales: number; count: number }[]; topItems: any[] };
      tables: { orders: any[] };
    }>('/sales/details'),
  });
}

export function useExpensesDetails(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'expenses', startDate, endDate],
    queryFn: analyticsApi<{
      success: boolean;
      summary: { totalExpenses: number; totalTransactions: number };
      charts: { categoryBreakdown: any[]; trends: { month: string; amount: number }[] };
      tables: { transactions: any[] };
    }>('/expenses/details'),
  });
}

export function useProfitDetails(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'profit', startDate, endDate],
    queryFn: analyticsApi<{
      success: boolean;
      summary: { totalRevenue: number; totalCost: number; netProfit: number; profit: number; loss: number; profitMargin: number; totalOrders: number; totalTaxCollected: number };
      charts: { trends: { month: string; revenue: number; cost: number; profit: number }[] };
    }>('/profit/details'),
  });
}

export function useInventoryAnalytics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'inventory', startDate, endDate],
    queryFn: analyticsApi<{
      success: boolean;
      summary: { totalItems: number; totalValue: number; totalSellingValue: number; lowStockCount: number; uniqueCategories: number; potentialProfit: number };
      charts: { categoryDistribution: { category: string; quantity: number; value: number; count: number }[]; lowStock: any[] };
      tables: { items: any[] };
    }>('/inventory/details'),
  });
}

export function useCustomerAnalytics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'customers', startDate, endDate],
    queryFn: analyticsApi<{
      success: boolean;
      summary: { totalCustomers: number; activeCustomers: number; totalSales: number; averagePerCustomer: number };
      charts: { topCustomers: any[] };
      tables: { customers: any[] };
    }>('/customers/details'),
  });
}

export function useSupplierAnalytics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'suppliers', startDate, endDate],
    queryFn: analyticsApi<{
      success: boolean;
      summary: { totalSuppliers: number; totalPurchases: number; averagePerSupplier: number; totalItemsSupplied: number };
      charts: { topSuppliers: any[] };
      tables: { suppliers: any[] };
    }>('/suppliers/details'),
  });
}
