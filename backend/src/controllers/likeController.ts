import { Response } from 'express';
import { LikeService } from '../services/likeService';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class LikeController {
  static async togglePostLike(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await LikeService.togglePostLike(req.user.id, postId);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' ? 404 : 
                          result.error === 'User not found' ? 404 :
                          result.error === 'Account is deactivated' ? 403 : 400;
        res.status(statusCode).json({
          error: {
            code: 'TOGGLE_POST_LIKE_FAILED',
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
          liked: result.liked,
          like: result.like ? {
            id: result.like.id,
            user_id: result.like.user_id,
            target_type: result.like.target_type,
            target_id: result.like.target_id,
            created_at: result.like.created_at,
          } : null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Toggle post like controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Like operation failed due to server error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async toggleCommentLike(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const commentId = parseInt(req.params.commentId);
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

      const result = await LikeService.toggleCommentLike(req.user.id, commentId);

      if (!result.success) {
        const statusCode = result.error === 'Comment not found' ? 404 : 
                          result.error === 'User not found' ? 404 :
                          result.error === 'Account is deactivated' ? 403 : 400;
        res.status(statusCode).json({
          error: {
            code: 'TOGGLE_COMMENT_LIKE_FAILED',
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
          liked: result.liked,
          like: result.like ? {
            id: result.like.id,
            user_id: result.like.user_id,
            target_type: result.like.target_type,
            target_id: result.like.target_id,
            created_at: result.like.created_at,
          } : null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Toggle comment like controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Like operation failed due to server error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getPostLikeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await LikeService.getPostLikeStatus(req.user.id, postId);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'GET_POST_LIKE_STATUS_FAILED',
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
          liked: result.liked,
          like: result.like ? {
            id: result.like.id,
            user_id: result.like.user_id,
            target_type: result.like.target_type,
            target_id: result.like.target_id,
            created_at: result.like.created_at,
          } : null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get post like status controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve like status',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getCommentLikeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const commentId = parseInt(req.params.commentId);
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

      const result = await LikeService.getCommentLikeStatus(req.user.id, commentId);

      if (!result.success) {
        const statusCode = result.error === 'Comment not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'GET_COMMENT_LIKE_STATUS_FAILED',
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
          liked: result.liked,
          like: result.like ? {
            id: result.like.id,
            user_id: result.like.user_id,
            target_type: result.like.target_type,
            target_id: result.like.target_id,
            created_at: result.like.created_at,
          } : null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get comment like status controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve like status',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getBatchLikeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { targets } = req.body;
      
      if (!Array.isArray(targets)) {
        res.status(400).json({
          error: {
            code: 'INVALID_TARGETS',
            message: 'Targets must be an array',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Validate targets format
      for (const target of targets) {
        if (!target.type || !target.id || !['post', 'comment'].includes(target.type) || isNaN(parseInt(target.id))) {
          res.status(400).json({
            error: {
              code: 'INVALID_TARGET_FORMAT',
              message: 'Each target must have type (post/comment) and valid id',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }
      }

      const result = await LikeService.getBatchLikeStatus(req.user.id, targets);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'GET_BATCH_LIKE_STATUS_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Convert Map to object for JSON response
      const likeStatusObject: { [key: string]: boolean } = {};
      result.likeStatus!.forEach((value, key) => {
        likeStatusObject[key] = value;
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          likeStatus: likeStatusObject,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get batch like status controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve batch like status',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getPostLikeCount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await LikeService.getPostLikeCount(postId);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'GET_POST_LIKE_COUNT_FAILED',
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
          count: result.count,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get post like count controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve like count',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getCommentLikeCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const commentId = parseInt(req.params.commentId);
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

      const result = await LikeService.getCommentLikeCount(commentId);

      if (!result.success) {
        const statusCode = result.error === 'Comment not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'GET_COMMENT_LIKE_COUNT_FAILED',
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
          count: result.count,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get comment like count controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve like count',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getUserLikedPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const pageParam = req.query.page as string;
      const page = pageParam ? parseInt(pageParam) : 1;
      const limitParam = req.query.limit as string;
      const limit = limitParam ? parseInt(limitParam) : 20;

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

      const result = await LikeService.getUserLikedPosts(req.user.id, page, limit);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'GET_USER_LIKED_POSTS_FAILED',
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
          posts: result.posts,
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
      logger.error('Get user liked posts controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve user liked posts',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getUserLikedComments(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const pageParam = req.query.page as string;
      const page = pageParam ? parseInt(pageParam) : 1;
      const limitParam = req.query.limit as string;
      const limit = limitParam ? parseInt(limitParam) : 20;

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

      const result = await LikeService.getUserLikedComments(req.user.id, page, limit);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'GET_USER_LIKED_COMMENTS_FAILED',
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
          comments: result.comments,
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
      logger.error('Get user liked comments controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve user liked comments',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getUserLikeStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await LikeService.getUserLikeStatistics(req.user.id);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'GET_USER_LIKE_STATISTICS_FAILED',
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
          statistics: result.statistics,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get user like statistics controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve user like statistics',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getTopLikedContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const type = req.params.type as 'post' | 'comment';
      if (!['post', 'comment'].includes(type)) {
        res.status(400).json({
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: 'Content type must be post or comment',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const limitParam = req.query.limit as string;
      const limit = limitParam ? parseInt(limitParam) : 10;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      let timeframe: { start: Date; end: Date } | undefined;
      if (startDate && endDate) {
        timeframe = {
          start: new Date(startDate),
          end: new Date(endDate),
        };

        if (isNaN(timeframe.start.getTime()) || isNaN(timeframe.end.getTime())) {
          res.status(400).json({
            error: {
              code: 'INVALID_DATE_FORMAT',
              message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be between 1 and 100',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await LikeService.getTopLikedContent(type, limit, timeframe);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'GET_TOP_LIKED_CONTENT_FAILED',
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
          content: result.content,
          type,
          limit,
          timeframe,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get top liked content controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve top liked content',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getMostActiveUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limitParam = req.query.limit as string;
      const limit = limitParam ? parseInt(limitParam) : 10;
      const daysParam = req.query.days as string;
      const days = daysParam ? parseInt(daysParam) : 30;

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be between 1 and 100',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (days < 1 || days > 365) {
        res.status(400).json({
          error: {
            code: 'INVALID_DAYS',
            message: 'Days must be between 1 and 365',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await LikeService.getMostActiveUsers(limit, days);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'GET_MOST_ACTIVE_USERS_FAILED',
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
          users: result.users,
          limit,
          days,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get most active users controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve most active users',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getLikeActivityMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const daysParam = req.query.days as string;
      const days = daysParam ? parseInt(daysParam) : 7;

      if (days < 1 || days > 365) {
        res.status(400).json({
          error: {
            code: 'INVALID_DAYS',
            message: 'Days must be between 1 and 365',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await LikeService.getLikeActivityMetrics(days);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'GET_LIKE_ACTIVITY_METRICS_FAILED',
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
          metrics: result.metrics,
          days,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get like activity metrics controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve like activity metrics',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}