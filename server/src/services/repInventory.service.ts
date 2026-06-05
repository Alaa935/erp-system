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
    const entry = await prisma.repInventory.findUnique({ where: { id } });
    if (!entry) throw new AppError(404, 'Rep inventory entry not found');
    if (quantity < 0) throw new AppError(400, 'Quantity cannot be negative');

    return prisma.repInventory.update({
      where: { id },
      data: { quantity: new Decimal(quantity) },
    });
  },
};
