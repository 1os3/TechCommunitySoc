import request from 'supertest';
import express from 'express';
import userBehaviorRoutes from '../../src/routes/userBehavior';
import { authenticateToken } from '../../src/middleware/auth';
import UserPreferenceService from '../../src/services/userPreferenceService';
import { getUserBehaviorStats, recordUserBehavior } from '../../src/middleware/behaviorTracking';
import UserInteraction from '../../src/models/UserInteraction';

// Mock the dependencies
jest.mock('../../src/middleware/auth');
jest.mock('../../src/services/userPreferenceService');
jest.mock('../../src/middleware/behaviorTracking');
jest.mock('../../src/models/UserInteraction');
jest.mock('../../src/utils/logger');

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;
const mockUserPreferenceService = UserPreferenceService as jest.Mocked<typeof UserPreferenceService>;
const mockGetUserBehaviorStats = getUserBehaviorStats as jest.MockedFunction<typeof getUserBehaviorStats>;
const mockRecordUserBehavior = recordUserBehavior as jest.MockedFunction<typeof recordUserBehavior>;
const mockUserInteraction = UserInteraction as jest.Mocked<typeof UserInteraction>;

describe('User Behavior Routes', () => {
  let app: express.Application;
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware to provide test user
    mockAuthenticateToken.mockImplementation(async (req: any, res, next) => {
      req.user = mockUser;
      next();
    });

    app.use('/api/behavior', userBehaviorRoutes);
    
    jest.clearAllMocks();
  });

  describe('GET /api/behavior/profile', () => {
    it('should return user behavior profile', async () => {
      const mockProfile = {
        userId: 1,
        totalInteractions: 10,
        interactionPatterns: { views: 5, likes: 3, comments: 2 },
        activityPeriods: { morning: 2, afternoon: 3, evening: 4, night: 1 },
        contentPreferences: {
          averagePostLength: 150,
          preferredTopics: ['technology', 'science'],
          engagementStyle: 'active' as const
        },
        socialBehavior: {
          likesToCommentsRatio: 1.5,
          averageCommentLength: 50,
          respondsToComments: true
        },
        temporalPatterns: {
          peakActivityHours: [14, 15, 16],
          mostActiveDays: [1, 2, 3],
          sessionDuration: 30
        }
      };

      mockUserPreferenceService.buildUserProfile.mockResolvedValue({
        success: true,
        profile: mockProfile
      });

      const response = await request(app)
        .get('/api/behavior/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile).toEqual(mockProfile);
      expect(mockUserPreferenceService.buildUserProfile).toHaveBeenCalledWith(1);
    });

    it('should handle service errors', async () => {
      mockUserPreferenceService.buildUserProfile.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const response = await request(app)
        .get('/api/behavior/profile')
        .expect(500);

      expect(response.body.error).toBe('Failed to build user profile');
      expect(response.body.details).toBe('Database error');
    });
  });

  describe('GET /api/behavior/stats', () => {
    it('should return user behavior statistics', async () => {
      const mockStats = {
        totalInteractions: 15,
        recentActivity: 5,
        interactionsByType: { view: 8, like: 4, comment: 3 },
        averageWeight: 1.2,
        mostActiveHours: [14, 15, 20]
      };

      mockGetUserBehaviorStats.mockResolvedValue({
        success: true,
        data: mockStats
      });

      const response = await request(app)
        .get('/api/behavior/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toEqual(mockStats);
      expect(mockGetUserBehaviorStats).toHaveBeenCalledWith(1);
    });

    it('should handle service errors', async () => {
      mockGetUserBehaviorStats.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const response = await request(app)
        .get('/api/behavior/stats')
        .expect(500);

      expect(response.body.error).toBe('Failed to get behavior stats');
    });
  });

  describe('GET /api/behavior/interests', () => {
    it('should return user interest categories', async () => {
      const mockCategories = [
        { category: 'technology', score: 8.5, postCount: 10 },
        { category: 'science', score: 6.2, postCount: 7 }
      ];

      mockUserPreferenceService.getUserInterestCategories.mockResolvedValue({
        success: true,
        categories: mockCategories
      });

      const response = await request(app)
        .get('/api/behavior/interests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.categories).toEqual(mockCategories);
    });
  });

  describe('GET /api/behavior/similar-users', () => {
    it('should return similar users with default limit', async () => {
      const mockSimilarUsers = [
        { userId: 2, similarityScore: 0.8, commonInteractions: 5 },
        { userId: 3, similarityScore: 0.6, commonInteractions: 3 }
      ];

      mockUserPreferenceService.findSimilarUsers.mockResolvedValue({
        success: true,
        similarUsers: mockSimilarUsers
      });

      const response = await request(app)
        .get('/api/behavior/similar-users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.similarUsers).toEqual(mockSimilarUsers);
      expect(mockUserPreferenceService.findSimilarUsers).toHaveBeenCalledWith(1, 10);
    });

    it('should accept custom limit parameter', async () => {
      mockUserPreferenceService.findSimilarUsers.mockResolvedValue({
        success: true,
        similarUsers: []
      });

      await request(app)
        .get('/api/behavior/similar-users?limit=5')
        .expect(200);

      expect(mockUserPreferenceService.findSimilarUsers).toHaveBeenCalledWith(1, 5);
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/behavior/similar-users?limit=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/behavior/track', () => {
    it('should record user behavior', async () => {
      mockRecordUserBehavior.mockResolvedValue({ success: true });
      mockUserPreferenceService.updatePreferenceWeights.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/behavior/track')
        .send({
          postId: 1,
          interactionType: 'like',
          weight: 2.5,
          contextData: { source: 'homepage' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockRecordUserBehavior).toHaveBeenCalledWith(1, 1, 'like', 2.5);
      expect(mockUserPreferenceService.updatePreferenceWeights).toHaveBeenCalledWith(
        1, 'like', 1, { source: 'homepage' }
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/behavior/track')
        .send({
          postId: 'invalid',
          interactionType: 'invalid_type'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle recording errors', async () => {
      mockRecordUserBehavior.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const response = await request(app)
        .post('/api/behavior/track')
        .send({
          postId: 1,
          interactionType: 'view'
        })
        .expect(500);

      expect(response.body.error).toBe('Failed to record behavior');
    });
  });

  describe('GET /api/behavior/history', () => {
    it('should return user interaction history', async () => {
      const testDate = new Date();
      const mockInteractions = [
        {
          id: 1,
          user_id: 1,
          post_id: 1,
          interaction_type: 'like',
          created_at: testDate.toISOString(),
          post: { id: 1, title: 'Test Post', author_id: 2 }
        }
      ];

      mockUserInteraction.findAll.mockResolvedValue(mockInteractions as any);

      const response = await request(app)
        .get('/api/behavior/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.interactions).toEqual(mockInteractions);
      expect(response.body.total).toBe(1);
    });

    it('should filter by interaction type', async () => {
      mockUserInteraction.findAll.mockResolvedValue([]);

      await request(app)
        .get('/api/behavior/history?type=like&limit=20')
        .expect(200);

      expect(mockUserInteraction.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 1,
            interaction_type: 'like'
          }),
          limit: 20
        })
      );
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/behavior/history?type=invalid&limit=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/behavior/analytics/:postId', () => {
    it('should return post behavior analytics', async () => {
      const mockStats = {
        views: 100,
        likes: 20,
        comments: 15,
        totalWeight: 45.5
      };

      const mockInteractions = [
        { created_at: new Date('2023-01-01T10:00:00Z'), interaction_type: 'view' },
        { created_at: new Date('2023-01-01T14:00:00Z'), interaction_type: 'like' }
      ];

      mockUserInteraction.getPostInteractionStats.mockResolvedValue(mockStats);
      mockUserInteraction.findAll.mockResolvedValue(mockInteractions as any);

      const response = await request(app)
        .get('/api/behavior/analytics/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toMatchObject(mockStats);
      expect(response.body.analytics.totalInteractions).toBe(2);
      expect(response.body.analytics.hourlyDistribution).toHaveLength(24);
    });

    it('should validate post ID parameter', async () => {
      const response = await request(app)
        .get('/api/behavior/analytics/invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/behavior/clear', () => {
    it('should clear user behavior data', async () => {
      mockUserInteraction.destroy.mockResolvedValue(5);

      const response = await request(app)
        .delete('/api/behavior/clear')
        .send({ confirmClear: 'true' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(5);
      expect(mockUserInteraction.destroy).toHaveBeenCalledWith({
        where: { user_id: 1 }
      });
    });

    it('should require confirmation', async () => {
      const response = await request(app)
        .delete('/api/behavior/clear')
        .send({ confirmClear: 'false' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});