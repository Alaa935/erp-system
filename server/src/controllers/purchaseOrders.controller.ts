import { Request, Response, NextFunction } from 'express';
import { purchaseOrdersService } from '../services/purchaseOrders.service.js';

export const purchaseOrdersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchaseOrdersService.listPurchaseOrders(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await purchaseOrdersService.getPurchaseOrder(Number(req.params.id));
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await purchaseOrdersService.createPurchaseOrder(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await purchaseOrdersService.updatePurchaseOrder(Number(req.params.id), req.body);
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await purchaseOrdersService.softDelete(Number(req.params.id), reason || 'Manual deletion', req.user!.userId, req.user!.username);
      res.json({ success: true, message: 'Purchase order deleted' });
    } catch (err) { next(err); }
  },
};
