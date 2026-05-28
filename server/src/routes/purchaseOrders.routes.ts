import { Router } from 'express';
import { purchaseOrdersController } from '../controllers/purchaseOrders.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), purchaseOrdersController.list);
router.get('/:id', authorize('admin', 'manager'), purchaseOrdersController.getById);
router.post('/', authorize('admin', 'manager'), purchaseOrdersController.create);
router.put('/:id', authorize('admin', 'manager'), purchaseOrdersController.update);
router.delete('/:id', authorize('admin'), purchaseOrdersController.remove);

export default router;
