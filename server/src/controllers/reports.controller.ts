import { Request, Response, NextFunction } from 'express';
import { reportsService } from '../services/reports.service.js';

export const reportsController = {
  async financialSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const data = await reportsService.financialSummary(startDate, endDate);
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },

  async profitLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const data = await reportsService.profitLoss(startDate, endDate);
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },

  async salesDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const data = await reportsService.salesDetails(startDate, endDate);
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },

  async purchaseDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const data = await reportsService.purchaseDetails(startDate, endDate);
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },

  async inventoryDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.inventoryDetails();
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },

  async customerBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.customerBalances();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async supplierBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.supplierBalances();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async taxReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const data = await reportsService.taxReport(startDate, endDate);
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },

  async cashflow(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const data = await reportsService.cashflow(startDate, endDate);
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },

  async activityLog(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 50;
      const data = await reportsService.activityLog(limit);
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  },
};
