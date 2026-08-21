import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

function generateOrderNumber(): string {
  return `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export const salesOrdersService = {
  async listOrders(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    customerId?: number;
    paymentStatus?: string;
  }) {
    const { page = 1, pageSize = 10, search, status, customerId, paymentStatus } = params;
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;
    const where: any = { deletedAt: null };

    if (status) where.status = status;
    if (customerId) where.customerId = Number(customerId);
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        include: {
          customer: { select: { id: true, name: true } },
          items: {
            include: { item: { select: { id: true, name: true, sku: true } } },
          },
        },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    const repIds = [...new Set(orders.filter(o => o.repId).map(o => o.repId!))];
    const reps = repIds.length > 0
      ? await prisma.salesRep.findMany({ where: { id: { in: repIds } }, select: { id: true, name: true } })
      : [];
    const repMap = new Map(reps.map(r => [r.id, r.name]));

    return {
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        customerName: o.customer.name,
        repId: o.repId,
        repName: o.repId ? (repMap.get(o.repId) ?? null) : null,
        subtotal: toNumber(o.subtotal),
        taxId: o.taxId,
        taxAmount: toNumber(o.taxAmount),
        totalAmount: toNumber(o.totalAmount),
        status: o.status,
        paymentStatus: o.paymentStatus,
        paidAmount: toNumber(o.paidAmount),
        date: o.date.toISOString(),
        items: o.items.map(i => ({
          id: i.id,
          itemId: i.itemId,
          name: i.item.name,
          sku: i.item.sku,
          quantity: toNumber(i.quantity),
          price: toNumber(i.price),
          purchasePrice: toNumber(i.purchasePrice),
        })),
      })),
      meta: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) },
    };
  },

  async getOrder(id: number) {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { item: { select: { id: true, name: true, sku: true, category: true } } },
        },
      },
    });
    if (!order || order.deletedAt) throw new AppError(404, 'Order not found');

    let repName: string | null = null;
    if (order.repId) {
      const rep = await prisma.salesRep.findUnique({ where: { id: order.repId }, select: { name: true } });
      repName = rep?.name ?? null;
    }

    return {
      ...order,
      repName,
      subtotal: toNumber(order.subtotal),
      taxAmount: toNumber(order.taxAmount),
      totalAmount: toNumber(order.totalAmount),
      paidAmount: toNumber(order.paidAmount),
      settledAmount: toNumber(order.settledAmount),
      items: order.items.map(i => ({
        ...i,
        quantity: toNumber(i.quantity),
        price: toNumber(i.price),
        purchasePrice: toNumber(i.purchasePrice),
      })),
    };
  },

  async createOrder(data: {
    customerId: number;
    items: { itemId: number; quantity: number; price: number }[];
    taxId?: number | null;
    repId?: number | null;
    paidAmount?: number;
  }) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new AppError(404, 'Customer not found');

    const itemIds = data.items.map(i => i.itemId);
    const dbItems = await prisma.item.findMany({
      where: { id: { in: itemIds }, deletedAt: null },
      select: { id: true, name: true, purchasePrice: true, sellingPrice: true, quantity: true },
    });
    const itemMap = new Map(dbItems.map(i => [i.id, i]));

    let subtotal = 0;
    const orderItems = data.items.map(oi => {
      const dbItem = itemMap.get(oi.itemId);
      if (!dbItem) throw new AppError(404, `Item ${oi.itemId} not found`);
      const price = oi.price || toNumber(dbItem.sellingPrice);
      const quantity = oi.quantity;
      subtotal += price * quantity;
      return {
        itemId: oi.itemId,
        quantity: new Decimal(quantity),
        price: new Decimal(price),
        purchasePrice: new Decimal(toNumber(dbItem.purchasePrice)),
      };
    });

    let taxAmount = 0;
    let totalAmount = subtotal;

    if (data.taxId) {
      const tax = await prisma.taxConfig.findUnique({ where: { id: data.taxId } });
      if (tax) {
        const rate = toNumber(tax.rate);
        if (tax.isInclusive) {
          taxAmount = subtotal - (subtotal / (1 + rate / 100));
        } else {
          taxAmount = subtotal * (rate / 100);
          totalAmount = subtotal + taxAmount;
        }
      }
    }

    const orderNumber = generateOrderNumber();
    const paidAmount = data.paidAmount ?? 0;
    const paid = Math.min(paidAmount, totalAmount);
    const paymentStatus = paid >= totalAmount ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.salesOrder.create({
        data: {
          orderNumber,
          customerId: data.customerId,
          repId: data.repId ?? undefined,
          subtotal: new Decimal(subtotal),
          taxId: data.taxId ?? undefined,
          taxAmount: new Decimal(taxAmount),
          totalAmount: new Decimal(totalAmount),
          status: 'pending',
          paymentStatus,
          paidAmount: new Decimal(paid),
          items: { create: orderItems },
        },
        include: {
          customer: { select: { id: true, name: true } },
          items: { include: { item: { select: { id: true, name: true, sku: true } } } },
        },
      });

      if (paid > 0) {
        await tx.financialTransaction.create({
          data: {
            type: 'income',
            category: 'sale',
            amount: new Decimal(paid),
            description: `دفعة على فاتورة ${orderNumber}`,
            referenceId: created.id,
            transactionNumber: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          },
        });
      }

      if (data.repId) {
        await tx.salesRep.update({
          where: { id: data.repId },
          data: {
            currentSales: { increment: new Decimal(totalAmount) },
            balance: { increment: new Decimal(paid) },
          },
        });
      }

      return created;
    });

    return order;
  },

  async dispatchOrder(id: number, userId: number) {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order || order.deletedAt) throw new AppError(404, 'Order not found');
    if (order.status !== 'pending') throw new AppError(400, 'Order is already processed');

    const result = await prisma.$transaction(async (tx) => {
      for (const orderItem of order.items) {
        const item = await tx.item.findUnique({ where: { id: orderItem.itemId } });
        if (!item) throw new AppError(404, `Item ${orderItem.itemId} not found`);

        const qty = toNumber(orderItem.quantity);
        const currentQty = toNumber(item.quantity);

        if (currentQty < qty) {
          throw new AppError(400, `Insufficient quantity for item ${item.name}. Available: ${currentQty}, requested: ${qty}`);
        }

        const newQty = new Decimal(currentQty - qty);
        await tx.item.update({
          where: { id: orderItem.itemId },
          data: { quantity: newQty },
        });

        await tx.inventoryTransaction.create({
          data: {
            itemId: orderItem.itemId,
            type: 'decrease',
            oldQuantity: new Decimal(currentQty),
            newQuantity: newQty,
            diff: orderItem.quantity,
            reason: 'مبيعات مسجلة',
            source: order.orderNumber,
            userId,
          },
        });
      }

      const updated = await tx.salesOrder.update({
        where: { id },
        data: { status: 'shipped' },
      });

      await tx.financialTransaction.create({
        data: {
          type: 'income',
          category: 'sale',
          amount: order.totalAmount,
          description: `مبيعات - فاتورة صرف رقم ${order.orderNumber}`,
          referenceId: order.id,
          transactionNumber: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      });

      return updated;
    });

    return { id: result.id, status: result.status };
  },

  async cancelOrder(id: number) {
    const order = await prisma.salesOrder.findUnique({ where: { id } });
    if (!order || order.deletedAt) throw new AppError(404, 'Order not found');
    if (order.status !== 'pending') throw new AppError(400, 'Only pending orders can be cancelled');

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return { id: updated.id, status: updated.status };
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const order = await prisma.salesOrder.findUnique({ where: { id } });
    if (!order) throw new AppError(404, 'Order not found');

    await prisma.$transaction([
      prisma.salesOrder.update({
        where: { id },
        data: { deletedAt: new Date(), deleteReason: reason },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          username,
          action: `حذف فاتورة بيع رقم ${order.orderNumber}`,
          entity: 'SalesOrder',
          entityId: String(id),
          details: `سبب الحذف: ${reason}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          title: 'تم حذف الفاتورة',
          message: `تم حذف فاتورة البيع رقم ${order.orderNumber} بنجاح`,
          type: 'error',
        },
      }),
    ]);

    return { success: true };
  },

  async recordPayment(id: number, amount: number, method: string, userId: number) {
    const order = await prisma.salesOrder.findUnique({ where: { id } });
    if (!order || order.deletedAt) throw new AppError(404, 'Order not found');

    const currentPaid = toNumber(order.paidAmount);
    const totalAmount = toNumber(order.totalAmount);
    const newPaid = currentPaid + amount;

    if (newPaid > totalAmount) {
      throw new AppError(400, 'Payment exceeds order total');
    }

    const paymentStatus = newPaid >= totalAmount ? 'paid' : 'partial';

    await prisma.$transaction([
      prisma.salesOrder.update({
        where: { id },
        data: {
          paidAmount: new Decimal(newPaid),
          paymentStatus,
        },
      }),
      prisma.financialTransaction.create({
        data: {
          type: 'income',
          category: 'sale',
          amount: new Decimal(amount),
          description: `دفعة على فاتورة ${order.orderNumber}`,
          referenceId: order.id,
          transactionNumber: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          title: 'تسجيل دفعة',
          message: `تم تسجيل دفعة بقيمة ${amount} على الفاتورة ${order.orderNumber}`,
          type: 'info',
        },
      }),
    ]);

    return { success: true, paidAmount: newPaid, paymentStatus };
  },

  async getUnsettledAmount(repId: number) {
    const orders = await prisma.salesOrder.findMany({
      where: {
        repId,
        deletedAt: null,
        status: { notIn: ['cancelled'] },
      },
      select: { paidAmount: true, settledAmount: true },
    });

    const total = orders.reduce((sum, o) => {
      return sum + toNumber(o.paidAmount) - toNumber(o.settledAmount);
    }, 0);

    return Math.max(0, total);
  },

  async getSettledCommission(repId: number, commissionRate: number) {
    const orders = await prisma.salesOrder.findMany({
      where: {
        repId,
        deletedAt: null,
        isSettledWithWarehouse: true,
        status: { notIn: ['cancelled', 'pending'] },
      },
      select: { paidAmount: true, settledAmount: true },
    });

    const totalSettled = orders.reduce((sum, o) => {
      return sum + toNumber(o.paidAmount) - toNumber(o.settledAmount);
    }, 0);

    return totalSettled * (commissionRate / 100);
  },

  async listActiveTaxes() {
    const taxes = await prisma.taxConfig.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, rate: true, type: true, isInclusive: true },
      orderBy: { name: 'asc' },
    });
    return taxes.map(t => ({ ...t, rate: Number(t.rate) }));
  },
};
