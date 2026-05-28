import { prisma } from '../config/database.js';
import Decimal from 'decimal.js';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

function dateFilter(field: string, startDate?: string, endDate?: string) {
  const filter: Record<string, Date> = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return Object.keys(filter).length ? filter : undefined;
}

export const financialAnalyticsService = {
  async getSummary(params: { startDate?: string; endDate?: string }) {
    const dateRange = dateFilter('date', params.startDate, params.endDate);

    const [
      salesAgg,
      expenseAgg,
      customerCount,
      supplierCount,
      inventoryAgg,
      lowStockCount,
      pendingOrders,
      salesRepsCount,
    ] = await Promise.all([
      prisma.salesOrder.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
        where: { deletedAt: null, status: { not: 'cancelled' }, ...(dateRange ? { date: dateRange } : {}) },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'expense', ...(dateRange ? { date: dateRange } : {}) },
      }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.supplier.count({ where: { deletedAt: null } }),
      prisma.item.aggregate({
        _sum: { purchasePrice: true, sellingPrice: true, quantity: true },
        where: { deletedAt: null },
      }),
      prisma.item.count({ where: { deletedAt: null, quantity: { lte: prisma.item.fields.minQuantity } } }),
      prisma.salesOrder.count({ where: { deletedAt: null, status: 'pending' } }),
      prisma.salesRep.count({ where: { deletedAt: null } }),
    ]);

    const inventoryQty = toNumber(inventoryAgg._sum.quantity);
    const avgPurchasePrice = toNumber(inventoryAgg._sum.purchasePrice);
    const avgSellingPrice = toNumber(inventoryAgg._sum.sellingPrice);

    const totalSales = toNumber(salesAgg._sum.totalAmount);
    const totalPaid = toNumber(salesAgg._sum.paidAmount);
    const totalExpenses = toNumber(expenseAgg._sum.amount);
    const netProfit = totalSales - totalExpenses;

    const totalInventoryValue = inventoryQty * avgPurchasePrice;
    const totalInventorySellingValue = inventoryQty * avgSellingPrice;

    return {
      success: true,
      summary: {
        totalSales,
        totalExpenses,
        netProfit,
        profit: netProfit > 0 ? netProfit : 0,
        loss: netProfit < 0 ? Math.abs(netProfit) : 0,
        totalCustomers: customerCount,
        totalSuppliers: supplierCount,
        totalOrders: salesAgg._count,
        totalPaid,
        totalDue: totalSales - totalPaid,
        inventoryValue: totalInventoryValue,
        inventorySellingValue: totalInventorySellingValue,
        lowStockCount,
        pendingOrders,
        salesRepsCount,
      },
      totals: {
        sales: totalSales,
        expenses: totalExpenses,
        customers: customerCount,
        suppliers: supplierCount,
        orders: salesAgg._count,
      },
    };
  },

  async getSalesDetails(params: { startDate?: string; endDate?: string }) {
    const dateRange = dateFilter('date', params.startDate, params.endDate);
    const where = { deletedAt: null, status: { not: 'cancelled' as const }, ...(dateRange ? { date: dateRange } : {}) };

    const [orders, topItems] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        orderBy: { date: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          items: {
            include: { item: { select: { id: true, name: true, sku: true } } },
          },
        },
      }),
      prisma.salesOrderItem.groupBy({
        by: ['itemId'],
        _sum: { quantity: true, price: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
        where: { order: { deletedAt: null, status: { not: 'cancelled' }, ...(dateRange ? { date: dateRange } : {}) } },
      }),
    ]);

    const itemIds = topItems.map(t => t.itemId);
    const items = itemIds.length
      ? await prisma.item.findMany({ where: { id: { in: itemIds } }, select: { id: true, name: true, sku: true } })
      : [];
    const itemMap = new Map(items.map(i => [i.id, i]));

    const trendsMap: Record<string, { sales: number; count: number }> = {};
    for (const o of orders) {
      const key = o.date.toISOString().slice(0, 7);
      if (!trendsMap[key]) trendsMap[key] = { sales: 0, count: 0 };
      trendsMap[key].sales += Number(o.totalAmount);
      trendsMap[key].count += 1;
    }
    const trends = Object.entries(trendsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    return {
      success: true,
      summary: {
        totalSales: orders.reduce((s, o) => s + Number(o.totalAmount), 0),
        totalOrders: orders.length,
        averageOrderValue: orders.length ? orders.reduce((s, o) => s + Number(o.totalAmount), 0) / orders.length : 0,
      },
      charts: {
        trends,
        topItems: topItems.map(t => ({
          itemId: t.itemId,
          name: itemMap.get(t.itemId)?.name ?? 'Unknown',
          sku: itemMap.get(t.itemId)?.sku ?? '',
          totalQuantity: Number(t._sum.quantity ?? 0),
          totalRevenue: Number(t._sum.price ?? 0),
        })),
      },
      tables: {
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customer: o.customer.name,
          totalAmount: Number(o.totalAmount),
          paidAmount: Number(o.paidAmount),
          status: o.status,
          paymentStatus: o.paymentStatus,
          date: o.date,
          items: o.items.map(i => ({
            itemId: i.itemId,
            name: i.item.name,
            sku: i.item.sku,
            quantity: Number(i.quantity),
            price: Number(i.price),
          })),
        })),
      },
    };
  },

  async getExpensesDetails(params: { startDate?: string; endDate?: string }) {
    const dateRange = dateFilter('date', params.startDate, params.endDate);
    const where = { type: 'expense' as const, ...(dateRange ? { date: dateRange } : {}) };

    const [transactions, categoryAgg] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        orderBy: { date: 'desc' },
      }),
      prisma.financialTransaction.groupBy({
        by: ['category'],
        _sum: { amount: true },
        _count: true,
        where,
      }),
    ]);

    const totalExpenses = transactions.reduce((s, t) => s + Number(t.amount), 0);

    const trendsMap: Record<string, number> = {};
    for (const t of transactions) {
      const key = t.date.toISOString().slice(0, 7);
      trendsMap[key] = (trendsMap[key] ?? 0) + Number(t.amount);
    }
    const trends = Object.entries(trendsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));

    return {
      success: true,
      summary: {
        totalExpenses,
        totalTransactions: transactions.length,
      },
      charts: {
        categoryBreakdown: categoryAgg.map(c => ({
          category: c.category,
          totalAmount: Number(c._sum.amount ?? 0),
          count: c._count,
          percentage: totalExpenses > 0 ? (Number(c._sum.amount ?? 0) / totalExpenses) * 100 : 0,
        })),
        trends,
      },
      tables: {
        transactions: transactions.map(t => ({
          id: t.id,
          category: t.category,
          amount: Number(t.amount),
          description: t.description,
          date: t.date,
        })),
      },
    };
  },

  async getProfitDetails(params: { startDate?: string; endDate?: string }) {
    const dateRange = dateFilter('date', params.startDate, params.endDate);

    const [salesAgg, expenseAgg] = await Promise.all([
      prisma.salesOrder.aggregate({
        _sum: { totalAmount: true, subtotal: true, taxAmount: true },
        _count: true,
        where: { deletedAt: null, status: { not: 'cancelled' }, ...(dateRange ? { date: dateRange } : {}) },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'expense', ...(dateRange ? { date: dateRange } : {}) },
      }),
    ]);

    const totalSales = toNumber(salesAgg._sum.totalAmount);
    const totalExpenses = toNumber(expenseAgg._sum.amount);
    const netProfit = totalSales - totalExpenses;

    const sales = await prisma.salesOrder.findMany({
      where: { deletedAt: null, status: { not: 'cancelled' }, ...(dateRange ? { date: dateRange } : {}) },
      select: { totalAmount: true, date: true, subtotal: true, taxAmount: true },
      orderBy: { date: 'asc' },
    });

    const expenses = await prisma.financialTransaction.findMany({
      where: { type: 'expense', ...(dateRange ? { date: dateRange } : {}) },
      select: { amount: true, date: true, category: true },
      orderBy: { date: 'asc' },
    });

    const trendsMap: Record<string, { revenue: number; cost: number; profit: number }> = {};
    for (const s of sales) {
      const key = s.date.toISOString().slice(0, 7);
      if (!trendsMap[key]) trendsMap[key] = { revenue: 0, cost: 0, profit: 0 };
      trendsMap[key].revenue += Number(s.totalAmount);
    }
    for (const e of expenses) {
      const key = e.date.toISOString().slice(0, 7);
      if (trendsMap[key]) trendsMap[key].cost += Number(e.amount);
    }
    for (const key of Object.keys(trendsMap)) {
      trendsMap[key].profit = trendsMap[key].revenue - trendsMap[key].cost;
    }

    const trends = Object.entries(trendsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    return {
      success: true,
      summary: {
        totalRevenue: totalSales,
        totalCost: totalExpenses,
        netProfit,
        profit: netProfit > 0 ? netProfit : 0,
        loss: netProfit < 0 ? Math.abs(netProfit) : 0,
        profitMargin: totalSales > 0 ? (netProfit / totalSales) * 100 : 0,
        totalOrders: salesAgg._count,
      },
      charts: { trends },
    };
  },

  async getInventoryAnalytics(params: { startDate?: string; endDate?: string }) {
    const [items, categoryAgg, lowStockItems] = await Promise.all([
      prisma.item.findMany({
        where: { deletedAt: null },
        include: { supplier: { select: { id: true, name: true } } },
        orderBy: { quantity: 'desc' },
      }),
      prisma.item.groupBy({
        by: ['category'],
        _sum: { quantity: true, purchasePrice: true, sellingPrice: true },
        _count: true,
        where: { deletedAt: null },
      }),
      prisma.item.findMany({
        where: { deletedAt: null, quantity: { lte: prisma.item.fields.minQuantity } },
        orderBy: { quantity: 'asc' },
      }),
    ]);

    const totalValue = items.reduce((s, i) => s + Number(i.quantity) * Number(i.purchasePrice), 0);
    const totalSellingValue = items.reduce((s, i) => s + Number(i.quantity) * Number(i.sellingPrice), 0);

    return {
      success: true,
      summary: {
        totalItems: items.length,
        totalValue,
        totalSellingValue,
        lowStockCount: lowStockItems.length,
        uniqueCategories: categoryAgg.length,
        potentialProfit: totalSellingValue - totalValue,
      },
      charts: {
        categoryDistribution: categoryAgg.map(c => ({
          category: c.category,
          quantity: Number(c._sum.quantity ?? 0),
          value: Number(c._sum.quantity ?? 0) * Number(c._sum.purchasePrice ?? 0),
          count: c._count,
        })),
        lowStock: lowStockItems.map(i => ({
          id: i.id,
          name: i.name,
          sku: i.sku,
          quantity: Number(i.quantity),
          minQuantity: Number(i.minQuantity),
        })),
      },
      tables: {
        items: items.map(i => ({
          id: i.id,
          sku: i.sku,
          name: i.name,
          category: i.category,
          quantity: Number(i.quantity),
          minQuantity: Number(i.minQuantity),
          purchasePrice: Number(i.purchasePrice),
          sellingPrice: Number(i.sellingPrice),
          supplier: i.supplier?.name ?? null,
        })),
      },
    };
  },

  async getCustomerAnalytics(params: { startDate?: string; endDate?: string }) {
    const dateRange = dateFilter('date', params.startDate, params.endDate);
    const orderWhere = { deletedAt: null, status: { not: 'cancelled' as const }, ...(dateRange ? { date: dateRange } : {}) };

    const [customers, topCustomers] = await Promise.all([
      prisma.customer.findMany({
        where: { deletedAt: null },
        include: {
          salesOrders: {
            where: orderWhere,
            select: { id: true, totalAmount: true, status: true, date: true },
          },
        },
      }),
      prisma.salesOrder.groupBy({
        by: ['customerId'],
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
        where: orderWhere,
      }),
    ]);

    const customerIds = topCustomers.map(c => c.customerId);
    const customerNames = customerIds.length
      ? await prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true, phone: true } })
      : [];
    const nameMap = new Map(customerNames.map(c => [c.id, c]));

    const activeCustomers = customers.filter(c => c.salesOrders.length > 0);
    const totalSales = activeCustomers.reduce((s, c) => s + c.salesOrders.reduce((ss, o) => ss + Number(o.totalAmount), 0), 0);

    return {
      success: true,
      summary: {
        totalCustomers: customers.length,
        activeCustomers: activeCustomers.length,
        totalSales,
        averagePerCustomer: activeCustomers.length ? totalSales / activeCustomers.length : 0,
      },
      charts: {
        topCustomers: topCustomers.map(c => ({
          customerId: c.customerId,
          name: nameMap.get(c.customerId)?.name ?? 'Unknown',
          phone: nameMap.get(c.customerId)?.phone ?? '',
          totalSpent: Number(c._sum.totalAmount ?? 0),
          totalPaid: Number(c._sum.paidAmount ?? 0),
          orderCount: c._count,
        })),
      },
      tables: {
        customers: customers.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          orderCount: c.salesOrders.length,
          totalAmount: c.salesOrders.reduce((s, o) => s + Number(o.totalAmount), 0),
        })),
      },
    };
  },

  async getSupplierAnalytics(params: { startDate?: string; endDate?: string }) {
    const dateRange = dateFilter('date', params.startDate, params.endDate);
    const poWhere = { deletedAt: null, ...(dateRange ? { date: dateRange } : {}) };

    const [suppliers, topSuppliers] = await Promise.all([
      prisma.supplier.findMany({
        where: { deletedAt: null },
        include: {
          items: { where: { deletedAt: null }, select: { id: true, name: true, quantity: true, purchasePrice: true } },
          purchaseOrders: {
            where: poWhere,
            select: { id: true, totalAmount: true, status: true, date: true },
          },
        },
      }),
      prisma.purchaseOrder.groupBy({
        by: ['supplierId'],
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
        where: poWhere,
      }),
    ]);

    const supplierIds = topSuppliers.map(s => s.supplierId);
    const supplierNames = supplierIds.length
      ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true, phone: true } })
      : [];
    const nameMap = new Map(supplierNames.map(s => [s.id, s]));

    const totalPurchases = suppliers.reduce((s, sup) => s + sup.purchaseOrders.reduce((ss, po) => ss + Number(po.totalAmount), 0), 0);

    return {
      success: true,
      summary: {
        totalSuppliers: suppliers.length,
        totalPurchases,
        averagePerSupplier: suppliers.length ? totalPurchases / suppliers.length : 0,
        totalItemsSupplied: suppliers.reduce((s, sup) => s + sup.items.length, 0),
      },
      charts: {
        topSuppliers: topSuppliers.map(s => ({
          supplierId: s.supplierId,
          name: nameMap.get(s.supplierId)?.name ?? 'Unknown',
          phone: nameMap.get(s.supplierId)?.phone ?? '',
          totalAmount: Number(s._sum.totalAmount ?? 0),
          totalPaid: Number(s._sum.paidAmount ?? 0),
          orderCount: s._count,
        })),
      },
      tables: {
        suppliers: suppliers.map(s => ({
          id: s.id,
          name: s.name,
          phone: s.phone,
          itemCount: s.items.length,
          orderCount: s.purchaseOrders.length,
          totalAmount: s.purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0),
        })),
      },
    };
  },
};
