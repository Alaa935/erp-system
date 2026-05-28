import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/summary', authorize('admin', 'manager'), analyticsController.getSummary);
router.get('/sales/details', authorize('admin', 'manager'), analyticsController.getSalesDetails);
router.get('/expenses/details', authorize('admin', 'manager'), analyticsController.getExpensesDetails);
router.get('/profit/details', authorize('admin', 'manager'), analyticsController.getProfitDetails);
router.get('/inventory/details', authorize('admin', 'manager'), analyticsController.getInventoryAnalytics);
router.get('/customers/details', authorize('admin', 'manager'), analyticsController.getCustomerAnalytics);
router.get('/suppliers/details', authorize('admin', 'manager'), analyticsController.getSupplierAnalytics);

export default router;
