import User from '../models/User';
import { AuthService } from './authService';
import logger from '../utils/logger';
import { Op } from 'sequelize';

export interface AdminResult {
  success: boolean;
  user?: User;
  users?: User[];
  total?: number;
  message?: string;
  error?: string;
}

export interface CreateAdminData {
  username: string;
  email: string;
}

export class AdminService {
  // Site admin can create new admin accounts
  static async createAdminAccount(siteAdminId: number, adminData: CreateAdminData): Promise<AdminResult> {
    try {
      logger.info(`Site admin ${siteAdminId} attempting to create admin account: ${adminData.email}`);

      // Verify the requesting user is a site admin
      const siteAdmin = await User.findByPk(siteAdminId);
      if (!siteAdmin || !siteAdmin.isSiteAdmin()) {
        logger.warn(`Unauthorized admin creation attempt by user: ${siteAdminId}`);
        return {
          success: false,
          error: 'Unauthorized: Only site admin can create admin accounts',
        };
      }

      // Validate that the new account follows admin pattern
      if (!User.isAdminCredentials(adminData.username, adminData.email)) {
        logger.warn(`Invalid admin credentials pattern for: ${adminData.email}`);
        return {
          success: false,
          error: 'Invalid admin credentials pattern',
        };
      }

      // Check if admin already exists
      const existingAdmin = await User.findOne({
        where: {
          email: adminData.email,
        },
      });

      if (existingAdmin) {
        logger.warn(`Admin creation failed: Email ${adminData.email} already exists`);
        return {
          success: false,
          error: 'Admin account with this email already exists',
        };
      }

      // Check if username is taken
      const existingUsername = await User.findOne({
        where: {
          username: adminData.username,
        },
      });

      if (existingUsername) {
        logger.warn(`Admin creation failed: Username ${adminData.username} already exists`);
        return {
          success: false,
          error: 'Username is already taken',
        };
      }

      // Create admin account with default admin password
      const adminPassword = User.getAdminPassword();
      const user = await User.create({
        username: adminData.username,
        email: adminData.email,
        password_hash: adminPassword,
        is_verified: true,
        is_active: true,
        is_admin: true,
        role: 'admin',
      });

      logger.info(`Admin account created successfully: ${user.id} by site admin: ${siteAdminId}`);

      return {
        success: true,
        user,
        message: 'Admin account created successfully',
      };
    } catch (error) {
      logger.error('Admin account creation error:', error);
      return {
        success: false,
        error: 'Admin account creation failed due to server error',
      };
    }
  }

  // Site admin can delete admin accounts (but not other site admins)
  static async deleteAdminAccount(siteAdminId: number, targetAdminId: number): Promise<AdminResult> {
    try {
      logger.info(`Site admin ${siteAdminId} attempting to delete admin account: ${targetAdminId}`);

      // Verify the requesting user is a site admin
      const siteAdmin = await User.findByPk(siteAdminId);
      if (!siteAdmin || !siteAdmin.isSiteAdmin()) {
        logger.warn(`Unauthorized admin deletion attempt by user: ${siteAdminId}`);
        return {
          success: false,
          error: 'Unauthorized: Only site admin can delete admin accounts',
        };
      }

      // Find the target admin
      const targetAdmin = await User.findByPk(targetAdminId);
      if (!targetAdmin) {
        logger.warn(`Admin deletion failed: Target admin not found: ${targetAdminId}`);
        return {
          success: false,
          error: 'Admin account not found',
        };
      }

      // Prevent deletion of site admin accounts
      if (targetAdmin.isSiteAdmin()) {
        logger.warn(`Attempted to delete site admin account: ${targetAdminId}`);
        return {
          success: false,
          error: 'Cannot delete site admin account',
        };
      }

      // Prevent deletion of non-admin accounts through this endpoint
      if (!targetAdmin.isAdmin()) {
        logger.warn(`Attempted to delete non-admin account through admin endpoint: ${targetAdminId}`);
        return {
          success: false,
          error: 'Target account is not an admin',
        };
      }

      // Soft delete the admin account
      const timestamp = Date.now();
      await targetAdmin.update({
        is_active: false,
        email: `deleted${timestamp}@deleted.com`,
        username: `deleted${timestamp}`,
      });

      logger.info(`Admin account deleted successfully: ${targetAdminId} by site admin: ${siteAdminId}`);

      return {
        success: true,
        message: 'Admin account deleted successfully',
      };
    } catch (error) {
      logger.error('Admin account deletion error:', error);
      return {
        success: false,
        error: 'Admin account deletion failed due to server error',
      };
    }
  }

  // Get list of all admin accounts (accessible by admins)
  static async getAdminAccounts(requestingUserId: number): Promise<AdminResult> {
    try {
      logger.info(`Admin list request by user: ${requestingUserId}`);

      // Verify the requesting user is an admin
      const requestingUser = await User.findByPk(requestingUserId);
      if (!requestingUser || !requestingUser.isAdmin()) {
        logger.warn(`Unauthorized admin list request by user: ${requestingUserId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      // Get all admin accounts
      const adminUsers = await User.findAll({
        where: {
          role: 'admin',
          is_active: true,
        },
        attributes: ['id', 'username', 'email', 'is_admin', 'role', 'created_at', 'last_login'],
        order: [['created_at', 'DESC']],
      });

      logger.info(`Admin list retrieved: ${adminUsers.length} admins found`);

      return {
        success: true,
        users: adminUsers,
        message: 'Admin accounts retrieved successfully',
      };
    } catch (error) {
      logger.error('Admin list retrieval error:', error);
      return {
        success: false,
        error: 'Failed to retrieve admin accounts',
      };
    }
  }

  // Verify admin privileges for middleware use
  static async verifyAdminAccess(userId: number): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      return user ? user.isAdmin() : false;
    } catch (error) {
      logger.error('Admin verification error:', error);
      return false;
    }
  }

  // Verify site admin privileges for middleware use
  static async verifySiteAdminAccess(userId: number): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      return user ? user.isSiteAdmin() : false;
    } catch (error) {
      logger.error('Site admin verification error:', error);
      return false;
    }
  }

  // Admin delete user account (soft delete - admin access required)
  static async deleteUserAccount(adminId: number, targetUserId: number): Promise<AdminResult> {
    try {
      logger.info(`Admin ${adminId} attempting to soft delete user account: ${targetUserId}`);

      // Verify the requesting user is an admin
      const admin = await User.findByPk(adminId);
      if (!admin || !admin.isAdmin()) {
        logger.warn(`Unauthorized user deletion attempt by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      // Find the target user
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser) {
        logger.warn(`User deletion failed: Target user not found: ${targetUserId}`);
        return {
          success: false,
          error: 'User account not found',
        };
      }

      // Prevent deletion of admin accounts through this endpoint
      if (targetUser.isAdmin()) {
        logger.warn(`Attempted to delete admin account through user endpoint: ${targetUserId}`);
        return {
          success: false,
          error: 'Cannot delete admin accounts through this endpoint. Use admin deletion endpoint.',
        };
      }

      // Prevent admin from deleting themselves through this endpoint
      if (targetUserId === adminId) {
        logger.warn(`Admin attempted to delete their own account: ${adminId}`);
        return {
          success: false,
          error: 'Cannot delete your own account through this endpoint',
        };
      }

      // Soft delete by adding prefix to avoid conflicts while preserving original info
      await targetUser.update({
        is_active: false,
        email: `deleted${targetUser.email}`,
        username: `deleted${targetUser.username}`,
      });

      logger.info(`User account soft deleted successfully: ${targetUserId} by admin: ${adminId}`);

      return {
        success: true,
        message: 'User account disabled successfully',
        user: targetUser,
      };
    } catch (error) {
      logger.error('User account deletion error:', error);
      return {
        success: false,
        error: 'User account deletion failed due to server error',
      };
    }
  }

  // Admin enable user account (admin access required)
  static async enableUserAccount(adminId: number, targetUserId: number): Promise<AdminResult> {
    try {
      logger.info(`Admin ${adminId} attempting to enable user account: ${targetUserId}`);

      // Verify the requesting user is an admin
      const admin = await User.findByPk(adminId);
      if (!admin || !admin.isAdmin()) {
        logger.warn(`Unauthorized user enable attempt by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      // Find the target user
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser) {
        logger.warn(`User enable failed: Target user not found: ${targetUserId}`);
        return {
          success: false,
          error: 'User account not found',
        };
      }

      // Prevent enabling admin accounts through this endpoint
      if (targetUser.isAdmin()) {
        logger.warn(`Attempted to enable admin account through user endpoint: ${targetUserId}`);
        return {
          success: false,
          error: 'Cannot enable admin accounts through this endpoint',
        };
      }

      // Check if user is already active
      if (targetUser.is_active) {
        return {
          success: false,
          error: 'User account is already active',
        };
      }

      // Enable the user account
      await targetUser.update({
        is_active: true,
      });

      logger.info(`User account enabled successfully: ${targetUserId} by admin: ${adminId}`);

      return {
        success: true,
        message: 'User account enabled successfully',
        user: targetUser,
      };
    } catch (error) {
      logger.error('User account enable error:', error);
      return {
        success: false,
        error: 'User account enable failed due to server error',
      };
    }
  }

  // Get list of all users (admin access required)
  static async getUserList(adminId: number, page: number = 1, limit: number = 20): Promise<AdminResult> {
    try {
      logger.info(`User list request by admin: ${adminId}, page: ${page}, limit: ${limit}`);

      // Verify the requesting user is an admin
      const admin = await User.findByPk(adminId);
      if (!admin || !admin.isAdmin()) {
        logger.warn(`Unauthorized user list request by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      const offset = (page - 1) * limit;

      // Get all users (excluding soft-deleted ones - those with deleted prefix)
      const users = await User.findAll({
        where: {
          [Op.and]: [
            {
              email: {
                [Op.notLike]: 'deleted%'
              }
            },
            {
              username: {
                [Op.notLike]: 'deleted%'
              }
            }
          ]
        },
        attributes: ['id', 'username', 'email', 'is_verified', 'is_admin', 'is_active', 'role', 'created_at', 'last_login'],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      // Get total count for pagination
      const total = await User.count({
        where: {
          [Op.and]: [
            {
              email: {
                [Op.notLike]: 'deleted%'
              }
            },
            {
              username: {
                [Op.notLike]: 'deleted%'
              }
            }
          ]
        },
      });

      logger.info(`User list retrieved: ${users.length} users found, total: ${total}`);

      return {
        success: true,
        users,
        total,
        message: `Users retrieved successfully. Page ${page}, showing ${users.length} of ${total} users.`,
      };
    } catch (error) {
      logger.error('User list retrieval error:', error);
      return {
        success: false,
        error: 'Failed to retrieve user list',
      };
    }
  }

  // Admin restore soft deleted user account (admin access required)
  static async restoreUserAccount(adminId: number, targetUserId: number, newUsername?: string, newEmail?: string): Promise<AdminResult> {
    try {
      logger.info(`Admin ${adminId} attempting to restore user account: ${targetUserId}`);

      // Verify the requesting user is an admin
      const admin = await User.findByPk(adminId);
      if (!admin || !admin.isAdmin()) {
        logger.warn(`Unauthorized user restore attempt by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      // Find the target user (including soft deleted ones)
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser) {
        logger.warn(`User restore failed: Target user not found: ${targetUserId}`);
        return {
          success: false,
          error: 'User account not found',
        };
      }

      // Check if user is actually soft deleted
      if (!targetUser.email.startsWith('deleted') || !targetUser.username.startsWith('deleted')) {
        return {
          success: false,
          error: 'User account is not in deleted state',
        };
      }

      // Prepare restoration data
      let restoreData: any = {
        is_active: true,
      };

      // If new username and email provided, use them; otherwise restore original
      if (newUsername && newEmail) {
        // Check if new username/email are available
        const existingUser = await User.findOne({
          where: {
            [Op.or]: [
              { username: newUsername },
              { email: newEmail }
            ]
          }
        });

        if (existingUser && existingUser.id !== targetUserId) {
          return {
            success: false,
            error: 'Username or email already exists',
          };
        }

        restoreData.username = newUsername;
        restoreData.email = newEmail;
      } else {
        // Restore original username and email by removing deleted prefix
        const originalUsername = targetUser.username.startsWith('deleted') ? targetUser.username.substring(7) : targetUser.username;
        const originalEmail = targetUser.email.startsWith('deleted') ? targetUser.email.substring(7) : targetUser.email;

        // Check if original username/email are now available
        const existingUser = await User.findOne({
          where: {
            [Op.or]: [
              { username: originalUsername },
              { email: originalEmail }
            ]
          }
        });

        if (existingUser && existingUser.id !== targetUserId) {
          // If original is taken, add restored prefix with timestamp
          const timestamp = Date.now();
          restoreData.username = `restored${timestamp}`;
          restoreData.email = `restored${timestamp}@restored.com`;
        } else {
          // Add restored prefix to show the user was restored
          restoreData.username = `restored${originalUsername}`;
          restoreData.email = `restored${originalEmail}`;
        }
      }

      // Restore the user account
      await targetUser.update(restoreData);

      logger.info(`User account restored successfully: ${targetUserId} by admin: ${adminId}`);

      return {
        success: true,
        message: 'User account restored successfully',
        user: targetUser,
      };
    } catch (error) {
      logger.error('User account restore error:', error);
      return {
        success: false,
        error: 'User account restore failed due to server error',
      };
    }
  }

  // Get list of soft deleted users (admin access required)
  static async getSoftDeletedUserList(adminId: number, page: number = 1, limit: number = 20, searchQuery?: string): Promise<AdminResult> {
    try {
      logger.info(`Soft deleted user list request by admin: ${adminId}, page: ${page}, limit: ${limit}`);

      // Verify the requesting user is an admin
      const admin = await User.findByPk(adminId);
      if (!admin || !admin.isAdmin()) {
        logger.warn(`Unauthorized soft deleted user list request by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      const offset = (page - 1) * limit;

      // Build where condition for soft deleted users
      let whereCondition: any = {
        [Op.or]: [
          {
            email: {
              [Op.like]: 'deleted%'
            }
          },
          {
            username: {
              [Op.like]: 'deleted%'
            }
          }
        ]
      };

      // Add search condition if search query is provided
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = searchQuery.trim();
        whereCondition = {
          [Op.and]: [
            whereCondition,
            {
              [Op.or]: [
                {
                  username: {
                    [Op.iLike]: `%${searchTerm}%`
                  }
                },
                {
                  email: {
                    [Op.iLike]: `%${searchTerm}%`
                  }
                }
              ]
            }
          ]
        };
      }

      // Get soft deleted users (those with deleted prefix)
      const users = await User.findAll({
        where: whereCondition,
        attributes: ['id', 'username', 'email', 'is_verified', 'is_admin', 'is_active', 'role', 'created_at', 'last_login'],
        order: [['updated_at', 'DESC']], // Show recently deleted first
        limit,
        offset,
      });

      // Get total count for pagination
      const total = await User.count({
        where: whereCondition,
      });

      logger.info(`Soft deleted user list retrieved: ${users.length} users found, total: ${total}`);

      return {
        success: true,
        users,
        total,
        message: `Soft deleted users retrieved successfully. Page ${page}, showing ${users.length} of ${total} users.`,
      };
    } catch (error) {
      logger.error('Soft deleted user list retrieval error:', error);
      return {
        success: false,
        error: 'Failed to retrieve soft deleted user list',
      };
    }
  }

  // Get list of disabled users (admin access required)
  static async getDisabledUserList(adminId: number, page: number = 1, limit: number = 20): Promise<AdminResult> {
    try {
      logger.info(`Disabled user list request by admin: ${adminId}, page: ${page}, limit: ${limit}`);

      // Verify the requesting user is an admin
      const admin = await User.findByPk(adminId);
      if (!admin || !admin.isAdmin()) {
        logger.warn(`Unauthorized disabled user list request by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      const offset = (page - 1) * limit;

      // Get disabled users (excluding permanently deleted ones)
      const users = await User.findAll({
        where: {
          is_active: false,
          email: {
            [Op.notLike]: 'deleted%@deleted.com'
          }
        },
        attributes: ['id', 'username', 'email', 'is_verified', 'is_admin', 'is_active', 'role', 'created_at', 'last_login'],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      // Get total count for pagination
      const total = await User.count({
        where: {
          is_active: false,
          email: {
            [Op.notLike]: 'deleted%@deleted.com'
          }
        },
      });

      logger.info(`Disabled user list retrieved: ${users.length} users found, total: ${total}`);

      return {
        success: true,
        users,
        total,
        message: `Disabled users retrieved successfully. Page ${page}, showing ${users.length} of ${total} users.`,
      };
    } catch (error) {
      logger.error('Disabled user list retrieval error:', error);
      return {
        success: false,
        error: 'Failed to retrieve disabled user list',
      };
    }
  }
}