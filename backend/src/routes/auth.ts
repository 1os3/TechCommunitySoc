import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { 
  validateRequest, 
  userRegistrationSchema, 
  userLoginSchema,
  passwordResetSchema,
  passwordChangeSchema 
} from '../utils/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', validateRequest(userRegistrationSchema), AuthController.register);
router.post('/login', validateRequest(userLoginSchema), AuthController.login);
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerificationEmail);

// Password reset routes
router.post('/forgot-password', validateRequest(passwordResetSchema), AuthController.requestPasswordReset);
router.post('/reset-password/:token', validateRequest(passwordChangeSchema), AuthController.resetPassword);

// Protected routes
router.get('/me', authenticateToken, AuthController.getCurrentUser);
router.get('/status', authenticateToken, AuthController.checkUserStatus);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/change-password', authenticateToken, AuthController.changePassword);
router.delete('/delete-account', authenticateToken, AuthController.deleteAccount);

export default router;