import { Router } from 'express';
import { taxConfigsController } from '../controllers/taxConfigs.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createTaxConfigSchema, updateTaxConfigSchema, deleteTaxConfigSchema } from '../schemas/taxConfigs.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), taxConfigsController.list);
router.get('/:id', authorize('admin', 'manager'), taxConfigsController.getById);
router.post('/', authorize('admin', 'manager'), validate(createTaxConfigSchema), taxConfigsController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateTaxConfigSchema), taxConfigsController.update);
router.delete('/:id', authorize('admin'), validate(deleteTaxConfigSchema), taxConfigsController.remove);

export default router;
