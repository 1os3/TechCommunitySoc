import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import Post from '../../src/models/Post';
import Comment from '../../src/models/Comment';
import Like from '../../src/models/Like';
import HotnessUpdateService from '../../src/services/hotnessUpdateService';
import HotnessWorkerService from '../../src/services/hotnessWorkerService';

describe('Hotness Update Mechanism - Integration Tests', () => {
  let users: any[] = [];
  let tokens: string[] = [];
  let posts: any[] = [];
  let hotnessUpdateService: HotnessUpdateService;
  let hotnessWorkerService: HotnessWorkerService;

  beforeEach(async () => {
    // Reset arrays
    users = [];
    tokens = [];
    posts = [];

    // Get service instances
    hotnessUpdateService = HotnessUpdateService.getInstance();
    hotnessWorkerService = HotnessWorkerService.getInstance();

    // Reset services
    hotnessUpdateService.reset();
    hotnessWorkerService.reset();

    // Create multiple test users
    const userCredentials = [
      { username: 'user1', email: 'user1@test.com', password: 'TestPassword123!' },
      { username: 'user2', email: 'user2@test.com', password: 'TestPassword123!' },
      { username: 'user3', email: 'user3@test.com', password: 'TestPassword123!' },
    ];

    for (const credentials of userCredentials) {
      // Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(credentials)
        .expect(201);

      users.push(registerResponse.body.data.user);

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: credentials.email,
          password: credentials.password,
        })
        .expect(200);

      tokens.push(loginResponse.body.data.token);
    }

    // Create test posts
    const postTitles = [
      'Test Post for Real-time Updates',
      'Another Test Post',
      'Third Test Post'
    ];

    for (let i = 0; i < postTitles.length; i++) {
      const postResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${tokens[i % tokens.length]}`)
        .send({
          title: postTitles[i],
          content: `Content for ${postTitles[i]}`,
        })
        .expect(201);

      posts.push(postResponse.body.data.post);
    }

    // Enable real-time updates
    hotnessUpdateService.updateConfig({ realTimeEnabled: true });
  }, 30000);

  describe('Real-time Hotness Updates', () => {
    it('should trigger hotness update when user likes a post', async () => {
      const postId = posts[0].id;
      const userId = users[1].id;

      // Get initial queue status
      const initialStatus = hotnessUpdateService.getQueueStatus();
      expect(initialStatus.pendingPosts).toBe(0);

      // Like the post
      await request(app)
        .post(`/api/v1/likes/posts/${postId}/toggle`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200);

      // Check that hotness update was triggered
      const statusAfterLike = hotnessUpdateService.getQueueStatus();
      expect(statusAfterLike.pendingPosts).toBeGreaterThan(0);
      expect(statusAfterLike.totalTriggers).toBeGreaterThan(0);

      // Verify trigger details
      const queueDetails = statusAfterLike.queueDetails.find(detail => detail.postId === postId);
      expect(queueDetails).toBeDefined();
      expect(queueDetails!.types).toContain('like');
    });

    it('should trigger hotness update when user comments on a post', async () => {
      const postId = posts[0].id;

      // Get initial queue status
      const initialStatus = hotnessUpdateService.getQueueStatus();
      expect(initialStatus.pendingPosts).toBe(0);

      // Create a comment
      await request(app)
        .post(`/api/v1/comments/posts/${postId}`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .send({ content: 'Test comment for hotness update' })
        .expect(201);

      // Check that hotness update was triggered
      const statusAfterComment = hotnessUpdateService.getQueueStatus();
      expect(statusAfterComment.pendingPosts).toBeGreaterThan(0);
      expect(statusAfterComment.totalTriggers).toBeGreaterThan(0);

      // Verify trigger details
      const queueDetails = statusAfterComment.queueDetails.find(detail => detail.postId === postId);
      expect(queueDetails).toBeDefined();
      expect(queueDetails!.types).toContain('comment');
    });

    it('should trigger hotness update when user views a post', async () => {
      const postId = posts[0].id;

      // Get initial queue status
      const initialStatus = hotnessUpdateService.getQueueStatus();
      expect(initialStatus.pendingPosts).toBe(0);

      // View the post with increment view
      await request(app)
        .get(`/api/v1/posts/${postId}?view=true`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200);

      // Check that hotness update was triggered
      const statusAfterView = hotnessUpdateService.getQueueStatus();
      expect(statusAfterView.pendingPosts).toBeGreaterThan(0);
      expect(statusAfterView.totalTriggers).toBeGreaterThan(0);

      // Verify trigger details
      const queueDetails = statusAfterView.queueDetails.find(detail => detail.postId === postId);
      expect(queueDetails).toBeDefined();
      expect(queueDetails!.types).toContain('view');
    });

    it('should prioritize high-priority triggers correctly', async () => {
      const postId = posts[0].id;

      // Configure to trigger immediate updates with fewer high-priority triggers
      hotnessUpdateService.updateConfig({ priorityThreshold: 2 });

      // Like the post (high priority)
      await request(app)
        .post(`/api/v1/likes/posts/${postId}/toggle`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200);

      // Comment on the post (high priority)
      await request(app)
        .post(`/api/v1/comments/posts/${postId}`)
        .set('Authorization', `Bearer ${tokens[2]}`)
        .send({ content: 'High priority comment' })
        .expect(201);

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that the post was processed immediately due to high priority
      const status = hotnessUpdateService.getQueueStatus();
      // The post might still be in processing or already processed
      const wasProcessed = status.pendingPosts === 0 || status.processingPosts > 0;
      expect(wasProcessed).toBe(true);
    });

    it('should handle batch processing correctly', async () => {
      // Configure for delayed batch processing
      hotnessUpdateService.updateConfig({
        priorityThreshold: 10, // High threshold to avoid immediate processing
        updateDelay: 1000,     // 1 second delay
        batchUpdateSize: 5
      });

      // Create multiple triggers across different posts
      for (let i = 0; i < posts.length; i++) {
        await request(app)
          .get(`/api/v1/posts/${posts[i].id}?view=true`)
          .set('Authorization', `Bearer ${tokens[i % tokens.length]}`)
          .expect(200);
      }

      // Check queue status
      const statusAfterViews = hotnessUpdateService.getQueueStatus();
      expect(statusAfterViews.pendingPosts).toBe(posts.length);

      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check that batch processing occurred
      const statusAfterBatch = hotnessUpdateService.getQueueStatus();
      expect(statusAfterBatch.pendingPosts).toBe(0);
    });
  });

  describe('Update Service Configuration', () => {
    it('should allow updating configuration via API', async () => {
      const newConfig = {
        realTimeEnabled: false,
        updateThreshold: 5,
        batchUpdateSize: 20,
        updateDelay: 3000,
        priorityThreshold: 8
      };

      const response = await request(app)
        .put('/api/v1/hotness/updates/config')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({ config: newConfig })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.config).toMatchObject(newConfig);

      // Verify the configuration was actually updated
      const currentConfig = hotnessUpdateService.getConfig();
      expect(currentConfig).toMatchObject(newConfig);
    });

    it('should validate configuration parameters', async () => {
      const invalidConfig = {
        updateThreshold: -1,
        batchUpdateSize: 101,
        updateDelay: 50,
        priorityThreshold: 100
      };

      // Test invalid update threshold
      let response = await request(app)
        .put('/api/v1/hotness/updates/config')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({ config: { updateThreshold: -1 } })
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_UPDATE_THRESHOLD');

      // Test invalid batch update size
      response = await request(app)
        .put('/api/v1/hotness/updates/config')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({ config: { batchUpdateSize: 101 } })
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_BATCH_UPDATE_SIZE');

      // Test invalid update delay
      response = await request(app)
        .put('/api/v1/hotness/updates/config')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({ config: { updateDelay: 50 } })
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_UPDATE_DELAY');

      // Test invalid priority threshold
      response = await request(app)
        .put('/api/v1/hotness/updates/config')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({ config: { priorityThreshold: 100 } })
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_PRIORITY_THRESHOLD');
    });
  });

  describe('Queue Management API', () => {
    it('should provide queue status via API', async () => {
      // Create some triggers
      await request(app)
        .post(`/api/v1/likes/posts/${posts[0].id}/toggle`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200);

      const response = await request(app)
        .get('/api/v1/hotness/updates/queue-status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.queueStatus).toBeDefined();
      expect(response.body.data.queueStatus.pendingPosts).toBeGreaterThan(0);
      expect(response.body.data.queueStatus.totalTriggers).toBeGreaterThan(0);
      expect(response.body.data.config).toBeDefined();
    });

    it('should allow manual trigger creation via API', async () => {
      const postId = posts[0].id;

      const response = await request(app)
        .post(`/api/v1/hotness/updates/trigger/${postId}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          type: 'like',
          priority: 'high'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.postId).toBe(postId);
      expect(response.body.data.triggerType).toBe('like');
      expect(response.body.data.priority).toBe('high');

      // Verify the trigger was added
      const statusResponse = await request(app)
        .get('/api/v1/hotness/updates/queue-status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(statusResponse.body.data.queueStatus.pendingPosts).toBeGreaterThan(0);
    });

    it('should validate manual trigger parameters', async () => {
      const postId = posts[0].id;

      // Test invalid trigger type
      let response = await request(app)
        .post(`/api/v1/hotness/updates/trigger/${postId}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          type: 'invalid',
          priority: 'high'
        })
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_TRIGGER_TYPE');

      // Test invalid post ID
      response = await request(app)
        .post('/api/v1/hotness/updates/trigger/invalid')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          type: 'like',
          priority: 'high'
        })
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_POST_ID');
    });

    it('should process all pending updates via API', async () => {
      // Create multiple triggers
      for (let i = 0; i < posts.length; i++) {
        await request(app)
          .get(`/api/v1/posts/${posts[i].id}?view=true`)
          .set('Authorization', `Bearer ${tokens[i % tokens.length]}`)
          .expect(200);
      }

      // Verify triggers are in queue
      let statusResponse = await request(app)
        .get('/api/v1/hotness/updates/queue-status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(statusResponse.body.data.queueStatus.pendingPosts).toBeGreaterThan(0);

      // Process all pending updates
      const processResponse = await request(app)
        .post('/api/v1/hotness/updates/process-all')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({})
        .expect(200);

      expect(processResponse.body.success).toBe(true);
      expect(processResponse.body.data.processed).toBeGreaterThan(0);

      // Verify queue is now empty
      statusResponse = await request(app)
        .get('/api/v1/hotness/updates/queue-status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(statusResponse.body.data.queueStatus.pendingPosts).toBe(0);
    });
  });

  describe('Cleanup and Maintenance', () => {
    it('should cleanup expired triggers via API', async () => {
      // Create some triggers
      await request(app)
        .post(`/api/v1/likes/posts/${posts[0].id}/toggle`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200);

      // Set a very short max age to make triggers "expired"
      const response = await request(app)
        .post('/api/v1/hotness/updates/cleanup?maxAge=1')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cleaned).toBeGreaterThanOrEqual(0);
    });

    it('should validate cleanup parameters', async () => {
      // Test invalid max age
      let response = await request(app)
        .post('/api/v1/hotness/updates/cleanup?maxAge=100')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({})
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_MAX_AGE');

      response = await request(app)
        .post('/api/v1/hotness/updates/cleanup?maxAge=4000000')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({})
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_MAX_AGE');
    });

    it('should reset the update service via API', async () => {
      // Create some triggers
      await request(app)
        .post(`/api/v1/likes/posts/${posts[0].id}/toggle`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200);

      // Verify triggers exist
      let statusResponse = await request(app)
        .get('/api/v1/hotness/updates/queue-status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(statusResponse.body.data.queueStatus.pendingPosts).toBeGreaterThan(0);

      // Reset the service
      const resetResponse = await request(app)
        .post('/api/v1/hotness/updates/reset')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({})
        .expect(200);

      expect(resetResponse.body.success).toBe(true);

      // Verify queue is now empty
      statusResponse = await request(app)
        .get('/api/v1/hotness/updates/queue-status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(statusResponse.body.data.queueStatus.pendingPosts).toBe(0);
      expect(statusResponse.body.data.queueStatus.totalTriggers).toBe(0);
    });
  });

  describe('Performance and Accuracy', () => {
    it('should handle concurrent trigger creation without data corruption', async () => {
      const postId = posts[0].id;

      // Create multiple concurrent triggers
      const concurrentTriggers = Array(10).fill(null).map(async (_, index) => {
        if (index % 3 === 0) {
          return request(app)
            .post(`/api/v1/likes/posts/${postId}/toggle`)
            .set('Authorization', `Bearer ${tokens[index % tokens.length]}`);
        } else if (index % 3 === 1) {
          return request(app)
            .post(`/api/v1/comments/posts/${postId}`)
            .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
            .send({ content: `Concurrent comment ${index}` });
        } else {
          return request(app)
            .get(`/api/v1/posts/${postId}?view=true`)
            .set('Authorization', `Bearer ${tokens[index % tokens.length]}`);
        }
      });

      const results = await Promise.allSettled(concurrentTriggers);

      // Most requests should succeed
      const successfulRequests = results.filter(r => r.status === 'fulfilled');
      expect(successfulRequests.length).toBeGreaterThan(5);

      // Check queue state is consistent
      const statusResponse = await request(app)
        .get('/api/v1/hotness/updates/queue-status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(statusResponse.body.data.queueStatus.totalTriggers).toBeGreaterThan(0);
    });

    it('should handle disabled real-time updates gracefully', async () => {
      // Disable real-time updates
      hotnessUpdateService.updateConfig({ realTimeEnabled: false });

      const postId = posts[0].id;

      // Try to create triggers
      await request(app)
        .post(`/api/v1/likes/posts/${postId}/toggle`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200);

      // Verify no triggers were created
      const statusResponse = await request(app)
        .get('/api/v1/hotness/updates/queue-status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(statusResponse.body.data.queueStatus.pendingPosts).toBe(0);
    });

    it('should maintain trigger accuracy across different interaction types', async () => {
      const postId = posts[0].id;

      // Create different types of triggers
      await request(app)
        .post(`/api/v1/likes/posts/${postId}/toggle`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200);

      await request(app)
        .post(`/api/v1/comments/posts/${postId}`)
        .set('Authorization', `Bearer ${tokens[2]}`)
        .send({ content: 'Test comment' })
        .expect(201);

      await request(app)
        .get(`/api/v1/posts/${postId}?view=true`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Check trigger types are correctly recorded
      const statusResponse = await request(app)
        .get('/api/v1/hotness/updates/queue-status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      const queueDetails = statusResponse.body.data.queueStatus.queueDetails.find(
        (detail: any) => detail.postId === postId
      );

      expect(queueDetails).toBeDefined();
      expect(queueDetails.types).toContain('like');
      expect(queueDetails.types).toContain('comment');
      expect(queueDetails.types).toContain('view');
    });

    it('should process updates efficiently for high-activity posts', async () => {
      const postId = posts[0].id;

      // Configure for immediate processing of high activity
      hotnessUpdateService.updateConfig({
        priorityThreshold: 3,
        updateDelay: 500
      });

      const startTime = Date.now();

      // Simulate high activity
      await request(app)
        .post(`/api/v1/likes/posts/${postId}/toggle`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      await request(app)
        .post(`/api/v1/likes/posts/${postId}/toggle`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200);

      await request(app)
        .post(`/api/v1/comments/posts/${postId}`)
        .set('Authorization', `Bearer ${tokens[2]}`)
        .send({ content: 'High activity comment' })
        .expect(201);

      // Wait for immediate processing to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const processingTime = Date.now() - startTime;

      // Verify processing was efficient (under 1 second)
      expect(processingTime).toBeLessThan(1000);

      // Verify the post was processed
      const statusResponse = await request(app)
        .get('/api/v1/hotness/updates/queue-status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Post should either be processed or in processing
      const isProcessed = statusResponse.body.data.queueStatus.pendingPosts === 0 ||
                         statusResponse.body.data.queueStatus.processingPosts > 0;
      expect(isProcessed).toBe(true);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'post', path: `/api/v1/hotness/updates/trigger/${posts[0].id}` },
        { method: 'post', path: '/api/v1/hotness/updates/process-all' },
        { method: 'get', path: '/api/v1/hotness/updates/queue-status' },
        { method: 'put', path: '/api/v1/hotness/updates/config' },
        { method: 'post', path: '/api/v1/hotness/updates/cleanup' },
        { method: 'post', path: '/api/v1/hotness/updates/reset' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)[endpoint.method as 'get' | 'post' | 'put'](endpoint.path)
          .send({})
          .expect(401);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      }
    });
  });
});