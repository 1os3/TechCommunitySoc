"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const likeController_1 = require("../controllers/likeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Toggle like for a post (authenticated users only)
router.post('/posts/:postId', auth_1.authenticateToken, likeController_1.LikeController.togglePostLike);
// Toggle like for a post (authenticated users only) - alternative endpoint with /toggle suffix
router.post('/posts/:postId/toggle', auth_1.authenticateToken, likeController_1.LikeController.togglePostLike);
// Toggle like for a comment (authenticated users only)
router.post('/comments/:commentId', auth_1.authenticateToken, likeController_1.LikeController.toggleCommentLike);
// Toggle like for a comment (authenticated users only) - alternative endpoint with /toggle suffix
router.post('/comments/:commentId/toggle', auth_1.authenticateToken, likeController_1.LikeController.toggleCommentLike);
// Get like status for a post (authenticated users only)
router.get('/posts/:postId/status', auth_1.authenticateToken, likeController_1.LikeController.getPostLikeStatus);
// Get like status for a comment (authenticated users only)
router.get('/comments/:commentId/status', auth_1.authenticateToken, likeController_1.LikeController.getCommentLikeStatus);
// Get batch like status for multiple targets (authenticated users only)
router.post('/batch/status', auth_1.authenticateToken, likeController_1.LikeController.getBatchLikeStatus);
// Get like count for a post (public endpoint)
router.get('/posts/:postId/count', auth_1.optionalAuth, likeController_1.LikeController.getPostLikeCount);
// Get like count for a comment (public endpoint)
router.get('/comments/:commentId/count', auth_1.optionalAuth, likeController_1.LikeController.getCommentLikeCount);
// Get user's liked posts (authenticated users only)
router.get('/user/posts', auth_1.authenticateToken, likeController_1.LikeController.getUserLikedPosts);
// Get user's liked comments (authenticated users only)
router.get('/user/comments', auth_1.authenticateToken, likeController_1.LikeController.getUserLikedComments);
// Get user's like statistics (authenticated users only)
router.get('/user/statistics', auth_1.authenticateToken, likeController_1.LikeController.getUserLikeStatistics);
// Get top liked content (public endpoint)
router.get('/top/:type', auth_1.optionalAuth, likeController_1.LikeController.getTopLikedContent);
// Get most active users (public endpoint)
router.get('/users/active', auth_1.optionalAuth, likeController_1.LikeController.getMostActiveUsers);
// Get like activity metrics (public endpoint)
router.get('/metrics/activity', auth_1.optionalAuth, likeController_1.LikeController.getLikeActivityMetrics);
exports.default = router;
//# sourceMappingURL=likes.js.map