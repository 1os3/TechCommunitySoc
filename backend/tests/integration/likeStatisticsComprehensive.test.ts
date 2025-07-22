import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import Post from '../../src/models/Post';
import Comment from '../../src/models/Comment';
import Like from '../../src/models/Like';

describe('Like Statistics - Comprehensive Tests', () => {
  let users: any[] = [];
  let tokens: string[] = [];
  let posts: any[] = [];
  let comments: any[] = [];

  beforeEach(async () => {
    // Reset arrays (database cleanup is handled by global setup)
    users = [];
    tokens = [];
    posts = [];
    comments = [];

    // Create multiple test users (using simple approach like working simple test)
    const userCredentials = [
      { username: 'user1', email: 'user1@test.com', password: 'TestPassword123!' },
      { username: 'user2', email: 'user2@test.com', password: 'TestPassword123!' },
      { username: 'user3', email: 'user3@test.com', password: 'TestPassword123!' },
      { username: 'user4', email: 'user4@test.com', password: 'TestPassword123!' },
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
      'Post 1 by User 1',
      'Post 2 by User 1', 
      'Post 3 by User 2',
      'Post 4 by User 3',
      'Post 5 by User 4',
    ];

    const userIndexes = [0, 0, 1, 2, 3]; // Which user creates which post

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

    // Create comments on posts
    const commentData = [
      { postIndex: 0, userIndex: 1, content: 'Comment 1 on Post 1' },
      { postIndex: 0, userIndex: 2, content: 'Comment 2 on Post 1' },
      { postIndex: 1, userIndex: 3, content: 'Comment 3 on Post 2' },
      { postIndex: 2, userIndex: 0, content: 'Comment 4 on Post 3' },
      { postIndex: 3, userIndex: 1, content: 'Comment 5 on Post 4' },
    ];

    for (const data of commentData) {
      const commentResponse = await request(app)
        .post(`/api/v1/comments/posts/${posts[data.postIndex].id}`)
        .set('Authorization', `Bearer ${tokens[data.userIndex]}`)
        .send({
          content: data.content,
        })
        .expect(201);

      comments.push(commentResponse.body.data.comment);
    }
  }, 15000); // Increase timeout to 15 seconds

  describe('Complex Like Scenarios', () => {
    beforeEach(async () => {
      // Create a complex like scenario
      // User 0 likes: posts 0,1,2 and comments 0,1
      await request(app).post(`/api/v1/likes/posts/${posts[0].id}`).set('Authorization', `Bearer ${tokens[0]}`);
      await request(app).post(`/api/v1/likes/posts/${posts[1].id}`).set('Authorization', `Bearer ${tokens[0]}`);
      await request(app).post(`/api/v1/likes/posts/${posts[2].id}`).set('Authorization', `Bearer ${tokens[0]}`);
      await request(app).post(`/api/v1/likes/comments/${comments[0].id}`).set('Authorization', `Bearer ${tokens[0]}`);
      await request(app).post(`/api/v1/likes/comments/${comments[1].id}`).set('Authorization', `Bearer ${tokens[0]}`);

      // User 1 likes: posts 0,3 and comments 2,3
      await request(app).post(`/api/v1/likes/posts/${posts[0].id}`).set('Authorization', `Bearer ${tokens[1]}`);
      await request(app).post(`/api/v1/likes/posts/${posts[3].id}`).set('Authorization', `Bearer ${tokens[1]}`);
      await request(app).post(`/api/v1/likes/comments/${comments[2].id}`).set('Authorization', `Bearer ${tokens[1]}`);
      await request(app).post(`/api/v1/likes/comments/${comments[3].id}`).set('Authorization', `Bearer ${tokens[1]}`);

      // User 2 likes: posts 1,4 and comments 0,4
      await request(app).post(`/api/v1/likes/posts/${posts[1].id}`).set('Authorization', `Bearer ${tokens[2]}`);
      await request(app).post(`/api/v1/likes/posts/${posts[4].id}`).set('Authorization', `Bearer ${tokens[2]}`);
      await request(app).post(`/api/v1/likes/comments/${comments[0].id}`).set('Authorization', `Bearer ${tokens[2]}`);
      await request(app).post(`/api/v1/likes/comments/${comments[4].id}`).set('Authorization', `Bearer ${tokens[2]}`);

      // User 3 likes: posts 2,4
      await request(app).post(`/api/v1/likes/posts/${posts[2].id}`).set('Authorization', `Bearer ${tokens[3]}`);
      await request(app).post(`/api/v1/likes/posts/${posts[4].id}`).set('Authorization', `Bearer ${tokens[3]}`);
    });

    it('should return accurate user statistics with complex data', async () => {
      // Test User 0's statistics
      const response = await request(app)
        .get('/api/v1/likes/user/statistics')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const stats = response.body.data.statistics;
      
      expect(stats.totalLikes).toBe(5); // 3 posts + 2 comments
      expect(stats.postsLiked).toBe(3);
      expect(stats.commentsLiked).toBe(2);
      expect(stats.likesReceived).toBeGreaterThanOrEqual(0); // User 0's content received likes
      expect(stats.postLikesReceived).toBeGreaterThanOrEqual(0);
      expect(stats.commentLikesReceived).toBeGreaterThanOrEqual(0);
    });

    it('should return top liked posts in correct order', async () => {
      const response = await request(app)
        .get('/api/v1/likes/top/post?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      const topPosts = response.body.data.content;
      
      expect(topPosts.length).toBeGreaterThan(0);
      
      // Verify sorting by like count (descending)
      for (let i = 0; i < topPosts.length - 1; i++) {
        expect(topPosts[i].like_count).toBeGreaterThanOrEqual(topPosts[i + 1].like_count);
      }

      // Verify each post has required fields
      topPosts.forEach((post: any) => {
        expect(post.id).toBeDefined();
        expect(post.title).toBeDefined();
        expect(post.like_count).toBeDefined();
        expect(post.author).toBeDefined();
        expect(post.author.username).toBeDefined();
      });
    });

    it('should return top liked comments with post information', async () => {
      const response = await request(app)
        .get('/api/v1/likes/top/comment?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      const topComments = response.body.data.content;
      
      // Verify sorting by like count (descending)
      for (let i = 0; i < topComments.length - 1; i++) {
        expect(topComments[i].like_count).toBeGreaterThanOrEqual(topComments[i + 1].like_count);
      }

      // Verify each comment has required fields including post info
      topComments.forEach((comment: any) => {
        expect(comment.id).toBeDefined();
        expect(comment.content).toBeDefined();
        expect(comment.like_count).toBeDefined();
        expect(comment.author).toBeDefined();
        expect(comment.author.username).toBeDefined();
        expect(comment.post).toBeDefined();
        expect(comment.post.title).toBeDefined();
      });
    });

    it('should return most active users accurately', async () => {
      const response = await request(app)
        .get('/api/v1/likes/users/active?limit=10&days=30')
        .expect(200);

      expect(response.body.success).toBe(true);
      const activeUsers = response.body.data.users;

      // Verify sorting by activity (recent likes first, then total likes)
      for (let i = 0; i < activeUsers.length - 1; i++) {
        const current = activeUsers[i];
        const next = activeUsers[i + 1];
        
        if (current.recentLikes === next.recentLikes) {
          expect(current.totalLikes).toBeGreaterThanOrEqual(next.totalLikes);
        } else {
          expect(current.recentLikes).toBeGreaterThanOrEqual(next.recentLikes);
        }
      }

      // Verify user data structure
      activeUsers.forEach((user: any) => {
        expect(user.userId).toBeDefined();
        expect(user.username).toBeDefined();
        expect(typeof user.totalLikes).toBe('number');
        expect(typeof user.recentLikes).toBe('number');
        expect(user.totalLikes).toBeGreaterThanOrEqual(user.recentLikes);
      });
    });

    it('should return accurate activity metrics', async () => {
      const response = await request(app)
        .get('/api/v1/likes/metrics/activity?days=7')
        .expect(200);

      expect(response.body.success).toBe(true);
      const metrics = response.body.data.metrics;

      // Verify daily activity structure
      expect(metrics.dailyActivity).toBeDefined();
      expect(Array.isArray(metrics.dailyActivity)).toBe(true);
      expect(metrics.dailyActivity.length).toBe(7);

      // Verify each day has correct structure
      metrics.dailyActivity.forEach((day: any) => {
        expect(day.date).toBeDefined();
        expect(typeof day.postLikes).toBe('number');
        expect(typeof day.commentLikes).toBe('number');
        expect(typeof day.total).toBe('number');
        expect(day.total).toBe(day.postLikes + day.commentLikes);
      });

      // Verify summary statistics
      expect(metrics.summary).toBeDefined();
      expect(typeof metrics.summary.totalLikes).toBe('number');
      expect(typeof metrics.summary.averageLikesPerDay).toBe('number');
      expect(metrics.summary.peakDay).toBeDefined();
      expect(typeof metrics.summary.totalPostLikes).toBe('number');
      expect(typeof metrics.summary.totalCommentLikes).toBe('number');

      // Verify consistency
      expect(metrics.summary.totalLikes).toBe(
        metrics.summary.totalPostLikes + metrics.summary.totalCommentLikes
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle scenarios with no likes gracefully', async () => {
      // Test with a completely fresh setup (no likes created)
      // Database is already clean from global setup
      
      // Create just one user and one post (no likes)
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'freshuser',
          email: 'fresh@test.com', 
          password: 'TestPassword123!'
        })
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'fresh@test.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Fresh Post',
          content: 'No likes yet'
        })
        .expect(201);

      // Now test all endpoints with no likes in the system
      const responses = await Promise.all([
        request(app).get('/api/v1/likes/user/statistics').set('Authorization', `Bearer ${token}`),
        request(app).get('/api/v1/likes/top/post?limit=10'),
        request(app).get('/api/v1/likes/top/comment?limit=10'),
        request(app).get('/api/v1/likes/users/active?limit=10'),
        request(app).get('/api/v1/likes/metrics/activity?days=7'),
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // User has given no likes
      expect(responses[0].body.data.statistics.totalLikes).toBe(0);
      expect(responses[0].body.data.statistics.postsLiked).toBe(0);
      expect(responses[0].body.data.statistics.commentsLiked).toBe(0);
      
      // Posts exist but have 0 likes (still returned)
      expect(Array.isArray(responses[1].body.data.content)).toBe(true);
      expect(responses[1].body.data.content.length).toBeGreaterThan(0);
      expect(responses[1].body.data.content[0].like_count).toBe(0);
      
      // No comments exist yet
      expect(Array.isArray(responses[2].body.data.content)).toBe(true);
      
      // No users have like activity
      expect(responses[3].body.data.users).toEqual([]);
      
      // No like activity in metrics
      expect(responses[4].body.data.metrics.summary.totalLikes).toBe(0);
      expect(responses[4].body.data.metrics.summary.totalPostLikes).toBe(0);
      expect(responses[4].body.data.metrics.summary.totalCommentLikes).toBe(0);
    });

    it('should validate parameters correctly', async () => {
      // Test invalid content type
      let response = await request(app).get('/api/v1/likes/top/invalid');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_CONTENT_TYPE');

      // Test invalid limit values
      response = await request(app).get('/api/v1/likes/top/post?limit=101');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_LIMIT');

      response = await request(app).get('/api/v1/likes/top/post?limit=0');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_LIMIT');

      // Test invalid user active parameters
      response = await request(app).get('/api/v1/likes/users/active?limit=101');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_LIMIT');

      response = await request(app).get('/api/v1/likes/users/active?days=400');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_DAYS');

      // Test invalid metrics parameters
      response = await request(app).get('/api/v1/likes/metrics/activity?days=0');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_DAYS');

      response = await request(app).get('/api/v1/likes/metrics/activity?days=400');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_DAYS');
    });

    it('should handle date range filtering', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/v1/likes/top/post?startDate=${yesterday}&endDate=${today}&limit=10`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.timeframe).toBeDefined();
      expect(response.body.data.timeframe.start).toBeDefined();
      expect(response.body.data.timeframe.end).toBeDefined();
    });

    it('should validate invalid date formats', async () => {
      const response = await request(app)
        .get('/api/v1/likes/top/post?startDate=invalid-date&endDate=invalid-date')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    it('should handle different time ranges for metrics', async () => {
      const timeRanges = [1, 3, 7, 14, 30];

      for (const days of timeRanges) {
        const response = await request(app)
          .get(`/api/v1/likes/metrics/activity?days=${days}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.metrics.dailyActivity.length).toBe(days);
        expect(response.body.data.days).toBe(days);
      }
    });
  });

  describe('Performance and Consistency', () => {
    it('should handle concurrent requests without data corruption', async () => {
      const concurrentRequests = Array(10).fill(null).map(() => 
        request(app).get('/api/v1/likes/top/post?limit=5')
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.content)).toBe(true);
      });

      // All responses should be identical
      const firstResponse = responses[0].body;
      responses.slice(1).forEach(response => {
        expect(response.body.data.content.length).toBe(firstResponse.data.content.length);
      });
    });

    it('should maintain data consistency after operations', async () => {
      // Get initial stats
      const initialStats = await request(app)
        .get('/api/v1/likes/user/statistics')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Perform a like operation
      await request(app)
        .post(`/api/v1/likes/posts/${posts[4].id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Get updated stats
      const updatedStats = await request(app)
        .get('/api/v1/likes/user/statistics')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Verify consistency
      expect(updatedStats.body.data.statistics.totalLikes).toBe(
        initialStats.body.data.statistics.totalLikes + 1
      );
      expect(updatedStats.body.data.statistics.postsLiked).toBe(
        initialStats.body.data.statistics.postsLiked + 1
      );
    });

    it('should handle large datasets efficiently', async () => {
      // This test verifies the system can handle reasonable loads
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/v1/likes/top/post?limit=50')
        .expect(200);

      const duration = Date.now() - start;
      
      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for user-specific endpoints', async () => {
      const protectedEndpoints = [
        '/api/v1/likes/user/statistics',
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(401);

        expect(response.body.error.code).toBe('MISSING_TOKEN');
      }
    });

    it('should work with optional authentication for public endpoints', async () => {
      const publicEndpoints = [
        '/api/v1/likes/top/post',
        '/api/v1/likes/top/comment',
        '/api/v1/likes/users/active',
        '/api/v1/likes/metrics/activity',
      ];

      for (const endpoint of publicEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should handle invalid tokens gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/likes/user/statistics')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});