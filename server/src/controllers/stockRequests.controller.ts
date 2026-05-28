import { Request, Response, NextFunction } from 'express';
import { stockRequestsService } from '../services/stockRequests.service.js';

export const stockRequestsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await stockRequestsService.listStockRequests(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await stockRequestsService.getStockRequest(Number(req.params.id));
      res.json({ success: true, data: request });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await stockRequestsService.createStockRequest(req.body);
      res.status(201).json({ success: true, data: request });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await stockRequestsService.updateStockRequest(Number(req.params.id), req.body);
      res.json({ success: true, data: request });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await stockRequestsService.softDelete(
        Number(req.params.id),
        reason || 'Manual deletion',
        req.user!.userId,
        req.user!.username
      );
      res.json({ success: true, message: 'Stock request deleted' });
    } catch (err) { next(err); }
  },
};