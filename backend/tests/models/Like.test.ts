import Like from '../../src/models/Like';
import Post from '../../src/models/Post';
import User from '../../src/models/User';
import Comment from '../../src/models/Comment';

describe('Like Model', () => {
  let testUser: User;
  let testPost: Post;
  let testComment: Comment;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword123',
    });

    testPost = await Post.create({
      title: 'Test Post',
      content: 'This is test content',
      author_id: testUser.id,
    });

    testComment = await Comment.create({
      content: 'Test comment',
      author_id: testUser.id,
      post_id: testPost.id,
    });
  });

  describe('Like Creation', () => {
    it('should create a like for a post', async () => {
      const like = await Like.create({
        user_id: testUser.id,
        target_type: 'post',
        target_id: testPost.id,
      });

      expect(like.id).toBeDefined();
      expect(like.user_id).toBe(testUser.id);
      expect(like.target_type).toBe('post');
      expect(like.target_id).toBe(testPost.id);
      expect(like.created_at).toBeInstanceOf(Date);
    });

    it('should create a like for a comment', async () => {
      const like = await Like.create({
        user_id: testUser.id,
        target_type: 'comment',
        target_id: testComment.id,
      });

      expect(like.id).toBeDefined();
      expect(like.user_id).toBe(testUser.id);
      expect(like.target_type).toBe('comment');
      expect(like.target_id).toBe(testComment.id);
    });

    it('should validate target_type', async () => {
      const invalidLike = {
        user_id: testUser.id,
        target_type: 'invalid' as any,
        target_id: testPost.id,
      };

      await expect(Like.create(invalidLike)).rejects.toThrow();
    });

    it('should enforce unique constraint', async () => {
      await Like.create({
        user_id: testUser.id,
        target_type: 'post',
        target_id: testPost.id,
      });

      const duplicateLike = {
        user_id: testUser.id,
        target_type: 'post' as const,
        target_id: testPost.id,
      };

      await expect(Like.create(duplicateLike)).rejects.toThrow();
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await Like.create({
        user_id: testUser.id,
        target_type: 'post',
        target_id: testPost.id,
      });
    });

    describe('findByUserAndTarget', () => {
      it('should find existing like', async () => {
        const like = await Like.findByUserAndTarget(testUser.id, 'post', testPost.id);
        expect(like).toBeTruthy();
        expect(like?.user_id).toBe(testUser.id);
      });

      it('should return null for non-existent like', async () => {
        const like = await Like.findByUserAndTarget(testUser.id, 'comment', testComment.id);
        expect(like).toBeNull();
      });
    });

    describe('countByTarget', () => {
      it('should count likes for a target', async () => {
        const count = await Like.countByTarget('post', testPost.id);
        expect(count).toBe(1);
      });

      it('should return 0 for target with no likes', async () => {
        const count = await Like.countByTarget('comment', testComment.id);
        expect(count).toBe(0);
      });
    });

    describe('getUserLikeStatus', () => {
      it('should return like status for multiple targets', async () => {
        const targets = [
          { type: 'post' as const, id: testPost.id },
          { type: 'comment' as const, id: testComment.id },
        ];

        const status = await Like.getUserLikeStatus(testUser.id, targets);
        
        expect(status.get(`post_${testPost.id}`)).toBe(true);
        expect(status.get(`comment_${testComment.id}`)).toBe(false);
      });
    });

    describe('createLike', () => {
      it('should create a new like', async () => {
        const like = await Like.createLike(testUser.id, 'comment', testComment.id);
        expect(like.target_type).toBe('comment');
        expect(like.target_id).toBe(testComment.id);
      });
    });

    describe('removeLike', () => {
      it('should remove existing like', async () => {
        const removed = await Like.removeLike(testUser.id, 'post', testPost.id);
        expect(removed).toBe(true);

        const like = await Like.findByUserAndTarget(testUser.id, 'post', testPost.id);
        expect(like).toBeNull();
      });

      it('should return false for non-existent like', async () => {
        const removed = await Like.removeLike(testUser.id, 'comment', testComment.id);
        expect(removed).toBe(false);
      });
    });

    describe('toggleLike', () => {
      it('should remove existing like', async () => {
        const result = await Like.toggleLike(testUser.id, 'post', testPost.id);
        expect(result.liked).toBe(false);
        expect(result.like).toBeUndefined();
      });

      it('should create new like', async () => {
        const result = await Like.toggleLike(testUser.id, 'comment', testComment.id);
        expect(result.liked).toBe(true);
        expect(result.like).toBeTruthy();
      });

      it('should toggle like twice', async () => {
        // Remove existing like
        const result1 = await Like.toggleLike(testUser.id, 'post', testPost.id);
        expect(result1.liked).toBe(false);

        // Add like back
        const result2 = await Like.toggleLike(testUser.id, 'post', testPost.id);
        expect(result2.liked).toBe(true);
        expect(result2.like).toBeTruthy();
      });
    });
  });
});