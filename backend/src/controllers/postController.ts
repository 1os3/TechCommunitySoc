import { Response } from 'express';
import { PostService, CreatePostData, UpdatePostData, SearchPostsParams, SearchUsersParams } from '../services/postService';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class PostController {
  static async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const postData: CreatePostData = {
        title: req.body.title,
        content: req.body.content,
        author_id: req.user.id,
      };

      const result = await PostService.createPost(postData);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'POST_CREATION_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          post: {
            id: result.post!.id,
            title: result.post!.title,
            content: result.post!.content,
            author_id: result.post!.author_id,
            view_count: result.post!.view_count,
            like_count: result.post!.like_count,
            comment_count: result.post!.comment_count,
            hotness_score: result.post!.hotness_score,
            created_at: result.post!.created_at,
            updated_at: result.post!.updated_at,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Create post controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Post creation failed due to server error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = parseInt(req.params.id);
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

      const incrementView = req.query.view === 'true';
      const userId = req.user?.id; // Pass user ID if authenticated
      const result = await PostService.getPostById(postId, incrementView, userId);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' ? 404 : 400;
        res.status(statusCode).json({
          error: {
            code: 'POST_NOT_FOUND',
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
          post: {
            id: result.post!.id,
            title: result.post!.title,
            content: result.post!.content,
            author_id: result.post!.author_id,
            author: result.post!.author,
            view_count: result.post!.view_count,
            like_count: result.post!.like_count,
            comment_count: result.post!.comment_count,
            hotness_score: result.post!.hotness_score,
            created_at: result.post!.created_at,
            updated_at: result.post!.updated_at,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get post controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve post',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async updatePost(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const postId = parseInt(req.params.id);
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

      const updateData: UpdatePostData = {
        title: req.body.title,
        content: req.body.content,
      };

      const result = await PostService.updatePost(postId, req.user.id, updateData);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' ? 404 : 
                          result.error === 'You can only edit your own posts' ? 403 : 400;
        res.status(statusCode).json({
          error: {
            code: 'POST_UPDATE_FAILED',
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
          post: {
            id: result.post!.id,
            title: result.post!.title,
            content: result.post!.content,
            author_id: result.post!.author_id,
            view_count: result.post!.view_count,
            like_count: result.post!.like_count,
            comment_count: result.post!.comment_count,
            hotness_score: result.post!.hotness_score,
            created_at: result.post!.created_at,
            updated_at: result.post!.updated_at,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Update post controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Post update failed due to server error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const postId = parseInt(req.params.id);
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

      const result = await PostService.deletePost(postId, req.user.id);

      if (!result.success) {
        const statusCode = result.error === 'Post not found' ? 404 : 
                          result.error === 'You can only delete your own posts' ? 403 : 400;
        res.status(statusCode).json({
          error: {
            code: 'POST_DELETION_FAILED',
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
      logger.error('Delete post controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Post deletion failed due to server error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getPostList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const result = await PostService.getPostList(page, limit, orderBy);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'POST_LIST_FAILED',
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
          posts: result.posts!.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''), // Truncate content for list view
            author_id: post.author_id,
            author: post.author,
            view_count: post.view_count,
            like_count: post.like_count,
            comment_count: post.comment_count,
            hotness_score: post.hotness_score,
            created_at: post.created_at,
            updated_at: post.updated_at,
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
      logger.error('Get post list controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve posts',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getUserPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await PostService.getUserPosts(userId, page, limit);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'USER_POSTS_FAILED',
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
          posts: result.posts!.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''), // Truncate content for list view
            author_id: post.author_id,
            author: post.author,
            view_count: post.view_count,
            like_count: post.like_count,
            comment_count: post.comment_count,
            hotness_score: post.hotness_score,
            created_at: post.created_at,
            updated_at: post.updated_at,
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
      logger.error('Get user posts controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve user posts',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getHotPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // Validate limit parameter
      if (limit < 1 || limit > 100) {
        res.status(400).json({
          error: {
            code: 'INVALID_LIMIT',
            message: 'Invalid limit parameter',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await PostService.getHotPosts(limit);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'HOT_POSTS_FAILED',
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
          posts: result.posts!.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''), // Truncate content for list view
            author_id: post.author_id,
            author: post.author,
            view_count: post.view_count,
            like_count: post.like_count,
            comment_count: post.comment_count,
            hotness_score: post.hotness_score,
            created_at: post.created_at,
            updated_at: post.updated_at,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get hot posts controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve hot posts',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async searchPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const authorId = req.query.author ? parseInt(req.query.author as string) : undefined;
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

      // Validate author ID if provided
      if (req.query.author && isNaN(authorId!)) {
        res.status(400).json({
          error: {
            code: 'INVALID_AUTHOR_ID',
            message: 'Invalid author ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const searchParams: SearchPostsParams = {
        query,
        authorId,
        page,
        limit,
        orderBy
      };

      const result = await PostService.searchPosts(searchParams);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'POST_SEARCH_FAILED',
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
          posts: result.posts!.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
            author_id: post.author_id,
            author: post.author,
            view_count: post.view_count,
            like_count: post.like_count,
            comment_count: post.comment_count,
            hotness_score: post.hotness_score,
            created_at: post.created_at,
            updated_at: post.updated_at,
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
      logger.error('Search posts controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search posts',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Validate required query parameter
      if (!query || !query.trim()) {
        res.status(400).json({
          error: {
            code: 'MISSING_QUERY',
            message: 'Search query is required',
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

      const searchParams: SearchUsersParams = {
        query,
        page,
        limit
      };

      const result = await PostService.searchUsers(searchParams);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'USER_SEARCH_FAILED',
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
      logger.error('Search users controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search users',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}