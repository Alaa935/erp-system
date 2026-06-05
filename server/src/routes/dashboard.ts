import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/summary', authorize('admin', 'manager', 'rep'), dashboardController.getSummary);
router.get('/kpis', authorize('admin', 'manager', 'rep'), dashboardController.getKPIs);
router.get('/charts', authorize('admin', 'manager', 'rep'), dashboardController.getCharts);
router.get('/alerts', authorize('admin', 'manager', 'rep'), dashboardController.getAlerts);
router.get('/top-products', authorize('admin', 'manager', 'rep'), dashboardController.getTopProducts);
router.get('/top-customers', authorize('admin', 'manager', 'rep'), dashboardController.getTopCustomers);
router.get('/low-stock', authorize('admin', 'manager', 'rep'), dashboardController.getLowStock);
router.get('/recent-activity', authorize('admin', 'manager', 'rep'), dashboardController.getRecentActivity);
router.get('/notifications', authorize('admin', 'manager', 'rep'), dashboardController.getNotifications);

export default router;
