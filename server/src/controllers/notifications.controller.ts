import { Request, Response, NextFunction } from 'express';
import { notificationsService } from '../services/notifications.service.js';

export const notificationsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 50;
      const notifications = await notificationsService.list(limit);
      res.json({ success: true, data: notifications });
    } catch (err) { next(err); }
  },

  async getUnread(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await notificationsService.getUnread();
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationsService.markRead(Number(req.params.id));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationsService.markAllRead();
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationsService.remove(Number(req.params.id));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationsService.create(req.body);
      res.status(201).json({ success: true, data: notification });
    } catch (err) { next(err); }
  },
};
