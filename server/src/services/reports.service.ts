import { prisma } from '../config/database.js';
import Decimal from 'decimal.js';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

type DateFilter = { gte?: Date; lte?: Date };

function dateFilter(startDate?: string, endDate?: string): DateFilter {
  const f: DateFilter = {};
  if (startDate) f.gte = new Date(startDate);
  if (endDate) f.lte = new Date(endDate);
  return f;
}

export const reportsService = {
  async financialSummary(startDate?: string, endDate?: string) {
    const df = dateFilter(startDate, endDate);

    const [
      salesAgg,
      expenseAgg,
      purchaseAgg,
      customerCount,
      supplierCount,
      orderCount,
      itemAgg,
      lowStockCount,
      pendingOrders,
      salesRepsCount,
    ] = await Promise.all([
      prisma.salesOrder.aggregate({ where: { deletedAt: null, status: { not: 'cancelled' }, ...df }, _sum: { totalAmount: true, paidAmount: true, taxAmount: true } }),
      prisma.financialTransaction.aggregate({ where: { type: 'expense', ...df }, _sum: { amount: true } }),
      prisma.purchaseOrder.aggregate({ where: { deletedAt: null, status: { not: 'cancelled' }, ...df }, _sum: { totalAmount: true } }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.supplier.count({ where: { deletedAt: null } }),
      prisma.salesOrder.count({ where: { deletedAt: null, status: { not: 'cancelled' } } }),
      prisma.item.aggregate({ where: { deletedAt: null }, _sum: { purchasePrice: true, sellingPrice: true, quantity: true } }),
      prisma.item.count({ where: { deletedAt: null, quantity: { lte: new Decimal(10) } } }),
      prisma.salesOrder.count({ where: { deletedAt: null, status: 'pending' } }),
      prisma.salesRep.count({ where: { deletedAt: null } }),
    ]);

    const totalSales = toNumber(salesAgg._sum.totalAmount);
    const totalExpenses = toNumber(expenseAgg._sum.amount);
    const totalPurchases = toNumber(purchaseAgg._sum.totalAmount);
    const totalPaid = toNumber(salesAgg._sum.paidAmount);
    const totalTaxCollected = toNumber(salesAgg._sum.taxAmount);
    const totalDue = totalSales - totalPaid;
    const inventoryValue = toNumber(itemAgg._sum.purchasePrice) * toNumber(itemAgg._sum.quantity);
    const inventorySellingValue = toNumber(itemAgg._sum.sellingPrice) * toNumber(itemAgg._sum.quantity);
    const netProfit = totalSales - totalExpenses - totalPurchases;
    const profit = netProfit > 0 ? netProfit : 0;
    const loss = netProfit < 0 ? Math.abs(netProfit) : 0;

    return {
      summary: {
        totalSales,
        totalExpenses,
        netProfit,
        profit,
        loss,
        totalCustomers: customerCount,
        totalSuppliers: supplierCount,
        totalOrders: orderCount,
        totalPaid,
        totalDue,
        inventoryValue,
        inventorySellingValue,
        lowStockCount,
        pendingOrders,
        salesRepsCount,
        totalTaxCollected,
        totalPurchases,
      },
    };
  },

  async profitLoss(startDate?: string, endDate?: string) {
    const df = dateFilter(startDate, endDate);

    const [revenueAgg, cogsAgg, expenseAgg] = await Promise.all([
      prisma.salesOrder.aggregate({ where: { deletedAt: null, status: { not: 'cancelled' }, ...df }, _sum: { totalAmount: true, subtotal: true, taxAmount: true } }),
      prisma.salesOrderItem.aggregate({ where: { order: { deletedAt: null, status: { not: 'cancelled' }, ...df } }, _sum: { purchasePrice: true, quantity: true } }),
      prisma.financialTransaction.aggregate({ where: { type: 'expense', ...df }, _sum: { amount: true } }),
    ]);

    const totalRevenue = toNumber(revenueAgg._sum.totalAmount);
    const totalCost = toNumber(cogsAgg._sum.purchasePrice) * toNumber(cogsAgg._sum.quantity);
    const totalExpenses = toNumber(expenseAgg._sum.amount);
    const netProfit = totalRevenue - totalCost - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const orders = await prisma.salesOrder.findMany({
      where: { deletedAt: null, status: { not: 'cancelled' }, ...df },
      select: { id: true, orderNumber: true, totalAmount: true, date: true, status: true },
      orderBy: { date: 'desc' },
      take: 100,
    });

    const trends = await prisma.$queryRawUnsafe<Array<{ month: string; revenue: Decimal; cost: Decimal; profit: Decimal }>>(
      `SELECT to_char(date, 'YYYY-MM') as month,
              COALESCE(SUM(total_amount), 0) as revenue,
              0 as cost,
              COALESCE(SUM(total_amount), 0) as profit
       FROM sales_orders
       WHERE deleted_at IS NULL AND status != 'cancelled'
       GROUP BY month ORDER BY month DESC LIMIT 12`
    );

    return {
      summary: {
        totalRevenue,
        totalCost,
        netProfit,
        profit: netProfit > 0 ? netProfit : 0,
        loss: netProfit < 0 ? Math.abs(netProfit) : 0,
        profitMargin: Math.round(profitMargin * 100) / 100,
        totalOrders: orders.length,
        totalExpenses,
      },
      charts: {
        trends: (trends || []).map(t => ({
          month: String(t.month),
          revenue: Number(t.revenue),
          cost: Number(t.cost),
          profit: Number(t.profit),
        })),
      },
      tables: { orders },
    };
  },

  async salesDetails(startDate?: string, endDate?: string) {
    const df = dateFilter(startDate, endDate);

    const [totalAgg, orders] = await Promise.all([
      prisma.salesOrder.aggregate({ where: { deletedAt: null, status: { not: 'cancelled' }, ...df }, _sum: { totalAmount: true }, _count: true }),
      prisma.salesOrder.findMany({
        where: { deletedAt: null, status: { not: 'cancelled' }, ...df },
        include: {
          customer: { select: { id: true, name: true } },
          items: { include: { item: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { date: 'desc' },
        take: 100,
      }),
    ]);

    const totalSales = toNumber(totalAgg._sum.totalAmount);
    const totalOrdersCount = totalAgg._count;
    const averageOrderValue = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;

    const trends = await prisma.$queryRawUnsafe<Array<{ month: string; sales: Decimal; count: bigint }>>(
      `SELECT to_char(date, 'YYYY-MM') as month,
              COALESCE(SUM(total_amount), 0) as sales,
              COUNT(*) as count
       FROM sales_orders
       WHERE deleted_at IS NULL AND status != 'cancelled'
       GROUP BY month ORDER BY month DESC LIMIT 12`
    );

    const topItemsRaw = await prisma.$queryRawUnsafe<Array<{ name: string; total_qty: Decimal; total_revenue: Decimal }>>(
      `SELECT i.name, SUM(soi.quantity) as total_qty, SUM(soi.price * soi.quantity) as total_revenue
       FROM sales_order_items soi
       JOIN items i ON i.id = soi.item_id
       JOIN sales_orders so ON so.id = soi.order_id
       WHERE so.deleted_at IS NULL AND so.status != 'cancelled'
       GROUP BY i.name ORDER BY total_revenue DESC LIMIT 10`
    );

    return {
      summary: { totalSales, totalOrders: totalOrdersCount, averageOrderValue },
      charts: {
        trends: (trends || []).map(t => ({ month: String(t.month), sales: Number(t.sales), count: Number(t.count) })),
        topItems: (topItemsRaw || []).map(t => ({ name: String(t.name), quantity: Number(t.total_qty), revenue: Number(t.total_revenue) })),
      },
      tables: {
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customer.name,
          totalAmount: toNumber(new Decimal(o.totalAmount)),
          date: o.date,
          status: o.status,
          items: o.items.map(i => ({ name: i.item.name, quantity: Number(i.quantity), price: Number(i.price) })),
        })),
      },
    };
  },

  async purchaseDetails(startDate?: string, endDate?: string) {
    const df = dateFilter(startDate, endDate);

    const [totalAgg, orders] = await Promise.all([
      prisma.purchaseOrder.aggregate({ where: { deletedAt: null, status: { not: 'cancelled' }, ...df }, _sum: { totalAmount: true }, _count: true }),
      prisma.purchaseOrder.findMany({
        where: { deletedAt: null, status: { not: 'cancelled' }, ...df },
        include: { supplier: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
        take: 100,
      }),
    ]);

    return {
      summary: { totalPurchases: toNumber(totalAgg._sum.totalAmount), totalOrders: totalAgg._count },
      tables: { orders: orders.map(o => ({ id: o.id, orderNumber: o.orderNumber, supplierName: o.supplier.name, totalAmount: toNumber(new Decimal(o.totalAmount)), date: o.date, status: o.status })) },
    };
  },

  async inventoryDetails() {
    const [items, transactions] = await Promise.all([
      prisma.item.findMany({ where: { deletedAt: null }, include: { supplier: { select: { id: true, name: true } } }, orderBy: { name: 'asc' } }),
      prisma.inventoryTransaction.findMany({ orderBy: { timestamp: 'desc' }, take: 2000, include: { item: { select: { id: true, name: true, sku: true } } } }),
    ]);

    const totalValue = items.reduce((s, i) => s + toNumber(i.purchasePrice) * toNumber(i.quantity), 0);
    const totalSellingValue = items.reduce((s, i) => s + toNumber(i.sellingPrice) * toNumber(i.quantity), 0);
    const lowStockCount = items.filter(i => toNumber(i.quantity) <= toNumber(i.minQuantity)).length;
    const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
    const potentialProfit = totalSellingValue - totalValue;

    const categoryDistribution = categories.map(cat => {
      const catItems = items.filter(i => i.category === cat);
      return {
        category: cat,
        quantity: catItems.reduce((s, i) => s + toNumber(i.quantity), 0),
        value: catItems.reduce((s, i) => s + toNumber(i.purchasePrice) * toNumber(i.quantity), 0),
        count: catItems.length,
      };
    });

    return {
      summary: { totalItems: items.length, totalValue, totalSellingValue, lowStockCount, uniqueCategories: categories.length, potentialProfit },
      charts: { categoryDistribution, lowStock: items.filter(i => toNumber(i.quantity) <= toNumber(i.minQuantity)).map(i => ({ id: i.id, name: i.name, quantity: Number(i.quantity), minQuantity: Number(i.minQuantity) })) },
      tables: {
        items: items.map(i => ({ id: i.id, name: i.name, sku: i.sku, category: i.category, quantity: Number(i.quantity), purchasePrice: toNumber(i.purchasePrice), sellingPrice: toNumber(i.sellingPrice), location: i.location, supplierName: i.supplier?.name })),
        transactions: transactions.map(t => ({
          id: t.id, itemId: t.itemId, itemName: t.item.name, itemSku: t.item.sku,
          type: t.type, oldQuantity: Number(t.oldQuantity), newQuantity: Number(t.newQuantity),
          diff: Number(t.diff), reason: t.reason, source: t.source, timestamp: t.timestamp, userId: t.userId,
        })),
      },
    };
  },

  async customerBalances() {
    const customers = await prisma.customer.findMany({
      where: { deletedAt: null },
      include: {
        salesOrders: {
          where: { deletedAt: null, status: { not: 'cancelled' } },
          select: { id: true, totalAmount: true, paidAmount: true, date: true, orderNumber: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return customers.map(c => {
      const totalSales = c.salesOrders.reduce((s, o) => s + toNumber(new Decimal(o.totalAmount)), 0);
      const totalPaid = c.salesOrders.reduce((s, o) => s + toNumber(new Decimal(o.paidAmount)), 0);
      return {
        id: c.id, name: c.name, phone: c.phone, address: c.address,
        totalSales, totalPaid, balance: totalSales - totalPaid,
        orders: c.salesOrders.map(o => ({ id: o.id, orderNumber: o.orderNumber, totalAmount: toNumber(new Decimal(o.totalAmount)), paidAmount: toNumber(new Decimal(o.paidAmount)), date: o.date })),
      };
    });
  },

  async supplierBalances() {
    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null },
      include: {
        purchaseOrders: {
          where: { deletedAt: null, status: { not: 'cancelled' } },
          select: { id: true, totalAmount: true, paidAmount: true, date: true, orderNumber: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return suppliers.map(s => {
      const totalPurchases = s.purchaseOrders.reduce((sum, o) => sum + toNumber(new Decimal(o.totalAmount)), 0);
      const totalPaid = s.purchaseOrders.reduce((sum, o) => sum + toNumber(new Decimal(o.paidAmount)), 0);
      return {
        id: s.id, name: s.name, phone: s.phone,
        totalPurchases, totalPaid, balance: totalPurchases - totalPaid,
      };
    });
  },

  async taxReport(startDate?: string, endDate?: string) {
    const df = dateFilter(startDate, endDate);
    const taxFilter = { ...df, deletedAt: null, status: { not: 'cancelled' as const }, taxId: { not: null } };

    const [orders, taxes] = await Promise.all([
      prisma.salesOrder.findMany({
        where: taxFilter,
        select: { id: true, orderNumber: true, totalAmount: true, taxAmount: true, subtotal: true, date: true, taxId: true },
        orderBy: { date: 'desc' },
      }),
      prisma.taxConfig.findMany({ where: { isActive: true } }),
    ]);

    const totalTaxCollected = orders.reduce((s, o) => s + Number(o.taxAmount ?? 0), 0);
    const totalTaxableSales = orders.reduce((s, o) => s + Number(o.subtotal ?? 0), 0);

    const byTaxRate = taxes.map(tax => {
      const taxOrders = orders.filter(o => o.taxId === tax.id);
      return {
        taxName: tax.name,
        rate: Number(tax.rate),
        orderCount: taxOrders.length,
        taxableAmount: taxOrders.reduce((s, o) => s + Number(o.subtotal ?? 0), 0),
        taxAmount: taxOrders.reduce((s, o) => s + Number(o.taxAmount ?? 0), 0),
      };
    });

    return { summary: { totalTaxCollected, totalTaxableSales, totalOrders: orders.length }, byTaxRate, orders };
  },

  async cashflow(startDate?: string, endDate?: string) {
    const df = dateFilter(startDate, endDate);

    const [income, expenses, salesPaid, purchasePaid] = await Promise.all([
      prisma.financialTransaction.aggregate({ where: { type: 'income', ...df }, _sum: { amount: true } }),
      prisma.financialTransaction.aggregate({ where: { type: 'expense', ...df }, _sum: { amount: true } }),
      prisma.salesOrder.aggregate({ where: { deletedAt: null, status: { not: 'cancelled' }, ...df }, _sum: { paidAmount: true } }),
      prisma.purchaseOrder.aggregate({ where: { deletedAt: null, status: { not: 'cancelled' }, ...df }, _sum: { paidAmount: true } }),
    ]);

    const totalInflow = toNumber(income._sum.amount) + toNumber(salesPaid._sum.paidAmount);
    const totalOutflow = toNumber(expenses._sum.amount) + toNumber(purchasePaid._sum.paidAmount);
    const netCashflow = totalInflow - totalOutflow;

    return { summary: { totalInflow, totalOutflow, netCashflow }, totalIncome: toNumber(income._sum.amount), totalExpenses: toNumber(expenses._sum.amount), salesCollections: toNumber(salesPaid._sum.paidAmount), purchasePayments: toNumber(purchasePaid._sum.paidAmount) };
  },

  async activityLog(limit = 50) {
    const [logs, transactions] = await Promise.all([
      prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: limit }),
      prisma.inventoryTransaction.findMany({
        orderBy: { timestamp: 'desc' },
        take: 200,
        include: { item: { select: { id: true, name: true, sku: true } } },
      }),
    ]);

    return {
      logs: logs.map(l => ({ id: l.id, userId: l.userId, username: l.username, action: l.action, entity: l.entity, entityId: l.entityId, details: l.details, timestamp: l.timestamp })),
      inventoryTransactions: transactions.map(t => ({
        id: t.id, itemId: t.itemId, itemName: t.item.name, itemSku: t.item.sku,
        type: t.type, oldQuantity: Number(t.oldQuantity), newQuantity: Number(t.newQuantity),
        diff: Number(t.diff), reason: t.reason, source: t.source, timestamp: t.timestamp, userId: t.userId,
      })),
    };
  },
};
