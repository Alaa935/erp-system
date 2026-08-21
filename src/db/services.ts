import { db } from './schema';
import type { Item, PurchaseOrder } from '../types';

function txnId(): string {
  return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function exportAllData(): Promise<string> {
  const dump: Record<string, any[]> = {};
  for (const table of db.tables) {
    dump[table.name] = await table.toArray();
  }
  return JSON.stringify(dump, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const dump = JSON.parse(json);
  for (const [tableName, records] of Object.entries(dump)) {
    const table = db.tables.find(t => t.name === tableName);
    if (table && Array.isArray(records)) {
      await table.clear();
      if (records.length > 0) await table.bulkAdd(records);
    }
  }
}

export const inventoryService = {
  async updateQuantity(
    itemId: number,
    diff: number,
    type: 'increase' | 'decrease',
    reason: string,
    userId: number | string,
    source?: string
  ) {
    return db.transaction('rw', [db.items, db.inventoryTransactions], async () => {
      const item = await db.items.get(itemId);
      if (!item) throw new Error('الصنف غير موجود');
      if (diff <= 0) throw new Error('الفرق يجب أن يكون أكبر من صفر');
      const oldQuantity = item.quantity ?? 0;
      const newQuantity = type === 'increase' ? oldQuantity + diff : oldQuantity - diff;
      if (newQuantity < 0) throw new Error(`الكمية غير كافية. المتاح: ${oldQuantity}`);
      await db.items.update(itemId, { quantity: newQuantity, updatedAt: Date.now() });
      await db.inventoryTransactions.add({
        itemId, type, oldQuantity, newQuantity, diff, reason, source, userId,
        timestamp: Date.now()
      });
      return newQuantity;
    });
  },

  async processSalesOrder(orderId: number, userId: number | string) {
    return db.transaction('rw', [db.items, db.inventoryTransactions, db.salesOrders, db.transactions], async () => {
      const order = await db.salesOrders.get(orderId);
      if (!order) throw new Error('الطلب غير موجود');
      if (order.status === 'delivered' || order.status === 'cancelled') throw new Error('لا يمكن معالجة هذا الطلب في حالته الحالية');
      for (const item of order.items) {
        if (!item.purchasePrice) {
          const itemData = await db.items.get(item.itemId);
          if (itemData) item.purchasePrice = itemData.purchasePrice;
        }
        await this.updateQuantity(item.itemId, item.quantity, 'decrease', 'فاتورة مبيعات', userId, `Sale-${order.orderNumber}`);
      }
      // Record Sale Income
      await db.transactions.add({
        transactionNumber: txnId(), type: 'income', category: 'sale', amount: order.totalAmount,
        description: `مبيعات - فاتورة صرف رقم ${order.orderNumber}`, referenceId: order.id, date: Date.now()
      });
      // Record COGS (Cost of Goods Sold)
      const cogsTotal = order.items.reduce((sum, i) => sum + (i.quantity * (i.purchasePrice || 0)), 0);
      if (cogsTotal > 0) {
        await db.transactions.add({
          transactionNumber: txnId(), type: 'expense', category: 'cogs', amount: cogsTotal,
          description: `تكلفة البضاعة المباعة - فاتورة صرف رقم ${order.orderNumber}`, referenceId: order.id, date: Date.now()
        });
      }
      await db.salesOrders.update(orderId, { status: 'shipped', items: order.items });
    });
  },

  async addSupplierInvoice(invoice: Omit<PurchaseOrder, 'id'>, userId: number | string, newItemsData?: Partial<Item>[]) {
    return db.transaction('rw', [db.items, db.inventoryTransactions, db.purchaseOrders, db.transactions, db.activityLogs], async () => {
      // Check for duplicate invoice/order number
      if (invoice.orderNumber) {
        const existing = await db.purchaseOrders.where('orderNumber').equals(invoice.orderNumber).first();
        if (existing) {
          throw new Error(`رقم الفاتورة "${invoice.orderNumber}" موجود مسبقاً`);
        }
      }
      const itemIdMap: { [tempId: string]: number } = {};
      if (newItemsData && newItemsData.length > 0) {
        for (const newItem of newItemsData) {
          const id = await db.items.add({
            sku: newItem.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            name: newItem.name || 'منتج جديد', category: newItem.category || 'عام',
            purchasePrice: newItem.purchasePrice || 0, sellingPrice: newItem.sellingPrice || 0,
            quantity: 0, minQuantity: newItem.minQuantity || 5, location: newItem.location || 'غير محدد',
            supplierId: invoice.supplierId, createdAt: Date.now(), updatedAt: Date.now()
          } as Item);
          if (newItem.id) itemIdMap[newItem.id.toString()] = id;
        }
      }
      const processedItems = invoice.items.map(item => ({ ...item, itemId: itemIdMap[item.itemId] || item.itemId }));
      const invoiceId = await db.purchaseOrders.add({ ...invoice, items: processedItems });
      for (const item of processedItems) {
        const dbItem = await db.items.get(item.itemId);
        if (!dbItem) continue;
        const totalQty = dbItem.quantity + item.quantity;
        const newAverageCost = totalQty > 0
          ? Number(((dbItem.quantity * dbItem.purchasePrice + item.quantity * item.price) / totalQty).toFixed(2))
          : dbItem.purchasePrice;
        await db.items.update(item.itemId, { quantity: totalQty, purchasePrice: newAverageCost, updatedAt: Date.now() });
        await db.inventoryTransactions.add({
          itemId: item.itemId, type: 'increase', oldQuantity: dbItem.quantity, newQuantity: totalQty,
          diff: item.quantity, reason: 'فاتورة مورد', source: `Invoice-${invoice.orderNumber}`, userId, timestamp: Date.now()
        });
      }
      await db.transactions.add({
        transactionNumber: txnId(), type: 'expense', category: 'purchase', amount: invoice.totalAmount,
        description: `فاتورة شراء مباشرة رقم ${invoice.orderNumber} (مورد: ${invoice.supplierId})`, referenceId: invoiceId, date: Date.now()
      });
      await db.activityLogs.add({
        userId, username: userId.toString(), action: 'إضافة فاتورة مورد', entity: 'SupplierInvoice',
        entityId: invoiceId, details: `إضافة فاتورة شراء رقم ${invoice.orderNumber} بقيمة ${invoice.totalAmount}`, timestamp: Date.now()
      });
      return invoiceId;
    });
  },

  async deleteSupplierInvoice(invoiceId: number, userId: number | string) {
    return db.transaction('rw', [db.items, db.inventoryTransactions, db.purchaseOrders, db.transactions, db.activityLogs], async () => {
      const invoice = await db.purchaseOrders.get(invoiceId);
      if (!invoice) throw new Error('الفاتورة غير موجودة');
      for (const item of invoice.items) {
        const dbItem = await db.items.get(item.itemId);
        if (!dbItem) continue;
        if (dbItem.quantity < item.quantity) throw new Error(`لا يمكن حذف الفاتورة: الكمية غير كافية للصنف ${dbItem.name}. المتاح: ${dbItem.quantity}, المطلوب: ${item.quantity}`);
        const newQty = dbItem.quantity - item.quantity;
        await db.items.update(item.itemId, { quantity: newQty, updatedAt: Date.now() });
        await db.inventoryTransactions.add({
          itemId: item.itemId, type: 'decrease', oldQuantity: dbItem.quantity, newQuantity: newQty,
          diff: item.quantity, reason: `إلغاء فاتورة مورد رقم ${invoice.orderNumber}`, source: `DeleteInvoice-${invoice.orderNumber}`, userId, timestamp: Date.now()
        });
      }
      // Instead of deleting the original transaction, add a reversing entry
      const financialTx = await db.transactions.where({ referenceId: invoiceId, category: 'purchase' }).first();
      if (financialTx) {
        await db.transactions.add({
          transactionNumber: txnId(), type: 'income',
          category: 'purchase',
          amount: financialTx.amount,
          description: `عكس قيد - إلغاء فاتورة مورد رقم ${invoice.orderNumber}`,
          referenceId: invoiceId,
          date: Date.now()
        });
      }
      await db.purchaseOrders.update(invoiceId, { deletedAt: Date.now(), deleteReason: 'إلغاء فاتورة مورد' });
      await db.activityLogs.add({
        userId, username: userId.toString(), action: 'حذف فاتورة مورد', entity: 'SupplierInvoice',
        entityId: invoiceId, details: `حذف فاتورة شراء رقم ${invoice.orderNumber} بقيمة ${invoice.totalAmount}`, timestamp: Date.now()
      });
      return true;
    });
  },

  async updateSupplierInvoice(invoiceId: number, updatedInvoice: PurchaseOrder, userId: number | string) {
    return db.transaction('rw', [db.items, db.inventoryTransactions, db.purchaseOrders, db.transactions, db.activityLogs], async () => {
      const oldInvoice = await db.purchaseOrders.get(invoiceId);
      if (!oldInvoice) throw new Error('الفاتورة غير موجودة');
      for (const oldItem of oldInvoice.items) {
        const dbItem = await db.items.get(oldItem.itemId);
        if (!dbItem) continue;
        const newQty = dbItem.quantity - oldItem.quantity;
        if (newQty < 0) throw new Error(`لا يمكن تعديل الفاتورة: الكمية غير كافية للصنف ${dbItem.name}. المتاح: ${dbItem.quantity}, المطلوب إلغاؤه: ${oldItem.quantity}`);
        await db.items.update(oldItem.itemId, { quantity: newQty, updatedAt: Date.now() });
      }
      for (const newItem of updatedInvoice.items) {
        const dbItem = await db.items.get(newItem.itemId);
        if (!dbItem) continue;
        const totalQty = dbItem.quantity + newItem.quantity;
        const newAverageCost = totalQty > 0
          ? Number(((dbItem.quantity * dbItem.purchasePrice + newItem.quantity * newItem.price) / totalQty).toFixed(2))
          : dbItem.purchasePrice;
        await db.items.update(newItem.itemId, { quantity: totalQty, purchasePrice: newAverageCost, updatedAt: Date.now() });
        await db.inventoryTransactions.add({
          itemId: newItem.itemId, type: 'increase', oldQuantity: dbItem.quantity, newQuantity: totalQty,
          diff: newItem.quantity, reason: `تحديث فاتورة مورد رقم ${updatedInvoice.orderNumber}`, source: `UpdateInvoice-${updatedInvoice.orderNumber}`, userId, timestamp: Date.now()
        });
      }
      const financialTx = await db.transactions.where({ referenceId: invoiceId, category: 'purchase' }).first();
      if (financialTx) {
        await db.transactions.add({
          transactionNumber: txnId(), type: 'income', category: 'purchase', amount: financialTx.amount,
          description: `عكس القيد القديم - تحديث فاتورة شراء رقم ${updatedInvoice.orderNumber}`, referenceId: invoiceId, date: Date.now()
        });
        await db.transactions.add({
          transactionNumber: txnId(), type: 'expense', category: 'purchase', amount: updatedInvoice.totalAmount,
          description: `القيد الجديد - تحديث فاتورة شراء رقم ${updatedInvoice.orderNumber}`, referenceId: invoiceId, date: Date.now()
        });
      }
      await db.purchaseOrders.update(invoiceId, {
        orderNumber: updatedInvoice.orderNumber, supplierId: updatedInvoice.supplierId, items: updatedInvoice.items,
        totalAmount: updatedInvoice.totalAmount, subtotal: updatedInvoice.subtotal, taxAmount: updatedInvoice.taxAmount,
        status: updatedInvoice.status, paymentStatus: updatedInvoice.paymentStatus, paymentMethod: updatedInvoice.paymentMethod,
        paidAmount: updatedInvoice.paidAmount, date: updatedInvoice.date
      });
      await db.activityLogs.add({
        userId, username: userId.toString(), action: 'تعديل فاتورة مورد', entity: 'SupplierInvoice',
        entityId: invoiceId, details: `تعديل فاتورة شراء رقم ${updatedInvoice.orderNumber} (القيمة الجديدة: ${updatedInvoice.totalAmount})`, timestamp: Date.now()
      });
      return true;
    });
  },

  async processPurchaseOrder(orderId: number, userId: number | string) {
    return db.transaction('rw', [db.items, db.inventoryTransactions, db.purchaseOrders, db.transactions], async () => {
      const order = await db.purchaseOrders.get(orderId);
      if (!order) throw new Error('الطلب غير موجود');
      if (order.status === 'received' || order.status === 'cancelled') throw new Error('لا يمكن معالجة هذا الطلب في حالته الحالية');
      for (const item of order.items) {
        await this.updateQuantity(item.itemId, item.quantity, 'increase', 'فاتورة توريد', userId, `Purchase-${order.orderNumber}`);
      }
      await db.transactions.add({
        transactionNumber: txnId(), type: 'expense', category: 'purchase', amount: order.totalAmount,
        description: `شراء بضاعة - فاتورة توريد رقم ${order.orderNumber}`, referenceId: order.id, date: Date.now()
      });
      await db.purchaseOrders.update(orderId, { status: 'received' });
    });
  },

  async transferToRep(repId: number, items: { itemId: number; quantity: number; sellingPrice?: number }[], userId: number | string, transferNumber: string, requestId?: number) {
    return db.transaction('rw', [db.items, db.inventoryTransactions, db.repInventory, db.stockTransfers, db.notifications, db.stockRequests], async () => {
      if (requestId) {
        const request = await db.stockRequests.get(requestId);
        if (!request || request.status !== 'pending') throw new Error('هذا الطلب تم معالجته مسبقاً أو غير موجود');
        await db.stockRequests.update(requestId, { status: 'approved' });
      }
      for (const tItem of items) {
        await this.updateQuantity(tItem.itemId, tItem.quantity, 'decrease', 'تحويل مخزني لمندوب', userId, transferNumber);
        const existingRepInv = await db.repInventory.where({ repId, itemId: tItem.itemId }).first();
        if (existingRepInv) {
          await db.repInventory.update(existingRepInv.id!, { quantity: existingRepInv.quantity + tItem.quantity, updatedAt: Date.now() });
        } else {
          await db.repInventory.add({ repId, itemId: tItem.itemId, quantity: tItem.quantity, updatedAt: Date.now() });
        }
      }
      await db.stockTransfers.add({
        transferNumber, fromType: 'warehouse', fromId: 1, toType: 'rep', toId: repId,
        items, status: 'completed', date: Date.now()
      });
    });
  }
};

export const paymentService = {
  async confirmCollection(collectionId: number, userId: number | string) {
    return db.transaction('rw', [db.paymentCollections, db.salesOrders, db.transactions, db.notifications, db.salesReps, db.activityLogs], async () => {
      const collection = await db.paymentCollections.get(collectionId);
      if (!collection) throw new Error('طلب التحصيل غير موجود');
      if (collection.status !== 'pending') throw new Error('تمت معالجة الطلب مسبقاً');
      await db.paymentCollections.update(collectionId, { status: 'confirmed', confirmedDate: Date.now() });
      await db.transactions.add({
        transactionNumber: txnId(), type: 'income', category: 'sale', amount: collection.amount,
        description: `تحصيل من مندوب - طلب رقم ${collectionId}`, referenceId: collection.id, date: Date.now()
      });
      if (collection.type !== 'rep_settlement' && collection.customerId) {
        let remainingAmount = collection.amount;
        const unpaidOrders1 = await db.salesOrders.where('[customerId+paymentStatus]').equals([collection.customerId, 'unpaid']).filter(o => o.status !== 'cancelled').toArray();
        const unpaidOrders2 = await db.salesOrders.where('[customerId+paymentStatus]').equals([collection.customerId, 'partial']).filter(o => o.status !== 'cancelled').toArray();
        const unpaidOrders = [...unpaidOrders1, ...unpaidOrders2].sort((a, b) => a.date - b.date);
        for (const order of unpaidOrders) {
          if (remainingAmount <= 0) break;
          const balance = order.totalAmount - order.paidAmount;
          if (balance <= 0) continue;
          const payment = Math.min(remainingAmount, balance);
          const newPaidAmount = order.paidAmount + payment;
          const newStatus = newPaidAmount >= order.totalAmount ? 'paid' : 'partial';
          await db.salesOrders.update(order.id!, { paidAmount: newPaidAmount, paymentStatus: newStatus });
          remainingAmount -= payment;
        }
      } else if (collection.type === 'rep_settlement') {
        // Settle EXACT amount FIFO — never settle all orders blindly
        let remaining = collection.amount;
        const unsettledOrders = await db.salesOrders
          .where('repId').equals(collection.repId)
          .filter(o => o.paidAmount > 0 && o.status !== 'cancelled' && o.status !== 'pending')
          .toArray();
        unsettledOrders.sort((a, b) => a.date - b.date); // FIFO by date
        for (const order of unsettledOrders) {
          if (remaining <= 0) break;
          const unsettled = (order.paidAmount || 0) - (order.settledAmount || 0);
          if (unsettled <= 0) continue;
          const applyAmount = Math.min(remaining, unsettled);
          const newSettled = (order.settledAmount || 0) + applyAmount;
          const fullySettled = newSettled >= (order.paidAmount || 0);
          await db.salesOrders.update(order.id!, {
            settledAmount: newSettled,
            isSettledWithWarehouse: fullySettled
          });
          remaining -= applyAmount;
        }
        if (remaining > 0) {
          // Amount exceeds unsettled orders — log warning but don't fail
          await db.activityLogs.add({
            userId, username: userId.toString(), action: 'تحذير تسوية',
            entity: 'PaymentCollection', entityId: collectionId,
            details: `مبلغ التسوية (${collection.amount}) يتجاوز المديونية غير المسوّاة لدي المندوب. المتبقي غير المسوى: ${remaining} ج.م`,
            timestamp: Date.now()
          });
        }
      }
      if (collection.repId) {
        const rep = await db.salesReps.get(collection.repId);
        if (rep) {
          const newBalance = (rep.balance || 0) - collection.amount;
          await db.salesReps.update(collection.repId, { balance: Math.max(0, newBalance) });
        }
      }
      await db.notifications.add({
        title: 'تم تأكيد التحصيل', message: `تم تأكيد استلام مبلغ ${collection.amount} ج.م بنجاح`,
        type: 'success', read: false, date: Date.now()
      });
      await db.activityLogs.add({
        userId, username: userId.toString(), action: 'تأكيد تحصيل',
        entity: 'PaymentCollection', entityId: collectionId,
        details: `تم تأكيد تحصيل ${collection.amount} ج.م ${collection.type === 'rep_settlement' ? '(تسوية عهدة مندوب)' : '(تحصيل من عميل)'}`,
        timestamp: Date.now()
      });
      return true;
    });
  }
};
