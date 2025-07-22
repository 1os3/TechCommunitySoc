import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import Post from '../../src/models/Post';
import Comment from '../../src/models/Comment';
import Like from '../../src/models/Like';

describe('Likes Integration Tests', () => {
  let testUser: any;
  let otherUser: any;
  let authToken: string;
  let otherAuthToken: string;
  let testPost: any;
  let testComment: any;

  beforeEach(async () => {
    // Clean up test data
    await Like.destroy({ where: {} });
    await Comment.destroy({ where: {} });
    await Post.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create and register first test user
    const userData = {
      username: 'likeuser',
      email: 'like@example.com',
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

    // Create and register second test user
    const otherUserData = {
      username: 'otheruser',
      email: 'other@example.com',
      password: 'TestPassword123!',
    };

    const otherRegisterResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(otherUserData)
      .expect(201);

    otherUser = otherRegisterResponse.body.data.user;

    // Login to get other auth token
    const otherLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: otherUserData.email,
        password: otherUserData.password,
      })
      .expect(200);

    otherAuthToken = otherLoginResponse.body.data.token;

    // Create a test post
    const postData = {
      title: 'Test Post for Likes',
      content: 'This is a test post for like functionality.',
    };

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData)
      .expect(201);

    testPost = postResponse.body.data.post;

    // Create a test comment
    const commentData = {
      content: 'This is a test comment for like functionality.',
    };

    const commentResponse = await request(app)
      .post(`/api/v1/comments/posts/${testPost.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(commentData)
      .expect(201);

    testComment = commentResponse.body.data.comment;
  });

  describe('Post Likes', () => {
    it('should toggle post like successfully', async () => {
      // First toggle - like the post
      const likeResponse = await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(likeResponse.body.success).toBe(true);
      expect(likeResponse.body.data.liked).toBe(true);
      expect(likeResponse.body.data.like).toBeDefined();
      expect(likeResponse.body.data.like.user_id).toBe(testUser.id);
      expect(likeResponse.body.data.like.target_type).toBe('post');
      expect(likeResponse.body.data.like.target_id).toBe(testPost.id);

      // Verify post like count increased
      const post = await Post.findByPk(testPost.id);
      expect(post!.like_count).toBe(1);

      // Second toggle - unlike the post
      const unlikeResponse = await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unlikeResponse.body.success).toBe(true);
      expect(unlikeResponse.body.data.liked).toBe(false);
      expect(unlikeResponse.body.data.like).toBeNull();

      // Verify post like count decreased
      const updatedPost = await Post.findByPk(testPost.id);
      expect(updatedPost!.like_count).toBe(0);
    });

    it('should get post like status', async () => {
      // Initially not liked
      const statusResponse1 = await request(app)
        .get(`/api/v1/likes/posts/${testPost.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse1.body.success).toBe(true);
      expect(statusResponse1.body.data.liked).toBe(false);
      expect(statusResponse1.body.data.like).toBeNull();

      // Like the post
      await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check status after liking
      const statusResponse2 = await request(app)
        .get(`/api/v1/likes/posts/${testPost.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse2.body.success).toBe(true);
      expect(statusResponse2.body.data.liked).toBe(true);
      expect(statusResponse2.body.data.like).toBeDefined();
    });

    it('should get post like count', async () => {
      // Initially 0 likes
      const countResponse1 = await request(app)
        .get(`/api/v1/likes/posts/${testPost.id}/count`)
        .expect(200);

      expect(countResponse1.body.success).toBe(true);
      expect(countResponse1.body.data.count).toBe(0);

      // Like the post with two different users
      await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .expect(200);

      // Check count after liking
      const countResponse2 = await request(app)
        .get(`/api/v1/likes/posts/${testPost.id}/count`)
        .expect(200);

      expect(countResponse2.body.success).toBe(true);
      expect(countResponse2.body.data.count).toBe(2);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .post('/api/v1/likes/posts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('TOGGLE_POST_LIKE_FAILED');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should validate post ID parameter', async () => {
      const response = await request(app)
        .post('/api/v1/likes/posts/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_POST_ID');
    });
  });

  describe('Comment Likes', () => {
    it('should toggle comment like successfully', async () => {
      // First toggle - like the comment
      const likeResponse = await request(app)
        .post(`/api/v1/likes/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(likeResponse.body.success).toBe(true);
      expect(likeResponse.body.data.liked).toBe(true);
      expect(likeResponse.body.data.like).toBeDefined();
      expect(likeResponse.body.data.like.user_id).toBe(testUser.id);
      expect(likeResponse.body.data.like.target_type).toBe('comment');
      expect(likeResponse.body.data.like.target_id).toBe(testComment.id);

      // Verify comment like count increased
      const comment = await Comment.findByPk(testComment.id);
      expect(comment!.like_count).toBe(1);

      // Second toggle - unlike the comment
      const unlikeResponse = await request(app)
        .post(`/api/v1/likes/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unlikeResponse.body.success).toBe(true);
      expect(unlikeResponse.body.data.liked).toBe(false);
      expect(unlikeResponse.body.data.like).toBeNull();

      // Verify comment like count decreased
      const updatedComment = await Comment.findByPk(testComment.id);
      expect(updatedComment!.like_count).toBe(0);
    });

    it('should get comment like status', async () => {
      // Initially not liked
      const statusResponse1 = await request(app)
        .get(`/api/v1/likes/comments/${testComment.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse1.body.success).toBe(true);
      expect(statusResponse1.body.data.liked).toBe(false);
      expect(statusResponse1.body.data.like).toBeNull();

      // Like the comment
      await request(app)
        .post(`/api/v1/likes/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check status after liking
      const statusResponse2 = await request(app)
        .get(`/api/v1/likes/comments/${testComment.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse2.body.success).toBe(true);
      expect(statusResponse2.body.data.liked).toBe(true);
      expect(statusResponse2.body.data.like).toBeDefined();
    });

    it('should get comment like count', async () => {
      // Initially 0 likes
      const countResponse1 = await request(app)
        .get(`/api/v1/likes/comments/${testComment.id}/count`)
        .expect(200);

      expect(countResponse1.body.success).toBe(true);
      expect(countResponse1.body.data.count).toBe(0);

      // Like the comment with two different users
      await request(app)
        .post(`/api/v1/likes/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .post(`/api/v1/likes/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .expect(200);

      // Check count after liking
      const countResponse2 = await request(app)
        .get(`/api/v1/likes/comments/${testComment.id}/count`)
        .expect(200);

      expect(countResponse2.body.success).toBe(true);
      expect(countResponse2.body.data.count).toBe(2);
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .post('/api/v1/likes/comments/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('TOGGLE_COMMENT_LIKE_FAILED');
    });

    it('should validate comment ID parameter', async () => {
      const response = await request(app)
        .post('/api/v1/likes/comments/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_COMMENT_ID');
    });
  });

  describe('Batch Like Status', () => {
    beforeEach(async () => {
      // Like the post and comment
      await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .post(`/api/v1/likes/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should get batch like status successfully', async () => {
      const targets = [
        { type: 'post', id: testPost.id },
        { type: 'comment', id: testComment.id },
      ];

      const response = await request(app)
        .post('/api/v1/likes/batch/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targets })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.likeStatus).toBeDefined();
      expect(response.body.data.likeStatus[`post_${testPost.id}`]).toBe(true);
      expect(response.body.data.likeStatus[`comment_${testComment.id}`]).toBe(true);
    });

    it('should handle empty targets array', async () => {
      const response = await request(app)
        .post('/api/v1/likes/batch/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targets: [] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.likeStatus).toEqual({});
    });

    it('should validate targets format', async () => {
      const response = await request(app)
        .post('/api/v1/likes/batch/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targets: [{ type: 'invalid', id: 'not_a_number' }] })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TARGET_FORMAT');
    });

    it('should require targets to be an array', async () => {
      const response = await request(app)
        .post('/api/v1/likes/batch/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targets: 'not_an_array' })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TARGETS');
    });
  });

  describe('User Liked Content', () => {
    beforeEach(async () => {
      // Create additional posts and comments
      const secondPostResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Second Test Post',
          content: 'This is another test post.',
        })
        .expect(201);

      const secondPost = secondPostResponse.body.data.post;

      const secondCommentResponse = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is another test comment.',
        })
        .expect(201);

      const secondComment = secondCommentResponse.body.data.comment;

      // Like posts and comments
      await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .post(`/api/v1/likes/posts/${secondPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .post(`/api/v1/likes/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .post(`/api/v1/likes/comments/${secondComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should get user liked posts', async () => {
      const response = await request(app)
        .get('/api/v1/likes/user/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeDefined();
      expect(response.body.data.posts.length).toBe(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should get user liked comments', async () => {
      const response = await request(app)
        .get('/api/v1/likes/user/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toBeDefined();
      expect(response.body.data.comments.length).toBe(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should support pagination for user liked posts', async () => {
      const response = await request(app)
        .get('/api/v1/likes/user/posts?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts.length).toBe(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/likes/user/posts?page=0&limit=101')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PAGINATION');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle deactivated user account', async () => {
      // Deactivate user account
      await User.update({ is_active: false }, { where: { id: testUser.id } });

      const response = await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle deleted post', async () => {
      // Delete post
      await Post.update({ is_deleted: true }, { where: { id: testPost.id } });

      const response = await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('TOGGLE_POST_LIKE_FAILED');
      expect(response.body.error.message).toBe('Post not found');
    });

    it('should handle deleted comment', async () => {
      // Delete comment
      await Comment.update({ is_deleted: true }, { where: { id: testComment.id } });

      const response = await request(app)
        .post(`/api/v1/likes/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('TOGGLE_COMMENT_LIKE_FAILED');
      expect(response.body.error.message).toBe('Comment not found');
    });

    it('should prevent multiple likes from same user on same content', async () => {
      // First like should succeed
      await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Second like should toggle (remove the like)
      const response = await request(app)
        .post(`/api/v1/likes/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.liked).toBe(false);

      // Verify only 0 likes in database
      const likeCount = await Like.count({
        where: {
          user_id: testUser.id,
          target_type: 'post',
          target_id: testPost.id,
        },
      });
      expect(likeCount).toBe(0);
    });
  });
});