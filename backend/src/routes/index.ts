import { Router } from 'express';
import authRoutes from './auth';
import postRoutes from './posts';
import commentRoutes from './comments';
import likeRoutes from './likes';
import hotnessRoutes from './hotness';
import userBehaviorRoutes from './userBehavior';
import userRoutes from './users';
import notificationRoutes from './notifications';
import adminRoutes from './adminRoutes';

const router = Router();

// API version prefix
const API_VERSION = '/api/v1';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/posts`, postRoutes);
router.use(`${API_VERSION}/comments`, commentRoutes);
router.use(`${API_VERSION}/likes`, likeRoutes);
router.use(`${API_VERSION}/hotness`, hotnessRoutes);
router.use(`${API_VERSION}/behavior`, userBehaviorRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/notifications`, notificationRoutes);
router.use(`${API_VERSION}/admin`, adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API info endpoint
router.get(`${API_VERSION}/info`, (req, res) => {
  res.status(200).json({
    name: 'Tech Community SOC API',
    version: '1.0.0',
    description: 'Forum system API with user authentication, posts, comments, and recommendations',
    endpoints: {
      authentication: `${API_VERSION}/auth`,
      posts: `${API_VERSION}/posts`,
      comments: `${API_VERSION}/comments`,
      likes: `${API_VERSION}/likes`,
      hotness: `${API_VERSION}/hotness`,
      behavior: `${API_VERSION}/behavior`,
      users: `${API_VERSION}/users`,
      notifications: `${API_VERSION}/notifications`,
      admin: `${API_VERSION}/admin`,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;