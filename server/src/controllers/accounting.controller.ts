import { Request, Response, NextFunction } from 'express';
import { accountingService } from '../services/accounting.service.js';

export const accountingController = {
  async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.financialOverview();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async updateCapital(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.updateCapital(req.body.amount);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.createTransaction(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getPaymentHistory(Number(req.params.referenceId), req.query.category as string);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async confirmCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.confirmCollection(Number(req.params.id), req.user!.username);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async createPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.createPayroll(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },

  async confirmSalaryPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.confirmSalaryPayroll(Number(req.params.id));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async updatePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.updatePayroll(Number(req.params.id), req.body);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async createVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.createVehicle(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },

  async addVehicleExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.addVehicleExpense(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },
};
