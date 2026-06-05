import { Request, Response, NextFunction } from 'express';
import { repInventoryService } from '../services/repInventory.service.js';

export const repInventoryController = {
  async listByRepId(req: Request, res: Response, next: NextFunction) {
    try {
      const repId = Number(req.query.repId);
      if (!repId) {
        res.status(400).json({ success: false, error: 'repId query parameter is required' });
        return;
      }
      const items = await repInventoryService.listByRepId(repId);
      res.json({ success: true, items });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { quantity } = req.body;
      if (quantity === undefined || quantity === null) {
        res.status(400).json({ success: false, error: 'quantity is required' });
        return;
      }
      const result = await repInventoryService.updateQuantity(id, Number(quantity));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
