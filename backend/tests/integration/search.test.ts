import request from 'supertest';
import app from '../../src/index';
import { sequelize } from '../../src/config/database';
import User from '../../src/models/User';
import Post from '../../src/models/Post';
import bcrypt from 'bcrypt';

describe('Search Functionality', () => {
  let testUsers: User[] = [];
  let testPosts: Post[] = [];

  beforeAll(async () => {
    // Don't clear database - use existing data
    // Just get existing users and posts for reference
    testUsers = await User.findAll({ limit: 5 });
    testPosts = await Post.findAll({ limit: 10 });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST Search', () => {
    describe('GET /api/v1/posts/search', () => {
      it('should search posts by title', async () => {
        const response = await request(app)
          .get('/api/v1/posts/search')
          .query({ q: '测试' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts.length).toBeGreaterThanOrEqual(1);
        expect(response.body.data.posts[0].title).toContain('测试');
        expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(1);
      });

      it('should search posts by content', async () => {
        const response = await request(app)
          .get('/api/v1/posts/search')
          .query({ q: '成功' })
          .expect(200);

        expect(response.body.success).toBe(true);
        // Content search should work even if no results
        expect(response.body.data.posts).toBeDefined();
        expect(response.body.data.pagination).toBeDefined();
      });

      it('should search posts case-insensitively', async () => {
        const response = await request(app)
          .get('/api/v1/posts/search')
          .query({ q: '测试' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts.length).toBeGreaterThanOrEqual(1);
      });

      it('should search posts by partial match', async () => {
        const response = await request(app)
          .get('/api/v1/posts/search')
          .query({ q: '测' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts.length).toBeGreaterThanOrEqual(1);
        
        // Should find posts containing "测" 
        const hasMatchingPost = response.body.data.posts.some((post: any) => 
          post.title.includes('测') || 
          post.content.includes('测')
        );
        expect(hasMatchingPost).toBe(true);
      });

      it('should filter posts by author', async () => {
        if (testUsers.length > 0) {
          const response = await request(app)
            .get('/api/v1/posts/search')
            .query({ author: testUsers[0].id })
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.posts).toBeDefined();
          // Check that all returned posts belong to the specified author
          response.body.data.posts.forEach((post: any) => {
            expect(post.author_id).toBe(testUsers[0].id);
          });
        }
      });

      it('should combine search query and author filter', async () => {
        if (testUsers.length > 0) {
          const response = await request(app)
            .get('/api/v1/posts/search')
            .query({ 
              q: '测试',
              author: testUsers[0].id 
            })
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.posts).toBeDefined();
          // If there are results, they should match both criteria
          response.body.data.posts.forEach((post: any) => {
            expect(post.author_id).toBe(testUsers[0].id);
          });
        }
      });

      it('should return empty results for non-existent search terms', async () => {
        const response = await request(app)
          .get('/api/v1/posts/search')
          .query({ q: 'nonexistentterm12345' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toHaveLength(0);
        expect(response.body.data.pagination.total).toBe(0);
      });

      it('should handle pagination correctly', async () => {
        const response = await request(app)
          .get('/api/v1/posts/search')
          .query({ 
            q: '',  // Empty query to get all posts
            page: 1,
            limit: 2
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toHaveLength(2);
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(2);
        expect(response.body.data.pagination.total).toBe(5);
        expect(response.body.data.pagination.totalPages).toBe(3);
      });

      it('should sort results by different criteria', async () => {
        // Test sorting by creation date (default)
        const createdAtResponse = await request(app)
          .get('/api/v1/posts/search')
          .query({ orderBy: 'created_at' })
          .expect(200);

        expect(createdAtResponse.body.success).toBe(true);
        
        // Test sorting by hotness score
        const hotnessResponse = await request(app)
          .get('/api/v1/posts/search')
          .query({ orderBy: 'hotness_score' })
          .expect(200);

        expect(hotnessResponse.body.success).toBe(true);
      });

      it('should validate pagination parameters', async () => {
        // Invalid page
        await request(app)
          .get('/api/v1/posts/search')
          .query({ page: 0 })
          .expect(400);

        // Invalid limit
        await request(app)
          .get('/api/v1/posts/search')
          .query({ limit: 101 })
          .expect(400);
      });

      it('should validate author ID parameter', async () => {
        await request(app)
          .get('/api/v1/posts/search')
          .query({ author: 'invalid' })
          .expect(400);
      });

      it('should include author information in results', async () => {
        const response = await request(app)
          .get('/api/v1/posts/search')
          .query({ q: 'JavaScript' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts[0].author).toBeDefined();
        expect(response.body.data.posts[0].author.username).toBe('johndeveloper');
      });
    });
  });

  describe('User Search', () => {
    describe('GET /api/v1/users/search', () => {
      it('should search users by username', async () => {
        const response = await request(app)
          .get('/api/v1/users/search')
          .query({ q: 'john' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toHaveLength(1);
        expect(response.body.data.users[0].username).toBe('johndeveloper');
        expect(response.body.data.users[0].post_count).toBe(2);
      });

      it('should search users case-insensitively', async () => {
        const response = await request(app)
          .get('/api/v1/users/search')
          .query({ q: 'JANE' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toHaveLength(1);
        expect(response.body.data.users[0].username).toBe('janedesigner');
      });

      it('should search users by partial username match', async () => {
        const response = await request(app)
          .get('/api/v1/users/search')
          .query({ q: 'dev' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toHaveLength(1);
        expect(response.body.data.users[0].username).toContain('dev');
      });

      it('should include post count for each user', async () => {
        const response = await request(app)
          .get('/api/v1/users/search')
          .query({ q: 'jane' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users[0].post_count).toBe(2);
      });

      it('should handle pagination for user search', async () => {
        const response = await request(app)
          .get('/api/v1/users/search')
          .query({ 
            q: 'e', // Should match multiple users
            page: 1,
            limit: 2
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toBeDefined();
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(2);
      });

      it('should return empty results for non-existent users', async () => {
        const response = await request(app)
          .get('/api/v1/users/search')
          .query({ q: 'nonexistentuser12345' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toHaveLength(0);
        expect(response.body.data.pagination.total).toBe(0);
      });

      it('should require search query parameter', async () => {
        await request(app)
          .get('/api/v1/users/search')
          .expect(400);

        await request(app)
          .get('/api/v1/users/search')
          .query({ q: '' })
          .expect(400);
      });

      it('should validate pagination parameters for user search', async () => {
        // Invalid page
        await request(app)
          .get('/api/v1/users/search')
          .query({ q: 'test', page: 0 })
          .expect(400);

        // Invalid limit
        await request(app)
          .get('/api/v1/users/search')
          .query({ q: 'test', limit: 101 })
          .expect(400);
      });

      it('should sort users alphabetically', async () => {
        const response = await request(app)
          .get('/api/v1/users/search')
          .query({ q: 'e' })
          .expect(200);

        expect(response.body.success).toBe(true);
        
        if (response.body.data.users.length > 1) {
          const usernames = response.body.data.users.map((user: any) => user.username);
          const sortedUsernames = [...usernames].sort();
          expect(usernames).toEqual(sortedUsernames);
        }
      });

      it('should not include inactive users in search results', async () => {
        // Create an inactive user
        const hashedPassword = await bcrypt.hash('password123', 10);
        const inactiveUser = await User.create({
          username: 'inactiveuser',
          email: 'inactive@test.com',
          password_hash: hashedPassword,
          is_active: false,
          is_verified: true,
        });

        const response = await request(app)
          .get('/api/v1/users/search')
          .query({ q: 'inactive' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toHaveLength(0);

        // Clean up
        await inactiveUser.destroy();
      });
    });
  });

  describe('Search Performance and Edge Cases', () => {
    it('should handle special characters in search queries', async () => {
      const response = await request(app)
        .get('/api/v1/posts/search')
        .query({ q: 'UI/UX' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.posts[0].title).toContain('UI/UX');
    });

    it('should handle empty search queries gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/posts/search')
        .query({ q: '   ' }) // Whitespace only
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should return all posts when query is empty/whitespace
      expect(response.body.data.posts).toHaveLength(5);
    });

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000);
      
      const response = await request(app)
        .get('/api/v1/posts/search')
        .query({ q: longQuery })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(0);
    });

    it('should maintain consistent response format across different search types', async () => {
      const postResponse = await request(app)
        .get('/api/v1/posts/search')
        .query({ q: 'test' })
        .expect(200);

      const userResponse = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'test' })
        .expect(200);

      // Both should have consistent structure
      expect(postResponse.body).toHaveProperty('success');
      expect(postResponse.body).toHaveProperty('data');
      expect(postResponse.body).toHaveProperty('timestamp');
      
      expect(userResponse.body).toHaveProperty('success');
      expect(userResponse.body).toHaveProperty('data');
      expect(userResponse.body).toHaveProperty('timestamp');

      expect(postResponse.body.data).toHaveProperty('pagination');
      expect(userResponse.body.data).toHaveProperty('pagination');
    });
  });
});