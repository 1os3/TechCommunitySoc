import UserInteraction from '../models/UserInteraction';
import Post from '../models/Post';
import Comment from '../models/Comment';
import User from '../models/User';
import { Op } from 'sequelize';
import logger from '../utils/logger';

export interface UserPreferenceProfile {
  userId: number;
  totalInteractions: number;
  interactionPatterns: {
    views: number;
    likes: number;
    comments: number;
  };
  activityPeriods: {
    morning: number;    // 6-12
    afternoon: number;  // 12-18
    evening: number;    // 18-24
    night: number;      // 0-6
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
    mostActiveDays: number[]; // 0-6 (Sunday-Saturday)
    sessionDuration: number; // average minutes
  };
}

export class UserPreferenceService {
  /**
   * Build comprehensive user preference profile
   */
  static async buildUserProfile(userId: number): Promise<{
    success: boolean;
    profile?: UserPreferenceProfile;
    error?: string;
  }> {
    try {
      // Get all user interactions
      const interactions = await UserInteraction.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title', 'content', 'created_at']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      if (interactions.length === 0) {
        // Return default profile for new users
        return {
          success: true,
          profile: this.getDefaultProfile(userId)
        };
      }

      // Analyze interaction patterns
      const interactionPatterns = this.analyzeInteractionPatterns(interactions);
      
      // Analyze temporal patterns
      const temporalPatterns = this.analyzeTemporalPatterns(interactions);
      
      // Analyze activity periods
      const activityPeriods = this.analyzeActivityPeriods(interactions);
      
      // Analyze content preferences
      const contentPreferences = await this.analyzeContentPreferences(userId, interactions);
      
      // Analyze social behavior
      const socialBehavior = await this.analyzeSocialBehavior(userId);

      const profile: UserPreferenceProfile = {
        userId,
        totalInteractions: interactions.length,
        interactionPatterns,
        activityPeriods,
        contentPreferences,
        socialBehavior,
        temporalPatterns
      };

      return { success: true, profile };
    } catch (error) {
      logger.error('Failed to build user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user interest categories based on interaction history
   */
  static async getUserInterestCategories(userId: number): Promise<{
    success: boolean;
    categories?: Array<{
      category: string;
      score: number;
      postCount: number;
    }>;
    error?: string;
  }> {
    try {
      // Get posts the user has interacted with
      const interactions = await UserInteraction.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title', 'content']
          }
        ]
      });

      // Analyze content to extract categories/topics
      const categoryScores = new Map<string, { score: number; count: number }>();

      interactions.forEach(interaction => {
        if (interaction.post) {
          const categories = this.extractCategoriesFromContent(
            interaction.post.title + ' ' + interaction.post.content
          );
          
          categories.forEach(category => {
            const current = categoryScores.get(category) || { score: 0, count: 0 };
            current.score += interaction.interaction_weight;
            current.count += 1;
            categoryScores.set(category, current);
          });
        }
      });

      // Convert to sorted array
      const categories = Array.from(categoryScores.entries())
        .map(([category, data]) => ({
          category,
          score: data.score,
          postCount: data.count
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Top 10 categories

      return { success: true, categories };
    } catch (error) {
      logger.error('Failed to get user interest categories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Find users with similar preferences
   */
  static async findSimilarUsers(userId: number, limit: number = 10): Promise<{
    success: boolean;
    similarUsers?: Array<{
      userId: number;
      similarityScore: number;
      commonInteractions: number;
    }>;
    error?: string;
  }> {
    try {
      // Get user's interacted posts
      const userPosts = await UserInteraction.findAll({
        where: { user_id: userId },
        attributes: ['post_id'],
        group: ['post_id']
      });

      const postIds = userPosts.map(up => up.post_id);

      if (postIds.length === 0) {
        return { success: true, similarUsers: [] };
      }

      // Find other users who interacted with same posts
      const similarInteractions = await UserInteraction.findAll({
        where: {
          post_id: postIds,
          user_id: { [Op.ne]: userId }
        },
        attributes: [
          'user_id',
          [UserInteraction.sequelize!.fn('COUNT', UserInteraction.sequelize!.col('post_id')), 'common_posts'],
          [UserInteraction.sequelize!.fn('SUM', UserInteraction.sequelize!.col('interaction_weight')), 'total_weight']
        ],
        group: ['user_id'],
        having: UserInteraction.sequelize!.where(
          UserInteraction.sequelize!.fn('COUNT', UserInteraction.sequelize!.col('post_id')),
          Op.gte,
          Math.max(1, Math.floor(postIds.length * 0.1)) // At least 10% overlap
        ),
        order: [
          [UserInteraction.sequelize!.literal('common_posts'), 'DESC'],
          [UserInteraction.sequelize!.literal('total_weight'), 'DESC']
        ],
        limit,
        raw: true
      }) as unknown as Array<{
        user_id: number;
        common_posts: string;
        total_weight: string;
      }>;

      const similarUsers = similarInteractions.map(si => ({
        userId: si.user_id,
        similarityScore: parseFloat(si.total_weight) / postIds.length,
        commonInteractions: parseInt(si.common_posts)
      }));

      return { success: true, similarUsers };
    } catch (error) {
      logger.error('Failed to find similar users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update user preference weights based on new interactions
   */
  static async updatePreferenceWeights(
    userId: number,
    interactionType: 'view' | 'like' | 'comment',
    postId: number,
    contextData?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Dynamic weight calculation based on context
      let weight = 1.0;
      
      switch (interactionType) {
        case 'view':
          weight = 0.5;
          break;
        case 'like':
          weight = 2.0;
          // Increase weight if user rarely likes posts
          const userLikes = await UserInteraction.count({
            where: { user_id: userId, interaction_type: 'like' }
          });
          if (userLikes < 10) weight += 0.5;
          break;
        case 'comment':
          weight = 3.0;
          // Increase weight for longer comments
          if (contextData?.commentLength > 100) weight += 0.5;
          break;
      }

      // Check for recency bonus
      const recentInteractions = await UserInteraction.count({
        where: {
          user_id: userId,
          post_id: postId,
          created_at: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      // Reduce weight for repeated interactions on same post
      if (recentInteractions > 0) {
        weight *= 0.7;
      }

      // Record the interaction with calculated weight
      await UserInteraction.recordInteraction(userId, postId, interactionType, weight);

      return { success: true };
    } catch (error) {
      logger.error('Failed to update preference weights:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Helper methods

  private static getDefaultProfile(userId: number): UserPreferenceProfile {
    return {
      userId,
      totalInteractions: 0,
      interactionPatterns: { views: 0, likes: 0, comments: 0 },
      activityPeriods: { morning: 0, afternoon: 0, evening: 0, night: 0 },
      contentPreferences: {
        averagePostLength: 0,
        preferredTopics: [],
        engagementStyle: 'lurker'
      },
      socialBehavior: {
        likesToCommentsRatio: 0,
        averageCommentLength: 0,
        respondsToComments: false
      },
      temporalPatterns: {
        peakActivityHours: [],
        mostActiveDays: [],
        sessionDuration: 0
      }
    };
  }

  private static analyzeInteractionPatterns(interactions: UserInteraction[]) {
    const patterns = { views: 0, likes: 0, comments: 0 };
    
    interactions.forEach(interaction => {
      switch (interaction.interaction_type) {
        case 'view':
          patterns.views++;
          break;
        case 'like':
          patterns.likes++;
          break;
        case 'comment':
          patterns.comments++;
          break;
      }
    });

    return patterns;
  }

  private static analyzeTemporalPatterns(interactions: UserInteraction[]) {
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Array(7).fill(0);
    
    interactions.forEach(interaction => {
      const date = new Date(interaction.created_at);
      hourlyActivity[date.getHours()]++;
      dailyActivity[date.getDay()]++;
    });

    const peakActivityHours = hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    const mostActiveDays = dailyActivity
      .map((count, day) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.day);

    return {
      peakActivityHours,
      mostActiveDays,
      sessionDuration: 15 // Placeholder - would need session tracking
    };
  }

  private static analyzeActivityPeriods(interactions: UserInteraction[]) {
    const periods = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    interactions.forEach(interaction => {
      const hour = new Date(interaction.created_at).getHours();
      
      if (hour >= 6 && hour < 12) periods.morning++;
      else if (hour >= 12 && hour < 18) periods.afternoon++;
      else if (hour >= 18 && hour < 24) periods.evening++;
      else periods.night++;
    });

    return periods;
  }

  private static async analyzeContentPreferences(userId: number, interactions: UserInteraction[]) {
    const postsWithContent = interactions.filter(i => i.post);
    const totalLength = postsWithContent.reduce((sum, i) => sum + (i.post?.content?.length || 0), 0);
    const averagePostLength = postsWithContent.length > 0 ? totalLength / postsWithContent.length : 0;

    // Simple topic extraction (could be enhanced with NLP)
    const allContent = postsWithContent
      .map(i => `${i.post?.title} ${i.post?.content}`)
      .join(' ');
    
    const preferredTopics = this.extractCategoriesFromContent(allContent).slice(0, 5);

    // Determine engagement style
    const totalInteractions = interactions.length;
    const likes = interactions.filter(i => i.interaction_type === 'like').length;
    const comments = interactions.filter(i => i.interaction_type === 'comment').length;
    
    let engagementStyle: 'lurker' | 'casual' | 'active' | 'power_user' = 'lurker';
    
    if (totalInteractions > 100) {
      engagementStyle = 'power_user';
    } else if (comments > likes * 0.3) {
      engagementStyle = 'active';
    } else if (likes > 20) {
      engagementStyle = 'casual';
    }

    return {
      averagePostLength,
      preferredTopics,
      engagementStyle
    };
  }

  private static async analyzeSocialBehavior(userId: number) {
    const likes = await UserInteraction.count({
      where: { user_id: userId, interaction_type: 'like' }
    });
    
    const comments = await UserInteraction.count({
      where: { user_id: userId, interaction_type: 'comment' }
    });

    // Get user's comments to analyze length and response patterns
    const userComments = await Comment.findAll({
      where: { author_id: userId },
      attributes: ['content', 'parent_id']
    });

    const totalCommentLength = userComments.reduce((sum, c) => sum + c.content.length, 0);
    const averageCommentLength = userComments.length > 0 ? totalCommentLength / userComments.length : 0;
    const respondsToComments = userComments.some(c => c.parent_id !== null);

    return {
      likesToCommentsRatio: comments > 0 ? likes / comments : likes,
      averageCommentLength,
      respondsToComments
    };
  }

  private static extractCategoriesFromContent(content: string): string[] {
    // Simple keyword-based categorization (could be enhanced with ML)
    const keywords = {
      technology: ['tech', 'software', 'programming', 'code', 'developer', 'javascript', 'python', 'react', 'api'],
      science: ['science', 'research', 'study', 'experiment', 'data', 'analysis', 'theory'],
      gaming: ['game', 'gaming', 'player', 'console', 'pc', 'steam', 'multiplayer'],
      lifestyle: ['life', 'health', 'fitness', 'food', 'travel', 'photography'],
      business: ['business', 'startup', 'company', 'market', 'finance', 'entrepreneur'],
      education: ['learn', 'education', 'course', 'tutorial', 'guide', 'help']
    };

    const lowerContent = content.toLowerCase();
    const categories: string[] = [];

    Object.entries(keywords).forEach(([category, words]) => {
      const matches = words.filter(word => lowerContent.includes(word)).length;
      if (matches > 0) {
        categories.push(category);
      }
    });

    return categories;
  }
}

export default UserPreferenceService;