import { Router } from 'express';
import { warehousesController } from '../controllers/warehouses.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), warehousesController.list);
router.get('/:id', authorize('admin', 'manager'), warehousesController.getById);
router.post('/', authorize('admin', 'manager'), warehousesController.create);
router.put('/:id', authorize('admin', 'manager'), warehousesController.update);
router.delete('/:id', authorize('admin'), warehousesController.remove);

export default router;
