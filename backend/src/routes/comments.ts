import { Router } from 'express';
import { CommentController } from '../controllers/commentController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { commentCreationSchema, commentUpdateSchema } from '../utils/validation';

const router = Router();

// Create a new comment for a post (authenticated users only)
router.post(
  '/posts/:postId',
  authenticateToken,
  validateRequest(commentCreationSchema),
  CommentController.createComment
);

// Get all comments for a specific post (public endpoint)
router.get(
  '/posts/:postId',
  optionalAuth,
  CommentController.getPostComments
);

// Get comments with hierarchical tree structure (public endpoint)
router.get(
  '/posts/:postId/tree',
  optionalAuth,
  CommentController.getPostCommentsTree
);

// Get comments in flattened structure with level indicators (public endpoint)
router.get(
  '/posts/:postId/flattened',
  optionalAuth,
  CommentController.getPostCommentsFlattened
);

// Get sorted comments with different strategies (public endpoint)
router.get(
  '/posts/:postId/sorted',
  optionalAuth,
  CommentController.getPostCommentsSorted
);

// Get a specific comment by ID (public endpoint)
router.get(
  '/:id',
  optionalAuth,
  CommentController.getComment
);

// Get replies to a specific comment (public endpoint)
router.get(
  '/:id/replies',
  optionalAuth,
  CommentController.getCommentReplies
);

// Update a specific comment (authenticated users only, author only)
router.put(
  '/:id',
  authenticateToken,
  validateRequest(commentUpdateSchema),
  CommentController.updateComment
);

// Delete a specific comment (authenticated users only, author only)
router.delete(
  '/:id',
  authenticateToken,
  CommentController.deleteComment
);

// Get comments by a specific user (public endpoint)
router.get(
  '/user/:userId',
  optionalAuth,
  CommentController.getUserComments
);

export default router;