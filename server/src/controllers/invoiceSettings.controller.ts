import { Request, Response, NextFunction } from 'express';
import { invoiceSettingsService } from '../services/invoiceSettings.service.js';

export const invoiceSettingsController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await invoiceSettingsService.getInvoiceSettings();
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await invoiceSettingsService.upsertInvoiceSettings(req.body);
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },
};
