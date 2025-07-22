import UserPreferenceService from '../../src/services/userPreferenceService';
import UserInteraction from '../../src/models/UserInteraction';
import Post from '../../src/models/Post';
import Comment from '../../src/models/Comment';
import { Op } from 'sequelize';

// Mock the dependencies
jest.mock('../../src/models/UserInteraction');
jest.mock('../../src/models/Post');
jest.mock('../../src/models/Comment');
jest.mock('../../src/utils/logger');

const mockUserInteraction = UserInteraction as jest.Mocked<typeof UserInteraction>;
const mockPost = Post as jest.Mocked<typeof Post>;
const mockComment = Comment as jest.Mocked<typeof Comment>;

describe('UserPreferenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildUserProfile', () => {
    it('should build comprehensive user profile with interactions', async () => {
      const mockInteractions = [
        {
          id: 1,
          user_id: 1,
          post_id: 1,
          interaction_type: 'view',
          interaction_weight: 0.5,
          created_at: new Date('2023-01-01T10:00:00Z'),
          post: {
            id: 1,
            title: 'Tech Post',
            content: 'This is about programming and software development',
            created_at: new Date('2023-01-01T09:00:00Z')
          }
        },
        {
          id: 2,
          user_id: 1,
          post_id: 2,
          interaction_type: 'like',
          interaction_weight: 2.0,
          created_at: new Date('2023-01-01T14:00:00Z'),
          post: {
            id: 2,
            title: 'Science Article',
            content: 'Research about data analysis and experiments',
            created_at: new Date('2023-01-01T13:00:00Z')
          }
        }
      ];

      const mockComments = [
        {
          content: 'This is a great post about programming!',
          parent_id: null
        },
        {
          content: 'I agree with the analysis.',
          parent_id: 1
        }
      ];

      mockUserInteraction.findAll = jest.fn().mockResolvedValue(mockInteractions);
      mockUserInteraction.count = jest.fn()
        .mockResolvedValueOnce(1) // likes count
        .mockResolvedValueOnce(2); // comments count
      mockComment.findAll = jest.fn().mockResolvedValue(mockComments);

      const result = await UserPreferenceService.buildUserProfile(1);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile!.userId).toBe(1);
      expect(result.profile!.totalInteractions).toBe(2);
      expect(result.profile!.interactionPatterns.views).toBe(1);
      expect(result.profile!.interactionPatterns.likes).toBe(1);
      expect(result.profile!.contentPreferences.engagementStyle).toBe('lurker');
      expect(result.profile!.socialBehavior.respondsToComments).toBe(true);
    });

    it('should return default profile for users with no interactions', async () => {
      mockUserInteraction.findAll = jest.fn().mockResolvedValue([]);

      const result = await UserPreferenceService.buildUserProfile(1);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile!.userId).toBe(1);
      expect(result.profile!.totalInteractions).toBe(0);
      expect(result.profile!.contentPreferences.engagementStyle).toBe('lurker');
    });

    it('should handle errors gracefully', async () => {
      mockUserInteraction.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await UserPreferenceService.buildUserProfile(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getUserInterestCategories', () => {
    it('should extract and score interest categories', async () => {
      const mockInteractions = [
        {
          interaction_weight: 2.0,
          post: {
            title: 'JavaScript Programming Tutorial',
            content: 'Learn about React and Node.js development'
          }
        },
        {
          interaction_weight: 1.5,
          post: {
            title: 'Data Science Research',
            content: 'Analysis of machine learning algorithms'
          }
        }
      ];

      mockUserInteraction.findAll = jest.fn().mockResolvedValue(mockInteractions);

      const result = await UserPreferenceService.getUserInterestCategories(1);

      expect(result.success).toBe(true);
      expect(result.categories).toBeDefined();
      expect(result.categories!.length).toBeGreaterThan(0);
      
      const techCategory = result.categories!.find(cat => cat.category === 'technology');
      expect(techCategory).toBeDefined();
      expect(techCategory!.score).toBeGreaterThan(0);
    });

    it('should handle users with no interactions', async () => {
      mockUserInteraction.findAll = jest.fn().mockResolvedValue([]);

      const result = await UserPreferenceService.getUserInterestCategories(1);

      expect(result.success).toBe(true);
      expect(result.categories).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockUserInteraction.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await UserPreferenceService.getUserInterestCategories(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('findSimilarUsers', () => {
    it('should find users with similar interaction patterns', async () => {
      const mockUserPosts = [
        { post_id: 1 },
        { post_id: 2 },
        { post_id: 3 }
      ];

      const mockSimilarInteractions = [
        {
          user_id: 2,
          common_posts: '2',
          total_weight: '4.5'
        },
        {
          user_id: 3,
          common_posts: '1',
          total_weight: '2.0'
        }
      ];

      mockUserInteraction.findAll = jest.fn()
        .mockResolvedValueOnce(mockUserPosts)
        .mockResolvedValueOnce(mockSimilarInteractions);

      const result = await UserPreferenceService.findSimilarUsers(1, 5);

      expect(result.success).toBe(true);
      expect(result.similarUsers).toBeDefined();
      expect(result.similarUsers!.length).toBe(2);
      expect(result.similarUsers![0].userId).toBe(2);
      expect(result.similarUsers![0].commonInteractions).toBe(2);
      expect(result.similarUsers![0].similarityScore).toBeCloseTo(1.5); // 4.5 / 3
    });

    it('should return empty array for users with no interactions', async () => {
      mockUserInteraction.findAll = jest.fn().mockResolvedValue([]);

      const result = await UserPreferenceService.findSimilarUsers(1);

      expect(result.success).toBe(true);
      expect(result.similarUsers).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockUserInteraction.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await UserPreferenceService.findSimilarUsers(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('updatePreferenceWeights', () => {
    it('should calculate appropriate weights for different interaction types', async () => {
      mockUserInteraction.recordInteraction = jest.fn().mockResolvedValue({});

      // Test view interaction (no bonus/penalty logic for views)
      mockUserInteraction.count = jest.fn().mockResolvedValue(0); // no recent interactions
      let result = await UserPreferenceService.updatePreferenceWeights(1, 'view', 1);
      expect(result.success).toBe(true);
      expect(mockUserInteraction.recordInteraction).toHaveBeenCalledWith(1, 1, 'view', 0.5);

      // Test like interaction with rare liker bonus
      mockUserInteraction.count = jest.fn()
        .mockResolvedValueOnce(5)  // user likes count (< 10, so gets bonus)
        .mockResolvedValueOnce(0); // no recent interactions
      result = await UserPreferenceService.updatePreferenceWeights(1, 'like', 1);
      expect(result.success).toBe(true);
      expect(mockUserInteraction.recordInteraction).toHaveBeenCalledWith(1, 1, 'like', 2.5); // 2.0 + 0.5 bonus

      // Test comment interaction with length bonus
      mockUserInteraction.count = jest.fn().mockResolvedValue(0); // no recent interactions
      result = await UserPreferenceService.updatePreferenceWeights(1, 'comment', 1, { commentLength: 150 });
      expect(result.success).toBe(true);
      expect(mockUserInteraction.recordInteraction).toHaveBeenCalledWith(1, 1, 'comment', 3.5); // 3.0 + 0.5 bonus
    });

    it('should apply recency penalty for repeated interactions', async () => {
      mockUserInteraction.recordInteraction = jest.fn().mockResolvedValue({});
      mockUserInteraction.count = jest.fn()
        .mockResolvedValueOnce(5) // user likes count
        .mockResolvedValueOnce(2); // recent interactions on same post

      const result = await UserPreferenceService.updatePreferenceWeights(1, 'like', 1);
      
      expect(result.success).toBe(true);
      // Should apply 0.7 penalty: (2.0 + 0.5) * 0.7 = 1.75
      expect(mockUserInteraction.recordInteraction).toHaveBeenCalledWith(1, 1, 'like', 1.75);
    });

    it('should handle errors gracefully', async () => {
      mockUserInteraction.recordInteraction = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await UserPreferenceService.updatePreferenceWeights(1, 'view', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});