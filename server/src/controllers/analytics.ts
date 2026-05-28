import { Request, Response, NextFunction } from 'express';
import { financialAnalyticsService } from '../services/financialAnalytics.service.js';

export const analyticsController = {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financialAnalyticsService.getSummary(req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getSalesDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financialAnalyticsService.getSalesDetails(req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getExpensesDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financialAnalyticsService.getExpensesDetails(req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getProfitDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financialAnalyticsService.getProfitDetails(req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getInventoryAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financialAnalyticsService.getInventoryAnalytics(req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getCustomerAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financialAnalyticsService.getCustomerAnalytics(req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getSupplierAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financialAnalyticsService.getSupplierAnalytics(req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },
};
