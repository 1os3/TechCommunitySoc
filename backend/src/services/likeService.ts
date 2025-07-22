import Like from '../models/Like';
import Post from '../models/Post';
import Comment from '../models/Comment';
import User from '../models/User';
import logger from '../utils/logger';
import HotnessUpdateService from './hotnessUpdateService';
import { NotificationService } from './notificationService';

export interface LikeResult {
  success: boolean;
  liked?: boolean;
  like?: Like;
  message?: string;
  error?: string;
}

export interface LikeStatusResult {
  success: boolean;
  likeStatus?: Map<string, boolean>;
  message?: string;
  error?: string;
}

export interface LikeCountResult {
  success: boolean;
  count?: number;
  message?: string;
  error?: string;
}

export interface LikeStatistics {
  totalLikes: number;
  postsLiked: number;
  commentsLiked: number;
  likesReceived: number;
  postLikesReceived: number;
  commentLikesReceived: number;
}

export interface UserLikeActivity {
  userId: number;
  username: string;
  totalLikes: number;
  recentLikes: number;
}

export class LikeService {
  static async togglePostLike(userId: number, postId: number): Promise<LikeResult> {
    try {
      logger.info(`Toggling post like: user ${userId}, post ${postId}`);

      // Verify user exists and is active
      const user = await User.findByPk(userId);
      if (!user) {
        logger.warn(`Like toggle failed: User not found ${userId}`);
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (!user.is_active) {
        logger.warn(`Like toggle failed: User account is deactivated ${userId}`);
        return {
          success: false,
          error: 'Account is deactivated',
        };
      }

      // Verify post exists and is not deleted
      const post = await Post.findActivePostById(postId);
      if (!post) {
        logger.warn(`Like toggle failed: Post not found ${postId}`);
        return {
          success: false,
          error: 'Post not found',
        };
      }

      // Toggle like
      const result = await Like.toggleLike(userId, 'post', postId);

      // Update post like count
      if (result.liked) {
        await post.incrementLikeCount();
        logger.info(`Post like added: user ${userId}, post ${postId}`);
        
        // Create like notification
        try {
          await NotificationService.createLikeNotification(
            userId,
            postId,
            user.username,
            post.title
          );
        } catch (notificationError) {
          logger.warn(`Failed to create like notification for post ${postId}:`, notificationError);
        }
      } else {
        await post.decrementLikeCount();
        logger.info(`Post like removed: user ${userId}, post ${postId}`);
      }

      // Trigger real-time hotness update
      try {
        const hotnessUpdateService = HotnessUpdateService.getInstance();
        await hotnessUpdateService.onPostLike(postId, userId, result.liked);
      } catch (hotnessError) {
        // Don't fail the like operation if hotness update fails
        logger.warn(`Failed to trigger hotness update for post ${postId}:`, hotnessError);
      }

      return {
        success: true,
        liked: result.liked,
        like: result.like,
        message: result.liked ? 'Post liked successfully' : 'Post like removed successfully',
      };
    } catch (error) {
      logger.error('Toggle post like error:', error);
      return {
        success: false,
        error: 'Like operation failed due to server error',
      };
    }
  }

  static async toggleCommentLike(userId: number, commentId: number): Promise<LikeResult> {
    try {
      logger.info(`Toggling comment like: user ${userId}, comment ${commentId}`);

      // Verify user exists and is active
      const user = await User.findByPk(userId);
      if (!user) {
        logger.warn(`Like toggle failed: User not found ${userId}`);
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (!user.is_active) {
        logger.warn(`Like toggle failed: User account is deactivated ${userId}`);
        return {
          success: false,
          error: 'Account is deactivated',
        };
      }

      // Verify comment exists and is not deleted
      const comment = await Comment.findOne({
        where: { id: commentId, is_deleted: false },
      });

      if (!comment) {
        logger.warn(`Like toggle failed: Comment not found ${commentId}`);
        return {
          success: false,
          error: 'Comment not found',
        };
      }

      // Toggle like
      const result = await Like.toggleLike(userId, 'comment', commentId);

      // Update comment like count
      if (result.liked) {
        await comment.increment('like_count');
        logger.info(`Comment like added: user ${userId}, comment ${commentId}`);
      } else {
        await comment.decrement('like_count');
        logger.info(`Comment like removed: user ${userId}, comment ${commentId}`);
      }

      return {
        success: true,
        liked: result.liked,
        like: result.like,
        message: result.liked ? 'Comment liked successfully' : 'Comment like removed successfully',
      };
    } catch (error) {
      logger.error('Toggle comment like error:', error);
      return {
        success: false,
        error: 'Like operation failed due to server error',
      };
    }
  }

  static async getPostLikeStatus(userId: number, postId: number): Promise<LikeResult> {
    try {
      logger.info(`Getting post like status: user ${userId}, post ${postId}`);

      // Verify post exists
      const post = await Post.findActivePostById(postId);
      if (!post) {
        logger.warn(`Get like status failed: Post not found ${postId}`);
        return {
          success: false,
          error: 'Post not found',
        };
      }

      const like = await Like.findByUserAndTarget(userId, 'post', postId);
      const liked = !!like;

      logger.info(`Post like status retrieved: user ${userId}, post ${postId}, liked: ${liked}`);

      return {
        success: true,
        liked,
        like: like || undefined,
        message: 'Like status retrieved successfully',
      };
    } catch (error) {
      logger.error('Get post like status error:', error);
      return {
        success: false,
        error: 'Failed to retrieve like status',
      };
    }
  }

  static async getCommentLikeStatus(userId: number, commentId: number): Promise<LikeResult> {
    try {
      logger.info(`Getting comment like status: user ${userId}, comment ${commentId}`);

      // Verify comment exists
      const comment = await Comment.findOne({
        where: { id: commentId, is_deleted: false },
      });

      if (!comment) {
        logger.warn(`Get like status failed: Comment not found ${commentId}`);
        return {
          success: false,
          error: 'Comment not found',
        };
      }

      const like = await Like.findByUserAndTarget(userId, 'comment', commentId);
      const liked = !!like;

      logger.info(`Comment like status retrieved: user ${userId}, comment ${commentId}, liked: ${liked}`);

      return {
        success: true,
        liked,
        like: like || undefined,
        message: 'Like status retrieved successfully',
      };
    } catch (error) {
      logger.error('Get comment like status error:', error);
      return {
        success: false,
        error: 'Failed to retrieve like status',
      };
    }
  }

  static async getBatchLikeStatus(
    userId: number,
    targets: Array<{ type: 'post' | 'comment'; id: number }>
  ): Promise<LikeStatusResult> {
    try {
      logger.info(`Getting batch like status for user ${userId}: ${targets.length} targets`);

      if (!targets || targets.length === 0) {
        return {
          success: true,
          likeStatus: new Map(),
          message: 'Batch like status retrieved successfully',
        };
      }

      const likeStatus = await Like.getUserLikeStatus(userId, targets);

      logger.info(`Batch like status retrieved: user ${userId}, ${likeStatus.size} statuses`);

      return {
        success: true,
        likeStatus,
        message: 'Batch like status retrieved successfully',
      };
    } catch (error) {
      logger.error('Get batch like status error:', error);
      return {
        success: false,
        error: 'Failed to retrieve batch like status',
      };
    }
  }

  static async getPostLikeCount(postId: number): Promise<LikeCountResult> {
    try {
      logger.info(`Getting post like count: post ${postId}`);

      // Verify post exists
      const post = await Post.findActivePostById(postId);
      if (!post) {
        logger.warn(`Get like count failed: Post not found ${postId}`);
        return {
          success: false,
          error: 'Post not found',
        };
      }

      const count = await Like.countByTarget('post', postId);

      logger.info(`Post like count retrieved: post ${postId}, count: ${count}`);

      return {
        success: true,
        count,
        message: 'Like count retrieved successfully',
      };
    } catch (error) {
      logger.error('Get post like count error:', error);
      return {
        success: false,
        error: 'Failed to retrieve like count',
      };
    }
  }

  static async getCommentLikeCount(commentId: number): Promise<LikeCountResult> {
    try {
      logger.info(`Getting comment like count: comment ${commentId}`);

      // Verify comment exists
      const comment = await Comment.findOne({
        where: { id: commentId, is_deleted: false },
      });

      if (!comment) {
        logger.warn(`Get like count failed: Comment not found ${commentId}`);
        return {
          success: false,
          error: 'Comment not found',
        };
      }

      const count = await Like.countByTarget('comment', commentId);

      logger.info(`Comment like count retrieved: comment ${commentId}, count: ${count}`);

      return {
        success: true,
        count,
        message: 'Like count retrieved successfully',
      };
    } catch (error) {
      logger.error('Get comment like count error:', error);
      return {
        success: false,
        error: 'Failed to retrieve like count',
      };
    }
  }

  static async getUserLikedPosts(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; posts?: any[]; total?: number; message?: string; error?: string }> {
    try {
      logger.info(`Getting user liked posts: user ${userId}, page ${page}, limit ${limit}`);

      const offset = (page - 1) * limit;

      // Get liked post IDs first
      const likes = await Like.findAll({
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
      const posts = await Post.findAll({
        where: {
          id: postIds,
          is_deleted: false,
        },
        include: [
          {
            model: User,
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
      const likedPostIds = await Like.findAll({
        where: {
          user_id: userId,
          target_type: 'post',
        },
        attributes: ['target_id'],
      });

      const activeLikedPosts = await Post.count({
        where: {
          id: likedPostIds.map(like => like.target_id),
          is_deleted: false,
        },
      });

      logger.info(`User liked posts retrieved: user ${userId}, ${posts.length} posts`);

      return {
        success: true,
        posts,
        total: activeLikedPosts,
        message: 'User liked posts retrieved successfully',
      };
    } catch (error) {
      logger.error('Get user liked posts error:', error);
      return {
        success: false,
        error: 'Failed to retrieve user liked posts',
      };
    }
  }

  static async getUserLikedComments(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; comments?: any[]; total?: number; message?: string; error?: string }> {
    try {
      logger.info(`Getting user liked comments: user ${userId}, page ${page}, limit ${limit}`);

      const offset = (page - 1) * limit;

      // Get liked comment IDs first
      const likes = await Like.findAll({
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
      const comments = await Comment.findAll({
        where: {
          id: commentIds,
          is_deleted: false,
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar_url'],
          },
          {
            model: Post,
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
      const likedCommentIds = await Like.findAll({
        where: {
          user_id: userId,
          target_type: 'comment',
        },
        attributes: ['target_id'],
      });

      const activeLikedComments = await Comment.count({
        where: {
          id: likedCommentIds.map(like => like.target_id),
          is_deleted: false,
        },
        include: [
          {
            model: Post,
            as: 'post',
            where: { is_deleted: false },
          },
        ],
      });

      logger.info(`User liked comments retrieved: user ${userId}, ${comments.length} comments`);

      return {
        success: true,
        comments,
        total: activeLikedComments,
        message: 'User liked comments retrieved successfully',
      };
    } catch (error) {
      logger.error('Get user liked comments error:', error);
      return {
        success: false,
        error: 'Failed to retrieve user liked comments',
      };
    }
  }

  static async getUserLikeStatistics(userId: number): Promise<{ success: boolean; statistics?: LikeStatistics; message?: string; error?: string }> {
    try {
      logger.info(`Getting user like statistics: user ${userId}`);

      // Get likes given by user
      const likesGiven = await Like.findAll({
        where: { user_id: userId },
        attributes: ['target_type'],
      });

      const postsLiked = likesGiven.filter(like => like.target_type === 'post').length;
      const commentsLiked = likesGiven.filter(like => like.target_type === 'comment').length;
      const totalLikes = likesGiven.length;

      // Get likes received by user's content
      const userPosts = await Post.findAll({
        where: { author_id: userId, is_deleted: false },
        attributes: ['like_count'],
      });

      const userComments = await Comment.findAll({
        where: { author_id: userId, is_deleted: false },
        attributes: ['like_count'],
      });

      const postLikesReceived = userPosts.reduce((sum, post) => sum + post.like_count, 0);
      const commentLikesReceived = userComments.reduce((sum, comment) => sum + comment.like_count, 0);
      const likesReceived = postLikesReceived + commentLikesReceived;

      const statistics: LikeStatistics = {
        totalLikes,
        postsLiked,
        commentsLiked,
        likesReceived,
        postLikesReceived,
        commentLikesReceived,
      };

      logger.info(`User like statistics retrieved: user ${userId}, given: ${totalLikes}, received: ${likesReceived}`);

      return {
        success: true,
        statistics,
        message: 'User like statistics retrieved successfully',
      };
    } catch (error) {
      logger.error('Get user like statistics error:', error);
      return {
        success: false,
        error: 'Failed to retrieve user like statistics',
      };
    }
  }

  static async getTopLikedContent(
    type: 'post' | 'comment',
    limit: number = 10,
    timeframe?: { start: Date; end: Date }
  ): Promise<{ success: boolean; content?: any[]; message?: string; error?: string }> {
    try {
      logger.info(`Getting top liked ${type}s: limit ${limit}, timeframe: ${timeframe ? 'yes' : 'no'}`);

      let whereClause: any = { is_deleted: false };
      
      if (timeframe) {
        whereClause.created_at = {
          [require('sequelize').Op.between]: [timeframe.start, timeframe.end],
        };
      }

      if (type === 'post') {
        const posts = await Post.findAll({
          where: whereClause,
          include: [
            {
              model: User,
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
      } else {
        const comments = await Comment.findAll({
          where: whereClause,
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'avatar_url'],
            },
            {
              model: Post,
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
    } catch (error) {
      logger.error(`Get top liked ${type}s error:`, error);
      return {
        success: false,
        error: `Failed to retrieve top liked ${type}s`,
      };
    }
  }

  static async getMostActiveUsers(
    limit: number = 10,
    days: number = 30
  ): Promise<{ success: boolean; users?: UserLikeActivity[]; message?: string; error?: string }> {
    try {
      logger.info(`Getting most active users: limit ${limit}, days ${days}`);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get recent like activity
      const recentLikes = await Like.findAll({
        where: {
          created_at: {
            [require('sequelize').Op.gte]: startDate,
          },
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username'],
          },
        ],
      });

      // Get total likes for each user
      const totalLikes = await Like.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username'],
          },
        ],
      });

      // Aggregate data by user
      const userActivity = new Map<number, UserLikeActivity>();

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
        
        userActivity.get(userId)!.totalLikes++;
      });

      // Count recent likes
      recentLikes.forEach(like => {
        const userId = like.user_id;
        if (userActivity.has(userId)) {
          userActivity.get(userId)!.recentLikes++;
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

      logger.info(`Most active users retrieved: ${sortedUsers.length} users`);

      return {
        success: true,
        users: sortedUsers,
        message: 'Most active users retrieved successfully',
      };
    } catch (error) {
      logger.error('Get most active users error:', error);
      return {
        success: false,
        error: 'Failed to retrieve most active users',
      };
    }
  }

  static async getLikeActivityMetrics(
    days: number = 7
  ): Promise<{ success: boolean; metrics?: any; message?: string; error?: string }> {
    try {
      logger.info(`Getting like activity metrics for last ${days} days`);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily like counts
      const likes = await Like.findAll({
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
      const dailyMetrics = new Map<string, { date: string; postLikes: number; commentLikes: number; total: number }>();

      likes.forEach((like: any) => {
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

        const metrics = dailyMetrics.get(date)!;
        if (targetType === 'post') {
          metrics.postLikes = count;
        } else {
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
        
        metricsArray.push(
          dailyMetrics.get(dateStr) || {
            date: dateStr,
            postLikes: 0,
            commentLikes: 0,
            total: 0,
          }
        );
      }

      // Calculate summary statistics
      const totalLikes = metricsArray.reduce((sum, day) => sum + day.total, 0);
      const averageLikesPerDay = totalLikes / days;
      const peakDay = metricsArray.reduce((peak, day) => 
        day.total > peak.total ? day : peak, metricsArray[0]
      );

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

      logger.info(`Like activity metrics retrieved: ${totalLikes} total likes in ${days} days`);

      return {
        success: true,
        metrics,
        message: 'Like activity metrics retrieved successfully',
      };
    } catch (error) {
      logger.error('Get like activity metrics error:', error);
      return {
        success: false,
        error: 'Failed to retrieve like activity metrics',
      };
    }
  }
}