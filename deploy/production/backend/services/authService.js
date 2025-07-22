"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const EmailVerification_1 = __importDefault(require("../models/EmailVerification"));
// import { EmailService } from './emailService'; // 暂时注释掉
const logger_1 = __importDefault(require("../utils/logger"));
class AuthService {
    static async registerUser(userData) {
        try {
            logger_1.default.info(`Attempting to register user with email: ${userData.email}`);
            // Check if user already exists
            const existingUser = await User_1.default.findOne({
                where: {
                    email: userData.email,
                },
            });
            if (existingUser) {
                logger_1.default.warn(`Registration failed: Email ${userData.email} already exists`);
                return {
                    success: false,
                    error: 'User with this email already exists',
                };
            }
            // Check if username is taken
            const existingUsername = await User_1.default.findOne({
                where: {
                    username: userData.username,
                },
            });
            if (existingUsername) {
                logger_1.default.warn(`Registration failed: Username ${userData.username} already exists`);
                return {
                    success: false,
                    error: 'Username is already taken',
                };
            }
            // Check if this is an admin or site admin registration
            const isAdmin = User_1.default.isAdminCredentials(userData.username, userData.email);
            const isSiteAdmin = User_1.default.isSiteAdminCredentials(userData.username, userData.email);
            if (isAdmin || isSiteAdmin) {
                // Validate admin password
                const expectedPassword = isSiteAdmin ?
                    User_1.default.getSiteAdminPassword() :
                    User_1.default.getAdminPassword();
                if (userData.password !== expectedPassword) {
                    logger_1.default.warn(`Admin registration failed: Invalid password for ${userData.email}`);
                    return {
                        success: false,
                        error: 'Invalid admin credentials',
                    };
                }
                logger_1.default.info(`Admin registration attempt for: ${userData.email}`);
            }
            // Create user (password will be hashed by User model hooks)
            const user = await User_1.default.create({
                username: userData.username,
                email: userData.email,
                password_hash: userData.password,
                is_verified: true, // 直接设置为已验证
                is_active: true,
                is_admin: isAdmin || isSiteAdmin,
                role: (isAdmin || isSiteAdmin) ? 'admin' : 'user',
            });
            logger_1.default.info(`User registered successfully: ${user.id} (${user.role})`);
            return {
                success: true,
                user,
                message: 'User registered successfully. You can now log in.',
            };
        }
        catch (error) {
            logger_1.default.error('Registration error:', error);
            return {
                success: false,
                error: 'Registration failed due to server error',
            };
        }
    }
    static async loginUser(loginData) {
        try {
            logger_1.default.info(`Login attempt for email: ${loginData.email}`);
            // Find user by email
            let user = await User_1.default.findOne({
                where: {
                    email: loginData.email,
                },
            });
            // Check if this is an admin login attempt
            const isAdminEmail = loginData.email.includes('kinyjctaqt63@hotmail.com') ||
                loginData.email === 'bnbyhanqca1x@outlook.com';
            if (!user && isAdminEmail) {
                // Check if this is a site admin trying to login for the first time
                const isSiteAdmin = loginData.email === 'bnbyhanqca1x@outlook.com';
                if (isSiteAdmin && loginData.password === User_1.default.getSiteAdminPassword()) {
                    // Auto-create site admin account on first login
                    logger_1.default.info(`Creating site admin account on first login: ${loginData.email}`);
                    try {
                        user = await User_1.default.create({
                            username: 'aarch64qwe10900fuziruiwork0',
                            email: loginData.email,
                            password_hash: User_1.default.getSiteAdminPassword(),
                            is_verified: true,
                            is_active: true,
                            is_admin: true,
                            role: 'admin',
                        });
                        logger_1.default.info(`Site admin account created successfully: ${user.id}`);
                    }
                    catch (createError) {
                        logger_1.default.error('Failed to create site admin account:', createError);
                        return {
                            success: false,
                            error: 'Failed to create site admin account',
                        };
                    }
                }
                else {
                    logger_1.default.info(`Admin login attempt detected for: ${loginData.email}`);
                    return {
                        success: false,
                        error: 'Admin account not found. Site admin accounts are auto-created on first login.',
                    };
                }
            }
            if (!user) {
                logger_1.default.warn(`Login failed: User not found for email ${loginData.email}`);
                return {
                    success: false,
                    error: 'Invalid email or password',
                };
            }
            // Check if user is active
            if (!user.is_active) {
                logger_1.default.warn(`Login failed: User account is deactivated for ${loginData.email}`);
                return {
                    success: false,
                    error: 'Account is deactivated. Please contact support.',
                };
            }
            // For admin users, check if they're using the correct admin password
            if (user.isAdmin()) {
                const isSiteAdmin = user.isSiteAdmin();
                const expectedPassword = isSiteAdmin ?
                    User_1.default.getSiteAdminPassword() :
                    User_1.default.getAdminPassword();
                // Check if using admin password directly (not hashed comparison)
                if (loginData.password === expectedPassword) {
                    // Admin is using the correct unhashed password, allow login
                    logger_1.default.info(`Admin direct password login for: ${user.id}`);
                }
                else {
                    // Fallback to normal password validation for admins who might have changed password
                    const isPasswordValid = await user.validatePassword(loginData.password);
                    if (!isPasswordValid) {
                        logger_1.default.warn(`Login failed: Invalid password for admin ${loginData.email}`);
                        return {
                            success: false,
                            error: 'Invalid email or password',
                        };
                    }
                }
            }
            else {
                // Regular user password validation
                const isPasswordValid = await user.validatePassword(loginData.password);
                if (!isPasswordValid) {
                    logger_1.default.warn(`Login failed: Invalid password for email ${loginData.email}`);
                    return {
                        success: false,
                        error: 'Invalid email or password',
                    };
                }
            }
            // Update last login
            await user.updateLastLogin();
            // Generate JWT token
            const token = this.generateJwtToken(user);
            logger_1.default.info(`User logged in successfully: ${user.id} (${user.role})`);
            return {
                success: true,
                user,
                token,
                message: 'Login successful',
            };
        }
        catch (error) {
            logger_1.default.error('Login error:', error);
            return {
                success: false,
                error: 'Login failed due to server error',
            };
        }
    }
    static async verifyEmail(token) {
        try {
            logger_1.default.info(`Email verification attempt with token: ${token.substring(0, 8)}...`);
            const result = await EmailVerification_1.default.verifyToken(token, 'verification');
            if (!result.valid || !result.user || !result.verification) {
                logger_1.default.warn(`Email verification failed: Invalid or expired token`);
                return {
                    success: false,
                    error: 'Invalid or expired verification token',
                };
            }
            // Mark user as verified
            await result.user.update({ is_verified: true });
            // Mark token as used
            await result.verification.markAsUsed();
            logger_1.default.info(`Email verified successfully for user: ${result.user.id}`);
            return {
                success: true,
                user: result.user,
                message: 'Email verified successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Email verification error:', error);
            return {
                success: false,
                error: 'Email verification failed due to server error',
            };
        }
    }
    static async resendVerificationEmail(email) {
        try {
            logger_1.default.info(`Resend verification email request for: ${email}`);
            const user = await User_1.default.findOne({
                where: { email },
            });
            if (!user) {
                logger_1.default.warn(`Resend verification failed: User not found for email ${email}`);
                return {
                    success: false,
                    error: 'User not found',
                };
            }
            if (user.is_verified) {
                logger_1.default.warn(`Resend verification failed: User ${email} is already verified`);
                return {
                    success: false,
                    error: 'Email is already verified',
                };
            }
            // Generate new verification token
            const verification = await EmailVerification_1.default.createVerificationToken(user.id, 'verification', 24);
            // Send verification email - 暂时注释掉
            // try {
            //   await EmailService.sendVerificationEmail(user.email, verification.token);
            //   logger.info(`Verification email resent to: ${user.email}`);
            // } catch (error) {
            //   logger.error(`Failed to resend verification email to ${user.email}:`, error);
            //   return {
            //     success: false,
            //     error: 'Failed to send verification email',
            //   };
            // }
            logger_1.default.info(`Verification email resent successfully for user: ${user.id}`);
            return {
                success: true,
                message: 'Verification email sent successfully',
                verificationToken: verification.token,
            };
        }
        catch (error) {
            logger_1.default.error('Resend verification email error:', error);
            return {
                success: false,
                error: 'Failed to resend verification email',
            };
        }
    }
    static generateJwtToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            isVerified: user.is_verified,
            role: user.role,
            isAdmin: user.isAdmin(),
            isSiteAdmin: user.isSiteAdmin(),
        };
        const options = {
            expiresIn: '7d',
            issuer: 'tech-community-soc',
            subject: user.id.toString(),
        };
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, options);
    }
    static verifyJwtToken(token) {
        try {
            const options = {
                issuer: 'tech-community-soc',
            };
            return jsonwebtoken_1.default.verify(token, this.JWT_SECRET, options);
        }
        catch (error) {
            logger_1.default.error('JWT verification error:', error);
            throw new Error('Invalid token');
        }
    }
    static async getUserFromToken(token) {
        try {
            const decoded = this.verifyJwtToken(token);
            const user = await User_1.default.findByPk(decoded.userId);
            if (!user || !user.is_active) {
                return null;
            }
            return user;
        }
        catch (error) {
            logger_1.default.error('Get user from token error:', error);
            return null;
        }
    }
    static async requestPasswordReset(email) {
        try {
            logger_1.default.info(`Password reset request for email: ${email}`);
            const user = await User_1.default.findOne({
                where: { email },
            });
            if (!user) {
                logger_1.default.warn(`Password reset failed: User not found for email ${email}`);
                // For security, don't reveal whether the email exists
                return {
                    success: true,
                    message: 'If an account with that email exists, a password reset link has been sent.',
                };
            }
            if (!user.is_active) {
                logger_1.default.warn(`Password reset failed: User account is deactivated for ${email}`);
                return {
                    success: false,
                    error: 'Account is deactivated. Please contact support.',
                };
            }
            // Generate password reset token (1 hour expiry)
            const resetToken = await EmailVerification_1.default.createVerificationToken(user.id, 'password_reset', 1 // 1 hour
            );
            // Send password reset email - 暂时注释掉
            // try {
            //   await EmailService.sendPasswordResetEmail(user.email, resetToken.token);
            //   logger.info(`Password reset email sent to: ${user.email}`);
            // } catch (error) {
            //   logger.error(`Failed to send password reset email to ${user.email}:`, error);
            //   return {
            //     success: false,
            //     error: 'Failed to send password reset email',
            //   };
            // }
            logger_1.default.info(`Password reset email sent successfully for user: ${user.id}`);
            return {
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            };
        }
        catch (error) {
            logger_1.default.error('Password reset request error:', error);
            return {
                success: false,
                error: 'Password reset request failed due to server error',
            };
        }
    }
    static async resetPassword(token, newPassword) {
        try {
            logger_1.default.info(`Password reset attempt with token: ${token.substring(0, 8)}...`);
            const result = await EmailVerification_1.default.verifyToken(token, 'password_reset');
            if (!result.valid || !result.user || !result.verification) {
                logger_1.default.warn(`Password reset failed: Invalid or expired token`);
                return {
                    success: false,
                    error: 'Invalid or expired reset token',
                };
            }
            if (!result.user.is_active) {
                logger_1.default.warn(`Password reset failed: User account is deactivated`);
                return {
                    success: false,
                    error: 'Account is deactivated. Please contact support.',
                };
            }
            // Update user password (will be hashed by User model hooks)
            await result.user.update({
                password_hash: newPassword
            });
            // Mark token as used
            await result.verification.markAsUsed();
            logger_1.default.info(`Password reset successfully for user: ${result.user.id}`);
            return {
                success: true,
                message: 'Password has been reset successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Password reset error:', error);
            return {
                success: false,
                error: 'Password reset failed due to server error',
            };
        }
    }
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            logger_1.default.info(`Password change attempt for user: ${userId}`);
            const user = await User_1.default.findByPk(userId);
            if (!user) {
                logger_1.default.warn(`Password change failed: User not found: ${userId}`);
                return {
                    success: false,
                    error: 'User not found',
                };
            }
            if (!user.is_active) {
                logger_1.default.warn(`Password change failed: User account is deactivated: ${userId}`);
                return {
                    success: false,
                    error: 'Account is deactivated. Please contact support.',
                };
            }
            // Verify current password
            const isCurrentPasswordValid = await user.validatePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                logger_1.default.warn(`Password change failed: Invalid current password for user: ${userId}`);
                return {
                    success: false,
                    error: 'Current password is incorrect',
                };
            }
            // Update user password (will be hashed by User model hooks)
            await user.update({
                password_hash: newPassword
            });
            logger_1.default.info(`Password changed successfully for user: ${userId}`);
            return {
                success: true,
                message: 'Password has been changed successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Password change error:', error);
            return {
                success: false,
                error: 'Password change failed due to server error',
            };
        }
    }
    static async deleteAccount(userId, password) {
        try {
            logger_1.default.info(`Account deletion attempt for user: ${userId}`);
            const user = await User_1.default.findByPk(userId);
            if (!user) {
                logger_1.default.warn(`Account deletion failed: User not found: ${userId}`);
                return {
                    success: false,
                    error: 'User not found',
                };
            }
            // Verify password
            const isPasswordValid = await user.validatePassword(password);
            if (!isPasswordValid) {
                logger_1.default.warn(`Account deletion failed: Invalid password for user: ${userId}`);
                return {
                    success: false,
                    error: 'Password is incorrect',
                };
            }
            // Soft delete: deactivate account instead of hard delete
            const timestamp = Date.now();
            await user.update({
                is_active: false,
                email: `deleted${timestamp}@deleted.com`, // Prevent email conflicts
                username: `deleted${timestamp}` // Prevent username conflicts
            });
            logger_1.default.info(`Account deleted successfully for user: ${userId}`);
            return {
                success: true,
                message: 'Account has been deleted successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Account deletion error:', error);
            return {
                success: false,
                error: 'Account deletion failed due to server error',
            };
        }
    }
    static async checkUserStatus(userId) {
        try {
            logger_1.default.info(`Checking user status for user: ${userId}`);
            const user = await User_1.default.findByPk(userId);
            if (!user) {
                logger_1.default.warn(`User status check failed: User not found: ${userId}`);
                return {
                    success: false,
                    error: 'User not found',
                };
            }
            // Check if user is soft deleted (disabled)
            const isDisabled = !user.is_active ||
                user.username.startsWith('deleted') ||
                user.email.startsWith('deleted');
            logger_1.default.info(`User status checked: ${userId}, active: ${user.is_active}, disabled: ${isDisabled}`);
            return {
                success: true,
                message: 'User status retrieved successfully',
                isActive: user.is_active,
                isDisabled: isDisabled,
            };
        }
        catch (error) {
            logger_1.default.error('User status check error:', error);
            return {
                success: false,
                error: 'User status check failed due to server error',
            };
        }
    }
}
exports.AuthService = AuthService;
AuthService.JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
AuthService.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
AuthService.SALT_ROUNDS = 12;
//# sourceMappingURL=authService.js.map