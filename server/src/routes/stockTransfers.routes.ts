import { Router } from 'express';
import { stockTransfersController } from '../controllers/stockTransfers.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createStockTransferSchema, updateStockTransferSchema, deleteStockTransferSchema } from '../schemas/stockTransfers.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), stockTransfersController.list);
router.get('/:id', authorize('admin', 'manager'), stockTransfersController.getById);
router.post('/', authorize('admin', 'manager'), validate(createStockTransferSchema), stockTransfersController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateStockTransferSchema), stockTransfersController.update);
router.delete('/:id', authorize('admin'), validate(deleteStockTransferSchema), stockTransfersController.remove);

export default router;