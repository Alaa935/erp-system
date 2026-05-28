import { Router } from 'express';
import { branchesController } from '../controllers/branches.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createBranchSchema, updateBranchSchema, deleteBranchSchema } from '../schemas/branches.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), branchesController.list);
router.get('/:id', authorize('admin', 'manager'), branchesController.getById);
router.post('/', authorize('admin', 'manager'), validate(createBranchSchema), branchesController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateBranchSchema), branchesController.update);
router.delete('/:id', authorize('admin'), validate(deleteBranchSchema), branchesController.remove);

export default router;
