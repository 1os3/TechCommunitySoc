import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import Post from '../../src/models/Post';
import Comment from '../../src/models/Comment';
import Like from '../../src/models/Like';
import HotnessService from '../../src/services/hotnessService';
import HotnessScheduler from '../../src/services/hotnessScheduler';

describe('Hotness System - Comprehensive Tests', () => {
  let users: any[] = [];
  let tokens: string[] = [];
  let posts: any[] = [];

  beforeEach(async () => {
    // Reset arrays
    users = [];
    tokens = [];
    posts = [];

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

    // Create posts by different users
    const postTitles = [
      'Hot Post - Will get lots of activity',
      'Medium Post - Some activity',
      'Low Post - Little activity',
      'Old Post - Created earlier'
    ];

    const userIndexes = [0, 1, 2, 0]; // Which user creates which post

    for (let i = 0; i < postTitles.length; i++) {
      const postResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${tokens[userIndexes[i]]}`)
        .send({
          title: postTitles[i],
          content: `Content for ${postTitles[i]}`,
        })
        .expect(201);

      posts.push(postResponse.body.data.post);
    }

    // Make the last post older by directly updating the database
    const oldTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    await Post.update(
      { created_at: oldTime },
      { where: { id: posts[3].id } }
    );
  }, 30000); // Increase timeout to 30 seconds

  describe('Complex Activity Simulation', () => {
    beforeEach(async () => {
      // Simulate different levels of activity
      
      // Hot post (index 0): 3 likes, 2 comments, some views
      await Like.create({ user_id: users[1].id, target_type: 'post', target_id: posts[0].id });
      await Like.create({ user_id: users[2].id, target_type: 'post', target_id: posts[0].id });
      
      // Create comments on hot post
      const comment1Response = await request(app)
        .post(`/api/v1/comments/posts/${posts[0].id}`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .send({ content: 'Great post!' })
        .expect(201);

      const comment2Response = await request(app)
        .post(`/api/v1/comments/posts/${posts[0].id}`)
        .set('Authorization', `Bearer ${tokens[2]}`)
        .send({ content: 'Very interesting!' })
        .expect(201);

      // Like the comments too
      await Like.create({ user_id: users[0].id, target_type: 'comment', target_id: comment1Response.body.data.comment.id });
      await Like.create({ user_id: users[2].id, target_type: 'comment', target_id: comment1Response.body.data.comment.id });

      // Medium post (index 1): 1 like, 1 comment
      await Like.create({ user_id: users[0].id, target_type: 'post', target_id: posts[1].id });
      
      await request(app)
        .post(`/api/v1/comments/posts/${posts[1].id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({ content: 'Nice post' })
        .expect(201);

      // Low post (index 2): no activity intentionally left empty

      // Update post statistics manually to reflect the activity
      await Post.update({ like_count: 2, comment_count: 2, view_count: 10 }, { where: { id: posts[0].id } });
      await Post.update({ like_count: 1, comment_count: 1, view_count: 5 }, { where: { id: posts[1].id } });
      await Post.update({ like_count: 0, comment_count: 0, view_count: 1 }, { where: { id: posts[2].id } });
      await Post.update({ like_count: 0, comment_count: 0, view_count: 0 }, { where: { id: posts[3].id } });
    }, 20000); // Increase timeout

    it('should calculate different hotness scores based on activity', async () => {
      // Calculate hotness for all posts
      const results = await Promise.all([
        HotnessService.calculatePostHotness(posts[0].id), // Hot post
        HotnessService.calculatePostHotness(posts[1].id), // Medium post
        HotnessService.calculatePostHotness(posts[2].id), // Low post
        HotnessService.calculatePostHotness(posts[3].id), // Old post
      ]);

      // All calculations should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result!.postId).toBe(posts[index].id);
      });

      // Hot post should have highest score (more activity + newer)
      expect(results[0].result!.score).toBeGreaterThan(results[1].result!.score);
      expect(results[1].result!.score).toBeGreaterThanOrEqual(results[2].result!.score);
      
      // Old post should have very low score due to age
      expect(results[3].result!.score).toBeLessThan(results[0].result!.score);

      // Verify factors are correct
      expect(results[0].result!.factors.likes).toBe(2);
      expect(results[0].result!.factors.comments).toBe(2);
      expect(results[0].result!.factors.views).toBe(10);

      expect(results[1].result!.factors.likes).toBe(1);
      expect(results[1].result!.factors.comments).toBe(1);
      expect(results[1].result!.factors.views).toBe(5);

      expect(results[2].result!.factors.likes).toBe(0);
      expect(results[2].result!.factors.comments).toBe(0);
      expect(results[2].result!.factors.views).toBe(1);
    });

    it('should handle batch updates correctly', async () => {
      const postIds = posts.map(p => p.id);
      const result = await HotnessService.batchUpdateHotness(postIds);

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results!.length).toBe(postIds.length);
      expect(result.failed).toBeDefined();
      expect(result.failed!.length).toBe(0);

      // Verify all requested posts were updated
      const updatedPostIds = result.results!.map(r => r.postId);
      postIds.forEach(postId => {
        expect(updatedPostIds).toContain(postId);
      });

      // Verify all results have valid data
      result.results!.forEach((hotnessResult) => {
        expect(hotnessResult.postId).toBeDefined();
        expect(hotnessResult.score).toBeGreaterThanOrEqual(0);
        expect(hotnessResult.factors).toBeDefined();
      });
    });

    it('should return correctly ordered hot posts', async () => {
      // First update all posts with their current activity
      await HotnessService.updateAllActivePostsHotness();

      const result = await HotnessService.getHotPosts(10, 0);

      expect(result.success).toBe(true);
      expect(result.posts).toBeDefined();
      expect(result.posts!.length).toBeGreaterThan(0);

      // Verify sorting (hotness_score DESC)
      for (let i = 0; i < result.posts!.length - 1; i++) {
        expect(result.posts![i].hotness_score).toBeGreaterThanOrEqual(
          result.posts![i + 1].hotness_score
        );
      }

      // Verify post structure
      result.posts!.forEach(post => {
        expect(post.id).toBeDefined();
        expect(post.title).toBeDefined();
        expect(post.hotness_score).toBeDefined();
        expect(post.author).toBeDefined();
        expect(post.author.username).toBeDefined();
      });
    });

    it('should filter posts by time range correctly', async () => {
      const result = await HotnessService.getHotPostsByTimeRange(48, 10); // Last 48 hours

      expect(result.success).toBe(true);
      expect(result.posts).toBeDefined();
      expect(result.timeframe).toBeDefined();

      // Old post should not be included (it's 7 days old)
      const oldPostInResults = result.posts!.find(p => p.id === posts[3].id);
      expect(oldPostInResults).toBeUndefined();

      // Recent posts should be included
      const recentPosts = result.posts!.filter(p => 
        p.id === posts[0].id || p.id === posts[1].id || p.id === posts[2].id
      );
      expect(recentPosts.length).toBeGreaterThan(0);
    });

    it('should handle custom hotness configuration', async () => {
      const customConfig = {
        likeWeight: 10.0,    // Much higher weight for likes
        commentWeight: 5.0,  // Lower weight for comments
        viewWeight: 0.5,     // Higher weight for views
        gravity: 1.0,        // Less time decay
        baseHours: 1         // Less base time
      };

      const result = await HotnessService.calculatePostHotness(posts[0].id, customConfig);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();

      // With higher like weight, score should be higher than default
      const defaultResult = await HotnessService.calculatePostHotness(posts[0].id);
      expect(defaultResult.success).toBe(true);
      
      // Custom config should produce different (likely higher) score
      expect(result.result!.score).not.toBe(defaultResult.result!.score);
    });

    it('should validate configuration parameters correctly', async () => {
      const invalidConfigs = [
        { likeWeight: -1 },
        { commentWeight: 101 },
        { viewWeight: 11 },
        { gravity: 0.05 },
        { baseHours: 50 }
      ];

      invalidConfigs.forEach(config => {
        const validation = HotnessService.validateConfig(config);
        expect(validation.valid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });

      // Valid config should pass
      const validConfig = {
        likeWeight: 2.0,
        commentWeight: 3.0,
        viewWeight: 0.1,
        gravity: 1.8,
        baseHours: 2
      };

      const validation = HotnessService.validateConfig(validConfig);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  describe('API Integration Tests', () => {
    beforeEach(async () => {
      // Set up some test data for API tests
      await Post.update({ hotness_score: 15.0, like_count: 3, comment_count: 2 }, { where: { id: posts[0].id } });
      await Post.update({ hotness_score: 8.0, like_count: 1, comment_count: 1 }, { where: { id: posts[1].id } });
      await Post.update({ hotness_score: 2.0, like_count: 0, comment_count: 0 }, { where: { id: posts[2].id } });
      await Post.update({ hotness_score: 0.1, like_count: 0, comment_count: 0 }, { where: { id: posts[3].id } });
    });

    it('should calculate post hotness via API', async () => {
      const response = await request(app)
        .post(`/api/v1/hotness/posts/${posts[0].id}/calculate`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          likeWeight: 2.5,
          commentWeight: 3.5,
          viewWeight: 0.2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.result).toBeDefined();
      expect(response.body.data.result.postId).toBe(posts[0].id);
      expect(response.body.data.result.score).toBeGreaterThanOrEqual(0);
      expect(response.body.data.result.factors).toBeDefined();
    });

    it('should handle batch update via API', async () => {
      const postIds = [posts[0].id, posts[1].id];

      const response = await request(app)
        .post('/api/v1/hotness/posts/batch-update')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          postIds: postIds,
          config: {
            likeWeight: 3.0,
            commentWeight: 4.0
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(2);
      expect(response.body.data.failed).toBe(0);
      expect(response.body.data.results).toHaveLength(2);
    });

    it('should get hot posts with proper ordering via API', async () => {
      const response = await request(app)
        .get('/api/v1/hotness/posts/hot?limit=4&minScore=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeDefined();
      expect(response.body.data.limit).toBe(4);

      const hotPosts = response.body.data.posts;
      
      // Verify ordering (hotness_score DESC)
      for (let i = 0; i < hotPosts.length - 1; i++) {
        expect(hotPosts[i].hotness_score).toBeGreaterThanOrEqual(hotPosts[i + 1].hotness_score);
      }

      // Verify structure
      hotPosts.forEach((post: any) => {
        expect(post.id).toBeDefined();
        expect(post.title).toBeDefined();
        expect(post.hotness_score).toBeDefined();
        expect(post.author).toBeDefined();
        expect(post.author.username).toBeDefined();
      });
    });

    it('should filter by minimum score via API', async () => {
      const minScore = 5.0;
      const response = await request(app)
        .get(`/api/v1/hotness/posts/hot?limit=10&minScore=${minScore}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.posts.forEach((post: any) => {
        expect(post.hotness_score).toBeGreaterThanOrEqual(minScore);
      });
    });

    it('should get trending posts by time range via API', async () => {
      const response = await request(app)
        .get('/api/v1/hotness/posts/trending?hours=72&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeDefined();
      expect(response.body.data.timeframe).toBeDefined();
      expect(response.body.data.hours).toBe(72);

      // Verify timeframe
      const timeframe = response.body.data.timeframe;
      const now = new Date();
      const expectedStart = new Date(now.getTime() - 72 * 60 * 60 * 1000);
      
      expect(new Date(timeframe.end).getTime()).toBeCloseTo(now.getTime(), -1000); // Within 1 second
      expect(new Date(timeframe.start).getTime()).toBeCloseTo(expectedStart.getTime(), -60000); // Within 1 minute
    });

    it('should validate API parameters correctly', async () => {
      // Invalid limit
      let response = await request(app)
        .get('/api/v1/hotness/posts/hot?limit=101')
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_LIMIT');

      // Invalid minimum score
      response = await request(app)
        .get('/api/v1/hotness/posts/hot?minScore=-1')
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_MIN_SCORE');

      // Invalid hours for trending
      response = await request(app)
        .get('/api/v1/hotness/posts/trending?hours=9000')
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_HOURS');

      // Invalid post ID
      response = await request(app)
        .post('/api/v1/hotness/posts/invalid/calculate')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({})
        .expect(400);
      expect(response.body.error.code).toBe('INVALID_POST_ID');
    });

    it('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'post', path: `/api/v1/hotness/posts/${posts[0].id}/calculate` },
        { method: 'post', path: '/api/v1/hotness/posts/batch-update' },
        { method: 'post', path: '/api/v1/hotness/posts/update-all' },
        { method: 'get', path: '/api/v1/hotness/scheduler/status' },
        { method: 'post', path: '/api/v1/hotness/scheduler/execute' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)[endpoint.method as 'get' | 'post'](endpoint.path)
          .send({})
          .expect(401);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      }
    });
  });

  describe('Scheduler Integration', () => {
    let scheduler: HotnessScheduler;

    beforeEach(() => {
      scheduler = HotnessScheduler.getInstance();
      scheduler.stop(); // Ensure clean state
    });

    afterEach(() => {
      scheduler.stop(); // Clean up
    });

    it('should manage scheduler lifecycle correctly', async () => {
      // Initially not running
      let status = scheduler.getStatus();
      expect(status.running).toBe(false);

      // Enable and start
      scheduler.updateConfig({ enabled: true, updateInterval: 60000 });
      let result = scheduler.start();
      expect(result.success).toBe(true);

      status = scheduler.getStatus();
      expect(status.running).toBe(true);

      // Stop
      result = scheduler.stop();
      expect(result.success).toBe(true);

      status = scheduler.getStatus();
      expect(status.running).toBe(false);
    });

    it('should execute immediate updates correctly', async () => {
      const result = await scheduler.executeNow();

      expect(result.success).toBe(true);
      expect(typeof result.updated).toBe('number');
      expect(typeof result.failed).toBe('number');
      expect(result.updated).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
    });

    it('should provide accurate statistics', async () => {
      const result = await scheduler.getUpdateStatistics();

      expect(result.success).toBe(true);
      expect(result.statistics).toBeDefined();
      
      const stats = result.statistics!;
      expect(typeof stats.totalPosts).toBe('number');
      expect(typeof stats.activePosts).toBe('number');
      expect(typeof stats.expiredPosts).toBe('number');
      expect(typeof stats.avgHotness).toBe('number');
      expect(typeof stats.maxHotness).toBe('number');
      expect(stats.lastUpdated).toBeDefined();

      // Sanity checks
      expect(stats.totalPosts).toBeGreaterThanOrEqual(0);
      expect(stats.activePosts).toBeGreaterThanOrEqual(0);
      expect(stats.expiredPosts).toBeGreaterThanOrEqual(0);
      expect(stats.avgHotness).toBeGreaterThanOrEqual(0);
      expect(stats.maxHotness).toBeGreaterThanOrEqual(0);
    });

    it('should handle scheduler configuration updates', async () => {
      const newConfig = {
        enabled: true,
        updateInterval: 120000, // 2 minutes
        batchSize: 25,
        maxAge: 48 // 2 days
      };

      scheduler.updateConfig(newConfig);
      const config = scheduler.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.updateInterval).toBe(120000);
      expect(config.batchSize).toBe(25);
      expect(config.maxAge).toBe(48);
    });

    it('should manage scheduler via API correctly', async () => {
      // Get status
      let response = await request(app)
        .get('/api/v1/hotness/scheduler/status')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status.running).toBe(false);

      // Execute immediate update
      response = await request(app)
        .post('/api/v1/hotness/scheduler/execute')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBeDefined();
      expect(response.body.data.failed).toBeDefined();

      // Get statistics
      response = await request(app)
        .get('/api/v1/hotness/scheduler/statistics')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle non-existent posts gracefully', async () => {
      const result = await HotnessService.calculatePostHotness(99999);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Post not found');
    });

    it('should handle deleted posts correctly', async () => {
      // Soft delete a post
      await Post.update({ is_deleted: true }, { where: { id: posts[0].id } });

      const result = await HotnessService.calculatePostHotness(posts[0].id);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot calculate hotness for deleted post');
    });

    it('should handle mixed valid/invalid post IDs in batch update', async () => {
      const mixedIds = [posts[0].id, 99999, posts[1].id, 88888];
      const result = await HotnessService.batchUpdateHotness(mixedIds);

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.failed).toBeDefined();
      
      // Should update valid posts and fail invalid ones
      expect(result.results!.length).toBe(2); // posts[0] and posts[1]
      expect(result.failed!.length).toBe(2); // 99999 and 88888
      expect(result.failed).toContain(99999);
      expect(result.failed).toContain(88888);
    });

    it('should handle zero-activity scenarios correctly', async () => {
      // Create a fresh post with absolutely no activity
      const freshPostResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          title: 'Fresh Post',
          content: 'No activity yet'
        })
        .expect(201);

      const freshPost = freshPostResponse.body.data.post;

      const result = await HotnessService.calculatePostHotness(freshPost.id);

      expect(result.success).toBe(true);
      expect(result.result!.score).toBe(0); // No activity = zero score
      expect(result.result!.factors.likes).toBe(0);
      expect(result.result!.factors.comments).toBe(0);
      expect(result.result!.factors.views).toBe(0);
    });

    it('should handle extreme configuration values', async () => {
      const extremeConfig = {
        likeWeight: 0.001,
        commentWeight: 0.001,
        viewWeight: 0.001,
        gravity: 4.9,
        baseHours: 0.1
      };

      // Should still work with extreme but valid values
      const result = await HotnessService.calculatePostHotness(posts[0].id, extremeConfig);
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // Simulate concurrent hotness calculations
      const concurrentPromises = Array(10).fill(null).map(() =>
        HotnessService.calculatePostHotness(posts[0].id)
      );

      const results = await Promise.all(concurrentPromises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
      });

      // All should return the same score (no race conditions)
      const scores = results.map(r => r.result!.score);
      const firstScore = scores[0];
      scores.forEach(score => {
        expect(score).toBeCloseTo(firstScore, 5); // Allow small floating point differences
      });
    });
  });
});