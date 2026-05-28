import { Router } from 'express';
import { customersController } from '../controllers/customers.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createCustomerSchema, updateCustomerSchema, deleteCustomerSchema } from '../schemas/customers.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), customersController.list);
router.get('/:id', authorize('admin', 'manager'), customersController.getById);
router.post('/', authorize('admin', 'manager'), validate(createCustomerSchema), customersController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateCustomerSchema), customersController.update);
router.delete('/:id', authorize('admin'), validate(deleteCustomerSchema), customersController.remove);

export default router;
