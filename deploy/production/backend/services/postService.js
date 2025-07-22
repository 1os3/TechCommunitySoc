"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
const hotnessUpdateService_1 = __importDefault(require("./hotnessUpdateService"));
const violationService_1 = require("./violationService");
const sequelize_1 = require("sequelize");
class PostService {
    static async createPost(postData) {
        try {
            logger_1.default.info(`Creating post for user: ${postData.author_id}`);
            // Verify user exists and is active
            const user = await User_1.default.findByPk(postData.author_id);
            if (!user) {
                logger_1.default.warn(`Post creation failed: User not found ${postData.author_id}`);
                return {
                    success: false,
                    error: 'User not found',
                };
            }
            if (!user.is_active) {
                logger_1.default.warn(`Post creation failed: User account is deactivated ${postData.author_id}`);
                return {
                    success: false,
                    error: 'Account is deactivated',
                };
            }
            // Check for violations in title and content
            const fullContent = `${postData.title} ${postData.content}`;
            const violationResult = await violationService_1.ViolationService.detectViolations(fullContent);
            // Block post creation if violations found and record violations
            if (violationResult.hasViolations) {
                logger_1.default.warn(`Post creation blocked for user ${postData.author_id} due to ${violationResult.violations.length} violations`);
                // Record the violation attempt (use a temporary ID since post wasn't created)
                await violationService_1.ViolationService.recordViolations(postData.author_id, 'post', 0, // Use 0 for blocked content
                fullContent, violationResult.violations);
                const violatedWords = violationResult.violations.map(v => v.word).join(', ');
                return {
                    success: false,
                    error: `内容包含违规词汇，无法发布。违规词汇: ${violatedWords}`
                };
            }
            // Create post
            const post = await Post_1.default.create({
                title: postData.title,
                content: postData.content,
                author_id: postData.author_id,
            });
            logger_1.default.info(`Post created successfully: ${post.id}`);
            return {
                success: true,
                post,
                message: 'Post created successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Post creation error:', error);
            return {
                success: false,
                error: 'Post creation failed due to server error',
            };
        }
    }
    static async getPostById(id, incrementView = false, userId) {
        try {
            logger_1.default.info(`Fetching post: ${id}`);
            const post = await Post_1.default.findActivePostById(id);
            if (!post) {
                logger_1.default.warn(`Post not found: ${id}`);
                return {
                    success: false,
                    error: 'Post not found',
                };
            }
            // Include author information
            await post.reload({
                include: [
                    {
                        model: User_1.default,
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
                    const hotnessUpdateService = hotnessUpdateService_1.default.getInstance();
                    await hotnessUpdateService.onPostView(id, userId);
                }
                catch (hotnessError) {
                    // Don't fail the view operation if hotness update fails
                    logger_1.default.warn(`Failed to trigger hotness update for post view ${id}:`, hotnessError);
                }
            }
            logger_1.default.info(`Post fetched successfully: ${post.id}`);
            return {
                success: true,
                post,
                message: 'Post retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get post error:', error);
            return {
                success: false,
                error: 'Failed to retrieve post',
            };
        }
    }
    static async updatePost(postId, userId, updateData) {
        try {
            logger_1.default.info(`Updating post ${postId} by user ${userId}`);
            const post = await Post_1.default.findActivePostById(postId);
            if (!post) {
                logger_1.default.warn(`Update failed: Post not found ${postId}`);
                return {
                    success: false,
                    error: 'Post not found',
                };
            }
            // Check if user is the author
            if (post.author_id !== userId) {
                logger_1.default.warn(`Update failed: User ${userId} is not the author of post ${postId}`);
                return {
                    success: false,
                    error: 'You can only edit your own posts',
                };
            }
            // Update post
            await post.update(updateData);
            logger_1.default.info(`Post updated successfully: ${post.id}`);
            return {
                success: true,
                post,
                message: 'Post updated successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Post update error:', error);
            return {
                success: false,
                error: 'Post update failed due to server error',
            };
        }
    }
    static async deletePost(postId, userId) {
        try {
            logger_1.default.info(`Deleting post ${postId} by user ${userId}`);
            const post = await Post_1.default.findActivePostById(postId);
            if (!post) {
                logger_1.default.warn(`Delete failed: Post not found ${postId}`);
                return {
                    success: false,
                    error: 'Post not found',
                };
            }
            // Check if user is the author
            if (post.author_id !== userId) {
                logger_1.default.warn(`Delete failed: User ${userId} is not the author of post ${postId}`);
                return {
                    success: false,
                    error: 'You can only delete your own posts',
                };
            }
            // Soft delete the post
            await post.softDelete();
            logger_1.default.info(`Post deleted successfully: ${post.id}`);
            return {
                success: true,
                message: 'Post deleted successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Post deletion error:', error);
            return {
                success: false,
                error: 'Post deletion failed due to server error',
            };
        }
    }
    // Admin delete post (can delete any post)
    static async adminDeletePost(postId, adminId) {
        try {
            logger_1.default.info(`Admin deleting post ${postId} by admin ${adminId}`);
            const post = await Post_1.default.findActivePostById(postId);
            if (!post) {
                logger_1.default.warn(`Admin delete failed: Post not found ${postId}`);
                return {
                    success: false,
                    error: 'Post not found',
                };
            }
            // Include author information for logging
            await post.reload({
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username'],
                    },
                ],
            });
            // Soft delete the post
            await post.softDelete();
            logger_1.default.info(`Post deleted by admin: ${post.id} (author: ${post.author?.username || 'unknown'}) by admin: ${adminId}`);
            return {
                success: true,
                message: 'Post deleted successfully by admin',
                post,
            };
        }
        catch (error) {
            logger_1.default.error('Admin post deletion error:', error);
            return {
                success: false,
                error: 'Admin post deletion failed due to server error',
            };
        }
    }
    static async getPostList(page = 1, limit = 20, orderBy = 'created_at') {
        try {
            logger_1.default.info(`Fetching post list: page ${page}, limit ${limit}, order by ${orderBy}`);
            const offset = (page - 1) * limit;
            const posts = await Post_1.default.findActivePosts(limit, offset, orderBy);
            // Include author information for all posts
            const postsWithAuthors = await Promise.all(posts.map(async (post) => {
                await post.reload({
                    include: [
                        {
                            model: User_1.default,
                            as: 'author',
                            attributes: ['id', 'username', 'avatar_url'],
                        },
                    ],
                });
                return post;
            }));
            // Get total count for pagination
            const total = await Post_1.default.count({
                where: { is_deleted: false },
            });
            logger_1.default.info(`Post list fetched successfully: ${posts.length} posts`);
            return {
                success: true,
                posts: postsWithAuthors,
                total,
                message: 'Posts retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get post list error:', error);
            return {
                success: false,
                error: 'Failed to retrieve posts',
            };
        }
    }
    static async getUserPosts(userId, page = 1, limit = 20) {
        try {
            logger_1.default.info(`Fetching posts for user ${userId}: page ${page}, limit ${limit}`);
            const offset = (page - 1) * limit;
            const posts = await Post_1.default.findAll({
                where: {
                    author_id: userId,
                    is_deleted: false,
                },
                order: [['created_at', 'DESC']],
                limit,
                offset,
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                ],
            });
            // Get total count for pagination
            const total = await Post_1.default.count({
                where: {
                    author_id: userId,
                    is_deleted: false,
                },
            });
            logger_1.default.info(`User posts fetched successfully: ${posts.length} posts`);
            return {
                success: true,
                posts,
                total,
                message: 'User posts retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get user posts error:', error);
            return {
                success: false,
                error: 'Failed to retrieve user posts',
            };
        }
    }
    static async getHotPosts(limit = 20) {
        try {
            logger_1.default.info(`Fetching hot posts: limit ${limit}`);
            const posts = await Post_1.default.findHotPosts(limit);
            // Include author information for all posts
            const postsWithAuthors = await Promise.all(posts.map(async (post) => {
                await post.reload({
                    include: [
                        {
                            model: User_1.default,
                            as: 'author',
                            attributes: ['id', 'username', 'avatar_url'],
                        },
                    ],
                });
                return post;
            }));
            logger_1.default.info(`Hot posts fetched successfully: ${posts.length} posts`);
            return {
                success: true,
                posts: postsWithAuthors,
                message: 'Hot posts retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get hot posts error:', error);
            return {
                success: false,
                error: 'Failed to retrieve hot posts',
            };
        }
    }
    static async searchPosts(params) {
        try {
            const { query, authorId, page = 1, limit = 20, orderBy = 'created_at' } = params;
            logger_1.default.info(`Searching posts with query: "${query}", authorId: ${authorId}, page: ${page}, limit: ${limit}`);
            const offset = (page - 1) * limit;
            const whereConditions = { is_deleted: false };
            // Add search query conditions
            if (query && query.trim()) {
                const searchTerm = query.trim();
                whereConditions[sequelize_1.Op.or] = [
                    { title: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                    { content: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } }
                ];
            }
            // Add author filter
            if (authorId) {
                whereConditions.author_id = authorId;
            }
            // Build order clause
            let orderClause = [['created_at', 'DESC']];
            if (orderBy === 'updated_at') {
                orderClause = [['updated_at', 'DESC']];
            }
            else if (orderBy === 'hotness_score') {
                orderClause = [['hotness_score', 'DESC']];
            }
            else if (orderBy === 'like_count') {
                orderClause = [['like_count', 'DESC']];
            }
            else if (orderBy === 'view_count') {
                orderClause = [['view_count', 'DESC']];
            }
            // Search posts
            const posts = await Post_1.default.findAll({
                where: whereConditions,
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                ],
                order: orderClause,
                limit,
                offset,
            });
            // Get total count for pagination
            const total = await Post_1.default.count({
                where: whereConditions,
            });
            logger_1.default.info(`Posts search completed: ${posts.length} posts found, total: ${total}`);
            return {
                success: true,
                posts,
                total,
                message: 'Posts retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Search posts error:', error);
            return {
                success: false,
                error: 'Failed to search posts',
            };
        }
    }
    static async searchUsers(params) {
        try {
            const { query, page = 1, limit = 20 } = params;
            logger_1.default.info(`Searching users with query: "${query}", page: ${page}, limit: ${limit}`);
            if (!query || !query.trim()) {
                return {
                    success: false,
                    error: 'Search query is required',
                };
            }
            const offset = (page - 1) * limit;
            const searchTerm = query.trim();
            // Search users by username
            const users = await User_1.default.findAll({
                where: {
                    username: { [sequelize_1.Op.iLike]: `%${searchTerm}%` },
                    is_active: true,
                },
                attributes: ['id', 'username', 'avatar_url'],
                order: [['username', 'ASC']],
                limit,
                offset,
            });
            // Get post count for each user
            const usersWithPostCount = await Promise.all(users.map(async (user) => {
                const post_count = await Post_1.default.count({
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
            }));
            // Get total count for pagination
            const total = await User_1.default.count({
                where: {
                    username: { [sequelize_1.Op.iLike]: `%${searchTerm}%` },
                    is_active: true,
                },
            });
            logger_1.default.info(`Users search completed: ${users.length} users found, total: ${total}`);
            return {
                success: true,
                users: usersWithPostCount,
                total,
                message: 'Users retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Search users error:', error);
            return {
                success: false,
                error: 'Failed to search users',
            };
        }
    }
}
exports.PostService = PostService;
//# sourceMappingURL=postService.js.map