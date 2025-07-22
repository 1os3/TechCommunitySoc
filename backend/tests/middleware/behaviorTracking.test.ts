import request from 'supertest';
import express from 'express';
import { trackBehavior, recordUserBehavior, getUserBehaviorStats, clearBehaviorCache } from '../../src/middleware/behaviorTracking';
import UserInteraction from '../../src/models/UserInteraction';
import { authenticateToken } from '../../src/middleware/auth';
import User from '../../src/models/User';
import Post from '../../src/models/Post';

// Mock the dependencies
jest.mock('../../src/models/UserInteraction');
jest.mock('../../src/utils/logger');

const mockUserInteraction = UserInteraction as jest.Mocked<typeof UserInteraction>;

describe('Behavior Tracking Middleware', () => {
  let app: express.Application;
  let mockUser: any;
  let mockPost: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock user and post
    mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    };
    
    mockPost = {
      id: 1,
      title: 'Test Post',
      content: 'Test content',
      author_id: 1
    };

    // Mock auth middleware to provide a test user
    app.use((req: any, res, next) => {
      req.user = mockUser;
      next();
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearBehaviorCache();
  });

  describe('trackBehavior middleware', () => {
    it('should track post view interactions', async () => {
      const middleware = trackBehavior({ trackViews: true });
      
      app.get('/posts/:id', middleware, (req, res) => {
        res.json({ success: true });
      });

      mockUserInteraction.recordInteraction = jest.fn().mockResolvedValue({});

      await request(app)
        .get('/posts/1')
        .expect(200);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockUserInteraction.recordInteraction).toHaveBeenCalledWith(
        1, // userId
        1, // postId
        'view',
        0.5 // weight
      );
    });

    it('should track like interactions', async () => {
      const middleware = trackBehavior({ trackLikes: true });
      
      app.post('/likes/posts/:id', middleware, (req, res) => {
        res.json({ success: true });
      });

      mockUserInteraction.recordInteraction = jest.fn().mockResolvedValue({});

      await request(app)
        .post('/likes/posts/1')
        .expect(200);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockUserInteraction.recordInteraction).toHaveBeenCalledWith(
        1, // userId
        1, // postId
        'like',
        2.0 // weight
      );
    });

    it('should track comment interactions', async () => {
      const middleware = trackBehavior({ trackComments: true });
      
      app.post('/posts/:id/comments', middleware, (req, res) => {
        res.json({ success: true });
      });

      mockUserInteraction.recordInteraction = jest.fn().mockResolvedValue({});

      await request(app)
        .post('/posts/1/comments')
        .send({ content: 'Test comment' })
        .expect(200);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockUserInteraction.recordInteraction).toHaveBeenCalledWith(
        1, // userId
        1, // postId
        'comment',
        3.0 // weight
      );
    });

    it('should not track when user is not authenticated', async () => {
      // Create app without user mock
      const testApp = express();
      testApp.use(express.json());
      
      const middleware = trackBehavior({ trackViews: true });
      testApp.get('/posts/:id', middleware, (req, res) => {
        res.json({ success: true });
      });

      mockUserInteraction.recordInteraction = jest.fn();

      await request(testApp)
        .get('/posts/1')
        .expect(200);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockUserInteraction.recordInteraction).not.toHaveBeenCalled();
    });

    it('should respect debounce time', async () => {
      const middleware = trackBehavior({ 
        trackViews: true, 
        debounceTime: 1000 // 1 second
      });
      
      app.get('/posts/:id', middleware, (req, res) => {
        res.json({ success: true });
      });

      mockUserInteraction.recordInteraction = jest.fn().mockResolvedValue({});

      // Make two rapid requests
      await request(app).get('/posts/1').expect(200);
      await request(app).get('/posts/1').expect(200);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should only be called once due to debounce
      expect(mockUserInteraction.recordInteraction).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const middleware = trackBehavior({ trackViews: true });
      
      app.get('/posts/:id', middleware, (req, res) => {
        res.json({ success: true });
      });

      mockUserInteraction.recordInteraction = jest.fn().mockRejectedValue(new Error('Database error'));

      // Should not throw error and still respond
      await request(app)
        .get('/posts/1')
        .expect(200);
    });
  });

  describe('recordUserBehavior function', () => {
    it('should record behavior with default weights', async () => {
      mockUserInteraction.recordInteraction = jest.fn().mockResolvedValue({});

      const result = await recordUserBehavior(1, 1, 'like');

      expect(result.success).toBe(true);
      expect(mockUserInteraction.recordInteraction).toHaveBeenCalledWith(1, 1, 'like', 2.0);
    });

    it('should record behavior with custom weight', async () => {
      mockUserInteraction.recordInteraction = jest.fn().mockResolvedValue({});

      const result = await recordUserBehavior(1, 1, 'view', 1.5);

      expect(result.success).toBe(true);
      expect(mockUserInteraction.recordInteraction).toHaveBeenCalledWith(1, 1, 'view', 1.5);
    });

    it('should handle errors and return failure', async () => {
      mockUserInteraction.recordInteraction = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await recordUserBehavior(1, 1, 'like');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getUserBehaviorStats function', () => {
    it('should return user behavior statistics', async () => {
      const mockPreferences = {
        totalInteractions: 10,
        interactionsByType: { view: 5, like: 3, comment: 2 },
        averageWeight: 1.5
      };

      const mockInteractions = [
        { created_at: new Date('2023-01-01T10:00:00Z') },
        { created_at: new Date('2023-01-01T14:00:00Z') },
        { created_at: new Date('2023-01-01T20:00:00Z') },
        { created_at: new Date('2023-01-01T20:00:00Z') }, // duplicate to make 20 the top hour
        { created_at: new Date('2023-01-01T14:00:00Z') }, // duplicate to make 14 second
      ];

      mockUserInteraction.getUserPreferences = jest.fn().mockResolvedValue(mockPreferences);
      mockUserInteraction.count = jest.fn().mockResolvedValue(5);
      mockUserInteraction.findAll = jest.fn().mockResolvedValue(mockInteractions);

      const result = await getUserBehaviorStats(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalInteractions: 10,
        recentActivity: 5,
        interactionsByType: { view: 5, like: 3, comment: 2 },
        averageWeight: 1.5,
        mostActiveHours: [4, 22, 18]
      });
    });

    it('should handle errors and return failure', async () => {
      mockUserInteraction.getUserPreferences = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await getUserBehaviorStats(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('clearBehaviorCache function', () => {
    it('should clear the behavior cache', () => {
      // This function primarily clears internal cache
      // We can't easily test the internal state, but we can ensure it doesn't throw
      expect(() => clearBehaviorCache()).not.toThrow();
    });
  });
});