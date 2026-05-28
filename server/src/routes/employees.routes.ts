import { Router } from 'express';
import { employeesController } from '../controllers/employees.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema, deleteEmployeeSchema } from '../schemas/employees.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), employeesController.list);
router.get('/:id', authorize('admin', 'manager'), employeesController.getById);
router.post('/', authorize('admin', 'manager'), validate(createEmployeeSchema), employeesController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateEmployeeSchema), employeesController.update);
router.delete('/:id', authorize('admin'), validate(deleteEmployeeSchema), employeesController.remove);

export default router;
