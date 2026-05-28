import { Router } from 'express';
import { authController } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema, changePasswordSchema, forgotPasswordSchema, refreshTokenSchema } from '../schemas/auth.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', authenticate, authorize('admin'), validate(registerSchema), authController.register);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.get('/users', authenticate, authorize('admin'), authController.listUsers);

export default router;
