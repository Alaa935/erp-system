import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import Decimal from 'decimal.js';

const router = Router();

router.use(authenticate);

// TEMPORARY DIAGNOSTIC: replicates POST /api/purchase-orders but returns full error details
router.post('/purchase-order-create', authorize('admin', 'manager'), async (req, res) => {
  const data = req.body;
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier || supplier.deletedAt) {
      res.status(404).json({ success: false, error: 'Supplier not found' });
      return;
    }
    const itemIds = data.items.map((i: any) => i.itemId);
    const dbItems = await prisma.item.findMany({
      where: { id: { in: itemIds }, deletedAt: null },
      select: { id: true, name: true, quantity: true },
    });
    if (dbItems.length !== itemIds.length) {
      res.status(400).json({ success: false, error: 'One or more items not found' });
      return;
    }
    const orderNumber = data.orderNumber || 'PO-DIAG-' + Date.now();
    const order = await prisma.$transaction(async (tx: any) => {
      const created = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber ?? undefined,
          subtotal: data.subtotal !== undefined ? new Decimal(data.subtotal) : undefined,
          taxId: data.taxId ?? undefined,
          taxAmount: data.taxAmount !== undefined ? new Decimal(data.taxAmount) : undefined,
          totalAmount: new Decimal(data.totalAmount),
          status: data.status ?? 'received',
          paymentStatus: data.paymentStatus ?? 'unpaid',
          paidAmount: new Decimal(data.paidAmount ?? 0),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          date: data.date ? new Date(data.date) : undefined,
          notes: data.notes ?? undefined,
          paymentMethod: data.paymentMethod ?? undefined,
          items: {
            create: data.items.map((item: any) => ({
              itemId: item.itemId,
              quantity: new Decimal(item.quantity),
              price: new Decimal(item.price),
            })),
          },
        },
        include: {
          supplier: { select: { id: true, name: true } },
          items: { include: { item: { select: { id: true, name: true, sku: true } } } },
        },
      });
      return created;
    });
    res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    console.error('[DIAGNOSTIC ERROR]', err);
    const diagnostic: Record<string, any> = {
      message: err.message,
      name: err.name,
      stack: err.stack,
    };
    if (err.code) diagnostic.code = err.code;
    if (err.meta) diagnostic.meta = err.meta;
    if (err.clientVersion) diagnostic.clientVersion = err.clientVersion;
    res.status(500).json({ success: false, diagnostic });
  }
});

export default router;
