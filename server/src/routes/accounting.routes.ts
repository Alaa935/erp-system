import { Router } from 'express';
import { accountingController } from '../controllers/accounting.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/overview', authorize('admin', 'manager'), accountingController.overview);
router.put('/capital', authorize('admin'), accountingController.updateCapital);
router.post('/transactions', authorize('admin', 'manager'), accountingController.createTransaction);
router.get('/payment-history/:referenceId', authorize('admin', 'manager'), accountingController.getPaymentHistory);
router.post('/collections/:id/confirm', authorize('admin', 'manager'), accountingController.confirmCollection);
router.post('/payroll', authorize('admin', 'manager'), accountingController.createPayroll);
router.post('/payroll/:id/confirm', authorize('admin', 'manager'), accountingController.confirmSalaryPayroll);
router.put('/payroll/:id', authorize('admin', 'manager'), accountingController.updatePayroll);
router.post('/vehicles', authorize('admin', 'manager'), accountingController.createVehicle);
router.post('/vehicles/expense', authorize('admin', 'manager'), accountingController.addVehicleExpense);

export default router;
