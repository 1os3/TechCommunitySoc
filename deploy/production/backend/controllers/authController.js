"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthController {
    static async register(req, res) {
        try {
            const userData = req.body;
            const result = await authService_1.AuthService.registerUser(userData);
            if (!result.success) {
                res.status(400).json({
                    error: {
                        code: 'REGISTRATION_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(201).json({
                success: true,
                message: result.message,
                data: {
                    user: {
                        id: result.user.id,
                        username: result.user.username,
                        email: result.user.email,
                        is_verified: result.user.is_verified,
                        created_at: result.user.created_at,
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Registration controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Registration failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async login(req, res) {
        try {
            const loginData = req.body;
            const result = await authService_1.AuthService.loginUser(loginData);
            if (!result.success) {
                res.status(401).json({
                    error: {
                        code: 'LOGIN_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    user: {
                        id: result.user.id,
                        username: result.user.username,
                        email: result.user.email,
                        is_verified: result.user.is_verified,
                        role: result.user.role,
                        last_login: result.user.last_login,
                    },
                    token: result.token,
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Login controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Login failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async verifyEmail(req, res) {
        try {
            const { token } = req.params;
            const result = await authService_1.AuthService.verifyEmail(token);
            if (!result.success) {
                res.status(400).json({
                    error: {
                        code: 'VERIFICATION_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    user: {
                        id: result.user.id,
                        username: result.user.username,
                        email: result.user.email,
                        is_verified: result.user.is_verified,
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Email verification controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Email verification failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async resendVerificationEmail(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({
                    error: {
                        code: 'MISSING_EMAIL',
                        message: 'Email is required',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await authService_1.AuthService.resendVerificationEmail(email);
            if (!result.success) {
                res.status(400).json({
                    error: {
                        code: 'RESEND_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Resend verification email controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to resend verification email',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async getCurrentUser(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    error: {
                        code: 'NOT_AUTHENTICATED',
                        message: 'Authentication required',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: req.user.id,
                        username: req.user.username,
                        email: req.user.email,
                        is_verified: req.user.is_verified,
                        is_active: req.user.is_active,
                        role: req.user.role,
                        avatar_url: req.user.avatar_url,
                        created_at: req.user.created_at,
                        last_login: req.user.last_login,
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get current user controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to get user information',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async logout(req, res) {
        try {
            // For JWT-based auth, logout is primarily handled client-side
            // Here we could add token blacklisting if needed in the future
            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Logout controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Logout failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            const result = await authService_1.AuthService.requestPasswordReset(email);
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                res.status(400).json({
                    error: {
                        code: 'PASSWORD_RESET_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        }
        catch (error) {
            logger_1.default.error('Password reset request error:', error);
            res.status(500).json({
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Password reset request failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async resetPassword(req, res) {
        try {
            const { token } = req.params;
            const { newPassword } = req.body;
            const result = await authService_1.AuthService.resetPassword(token, newPassword);
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                res.status(400).json({
                    error: {
                        code: 'PASSWORD_RESET_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        }
        catch (error) {
            logger_1.default.error('Password reset error:', error);
            res.status(500).json({
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Password reset failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;
            const result = await authService_1.AuthService.changePassword(userId, currentPassword, newPassword);
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                res.status(400).json({
                    error: {
                        code: 'PASSWORD_CHANGE_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        }
        catch (error) {
            logger_1.default.error('Password change error:', error);
            res.status(500).json({
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Password change failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async deleteAccount(req, res) {
        try {
            const { password } = req.body;
            const userId = req.user.id;
            const result = await authService_1.AuthService.deleteAccount(userId, password);
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                res.status(400).json({
                    error: {
                        code: 'ACCOUNT_DELETE_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        }
        catch (error) {
            logger_1.default.error('Account deletion error:', error);
            res.status(500).json({
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Account deletion failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async checkUserStatus(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await authService_1.AuthService.checkUserStatus(userId);
            if (!result.success) {
                res.status(400).json({
                    error: {
                        code: 'USER_STATUS_CHECK_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    isActive: result.isActive,
                    isDisabled: result.isDisabled,
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('User status check error:', error);
            res.status(500).json({
                error: {
                    code: 'SERVER_ERROR',
                    message: 'User status check failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map