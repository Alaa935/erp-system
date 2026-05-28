import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), inventoryController.list);
router.get('/low-stock', authorize('admin', 'manager'), inventoryController.lowStock);
router.get('/:id', authorize('admin', 'manager'), inventoryController.getById);
router.post('/', authorize('admin', 'manager'), inventoryController.create);
router.put('/:id', authorize('admin', 'manager'), inventoryController.update);
router.delete('/:id', authorize('admin'), inventoryController.remove);
router.post('/:id/adjust', authorize('admin', 'manager'), inventoryController.adjustQuantity);

export default router;
