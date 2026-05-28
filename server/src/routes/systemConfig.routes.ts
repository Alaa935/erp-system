import { Router } from 'express';
import { systemConfigController } from '../controllers/systemConfig.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), systemConfigController.getConfig);
router.put('/', authorize('admin'), systemConfigController.updateConfig);

export default router;
