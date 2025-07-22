"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validation_1 = require("../utils/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', (0, validation_1.validateRequest)(validation_1.userRegistrationSchema), authController_1.AuthController.register);
router.post('/login', (0, validation_1.validateRequest)(validation_1.userLoginSchema), authController_1.AuthController.login);
router.get('/verify-email/:token', authController_1.AuthController.verifyEmail);
router.post('/resend-verification', authController_1.AuthController.resendVerificationEmail);
// Password reset routes
router.post('/forgot-password', (0, validation_1.validateRequest)(validation_1.passwordResetSchema), authController_1.AuthController.requestPasswordReset);
router.post('/reset-password/:token', (0, validation_1.validateRequest)(validation_1.passwordChangeSchema), authController_1.AuthController.resetPassword);
// Protected routes
router.get('/me', auth_1.authenticateToken, authController_1.AuthController.getCurrentUser);
router.get('/status', auth_1.authenticateToken, authController_1.AuthController.checkUserStatus);
router.post('/logout', auth_1.authenticateToken, authController_1.AuthController.logout);
router.post('/change-password', auth_1.authenticateToken, authController_1.AuthController.changePassword);
router.delete('/delete-account', auth_1.authenticateToken, authController_1.AuthController.deleteAccount);
exports.default = router;
//# sourceMappingURL=auth.js.map