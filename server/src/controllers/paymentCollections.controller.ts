import { Request, Response, NextFunction } from 'express';
import { paymentCollectionsService } from '../services/paymentCollections.service.js';

export const paymentCollectionsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentCollectionsService.list(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getPendingSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      const repId = Number(req.query.repId);
      if (!repId) {
        res.status(400).json({ success: false, error: 'repId is required' });
        return;
      }
      const result = await paymentCollectionsService.getPendingSettlement(repId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentCollectionsService.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentCollectionsService.update(Number(req.params.id), req.body);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
