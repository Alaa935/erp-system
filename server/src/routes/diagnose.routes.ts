import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import Decimal from 'decimal.js';

const router = Router();

router.use(authenticate);

router.get('/schema', authorize('admin'), async (_req, res) => {
  try {
    const pcols = await prisma.$queryRawUnsafe(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'purchase_orders' ORDER BY ordinal_position`);
    const picols = await prisma.$queryRawUnsafe(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'purchase_order_items' ORDER BY ordinal_position`);
    const socols = await prisma.$queryRawUnsafe(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'sales_orders' ORDER BY ordinal_position`);
    const sicols = await prisma.$queryRawUnsafe(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'sales_order_items' ORDER BY ordinal_position`);
    const enums = await prisma.$queryRawUnsafe(`SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid ORDER BY t.typname, e.enumsortorder`);
    const triggers = await prisma.$queryRawUnsafe(`SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'purchase_orders'`);
    const constraints = await prisma.$queryRawUnsafe(`SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'purchase_orders'::regclass`);
    res.json({ success: true, purchase_orders: pcols, purchase_order_items: picols, sales_orders: socols, sales_order_items: sicols, enums, triggers, constraints });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, detail: err.meta || null });
  }
});

router.post('/purchase-order-create', authorize('admin', 'manager'), async (req, res) => {
  const data = req.body;
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier || supplier.deletedAt) {
      res.status(404).json({ success: false, error: 'Supplier not found' });
      return;
    }
    if (data.items && data.items.length > 0) {
      const itemIds = data.items.map((i: any) => i.itemId);
      const dbItems = await prisma.item.findMany({
        where: { id: { in: itemIds }, deletedAt: null },
        select: { id: true, name: true, quantity: true },
      });
      if (dbItems.length !== itemIds.length) {
        res.status(400).json({ success: false, error: 'One or more items not found' });
        return;
      }
    }
    const orderNumber = data.orderNumber || 'PO-DIAG-' + Date.now();

    // TEST 1: Create order without transaction
    const order = await prisma.purchaseOrder.create({
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
      },
    });

    // TEST 2: Try creating SalesOrderItem to compare behavior
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      // First test: PurchaseOrderItem
      try {
        const pi = await prisma.purchaseOrderItem.create({
          data: {
            orderId: order.id,
            itemId: item.itemId,
            quantity: new Decimal(item.quantity),
            price: new Decimal(item.price),
          },
        });
        res.json({ success: true, message: 'PurchaseOrderItem created ok', pi: { id: pi.id, orderId: pi.orderId, itemId: pi.itemId } });
      } catch (err2: any) {
        // Second test: SalesOrderItem (create a minimal sales order first)
        try {
          const so = await prisma.salesOrder.create({
            data: {
              orderNumber: 'SO-DIAG-' + Date.now(),
              customerId: 1,
              totalAmount: new Decimal(data.totalAmount),
              status: 'pending',
              paymentStatus: 'unpaid',
              paidAmount: new Decimal(0),
            },
          });
          const si = await prisma.salesOrderItem.create({
            data: {
              orderId: so.id,
              itemId: item.itemId,
              quantity: new Decimal(item.quantity),
              price: new Decimal(item.price),
            },
          });
          res.json({ success: true, message: 'PurchaseOrderItem failed but SalesOrderItem worked', poError: { code: err2.code, column: err2.meta?.column, model: err2.meta?.modelName }, si: { id: si.id } });
          // Cleanup
          await prisma.salesOrder.delete({ where: { id: so.id } }).catch(() => {});
        } catch (err3: any) {
          // Both failed - this is a broader Prisma issue
          res.json({ success: true, message: 'Both item types failed', poError: { code: err2.code, column: err2.meta?.column, model: err2.meta?.modelName }, soError: { code: err3.code, column: err3.meta?.column, model: err3.meta?.modelName } });
        }
      }
      // Cleanup the order created above
      await prisma.purchaseOrder.delete({ where: { id: order.id } }).catch(() => {});
      return;
    }

    // Return with includes
    const result = await prisma.purchaseOrder.findUnique({
      where: { id: order.id },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { item: { select: { id: true, name: true, sku: true } } } },
      },
    });
    res.status(201).json({ success: true, data: result });
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
