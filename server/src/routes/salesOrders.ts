import { Router } from 'express';
import { salesOrdersController } from '../controllers/salesOrders.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createSalesOrderSchema, deleteSchema, paymentSchema } from '../schemas/salesOrders.js';

const router = Router();

router.use(authenticate);
router.get('/taxes', authorize('admin', 'manager'), salesOrdersController.listTaxes);
router.get('/', authorize('admin', 'manager', 'rep'), salesOrdersController.list);
router.post('/', authorize('admin', 'manager', 'rep'), validate(createSalesOrderSchema), salesOrdersController.create);
router.get('/settled-commission', authorize('admin', 'manager', 'rep'), salesOrdersController.getSettledCommission);
router.get('/unsettled', authorize('admin', 'manager', 'rep'), salesOrdersController.getUnsettled);
router.get('/:id', authorize('admin', 'manager', 'rep'), salesOrdersController.getById);
router.post('/:id/dispatch', authorize('admin', 'manager'), salesOrdersController.dispatch);
router.post('/:id/cancel', authorize('admin', 'manager'), salesOrdersController.cancel);
router.delete('/:id', authorize('admin'), validate(deleteSchema), salesOrdersController.remove);
router.post('/:id/payments', authorize('admin', 'manager', 'rep'), validate(paymentSchema), salesOrdersController.recordPayment);

export default router;
