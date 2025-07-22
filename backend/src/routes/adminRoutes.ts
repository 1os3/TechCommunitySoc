import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin, requireSiteAdmin } from '../middleware/adminAuth';
import { ContentController } from '../controllers/contentController';

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);

// Get current user's admin status (any authenticated user)
router.get('/status', AdminController.getAdminStatus);

// Get list of admin accounts (admin access required)
router.get('/list', requireAdmin, AdminController.getAdmins);

// Create new admin account (site admin only)
router.post('/create', requireSiteAdmin, AdminController.createAdmin);

// Delete admin account (site admin only)
router.delete('/admin/:adminId', requireSiteAdmin, AdminController.deleteAdmin);

// Content management (admin access required)
router.delete('/posts/:postId', requireAdmin, AdminController.deletePost);
router.delete('/comments/:commentId', requireAdmin, AdminController.deleteComment);

// User management (admin access required)
router.get('/users', requireAdmin, AdminController.getUsers);
router.get('/users/soft-deleted', requireAdmin, AdminController.getSoftDeletedUsers);
router.delete('/users/:userId', requireAdmin, AdminController.deleteUser);
router.put('/users/:userId/enable', requireAdmin, AdminController.enableUser);
router.put('/users/:userId/restore', requireAdmin, AdminController.restoreUser);

// System logs (admin access required)
router.get('/logs/system', requireAdmin, AdminController.getSystemLogs);
router.get('/logs/errors', requireAdmin, AdminController.getErrorLogs);
router.get('/logs/admin-activity', requireAdmin, AdminController.getAdminActivityLogs);
router.delete('/logs/clear', requireAdmin, AdminController.clearLogs);
router.delete('/logs/clear-all', requireAdmin, AdminController.clearAllLogs);

// Content management (admin access required)
router.get('/content/posts', requireAdmin, ContentController.getPosts);
router.get('/content/comments', requireAdmin, ContentController.getComments);

// Violation management (admin access required)
router.get('/violations', requireAdmin, ContentController.getViolations);
router.put('/violations/:violationId/status', requireAdmin, ContentController.updateViolationStatus);
router.get('/violations/stats', requireAdmin, ContentController.getViolationStats);

// Violation words management (admin access required)
router.get('/violation-words', requireAdmin, ContentController.getViolationWords);
router.post('/violation-words', requireAdmin, ContentController.addViolationWord);
router.delete('/violation-words/:wordId', requireAdmin, ContentController.removeViolationWord);

export default router;