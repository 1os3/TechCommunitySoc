"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const adminAuth_1 = require("../middleware/adminAuth");
const contentController_1 = require("../controllers/contentController");
const router = (0, express_1.Router)();
// All admin routes require authentication
router.use(auth_1.authenticateToken);
// Get current user's admin status (any authenticated user)
router.get('/status', adminController_1.AdminController.getAdminStatus);
// Get list of admin accounts (admin access required)
router.get('/list', adminAuth_1.requireAdmin, adminController_1.AdminController.getAdmins);
// Create new admin account (site admin only)
router.post('/create', adminAuth_1.requireSiteAdmin, adminController_1.AdminController.createAdmin);
// Delete admin account (site admin only)
router.delete('/admin/:adminId', adminAuth_1.requireSiteAdmin, adminController_1.AdminController.deleteAdmin);
// Content management (admin access required)
router.delete('/posts/:postId', adminAuth_1.requireAdmin, adminController_1.AdminController.deletePost);
router.delete('/comments/:commentId', adminAuth_1.requireAdmin, adminController_1.AdminController.deleteComment);
// User management (admin access required)
router.get('/users', adminAuth_1.requireAdmin, adminController_1.AdminController.getUsers);
router.get('/users/soft-deleted', adminAuth_1.requireAdmin, adminController_1.AdminController.getSoftDeletedUsers);
router.delete('/users/:userId', adminAuth_1.requireAdmin, adminController_1.AdminController.deleteUser);
router.put('/users/:userId/enable', adminAuth_1.requireAdmin, adminController_1.AdminController.enableUser);
router.put('/users/:userId/restore', adminAuth_1.requireAdmin, adminController_1.AdminController.restoreUser);
// System logs (admin access required)
router.get('/logs/system', adminAuth_1.requireAdmin, adminController_1.AdminController.getSystemLogs);
router.get('/logs/errors', adminAuth_1.requireAdmin, adminController_1.AdminController.getErrorLogs);
router.get('/logs/admin-activity', adminAuth_1.requireAdmin, adminController_1.AdminController.getAdminActivityLogs);
router.delete('/logs/clear', adminAuth_1.requireAdmin, adminController_1.AdminController.clearLogs);
router.delete('/logs/clear-all', adminAuth_1.requireAdmin, adminController_1.AdminController.clearAllLogs);
// Content management (admin access required)
router.get('/content/posts', adminAuth_1.requireAdmin, contentController_1.ContentController.getPosts);
router.get('/content/comments', adminAuth_1.requireAdmin, contentController_1.ContentController.getComments);
// Violation management (admin access required)
router.get('/violations', adminAuth_1.requireAdmin, contentController_1.ContentController.getViolations);
router.put('/violations/:violationId/status', adminAuth_1.requireAdmin, contentController_1.ContentController.updateViolationStatus);
router.get('/violations/stats', adminAuth_1.requireAdmin, contentController_1.ContentController.getViolationStats);
// Violation words management (admin access required)
router.get('/violation-words', adminAuth_1.requireAdmin, contentController_1.ContentController.getViolationWords);
router.post('/violation-words', adminAuth_1.requireAdmin, contentController_1.ContentController.addViolationWord);
router.delete('/violation-words/:wordId', adminAuth_1.requireAdmin, contentController_1.ContentController.removeViolationWord);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map