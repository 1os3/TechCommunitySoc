"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const behaviorTracking_1 = require("../middleware/behaviorTracking");
const userPreferenceService_1 = __importDefault(require("../services/userPreferenceService"));
const UserInteraction_1 = __importDefault(require("../models/UserInteraction"));
const express_validator_1 = require("express-validator");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
/**
 * GET /api/behavior/profile
 * Get comprehensive user behavior profile
 */
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await userPreferenceService_1.default.buildUserProfile(userId);
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
    }
    catch (error) {
        logger_1.default.error('Error getting user behavior profile:', error);
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
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await (0, behaviorTracking_1.getUserBehaviorStats)(userId);
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
    }
    catch (error) {
        logger_1.default.error('Error getting user behavior stats:', error);
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
router.get('/interests', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await userPreferenceService_1.default.getUserInterestCategories(userId);
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
    }
    catch (error) {
        logger_1.default.error('Error getting user interests:', error);
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
router.get('/similar-users', auth_1.authenticateToken, [
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        const result = await userPreferenceService_1.default.findSimilarUsers(userId, limit);
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
    }
    catch (error) {
        logger_1.default.error('Error finding similar users:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/behavior/track
 * Manually record a user behavior interaction
 */
router.post('/track', auth_1.authenticateToken, [
    (0, express_validator_1.body)('postId')
        .isInt({ min: 1 })
        .withMessage('Post ID must be a positive integer'),
    (0, express_validator_1.body)('interactionType')
        .isIn(['view', 'like', 'comment'])
        .withMessage('Interaction type must be view, like, or comment'),
    (0, express_validator_1.body)('weight')
        .optional()
        .isFloat({ min: 0.1, max: 10 })
        .withMessage('Weight must be between 0.1 and 10'),
    (0, express_validator_1.body)('contextData')
        .optional()
        .isObject()
        .withMessage('Context data must be an object')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const userId = req.user.id;
        const { postId, interactionType, weight, contextData } = req.body;
        const result = await (0, behaviorTracking_1.recordUserBehavior)(userId, postId, interactionType, weight);
        if (!result.success) {
            return res.status(500).json({
                error: 'Failed to record behavior',
                details: result.error
            });
        }
        // Update preference weights with context
        await userPreferenceService_1.default.updatePreferenceWeights(userId, interactionType, postId, contextData);
        res.json({
            success: true,
            message: 'Behavior recorded successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error recording user behavior:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/behavior/history
 * Get user interaction history
 */
router.get('/history', auth_1.authenticateToken, [
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 200 })
        .withMessage('Limit must be between 1 and 200'),
    (0, express_validator_1.query)('type')
        .optional()
        .isIn(['view', 'like', 'comment'])
        .withMessage('Type must be view, like, or comment'),
    (0, express_validator_1.query)('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Days must be between 1 and 365')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const type = req.query.type;
        const days = parseInt(req.query.days);
        const whereClause = { user_id: userId };
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
        const interactions = await UserInteraction_1.default.findAll({
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
    }
    catch (error) {
        logger_1.default.error('Error getting user behavior history:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/behavior/analytics/:postId
 * Get behavior analytics for a specific post
 */
router.get('/analytics/:postId', auth_1.authenticateToken, [
    (0, express_validator_1.param)('postId')
        .isInt({ min: 1 })
        .withMessage('Post ID must be a positive integer')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const postId = parseInt(req.params.postId);
        const stats = await UserInteraction_1.default.getPostInteractionStats(postId);
        // Get hourly distribution
        const interactions = await UserInteraction_1.default.findAll({
            where: { post_id: postId },
            attributes: ['created_at', 'interaction_type'],
            raw: true
        });
        const hourlyDistribution = new Array(24).fill(0);
        const typeDistribution = { view: 0, like: 0, comment: 0 };
        interactions.forEach(interaction => {
            const hour = new Date(interaction.created_at).getHours();
            hourlyDistribution[hour]++;
            typeDistribution[interaction.interaction_type]++;
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
    }
    catch (error) {
        logger_1.default.error('Error getting post analytics:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * DELETE /api/behavior/clear
 * Clear user behavior data (for privacy/testing)
 */
router.delete('/clear', auth_1.authenticateToken, [
    (0, express_validator_1.body)('confirmClear')
        .equals('true')
        .withMessage('Must confirm clear action')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const userId = req.user.id;
        const deletedCount = await UserInteraction_1.default.destroy({
            where: { user_id: userId }
        });
        logger_1.default.info(`Cleared ${deletedCount} behavior records for user ${userId}`);
        res.json({
            success: true,
            message: `Cleared ${deletedCount} behavior records`,
            deletedCount
        });
    }
    catch (error) {
        logger_1.default.error('Error clearing user behavior data:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=userBehavior.js.map