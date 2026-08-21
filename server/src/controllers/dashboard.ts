import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service.js';

export const dashboardController = {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const repId = req.query.repId ? Number(req.query.repId) : undefined;
      const data = await dashboardService.getSummary(repId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getKPIs(req: Request, res: Response, next: NextFunction) {
    try {
      const repId = req.query.repId ? Number(req.query.repId) : undefined;
      const data = await dashboardService.getSummary(repId);
      const { salesTrend, customerTrend, lowStockItems, ...kpis } = data;
      res.json({ success: true, data: kpis });
    } catch (err) { next(err); }
  },

  async getCharts(req: Request, res: Response, next: NextFunction) {
    try {
      const repId = req.query.repId ? Number(req.query.repId) : undefined;
      const data = await dashboardService.getCharts(repId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getAlerts();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getTopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const repId = req.query.repId ? Number(req.query.repId) : undefined;
      const data = await dashboardService.getTopProducts(repId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getTopCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const repId = req.query.repId ? Number(req.query.repId) : undefined;
      const data = await dashboardService.getTopCustomers(repId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getLowStock();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 10;
      const userId = req.user?.role === 'rep' ? req.user!.userId : undefined;
      const data = await dashboardService.getRecentActivity(limit, userId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 8;
      const data = await dashboardService.getNotifications(limit);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};
