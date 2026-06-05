import { Request, Response, NextFunction } from 'express';
import { salesOrdersService } from '../services/salesOrders.service.js';

export const salesOrdersController = {
  async getUnsettled(req: Request, res: Response, next: NextFunction) {
    try {
      const repId = Number(req.query.repId);
      if (!repId) return res.status(400).json({ success: false, error: 'repId is required' });
      const result = await salesOrdersService.getUnsettledByRep(repId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await salesOrdersService.listOrders(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await salesOrdersService.getOrder(Number(req.params.id));
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await salesOrdersService.createOrder(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err) { next(err); }
  },

  async dispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await salesOrdersService.dispatchOrder(Number(req.params.id), req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await salesOrdersService.cancelOrder(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const result = await salesOrdersService.softDelete(
        Number(req.params.id),
        reason || 'Manual deletion',
        req.user!.userId,
        req.user!.username || 'admin'
      );
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, method } = req.body;
      const result = await salesOrdersService.recordPayment(
        Number(req.params.id),
        amount,
        method,
        req.user!.userId
      );
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async listTaxes(req: Request, res: Response, next: NextFunction) {
    try {
      const taxes = await salesOrdersService.listActiveTaxes();
      res.json({ success: true, data: taxes });
    } catch (err) { next(err); }
  },
};
