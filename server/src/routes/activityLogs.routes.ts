import { Router } from 'express';
import { activityLogsController } from '../controllers/activityLogs.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), activityLogsController.list);
router.get('/:id', authorize('admin', 'manager'), activityLogsController.getById);
router.get('/user/:userId', authorize('admin', 'manager'), activityLogsController.getByUser);
router.get('/entity/:entityType/:entityId', authorize('admin', 'manager', 'rep'), activityLogsController.getByEntity);
router.post('/', authorize('admin', 'manager', 'rep'), activityLogsController.create);

export default router;
