import { Request, Response } from 'express';
import { ViolationService } from '../services/violationService';
import { PostService } from '../services/postService';
import { CommentService } from '../services/commentService';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { Post, Comment, User, ViolationWord, Violation } from '../models';
import { Op } from 'sequelize';

export class ContentController {
  /**
   * Get posts for admin management
   */
  static async getPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as string; // 'active', 'deleted', 'all'

      const offset = (page - 1) * limit;
      const whereClause: any = {};

      // Filter by search term
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Filter by status
      if (status === 'deleted') {
        whereClause.is_deleted = true;
      } else if (status === 'active') {
        whereClause.is_deleted = false;
      }
      // 'all' shows both

      const { count, rows } = await Post.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username']
          }
        ],
        offset,
        limit,
        order: [['created_at', 'DESC']],
        paranoid: false // Include soft-deleted posts
      });

      res.status(200).json({
        success: true,
        data: {
          posts: rows.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
            author: post.author?.username,
            author_id: post.author_id,
            view_count: post.view_count,
            like_count: post.like_count,
            comment_count: post.comment_count,
            is_deleted: post.is_deleted,
            created_at: post.created_at,
            updated_at: post.updated_at
          })),
          page,
          limit,
          total: count,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get posts for admin error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get comments for admin management
   */
  static async getComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as string; // 'active', 'deleted', 'all'
      const postId = req.query.postId as string;

      const offset = (page - 1) * limit;
      const whereClause: any = {};

      // Filter by search term
      if (search) {
        whereClause.content = { [Op.iLike]: `%${search}%` };
      }

      // Filter by post
      if (postId) {
        whereClause.post_id = parseInt(postId);
      }

      // Filter by status
      if (status === 'deleted') {
        whereClause.is_deleted = true;
      } else if (status === 'active') {
        whereClause.is_deleted = false;
      }

      const { count, rows } = await Comment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username']
          },
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title']
          }
        ],
        offset,
        limit,
        order: [['created_at', 'DESC']],
        paranoid: false // Include soft-deleted comments
      });

      res.status(200).json({
        success: true,
        data: {
          comments: rows.map(comment => ({
            id: comment.id,
            content: comment.content.substring(0, 150) + (comment.content.length > 150 ? '...' : ''),
            author: comment.author?.username,
            author_id: comment.author_id,
            post_title: comment.post?.title,
            post_id: comment.post_id,
            parent_id: comment.parent_id,
            like_count: comment.like_count,
            is_deleted: comment.is_deleted,
            created_at: comment.created_at,
            updated_at: comment.updated_at
          })),
          page,
          limit,
          total: count,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get comments for admin error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get violations for admin review
   */
  static async getViolations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as 'pending' | 'reviewed' | 'ignored';

      const result = await ViolationService.getViolations(adminId, page, limit, status);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            violations: result.violations,
            page,
            limit,
            total: result.total,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Get violations error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Update violation status
   */
  static async updateViolationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { violationId } = req.params;
      const { status, notes } = req.body;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const violationIdNum = parseInt(violationId);
      if (isNaN(violationIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid violation ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!['pending', 'reviewed', 'ignored'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be pending, reviewed, or ignored',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await ViolationService.updateViolationStatus(
        adminId,
        violationIdNum,
        status,
        notes
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 
                          result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Update violation status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get violation statistics
   */
  static async getViolationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const days = parseInt(req.query.days as string) || 10;
      const threshold = parseInt(req.query.threshold as string) || 15;

      const result = await ViolationService.getViolationStats(adminId, days, threshold);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            stats: result.stats,
            days,
            threshold,
          },
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Get violation stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get violation words
   */
  static async getViolationWords(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await ViolationService.getViolationWords(adminId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            violation_words: result.violationWords,
            total: result.total,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Get violation words error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Add violation word
   */
  static async addViolationWord(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { word, is_regex } = req.body;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!word || typeof word !== 'string' || word.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Word is required and must be a non-empty string',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await ViolationService.addViolationWord(
        adminId,
        word.trim(),
        Boolean(is_regex)
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            violation_word: result.violationWords?.[0],
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 
                          result.error?.includes('already exists') ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Add violation word error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Remove violation word
   */
  static async removeViolationWord(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { wordId } = req.params;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const wordIdNum = parseInt(wordId);
      if (isNaN(wordIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid word ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await ViolationService.removeViolationWord(adminId, wordIdNum);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 
                          result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Remove violation word error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}