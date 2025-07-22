import Post from '../models/Post';
import User from '../models/User';
import logger from '../utils/logger';
import HotnessUpdateService from './hotnessUpdateService';
import { ViolationService } from './violationService';
import { Op } from 'sequelize';

export interface CreatePostData {
  title: string;
  content: string;
  author_id: number;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
}

export interface PostResult {
  success: boolean;
  post?: Post;
  message?: string;
  error?: string;
}

export interface PostListResult {
  success: boolean;
  posts?: Post[];
  total?: number;
  message?: string;
  error?: string;
}

export interface SearchPostsParams {
  query?: string;
  authorId?: number;
  page?: number;
  limit?: number;
  orderBy?: string;
}

export interface SearchUsersParams {
  query: string;
  page?: number;
  limit?: number;
}

export interface UserSearchResult {
  success: boolean;
  users?: Array<{
    id: number;
    username: string;
    avatar_url?: string;
    post_count?: number;
  }>;
  total?: number;
  message?: string;
  error?: string;
}

export class PostService {
  static async createPost(postData: CreatePostData): Promise<PostResult> {
    try {
      logger.info(`Creating post for user: ${postData.author_id}`);

      // Verify user exists and is active
      const user = await User.findByPk(postData.author_id);
      if (!user) {
        logger.warn(`Post creation failed: User not found ${postData.author_id}`);
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (!user.is_active) {
        logger.warn(`Post creation failed: User account is deactivated ${postData.author_id}`);
        return {
          success: false,
          error: 'Account is deactivated',
        };
      }

      // Check for violations in title and content
      const fullContent = `${postData.title} ${postData.content}`;
      const violationResult = await ViolationService.detectViolations(fullContent);

      // Block post creation if violations found and record violations
      if (violationResult.hasViolations) {
        logger.warn(`Post creation blocked for user ${postData.author_id} due to ${violationResult.violations.length} violations`);
        
        // Record the violation attempt (use a temporary ID since post wasn't created)
        await ViolationService.recordViolations(
          postData.author_id,
          'post',
          0, // Use 0 for blocked content
          fullContent,
          violationResult.violations
        );
        
        const violatedWords = violationResult.violations.map(v => v.word).join(', ');
        return {
          success: false,
          error: `内容包含违规词汇，无法发布。违规词汇: ${violatedWords}`
        };
      }

      // Create post
      const post = await Post.create({
        title: postData.title,
        content: postData.content,
        author_id: postData.author_id,
      });

      logger.info(`Post created successfully: ${post.id}`);

      return {
        success: true,
        post,
        message: 'Post created successfully',
      };
    } catch (error) {
      logger.error('Post creation error:', error);
      return {
        success: false,
        error: 'Post creation failed due to server error',
      };
    }
  }

  static async getPostById(id: number, incrementView: boolean = false, userId?: number): Promise<PostResult> {
    try {
      logger.info(`Fetching post: ${id}`);

      const post = await Post.findActivePostById(id);
      if (!post) {
        logger.warn(`Post not found: ${id}`);
        return {
          success: false,
          error: 'Post not found',
        };
      }

      // Include author information
      await post.reload({
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar_url'],
          },
        ],
      });

      // Increment view count if requested
      if (incrementView) {
        await post.incrementViewCount();
        await post.reload(); // Refresh to get updated view count

        // Trigger real-time hotness update for view
        try {
          const hotnessUpdateService = HotnessUpdateService.getInstance();
          await hotnessUpdateService.onPostView(id, userId);
        } catch (hotnessError) {
          // Don't fail the view operation if hotness update fails
          logger.warn(`Failed to trigger hotness update for post view ${id}:`, hotnessError);
        }
      }

      logger.info(`Post fetched successfully: ${post.id}`);

      return {
        success: true,
        post,
        message: 'Post retrieved successfully',
      };
    } catch (error) {
      logger.error('Get post error:', error);
      return {
        success: false,
        error: 'Failed to retrieve post',
      };
    }
  }

  static async updatePost(postId: number, userId: number, updateData: UpdatePostData): Promise<PostResult> {
    try {
      logger.info(`Updating post ${postId} by user ${userId}`);

      const post = await Post.findActivePostById(postId);
      if (!post) {
        logger.warn(`Update failed: Post not found ${postId}`);
        return {
          success: false,
          error: 'Post not found',
        };
      }

      // Check if user is the author
      if (post.author_id !== userId) {
        logger.warn(`Update failed: User ${userId} is not the author of post ${postId}`);
        return {
          success: false,
          error: 'You can only edit your own posts',
        };
      }

      // Update post
      await post.update(updateData);

      logger.info(`Post updated successfully: ${post.id}`);

      return {
        success: true,
        post,
        message: 'Post updated successfully',
      };
    } catch (error) {
      logger.error('Post update error:', error);
      return {
        success: false,
        error: 'Post update failed due to server error',
      };
    }
  }

  static async deletePost(postId: number, userId: number): Promise<PostResult> {
    try {
      logger.info(`Deleting post ${postId} by user ${userId}`);

      const post = await Post.findActivePostById(postId);
      if (!post) {
        logger.warn(`Delete failed: Post not found ${postId}`);
        return {
          success: false,
          error: 'Post not found',
        };
      }

      // Check if user is the author
      if (post.author_id !== userId) {
        logger.warn(`Delete failed: User ${userId} is not the author of post ${postId}`);
        return {
          success: false,
          error: 'You can only delete your own posts',
        };
      }

      // Soft delete the post
      await post.softDelete();

      logger.info(`Post deleted successfully: ${post.id}`);

      return {
        success: true,
        message: 'Post deleted successfully',
      };
    } catch (error) {
      logger.error('Post deletion error:', error);
      return {
        success: false,
        error: 'Post deletion failed due to server error',
      };
    }
  }

  // Admin delete post (can delete any post)
  static async adminDeletePost(postId: number, adminId: number): Promise<PostResult> {
    try {
      logger.info(`Admin deleting post ${postId} by admin ${adminId}`);

      const post = await Post.findActivePostById(postId);
      if (!post) {
        logger.warn(`Admin delete failed: Post not found ${postId}`);
        return {
          success: false,
          error: 'Post not found',
        };
      }

      // Include author information for logging
      await post.reload({
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username'],
          },
        ],
      });

      // Soft delete the post
      await post.softDelete();

      logger.info(`Post deleted by admin: ${post.id} (author: ${post.author?.username || 'unknown'}) by admin: ${adminId}`);

      return {
        success: true,
        message: 'Post deleted successfully by admin',
        post,
      };
    } catch (error) {
      logger.error('Admin post deletion error:', error);
      return {
        success: false,
        error: 'Admin post deletion failed due to server error',
      };
    }
  }

  static async getPostList(
    page: number = 1,
    limit: number = 20,
    orderBy: string = 'created_at'
  ): Promise<PostListResult> {
    try {
      logger.info(`Fetching post list: page ${page}, limit ${limit}, order by ${orderBy}`);

      const offset = (page - 1) * limit;
      const posts = await Post.findActivePosts(limit, offset, orderBy);

      // Include author information for all posts
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          await post.reload({
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'avatar_url'],
              },
            ],
          });
          return post;
        })
      );

      // Get total count for pagination
      const total = await Post.count({
        where: { is_deleted: false },
      });

      logger.info(`Post list fetched successfully: ${posts.length} posts`);

      return {
        success: true,
        posts: postsWithAuthors,
        total,
        message: 'Posts retrieved successfully',
      };
    } catch (error) {
      logger.error('Get post list error:', error);
      return {
        success: false,
        error: 'Failed to retrieve posts',
      };
    }
  }

  static async getUserPosts(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PostListResult> {
    try {
      logger.info(`Fetching posts for user ${userId}: page ${page}, limit ${limit}`);

      const offset = (page - 1) * limit;
      const posts = await Post.findAll({
        where: {
          author_id: userId,
          is_deleted: false,
        },
        order: [['created_at', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar_url'],
          },
        ],
      });

      // Get total count for pagination
      const total = await Post.count({
        where: {
          author_id: userId,
          is_deleted: false,
        },
      });

      logger.info(`User posts fetched successfully: ${posts.length} posts`);

      return {
        success: true,
        posts,
        total,
        message: 'User posts retrieved successfully',
      };
    } catch (error) {
      logger.error('Get user posts error:', error);
      return {
        success: false,
        error: 'Failed to retrieve user posts',
      };
    }
  }

  static async getHotPosts(limit: number = 20): Promise<PostListResult> {
    try {
      logger.info(`Fetching hot posts: limit ${limit}`);

      const posts = await Post.findHotPosts(limit);

      // Include author information for all posts
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          await post.reload({
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'avatar_url'],
              },
            ],
          });
          return post;
        })
      );

      logger.info(`Hot posts fetched successfully: ${posts.length} posts`);

      return {
        success: true,
        posts: postsWithAuthors,
        message: 'Hot posts retrieved successfully',
      };
    } catch (error) {
      logger.error('Get hot posts error:', error);
      return {
        success: false,
        error: 'Failed to retrieve hot posts',
      };
    }
  }

  static async searchPosts(params: SearchPostsParams): Promise<PostListResult> {
    try {
      const {
        query,
        authorId,
        page = 1,
        limit = 20,
        orderBy = 'created_at'
      } = params;

      logger.info(`Searching posts with query: "${query}", authorId: ${authorId}, page: ${page}, limit: ${limit}`);

      const offset = (page - 1) * limit;
      const whereConditions: any = { is_deleted: false };

      // Add search query conditions
      if (query && query.trim()) {
        const searchTerm = query.trim();
        whereConditions[Op.or] = [
          { title: { [Op.iLike]: `%${searchTerm}%` } },
          { content: { [Op.iLike]: `%${searchTerm}%` } }
        ];
      }

      // Add author filter
      if (authorId) {
        whereConditions.author_id = authorId;
      }

      // Build order clause
      let orderClause: any = [['created_at', 'DESC']];
      if (orderBy === 'updated_at') {
        orderClause = [['updated_at', 'DESC']];
      } else if (orderBy === 'hotness_score') {
        orderClause = [['hotness_score', 'DESC']];
      } else if (orderBy === 'like_count') {
        orderClause = [['like_count', 'DESC']];
      } else if (orderBy === 'view_count') {
        orderClause = [['view_count', 'DESC']];
      }

      // Search posts
      const posts = await Post.findAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar_url'],
          },
        ],
        order: orderClause,
        limit,
        offset,
      });

      // Get total count for pagination
      const total = await Post.count({
        where: whereConditions,
      });

      logger.info(`Posts search completed: ${posts.length} posts found, total: ${total}`);

      return {
        success: true,
        posts,
        total,
        message: 'Posts retrieved successfully',
      };
    } catch (error) {
      logger.error('Search posts error:', error);
      return {
        success: false,
        error: 'Failed to search posts',
      };
    }
  }

  static async searchUsers(params: SearchUsersParams): Promise<UserSearchResult> {
    try {
      const { query, page = 1, limit = 20 } = params;

      logger.info(`Searching users with query: "${query}", page: ${page}, limit: ${limit}`);

      if (!query || !query.trim()) {
        return {
          success: false,
          error: 'Search query is required',
        };
      }

      const offset = (page - 1) * limit;
      const searchTerm = query.trim();

      // Search users by username
      const users = await User.findAll({
        where: {
          username: { [Op.iLike]: `%${searchTerm}%` },
          is_active: true,
        },
        attributes: ['id', 'username', 'avatar_url'],
        order: [['username', 'ASC']],
        limit,
        offset,
      });

      // Get post count for each user
      const usersWithPostCount = await Promise.all(
        users.map(async (user) => {
          const post_count = await Post.count({
            where: {
              author_id: user.id,
              is_deleted: false,
            },
          });

          return {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url || undefined,
            post_count,
          };
        })
      );

      // Get total count for pagination
      const total = await User.count({
        where: {
          username: { [Op.iLike]: `%${searchTerm}%` },
          is_active: true,
        },
      });

      logger.info(`Users search completed: ${users.length} users found, total: ${total}`);

      return {
        success: true,
        users: usersWithPostCount,
        total,
        message: 'Users retrieved successfully',
      };
    } catch (error) {
      logger.error('Search users error:', error);
      return {
        success: false,
        error: 'Failed to search users',
      };
    }
  }
}