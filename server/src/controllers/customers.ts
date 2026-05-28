import { Request, Response, NextFunction } from 'express';
import { customersService } from '../services/customers.service.js';

export const customersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customersService.listCustomers(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.getCustomer(Number(req.params.id));
      res.json({ success: true, data: customer });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.createCustomer(req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.updateCustomer(Number(req.params.id), req.body);
      res.json({ success: true, data: customer });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await customersService.softDelete(
        Number(req.params.id),
        reason || 'Manual deletion',
        req.user!.userId,
        req.user!.username
      );
      res.json({ success: true, message: 'Customer deleted' });
    } catch (err) { next(err); }
  },
};
