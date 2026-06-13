import { useMemo } from 'react';
import { useAccountingOverview } from './useAccounting';
import { useDashboardSummary, useDashboardCharts, useTopProducts, useTopCustomers } from './useDashboard';
import { useSalesReps } from './useSalesReps';
import { useStockRequests } from './useStockRequests';
import { useStockTransfers } from './useStockTransfers';
import { usePaymentCollections } from './usePaymentCollections';
import { useCustomers } from './useCustomers';

const NOW = Date.now();

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function isToday(ts: number) {
  const t = new Date(ts);
  const n = new Date();
  return t.getFullYear() === n.getFullYear() && t.getMonth() === n.getMonth() && t.getDate() === n.getDate();
}

function isThisMonth(ts: number) {
  const t = new Date(ts);
  const n = new Date();
  return t.getFullYear() === n.getFullYear() && t.getMonth() === n.getMonth();
}

export function useExecutiveDashboard() {
  const accounting = useAccountingOverview();
  const summary = useDashboardSummary();
  const charts = useDashboardCharts();
  const topProducts = useTopProducts();
  const topCustomers = useTopCustomers();
  const reps = useSalesReps();
  const customers = useCustomers();
  const pendingRequests = useStockRequests({ status: 'pending' } as any);
  const pendingTransfers = useStockTransfers({ status: 'pending' } as any);
  const pendingCollections = usePaymentCollections({ status: 'pending' } as any);

  const d = accounting.data;
  const s = summary.data;
  const today = todayRange();

  const financial = useMemo(() => {
    if (!d || !s) return null;
    const totalSales = s.totalSales;
    const confirmedCollections = (d.collections || []).filter((c: any) => c.status === 'confirmed');
    const totalCollections = confirmedCollections.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
    const outstandingReceivables = d.totalReceivables || 0;
    const totalOrders = s.totalOrders || 1;
    const avgInvoiceValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const collectionRate = totalSales > 0 ? (totalCollections / totalSales) * 100 : 0;

    return {
      totalSales,
      netProfit: s.netProfit || 0,
      totalCollections,
      outstandingReceivables,
      avgInvoiceValue,
      collectionRate: Math.min(collectionRate, 100),
      profitMargin: parseFloat(s.profitMargin || '0'),
      totalExpenses: s.totalExpenses || 0,
      salesChange: s.salesChange || 0,
      profitChange: s.profitChange || 0,
      salesTrend: s.salesTrend || [],
    };
  }, [d, s]);

  const cashPosition = useMemo(() => {
    if (!d) return null;
    const balance = d.balance || 0;
    const repCustody = d.repCustody || 0;
    const cashInTreasury = balance - repCustody;
    const allCollections = d.collections || [];
    const pendingSettlements = allCollections
      .filter((c: any) => c.status === 'pending' && c.type === 'rep_settlement')
      .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
    const cashAwaitingApproval = allCollections
      .filter((c: any) => c.status === 'pending' && c.type === 'rep_settlement')
      .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
    const dailyCollections = allCollections
      .filter((c: any) => c.status === 'confirmed' && isToday(c.date || c.confirmedDate))
      .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

    const outstandingReceivables = d.totalReceivables || 0;

    return {
      cashInTreasury: Math.max(cashInTreasury, 0),
      cashWithReps: repCustody,
      pendingSettlements,
      cashAwaitingApproval,
      totalDailyCollections: dailyCollections,
      balance,
      outstandingReceivables,
    };
  }, [d]);

  const salesRepPerformance = useMemo(() => {
    if (!d || !reps.data) return null;
    const repList = d.reps || [];
    const allSalesOrders = d.salesOrders || [];
    const allCollections = d.collections || [];

    const repSalesMap = new Map<number, { sales: number; count: number; collections: number }>();
    for (const rep of repList) {
      const repSales = allSalesOrders
        .filter((o: any) => o.repId === rep.id && o.status !== 'cancelled');
      const totalSold = repSales.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
      const orderCount = repSales.length;
      const repCols = allCollections
        .filter((c: any) => c.repId === rep.id && c.status === 'confirmed');
      const totalCollected = repCols.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
      repSalesMap.set(rep.id, { sales: totalSold, count: orderCount, collections: totalCollected });
    }

    const todaySales = allSalesOrders
      .filter((o: any) => isToday(o.date) && o.status !== 'cancelled')
      .reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);

    const sorted = [...repSalesMap.entries()].sort((a, b) => b[1].sales - a[1].sales);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const topCollector = [...repSalesMap.entries()].sort((a, b) => b[1].collections - a[1].collections)[0];

    return {
      topPerformer: top ? { id: top[0], name: repList.find((r: any) => r.id === top[0])?.name || '', sales: top[1].sales } : null,
      lowestPerformer: bottom ? { id: bottom[0], name: repList.find((r: any) => r.id === bottom[0])?.name || '', sales: bottom[1].sales } : null,
      highestCollector: topCollector ? { id: topCollector[0], name: repList.find((r: any) => r.id === topCollector[0])?.name || '', collections: topCollector[1].collections } : null,
      totalActiveReps: repList.length,
      dailySalesByRep: todaySales,
      repSales: Object.fromEntries(repSalesMap),
      repDetails: repList,
    };
  }, [d, reps.data]);

  const inventoryHealth = useMemo(() => {
    if (!s) return null;
    const lowItems = s.lowStockItems || [];
    const outOfStock = lowItems.filter((i: any) => i.quantity === 0);
    const lowStock = lowItems.filter((i: any) => i.quantity > 0 && i.quantity <= (i.minQuantity || 0));
    return {
      lowStockCount: lowItems.length,
      outOfStockCount: outOfStock.length,
      lowStockItems: lowItems,
      outOfStockItems: outOfStock,
      inventoryValue: s.inventoryValue || 0,
      totalItems: s.totalItems || 0,
    };
  }, [s]);

  const customerMetrics = useMemo(() => {
    if (!d || !customers.data) return null;
    const allCustomers = customers.data?.items || [];
    const allSalesOrders = d.salesOrders || [];
    const customersWithBalance = new Set(
      allSalesOrders
        .filter((o: any) => o.paymentStatus !== 'paid' && o.status !== 'cancelled')
        .map((o: any) => o.customerId)
    );
    const newThisMonth = allCustomers.filter((c: any) => c.createdAt && isThisMonth(c.createdAt));
    const returningCustomers = allSalesOrders
      .filter((o: any) => o.status !== 'cancelled')
      .reduce((acc: any, o: any) => {
        acc[o.customerId] = (acc[o.customerId] || 0) + 1;
        return acc;
      }, {});
    const multiOrder = Object.values(returningCustomers).filter((c: any) => c > 1).length;
    const uniqueCustomers = Object.keys(returningCustomers).length;
    const repeatRate = uniqueCustomers > 0 ? (multiOrder / uniqueCustomers) * 100 : 0;

    return {
      totalCustomers: allCustomers.length,
      customersWithBalance: customersWithBalance.size,
      newCustomersThisMonth: newThisMonth.length,
      repeatCustomerRate: Math.round(repeatRate),
      topCustomersByBalance: allSalesOrders
        .filter((o: any) => o.paymentStatus !== 'paid' && o.status !== 'cancelled')
        .reduce((acc: any, o: any) => {
          const bal = Number(o.totalAmount) - Number(o.paidAmount);
          acc[o.customerId] = (acc[o.customerId] || 0) + bal;
          return acc;
        }, {}),
    };
  }, [d, customers.data]);

  const operational = useMemo(() => {
    const pendingReqs = pendingRequests.data?.items || [];
    const pendingTrans = pendingTransfers.data?.items || [];
    const pendingCols = d?.collections?.filter((c: any) => c.status === 'pending') || [];
    const totalPendingAmount = pendingCols.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

    return {
      pendingSupplyRequests: pendingReqs.length,
      pendingTransfers: pendingTrans.length,
      pendingCollections: pendingCols.length,
      pendingCollectionAmount: totalPendingAmount,
      criticalAlerts: (summary.data as any)?.lowStockCount || 0,
    };
  }, [pendingRequests.data, pendingTransfers.data, d, summary.data]);

  const isLoading = accounting.isLoading || summary.isLoading || charts.isLoading;
  const error = accounting.error || summary.error;

  return {
    financial,
    cashPosition,
    salesRepPerformance,
    inventoryHealth,
    customerMetrics,
    operational,
    charts: charts.data || null,
    topProducts: topProducts.data || null,
    topCustomers: topCustomers.data || null,
    accountingData: d,
    isLoading,
    error,
  };
}
