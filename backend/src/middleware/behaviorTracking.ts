import { Request, Response, NextFunction } from 'express';
import UserInteraction from '../models/UserInteraction';
import { AuthenticatedRequest } from './auth';
import logger from '../utils/logger';

export interface BehaviorTrackingOptions {
  trackViews?: boolean;
  trackLikes?: boolean;
  trackComments?: boolean;
  debounceTime?: number; // ms to prevent duplicate tracking
}

// In-memory cache to prevent duplicate tracking within debounce time
const recentInteractions = new Map<string, number>();

/**
 * Middleware to track user behavior automatically
 */
export function trackBehavior(options: BehaviorTrackingOptions = {}) {
  const {
    trackViews = true,
    trackLikes = true,
    trackComments = true,
    debounceTime = 30000 // 30 seconds default
  } = options;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
      let interactionType: 'view' | 'like' | 'comment' | null = null;
      let postId: number | null = null;
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
              await UserInteraction.recordInteraction(userId, postId!, interactionType!, weight);
              logger.info(`Tracked ${interactionType} interaction: user ${userId} -> post ${postId} (weight: ${weight})`);
            } catch (error) {
              logger.error('Failed to record user interaction:', error);
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
    } catch (error) {
      logger.error('Behavior tracking middleware error:', error);
      // Don't block the request if tracking fails
      next();
    }
  };
}

/**
 * Manual behavior tracking function for explicit calls
 */
export async function recordUserBehavior(
  userId: number,
  postId: number,
  interactionType: 'view' | 'like' | 'comment',
  customWeight?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const weights = {
      view: 0.5,
      like: 2.0,
      comment: 3.0
    };

    const weight = customWeight || weights[interactionType];
    
    await UserInteraction.recordInteraction(userId, postId, interactionType, weight);
    
    logger.info(`Manually recorded ${interactionType} interaction: user ${userId} -> post ${postId} (weight: ${weight})`);
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to manually record user behavior:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get user behavior statistics
 */
export async function getUserBehaviorStats(userId: number): Promise<{
  success: boolean;
  data?: {
    totalInteractions: number;
    recentActivity: number; // Last 7 days
    interactionsByType: Record<string, number>;
    averageWeight: number;
    mostActiveHours: number[];
  };
  error?: string;
}> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get overall preferences
    const preferences = await UserInteraction.getUserPreferences(userId);
    
    // Get recent activity count
    const recentInteractions = await UserInteraction.count({
      where: {
        user_id: userId,
        created_at: {
          [require('sequelize').Op.gte]: sevenDaysAgo
        }
      }
    });

    // Get hourly activity pattern
    const allUserInteractions = await UserInteraction.findAll({
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
  } catch (error) {
    logger.error('Failed to get user behavior stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Clear old behavior tracking cache entries
 */
export function clearBehaviorCache(): void {
  recentInteractions.clear();
  logger.info('Behavior tracking cache cleared');
}

export default {
  trackBehavior,
  recordUserBehavior,
  getUserBehaviorStats,
  clearBehaviorCache
};