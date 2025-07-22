import { Router } from 'express';
import { PostController } from '../controllers/postController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Search users (public endpoint)
router.get(
  '/search',
  optionalAuth,
  PostController.searchUsers
);

export default router;