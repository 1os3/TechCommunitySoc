"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackBehavior = trackBehavior;
exports.recordUserBehavior = recordUserBehavior;
exports.getUserBehaviorStats = getUserBehaviorStats;
exports.clearBehaviorCache = clearBehaviorCache;
const UserInteraction_1 = __importDefault(require("../models/UserInteraction"));
const logger_1 = __importDefault(require("../utils/logger"));
// In-memory cache to prevent duplicate tracking within debounce time
const recentInteractions = new Map();
/**
 * Middleware to track user behavior automatically
 */
function trackBehavior(options = {}) {
    const { trackViews = true, trackLikes = true, trackComments = true, debounceTime = 30000 // 30 seconds default
     } = options;
    return async (req, res, next) => {
        try {
            // Skip tracking for non-authenticated users for now
            if (!req.user) {
                next();
                return;
            }
            const userId = req.user.id;
            const method = req.method;
            const path = req.path;
            // Determine interaction type and post ID based on route
            let interactionType = null;
            let postId = null;
            let weight = 1.0;
            // Track post views
            if (trackViews && method === 'GET' && path.match(/^\/posts\/(\d+)$/)) {
                const match = path.match(/^\/posts\/(\d+)$/);
                if (match) {
                    postId = parseInt(match[1]);
                    interactionType = 'view';
                    weight = 0.5; // Lower weight for views
                }
            }
            // Track likes
            if (trackLikes && method === 'POST' && path.match(/^\/likes\/posts\/(\d+)/)) {
                const match = path.match(/^\/likes\/posts\/(\d+)/);
                if (match) {
                    postId = parseInt(match[1]);
                    interactionType = 'like';
                    weight = 2.0; // Higher weight for likes
                }
            }
            // Track comments
            if (trackComments && method === 'POST' && path.match(/^\/posts\/(\d+)\/comments/)) {
                const match = path.match(/^\/posts\/(\d+)\/comments/);
                if (match) {
                    postId = parseInt(match[1]);
                    interactionType = 'comment';
                    weight = 3.0; // Highest weight for comments
                }
            }
            // Record interaction if detected
            if (interactionType && postId && !isNaN(postId)) {
                const interactionKey = `${userId}-${postId}-${interactionType}`;
                const now = Date.now();
                const lastTracked = recentInteractions.get(interactionKey);
                // Check debounce time
                if (!lastTracked || now - lastTracked > debounceTime) {
                    recentInteractions.set(interactionKey, now);
                    // Record interaction asynchronously to avoid blocking the request
                    setImmediate(async () => {
                        try {
                            await UserInteraction_1.default.recordInteraction(userId, postId, interactionType, weight);
                            logger_1.default.info(`Tracked ${interactionType} interaction: user ${userId} -> post ${postId} (weight: ${weight})`);
                        }
                        catch (error) {
                            logger_1.default.error('Failed to record user interaction:', error);
                        }
                    });
                    // Clean up old entries from cache periodically
                    if (recentInteractions.size > 1000) {
                        const cutoffTime = now - debounceTime * 2;
                        for (const [key, timestamp] of recentInteractions.entries()) {
                            if (timestamp < cutoffTime) {
                                recentInteractions.delete(key);
                            }
                        }
                    }
                }
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Behavior tracking middleware error:', error);
            // Don't block the request if tracking fails
            next();
        }
    };
}
/**
 * Manual behavior tracking function for explicit calls
 */
async function recordUserBehavior(userId, postId, interactionType, customWeight) {
    try {
        const weights = {
            view: 0.5,
            like: 2.0,
            comment: 3.0
        };
        const weight = customWeight || weights[interactionType];
        await UserInteraction_1.default.recordInteraction(userId, postId, interactionType, weight);
        logger_1.default.info(`Manually recorded ${interactionType} interaction: user ${userId} -> post ${postId} (weight: ${weight})`);
        return { success: true };
    }
    catch (error) {
        logger_1.default.error('Failed to manually record user behavior:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
/**
 * Get user behavior statistics
 */
async function getUserBehaviorStats(userId) {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        // Get overall preferences
        const preferences = await UserInteraction_1.default.getUserPreferences(userId);
        // Get recent activity count
        const recentInteractions = await UserInteraction_1.default.count({
            where: {
                user_id: userId,
                created_at: {
                    [require('sequelize').Op.gte]: sevenDaysAgo
                }
            }
        });
        // Get hourly activity pattern
        const allUserInteractions = await UserInteraction_1.default.findAll({
            where: { user_id: userId },
            attributes: ['created_at'],
            raw: true
        });
        const hourlyActivity = new Array(24).fill(0);
        allUserInteractions.forEach(interaction => {
            const hour = new Date(interaction.created_at).getHours();
            hourlyActivity[hour]++;
        });
        // Find most active hours (top 3)
        const mostActiveHours = hourlyActivity
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(item => item.hour);
        return {
            success: true,
            data: {
                totalInteractions: preferences.totalInteractions,
                recentActivity: recentInteractions,
                interactionsByType: preferences.interactionsByType,
                averageWeight: preferences.averageWeight,
                mostActiveHours
            }
        };
    }
    catch (error) {
        logger_1.default.error('Failed to get user behavior stats:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
/**
 * Clear old behavior tracking cache entries
 */
function clearBehaviorCache() {
    recentInteractions.clear();
    logger_1.default.info('Behavior tracking cache cleared');
}
exports.default = {
    trackBehavior,
    recordUserBehavior,
    getUserBehaviorStats,
    clearBehaviorCache
};
//# sourceMappingURL=behaviorTracking.js.map