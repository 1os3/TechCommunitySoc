import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getUserBehaviorStats, recordUserBehavior } from '../middleware/behaviorTracking';
import UserPreferenceService from '../services/userPreferenceService';
import UserInteraction from '../models/UserInteraction';
import { body, param, query, validationResult } from 'express-validator';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /api/behavior/profile
 * Get comprehensive user behavior profile
 */
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const result = await UserPreferenceService.buildUserProfile(userId);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to build user profile',
        details: result.error
      });
    }

    res.json({
      success: true,
      profile: result.profile
    });
  } catch (error) {
    logger.error('Error getting user behavior profile:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/behavior/stats
 * Get basic user behavior statistics
 */
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const result = await getUserBehaviorStats(userId);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get behavior stats',
        details: result.error
      });
    }

    res.json({
      success: true,
      stats: result.data
    });
  } catch (error) {
    logger.error('Error getting user behavior stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/behavior/interests
 * Get user interest categories
 */
router.get('/interests', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const result = await UserPreferenceService.getUserInterestCategories(userId);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get user interests',
        details: result.error
      });
    }

    res.json({
      success: true,
      categories: result.categories
    });
  } catch (error) {
    logger.error('Error getting user interests:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/behavior/similar-users
 * Find users with similar behavior patterns
 */
router.get('/similar-users', 
  authenticateToken,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await UserPreferenceService.findSimilarUsers(userId, limit);
      
      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to find similar users',
          details: result.error
        });
      }

      res.json({
        success: true,
        similarUsers: result.similarUsers
      });
    } catch (error) {
      logger.error('Error finding similar users:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/behavior/track
 * Manually record a user behavior interaction
 */
router.post('/track',
  authenticateToken,
  [
    body('postId')
      .isInt({ min: 1 })
      .withMessage('Post ID must be a positive integer'),
    body('interactionType')
      .isIn(['view', 'like', 'comment'])
      .withMessage('Interaction type must be view, like, or comment'),
    body('weight')
      .optional()
      .isFloat({ min: 0.1, max: 10 })
      .withMessage('Weight must be between 0.1 and 10'),
    body('contextData')
      .optional()
      .isObject()
      .withMessage('Context data must be an object')
  ],
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user!.id;
      const { postId, interactionType, weight, contextData } = req.body;
      
      const result = await recordUserBehavior(userId, postId, interactionType, weight);
      
      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to record behavior',
          details: result.error
        });
      }

      // Update preference weights with context
      await UserPreferenceService.updatePreferenceWeights(
        userId, 
        interactionType, 
        postId, 
        contextData
      );

      res.json({
        success: true,
        message: 'Behavior recorded successfully'
      });
    } catch (error) {
      logger.error('Error recording user behavior:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/behavior/history
 * Get user interaction history
 */
router.get('/history',
  authenticateToken,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 200 })
      .withMessage('Limit must be between 1 and 200'),
    query('type')
      .optional()
      .isIn(['view', 'like', 'comment'])
      .withMessage('Type must be view, like, or comment'),
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const type = req.query.type as string;
      const days = parseInt(req.query.days as string);

      const whereClause: any = { user_id: userId };
      
      if (type) {
        whereClause.interaction_type = type;
      }
      
      if (days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);
        whereClause.created_at = {
          [require('sequelize').Op.gte]: daysAgo
        };
      }

      const interactions = await UserInteraction.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        include: [
          {
            model: require('../models/Post').default,
            as: 'post',
            attributes: ['id', 'title', 'author_id']
          }
        ]
      });

      res.json({
        success: true,
        interactions,
        total: interactions.length
      });
    } catch (error) {
      logger.error('Error getting user behavior history:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/behavior/analytics/:postId
 * Get behavior analytics for a specific post
 */
router.get('/analytics/:postId',
  authenticateToken,
  [
    param('postId')
      .isInt({ min: 1 })
      .withMessage('Post ID must be a positive integer')
  ],
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const postId = parseInt(req.params.postId);
      
      const stats = await UserInteraction.getPostInteractionStats(postId);
      
      // Get hourly distribution
      const interactions = await UserInteraction.findAll({
        where: { post_id: postId },
        attributes: ['created_at', 'interaction_type'],
        raw: true
      });

      const hourlyDistribution = new Array(24).fill(0);
      const typeDistribution = { view: 0, like: 0, comment: 0 };

      interactions.forEach(interaction => {
        const hour = new Date(interaction.created_at).getHours();
        hourlyDistribution[hour]++;
        typeDistribution[interaction.interaction_type as keyof typeof typeDistribution]++;
      });

      res.json({
        success: true,
        analytics: {
          ...stats,
          hourlyDistribution,
          typeDistribution,
          totalInteractions: interactions.length
        }
      });
    } catch (error) {
      logger.error('Error getting post analytics:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * DELETE /api/behavior/clear
 * Clear user behavior data (for privacy/testing)
 */
router.delete('/clear',
  authenticateToken,
  [
    body('confirmClear')
      .equals('true')
      .withMessage('Must confirm clear action')
  ],
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user!.id;
      
      const deletedCount = await UserInteraction.destroy({
        where: { user_id: userId }
      });

      logger.info(`Cleared ${deletedCount} behavior records for user ${userId}`);

      res.json({
        success: true,
        message: `Cleared ${deletedCount} behavior records`,
        deletedCount
      });
    } catch (error) {
      logger.error('Error clearing user behavior data:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;