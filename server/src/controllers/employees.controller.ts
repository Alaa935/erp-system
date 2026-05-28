import { Request, Response, NextFunction } from 'express';
import { employeesService } from '../services/employees.service.js';

export const employeesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeesService.listEmployees(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeesService.getEmployee(Number(req.params.id));
      res.json({ success: true, data: employee });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeesService.createEmployee(req.body);
      res.status(201).json({ success: true, data: employee });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeesService.updateEmployee(Number(req.params.id), req.body);
      res.json({ success: true, data: employee });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await employeesService.softDelete(
        Number(req.params.id),
        reason || 'Manual deletion',
        req.user!.userId,
        req.user!.username
      );
      res.json({ success: true, message: 'Employee deleted' });
    } catch (err) { next(err); }
  },
};
