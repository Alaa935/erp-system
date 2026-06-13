import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

export const stockTransfersService = {
  async listStockTransfers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 10, search, status, sortBy, sortOrder } = params;
    const where: Prisma.StockTransferWhereInput = { deletedAt: null };

    if (search) {
      where.transferNumber = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      where.status = status as any;
    }

    const orderBy: Prisma.StockTransferOrderByWithRelationInput = {};
    if (sortBy === 'transferNumber') orderBy.transferNumber = sortOrder;
    else if (sortBy === 'date') orderBy.date = sortOrder;
    else if (sortBy === 'status') orderBy.status = sortOrder;
    else orderBy.date = 'desc';

    const [items, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: { include: { item: true } } },
      }),
      prisma.stockTransfer.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async getStockTransfer(id: number) {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: { include: { item: true } } },
    });
    if (!transfer || transfer.deletedAt) throw new AppError(404, 'Stock transfer not found');
    return transfer;
  },

  async createStockTransfer(data: {
    transferNumber?: string;
    fromType: string;
    fromId: number;
    toType: string;
    toId: number;
    items: { itemId: number; quantity: number }[];
    status?: string;
    date?: string;
  }) {
    const transferNumber = data.transferNumber || 'ST-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    try {
      return prisma.$transaction(async (tx) => {
        const transfer = await tx.stockTransfer.create({
          data: {
            transferNumber,
            fromType: data.fromType,
            fromId: data.fromId,
            toType: data.toType,
            toId: data.toId,
            status: (data.status as any) || 'pending',
            date: data.date ? new Date(data.date) : undefined,
            items: {
              create: data.items.map((item) => ({
                itemId: item.itemId,
                quantity: new Decimal(item.quantity),
              })),
            },
          },
          include: { items: { include: { item: true } } },
        });
        return transfer;
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new AppError(409, 'رقم التحويل مكرر، يرجى المحاولة مرة أخرى');
      }
      throw err;
    }
  },

  async updateStockTransfer(
    id: number,
    data: Partial<{
      transferNumber: string;
      fromType: string;
      fromId: number;
      toType: string;
      toId: number;
      items: { itemId: number; quantity: number }[];
      status: string;
      date: string;
    }>
  ) {
    const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer || transfer.deletedAt) throw new AppError(404, 'Stock transfer not found');

    return prisma.$transaction(async (tx) => {
      const updateData: Prisma.StockTransferUpdateInput = {};
      if (data.transferNumber !== undefined) updateData.transferNumber = data.transferNumber;
      if (data.fromType !== undefined) updateData.fromType = data.fromType;
      if (data.fromId !== undefined) updateData.fromId = data.fromId;
      if (data.toType !== undefined) updateData.toType = data.toType;
      if (data.toId !== undefined) updateData.toId = data.toId;
      if (data.status !== undefined) updateData.status = data.status as any;
      if (data.date !== undefined) updateData.date = new Date(data.date);

      if (data.items) {
        await tx.stockTransferItem.deleteMany({ where: { transferId: id } });
        updateData.items = {
          create: data.items.map((item) => ({
            itemId: item.itemId,
            quantity: new Decimal(item.quantity),
          })),
        };
      }

      return tx.stockTransfer.update({
        where: { id },
        data: updateData,
        include: { items: { include: { item: true } } },
      });
    });
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!transfer || transfer.deletedAt) throw new AppError(404, 'Stock transfer not found');

    const [deleted] = await prisma.$transaction([
      prisma.stockTransfer.update({
        where: { id },
        data: { deletedAt: new Date(), deleteReason: reason },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          username,
          action: '\u062D\u0630\u0641 \u062A\u062D\u0648\u064A\u0644 \u0645\u062E\u0632\u0646\u064A: ' + transfer.transferNumber,
          entity: 'StockTransfer',
          entityId: String(id),
          details: '\u0633\u0628\u0628 \u0627\u0644\u062D\u0630\u0641: ' + reason,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          title: '\u062D\u0630\u0641 \u062A\u062D\u0648\u064A\u0644 \u0645\u062E\u0632\u0646\u064A',
          message: '\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0645\u062E\u0632\u0646\u064A (' + transfer.transferNumber + ') \u0645\u0646 \u0627\u0644\u0646\u0638\u0627\u0645 \u0628\u0646\u062C\u0627\u062D',
          type: 'error',
        },
      }),
    ]);

    return deleted;
  },
};
