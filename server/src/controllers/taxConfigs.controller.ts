import { Request, Response, NextFunction } from 'express';
import { taxConfigsService } from '../services/taxConfigs.service.js';

export const taxConfigsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taxConfigsService.listTaxConfigs(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const taxConfig = await taxConfigsService.getTaxConfig(Number(req.params.id));
      res.json({ success: true, data: taxConfig });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const taxConfig = await taxConfigsService.createTaxConfig(req.body);
      res.status(201).json({ success: true, data: taxConfig });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const taxConfig = await taxConfigsService.updateTaxConfig(Number(req.params.id), req.body);
      res.json({ success: true, data: taxConfig });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await taxConfigsService.softDelete(
        Number(req.params.id),
        reason || 'Manual deletion',
        req.user!.userId,
        req.user!.username
      );
      res.json({ success: true, message: 'Tax config deleted' });
    } catch (err) { next(err); }
  },
};
