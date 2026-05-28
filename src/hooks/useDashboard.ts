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

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api<{ success: boolean; data: DashboardSummary }>('/dashboard/summary'),
    staleTime: 60_000,
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: () => api<{ success: boolean; data: DashboardCharts }>('/dashboard/charts'),
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

export function useTopProducts() {
  return useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: () => api<{ success: boolean; data: { items: { name: string; qty: number; revenue: number }[] } }>('/dashboard/top-products'),
    staleTime: 60_000,
  });
}

export function useTopCustomers() {
  return useQuery({
    queryKey: ['dashboard', 'top-customers'],
    queryFn: () => api<{ success: boolean; data: { items: { name: string; total: number; orders: number }[] } }>('/dashboard/top-customers'),
    staleTime: 60_000,
  });
}

export function useDashboardRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => api<{ success: boolean; data: { logs: { id: number; action: string; username: string; entity: string; entityId: string | null; details: string; timestamp: string }[] } }>('/dashboard/recent-activity'),
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
