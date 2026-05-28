import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

export const inventoryService = {
  async listItems(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    supplierId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 10, search, category, supplierId, sortBy, sortOrder } = params;
    const where: Prisma.ItemWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (supplierId) where.supplierId = supplierId;

    const orderBy: Prisma.ItemOrderByWithRelationInput = {};
    if (sortBy === 'name') orderBy.name = sortOrder;
    else if (sortBy === 'sku') orderBy.sku = sortOrder;
    else if (sortBy === 'quantity') orderBy.quantity = sortOrder;
    else if (sortBy === 'sellingPrice') orderBy.sellingPrice = sortOrder;
    else if (sortBy === 'purchasePrice') orderBy.purchasePrice = sortOrder;
    else if (sortBy === 'category') orderBy.category = sortOrder;
    else orderBy.updatedAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { supplier: { select: { id: true, name: true } } },
      }),
      prisma.item.count({ where }),
    ]);

    return {
      items: items.map(i => ({
        ...i,
        purchasePrice: Number(i.purchasePrice),
        sellingPrice: Number(i.sellingPrice),
        quantity: Number(i.quantity),
        minQuantity: Number(i.minQuantity),
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async getItem(id: number) {
    const item = await prisma.item.findUnique({ where: { id }, include: { supplier: true } });
    if (!item || item.deletedAt) throw new AppError(404, 'Item not found');
    return item;
  },

  async createItem(data: {
    sku: string;
    name: string;
    category: string;
    purchasePrice: number;
    sellingPrice: number;
    quantity?: number;
    minQuantity?: number;
    location?: string;
    expiryDate?: string | null;
    supplierId?: number | null;
  }) {
    const existing = await prisma.item.findUnique({ where: { sku: data.sku } });
    if (existing) throw new AppError(409, 'Item with this SKU already exists');

    const item = await prisma.item.create({
      data: {
        sku: data.sku,
        name: data.name,
        category: data.category,
        purchasePrice: new Decimal(data.purchasePrice),
        sellingPrice: new Decimal(data.sellingPrice),
        quantity: new Decimal(data.quantity ?? 0),
        minQuantity: new Decimal(data.minQuantity ?? 5),
        location: data.location ?? '',
        expiryDate: data.expiryDate ?? undefined,
        supplierId: data.supplierId ?? undefined,
      },
      include: { supplier: { select: { id: true, name: true } } },
    });
    return item;
  },

  async updateItem(id: number, data: Partial<{
    name: string;
    category: string;
    purchasePrice: number;
    sellingPrice: number;
    quantity: number;
    minQuantity: number;
    location: string;
    expiryDate: string | null;
    supplierId: number | null;
    deletedAt: string | null;
    deleteReason: string | null;
  }>) {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new AppError(404, 'Item not found');

    const updateData: Prisma.ItemUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.purchasePrice !== undefined) updateData.purchasePrice = new Decimal(data.purchasePrice);
    if (data.sellingPrice !== undefined) updateData.sellingPrice = new Decimal(data.sellingPrice);
    if (data.quantity !== undefined) updateData.quantity = new Decimal(data.quantity);
    if (data.minQuantity !== undefined) updateData.minQuantity = new Decimal(data.minQuantity);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;
    if (data.supplierId !== undefined) (updateData as any).supplierId = data.supplierId;
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;
    if (data.deleteReason !== undefined) updateData.deleteReason = data.deleteReason;

    return prisma.item.update({ where: { id }, data: updateData, include: { supplier: { select: { id: true, name: true } } } });
  },

  async softDelete(id: number, reason: string) {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) throw new AppError(404, 'Item not found');
    return prisma.item.update({
      where: { id },
      data: { deletedAt: new Date(), deleteReason: reason },
    });
  },

  async getLowStock(minStockLevel: number = 10) {
    const items = await prisma.item.findMany({
      where: {
        deletedAt: null,
        quantity: { lte: new Decimal(minStockLevel) },
      },
      orderBy: { quantity: 'asc' },
    });
    return items.map(i => ({ ...i, quantity: Number(i.quantity), minQuantity: Number(i.minQuantity) }));
  },

  async adjustQuantity(id: number, diff: number, type: 'increase' | 'decrease', reason: string, userId: number, source?: string) {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) throw new AppError(404, 'Item not found');
    if (diff <= 0) throw new AppError(400, 'Difference must be greater than zero');

    const oldQty = Number(item.quantity);
    const newQty = type === 'increase' ? oldQty + diff : oldQty - diff;
    if (newQty < 0) throw new AppError(400, `Insufficient quantity. Available: ${oldQty}`);

    const [updated] = await prisma.$transaction([
      prisma.item.update({ where: { id }, data: { quantity: new Decimal(newQty) } }),
      prisma.inventoryTransaction.create({
        data: {
          itemId: id,
          type,
          oldQuantity: new Decimal(oldQty),
          newQuantity: new Decimal(newQty),
          diff: new Decimal(diff),
          reason,
          source: source ?? null,
          userId,
        },
      }),
    ]);

    return { ...updated, quantity: Number(updated.quantity) };
  },
};
