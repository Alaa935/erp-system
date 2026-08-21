import { Router } from 'express';
import { repInventoryController } from '../controllers/repInventory.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager', 'rep'), repInventoryController.listByRepId);
router.put('/:id', authorize('admin', 'manager', 'rep'), repInventoryController.update);

export default router;
