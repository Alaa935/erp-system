import { Request, Response, NextFunction } from 'express';
import { stockTransfersService } from '../services/stockTransfers.service.js';

export const stockTransfersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await stockTransfersService.listStockTransfers(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await stockTransfersService.getStockTransfer(Number(req.params.id));
      res.json({ success: true, data: transfer });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await stockTransfersService.createStockTransfer(req.body);
      res.status(201).json({ success: true, data: transfer });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await stockTransfersService.updateStockTransfer(Number(req.params.id), req.body);
      res.json({ success: true, data: transfer });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await stockTransfersService.softDelete(
        Number(req.params.id),
        reason || 'Manual deletion',
        req.user!.userId,
        req.user!.username
      );
      res.json({ success: true, message: 'Stock transfer deleted' });
    } catch (err) { next(err); }
  },
};