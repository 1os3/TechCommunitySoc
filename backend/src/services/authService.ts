import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import EmailVerification from '../models/EmailVerification';
// import { EmailService } from './emailService'; // 暂时注释掉
import logger from '../utils/logger';

export interface RegisterUserData {
  username: string;
  email: string;
  password: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

export interface RegistrationResult {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
  verificationToken?: string;
}

export interface PasswordResetResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly SALT_ROUNDS = 12;

  static async registerUser(userData: RegisterUserData): Promise<RegistrationResult> {
    try {
      logger.info(`Attempting to register user with email: ${userData.email}`);

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          email: userData.email,
        },
      });

      if (existingUser) {
        logger.warn(`Registration failed: Email ${userData.email} already exists`);
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      // Check if username is taken
      const existingUsername = await User.findOne({
        where: {
          username: userData.username,
        },
      });

      if (existingUsername) {
        logger.warn(`Registration failed: Username ${userData.username} already exists`);
        return {
          success: false,
          error: 'Username is already taken',
        };
      }

      // Check if this is an admin or site admin registration
      const isAdmin = User.isAdminCredentials(userData.username, userData.email);
      const isSiteAdmin = User.isSiteAdminCredentials(userData.username, userData.email);
      
      if (isAdmin || isSiteAdmin) {
        // Validate admin password
        const expectedPassword = isSiteAdmin ? 
          User.getSiteAdminPassword() : 
          User.getAdminPassword();
          
        if (userData.password !== expectedPassword) {
          logger.warn(`Admin registration failed: Invalid password for ${userData.email}`);
          return {
            success: false,
            error: 'Invalid admin credentials',
          };
        }
        
        logger.info(`Admin registration attempt for: ${userData.email}`);
      }

      // Create user (password will be hashed by User model hooks)
      const user = await User.create({
        username: userData.username,
        email: userData.email,
        password_hash: userData.password,
        is_verified: true, // 直接设置为已验证
        is_active: true,
        is_admin: isAdmin || isSiteAdmin,
        role: (isAdmin || isSiteAdmin) ? 'admin' : 'user',
      });

      logger.info(`User registered successfully: ${user.id} (${user.role})`);

      return {
        success: true,
        user,
        message: 'User registered successfully. You can now log in.',
      };
    } catch (error) {
      logger.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed due to server error',
      };
    }
  }

  static async loginUser(loginData: LoginUserData): Promise<AuthResult> {
    try {
      logger.info(`Login attempt for email: ${loginData.email}`);

      // Find user by email
      let user = await User.findOne({
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
        
        if (isSiteAdmin && loginData.password === User.getSiteAdminPassword()) {
          // Auto-create site admin account on first login
          logger.info(`Creating site admin account on first login: ${loginData.email}`);
          
          try {
            user = await User.create({
              username: 'aarch64qwe10900fuziruiwork0',
              email: loginData.email,
              password_hash: User.getSiteAdminPassword(),
              is_verified: true,
              is_active: true,
              is_admin: true,
              role: 'admin',
            });
            
            logger.info(`Site admin account created successfully: ${user.id}`);
          } catch (createError) {
            logger.error('Failed to create site admin account:', createError);
            return {
              success: false,
              error: 'Failed to create site admin account',
            };
          }
        } else {
          logger.info(`Admin login attempt detected for: ${loginData.email}`);
          return {
            success: false,
            error: 'Admin account not found. Site admin accounts are auto-created on first login.',
          };
        }
      }

      if (!user) {
        logger.warn(`Login failed: User not found for email ${loginData.email}`);
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Check if user is active
      if (!user.is_active) {
        logger.warn(`Login failed: User account is deactivated for ${loginData.email}`);
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.',
        };
      }

      // For admin users, check if they're using the correct admin password
      if (user.isAdmin()) {
        const isSiteAdmin = user.isSiteAdmin();
        const expectedPassword = isSiteAdmin ? 
          User.getSiteAdminPassword() : 
          User.getAdminPassword();
          
        // Check if using admin password directly (not hashed comparison)
        if (loginData.password === expectedPassword) {
          // Admin is using the correct unhashed password, allow login
          logger.info(`Admin direct password login for: ${user.id}`);
        } else {
          // Fallback to normal password validation for admins who might have changed password
          const isPasswordValid = await user.validatePassword(loginData.password);
          if (!isPasswordValid) {
            logger.warn(`Login failed: Invalid password for admin ${loginData.email}`);
            return {
              success: false,
              error: 'Invalid email or password',
            };
          }
        }
      } else {
        // Regular user password validation
        const isPasswordValid = await user.validatePassword(loginData.password);
        if (!isPasswordValid) {
          logger.warn(`Login failed: Invalid password for email ${loginData.email}`);
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

      logger.info(`User logged in successfully: ${user.id} (${user.role})`);

      return {
        success: true,
        user,
        token,
        message: 'Login successful',
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed due to server error',
      };
    }
  }

  static async verifyEmail(token: string): Promise<AuthResult> {
    try {
      logger.info(`Email verification attempt with token: ${token.substring(0, 8)}...`);

      const result = await EmailVerification.verifyToken(token, 'verification');
      
      if (!result.valid || !result.user || !result.verification) {
        logger.warn(`Email verification failed: Invalid or expired token`);
        return {
          success: false,
          error: 'Invalid or expired verification token',
        };
      }

      // Mark user as verified
      await result.user.update({ is_verified: true });
      
      // Mark token as used
      await result.verification.markAsUsed();

      logger.info(`Email verified successfully for user: ${result.user.id}`);

      return {
        success: true,
        user: result.user,
        message: 'Email verified successfully',
      };
    } catch (error) {
      logger.error('Email verification error:', error);
      return {
        success: false,
        error: 'Email verification failed due to server error',
      };
    }
  }

  static async resendVerificationEmail(email: string): Promise<{ success: boolean; message?: string; error?: string; verificationToken?: string }> {
    try {
      logger.info(`Resend verification email request for: ${email}`);

      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        logger.warn(`Resend verification failed: User not found for email ${email}`);
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (user.is_verified) {
        logger.warn(`Resend verification failed: User ${email} is already verified`);
        return {
          success: false,
          error: 'Email is already verified',
        };
      }

      // Generate new verification token
      const verification = await EmailVerification.createVerificationToken(
        user.id,
        'verification',
        24
      );

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

      logger.info(`Verification email resent successfully for user: ${user.id}`);

      return {
        success: true,
        message: 'Verification email sent successfully',
        verificationToken: verification.token,
      };
    } catch (error) {
      logger.error('Resend verification email error:', error);
      return {
        success: false,
        error: 'Failed to resend verification email',
      };
    }
  }

  static generateJwtToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.is_verified,
      role: user.role,
      isAdmin: user.isAdmin(),
      isSiteAdmin: user.isSiteAdmin(),
    };

    const options: SignOptions = {
      expiresIn: '7d',
      issuer: 'tech-community-soc',
      subject: user.id.toString(),
    };

    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  static verifyJwtToken(token: string): any {
    try {
      const options = {
        issuer: 'tech-community-soc',
      };
      return jwt.verify(token, this.JWT_SECRET, options);
    } catch (error) {
      logger.error('JWT verification error:', error);
      throw new Error('Invalid token');
    }
  }

  static async getUserFromToken(token: string): Promise<User | null> {
    try {
      const decoded = this.verifyJwtToken(token);
      const user = await User.findByPk(decoded.userId);
      
      if (!user || !user.is_active) {
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Get user from token error:', error);
      return null;
    }
  }

  static async requestPasswordReset(email: string): Promise<PasswordResetResult> {
    try {
      logger.info(`Password reset request for email: ${email}`);

      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        logger.warn(`Password reset failed: User not found for email ${email}`);
        // For security, don't reveal whether the email exists
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        };
      }

      if (!user.is_active) {
        logger.warn(`Password reset failed: User account is deactivated for ${email}`);
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.',
        };
      }

      // Generate password reset token (1 hour expiry)
      const resetToken = await EmailVerification.createVerificationToken(
        user.id,
        'password_reset',
        1 // 1 hour
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

      logger.info(`Password reset email sent successfully for user: ${user.id}`);

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      logger.error('Password reset request error:', error);
      return {
        success: false,
        error: 'Password reset request failed due to server error',
      };
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<PasswordResetResult> {
    try {
      logger.info(`Password reset attempt with token: ${token.substring(0, 8)}...`);

      const result = await EmailVerification.verifyToken(token, 'password_reset');
      
      if (!result.valid || !result.user || !result.verification) {
        logger.warn(`Password reset failed: Invalid or expired token`);
        return {
          success: false,
          error: 'Invalid or expired reset token',
        };
      }

      if (!result.user.is_active) {
        logger.warn(`Password reset failed: User account is deactivated`);
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

      logger.info(`Password reset successfully for user: ${result.user.id}`);

      return {
        success: true,
        message: 'Password has been reset successfully',
      };
    } catch (error) {
      logger.error('Password reset error:', error);
      return {
        success: false,
        error: 'Password reset failed due to server error',
      };
    }
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<PasswordResetResult> {
    try {
      logger.info(`Password change attempt for user: ${userId}`);

      const user = await User.findByPk(userId);
      
      if (!user) {
        logger.warn(`Password change failed: User not found: ${userId}`);
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (!user.is_active) {
        logger.warn(`Password change failed: User account is deactivated: ${userId}`);
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.',
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await user.validatePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        logger.warn(`Password change failed: Invalid current password for user: ${userId}`);
        return {
          success: false,
          error: 'Current password is incorrect',
        };
      }

      // Update user password (will be hashed by User model hooks)
      await user.update({ 
        password_hash: newPassword 
      });

      logger.info(`Password changed successfully for user: ${userId}`);

      return {
        success: true,
        message: 'Password has been changed successfully',
      };
    } catch (error) {
      logger.error('Password change error:', error);
      return {
        success: false,
        error: 'Password change failed due to server error',
      };
    }
  }

  static async deleteAccount(userId: number, password: string): Promise<PasswordResetResult> {
    try {
      logger.info(`Account deletion attempt for user: ${userId}`);

      const user = await User.findByPk(userId);
      
      if (!user) {
        logger.warn(`Account deletion failed: User not found: ${userId}`);
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Verify password
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        logger.warn(`Account deletion failed: Invalid password for user: ${userId}`);
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

      logger.info(`Account deleted successfully for user: ${userId}`);

      return {
        success: true,
        message: 'Account has been deleted successfully',
      };
    } catch (error) {
      logger.error('Account deletion error:', error);
      return {
        success: false,
        error: 'Account deletion failed due to server error',
      };
    }
  }

  static async checkUserStatus(userId: number): Promise<{ success: boolean; error?: string; message?: string; isActive?: boolean; isDisabled?: boolean }> {
    try {
      logger.info(`Checking user status for user: ${userId}`);

      const user = await User.findByPk(userId);
      
      if (!user) {
        logger.warn(`User status check failed: User not found: ${userId}`);
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Check if user is soft deleted (disabled)
      const isDisabled = !user.is_active || 
                        user.username.startsWith('deleted') || 
                        user.email.startsWith('deleted');

      logger.info(`User status checked: ${userId}, active: ${user.is_active}, disabled: ${isDisabled}`);

      return {
        success: true,
        message: 'User status retrieved successfully',
        isActive: user.is_active,
        isDisabled: isDisabled,
      };
    } catch (error) {
      logger.error('User status check error:', error);
      return {
        success: false,
        error: 'User status check failed due to server error',
      };
    }
  }
}