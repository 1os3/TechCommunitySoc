"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAdminStatus = exports.requireSiteAdmin = exports.requireAdmin = void 0;
const adminService_1 = require("../services/adminService");
const logger_1 = __importDefault(require("../utils/logger"));
// Middleware to require admin access
const requireAdmin = async (req, res, next) => {
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
        if (!isAdmin) {
            logger_1.default.warn(`Unauthorized admin access attempt by user: ${userId}`);
            res.status(403).json({
                success: false,
                error: 'Admin access required',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        logger_1.default.info(`Admin access granted to user: ${userId}`);
        next();
    }
    catch (error) {
        logger_1.default.error('Admin auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            timestamp: new Date().toISOString(),
        });
    }
};
exports.requireAdmin = requireAdmin;
// Middleware to require site admin access
const requireSiteAdmin = async (req, res, next) => {
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
        const isSiteAdmin = await adminService_1.AdminService.verifySiteAdminAccess(userId);
        if (!isSiteAdmin) {
            logger_1.default.warn(`Unauthorized site admin access attempt by user: ${userId}`);
            res.status(403).json({
                success: false,
                error: 'Site admin access required',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        logger_1.default.info(`Site admin access granted to user: ${userId}`);
        next();
    }
    catch (error) {
        logger_1.default.error('Site admin auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            timestamp: new Date().toISOString(),
        });
    }
};
exports.requireSiteAdmin = requireSiteAdmin;
// Middleware to add admin status to request (optional, doesn't block)
const addAdminStatus = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (userId) {
            const isAdmin = await adminService_1.AdminService.verifyAdminAccess(userId);
            const isSiteAdmin = await adminService_1.AdminService.verifySiteAdminAccess(userId);
            // Add admin status as additional properties
            req.isAdmin = isAdmin;
            req.isSiteAdmin = isSiteAdmin;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Add admin status middleware error:', error);
        // Don't block the request, just log the error
        next();
    }
};
exports.addAdminStatus = addAdminStatus;
//# sourceMappingURL=adminAuth.js.map