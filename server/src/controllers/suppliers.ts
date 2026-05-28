import { Request, Response, NextFunction } from 'express';
import { suppliersService } from '../services/suppliers.service.js';

export const suppliersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await suppliersService.listSuppliers(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await suppliersService.getSupplier(Number(req.params.id));
      res.json({ success: true, data: supplier });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await suppliersService.createSupplier(req.body);
      res.status(201).json({ success: true, data: supplier });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await suppliersService.updateSupplier(Number(req.params.id), req.body);
      res.json({ success: true, data: supplier });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await suppliersService.softDelete(
        Number(req.params.id),
        reason || 'Manual deletion',
        req.user!.userId,
        req.user!.username
      );
      res.json({ success: true, message: 'Supplier deleted' });
    } catch (err) { next(err); }
  },
};
