import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.js';

export const inventoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.listItems(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.getItem(Number(req.params.id));
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.createItem(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.updateItem(Number(req.params.id), req.body);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await inventoryService.softDelete(Number(req.params.id), reason || 'Manual deletion');
      res.json({ success: true, message: 'Item deleted' });
    } catch (err) { next(err); }
  },

  async adjustQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const { diff, type, reason, source } = req.body;
      const result = await inventoryService.adjustQuantity(
        Number(req.params.id), diff, type, reason, req.user!.userId, source
      );
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async lowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const minStockLevel = Number(req.query.minStockLevel) || 10;
      const items = await inventoryService.getLowStock(minStockLevel);
      res.json({ success: true, data: items });
    } catch (err) { next(err); }
  },
};
