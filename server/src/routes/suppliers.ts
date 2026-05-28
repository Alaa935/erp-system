import { Router } from 'express';
import { suppliersController } from '../controllers/suppliers.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createSupplierSchema, updateSupplierSchema, deleteSupplierSchema } from '../schemas/suppliers.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), suppliersController.list);
router.get('/:id', authorize('admin', 'manager'), suppliersController.getById);
router.post('/', authorize('admin', 'manager'), validate(createSupplierSchema), suppliersController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateSupplierSchema), suppliersController.update);
router.delete('/:id', authorize('admin'), validate(deleteSupplierSchema), suppliersController.remove);

export default router;
