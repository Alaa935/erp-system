import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

export const purchaseOrdersService = {
  async listPurchaseOrders(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    supplierId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 10, search, status, paymentStatus, supplierId, sortBy, sortOrder } = params;
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (supplierId) where.supplierId = Number(supplierId);
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const orderBy: any = {};
    if (sortBy === 'date') orderBy.date = sortOrder ?? 'desc';
    else if (sortBy === 'orderNumber') orderBy.orderNumber = sortOrder ?? 'asc';
    else if (sortBy === 'totalAmount') orderBy.totalAmount = sortOrder ?? 'asc';
    else orderBy.date = 'desc';
    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where, orderBy,
        skip: (pageNum - 1) * pageSizeNum, take: pageSizeNum,
        include: { supplier: { select: { id: true, name: true } }, items: { include: { item: { select: { id: true, name: true, sku: true } } } } },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return {
      orders: orders.map(o => ({
        id: o.id, orderNumber: o.orderNumber, supplierId: o.supplierId, supplierName: o.supplier.name,
        invoiceNumber: o.invoiceNumber, subtotal: toNumber(o.subtotal), taxId: o.taxId,
        taxAmount: toNumber(o.taxAmount), totalAmount: toNumber(o.totalAmount), status: o.status,
        paymentStatus: o.paymentStatus, paidAmount: toNumber(o.paidAmount),
        dueDate: o.dueDate?.toISOString() ?? null, date: o.date.toISOString(), notes: o.notes,
        paymentMethod: o.paymentMethod,
        items: o.items.map(i => ({ id: i.id, itemId: i.itemId, name: i.item.name, sku: i.item.sku, quantity: toNumber(i.quantity), price: toNumber(i.price) })),
      })),
      meta: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) },
    };
  },

  async getPurchaseOrder(id: number) {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: { select: { id: true, name: true } }, items: { include: { item: { select: { id: true, name: true, sku: true } } } } },
    });
    if (!order || order.deletedAt) throw new AppError(404, 'Purchase order not found');
    return { ...order, subtotal: toNumber(order.subtotal), taxAmount: toNumber(order.taxAmount), totalAmount: toNumber(order.totalAmount), paidAmount: toNumber(order.paidAmount), items: order.items.map(i => ({ ...i, quantity: toNumber(i.quantity), price: toNumber(i.price) })) };
  },

  async createPurchaseOrder(data: {
    supplierId: number; invoiceNumber?: string | null;
    items: { itemId: number; quantity: number; price: number }[];
    subtotal?: number; taxId?: number | null; taxAmount?: number; totalAmount: number;
    status?: 'received' | 'cancelled'; paymentStatus?: 'paid' | 'partial' | 'unpaid';
    paidAmount?: number; dueDate?: string | null; date?: string; notes?: string | null;
    paymentMethod?: 'cash' | 'transfer' | 'check' | 'credit' | null;
    orderNumber?: string;
  }) {
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier || supplier.deletedAt) throw new AppError(404, 'Supplier not found');
    const itemIds = data.items.map(i => i.itemId);
    const dbItems = await prisma.item.findMany({ where: { id: { in: itemIds }, deletedAt: null }, select: { id: true, name: true, quantity: true } });
    if (dbItems.length !== itemIds.length) throw new AppError(400, 'One or more items not found');
    const orderNumber = data.orderNumber || 'PO-' + Date.now();
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: {
          orderNumber, supplierId: data.supplierId, invoiceNumber: data.invoiceNumber ?? undefined,
          subtotal: data.subtotal !== undefined ? new Decimal(data.subtotal) : undefined,
          taxId: data.taxId ?? undefined, taxAmount: data.taxAmount !== undefined ? new Decimal(data.taxAmount) : undefined,
          totalAmount: new Decimal(data.totalAmount), status: data.status ?? 'received',
          paymentStatus: data.paymentStatus ?? 'unpaid', paidAmount: new Decimal(data.paidAmount ?? 0),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          date: data.date ? new Date(data.date) : undefined, notes: data.notes ?? undefined,
          paymentMethod: data.paymentMethod ?? undefined,
          items: { create: data.items.map(item => ({ itemId: item.itemId, quantity: new Decimal(item.quantity), price: new Decimal(item.price) })) },
        },
        include: { supplier: { select: { id: true, name: true } }, items: { include: { item: { select: { id: true, name: true, sku: true } } } } },
      });
      const effectiveStatus = data.status ?? 'received';
      if (effectiveStatus === 'received') {
        for (const item of data.items) {
          const dbItem = dbItems.find(i => i.id === item.itemId)!;
          const newQty = new Decimal(toNumber(dbItem.quantity)).plus(item.quantity);
          await tx.item.update({ where: { id: item.itemId }, data: { quantity: newQty } });
          await tx.inventoryTransaction.create({ data: { itemId: item.itemId, type: 'increase', oldQuantity: dbItem.quantity, newQuantity: newQty, diff: new Decimal(item.quantity), reason: 'مشتريات مسجلة', source: orderNumber, userId: 0 } });
        }
      }
      return created;
    });
    return order;
  },

  async updatePurchaseOrder(id: number, data: {
    supplierId?: number; invoiceNumber?: string | null;
    items?: { itemId: number; quantity: number; price: number }[];
    subtotal?: number; taxId?: number | null; taxAmount?: number; totalAmount?: number;
    status?: 'received' | 'cancelled'; paymentStatus?: 'paid' | 'partial' | 'unpaid';
    paidAmount?: number; dueDate?: string | null; date?: string; notes?: string | null;
    paymentMethod?: 'cash' | 'transfer' | 'check' | 'credit' | null;
  }) {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new AppError(404, 'Purchase order not found');
    const updateData: any = {};
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber;
    if (data.subtotal !== undefined) updateData.subtotal = new Decimal(data.subtotal);
    if (data.taxId !== undefined) updateData.taxId = data.taxId;
    if (data.taxAmount !== undefined) updateData.taxAmount = new Decimal(data.taxAmount);
    if (data.totalAmount !== undefined) updateData.totalAmount = new Decimal(data.totalAmount);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
    if (data.paidAmount !== undefined) updateData.paidAmount = new Decimal(data.paidAmount);
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    const order = await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.purchaseOrderItem.deleteMany({ where: { orderId: id } });
        await tx.purchaseOrderItem.createMany({ data: data.items.map(item => ({ orderId: id, itemId: item.itemId, quantity: new Decimal(item.quantity), price: new Decimal(item.price) })) });
      }
      return tx.purchaseOrder.update({
        where: { id }, data: updateData,
        include: { supplier: { select: { id: true, name: true } }, items: { include: { item: { select: { id: true, name: true, sku: true } } } } },
      });
    });
    return order;
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!order || order.deletedAt) throw new AppError(404, 'Purchase order not found');
    await prisma.$transaction([
      prisma.purchaseOrder.update({ where: { id }, data: { deletedAt: new Date(), deleteReason: reason } }),
      prisma.activityLog.create({ data: { userId, username, action: 'حذف أمر شراء: ' + order.orderNumber, entity: 'PurchaseOrder', entityId: String(id), details: 'سبب الحذف: ' + reason } }),
      prisma.notification.create({ data: { userId, title: 'حذف أمر شراء', message: 'تم حذف أمر الشراء رقم ' + order.orderNumber + ' بنجاح', type: 'error' } }),
    ]);
    return { success: true };
  },
};
