import { prisma } from '../config/database.js';
import Decimal from 'decimal.js';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

const ASC = 'asc' as const;
const DESC = 'desc' as const;

export const dashboardService = {
  async getSummary(repId?: number) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPrevMonth = new Date(currentYear, currentMonth, 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const repFilter = repId ? { repId } : {};

    const [
      salesAgg,
      expenseAgg,
      cogsOrders,
      totalItems,
      totalValue,
      lowStockItems,
      allMinStockItems,
      customerCount,
      supplierCount,
      pendingSalesOrders,
      unpaidPurchaseOrders,
      userCount,
      currentMonthSales,
      prevMonthSales,
      currentMonthCogs,
      prevMonthCogs,
      currentMonthExpenses,
      prevMonthExpenses,
      todayCompletedOrders,
      totalPurchaseAgg,
      totalTaxAgg,
      allSalesOrders,
    ] = await Promise.all([
      prisma.salesOrder.aggregate({
        _sum: { totalAmount: true, paidAmount: true, taxAmount: true },
        _count: true,
        where: { deletedAt: null, status: { not: 'cancelled' }, ...repFilter },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'expense', category: { notIn: ['purchase', 'cogs'] } },
      }),
      prisma.salesOrder.findMany({
        where: { deletedAt: null, status: { in: ['shipped', 'delivered'] }, ...repFilter },
        select: {
          id: true,
          totalAmount: true,
          items: { select: { quantity: true, purchasePrice: true } },
        },
      }),
      prisma.item.count({ where: { deletedAt: null } }),
      prisma.item.findMany({
        where: { deletedAt: null },
        select: { quantity: true, purchasePrice: true, sellingPrice: true },
      }),
      prisma.item.findMany({
        where: { deletedAt: null, quantity: { lte: prisma.item.fields.minQuantity } },
        select: { id: true, name: true, sku: true, quantity: true, minQuantity: true },
        orderBy: { quantity: ASC },
      }),
      prisma.item.findMany({
        where: { deletedAt: null },
        select: { quantity: true, minQuantity: true },
      }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.supplier.count({ where: { deletedAt: null } }),
      prisma.salesOrder.count({ where: { deletedAt: null, status: 'pending', ...repFilter } }),
      prisma.purchaseOrder.count({
        where: { deletedAt: null, status: 'received', paymentStatus: { not: 'paid' } },
      }),
      prisma.user.count(),
      prisma.salesOrder.aggregate({
        _sum: { totalAmount: true },
        where: { deletedAt: null, status: { not: 'cancelled' }, date: { gte: startOfMonth }, ...repFilter },
      }),
      prisma.salesOrder.aggregate({
        _sum: { totalAmount: true },
        where: { deletedAt: null, status: { not: 'cancelled' }, date: { gte: startOfPrevMonth, lt: endOfPrevMonth }, ...repFilter },
      }),
      prisma.salesOrderItem.findMany({
        where: {
          order: { deletedAt: null, status: { in: ['shipped', 'delivered'] }, date: { gte: startOfMonth }, ...repFilter },
        },
        select: { quantity: true, purchasePrice: true },
      }),
      prisma.salesOrderItem.findMany({
        where: {
          order: { deletedAt: null, status: { in: ['shipped', 'delivered'] }, date: { gte: startOfPrevMonth, lt: endOfPrevMonth }, ...repFilter },
        },
        select: { quantity: true, purchasePrice: true },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'expense', category: { notIn: ['purchase', 'cogs'] }, date: { gte: startOfMonth } },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'expense', category: { notIn: ['purchase', 'cogs'] }, date: { gte: startOfPrevMonth, lt: endOfPrevMonth } },
      }),
      prisma.salesOrder.findMany({
        where: { deletedAt: null, status: { in: ['shipped', 'delivered'] }, date: { gte: todayStart }, ...repFilter },
        select: { id: true, totalAmount: true },
      }),
      prisma.purchaseOrder.aggregate({
        _sum: { totalAmount: true },
        where: { deletedAt: null, status: { not: 'cancelled' } },
      }),
      prisma.salesOrder.aggregate({
        _sum: { taxAmount: true },
        where: { deletedAt: null, status: { not: 'cancelled' }, ...repFilter },
      }),
      prisma.salesOrder.findMany({
        where: { deletedAt: null, status: { not: 'cancelled' }, ...repFilter },
        select: { id: true, status: true, date: true, totalAmount: true, customerId: true },
      }),
    ]);

    const totalSales = toNumber(salesAgg._sum.totalAmount);
    const totalCogs = cogsOrders.reduce((sum, o) =>
      sum + o.items.reduce((s, i) => s + Number(i.quantity) * Number(i.purchasePrice ?? 0), 0)
    , 0);
    const totalExpenses = toNumber(expenseAgg._sum.amount);
    const netProfit = totalSales - totalCogs - totalExpenses;
    const totalPurchases = toNumber(totalPurchaseAgg._sum.totalAmount);
    const totalTaxAmount = toNumber(totalTaxAgg._sum.taxAmount);

    const inventoryCostValue = (totalValue as Array<{ quantity: Decimal; purchasePrice: Decimal; sellingPrice: Decimal }>).reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.purchasePrice), 0
    );
    const inventorySellingValue = (totalValue as Array<{ quantity: Decimal; purchasePrice: Decimal; sellingPrice: Decimal }>).reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.sellingPrice), 0
    );

    const todaySales = todayCompletedOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const todayInvoices = todayCompletedOrders.length;

    const curMonthSalesAmt = toNumber(currentMonthSales._sum.totalAmount);
    const prevMonthSalesAmt = toNumber(prevMonthSales._sum.totalAmount);
    const hasPrevMonthSales = prevMonthSalesAmt > 0;
    const salesChange = hasPrevMonthSales ? ((curMonthSalesAmt - prevMonthSalesAmt) / prevMonthSalesAmt) * 100 : 0;

    const curMonthCogsAmt = currentMonthCogs.reduce((s, i) => s + Number(i.quantity) * Number(i.purchasePrice ?? 0), 0);
    const prevMonthCogsAmt = prevMonthCogs.reduce((s, i) => s + Number(i.quantity) * Number(i.purchasePrice ?? 0), 0);
    const curMonthExpAmt = toNumber(currentMonthExpenses._sum.amount);
    const prevMonthExpAmt = toNumber(prevMonthExpenses._sum.amount);
    const curMonthProfit = curMonthSalesAmt - curMonthCogsAmt - curMonthExpAmt;
    const prevMonthProfit = prevMonthSalesAmt - prevMonthCogsAmt - prevMonthExpAmt;
    const hasPrevMonthProfit = prevMonthProfit !== 0;
    const profitChange = hasPrevMonthProfit ? ((curMonthProfit - prevMonthProfit) / Math.abs(prevMonthProfit)) * 100 : 0;

    const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';
    const pendingOrders = pendingSalesOrders;
    const pendingSales = pendingSalesOrders;
    const unpaidPurchases = unpaidPurchaseOrders;
    const totalOrders = salesAgg._count;

    const completedOrders = allSalesOrders.filter(o => o.status === 'shipped' || o.status === 'delivered');
    const nowDate = new Date();
    const salesTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(nowDate); d.setDate(d.getDate() - (6 - i));
      const ds = d.toDateString();
      return completedOrders.filter(o => new Date(o.date).toDateString() === ds).reduce((s, o) => s + Number(o.totalAmount), 0);
    });

    const profitTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(nowDate); d.setDate(d.getDate() - (6 - i));
      const ds = d.toDateString();
      const dailySales = completedOrders.filter(o => new Date(o.date).toDateString() === ds).reduce((s, o) => s + Number(o.totalAmount), 0);
      return Math.round(dailySales * (totalSales > 0 ? netProfit / totalSales : 0.2));
    });

    const customerTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(nowDate); d.setDate(d.getDate() - (6 - i));
      const ds = d.toDateString();
      return allSalesOrders.filter(o => new Date(o.date).toDateString() === ds).length;
    });

    let availableCount = 0;
    let lowStockCount = 0;
    let criticalCount = 0;
    let outOfStockCount = 0;

    for (const item of allMinStockItems) {
      const q = Number(item.quantity);
      const min = Number(item.minQuantity);
      if (q === 0) {
        outOfStockCount++;
      } else if (q <= min * 0.5) {
        criticalCount++;
      } else if (q <= min) {
        lowStockCount++;
      } else {
        availableCount++;
      }
    }

    return {
      totalSales,
      netProfit,
      totalCogs,
      totalExpenses,
      totalItems,
      inventoryValue: inventoryCostValue,
      inventoryCostValue,
      inventorySellingValue,
      lowStockCount: lowStockItems.length,
      stockBreakdown: {
        available: availableCount,
        lowStock: lowStockCount,
        critical: criticalCount,
        outOfStock: outOfStockCount,
      },
      totalCustomers: customerCount,
      totalSuppliers: supplierCount,
      totalOrders,
      pendingOrders,
      pendingSales,
      unpaidPurchases,
      activeUsers: userCount,
      todaySales,
      todayInvoices,
      profitMargin,
      hasPrevMonthSales,
      hasPrevMonthProfit,
      salesChange: Math.round(salesChange * 10) / 10,
      profitChange: Math.round(profitChange * 10) / 10,
      totalPurchases,
      totalTaxAmount,
      avgStockValue: totalItems > 0 ? inventoryCostValue / totalItems : 0,
      salesTrend,
      profitTrend,
      customerTrend,
      lowStockItems: lowStockItems.map(i => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        quantity: Number(i.quantity),
        minQuantity: Number(i.minQuantity),
        deficit: Number(i.minQuantity) - Number(i.quantity),
      })),
    };
  },

  async getCharts(repId?: number) {
    const now = new Date();
    const repFilter = repId ? { repId } : {};

    const [orders, purchaseOrders, items] = await Promise.all([
      prisma.salesOrder.findMany({
        where: { deletedAt: null, status: { not: 'cancelled' }, ...repFilter },
        select: { totalAmount: true, date: true, status: true },
      }),
      prisma.purchaseOrder.findMany({
        where: { deletedAt: null, status: { not: 'cancelled' } },
        select: { totalAmount: true, date: true },
      }),
      prisma.item.findMany({
        where: { deletedAt: null },
        select: { id: true, category: true, quantity: true, name: true, sellingPrice: true },
      }),
    ]);

    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const salesByMonth = monthNames.map((name, i) => {
      const ms = orders.filter(o => new Date(o.date).getMonth() === i && (o.status === 'shipped' || o.status === 'delivered'));
      const mp = purchaseOrders.filter(o => new Date(o.date).getMonth() === i);
      return {
        name,
        sales: ms.reduce((s, o) => s + Number(o.totalAmount), 0),
        purchases: mp.reduce((s, o) => s + Number(o.totalAmount), 0),
      };
    });

    const categoryMap: Record<string, number> = {};
    for (const item of items) {
      const cat = item.category || 'أخرى';
      categoryMap[cat] = (categoryMap[cat] ?? 0) + Number(item.quantity);
    }
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const completedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'delivered');
    const weeklyRevenue = dayNames.map((name, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i));
      const ds = d.toDateString();
      const val = completedOrders.filter(o => new Date(o.date).toDateString() === ds).reduce((s, o) => s + Number(o.totalAmount), 0);
      return { name, value: val };
    });

    return { salesByMonth, categoryData, weeklyRevenue };
  },

  async getTopProducts(repId?: number) {
    const repFilter = repId ? { repId } : {};
    const topItems = await prisma.salesOrderItem.groupBy({
      by: ['itemId'],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: DESC } },
      take: 5,
      where: {
        order: { deletedAt: null, status: { in: ['shipped', 'delivered'] }, ...repFilter },
      },
    });

    if (topItems.length === 0) return { items: [] };

    const itemIds = topItems.map(t => t.itemId);
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, sellingPrice: true },
    });
    const itemMap = new Map(items.map(i => [i.id, i]));

    return {
      items: topItems.map(t => ({
        name: itemMap.get(t.itemId)?.name ?? 'غير معروف',
        qty: Number(t._sum.quantity ?? 0),
        revenue: Number(t._sum.price ?? 0),
      })),
    };
  },

  async getTopCustomers(repId?: number) {
    const repFilter = repId ? { repId } : {};
    const customerSales = await prisma.salesOrder.groupBy({
      by: ['customerId'],
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: DESC } },
      take: 5,
      where: { deletedAt: null, status: { in: ['shipped', 'delivered'] }, ...repFilter },
    });

    if (customerSales.length === 0) return { items: [] };

    const customerIds = customerSales.map(c => c.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(customers.map(c => [c.id, c.name]));

    return {
      items: customerSales.map(c => ({
        name: nameMap.get(c.customerId) ?? 'عميل #' + c.customerId,
        total: Number(c._sum.totalAmount ?? 0),
        orders: c._count,
      })),
    };
  },

  async getAlerts() {
    const [lowStockItems, pendingSalesOrders, unpaidPurchaseOrders] = await Promise.all([
      prisma.item.findMany({
        where: { deletedAt: null, quantity: { lte: prisma.item.fields.minQuantity } },
        select: { id: true, name: true, sku: true, quantity: true, minQuantity: true },
        orderBy: { quantity: ASC },
        take: 10,
      }),
      prisma.salesOrder.count({ where: { deletedAt: null, status: 'pending' } }),
      prisma.purchaseOrder.count({
        where: { deletedAt: null, status: 'received', paymentStatus: { not: 'paid' } },
      }),
    ]);

    return {
      lowStock: lowStockItems.map(i => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        quantity: Number(i.quantity),
        minQuantity: Number(i.minQuantity),
        deficit: Number(i.minQuantity) - Number(i.quantity),
      })),
      pendingSales: pendingSalesOrders,
      unpaidPurchases: unpaidPurchaseOrders,
      totalAlerts: lowStockItems.length + pendingSalesOrders + unpaidPurchaseOrders,
    };
  },

  async getRecentActivity(limit = 10, userId?: number) {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: DESC },
      take: limit,
      where,
      select: {
        id: true,
        action: true,
        username: true,
        entity: true,
        entityId: true,
        details: true,
        timestamp: true,
      },
    });
    return { logs };
  },

  async getNotifications(limit = 8) {
    const notifications = await prisma.notification.findMany({
      orderBy: { date: DESC },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        read: true,
        date: true,
      },
    });
    const unreadCount = await prisma.notification.count({ where: { read: false } });
    return {
      notifications: notifications.map(n => ({
        ...n,
        type: n.type as string,
        date: n.date,
      })),
      unreadCount,
    };
  },

  async getLowStock() {
    const items = await prisma.item.findMany({
      where: { deletedAt: null, quantity: { lte: prisma.item.fields.minQuantity } },
      select: { id: true, name: true, sku: true, category: true, quantity: true, minQuantity: true, purchasePrice: true, sellingPrice: true },
      orderBy: { quantity: ASC },
    });
    return {
      items: items.map(i => ({
        ...i,
        quantity: Number(i.quantity),
        minQuantity: Number(i.minQuantity),
        purchasePrice: Number(i.purchasePrice),
        sellingPrice: Number(i.sellingPrice),
        deficit: Number(i.minQuantity) - Number(i.quantity),
      })),
    };
  },
};
