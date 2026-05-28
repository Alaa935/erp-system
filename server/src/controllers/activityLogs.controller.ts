import { Request, Response, NextFunction } from 'express';
import { activityLogsService } from '../services/activityLogs.service.js';

export const activityLogsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await activityLogsService.list(req.query as any);
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await activityLogsService.getById(Number(req.params.id));
      if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
      res.json({ success: true, data: log });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await activityLogsService.create({
        userId: req.body.userId,
        username: req.body.username,
        action: req.body.action,
        entity: req.body.entity,
        entityId: req.body.entityId,
        details: req.body.details,
      });
      res.status(201).json({ success: true, data: log });
    } catch (err) { next(err); }
  },

  async getByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await activityLogsService.getByUser(Number(req.params.userId), req.query as any);
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },

  async getByEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await activityLogsService.getByEntity(req.params.entityType, Number(req.params.entityId), req.query as any);
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },
};
