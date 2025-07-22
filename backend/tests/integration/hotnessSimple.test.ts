import request from 'supertest';
import app from '../../src/index';
import HotnessService from '../../src/services/hotnessService';

describe('Hotness System - Simple Tests', () => {
  let user: any;
  let token: string;
  let post: any;

  beforeEach(async () => {
    // Create test user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
      .expect(201);

    user = registerResponse.body.data.user;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
      .expect(200);

    token = loginResponse.body.data.token;

    // Create a test post
    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Post',
        content: 'This is a test post for hotness calculation'
      })
      .expect(201);

    post = postResponse.body.data.post;
  });

  describe('Basic HotnessService', () => {
    it('should calculate hotness for a new post', async () => {
      const result = await HotnessService.calculatePostHotness(post.id);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.postId).toBe(post.id);
      expect(result.result!.score).toBe(0); // New post with no activity
      expect(result.result!.factors.likes).toBe(0);
      expect(result.result!.factors.comments).toBe(0);
      expect(result.result!.factors.views).toBe(0);
    });

    it('should return error for non-existent post', async () => {
      const result = await HotnessService.calculatePostHotness(99999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Post not found');
    });

    it('should validate configuration', () => {
      const validConfig = {
        likeWeight: 2.0,
        commentWeight: 3.0,
        viewWeight: 0.1,
        gravity: 1.8,
        baseHours: 2
      };

      const result = HotnessService.validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle empty post array', async () => {
      const result = await HotnessService.batchUpdateHotness([]);
      
      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
      expect(result.failed).toEqual([]);
    });
  });

  describe('Hotness API', () => {
    it('should return configuration', async () => {
      const response = await request(app)
        .get('/api/v1/hotness/config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.config).toBeDefined();
      expect(response.body.data.config).toHaveProperty('likeWeight');
      expect(response.body.data.config).toHaveProperty('commentWeight');
      expect(response.body.data.config).toHaveProperty('viewWeight');
      expect(response.body.data.config).toHaveProperty('gravity');
      expect(response.body.data.config).toHaveProperty('baseHours');
    });

    it('should return hot posts', async () => {
      const response = await request(app)
        .get('/api/v1/hotness/posts/hot?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeDefined();
      expect(Array.isArray(response.body.data.posts)).toBe(true);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.count).toBeDefined();
    });

    it('should calculate post hotness when authenticated', async () => {
      const response = await request(app)
        .post(`/api/v1/hotness/posts/${post.id}/calculate`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.result).toBeDefined();
      expect(response.body.data.result.postId).toBe(post.id);
      expect(response.body.data.result.score).toBeDefined();
      expect(response.body.data.result.factors).toBeDefined();
    });

    it('should require authentication for protected endpoints', async () => {
      const response = await request(app)
        .post(`/api/v1/hotness/posts/${post.id}/calculate`)
        .send({})
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('Scheduler API', () => {
    it('should return scheduler status', async () => {
      const response = await request(app)
        .get('/api/v1/hotness/scheduler/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.status.running).toBeDefined();
      expect(response.body.data.status.config).toBeDefined();
    });

    it('should execute immediate update', async () => {
      const response = await request(app)
        .post('/api/v1/hotness/scheduler/execute')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBeDefined();
      expect(response.body.data.failed).toBeDefined();
    });
  });
});