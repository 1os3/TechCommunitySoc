import { Router } from 'express';
import { LikeController } from '../controllers/likeController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Toggle like for a post (authenticated users only)
router.post(
  '/posts/:postId',
  authenticateToken,
  LikeController.togglePostLike
);

// Toggle like for a post (authenticated users only) - alternative endpoint with /toggle suffix
router.post(
  '/posts/:postId/toggle',
  authenticateToken,
  LikeController.togglePostLike
);

// Toggle like for a comment (authenticated users only)
router.post(
  '/comments/:commentId',
  authenticateToken,
  LikeController.toggleCommentLike
);

// Toggle like for a comment (authenticated users only) - alternative endpoint with /toggle suffix
router.post(
  '/comments/:commentId/toggle',
  authenticateToken,
  LikeController.toggleCommentLike
);

// Get like status for a post (authenticated users only)
router.get(
  '/posts/:postId/status',
  authenticateToken,
  LikeController.getPostLikeStatus
);

// Get like status for a comment (authenticated users only)
router.get(
  '/comments/:commentId/status',
  authenticateToken,
  LikeController.getCommentLikeStatus
);

// Get batch like status for multiple targets (authenticated users only)
router.post(
  '/batch/status',
  authenticateToken,
  LikeController.getBatchLikeStatus
);

// Get like count for a post (public endpoint)
router.get(
  '/posts/:postId/count',
  optionalAuth,
  LikeController.getPostLikeCount
);

// Get like count for a comment (public endpoint)
router.get(
  '/comments/:commentId/count',
  optionalAuth,
  LikeController.getCommentLikeCount
);

// Get user's liked posts (authenticated users only)
router.get(
  '/user/posts',
  authenticateToken,
  LikeController.getUserLikedPosts
);

// Get user's liked comments (authenticated users only)
router.get(
  '/user/comments',
  authenticateToken,
  LikeController.getUserLikedComments
);

// Get user's like statistics (authenticated users only)
router.get(
  '/user/statistics',
  authenticateToken,
  LikeController.getUserLikeStatistics
);

// Get top liked content (public endpoint)
router.get(
  '/top/:type',
  optionalAuth,
  LikeController.getTopLikedContent
);

// Get most active users (public endpoint)
router.get(
  '/users/active',
  optionalAuth,
  LikeController.getMostActiveUsers
);

// Get like activity metrics (public endpoint)
router.get(
  '/metrics/activity',
  optionalAuth,
  LikeController.getLikeActivityMetrics
);

export default router;