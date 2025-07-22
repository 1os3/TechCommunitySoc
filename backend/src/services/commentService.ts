import Comment from '../models/Comment';
import Post from '../models/Post';
import User from '../models/User';
import logger from '../utils/logger';
import HotnessUpdateService from './hotnessUpdateService';
import { NotificationService } from './notificationService';
import { ViolationService } from './violationService';

export interface CreateCommentData {
  content: string;
  post_id: number;
  author_id: number;
  parent_id?: number;
}

export interface UpdateCommentData {
  content?: string;
}

export interface CommentResult {
  success: boolean;
  comment?: Comment;
  message?: string;
  error?: string;
}

export interface CommentListResult {
  success: boolean;
  comments?: Comment[];
  total?: number;
  message?: string;
  error?: string;
}

export interface CommentTree {
  comment: Comment;
  replies: CommentTree[];
  replyCount: number;
  level: number;
}

export interface CommentTreeResult {
  success: boolean;
  commentTree?: CommentTree[];
  total?: number;
  message?: string;
  error?: string;
}

export class CommentService {
  static async createComment(commentData: CreateCommentData): Promise<CommentResult> {
    try {
      logger.info(`Creating comment for post: ${commentData.post_id} by user: ${commentData.author_id}`);

      // Verify user exists and is active
      const user = await User.findByPk(commentData.author_id);
      if (!user) {
        logger.warn(`Comment creation failed: User not found ${commentData.author_id}`);
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (!user.is_active) {
        logger.warn(`Comment creation failed: User account is deactivated ${commentData.author_id}`);
        return {
          success: false,
          error: 'Account is deactivated',
        };
      }

      // Verify post exists and is not deleted
      const post = await Post.findActivePostById(commentData.post_id);
      if (!post) {
        logger.warn(`Comment creation failed: Post not found ${commentData.post_id}`);
        return {
          success: false,
          error: 'Post not found',
        };
      }

      // If this is a reply, verify parent comment exists
      if (commentData.parent_id) {
        const parentComment = await Comment.findOne({
          where: {
            id: commentData.parent_id,
            post_id: commentData.post_id,
            is_deleted: false,
          },
        });

        if (!parentComment) {
          logger.warn(`Comment creation failed: Parent comment not found ${commentData.parent_id}`);
          return {
            success: false,
            error: 'Parent comment not found',
          };
        }
      }

      // Check for violations in comment content
      const violationResult = await ViolationService.detectViolations(commentData.content);

      // Block comment creation if violations found and record violations
      if (violationResult.hasViolations) {
        logger.warn(`Comment creation blocked for user ${commentData.author_id} due to ${violationResult.violations.length} violations`);
        
        // Record the violation attempt (use a temporary ID since comment wasn't created)
        await ViolationService.recordViolations(
          commentData.author_id,
          'comment',
          0, // Use 0 for blocked content
          commentData.content,
          violationResult.violations
        );
        
        const violatedWords = violationResult.violations.map(v => v.word).join(', ');
        return {
          success: false,
          error: `评论包含违规词汇，无法发布。违规词汇: ${violatedWords}`
        };
      }

      // Create comment
      const comment = await Comment.create({
        content: commentData.content,
        post_id: commentData.post_id,
        author_id: commentData.author_id,
        parent_id: commentData.parent_id || null,
      });

      // Update post comment count
      await post.incrementCommentCount();

      // Create notification
      try {
        if (commentData.parent_id) {
          // This is a reply - notify the parent comment author
          await NotificationService.createReplyNotification(
            commentData.author_id,
            commentData.post_id,
            comment.id,
            commentData.parent_id,
            user.username,
            post.title
          );
        } else {
          // This is a direct comment - notify the post author
          await NotificationService.createCommentNotification(
            commentData.author_id,
            commentData.post_id,
            comment.id,
            user.username,
            post.title
          );
        }
      } catch (notificationError) {
        logger.warn(`Failed to create comment notification for post ${commentData.post_id}:`, notificationError);
      }

      // Trigger real-time hotness update
      try {
        const hotnessUpdateService = HotnessUpdateService.getInstance();
        await hotnessUpdateService.onPostComment(commentData.post_id, commentData.author_id, comment.id);
      } catch (hotnessError) {
        // Don't fail the comment creation if hotness update fails
        logger.warn(`Failed to trigger hotness update for post ${commentData.post_id}:`, hotnessError);
      }

      logger.info(`Comment created successfully: ${comment.id}`);

      return {
        success: true,
        comment,
        message: 'Comment created successfully',
      };
    } catch (error) {
      logger.error('Comment creation error:', error);
      return {
        success: false,
        error: 'Comment creation failed due to server error',
      };
    }
  }

  static async getCommentById(id: number): Promise<CommentResult> {
    try {
      logger.info(`Fetching comment: ${id}`);

      const comment = await Comment.findOne({
        where: { id, is_deleted: false },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar_url'],
          },
        ],
      });

      if (!comment) {
        logger.warn(`Comment not found: ${id}`);
        return {
          success: false,
          error: 'Comment not found',
        };
      }

      logger.info(`Comment fetched successfully: ${comment.id}`);

      return {
        success: true,
        comment,
        message: 'Comment retrieved successfully',
      };
    } catch (error) {
      logger.error('Get comment error:', error);
      return {
        success: false,
        error: 'Failed to retrieve comment',
      };
    }
  }

  static async updateComment(commentId: number, userId: number, updateData: UpdateCommentData): Promise<CommentResult> {
    try {
      logger.info(`Updating comment ${commentId} by user ${userId}`);

      const comment = await Comment.findOne({
        where: { id: commentId, is_deleted: false },
      });

      if (!comment) {
        logger.warn(`Update failed: Comment not found ${commentId}`);
        return {
          success: false,
          error: 'Comment not found',
        };
      }

      // Check if user is the author
      if (comment.author_id !== userId) {
        logger.warn(`Update failed: User ${userId} is not the author of comment ${commentId}`);
        return {
          success: false,
          error: 'You can only edit your own comments',
        };
      }

      // Update comment
      await comment.update(updateData);

      logger.info(`Comment updated successfully: ${comment.id}`);

      return {
        success: true,
        comment,
        message: 'Comment updated successfully',
      };
    } catch (error) {
      logger.error('Comment update error:', error);
      return {
        success: false,
        error: 'Comment update failed due to server error',
      };
    }
  }

  static async deleteComment(commentId: number, userId: number): Promise<CommentResult> {
    try {
      logger.info(`Deleting comment ${commentId} by user ${userId}`);

      const comment = await Comment.findOne({
        where: { id: commentId, is_deleted: false },
      });

      if (!comment) {
        logger.warn(`Delete failed: Comment not found ${commentId}`);
        return {
          success: false,
          error: 'Comment not found',
        };
      }

      // Check if user is the author
      if (comment.author_id !== userId) {
        logger.warn(`Delete failed: User ${userId} is not the author of comment ${commentId}`);
        return {
          success: false,
          error: 'You can only delete your own comments',
        };
      }

      // Check if comment has replies
      const replyCount = await Comment.count({
        where: {
          parent_id: commentId,
          is_deleted: false,
        },
      });

      if (replyCount > 0) {
        // If comment has replies, replace content with deletion placeholder to preserve structure
        await comment.update({
          content: '[This comment has been deleted]',
          is_deleted: true,
        });
        logger.info(`Comment with replies soft deleted (placeholder): ${comment.id}`);
      } else {
        // If no replies, perform normal soft delete
        await comment.update({ is_deleted: true });
        logger.info(`Comment soft deleted: ${comment.id}`);
      }

      // Update post comment count
      const post = await Post.findByPk(comment.post_id);
      if (post) {
        await post.decrementCommentCount();
      }

      return {
        success: true,
        message: 'Comment deleted successfully',
      };
    } catch (error) {
      logger.error('Comment deletion error:', error);
      return {
        success: false,
        error: 'Comment deletion failed due to server error',
      };
    }
  }

  // Admin delete comment (can delete any comment)
  static async adminDeleteComment(commentId: number, adminId: number): Promise<CommentResult> {
    try {
      logger.info(`Admin deleting comment ${commentId} by admin ${adminId}`);
      const comment = await Comment.findOne({
        where: { id: commentId, is_deleted: false },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username'],
          },
        ],
      });

      if (!comment) {
        logger.warn(`Admin delete failed: Comment not found ${commentId}`);
        return {
          success: false,
          error: 'Comment not found',
        };
      }

      // Check if comment has replies
      const replyCount = await Comment.count({
        where: {
          parent_id: commentId,
          is_deleted: false,
        },
      });

      if (replyCount > 0) {
        // If comment has replies, replace content with deletion placeholder to preserve structure
        await comment.update({
          content: '[This comment has been deleted by admin]',
          is_deleted: true,
        });
        logger.info(`Comment with replies deleted by admin (placeholder): ${comment.id} (author: ${comment.author?.username || 'unknown'}) by admin: ${adminId}`);
      } else {
        // If no replies, perform normal soft delete
        await comment.update({ is_deleted: true });
        logger.info(`Comment deleted by admin: ${comment.id} (author: ${comment.author?.username || 'unknown'}) by admin: ${adminId}`);
      }

      // Update post comment count
      const post = await Post.findByPk(comment.post_id);
      if (post) {
        await post.decrementCommentCount();
      }

      return {
        success: true,
        message: 'Comment deleted successfully by admin',
        comment,
      };
    } catch (error) {
      logger.error('Admin comment deletion error:', error);
      return {
        success: false,
        error: 'Admin comment deletion failed due to server error',
      };
    }
  }

  static async getPostComments(
    postId: number,
    page: number = 1,
    limit: number = 20,
    orderBy: string = 'created_at'
  ): Promise<CommentListResult> {
    try {
      logger.info(`Fetching comments for post ${postId}: page ${page}, limit ${limit}, order by ${orderBy}`);

      // Verify post exists
      const post = await Post.findActivePostById(postId);
      if (!post) {
        logger.warn(`Get comments failed: Post not found ${postId}`);
        return {
          success: false,
          error: 'Post not found',
        };
      }

      const offset = (page - 1) * limit;
      const validOrderColumns = ['created_at', 'updated_at'];
      const orderColumn = validOrderColumns.includes(orderBy) ? orderBy : 'created_at';

      // Get top-level comments (no parent_id)
      const comments = await Comment.findAll({
        where: {
          post_id: postId,
          parent_id: null,
          is_deleted: false,
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar_url'],
          },
        ],
        order: [[orderColumn, 'ASC']],
        limit,
        offset,
      });

      // Get total count for pagination
      const total = await Comment.count({
        where: {
          post_id: postId,
          parent_id: null,
          is_deleted: false,
        },
      });

      logger.info(`Post comments fetched successfully: ${comments.length} comments`);

      return {
        success: true,
        comments,
        total,
        message: 'Comments retrieved successfully',
      };
    } catch (error) {
      logger.error('Get post comments error:', error);
      return {
        success: false,
        error: 'Failed to retrieve comments',
      };
    }
  }

  static async getCommentReplies(
    commentId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<CommentListResult> {
    try {
      logger.info(`Fetching replies for comment ${commentId}: page ${page}, limit ${limit}`);

      // Verify parent comment exists
      const parentComment = await Comment.findOne({
        where: { id: commentId, is_deleted: false },
      });

      if (!parentComment) {
        logger.warn(`Get replies failed: Parent comment not found ${commentId}`);
        return {
          success: false,
          error: 'Parent comment not found',
        };
      }

      const offset = (page - 1) * limit;

      const replies = await Comment.findAll({
        where: {
          parent_id: commentId,
          is_deleted: false,
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar_url'],
          },
        ],
        order: [['created_at', 'ASC']],
        limit,
        offset,
      });

      // Get total count for pagination
      const total = await Comment.count({
        where: {
          parent_id: commentId,
          is_deleted: false,
        },
      });

      logger.info(`Comment replies fetched successfully: ${replies.length} replies`);

      return {
        success: true,
        comments: replies,
        total,
        message: 'Replies retrieved successfully',
      };
    } catch (error) {
      logger.error('Get comment replies error:', error);
      return {
        success: false,
        error: 'Failed to retrieve replies',
      };
    }
  }

  static async getUserComments(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<CommentListResult> {
    try {
      logger.info(`Fetching comments for user ${userId}: page ${page}, limit ${limit}`);

      const offset = (page - 1) * limit;

      const comments = await Comment.findAll({
        where: {
          author_id: userId,
          is_deleted: false,
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar_url'],
          },
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title'],
            where: { is_deleted: false },
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      // Get total count for pagination
      const total = await Comment.count({
        where: {
          author_id: userId,
          is_deleted: false,
        },
        include: [
          {
            model: Post,
            as: 'post',
            where: { is_deleted: false },
          },
        ],
      });

      logger.info(`User comments fetched successfully: ${comments.length} comments`);

      return {
        success: true,
        comments,
        total,
        message: 'User comments retrieved successfully',
      };
    } catch (error) {
      logger.error('Get user comments error:', error);
      return {
        success: false,
        error: 'Failed to retrieve user comments',
      };
    }
  }

  /**
   * Build hierarchical comment tree structure
   */
  static buildCommentTree(comments: Comment[], level: number = 0): CommentTree[] {
    const tree: CommentTree[] = [];
    const commentMap = new Map<number, Comment[]>();

    // Group comments by parent_id
    comments.forEach(comment => {
      const parentId = comment.parent_id || 0;
      if (!commentMap.has(parentId)) {
        commentMap.set(parentId, []);
      }
      commentMap.get(parentId)!.push(comment);
    });

    // Build tree structure for top-level comments (parent_id = null/0)
    const topLevelComments = commentMap.get(0) || [];
    
    for (const comment of topLevelComments) {
      const replies = this.buildCommentTreeRecursive(comment.id, commentMap, level + 1);
      const replyCount = this.countReplies(comment.id, commentMap);
      
      // Include top-level comment if:
      // 1. It's not deleted, OR
      // 2. It's deleted but has non-deleted replies (to preserve structure)
      if (!comment.is_deleted || replies.length > 0) {
        tree.push({
          comment,
          replies,
          replyCount,
          level,
        });
      }
    }

    return tree;
  }

  /**
   * Recursively build comment tree structure
   */
  private static buildCommentTreeRecursive(
    parentId: number,
    commentMap: Map<number, Comment[]>,
    level: number
  ): CommentTree[] {
    const tree: CommentTree[] = [];
    const children = commentMap.get(parentId) || [];

    for (const comment of children) {
      const replies = this.buildCommentTreeRecursive(comment.id, commentMap, level + 1);
      const replyCount = this.countReplies(comment.id, commentMap);

      // Include comment if:
      // 1. It's not deleted, OR
      // 2. It's deleted but has non-deleted replies (to preserve structure)
      if (!comment.is_deleted || replies.length > 0) {
        tree.push({
          comment,
          replies,
          replyCount,
          level,
        });
      }
    }

    return tree;
  }

  /**
   * Count total replies for a comment (including nested replies)
   */
  private static countReplies(commentId: number, commentMap: Map<number, Comment[]>): number {
    const directReplies = commentMap.get(commentId) || [];
    let totalCount = 0;

    // Count only non-deleted replies
    for (const reply of directReplies) {
      if (!reply.is_deleted) {
        totalCount += 1;
        totalCount += this.countReplies(reply.id, commentMap);
      } else {
        // For deleted replies, still count their children if they exist
        totalCount += this.countReplies(reply.id, commentMap);
      }
    }

    return totalCount;
  }

  /**
   * Get post comments with hierarchical tree structure
   */
  static async getPostCommentsTree(
    postId: number,
    page: number = 1,
    limit: number = 20,
    orderBy: string = 'created_at',
    maxDepth: number = 5
  ): Promise<CommentTreeResult> {
    try {
      logger.info(`Fetching comment tree for post ${postId}: page ${page}, limit ${limit}, maxDepth ${maxDepth}`);

      // Verify post exists
      const post = await Post.findActivePostById(postId);
      if (!post) {
        logger.warn(`Get comment tree failed: Post not found ${postId}`);
        return {
          success: false,
          error: 'Post not found',
        };
      }

      const validOrderColumns = ['created_at', 'updated_at'];
      const orderColumn = validOrderColumns.includes(orderBy) ? orderBy : 'created_at';

      // Get all comments for the post including deleted ones (we'll build the tree structure in memory)
      // We need deleted comments to preserve the hierarchy structure
      const allComments = await Comment.findAll({
        where: {
          post_id: postId,
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar_url'],
          },
        ],
        order: [[orderColumn, 'ASC']],
      });

      // Build the hierarchical tree structure
      const commentTree = this.buildCommentTree(allComments);

      // Apply pagination to top-level comments only
      const offset = (page - 1) * limit;
      const paginatedTree = commentTree.slice(offset, offset + limit);

      // Get total count of top-level comments for pagination
      const total = await Comment.count({
        where: {
          post_id: postId,
          parent_id: null,
          is_deleted: false,
        },
      });

      logger.info(`Comment tree fetched successfully: ${commentTree.length} top-level comments`);

      return {
        success: true,
        commentTree: paginatedTree,
        total,
        message: 'Comment tree retrieved successfully',
      };
    } catch (error) {
      logger.error('Get comment tree error:', error);
      return {
        success: false,
        error: 'Failed to retrieve comment tree',
      };
    }
  }

  /**
   * Get flattened comment structure with level indicators
   */
  static async getPostCommentsFlattened(
    postId: number,
    page: number = 1,
    limit: number = 50,
    orderBy: string = 'created_at',
    maxDepth: number = 5
  ): Promise<CommentListResult> {
    try {
      logger.info(`Fetching flattened comments for post ${postId}: page ${page}, limit ${limit}, maxDepth ${maxDepth}`);

      // Get the comment tree first
      const treeResult = await this.getPostCommentsTree(postId, page, limit, orderBy, maxDepth);
      
      if (!treeResult.success || !treeResult.commentTree) {
        return {
          success: false,
          error: treeResult.error || 'Failed to build comment tree',
        };
      }

      // Flatten the tree structure
      const flattenedComments: Comment[] = [];
      
      const flattenTree = (tree: CommentTree[]) => {
        for (const node of tree) {
          // Add level property to comment for display purposes
          (node.comment as any).level = node.level;
          (node.comment as any).replyCount = node.replyCount;
          flattenedComments.push(node.comment);
          
          // Recursively add replies
          if (node.replies.length > 0) {
            flattenTree(node.replies);
          }
        }
      };

      flattenTree(treeResult.commentTree);

      logger.info(`Flattened comments retrieved: ${flattenedComments.length} comments`);

      return {
        success: true,
        comments: flattenedComments,
        total: treeResult.total,
        message: 'Flattened comments retrieved successfully',
      };
    } catch (error) {
      logger.error('Get flattened comments error:', error);
      return {
        success: false,
        error: 'Failed to retrieve flattened comments',
      };
    }
  }

  /**
   * Sort comments with different strategies
   */
  static async getPostCommentsSorted(
    postId: number,
    sortBy: 'oldest' | 'newest' | 'most_replies' = 'oldest',
    page: number = 1,
    limit: number = 20
  ): Promise<CommentTreeResult> {
    try {
      logger.info(`Fetching sorted comments for post ${postId}: sortBy ${sortBy}, page ${page}, limit ${limit}`);

      let orderBy: string;
      switch (sortBy) {
        case 'newest':
          orderBy = 'created_at';
          break;
        case 'most_replies':
          // For most replies, we'll need to count after building the tree
          orderBy = 'created_at';
          break;
        case 'oldest':
        default:
          orderBy = 'created_at';
          break;
      }

      const treeResult = await this.getPostCommentsTree(postId, page, limit, orderBy);
      
      if (!treeResult.success || !treeResult.commentTree) {
        return treeResult;
      }

      // Apply custom sorting if needed
      if (sortBy === 'newest') {
        treeResult.commentTree.sort((a, b) => 
          new Date(b.comment.created_at).getTime() - new Date(a.comment.created_at).getTime()
        );
      } else if (sortBy === 'most_replies') {
        treeResult.commentTree.sort((a, b) => b.replyCount - a.replyCount);
      }

      logger.info(`Sorted comments retrieved successfully: ${treeResult.commentTree.length} comments`);

      return {
        ...treeResult,
        message: `Comments sorted by ${sortBy} retrieved successfully`,
      };
    } catch (error) {
      logger.error('Get sorted comments error:', error);
      return {
        success: false,
        error: 'Failed to retrieve sorted comments',
      };
    }
  }
}