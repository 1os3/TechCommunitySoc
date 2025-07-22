import { Response } from 'express';
import { CommentService, CreateCommentData, UpdateCommentData } from '../services/commentService';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class CommentController {
  static async createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const commentData: CreateCommentData = {
        content: req.body.content,
        post_id: parseInt(req.params.postId),
        author_id: req.user.id,
        parent_id: req.body.parent_id ? parseInt(req.body.parent_id) : undefined,
      };

      if (isNaN(commentData.post_id)) {
        res.status(400).json({
          error: {
            code: 'INVALID_POST_ID',
            message: 'Invalid post ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await CommentService.createComment(commentData);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' || result.error === 'Parent comment not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'COMMENT_CREATION_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Fetch the created comment with author information
      const commentWithAuthor = await CommentService.getCommentById(result.comment!.id);
      
      if (!commentWithAuthor.success || !commentWithAuthor.comment) {
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Comment created but failed to retrieve with author info',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          comment: {
            id: commentWithAuthor.comment.id,
            content: commentWithAuthor.comment.content,
            post_id: commentWithAuthor.comment.post_id,
            author_id: commentWithAuthor.comment.author_id,
            parent_id: commentWithAuthor.comment.parent_id,
            author: commentWithAuthor.comment.author,
            created_at: commentWithAuthor.comment.created_at,
            updated_at: commentWithAuthor.comment.updated_at,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Create comment controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Comment creation failed due to server error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_COMMENT_ID',
            message: 'Invalid comment ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await CommentService.getCommentById(commentId);

      if (!result.success) {
        const statusCode = result.error === 'Comment not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          comment: {
            id: result.comment!.id,
            content: result.comment!.content,
            post_id: result.comment!.post_id,
            author_id: result.comment!.author_id,
            parent_id: result.comment!.parent_id,
            author: result.comment!.author,
            created_at: result.comment!.created_at,
            updated_at: result.comment!.updated_at,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get comment controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve comment',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_COMMENT_ID',
            message: 'Invalid comment ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const updateData: UpdateCommentData = {
        content: req.body.content,
      };

      const result = await CommentService.updateComment(commentId, req.user.id, updateData);

      if (!result.success) {
        const statusCode = result.error === 'Comment not found' ? 404 : 
                          result.error === 'You can only edit your own comments' ? 403 : 400;
        res.status(statusCode).json({
          error: {
            code: 'COMMENT_UPDATE_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          comment: {
            id: result.comment!.id,
            content: result.comment!.content,
            post_id: result.comment!.post_id,
            author_id: result.comment!.author_id,
            parent_id: result.comment!.parent_id,
            created_at: result.comment!.created_at,
            updated_at: result.comment!.updated_at,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Update comment controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Comment update failed due to server error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_COMMENT_ID',
            message: 'Invalid comment ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await CommentService.deleteComment(commentId, req.user.id);

      if (!result.success) {
        const statusCode = result.error === 'Comment not found' ? 404 : 
                          result.error === 'You can only delete your own comments' ? 403 : 400;
        res.status(statusCode).json({
          error: {
            code: 'COMMENT_DELETION_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Delete comment controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Comment deletion failed due to server error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getPostComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_POST_ID',
            message: 'Invalid post ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const orderBy = req.query.orderBy as string || 'created_at';

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          error: {
            code: 'INVALID_PAGINATION',
            message: 'Invalid pagination parameters',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await CommentService.getPostComments(postId, page, limit, orderBy);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'GET_COMMENTS_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          comments: result.comments!.map(comment => ({
            id: comment.id,
            content: comment.content,
            post_id: comment.post_id,
            author_id: comment.author_id,
            parent_id: comment.parent_id,
            author: comment.author,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
          })),
          pagination: {
            page,
            limit,
            total: result.total!,
            totalPages: Math.ceil(result.total! / limit),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get post comments controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve comments',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getCommentReplies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_COMMENT_ID',
            message: 'Invalid comment ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          error: {
            code: 'INVALID_PAGINATION',
            message: 'Invalid pagination parameters',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await CommentService.getCommentReplies(commentId, page, limit);

      if (!result.success) {
        const statusCode = result.error === 'Parent comment not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'GET_REPLIES_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          replies: result.comments!.map(comment => ({
            id: comment.id,
            content: comment.content,
            post_id: comment.post_id,
            author_id: comment.author_id,
            parent_id: comment.parent_id,
            author: comment.author,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
          })),
          pagination: {
            page,
            limit,
            total: result.total!,
            totalPages: Math.ceil(result.total! / limit),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get comment replies controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve replies',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getUserComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          error: {
            code: 'INVALID_PAGINATION',
            message: 'Invalid pagination parameters',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await CommentService.getUserComments(userId, page, limit);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'GET_USER_COMMENTS_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          comments: result.comments!.map(comment => ({
            id: comment.id,
            content: comment.content,
            post_id: comment.post_id,
            author_id: comment.author_id,
            parent_id: comment.parent_id,
            author: comment.author,
            post: comment.post,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
          })),
          pagination: {
            page,
            limit,
            total: result.total!,
            totalPages: Math.ceil(result.total! / limit),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get user comments controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve user comments',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getPostCommentsTree(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_POST_ID',
            message: 'Invalid post ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const orderBy = req.query.orderBy as string || 'created_at';
      const maxDepth = parseInt(req.query.maxDepth as string) || 5;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100 || maxDepth < 1 || maxDepth > 50) {
        res.status(400).json({
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Invalid pagination or depth parameters',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await CommentService.getPostCommentsTree(postId, page, limit, orderBy, maxDepth);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'GET_COMMENT_TREE_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          commentTree: result.commentTree,
          pagination: {
            page,
            limit,
            total: result.total!,
            totalPages: Math.ceil(result.total! / limit),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get comment tree controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve comment tree',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getPostCommentsFlattened(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_POST_ID',
            message: 'Invalid post ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const orderBy = req.query.orderBy as string || 'created_at';
      const maxDepth = parseInt(req.query.maxDepth as string) || 5;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100 || maxDepth < 1 || maxDepth > 50) {
        res.status(400).json({
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Invalid pagination or depth parameters',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await CommentService.getPostCommentsFlattened(postId, page, limit, orderBy, maxDepth);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'GET_FLATTENED_COMMENTS_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          comments: result.comments!.map(comment => ({
            id: comment.id,
            content: comment.content,
            post_id: comment.post_id,
            author_id: comment.author_id,
            parent_id: comment.parent_id,
            author: comment.author,
            level: (comment as any).level || 0,
            replyCount: (comment as any).replyCount || 0,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
          })),
          pagination: {
            page,
            limit,
            total: result.total!,
            totalPages: Math.ceil(result.total! / limit),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get flattened comments controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve flattened comments',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getPostCommentsSorted(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_POST_ID',
            message: 'Invalid post ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const sortBy = req.query.sortBy as 'oldest' | 'newest' | 'most_replies' || 'oldest';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const validSortOptions = ['oldest', 'newest', 'most_replies'];
      if (!validSortOptions.includes(sortBy)) {
        res.status(400).json({
          error: {
            code: 'INVALID_SORT_OPTION',
            message: 'Invalid sort option. Must be one of: oldest, newest, most_replies',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          error: {
            code: 'INVALID_PAGINATION',
            message: 'Invalid pagination parameters',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await CommentService.getPostCommentsSorted(postId, sortBy, page, limit);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'GET_SORTED_COMMENTS_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          commentTree: result.commentTree,
          pagination: {
            page,
            limit,
            total: result.total!,
            totalPages: Math.ceil(result.total! / limit),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get sorted comments controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve sorted comments',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}