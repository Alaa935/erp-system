import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager', 'rep'), notificationsController.list);
router.get('/unread', authorize('admin', 'manager', 'rep'), notificationsController.getUnread);
router.put('/:id/read', authorize('admin', 'manager', 'rep'), notificationsController.markRead);
router.put('/read-all', authorize('admin', 'manager', 'rep'), notificationsController.markAllRead);
router.delete('/:id', authorize('admin'), notificationsController.remove);
router.post('/', authorize('admin', 'manager', 'rep'), notificationsController.create);

export default router;
