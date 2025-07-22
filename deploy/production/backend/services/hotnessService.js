"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotnessService = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const User_1 = __importDefault(require("../models/User"));
const sequelize_1 = require("sequelize");
class HotnessService {
    /**
     * 计算单个帖子的热度分数
     */
    static async calculatePostHotness(postId, config = {}) {
        try {
            const post = await Post_1.default.findByPk(postId);
            if (!post) {
                return {
                    success: false,
                    message: 'Post not found'
                };
            }
            if (post.is_deleted) {
                return {
                    success: false,
                    message: 'Cannot calculate hotness for deleted post'
                };
            }
            const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
            const previousScore = post.hotness_score;
            // 计算时间因子
            const ageInHours = (Date.now() - post.created_at.getTime()) / (1000 * 60 * 60);
            const timeFactor = Math.pow(ageInHours + finalConfig.baseHours, finalConfig.gravity);
            // 计算参与度分数
            const engagementScore = (post.like_count * finalConfig.likeWeight +
                post.comment_count * finalConfig.commentWeight +
                post.view_count * finalConfig.viewWeight);
            // 计算最终热度分数
            const hotnessScore = engagementScore / timeFactor;
            // 更新帖子热度分数
            await post.update({ hotness_score: hotnessScore });
            const result = {
                postId: postId,
                score: hotnessScore,
                previousScore: previousScore,
                factors: {
                    likes: post.like_count,
                    comments: post.comment_count,
                    views: post.view_count,
                    age: ageInHours,
                    engagement: engagementScore
                }
            };
            return {
                success: true,
                result: result
            };
        }
        catch (error) {
            console.error('Error calculating post hotness:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 批量更新多个帖子的热度分数
     */
    static async batchUpdateHotness(postIds, config = {}) {
        try {
            if (postIds.length === 0) {
                return {
                    success: true,
                    results: [],
                    failed: []
                };
            }
            const results = [];
            const failed = [];
            // 并行处理多个帖子
            const promises = postIds.map(async (postId) => {
                const result = await this.calculatePostHotness(postId, config);
                if (result.success && result.result) {
                    results.push(result.result);
                }
                else {
                    failed.push(postId);
                }
            });
            await Promise.all(promises);
            return {
                success: true,
                results: results,
                failed: failed
            };
        }
        catch (error) {
            console.error('Error in batch hotness update:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 更新所有活跃帖子的热度分数
     */
    static async updateAllActivePostsHotness(config = {}) {
        try {
            // 获取所有未删除的帖子ID
            const posts = await Post_1.default.findAll({
                where: { is_deleted: false },
                attributes: ['id'],
                order: [['created_at', 'DESC']]
            });
            const postIds = posts.map(post => post.id);
            if (postIds.length === 0) {
                return {
                    success: true,
                    updated: 0,
                    failed: 0,
                    message: 'No active posts found'
                };
            }
            const result = await this.batchUpdateHotness(postIds, config);
            if (!result.success) {
                return {
                    success: false,
                    updated: 0,
                    failed: 0,
                    error: result.error
                };
            }
            return {
                success: true,
                updated: result.results?.length || 0,
                failed: result.failed?.length || 0,
                message: result.message
            };
        }
        catch (error) {
            console.error('Error updating all posts hotness:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 获取热门帖子列表
     */
    static async getHotPosts(limit = 20, minScore = 0) {
        try {
            // 验证参数
            if (limit <= 0 || limit > 100) {
                return {
                    success: false,
                    message: 'Limit must be between 1 and 100'
                };
            }
            if (minScore < 0) {
                return {
                    success: false,
                    message: 'Minimum score cannot be negative'
                };
            }
            const posts = await Post_1.default.findAll({
                where: {
                    is_deleted: false,
                    hotness_score: { [sequelize_1.Op.gte]: minScore }
                },
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username']
                    }
                ],
                order: [['hotness_score', 'DESC']],
                limit: limit,
                attributes: [
                    'id', 'title', 'content', 'author_id',
                    'view_count', 'like_count', 'comment_count',
                    'hotness_score', 'created_at', 'updated_at'
                ]
            });
            return {
                success: true,
                posts: posts
            };
        }
        catch (error) {
            console.error('Error getting hot posts:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 基于时间范围获取热门帖子
     */
    static async getHotPostsByTimeRange(hours = 24, limit = 20) {
        try {
            // 验证参数
            if (hours <= 0 || hours > 8760) { // 最多一年
                return {
                    success: false,
                    message: 'Hours must be between 1 and 8760 (1 year)'
                };
            }
            if (limit <= 0 || limit > 100) {
                return {
                    success: false,
                    message: 'Limit must be between 1 and 100'
                };
            }
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
            const posts = await Post_1.default.findAll({
                where: {
                    is_deleted: false,
                    created_at: {
                        [sequelize_1.Op.gte]: startTime,
                        [sequelize_1.Op.lte]: endTime
                    }
                },
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username']
                    }
                ],
                order: [['hotness_score', 'DESC']],
                limit: limit,
                attributes: [
                    'id', 'title', 'content', 'author_id',
                    'view_count', 'like_count', 'comment_count',
                    'hotness_score', 'created_at', 'updated_at'
                ]
            });
            return {
                success: true,
                posts: posts,
                timeframe: {
                    start: startTime,
                    end: endTime
                }
            };
        }
        catch (error) {
            console.error('Error getting hot posts by time range:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 获取热度算法配置信息
     */
    static getDefaultConfig() {
        return { ...this.DEFAULT_CONFIG };
    }
    /**
     * 验证热度配置
     */
    static validateConfig(config) {
        const errors = [];
        if (config.likeWeight !== undefined) {
            if (config.likeWeight < 0 || config.likeWeight > 100) {
                errors.push('Like weight must be between 0 and 100');
            }
        }
        if (config.commentWeight !== undefined) {
            if (config.commentWeight < 0 || config.commentWeight > 100) {
                errors.push('Comment weight must be between 0 and 100');
            }
        }
        if (config.viewWeight !== undefined) {
            if (config.viewWeight < 0 || config.viewWeight > 10) {
                errors.push('View weight must be between 0 and 10');
            }
        }
        if (config.gravity !== undefined) {
            if (config.gravity < 0.1 || config.gravity > 5.0) {
                errors.push('Gravity must be between 0.1 and 5.0');
            }
        }
        if (config.baseHours !== undefined) {
            if (config.baseHours < 0.1 || config.baseHours > 48) {
                errors.push('Base hours must be between 0.1 and 48');
            }
        }
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    /**
     * 计算热度趋势（对比历史数据）
     */
    static async calculateHotnessTrend(postId, config = {}) {
        try {
            const post = await Post_1.default.findByPk(postId);
            if (!post) {
                return {
                    success: false,
                    message: 'Post not found'
                };
            }
            const previousScore = post.hotness_score;
            const result = await this.calculatePostHotness(postId, config);
            if (!result.success || !result.result) {
                return {
                    success: false,
                    message: 'Failed to calculate new hotness score'
                };
            }
            const currentScore = result.result.score;
            const change = currentScore - previousScore;
            const percentage = previousScore > 0 ? (change / previousScore) * 100 : 0;
            return {
                success: true,
                trend: {
                    current: currentScore,
                    change: change,
                    percentage: percentage
                }
            };
        }
        catch (error) {
            console.error('Error calculating hotness trend:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
exports.HotnessService = HotnessService;
HotnessService.DEFAULT_CONFIG = {
    likeWeight: 2.0, // 点赞权重
    commentWeight: 3.0, // 评论权重
    viewWeight: 0.1, // 浏览权重
    gravity: 1.8, // 时间衰减系数
    baseHours: 2, // 基础时间（小时）
};
exports.default = HotnessService;
//# sourceMappingURL=hotnessService.js.map