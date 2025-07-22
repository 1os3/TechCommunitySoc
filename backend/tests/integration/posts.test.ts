import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import Post from '../../src/models/Post';

describe('Posts Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let testPost: any;

  beforeEach(async () => {
    // Clean up test data
    await Post.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create and register a test user
    const userData = {
      username: 'postuser',
      email: 'post@example.com',
      password: 'TestPassword123!',
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    testUser = registerResponse.body.data.user;

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);

    authToken = loginResponse.body.data.token;
  });

  describe('POST /api/v1/posts', () => {
    it('should create a new post successfully', async () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is a test post content with sufficient length to meet validation requirements.',
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post.title).toBe(postData.title);
      expect(response.body.data.post.content).toBe(postData.content);
      expect(response.body.data.post.author_id).toBe(testUser.id);
      expect(response.body.data.post.view_count).toBe(0);
      expect(response.body.data.post.like_count).toBe(0);
      expect(response.body.data.post.comment_count).toBe(0);
      expect(response.body.data.post.id).toBeDefined();
      expect(response.body.data.post.created_at).toBeDefined();

      // Verify post exists in database
      const dbPost = await Post.findByPk(response.body.data.post.id);
      expect(dbPost).toBeTruthy();
      expect(dbPost!.title).toBe(postData.title);
    });

    it('should reject post creation without authentication', async () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is a test post content.',
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .send(postData)
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should validate post title and content', async () => {
      const invalidPostData = {
        title: '', // Empty title
        content: '', // Empty content
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPostData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate title length limits', async () => {
      const longTitle = 'a'.repeat(201); // Exceeds 200 character limit
      const postData = {
        title: longTitle,
        content: 'Valid content here.',
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('200 characters');
    });

    it('should validate content length limits', async () => {
      const longContent = 'a'.repeat(50001); // Exceeds 50000 character limit
      const postData = {
        title: 'Valid title',
        content: longContent,
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('50000 characters');
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    beforeEach(async () => {
      // Create a test post
      const postData = {
        title: 'Test Post for Reading',
        content: 'This is a test post content for reading tests.',
      };

      const createResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      testPost = createResponse.body.data.post;
    });

    it('should retrieve a post successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/posts/${testPost.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post.id).toBe(testPost.id);
      expect(response.body.data.post.title).toBe(testPost.title);
      expect(response.body.data.post.content).toBe(testPost.content);
      expect(response.body.data.post.author).toBeDefined();
      expect(response.body.data.post.author.username).toBe(testUser.username);
    });

    it('should increment view count when requested', async () => {
      const response = await request(app)
        .get(`/api/v1/posts/${testPost.id}?view=true`)
        .expect(200);

      expect(response.body.data.post.view_count).toBe(1);

      // Check again to confirm increment
      const response2 = await request(app)
        .get(`/api/v1/posts/${testPost.id}?view=true`)
        .expect(200);

      expect(response2.body.data.post.view_count).toBe(2);
    });

    it('should not increment view count when not requested', async () => {
      await request(app)
        .get(`/api/v1/posts/${testPost.id}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/v1/posts/${testPost.id}`)
        .expect(200);

      expect(response.body.data.post.view_count).toBe(0);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/v1/posts/99999')
        .expect(404);

      expect(response.body.error.code).toBe('POST_NOT_FOUND');
    });

    it('should return 400 for invalid post ID', async () => {
      const response = await request(app)
        .get('/api/v1/posts/invalid')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_POST_ID');
    });
  });

  describe('PUT /api/v1/posts/:id', () => {
    beforeEach(async () => {
      // Create a test post
      const postData = {
        title: 'Original Title',
        content: 'Original content for updating tests.',
      };

      const createResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      testPost = createResponse.body.data.post;
    });

    it('should update post successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content with new information.',
      };

      const response = await request(app)
        .put(`/api/v1/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post.title).toBe(updateData.title);
      expect(response.body.data.post.content).toBe(updateData.content);
      expect(response.body.data.post.id).toBe(testPost.id);

      // Verify update in database
      const dbPost = await Post.findByPk(testPost.id);
      expect(dbPost!.title).toBe(updateData.title);
      expect(dbPost!.content).toBe(updateData.content);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        title: 'Only Title Updated',
      };

      const response = await request(app)
        .put(`/api/v1/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.post.title).toBe(updateData.title);
      expect(response.body.data.post.content).toBe(testPost.content); // Original content unchanged
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        title: 'Updated Title',
      };

      const response = await request(app)
        .put(`/api/v1/posts/${testPost.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject update by non-author', async () => {
      // Create another user
      const anotherUserData = {
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'TestPassword123!',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(anotherUserData)
        .expect(201);

      const anotherLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: anotherUserData.email,
          password: anotherUserData.password,
        })
        .expect(200);

      const anotherToken = anotherLoginResponse.body.data.token;

      const updateData = {
        title: 'Unauthorized Update',
      };

      const response = await request(app)
        .put(`/api/v1/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error.code).toBe('POST_UPDATE_FAILED');
      expect(response.body.error.message).toContain('your own posts');
    });

    it('should return 404 for non-existent post update', async () => {
      const updateData = {
        title: 'Updated Title',
      };

      const response = await request(app)
        .put('/api/v1/posts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error.code).toBe('POST_UPDATE_FAILED');
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    beforeEach(async () => {
      // Create a test post
      const postData = {
        title: 'Post to Delete',
        content: 'This post will be deleted in tests.',
      };

      const createResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      testPost = createResponse.body.data.post;
    });

    it('should delete post successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify post is soft deleted in database
      const dbPost = await Post.findByPk(testPost.id);
      expect(dbPost!.is_deleted).toBe(true);

      // Verify post is not accessible via active post query
      const activePost = await Post.findActivePostById(testPost.id);
      expect(activePost).toBeNull();
    });

    it('should reject delete without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${testPost.id}`)
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject delete by non-author', async () => {
      // Create another user
      const anotherUserData = {
        username: 'deleteuser',
        email: 'delete@example.com',
        password: 'TestPassword123!',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(anotherUserData)
        .expect(201);

      const anotherLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: anotherUserData.email,
          password: anotherUserData.password,
        })
        .expect(200);

      const anotherToken = anotherLoginResponse.body.data.token;

      const response = await request(app)
        .delete(`/api/v1/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('POST_DELETION_FAILED');
      expect(response.body.error.message).toContain('your own posts');
    });

    it('should return 404 for non-existent post deletion', async () => {
      const response = await request(app)
        .delete('/api/v1/posts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('POST_DELETION_FAILED');
    });
  });

  describe('GET /api/v1/posts', () => {
    beforeEach(async () => {
      // Create multiple test posts
      const postPromises = [];
      for (let i = 1; i <= 5; i++) {
        const postData = {
          title: `Test Post ${i}`,
          content: `Content for test post number ${i}.`,
        };
        postPromises.push(
          request(app)
            .post('/api/v1/posts')
            .set('Authorization', `Bearer ${authToken}`)
            .send(postData)
        );
      }
      await Promise.all(postPromises);
    });

    it('should retrieve posts list successfully', async () => {
      const response = await request(app)
        .get('/api/v1/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(5);
      expect(response.body.data.pagination.total).toBe(5);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(1);

      // Check post structure and content truncation
      const firstPost = response.body.data.posts[0];
      expect(firstPost.title).toBeDefined();
      expect(firstPost.content.length).toBeLessThanOrEqual(203); // 200 + "..."
      expect(firstPost.author).toBeDefined();
      expect(firstPost.author.username).toBe(testUser.username);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/posts?page=1&limit=2')
        .expect(200);

      expect(response.body.data.posts).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.total).toBe(5);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });

    it('should support sorting by different fields', async () => {
      const response = await request(app)
        .get('/api/v1/posts?orderBy=updated_at')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(5);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/posts?page=0&limit=101')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PAGINATION');
    });
  });

  describe('GET /api/v1/posts/user/:userId', () => {
    beforeEach(async () => {
      // Create test posts for the user
      for (let i = 1; i <= 3; i++) {
        const postData = {
          title: `User Post ${i}`,
          content: `Content for user post number ${i}.`,
        };
        await request(app)
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(postData);
      }
    });

    it('should retrieve user posts successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/posts/user/${testUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);

      // Verify all posts belong to the user
      response.body.data.posts.forEach((post: any) => {
        expect(post.author_id).toBe(testUser.id);
      });
    });

    it('should return empty list for user with no posts', async () => {
      const response = await request(app)
        .get('/api/v1/posts/user/99999')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should validate user ID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/posts/user/invalid')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_USER_ID');
    });
  });

  describe('GET /api/v1/posts/hot', () => {
    it('should retrieve hot posts successfully', async () => {
      // Create test posts
      const postData = {
        title: 'Hot Post',
        content: 'This is a hot post content.',
      };

      await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData);

      const response = await request(app)
        .get('/api/v1/posts/hot')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/posts/hot?limit=101')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_LIMIT');
    });
  });
});