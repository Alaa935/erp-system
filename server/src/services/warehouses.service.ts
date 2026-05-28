import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

export const warehousesService = {
  async listWarehouses() {
    const [warehouses, allLocations] = await Promise.all([
      prisma.warehouse.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      }),
      prisma.item.findMany({
        where: { deletedAt: null },
        select: { location: true },
      }),
    ]);

    const itemCountByLocation: Record<string, number> = {};
    for (const item of allLocations) {
      const loc = item.location || '';
      itemCountByLocation[loc] = (itemCountByLocation[loc] || 0) + 1;
    }

    return warehouses.map(w => {
      let itemCount = 0;
      for (const [loc, count] of Object.entries(itemCountByLocation)) {
        if (loc.includes(w.name)) {
          itemCount += count;
        }
      }
      return {
        id: w.id,
        name: w.name,
        location: w.location,
        capacity: toNumber(w.capacity),
        manager: w.manager,
        itemCount,
        deletedAt: w.deletedAt?.getTime() ?? null,
        deleteReason: w.deleteReason,
      };
    });
  },

  async getWarehouse(id: number) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new AppError(404, 'Warehouse not found');
    if (warehouse.deletedAt) throw new AppError(404, 'Warehouse not found');
    return {
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
      capacity: toNumber(warehouse.capacity),
      manager: warehouse.manager,
      deletedAt: null,
      deleteReason: warehouse.deleteReason,
    };
  },

  async createWarehouse(data: { name: string; location: string; capacity: number; manager: string }) {
    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        location: data.location ?? '',
        capacity: new Decimal(data.capacity ?? 1000),
        manager: data.manager ?? '',
      },
    });
    return {
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
      capacity: toNumber(warehouse.capacity),
      manager: warehouse.manager,
      deletedAt: warehouse.deletedAt?.getTime() ?? null,
      deleteReason: warehouse.deleteReason,
    };
  },

  async updateWarehouse(id: number, data: { name?: string; location?: string; capacity?: number; manager?: string }) {
    const existing = await prisma.warehouse.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new AppError(404, 'Warehouse not found');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.capacity !== undefined) updateData.capacity = new Decimal(data.capacity);
    if (data.manager !== undefined) updateData.manager = data.manager;

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: updateData,
    });
    return {
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
      capacity: toNumber(warehouse.capacity),
      manager: warehouse.manager,
      deletedAt: warehouse.deletedAt?.getTime() ?? null,
      deleteReason: warehouse.deleteReason,
    };
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new AppError(404, 'Warehouse not found');

    await prisma.$transaction([
      prisma.warehouse.update({
        where: { id },
        data: { deletedAt: new Date(), deleteReason: reason },
      }),
      prisma.activityLog.create({
        data: {
          action: `حذف مخزن: ${warehouse.name}`,
          userId,
          username,
          entity: 'Warehouse',
          entityId: String(id),
          details: `سبب الحذف: ${reason}`,
          timestamp: new Date(),
        },
      }),
      prisma.notification.create({
        data: {
          title: 'حذف مستودع',
          message: `تم حذف المستودع (${warehouse.name}) من النظام بنجاح`,
          type: 'error',
          read: false,
          date: new Date(),
        },
      }),
    ]);
    return { success: true };
  },
};
