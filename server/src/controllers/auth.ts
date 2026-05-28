import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.js';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password, role, repId, nationalId } = req.body;
      const result = await authService.register(username, password, role, repId, nationalId);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await authService.logout(refreshToken);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) { next(err); }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const current = await authService.me(req.user!.userId);
      res.json({ success: true, data: current });
    } catch (err) { next(err); }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) { next(err); }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.username, req.body.nationalId, req.body.newPassword);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) { next(err); }
  },

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await authService.listUsers();
      res.json({ success: true, data: users });
    } catch (err) { next(err); }
  },
};
