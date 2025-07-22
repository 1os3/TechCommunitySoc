"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const adminService_1 = require("../services/adminService");
const postService_1 = require("../services/postService");
const commentService_1 = require("../services/commentService");
const logService_1 = require("../services/logService");
const logger_1 = __importDefault(require("../utils/logger"));
class AdminController {
    // Create new admin account (site admin only)
    static async createAdmin(req, res) {
        try {
            const { username, email } = req.body;
            const siteAdminId = req.user?.id;
            if (!siteAdminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            if (!username || !email) {
                res.status(400).json({
                    success: false,
                    error: 'Username and email are required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await adminService_1.AdminService.createAdminAccount(siteAdminId, { username, email });
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: result.message,
                    data: {
                        user: result.user?.toSafeJSON(),
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Create admin controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Delete admin account (site admin only)
    static async deleteAdmin(req, res) {
        try {
            const { adminId } = req.params;
            const siteAdminId = req.user?.id;
            if (!siteAdminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const targetAdminId = parseInt(adminId);
            if (isNaN(targetAdminId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid admin ID',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await adminService_1.AdminService.deleteAdminAccount(siteAdminId, targetAdminId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 :
                    result.error?.includes('not found') ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Delete admin controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Get list of admin accounts (admin access required)
    static async getAdmins(req, res) {
        try {
            const requestingUserId = req.user?.id;
            if (!requestingUserId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await adminService_1.AdminService.getAdminAccounts(requestingUserId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        admins: result.users?.map(user => user.toSafeJSON()),
                        total: result.users?.length || 0,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Get admins controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Get current user's admin status
    static async getAdminStatus(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const isAdmin = await adminService_1.AdminService.verifyAdminAccess(userId);
            const isSiteAdmin = await adminService_1.AdminService.verifySiteAdminAccess(userId);
            res.status(200).json({
                success: true,
                data: {
                    isAdmin,
                    isSiteAdmin,
                    userId,
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get admin status controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Admin delete post (admin access required)
    static async deletePost(req, res) {
        try {
            const { postId } = req.params;
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const postIdNum = parseInt(postId);
            if (isNaN(postIdNum)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid post ID',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await postService_1.PostService.adminDeletePost(postIdNum, adminId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('not found') ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Admin delete post controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Admin delete comment (admin access required)
    static async deleteComment(req, res) {
        try {
            const { commentId } = req.params;
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const commentIdNum = parseInt(commentId);
            if (isNaN(commentIdNum)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid comment ID',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await commentService_1.CommentService.adminDeleteComment(commentIdNum, adminId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('not found') ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Admin delete comment controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Admin delete user (admin access required)
    static async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const userIdNum = parseInt(userId);
            if (isNaN(userIdNum)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await adminService_1.AdminService.deleteUserAccount(adminId, userIdNum);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 :
                    result.error?.includes('not found') ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Admin delete user controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Enable user account (admin access required)
    static async enableUser(req, res) {
        try {
            const { userId } = req.params;
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const userIdNum = parseInt(userId);
            if (isNaN(userIdNum)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await adminService_1.AdminService.enableUserAccount(adminId, userIdNum);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 :
                    result.error?.includes('not found') ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Admin enable user controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Restore soft deleted user account (admin access required)
    static async restoreUser(req, res) {
        try {
            const { userId } = req.params;
            const { username, email } = req.body;
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const userIdNum = parseInt(userId);
            if (isNaN(userIdNum)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await adminService_1.AdminService.restoreUserAccount(adminId, userIdNum, username, email);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 :
                    result.error?.includes('not found') ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Admin restore user controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Get soft deleted users (admin access required)
    static async getSoftDeletedUsers(req, res) {
        try {
            const adminId = req.user?.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const searchQuery = req.query.q;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await adminService_1.AdminService.getSoftDeletedUserList(adminId, page, limit, searchQuery);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        users: result.users?.map(user => user.toSafeJSON()),
                        page,
                        limit,
                        total: result.total || 0,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Get soft deleted users controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Get user list (admin access required)
    static async getUsers(req, res) {
        try {
            const adminId = req.user?.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await adminService_1.AdminService.getUserList(adminId, page, limit);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        users: result.users?.map(user => user.toSafeJSON()),
                        page,
                        limit,
                        total: result.total || 0,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Get users controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Get system logs (admin access required)
    static async getSystemLogs(req, res) {
        try {
            const adminId = req.user?.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const level = req.query.level;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await logService_1.LogService.getSystemLogs(adminId, page, limit, level, startDate, endDate);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        logs: result.logs,
                        page,
                        limit,
                        total: result.total,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Get system logs controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Get error logs (admin access required)
    static async getErrorLogs(req, res) {
        try {
            const adminId = req.user?.id;
            const limit = parseInt(req.query.limit) || 50;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await logService_1.LogService.getErrorLogs(adminId, limit);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        logs: result.logs,
                        total: result.total,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Get error logs controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Get admin activity logs (admin access required)
    static async getAdminActivityLogs(req, res) {
        try {
            const adminId = req.user?.id;
            const limit = parseInt(req.query.limit) || 100;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await logService_1.LogService.getAdminActivityLogs(adminId, limit);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        logs: result.logs,
                        total: result.total,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Get admin activity logs controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Clear logs (admin access required)
    static async clearLogs(req, res) {
        try {
            const adminId = req.user?.id;
            const olderThanDays = parseInt(req.body.olderThanDays) || 30;
            const level = req.body.level;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await logService_1.LogService.clearLogs(adminId, olderThanDays, level);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        removedCount: result.total,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Clear logs controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Clear all logs (admin access required)
    static async clearAllLogs(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await logService_1.LogService.clearAllLogs(adminId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        removedCount: result.total,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Clear all logs controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map