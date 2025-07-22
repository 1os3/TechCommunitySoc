import { Router } from 'express';
import { PostController } from '../controllers/postController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { postCreationSchema, postUpdateSchema } from '../utils/validation';

const router = Router();

// Create a new post (authenticated users only)
router.post(
  '/',
  authenticateToken,
  validateRequest(postCreationSchema),
  PostController.createPost
);

// Search posts (public endpoint)
router.get(
  '/search',
  optionalAuth,
  PostController.searchPosts
);

// Get all posts (public endpoint with optional authentication for enhanced features)
router.get(
  '/',
  optionalAuth,
  PostController.getPostList
);

// Get hot/trending posts (public endpoint)
router.get(
  '/hot',
  PostController.getHotPosts
);

// Get a specific post by ID (public endpoint, but view count incremented if ?view=true)
router.get(
  '/:id',
  optionalAuth,
  PostController.getPost
);

// Update a specific post (authenticated users only, author only)
router.put(
  '/:id',
  authenticateToken,
  validateRequest(postUpdateSchema),
  PostController.updatePost
);

// Delete a specific post (authenticated users only, author only)
router.delete(
  '/:id',
  authenticateToken,
  PostController.deletePost
);

// Get posts by a specific user (public endpoint)
router.get(
  '/user/:userId',
  PostController.getUserPosts
);

export default router;