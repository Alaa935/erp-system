import { Router } from 'express';
import { stockRequestsController } from '../controllers/stockRequests.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createStockRequestSchema, updateStockRequestSchema, deleteStockRequestSchema } from '../schemas/stockRequests.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), stockRequestsController.list);
router.get('/:id', authorize('admin', 'manager'), stockRequestsController.getById);
router.post('/', authorize('admin', 'manager'), validate(createStockRequestSchema), stockRequestsController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateStockRequestSchema), stockRequestsController.update);
router.delete('/:id', authorize('admin'), validate(deleteStockRequestSchema), stockRequestsController.remove);

export default router;