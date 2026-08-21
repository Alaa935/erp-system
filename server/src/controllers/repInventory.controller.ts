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
      console.log('[REP INVENTORY BODY]', JSON.stringify(req.body));
      console.log('[REP INVENTORY PARAMS]', JSON.stringify(req.params));
      const id = Number(req.params.id);
      const { quantity } = req.body;
      if (quantity === undefined || quantity === null) {
        res.status(400).json({ success: false, error: 'quantity is required' });
        return;
      }
      const result = await repInventoryService.updateQuantity(id, Number(quantity));
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('[REP INVENTORY ERROR]', err);
      console.error('[REP INVENTORY ERROR CODE]', err.code ?? 'no code');
      console.error('[REP INVENTORY ERROR META]', JSON.stringify(err.meta ?? {}));
      console.error('[REP INVENTORY ERROR MESSAGE]', err.message ?? 'no message');
      console.error('[REP INVENTORY ERROR STACK]', err instanceof Error ? err.stack : 'no stack');
      next(err);
    }
  },
};
