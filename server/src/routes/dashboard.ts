import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/summary', authorize('admin', 'manager'), dashboardController.getSummary);
router.get('/kpis', authorize('admin', 'manager'), dashboardController.getKPIs);
router.get('/charts', authorize('admin', 'manager'), dashboardController.getCharts);
router.get('/alerts', authorize('admin', 'manager'), dashboardController.getAlerts);
router.get('/top-products', authorize('admin', 'manager'), dashboardController.getTopProducts);
router.get('/top-customers', authorize('admin', 'manager'), dashboardController.getTopCustomers);
router.get('/low-stock', authorize('admin', 'manager'), dashboardController.getLowStock);
router.get('/recent-activity', authorize('admin', 'manager'), dashboardController.getRecentActivity);
router.get('/notifications', authorize('admin', 'manager'), dashboardController.getNotifications);

export default router;
