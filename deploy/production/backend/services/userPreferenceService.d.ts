export interface UserPreferenceProfile {
    userId: number;
    totalInteractions: number;
    interactionPatterns: {
        views: number;
        likes: number;
        comments: number;
    };
    activityPeriods: {
        morning: number;
        afternoon: number;
        evening: number;
        night: number;
    };
    contentPreferences: {
        averagePostLength: number;
        preferredTopics: string[];
        engagementStyle: 'lurker' | 'casual' | 'active' | 'power_user';
    };
    socialBehavior: {
        likesToCommentsRatio: number;
        averageCommentLength: number;
        respondsToComments: boolean;
    };
    temporalPatterns: {
        peakActivityHours: number[];
        mostActiveDays: number[];
        sessionDuration: number;
    };
}
export declare class UserPreferenceService {
    /**
     * Build comprehensive user preference profile
     */
    static buildUserProfile(userId: number): Promise<{
        success: boolean;
        profile?: UserPreferenceProfile;
        error?: string;
    }>;
    /**
     * Get user interest categories based on interaction history
     */
    static getUserInterestCategories(userId: number): Promise<{
        success: boolean;
        categories?: Array<{
            category: string;
            score: number;
            postCount: number;
        }>;
        error?: string;
    }>;
    /**
     * Find users with similar preferences
     */
    static findSimilarUsers(userId: number, limit?: number): Promise<{
        success: boolean;
        similarUsers?: Array<{
            userId: number;
            similarityScore: number;
            commonInteractions: number;
        }>;
        error?: string;
    }>;
    /**
     * Update user preference weights based on new interactions
     */
    static updatePreferenceWeights(userId: number, interactionType: 'view' | 'like' | 'comment', postId: number, contextData?: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    private static getDefaultProfile;
    private static analyzeInteractionPatterns;
    private static analyzeTemporalPatterns;
    private static analyzeActivityPeriods;
    private static analyzeContentPreferences;
    private static analyzeSocialBehavior;
    private static extractCategoriesFromContent;
}
export default UserPreferenceService;
//# sourceMappingURL=userPreferenceService.d.ts.map