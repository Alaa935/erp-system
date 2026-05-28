import { Request, Response, NextFunction } from 'express';
import { systemConfigService } from '../services/systemConfig.service.js';

export const systemConfigController = {
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await systemConfigService.getConfig();
      res.json({ success: true, data: config });
    } catch (err) { next(err); }
  },

  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await systemConfigService.updateConfig(req.body);
      res.json({ success: true, data: config });
    } catch (err) { next(err); }
  },
};
