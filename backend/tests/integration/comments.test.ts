import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import Post from '../../src/models/Post';
import Comment from '../../src/models/Comment';

describe('Comments Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let testPost: any;

  beforeEach(async () => {
    // Clean up test data
    await Comment.destroy({ where: {} });
    await Post.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create and register a test user
    const userData = {
      username: 'commentuser',
      email: 'comment@example.com',
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

    // Create a test post
    const postData = {
      title: 'Test Post for Comments',
      content: 'This is a test post for comment functionality.',
    };

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData)
      .expect(201);

    testPost = postResponse.body.data.post;
  });

  describe('POST /api/v1/comments/posts/:postId', () => {
    it('should create a new comment successfully', async () => {
      const commentData = {
        content: 'This is a test comment with sufficient length.',
      };

      const response = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe(commentData.content);
      expect(response.body.data.comment.post_id).toBe(testPost.id);
      expect(response.body.data.comment.author_id).toBe(testUser.id);
      expect(response.body.data.comment.parent_id).toBeNull();
      expect(response.body.data.comment.id).toBeDefined();

      // Verify comment exists in database
      const dbComment = await Comment.findByPk(response.body.data.comment.id);
      expect(dbComment).toBeTruthy();
      expect(dbComment!.content).toBe(commentData.content);

      // Verify post comment count was incremented
      const updatedPost = await Post.findByPk(testPost.id);
      expect(updatedPost!.comment_count).toBe(1);
    });

    it('should create a reply comment successfully', async () => {
      // First create a parent comment
      const parentCommentData = {
        content: 'This is a parent comment.',
      };

      const parentResponse = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(parentCommentData)
        .expect(201);

      const parentComment = parentResponse.body.data.comment;

      // Now create a reply
      const replyData = {
        content: 'This is a reply to the parent comment.',
        parent_id: parentComment.id,
      };

      const response = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe(replyData.content);
      expect(response.body.data.comment.parent_id).toBe(parentComment.id);
      expect(response.body.data.comment.post_id).toBe(testPost.id);
    });

    it('should reject comment creation without authentication', async () => {
      const commentData = {
        content: 'This comment should be rejected.',
      };

      const response = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .send(commentData)
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should validate comment content', async () => {
      const invalidCommentData = {
        content: '', // Empty content
      };

      const response = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCommentData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject comment for non-existent post', async () => {
      const commentData = {
        content: 'Comment for non-existent post.',
      };

      const response = await request(app)
        .post('/api/v1/comments/posts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(404);

      expect(response.body.error.code).toBe('COMMENT_CREATION_FAILED');
    });

    it('should reject reply to non-existent parent comment', async () => {
      const replyData = {
        content: 'Reply to non-existent comment.',
        parent_id: 99999,
      };

      const response = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyData)
        .expect(404);

      expect(response.body.error.code).toBe('COMMENT_CREATION_FAILED');
    });
  });

  describe('GET /api/v1/comments/:id', () => {
    let testComment: any;

    beforeEach(async () => {
      // Create a test comment
      const commentData = {
        content: 'Test comment for retrieval.',
      };

      const createResponse = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      testComment = createResponse.body.data.comment;
    });

    it('should retrieve a comment successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/${testComment.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.id).toBe(testComment.id);
      expect(response.body.data.comment.content).toBe(testComment.content);
      expect(response.body.data.comment.author).toBeDefined();
      expect(response.body.data.comment.author.username).toBe(testUser.username);
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .get('/api/v1/comments/99999')
        .expect(404);

      expect(response.body.error.code).toBe('COMMENT_NOT_FOUND');
    });

    it('should return 400 for invalid comment ID', async () => {
      const response = await request(app)
        .get('/api/v1/comments/invalid')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_COMMENT_ID');
    });
  });

  describe('PUT /api/v1/comments/:id', () => {
    let testComment: any;

    beforeEach(async () => {
      // Create a test comment
      const commentData = {
        content: 'Original comment content.',
      };

      const createResponse = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      testComment = createResponse.body.data.comment;
    });

    it('should update comment successfully', async () => {
      const updateData = {
        content: 'Updated comment content with more details.',
      };

      const response = await request(app)
        .put(`/api/v1/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe(updateData.content);
      expect(response.body.data.comment.id).toBe(testComment.id);

      // Verify update in database
      const dbComment = await Comment.findByPk(testComment.id);
      expect(dbComment!.content).toBe(updateData.content);
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        content: 'Updated content without auth.',
      };

      const response = await request(app)
        .put(`/api/v1/comments/${testComment.id}`)
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
        content: 'Unauthorized update attempt.',
      };

      const response = await request(app)
        .put(`/api/v1/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error.code).toBe('COMMENT_UPDATE_FAILED');
      expect(response.body.error.message).toContain('your own comments');
    });

    it('should return 404 for non-existent comment update', async () => {
      const updateData = {
        content: 'Update non-existent comment.',
      };

      const response = await request(app)
        .put('/api/v1/comments/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error.code).toBe('COMMENT_UPDATE_FAILED');
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    let testComment: any;

    beforeEach(async () => {
      // Create a test comment
      const commentData = {
        content: 'Comment to be deleted.',
      };

      const createResponse = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      testComment = createResponse.body.data.comment;
    });

    it('should delete comment successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify comment is soft deleted in database
      const dbComment = await Comment.findByPk(testComment.id);
      expect(dbComment!.is_deleted).toBe(true);

      // Verify post comment count was decremented
      const updatedPost = await Post.findByPk(testPost.id);
      expect(updatedPost!.comment_count).toBe(0);
    });

    it('should reject delete without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/comments/${testComment.id}`)
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
        .delete(`/api/v1/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('COMMENT_DELETION_FAILED');
      expect(response.body.error.message).toContain('your own comments');
    });

    it('should return 404 for non-existent comment deletion', async () => {
      const response = await request(app)
        .delete('/api/v1/comments/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('COMMENT_DELETION_FAILED');
    });
  });

  describe('GET /api/v1/comments/posts/:postId', () => {
    beforeEach(async () => {
      // Create multiple test comments
      const commentPromises = [];
      for (let i = 1; i <= 3; i++) {
        const commentData = {
          content: `Test comment number ${i}.`,
        };
        commentPromises.push(
          request(app)
            .post(`/api/v1/comments/posts/${testPost.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(commentData)
        );
      }
      await Promise.all(commentPromises);
    });

    it('should retrieve post comments successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
      expect(response.body.data.pagination.page).toBe(1);

      // Check comment structure
      const firstComment = response.body.data.comments[0];
      expect(firstComment.content).toBeDefined();
      expect(firstComment.author).toBeDefined();
      expect(firstComment.author.username).toBe(testUser.username);
      expect(firstComment.parent_id).toBeNull(); // Top-level comments only
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}?page=1&limit=2`)
        .expect(200);

      expect(response.body.data.comments).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.total).toBe(3);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/v1/comments/posts/99999')
        .expect(404);

      expect(response.body.error.code).toBe('GET_COMMENTS_FAILED');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}?page=0&limit=101`)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PAGINATION');
    });
  });

  describe('GET /api/v1/comments/:id/replies', () => {
    let parentComment: any;

    beforeEach(async () => {
      // Create a parent comment
      const parentCommentData = {
        content: 'Parent comment for replies test.',
      };

      const parentResponse = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(parentCommentData)
        .expect(201);

      parentComment = parentResponse.body.data.comment;

      // Create replies
      for (let i = 1; i <= 2; i++) {
        const replyData = {
          content: `Reply number ${i} to parent comment.`,
          parent_id: parentComment.id,
        };
        await request(app)
          .post(`/api/v1/comments/posts/${testPost.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(replyData);
      }
    });

    it('should retrieve comment replies successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/${parentComment.id}/replies`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.replies).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);

      // Verify all replies have the correct parent_id
      response.body.data.replies.forEach((reply: any) => {
        expect(reply.parent_id).toBe(parentComment.id);
      });
    });

    it('should return 404 for non-existent parent comment', async () => {
      const response = await request(app)
        .get('/api/v1/comments/99999/replies')
        .expect(404);

      expect(response.body.error.code).toBe('GET_REPLIES_FAILED');
    });
  });

  describe('GET /api/v1/comments/user/:userId', () => {
    beforeEach(async () => {
      // Create test comments for the user
      for (let i = 1; i <= 2; i++) {
        const commentData = {
          content: `User comment number ${i}.`,
        };
        await request(app)
          .post(`/api/v1/comments/posts/${testPost.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(commentData);
      }
    });

    it('should retrieve user comments successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/user/${testUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);

      // Verify all comments belong to the user
      response.body.data.comments.forEach((comment: any) => {
        expect(comment.author_id).toBe(testUser.id);
        expect(comment.post).toBeDefined();
        expect(comment.post.title).toBe(testPost.title);
      });
    });

    it('should return empty list for user with no comments', async () => {
      const response = await request(app)
        .get('/api/v1/comments/user/99999')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should validate user ID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/comments/user/invalid')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_USER_ID');
    });
  });
});