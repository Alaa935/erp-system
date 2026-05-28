    import { Router } from 'express';
import { salesRepsController } from '../controllers/salesReps.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createSalesRepSchema, updateSalesRepSchema, deleteSalesRepSchema } from '../schemas/salesReps.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), salesRepsController.list);
router.get('/:id', authorize('admin', 'manager'), salesRepsController.getById);
router.post('/', authorize('admin', 'manager'), validate(createSalesRepSchema), salesRepsController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateSalesRepSchema), salesRepsController.update);
router.delete('/:id', authorize('admin'), validate(deleteSalesRepSchema), salesRepsController.remove);

export default router;
