import { Request, Response, NextFunction } from 'express';
import { warehousesService } from '../services/warehouses.service.js';

export const warehousesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouses = await warehousesService.listWarehouses();
      res.json({ success: true, data: warehouses });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await warehousesService.getWarehouse(Number(req.params.id));
      res.json({ success: true, data: warehouse });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await warehousesService.createWarehouse(req.body);
      res.status(201).json({ success: true, data: warehouse });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await warehousesService.updateWarehouse(Number(req.params.id), req.body);
      res.json({ success: true, data: warehouse });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await warehousesService.softDelete(
        Number(req.params.id),
        reason || 'Manual deletion',
        req.user!.userId,
        req.user!.username
      );
      res.json({ success: true, message: 'Warehouse deleted' });
    } catch (err) { next(err); }
  },
};
