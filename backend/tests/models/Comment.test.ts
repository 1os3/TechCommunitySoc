import Comment from '../../src/models/Comment';
import Post from '../../src/models/Post';
import User from '../../src/models/User';

describe('Comment Model', () => {
  let testUser: User;
  let testPost: Post;

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
  });

  describe('Comment Creation', () => {
    it('should create a comment with valid data', async () => {
      const commentData = {
        content: 'This is a test comment',
        author_id: testUser.id,
        post_id: testPost.id,
      };

      const comment = await Comment.create(commentData);

      expect(comment.id).toBeDefined();
      expect(comment.content).toBe(commentData.content);
      expect(comment.author_id).toBe(testUser.id);
      expect(comment.post_id).toBe(testPost.id);
      expect(comment.parent_id).toBeFalsy();
      expect(comment.like_count).toBe(0);
      expect(comment.is_deleted).toBe(false);
      expect(comment.created_at).toBeInstanceOf(Date);
      expect(comment.updated_at).toBeInstanceOf(Date);
    });

    it('should create a reply comment', async () => {
      const parentComment = await Comment.create({
        content: 'Parent comment',
        author_id: testUser.id,
        post_id: testPost.id,
      });

      const replyData = {
        content: 'This is a reply',
        author_id: testUser.id,
        post_id: testPost.id,
        parent_id: parentComment.id,
      };

      const reply = await Comment.create(replyData);

      expect(reply.parent_id).toBe(parentComment.id);
    });

    it('should require content, author_id, and post_id', async () => {
      const commentDataWithoutContent = {
        author_id: testUser.id,
        post_id: testPost.id,
      };

      await expect(Comment.create(commentDataWithoutContent as any)).rejects.toThrow();

      const commentDataWithoutAuthor = {
        content: 'Test comment',
        post_id: testPost.id,
      };

      await expect(Comment.create(commentDataWithoutAuthor as any)).rejects.toThrow();

      const commentDataWithoutPost = {
        content: 'Test comment',
        author_id: testUser.id,
      };

      await expect(Comment.create(commentDataWithoutPost as any)).rejects.toThrow();
    });

    it('should validate content length', async () => {
      const commentData = {
        content: '', // Empty content
        author_id: testUser.id,
        post_id: testPost.id,
      };

      await expect(Comment.create(commentData)).rejects.toThrow();
    });
  });

  describe('Comment Methods', () => {
    let testComment: Comment;

    beforeEach(async () => {
      testComment = await Comment.create({
        content: 'Test comment',
        author_id: testUser.id,
        post_id: testPost.id,
      });
    });

    describe('incrementLikeCount', () => {
      it('should increment like count', async () => {
        const initialCount = testComment.like_count;
        await testComment.incrementLikeCount();
        await testComment.reload();
        expect(testComment.like_count).toBe(initialCount + 1);
      });
    });

    describe('decrementLikeCount', () => {
      it('should decrement like count', async () => {
        await testComment.update({ like_count: 5 });
        await testComment.decrementLikeCount();
        await testComment.reload();
        expect(testComment.like_count).toBe(4);
      });
    });

    describe('softDelete', () => {
      it('should mark comment as deleted and change content', async () => {
        await testComment.softDelete();
        await testComment.reload();
        expect(testComment.is_deleted).toBe(true);
        expect(testComment.content).toBe('[已删除]');
      });
    });

    describe('getRepliesCount', () => {
      it('should return number of replies', async () => {
        await Comment.create({
          content: 'Reply 1',
          author_id: testUser.id,
          post_id: testPost.id,
          parent_id: testComment.id,
        });

        await Comment.create({
          content: 'Reply 2',
          author_id: testUser.id,
          post_id: testPost.id,
          parent_id: testComment.id,
        });

        const count = await testComment.getRepliesCount();
        expect(count).toBe(2);
      });
    });

    describe('hasReplies', () => {
      it('should return true when comment has replies', async () => {
        await Comment.create({
          content: 'Reply',
          author_id: testUser.id,
          post_id: testPost.id,
          parent_id: testComment.id,
        });

        const hasReplies = await testComment.hasReplies();
        expect(hasReplies).toBe(true);
      });

      it('should return false when comment has no replies', async () => {
        const hasReplies = await testComment.hasReplies();
        expect(hasReplies).toBe(false);
      });
    });
  });

  describe('Static Methods', () => {
    let testComment: Comment;

    beforeEach(async () => {
      testComment = await Comment.create({
        content: 'Test comment',
        author_id: testUser.id,
        post_id: testPost.id,
      });
    });

    describe('findByPostId', () => {
      it('should find comments by post id', async () => {
        const comments = await Comment.findByPostId(testPost.id);
        expect(comments).toHaveLength(1);
        expect(comments[0].id).toBe(testComment.id);
      });

      it('should not return deleted comments', async () => {
        await testComment.softDelete();
        const comments = await Comment.findByPostId(testPost.id);
        expect(comments).toHaveLength(0);
      });

      it('should order comments by creation time', async () => {
        const secondComment = await Comment.create({
          content: 'Second comment',
          author_id: testUser.id,
          post_id: testPost.id,
        });

        const comments = await Comment.findByPostId(testPost.id);
        expect(comments).toHaveLength(2);
        expect(comments[0].id).toBe(testComment.id);
        expect(comments[1].id).toBe(secondComment.id);
      });
    });

    describe('findCommentTree', () => {
      it('should build comment tree structure', async () => {
        const reply1 = await Comment.create({
          content: 'Reply 1',
          author_id: testUser.id,
          post_id: testPost.id,
          parent_id: testComment.id,
        });

        const reply2 = await Comment.create({
          content: 'Reply 2',
          author_id: testUser.id,
          post_id: testPost.id,
          parent_id: testComment.id,
        });

        const tree = await Comment.findCommentTree(testPost.id);
        expect(tree).toHaveLength(1);
        expect(tree[0].id).toBe(testComment.id);
        
        const parentWithReplies = tree[0] as Comment & { replies: Comment[] };
        expect(parentWithReplies.replies).toHaveLength(2);
        expect(parentWithReplies.replies[0].id).toBe(reply1.id);
        expect(parentWithReplies.replies[1].id).toBe(reply2.id);
      });
    });

    describe('findActiveCommentById', () => {
      it('should find active comment by id', async () => {
        const found = await Comment.findActiveCommentById(testComment.id);
        expect(found).toBeTruthy();
        expect(found?.id).toBe(testComment.id);
      });

      it('should not find deleted comment', async () => {
        await testComment.softDelete();
        const found = await Comment.findActiveCommentById(testComment.id);
        expect(found).toBeNull();
      });
    });
  });
});