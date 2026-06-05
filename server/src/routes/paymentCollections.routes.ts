import { Router } from 'express';
import { paymentCollectionsController } from '../controllers/paymentCollections.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/pending-settlement', authorize('admin', 'manager', 'rep'), paymentCollectionsController.getPendingSettlement);
router.get('/', authorize('admin', 'manager', 'rep'), paymentCollectionsController.list);
router.post('/', authorize('admin', 'manager', 'rep'), paymentCollectionsController.create);
router.put('/:id', authorize('admin', 'manager'), paymentCollectionsController.update);

export default router;
