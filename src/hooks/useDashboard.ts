import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';

export interface DashboardSummary {
  totalSales: number;
  netProfit: number;
  totalCogs: number;
  totalExpenses: number;
  totalItems: number;
  inventoryValue: number;
  lowStockCount: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalOrders: number;
  pendingOrders: number;
  pendingSales: number;
  unpaidPurchases: number;
  activeUsers: number;
  todaySales: number;
  todayInvoices: number;
  profitMargin: string;
  salesChange: number;
  profitChange: number;
  totalPurchases: number;
  totalTaxAmount: number;
  avgStockValue: number;
  salesTrend: number[];
  customerTrend: number[];
  lowStockItems: { id: number; name: string; sku: string; quantity: number; minQuantity: number; deficit: number }[];
}

export interface DashboardCharts {
  salesByMonth: { name: string; sales: number; purchases: number }[];
  categoryData: { name: string; value: number }[];
  weeklyRevenue: { name: string; value: number }[];
}

export interface DashboardAlerts {
  lowStock: { id: number; name: string; sku: string; quantity: number; minQuantity: number; deficit: number }[];
  pendingSales: number;
  unpaidPurchases: number;
  totalAlerts: number;
}

export function useDashboardSummary(repId?: number) {
  const params = repId ? `?repId=${repId}` : '';
  return useQuery({
    queryKey: ['dashboard', 'summary', repId],
    queryFn: () => api<{ success: boolean; data: DashboardSummary }>(`/dashboard/summary${params}`),
    staleTime: 60_000,
  });
}

export function useDashboardCharts(repId?: number) {
  const params = repId ? `?repId=${repId}` : '';
  return useQuery({
    queryKey: ['dashboard', 'charts', repId],
    queryFn: () => api<{ success: boolean; data: DashboardCharts }>(`/dashboard/charts${params}`),
    staleTime: 60_000,
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => api<{ success: boolean; data: DashboardAlerts }>('/dashboard/alerts'),
    staleTime: 30_000,
  });
}

export function useTopProducts(repId?: number) {
  const params = repId ? `?repId=${repId}` : '';
  return useQuery({
    queryKey: ['dashboard', 'top-products', repId],
    queryFn: () => api<{ success: boolean; data: { items: { name: string; qty: number; revenue: number }[] } }>(`/dashboard/top-products${params}`),
    staleTime: 60_000,
  });
}

export function useTopCustomers(repId?: number) {
  const params = repId ? `?repId=${repId}` : '';
  return useQuery({
    queryKey: ['dashboard', 'top-customers', repId],
    queryFn: () => api<{ success: boolean; data: { items: { name: string; total: number; orders: number }[] } }>(`/dashboard/top-customers${params}`),
    staleTime: 60_000,
  });
}

export function useDashboardRecentActivity(repId?: number) {
  const params = repId ? `?repId=${repId}` : '';
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', repId],
    queryFn: () => api<{ success: boolean; data: { logs: { id: number; action: string; username: string; entity: string; entityId: string | null; details: string; timestamp: string }[] } }>(`/dashboard/recent-activity${params}`),
    staleTime: 15_000,
  });
}

export function useDashboardNotifications() {
  return useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: () => api<{ success: boolean; data: { notifications: { id: number; title: string; message: string; type: string; read: boolean; date: string }[]; unreadCount: number } }>('/dashboard/notifications'),
    staleTime: 15_000,
  });
}

export function useLowStockDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: () => api<{ success: boolean; data: { items: any[] } }>('/dashboard/low-stock'),
    staleTime: 30_000,
  });
}
