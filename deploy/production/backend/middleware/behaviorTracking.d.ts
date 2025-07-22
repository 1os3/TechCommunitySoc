import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
export interface BehaviorTrackingOptions {
    trackViews?: boolean;
    trackLikes?: boolean;
    trackComments?: boolean;
    debounceTime?: number;
}
/**
 * Middleware to track user behavior automatically
 */
export declare function trackBehavior(options?: BehaviorTrackingOptions): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Manual behavior tracking function for explicit calls
 */
export declare function recordUserBehavior(userId: number, postId: number, interactionType: 'view' | 'like' | 'comment', customWeight?: number): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Get user behavior statistics
 */
export declare function getUserBehaviorStats(userId: number): Promise<{
    success: boolean;
    data?: {
        totalInteractions: number;
        recentActivity: number;
        interactionsByType: Record<string, number>;
        averageWeight: number;
        mostActiveHours: number[];
    };
    error?: string;
}>;
/**
 * Clear old behavior tracking cache entries
 */
export declare function clearBehaviorCache(): void;
declare const _default: {
    trackBehavior: typeof trackBehavior;
    recordUserBehavior: typeof recordUserBehavior;
    getUserBehaviorStats: typeof getUserBehaviorStats;
    clearBehaviorCache: typeof clearBehaviorCache;
};
export default _default;
//# sourceMappingURL=behaviorTracking.d.ts.map