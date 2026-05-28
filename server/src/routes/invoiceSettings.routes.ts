import { Router } from 'express';
import { invoiceSettingsController } from '../controllers/invoiceSettings.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { upsertInvoiceSettingsSchema } from '../schemas/invoiceSettings.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'manager'), invoiceSettingsController.get);
router.put('/', authorize('admin', 'manager'), validate(upsertInvoiceSettingsSchema), invoiceSettingsController.upsert);

export default router;
