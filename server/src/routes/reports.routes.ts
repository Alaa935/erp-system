import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/financial-summary', authorize('admin', 'manager'), reportsController.financialSummary);
router.get('/profit-loss', authorize('admin', 'manager'), reportsController.profitLoss);
router.get('/sales', authorize('admin', 'manager'), reportsController.salesDetails);
router.get('/purchases', authorize('admin', 'manager'), reportsController.purchaseDetails);
router.get('/inventory', authorize('admin', 'manager'), reportsController.inventoryDetails);
router.get('/customer-balances', authorize('admin', 'manager'), reportsController.customerBalances);
router.get('/supplier-balances', authorize('admin', 'manager'), reportsController.supplierBalances);
router.get('/tax', authorize('admin', 'manager'), reportsController.taxReport);
router.get('/cashflow', authorize('admin', 'manager'), reportsController.cashflow);
router.get('/activity', authorize('admin', 'manager'), reportsController.activityLog);

export default router;
