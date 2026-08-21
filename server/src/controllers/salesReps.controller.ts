import { Request, Response, NextFunction } from 'express';
import { salesRepsService } from '../services/salesReps.service.js';

export const salesRepsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await salesRepsService.listSalesReps(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const salesRep = await salesRepsService.getSalesRep(Number(req.params.id));
      res.json({ success: true, data: salesRep });
    } catch (err) { next(err); }
  },

  async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const salesRep = await salesRepsService.getSalesRep(Number(req.params.id));
      res.json({ success: true, items: salesRep.repInventories || [] });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const salesRep = await salesRepsService.createSalesRep(req.body);
      res.status(201).json({ success: true, data: salesRep });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const salesRep = await salesRepsService.updateSalesRep(Number(req.params.id), req.body);
      res.json({ success: true, data: salesRep });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await salesRepsService.softDelete(
        Number(req.params.id),
        reason || 'Manual deletion',
        req.user!.userId,
        req.user!.username
      );
      res.json({ success: true, message: 'Sales rep deleted' });
    } catch (err) { next(err); }
  },
};
