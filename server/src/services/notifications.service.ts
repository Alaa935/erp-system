import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export const notificationsService = {
  async list(limit = 50) {
    const notifications = await prisma.notification.findMany({
      orderBy: { date: 'desc' },
      take: limit,
    });
    return notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      date: n.date,
    }));
  },

  async getUnread() {
    const notifications = await prisma.notification.findMany({
      where: { read: false },
      orderBy: { date: 'desc' },
    });
    return {
      notifications: notifications.map(n => ({ id: n.id, title: n.title, message: n.message, type: n.type, read: n.read, date: n.date })),
      unreadCount: notifications.length,
    };
  },

  async markRead(id: number) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new AppError(404, 'Notification not found');
    return prisma.notification.update({ where: { id }, data: { read: true } });
  },

  async markAllRead() {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    return { success: true };
  },

  async remove(id: number) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new AppError(404, 'Notification not found');
    await prisma.notification.delete({ where: { id } });
    return { success: true };
  },

  async create(data: { title: string; message: string; type: string; userId?: number }) {
    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type as any,
        userId: data.userId ?? null,
        read: false,
        date: new Date(),
      },
    });
    return { id: notification.id, title: notification.title, message: notification.message, type: notification.type, read: notification.read, date: notification.date };
  },
};
