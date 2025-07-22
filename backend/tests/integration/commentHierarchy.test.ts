import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import Post from '../../src/models/Post';
import Comment from '../../src/models/Comment';

describe('Comment Hierarchy Integration Tests', () => {
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
      username: 'hierarchyuser',
      email: 'hierarchy@example.com',
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
      title: 'Test Post for Comment Hierarchy',
      content: 'This is a test post for comment hierarchy functionality.',
    };

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData)
      .expect(201);

    testPost = postResponse.body.data.post;
  });

  describe('Comment Tree Structure', () => {
    beforeEach(async () => {
      // Create a hierarchical comment structure
      // Top-level comment 1
      const comment1Response = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Top-level comment 1' });
      const comment1 = comment1Response.body.data.comment;

      // Top-level comment 2
      const comment2Response = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Top-level comment 2' });
      const comment2 = comment2Response.body.data.comment;

      // Reply to comment 1
      await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Reply to comment 1',
          parent_id: comment1.id,
        });

      // Nested reply to comment 1's reply
      const reply1Response = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Reply to comment 1',
          parent_id: comment1.id,
        });
      const reply1 = reply1Response.body.data.comment;

      await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Nested reply to reply 1',
          parent_id: reply1.id,
        });

      // Reply to comment 2
      await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Reply to comment 2',
          parent_id: comment2.id,
        });
    });

    it('should get comments with hierarchical tree structure', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}/tree`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.commentTree).toBeDefined();
      expect(response.body.data.commentTree).toHaveLength(2); // 2 top-level comments

      const tree = response.body.data.commentTree;
      
      // Check first top-level comment
      const firstComment = tree[0];
      expect(firstComment.comment.content).toBe('Top-level comment 1');
      expect(firstComment.level).toBe(0);
      expect(firstComment.replyCount).toBeGreaterThan(0);
      expect(firstComment.replies).toBeDefined();
      expect(firstComment.replies.length).toBeGreaterThan(0);

      // Check nested structure
      const firstReply = firstComment.replies[0];
      expect(firstReply.level).toBe(1);
      expect(firstReply.comment.parent_id).toBe(firstComment.comment.id);
    });

    it('should get comments in flattened structure with level indicators', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}/flattened`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toBeDefined();
      expect(response.body.data.comments.length).toBeGreaterThan(2);

      const comments = response.body.data.comments;
      
      // Check that level property is included
      comments.forEach((comment: any) => {
        expect(comment.level).toBeDefined();
        expect(comment.replyCount).toBeDefined();
        expect(typeof comment.level).toBe('number');
        expect(typeof comment.replyCount).toBe('number');
      });

      // Check that top-level comments have level 0
      const topLevelComments = comments.filter((c: any) => c.level === 0);
      expect(topLevelComments.length).toBe(2);

      // Check that replies have level > 0
      const replies = comments.filter((c: any) => c.level > 0);
      expect(replies.length).toBeGreaterThan(0);
    });

    it('should get sorted comments by oldest', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}/sorted?sortBy=oldest`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.commentTree).toBeDefined();
      expect(response.body.data.commentTree).toHaveLength(2);

      const tree = response.body.data.commentTree;
      const firstComment = tree[0];
      const secondComment = tree[1];

      // Verify oldest first ordering
      expect(new Date(firstComment.comment.created_at).getTime()).toBeLessThanOrEqual(
        new Date(secondComment.comment.created_at).getTime()
      );
    });

    it('should get sorted comments by newest', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}/sorted?sortBy=newest`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.commentTree).toBeDefined();
      expect(response.body.data.commentTree).toHaveLength(2);

      const tree = response.body.data.commentTree;
      const firstComment = tree[0];
      const secondComment = tree[1];

      // Verify newest first ordering
      expect(new Date(firstComment.comment.created_at).getTime()).toBeGreaterThanOrEqual(
        new Date(secondComment.comment.created_at).getTime()
      );
    });

    it('should get sorted comments by most replies', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}/sorted?sortBy=most_replies`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.commentTree).toBeDefined();
      expect(response.body.data.commentTree).toHaveLength(2);

      const tree = response.body.data.commentTree;
      const firstComment = tree[0];
      const secondComment = tree[1];

      // Verify most replies first ordering
      expect(firstComment.replyCount).toBeGreaterThanOrEqual(secondComment.replyCount);
    });

    it('should validate pagination parameters for tree structure', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}/tree?page=0&limit=101&maxDepth=11`)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should validate sort options', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}/sorted?sortBy=invalid`)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_SORT_OPTION');
    });

    it('should return 404 for non-existent post in tree structure', async () => {
      const response = await request(app)
        .get('/api/v1/comments/posts/99999/tree')
        .expect(404);

      expect(response.body.error.code).toBe('GET_COMMENT_TREE_FAILED');
    });
  });

  describe('Comment Deletion with Structure Preservation', () => {
    let parentComment: any;
    let replyComment: any;

    beforeEach(async () => {
      // Create a parent comment
      const parentResponse = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Parent comment with replies' });
      parentComment = parentResponse.body.data.comment;

      // Create a reply
      const replyResponse = await request(app)
        .post(`/api/v1/comments/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Reply to parent',
          parent_id: parentComment.id,
        });
      replyComment = replyResponse.body.data.comment;
    });

    it('should preserve structure when deleting comment with replies', async () => {
      // Delete the parent comment
      const deleteResponse = await request(app)
        .delete(`/api/v1/comments/${parentComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Check that comment is marked as deleted but structure is preserved
      const updatedComment = await Comment.findByPk(parentComment.id);
      expect(updatedComment!.is_deleted).toBe(true);
      expect(updatedComment!.content).toBe('[This comment has been deleted]');

      // Check that reply is still accessible
      const replyStillExists = await Comment.findByPk(replyComment.id);
      expect(replyStillExists).toBeTruthy();
      expect(replyStillExists!.is_deleted).toBe(false);

      // Check tree structure still includes the deleted comment as placeholder
      const treeResponse = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}/tree`)
        .expect(200);

      expect(treeResponse.body.data.commentTree).toHaveLength(1);
      const tree = treeResponse.body.data.commentTree[0];
      expect(tree.replies).toHaveLength(1);
      expect(tree.replies[0].comment.content).toBe('Reply to parent');
    });

    it('should completely delete comment without replies', async () => {
      // Delete the reply comment (which has no replies)
      const deleteResponse = await request(app)
        .delete(`/api/v1/comments/${replyComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Check that comment is soft deleted normally
      const deletedComment = await Comment.findByPk(replyComment.id);
      expect(deletedComment!.is_deleted).toBe(true);
      expect(deletedComment!.content).toBe('Reply to parent'); // Original content preserved
    });

    it('should update post comment count correctly when deleting', async () => {
      const initialPost = await Post.findByPk(testPost.id);
      const initialCount = initialPost!.comment_count;

      // Delete a comment
      await request(app)
        .delete(`/api/v1/comments/${replyComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check that post comment count was decremented
      const updatedPost = await Post.findByPk(testPost.id);
      expect(updatedPost!.comment_count).toBe(initialCount - 1);
    });
  });

  describe('Advanced Pagination and Limits', () => {
    beforeEach(async () => {
      // Create multiple top-level comments for pagination testing
      const commentPromises = [];
      for (let i = 1; i <= 15; i++) {
        commentPromises.push(
          request(app)
            .post(`/api/v1/comments/posts/${testPost.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ content: `Top-level comment ${i}` })
        );
      }
      await Promise.all(commentPromises);
    });

    it('should support pagination in tree structure', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}/tree?page=2&limit=5`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.commentTree).toHaveLength(5);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination.total).toBe(15);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });

    it('should support different limits for flattened structure', async () => {
      const response = await request(app)
        .get(`/api/v1/comments/posts/${testPost.id}/flattened?limit=10`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments.length).toBeLessThanOrEqual(10);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should handle empty results gracefully', async () => {
      // Create a new post with no comments
      const emptyPostResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Empty Post',
          content: 'This post has no comments.',
        });
      const emptyPost = emptyPostResponse.body.data.post;

      const response = await request(app)
        .get(`/api/v1/comments/posts/${emptyPost.id}/tree`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.commentTree).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });
});