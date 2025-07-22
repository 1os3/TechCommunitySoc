import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import Post from '../../src/models/Post';
import Comment from '../../src/models/Comment';
import Like from '../../src/models/Like';

describe('Like Statistics - Core Functionality Tests', () => {
  let testUser: any;
  let authToken: string;
  let testPost: any;

  beforeEach(async () => {
    // Clean up test data
    await Like.destroy({ where: {} });
    await Comment.destroy({ where: {} });
    await Post.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create test user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'statuser',
        email: 'stat@example.com',
        password: 'TestPassword123!',
      })
      .expect(201);

    testUser = registerResponse.body.data.user;

    // Login
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'stat@example.com',
        password: 'TestPassword123!',
      })
      .expect(200);

    authToken = loginResponse.body.data.token;

    // Create test post
    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Post',
        content: 'Test content',
      })
      .expect(201);

    testPost = postResponse.body.data.post;
  });

  describe('User Like Statistics', () => {
    it('should get user like statistics', async () => {
      const response = await request(app)
        .get('/api/v1/likes/user/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      
      const stats = response.body.data.statistics;
      expect(typeof stats.totalLikes).toBe('number');
      expect(typeof stats.postsLiked).toBe('number');
      expect(typeof stats.commentsLiked).toBe('number');
      expect(typeof stats.likesReceived).toBe('number');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/likes/user/statistics')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('Top Liked Content', () => {
    it('should get top liked posts', async () => {
      const response = await request(app)
        .get('/api/v1/likes/top/post?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBeDefined();
      expect(response.body.data.type).toBe('post');
      expect(Array.isArray(response.body.data.content)).toBe(true);
    });

    it('should validate content type', async () => {
      const response = await request(app)
        .get('/api/v1/likes/top/invalid')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_CONTENT_TYPE');
    });
  });

  describe('Most Active Users', () => {
    it('should get most active users', async () => {
      const response = await request(app)
        .get('/api/v1/likes/users/active?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });
  });

  describe('Like Activity Metrics', () => {
    it('should get activity metrics', async () => {
      const response = await request(app)
        .get('/api/v1/likes/metrics/activity?days=7')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
      
      const metrics = response.body.data.metrics;
      expect(metrics.dailyActivity).toBeDefined();
      expect(Array.isArray(metrics.dailyActivity)).toBe(true);
      expect(metrics.summary).toBeDefined();
    });
  });
});