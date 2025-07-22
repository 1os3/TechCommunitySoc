"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotnessController = void 0;
const hotnessService_1 = __importDefault(require("../services/hotnessService"));
class HotnessController {
    /**
     * 计算单个帖子的热度分数
     */
    static async calculatePostHotness(req, res) {
        try {
            const postId = parseInt(req.params.id);
            // 验证帖子ID
            if (isNaN(postId) || postId <= 0) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_POST_ID',
                        message: 'Post ID must be a positive integer'
                    }
                });
                return;
            }
            // 获取可选的配置参数
            const config = {};
            if (req.body.likeWeight !== undefined)
                config.likeWeight = parseFloat(req.body.likeWeight);
            if (req.body.commentWeight !== undefined)
                config.commentWeight = parseFloat(req.body.commentWeight);
            if (req.body.viewWeight !== undefined)
                config.viewWeight = parseFloat(req.body.viewWeight);
            if (req.body.gravity !== undefined)
                config.gravity = parseFloat(req.body.gravity);
            if (req.body.baseHours !== undefined)
                config.baseHours = parseFloat(req.body.baseHours);
            // 验证配置
            const validation = hotnessService_1.default.validateConfig(config);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_CONFIG',
                        message: 'Invalid hotness configuration',
                        details: validation.errors
                    }
                });
                return;
            }
            const result = await hotnessService_1.default.calculatePostHotness(postId, config);
            if (!result.success) {
                if (result.message === 'Post not found') {
                    res.status(404).json({
                        success: false,
                        error: {
                            code: 'POST_NOT_FOUND',
                            message: 'Post not found'
                        }
                    });
                    return;
                }
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'CALCULATION_FAILED',
                        message: result.message || result.error || 'Failed to calculate hotness'
                    }
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    result: result.result
                }
            });
        }
        catch (error) {
            console.error('Error in calculatePostHotness:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred'
                }
            });
        }
    }
    /**
     * 批量更新帖子热度分数
     */
    static async batchUpdateHotness(req, res) {
        try {
            const { postIds, config = {} } = req.body;
            // 验证帖子ID数组
            if (!Array.isArray(postIds)) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_POST_IDS',
                        message: 'Post IDs must be an array'
                    }
                });
                return;
            }
            if (postIds.length > 100) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'TOO_MANY_POSTS',
                        message: 'Cannot update more than 100 posts at once'
                    }
                });
                return;
            }
            // 验证每个帖子ID
            const validPostIds = [];
            for (const id of postIds) {
                const postId = parseInt(id);
                if (isNaN(postId) || postId <= 0) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_POST_ID',
                            message: `Invalid post ID: ${id}`
                        }
                    });
                    return;
                }
                validPostIds.push(postId);
            }
            // 验证配置
            const validation = hotnessService_1.default.validateConfig(config);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_CONFIG',
                        message: 'Invalid hotness configuration',
                        details: validation.errors
                    }
                });
                return;
            }
            const result = await hotnessService_1.default.batchUpdateHotness(validPostIds, config);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'BATCH_UPDATE_FAILED',
                        message: result.error || 'Failed to update hotness scores'
                    }
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    updated: result.results?.length || 0,
                    failed: result.failed?.length || 0,
                    results: result.results,
                    failedIds: result.failed
                }
            });
        }
        catch (error) {
            console.error('Error in batchUpdateHotness:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred'
                }
            });
        }
    }
    /**
     * 更新所有活跃帖子的热度分数
     */
    static async updateAllPostsHotness(req, res) {
        try {
            const config = req.body.config || {};
            // 验证配置
            const validation = hotnessService_1.default.validateConfig(config);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_CONFIG',
                        message: 'Invalid hotness configuration',
                        details: validation.errors
                    }
                });
                return;
            }
            const result = await hotnessService_1.default.updateAllActivePostsHotness(config);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'UPDATE_ALL_FAILED',
                        message: result.error || 'Failed to update all posts hotness'
                    }
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    updated: result.updated,
                    failed: result.failed,
                    message: result.message
                }
            });
        }
        catch (error) {
            console.error('Error in updateAllPostsHotness:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred'
                }
            });
        }
    }
    /**
     * 获取热门帖子列表
     */
    static async getHotPosts(req, res) {
        try {
            const limitParam = req.query.limit;
            const minScoreParam = req.query.minScore;
            const limit = limitParam ? parseInt(limitParam) : 20;
            const minScore = minScoreParam ? parseFloat(minScoreParam) : 0;
            // 验证参数
            if (isNaN(limit) || limit <= 0 || limit > 100) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_LIMIT',
                        message: 'Limit must be between 1 and 100'
                    }
                });
                return;
            }
            if (isNaN(minScore) || minScore < 0) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_MIN_SCORE',
                        message: 'Minimum score cannot be negative'
                    }
                });
                return;
            }
            const result = await hotnessService_1.default.getHotPosts(limit, minScore);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'GET_HOT_POSTS_FAILED',
                        message: result.error || 'Failed to get hot posts'
                    }
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    posts: result.posts,
                    limit: limit,
                    minScore: minScore,
                    count: result.posts?.length || 0
                }
            });
        }
        catch (error) {
            console.error('Error in getHotPosts:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred'
                }
            });
        }
    }
    /**
     * 基于时间范围获取热门帖子
     */
    static async getHotPostsByTimeRange(req, res) {
        try {
            const hoursParam = req.query.hours;
            const limitParam = req.query.limit;
            const hours = hoursParam ? parseInt(hoursParam) : 24;
            const limit = limitParam ? parseInt(limitParam) : 20;
            // 验证参数
            if (isNaN(hours) || hours <= 0 || hours > 8760) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_HOURS',
                        message: 'Hours must be between 1 and 8760 (1 year)'
                    }
                });
                return;
            }
            if (isNaN(limit) || limit <= 0 || limit > 100) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_LIMIT',
                        message: 'Limit must be between 1 and 100'
                    }
                });
                return;
            }
            const result = await hotnessService_1.default.getHotPostsByTimeRange(hours, limit);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'GET_HOT_POSTS_BY_TIME_FAILED',
                        message: result.error || 'Failed to get hot posts by time range'
                    }
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    posts: result.posts,
                    timeframe: result.timeframe,
                    hours: hours,
                    limit: limit,
                    count: result.posts?.length || 0
                }
            });
        }
        catch (error) {
            console.error('Error in getHotPostsByTimeRange:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred'
                }
            });
        }
    }
    /**
     * 获取热度算法配置
     */
    static async getHotnessConfig(req, res) {
        try {
            const config = hotnessService_1.default.getDefaultConfig();
            res.status(200).json({
                success: true,
                data: {
                    config: config
                }
            });
        }
        catch (error) {
            console.error('Error in getHotnessConfig:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred'
                }
            });
        }
    }
    /**
     * 计算热度趋势
     */
    static async calculateHotnessTrend(req, res) {
        try {
            const postId = parseInt(req.params.id);
            // 验证帖子ID
            if (isNaN(postId) || postId <= 0) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_POST_ID',
                        message: 'Post ID must be a positive integer'
                    }
                });
                return;
            }
            const config = req.body.config || {};
            // 验证配置
            const validation = hotnessService_1.default.validateConfig(config);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_CONFIG',
                        message: 'Invalid hotness configuration',
                        details: validation.errors
                    }
                });
                return;
            }
            const result = await hotnessService_1.default.calculateHotnessTrend(postId, config);
            if (!result.success) {
                if (result.message === 'Post not found') {
                    res.status(404).json({
                        success: false,
                        error: {
                            code: 'POST_NOT_FOUND',
                            message: 'Post not found'
                        }
                    });
                    return;
                }
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'TREND_CALCULATION_FAILED',
                        message: result.error || 'Failed to calculate hotness trend'
                    }
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    trend: result.trend
                }
            });
        }
        catch (error) {
            console.error('Error in calculateHotnessTrend:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred'
                }
            });
        }
    }
}
exports.HotnessController = HotnessController;
exports.default = HotnessController;
//# sourceMappingURL=hotnessController.js.map