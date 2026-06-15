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
    const triggersPO = await prisma.$queryRawUnsafe(`SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'purchase_orders'`);
    const triggersPOI = await prisma.$queryRawUnsafe(`SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'purchase_order_items'`);
    const lineTotalDef = await prisma.$queryRawUnsafe(`SELECT column_name, data_type, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale, generation_expression FROM information_schema.columns WHERE table_name = 'purchase_order_items' AND column_name = 'line_total'`);
    const constraints = await prisma.$queryRawUnsafe(`SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'purchase_orders'::regclass`);
    const triggerFuncDef = await prisma.$queryRawUnsafe(`SELECT pg_get_functiondef(oid) AS func_def FROM pg_proc WHERE proname = 'check_purchase_order_status'`);

    // Search all functions/triggers/views for references to purchase_order_id or order_status
    const refsPurchaseOrderIdFuncs = await prisma.$queryRawUnsafe(`SELECT proname AS object_name, 'function' AS object_type, pg_get_functiondef(oid) AS definition FROM pg_proc WHERE prosrc ILIKE '%purchase_order_id%' AND proname NOT LIKE '%pg_%'`);
    const refsOrderStatusFuncs = await prisma.$queryRawUnsafe(`SELECT proname AS object_name, 'function' AS object_type, pg_get_functiondef(oid) AS definition FROM pg_proc WHERE prosrc ILIKE '%order_status%' AND proname NOT LIKE '%pg_%'`);
    const refsPurchaseOrderIdTriggers = await prisma.$queryRawUnsafe(`SELECT trigger_name, event_object_table, 'trigger' AS object_type, action_statement FROM information_schema.triggers WHERE action_statement ILIKE '%purchase_order_id%'`);
    const refsOrderStatusTriggers = await prisma.$queryRawUnsafe(`SELECT trigger_name, event_object_table, 'trigger' AS object_type, action_statement FROM information_schema.triggers WHERE action_statement ILIKE '%order_status%'`);
    const refsOrderStatusCols = await prisma.$queryRawUnsafe(`SELECT column_name, table_name, data_type FROM information_schema.columns WHERE column_name IN ('purchase_order_id', 'order_status') ORDER BY table_name, column_name`);
    const refsOrderStatusConstraints = await prisma.$queryRawUnsafe(`SELECT conname, contype, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE pg_get_constraintdef(oid) ILIKE '%order_status%' OR pg_get_constraintdef(oid) ILIKE '%purchase_order_id%'`);

    res.json({
      success: true,
      purchase_orders: pcols, purchase_order_items: picols,
      sales_orders: socols, sales_order_items: sicols,
      enums, triggersPO, triggersPOI, lineTotalDef, constraints, triggerFuncDef,
      refs: {
        purchase_order_id: { functions: refsPurchaseOrderIdFuncs, triggers: refsPurchaseOrderIdTriggers, constraints: refsOrderStatusConstraints },
        order_status: { functions: refsOrderStatusFuncs, triggers: refsOrderStatusTriggers, columns: refsOrderStatusCols, constraints: refsOrderStatusConstraints },
      }
    });
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

    // TEST 2: Try raw SQL insert to compare
    if (data.items && data.items.length > 0) {
      const item = data.items[0];

      // Test 1: $executeRawUnsafe without RETURNING
      try {
        const affected = await prisma.$executeRawUnsafe(
          `INSERT INTO purchase_order_items ("orderId", "itemId", quantity, price) VALUES ($1, $2, $3, $4)`,
          order.id, item.itemId, item.quantity, item.price
        );
        // Check if it was inserted
        const check: any = await prisma.$queryRawUnsafe(`SELECT id FROM purchase_order_items ORDER BY id DESC LIMIT 1`);
        const insertedId = Array.isArray(check) && check.length > 0 ? check[0].id : null;
        if (insertedId) await prisma.$executeRawUnsafe(`DELETE FROM purchase_order_items WHERE id = $1`, insertedId);
        res.json({ success: true, message: '$executeRawUnsafe SUCCEEDED!', affected, insertedId });
      } catch (rawErr2: any) {
        res.json({ success: true, message: '$executeRawUnsafe failed', error: { message: rawErr2.message, code: rawErr2?.code } });
      }

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

router.post('/purchase-order-nested-create', authorize('admin', 'manager'), async (req, res) => {
  const data = req.body;

  // Capture every SQL statement Prisma sends
  const capturedQueries: Array<{ query: string; params: string; duration: number; timestamp: Date }> = [];

  const handler = (e: any) => {
    capturedQueries.push({
      query: e.query,
      params: e.params,
      duration: e.duration,
      timestamp: e.timestamp,
    });
  };

  prisma.$on('query', handler);

  try {
    // Validate supplier existence
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier || supplier.deletedAt) {
      res.status(404).json({ success: false, error: 'Supplier not found', capturedQueries });
      return;
    }

    // Validate items exist
    if (data.items && data.items.length > 0) {
      const itemIds = data.items.map((i: any) => i.itemId);
      const dbItems = await prisma.item.findMany({
        where: { id: { in: itemIds }, deletedAt: null },
        select: { id: true, name: true, quantity: true },
      });
      if (dbItems.length !== itemIds.length) {
        res.status(400).json({ success: false, error: 'One or more items not found', capturedQueries });
        return;
      }
    }

    const orderNumber = data.orderNumber || 'PO-DIAG-NESTED-' + Date.now();

    // --- THIS IS THE EXACT FAILING PATH ---
    // Nested create: PurchaseOrder + PurchaseOrderItems together via Prisma create
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
        items: {
          create: (data.items || []).map((item: any) => ({
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

    // Success — clean up test data
    const deleted = await prisma.purchaseOrder.delete({ where: { id: order.id } }).catch(() => null);

    res.json({
      success: true,
      message: 'Nested create SUCCEEDED — no error occurred',
      capturedQueries,
      orderId: order.id,
      cleanup: deleted ? 'deleted' : 'cleanup_failed',
    });
  } catch (err: any) {
    // Full error payload — every property Prisma exposes
    const diagnostic: Record<string, any> = {
      message: err.message,
      name: err.name,
      stack: err.stack,
    };
    if (err.code !== undefined) diagnostic.code = err.code;
    if (err.meta !== undefined) diagnostic.meta = err.meta;
    if (err.clientVersion !== undefined) diagnostic.clientVersion = err.clientVersion;
    if (err.cause !== undefined) diagnostic.cause = err.cause instanceof Error ? { message: err.cause.message, stack: err.cause.stack } : String(err.cause);

    res.status(500).json({ success: false, diagnostic, capturedQueries });
  }
  // NOTE: Prisma 6.x $on('query') has no $off — listener remains for process lifetime.
  // This is acceptable for a temporary diagnostic endpoint.
});

export default router;
