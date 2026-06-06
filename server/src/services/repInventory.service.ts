import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';

export const repInventoryService = {
  async listByRepId(repId: number) {
    const rep = await prisma.salesRep.findUnique({ where: { id: repId } });
    if (!rep || rep.deletedAt) throw new AppError(404, 'Sales rep not found');

    const items = await prisma.repInventory.findMany({
      where: { repId },
      include: {
        item: {
          select: { id: true, name: true, sku: true, sellingPrice: true, purchasePrice: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return items.map(i => ({
      id: i.id,
      repId: i.repId,
      itemId: i.itemId,
      quantity: Number(i.quantity),
      itemName: i.item.name,
      itemSku: i.item.sku,
      sellingPrice: Number(i.item.sellingPrice),
      purchasePrice: Number(i.item.purchasePrice),
      updatedAt: i.updatedAt,
    }));
  },

  async updateQuantity(id: number, quantity: number) {
    console.log('[REP INVENTORY STEP] findUnique id=' + id);
    const entry = await prisma.repInventory.findUnique({ where: { id } });
    console.log('[REP INVENTORY STEP] findUnique done entry=' + (entry ? entry.id : 'null'));
    if (!entry) throw new AppError(404, 'Rep inventory entry not found');
    console.log('[REP INVENTORY STEP] check quantity=' + quantity + ' entry.quantity=' + entry.quantity);
    if (quantity < 0) throw new AppError(400, 'Quantity cannot be negative');

    console.log('[REP INVENTORY STEP] calling update id=' + id);
    try {
      const result = await prisma.repInventory.update({
        where: { id },
        data: { quantity: new Decimal(quantity) },
      });
      console.log('[REP INVENTORY STEP] update success id=' + result.id);
      return result;
    } catch (err: any) {
      console.error('[REP INVENTORY UPDATE ERROR]', err);
      console.error('[REP INVENTORY UPDATE ERROR CODE]', err.code ?? 'no code');
      console.error('[REP INVENTORY UPDATE ERROR META]', JSON.stringify(err.meta ?? {}));
      console.error('[REP INVENTORY UPDATE ERROR MESSAGE]', err.message ?? 'no message');
      const errorObj = { ...err, message: (err as any).message, stack: (err as any).stack };
      console.error('[REP INVENTORY UPDATE ERROR JSON]', JSON.stringify(errorObj, null, 2));
      throw err;
    }
  },
};
