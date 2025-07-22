"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeService = void 0;
const Like_1 = __importDefault(require("../models/Like"));
const Post_1 = __importDefault(require("../models/Post"));
const Comment_1 = __importDefault(require("../models/Comment"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
const hotnessUpdateService_1 = __importDefault(require("./hotnessUpdateService"));
const notificationService_1 = require("./notificationService");
class LikeService {
    static async togglePostLike(userId, postId) {
        try {
            logger_1.default.info(`Toggling post like: user ${userId}, post ${postId}`);
            // Verify user exists and is active
            const user = await User_1.default.findByPk(userId);
            if (!user) {
                logger_1.default.warn(`Like toggle failed: User not found ${userId}`);
                return {
                    success: false,
                    error: 'User not found',
                };
            }
            if (!user.is_active) {
                logger_1.default.warn(`Like toggle failed: User account is deactivated ${userId}`);
                return {
                    success: false,
                    error: 'Account is deactivated',
                };
            }
            // Verify post exists and is not deleted
            const post = await Post_1.default.findActivePostById(postId);
            if (!post) {
                logger_1.default.warn(`Like toggle failed: Post not found ${postId}`);
                return {
                    success: false,
                    error: 'Post not found',
                };
            }
            // Toggle like
            const result = await Like_1.default.toggleLike(userId, 'post', postId);
            // Update post like count
            if (result.liked) {
                await post.incrementLikeCount();
                logger_1.default.info(`Post like added: user ${userId}, post ${postId}`);
                // Create like notification
                try {
                    await notificationService_1.NotificationService.createLikeNotification(userId, postId, user.username, post.title);
                }
                catch (notificationError) {
                    logger_1.default.warn(`Failed to create like notification for post ${postId}:`, notificationError);
                }
            }
            else {
                await post.decrementLikeCount();
                logger_1.default.info(`Post like removed: user ${userId}, post ${postId}`);
            }
            // Trigger real-time hotness update
            try {
                const hotnessUpdateService = hotnessUpdateService_1.default.getInstance();
                await hotnessUpdateService.onPostLike(postId, userId, result.liked);
            }
            catch (hotnessError) {
                // Don't fail the like operation if hotness update fails
                logger_1.default.warn(`Failed to trigger hotness update for post ${postId}:`, hotnessError);
            }
            return {
                success: true,
                liked: result.liked,
                like: result.like,
                message: result.liked ? 'Post liked successfully' : 'Post like removed successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Toggle post like error:', error);
            return {
                success: false,
                error: 'Like operation failed due to server error',
            };
        }
    }
    static async toggleCommentLike(userId, commentId) {
        try {
            logger_1.default.info(`Toggling comment like: user ${userId}, comment ${commentId}`);
            // Verify user exists and is active
            const user = await User_1.default.findByPk(userId);
            if (!user) {
                logger_1.default.warn(`Like toggle failed: User not found ${userId}`);
                return {
                    success: false,
                    error: 'User not found',
                };
            }
            if (!user.is_active) {
                logger_1.default.warn(`Like toggle failed: User account is deactivated ${userId}`);
                return {
                    success: false,
                    error: 'Account is deactivated',
                };
            }
            // Verify comment exists and is not deleted
            const comment = await Comment_1.default.findOne({
                where: { id: commentId, is_deleted: false },
            });
            if (!comment) {
                logger_1.default.warn(`Like toggle failed: Comment not found ${commentId}`);
                return {
                    success: false,
                    error: 'Comment not found',
                };
            }
            // Toggle like
            const result = await Like_1.default.toggleLike(userId, 'comment', commentId);
            // Update comment like count
            if (result.liked) {
                await comment.increment('like_count');
                logger_1.default.info(`Comment like added: user ${userId}, comment ${commentId}`);
            }
            else {
                await comment.decrement('like_count');
                logger_1.default.info(`Comment like removed: user ${userId}, comment ${commentId}`);
            }
            return {
                success: true,
                liked: result.liked,
                like: result.like,
                message: result.liked ? 'Comment liked successfully' : 'Comment like removed successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Toggle comment like error:', error);
            return {
                success: false,
                error: 'Like operation failed due to server error',
            };
        }
    }
    static async getPostLikeStatus(userId, postId) {
        try {
            logger_1.default.info(`Getting post like status: user ${userId}, post ${postId}`);
            // Verify post exists
            const post = await Post_1.default.findActivePostById(postId);
            if (!post) {
                logger_1.default.warn(`Get like status failed: Post not found ${postId}`);
                return {
                    success: false,
                    error: 'Post not found',
                };
            }
            const like = await Like_1.default.findByUserAndTarget(userId, 'post', postId);
            const liked = !!like;
            logger_1.default.info(`Post like status retrieved: user ${userId}, post ${postId}, liked: ${liked}`);
            return {
                success: true,
                liked,
                like: like || undefined,
                message: 'Like status retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get post like status error:', error);
            return {
                success: false,
                error: 'Failed to retrieve like status',
            };
        }
    }
    static async getCommentLikeStatus(userId, commentId) {
        try {
            logger_1.default.info(`Getting comment like status: user ${userId}, comment ${commentId}`);
            // Verify comment exists
            const comment = await Comment_1.default.findOne({
                where: { id: commentId, is_deleted: false },
            });
            if (!comment) {
                logger_1.default.warn(`Get like status failed: Comment not found ${commentId}`);
                return {
                    success: false,
                    error: 'Comment not found',
                };
            }
            const like = await Like_1.default.findByUserAndTarget(userId, 'comment', commentId);
            const liked = !!like;
            logger_1.default.info(`Comment like status retrieved: user ${userId}, comment ${commentId}, liked: ${liked}`);
            return {
                success: true,
                liked,
                like: like || undefined,
                message: 'Like status retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get comment like status error:', error);
            return {
                success: false,
                error: 'Failed to retrieve like status',
            };
        }
    }
    static async getBatchLikeStatus(userId, targets) {
        try {
            logger_1.default.info(`Getting batch like status for user ${userId}: ${targets.length} targets`);
            if (!targets || targets.length === 0) {
                return {
                    success: true,
                    likeStatus: new Map(),
                    message: 'Batch like status retrieved successfully',
                };
            }
            const likeStatus = await Like_1.default.getUserLikeStatus(userId, targets);
            logger_1.default.info(`Batch like status retrieved: user ${userId}, ${likeStatus.size} statuses`);
            return {
                success: true,
                likeStatus,
                message: 'Batch like status retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get batch like status error:', error);
            return {
                success: false,
                error: 'Failed to retrieve batch like status',
            };
        }
    }
    static async getPostLikeCount(postId) {
        try {
            logger_1.default.info(`Getting post like count: post ${postId}`);
            // Verify post exists
            const post = await Post_1.default.findActivePostById(postId);
            if (!post) {
                logger_1.default.warn(`Get like count failed: Post not found ${postId}`);
                return {
                    success: false,
                    error: 'Post not found',
                };
            }
            const count = await Like_1.default.countByTarget('post', postId);
            logger_1.default.info(`Post like count retrieved: post ${postId}, count: ${count}`);
            return {
                success: true,
                count,
                message: 'Like count retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get post like count error:', error);
            return {
                success: false,
                error: 'Failed to retrieve like count',
            };
        }
    }
    static async getCommentLikeCount(commentId) {
        try {
            logger_1.default.info(`Getting comment like count: comment ${commentId}`);
            // Verify comment exists
            const comment = await Comment_1.default.findOne({
                where: { id: commentId, is_deleted: false },
            });
            if (!comment) {
                logger_1.default.warn(`Get like count failed: Comment not found ${commentId}`);
                return {
                    success: false,
                    error: 'Comment not found',
                };
            }
            const count = await Like_1.default.countByTarget('comment', commentId);
            logger_1.default.info(`Comment like count retrieved: comment ${commentId}, count: ${count}`);
            return {
                success: true,
                count,
                message: 'Like count retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get comment like count error:', error);
            return {
                success: false,
                error: 'Failed to retrieve like count',
            };
        }
    }
    static async getUserLikedPosts(userId, page = 1, limit = 20) {
        try {
            logger_1.default.info(`Getting user liked posts: user ${userId}, page ${page}, limit ${limit}`);
            const offset = (page - 1) * limit;
            // Get liked post IDs first
            const likes = await Like_1.default.findAll({
                where: {
                    user_id: userId,
                    target_type: 'post',
                },
                attributes: ['target_id', 'created_at'],
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });
            if (likes.length === 0) {
                return {
                    success: true,
                    posts: [],
                    total: 0,
                    message: 'User liked posts retrieved successfully',
                };
            }
            const postIds = likes.map(like => like.target_id);
            // Get posts with these IDs
            const posts = await Post_1.default.findAll({
                where: {
                    id: postIds,
                    is_deleted: false,
                },
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                ],
            });
            // Sort posts by like creation time
            const likeTimeMap = new Map(likes.map(like => [like.target_id, like.created_at]));
            posts.sort((a, b) => {
                const timeA = likeTimeMap.get(a.id)?.getTime() || 0;
                const timeB = likeTimeMap.get(b.id)?.getTime() || 0;
                return timeB - timeA; // DESC order
            });
            // Get total count for pagination
            const likedPostIds = await Like_1.default.findAll({
                where: {
                    user_id: userId,
                    target_type: 'post',
                },
                attributes: ['target_id'],
            });
            const activeLikedPosts = await Post_1.default.count({
                where: {
                    id: likedPostIds.map(like => like.target_id),
                    is_deleted: false,
                },
            });
            logger_1.default.info(`User liked posts retrieved: user ${userId}, ${posts.length} posts`);
            return {
                success: true,
                posts,
                total: activeLikedPosts,
                message: 'User liked posts retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get user liked posts error:', error);
            return {
                success: false,
                error: 'Failed to retrieve user liked posts',
            };
        }
    }
    static async getUserLikedComments(userId, page = 1, limit = 20) {
        try {
            logger_1.default.info(`Getting user liked comments: user ${userId}, page ${page}, limit ${limit}`);
            const offset = (page - 1) * limit;
            // Get liked comment IDs first
            const likes = await Like_1.default.findAll({
                where: {
                    user_id: userId,
                    target_type: 'comment',
                },
                attributes: ['target_id', 'created_at'],
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });
            if (likes.length === 0) {
                return {
                    success: true,
                    comments: [],
                    total: 0,
                    message: 'User liked comments retrieved successfully',
                };
            }
            const commentIds = likes.map(like => like.target_id);
            // Get comments with these IDs
            const comments = await Comment_1.default.findAll({
                where: {
                    id: commentIds,
                    is_deleted: false,
                },
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                    {
                        model: Post_1.default,
                        as: 'post',
                        attributes: ['id', 'title'],
                        where: { is_deleted: false },
                    },
                ],
            });
            // Sort comments by like creation time
            const likeTimeMap = new Map(likes.map(like => [like.target_id, like.created_at]));
            comments.sort((a, b) => {
                const timeA = likeTimeMap.get(a.id)?.getTime() || 0;
                const timeB = likeTimeMap.get(b.id)?.getTime() || 0;
                return timeB - timeA; // DESC order
            });
            // Get total count for pagination
            const likedCommentIds = await Like_1.default.findAll({
                where: {
                    user_id: userId,
                    target_type: 'comment',
                },
                attributes: ['target_id'],
            });
            const activeLikedComments = await Comment_1.default.count({
                where: {
                    id: likedCommentIds.map(like => like.target_id),
                    is_deleted: false,
                },
                include: [
                    {
                        model: Post_1.default,
                        as: 'post',
                        where: { is_deleted: false },
                    },
                ],
            });
            logger_1.default.info(`User liked comments retrieved: user ${userId}, ${comments.length} comments`);
            return {
                success: true,
                comments,
                total: activeLikedComments,
                message: 'User liked comments retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get user liked comments error:', error);
            return {
                success: false,
                error: 'Failed to retrieve user liked comments',
            };
        }
    }
    static async getUserLikeStatistics(userId) {
        try {
            logger_1.default.info(`Getting user like statistics: user ${userId}`);
            // Get likes given by user
            const likesGiven = await Like_1.default.findAll({
                where: { user_id: userId },
                attributes: ['target_type'],
            });
            const postsLiked = likesGiven.filter(like => like.target_type === 'post').length;
            const commentsLiked = likesGiven.filter(like => like.target_type === 'comment').length;
            const totalLikes = likesGiven.length;
            // Get likes received by user's content
            const userPosts = await Post_1.default.findAll({
                where: { author_id: userId, is_deleted: false },
                attributes: ['like_count'],
            });
            const userComments = await Comment_1.default.findAll({
                where: { author_id: userId, is_deleted: false },
                attributes: ['like_count'],
            });
            const postLikesReceived = userPosts.reduce((sum, post) => sum + post.like_count, 0);
            const commentLikesReceived = userComments.reduce((sum, comment) => sum + comment.like_count, 0);
            const likesReceived = postLikesReceived + commentLikesReceived;
            const statistics = {
                totalLikes,
                postsLiked,
                commentsLiked,
                likesReceived,
                postLikesReceived,
                commentLikesReceived,
            };
            logger_1.default.info(`User like statistics retrieved: user ${userId}, given: ${totalLikes}, received: ${likesReceived}`);
            return {
                success: true,
                statistics,
                message: 'User like statistics retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get user like statistics error:', error);
            return {
                success: false,
                error: 'Failed to retrieve user like statistics',
            };
        }
    }
    static async getTopLikedContent(type, limit = 10, timeframe) {
        try {
            logger_1.default.info(`Getting top liked ${type}s: limit ${limit}, timeframe: ${timeframe ? 'yes' : 'no'}`);
            let whereClause = { is_deleted: false };
            if (timeframe) {
                whereClause.created_at = {
                    [require('sequelize').Op.between]: [timeframe.start, timeframe.end],
                };
            }
            if (type === 'post') {
                const posts = await Post_1.default.findAll({
                    where: whereClause,
                    include: [
                        {
                            model: User_1.default,
                            as: 'author',
                            attributes: ['id', 'username', 'avatar_url'],
                        },
                    ],
                    order: [['like_count', 'DESC']],
                    limit,
                });
                return {
                    success: true,
                    content: posts,
                    message: `Top liked posts retrieved successfully`,
                };
            }
            else {
                const comments = await Comment_1.default.findAll({
                    where: whereClause,
                    include: [
                        {
                            model: User_1.default,
                            as: 'author',
                            attributes: ['id', 'username', 'avatar_url'],
                        },
                        {
                            model: Post_1.default,
                            as: 'post',
                            attributes: ['id', 'title'],
                            where: { is_deleted: false },
                        },
                    ],
                    order: [['like_count', 'DESC']],
                    limit,
                });
                return {
                    success: true,
                    content: comments,
                    message: `Top liked comments retrieved successfully`,
                };
            }
        }
        catch (error) {
            logger_1.default.error(`Get top liked ${type}s error:`, error);
            return {
                success: false,
                error: `Failed to retrieve top liked ${type}s`,
            };
        }
    }
    static async getMostActiveUsers(limit = 10, days = 30) {
        try {
            logger_1.default.info(`Getting most active users: limit ${limit}, days ${days}`);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            // Get recent like activity
            const recentLikes = await Like_1.default.findAll({
                where: {
                    created_at: {
                        [require('sequelize').Op.gte]: startDate,
                    },
                },
                include: [
                    {
                        model: User_1.default,
                        as: 'user',
                        attributes: ['id', 'username'],
                    },
                ],
            });
            // Get total likes for each user
            const totalLikes = await Like_1.default.findAll({
                include: [
                    {
                        model: User_1.default,
                        as: 'user',
                        attributes: ['id', 'username'],
                    },
                ],
            });
            // Aggregate data by user
            const userActivity = new Map();
            // Count total likes
            totalLikes.forEach(like => {
                const userId = like.user_id;
                const username = like.user?.username || 'Unknown';
                if (!userActivity.has(userId)) {
                    userActivity.set(userId, {
                        userId,
                        username,
                        totalLikes: 0,
                        recentLikes: 0,
                    });
                }
                userActivity.get(userId).totalLikes++;
            });
            // Count recent likes
            recentLikes.forEach(like => {
                const userId = like.user_id;
                if (userActivity.has(userId)) {
                    userActivity.get(userId).recentLikes++;
                }
            });
            // Sort by recent activity, then by total activity
            const sortedUsers = Array.from(userActivity.values())
                .sort((a, b) => {
                if (b.recentLikes !== a.recentLikes) {
                    return b.recentLikes - a.recentLikes;
                }
                return b.totalLikes - a.totalLikes;
            })
                .slice(0, limit);
            logger_1.default.info(`Most active users retrieved: ${sortedUsers.length} users`);
            return {
                success: true,
                users: sortedUsers,
                message: 'Most active users retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get most active users error:', error);
            return {
                success: false,
                error: 'Failed to retrieve most active users',
            };
        }
    }
    static async getLikeActivityMetrics(days = 7) {
        try {
            logger_1.default.info(`Getting like activity metrics for last ${days} days`);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            // Get daily like counts
            const likes = await Like_1.default.findAll({
                where: {
                    created_at: {
                        [require('sequelize').Op.gte]: startDate,
                    },
                },
                attributes: [
                    [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
                    [require('sequelize').fn('COUNT', '*'), 'count'],
                    'target_type',
                ],
                group: [
                    require('sequelize').fn('DATE', require('sequelize').col('created_at')),
                    'target_type',
                ],
                order: [[require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'ASC']],
            });
            // Process daily metrics
            const dailyMetrics = new Map();
            likes.forEach((like) => {
                const date = like.getDataValue('date');
                const count = parseInt(like.getDataValue('count'));
                const targetType = like.target_type;
                if (!dailyMetrics.has(date)) {
                    dailyMetrics.set(date, {
                        date,
                        postLikes: 0,
                        commentLikes: 0,
                        total: 0,
                    });
                }
                const metrics = dailyMetrics.get(date);
                if (targetType === 'post') {
                    metrics.postLikes = count;
                }
                else {
                    metrics.commentLikes = count;
                }
                metrics.total += count;
            });
            // Fill missing days with zero values
            const metricsArray = [];
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                metricsArray.push(dailyMetrics.get(dateStr) || {
                    date: dateStr,
                    postLikes: 0,
                    commentLikes: 0,
                    total: 0,
                });
            }
            // Calculate summary statistics
            const totalLikes = metricsArray.reduce((sum, day) => sum + day.total, 0);
            const averageLikesPerDay = totalLikes / days;
            const peakDay = metricsArray.reduce((peak, day) => day.total > peak.total ? day : peak, metricsArray[0]);
            const metrics = {
                dailyActivity: metricsArray,
                summary: {
                    totalLikes,
                    averageLikesPerDay: Math.round(averageLikesPerDay * 100) / 100,
                    peakDay: {
                        date: peakDay.date,
                        likes: peakDay.total,
                    },
                    totalPostLikes: metricsArray.reduce((sum, day) => sum + day.postLikes, 0),
                    totalCommentLikes: metricsArray.reduce((sum, day) => sum + day.commentLikes, 0),
                },
            };
            logger_1.default.info(`Like activity metrics retrieved: ${totalLikes} total likes in ${days} days`);
            return {
                success: true,
                metrics,
                message: 'Like activity metrics retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get like activity metrics error:', error);
            return {
                success: false,
                error: 'Failed to retrieve like activity metrics',
            };
        }
    }
}
exports.LikeService = LikeService;
//# sourceMappingURL=likeService.js.map