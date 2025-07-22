"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotnessScheduler = void 0;
const hotnessService_1 = __importDefault(require("./hotnessService"));
const Post_1 = __importDefault(require("../models/Post"));
const sequelize_1 = require("sequelize");
class HotnessScheduler {
    constructor(config = {}) {
        this.intervalId = null;
        this.isRunning = false;
        this.defaultConfig = {
            enabled: false,
            updateInterval: 30 * 60 * 1000, // 30分钟
            batchSize: 50, // 每次处理50个帖子
            maxAge: 168 // 7天（168小时）
        };
        this.config = { ...this.defaultConfig, ...config };
    }
    /**
     * 获取调度器实例（单例模式）
     */
    static getInstance(config = {}) {
        if (!HotnessScheduler.instance) {
            HotnessScheduler.instance = new HotnessScheduler(config);
        }
        return HotnessScheduler.instance;
    }
    /**
     * 启动定时任务
     */
    start() {
        if (this.isRunning) {
            return {
                success: false,
                message: 'Scheduler is already running'
            };
        }
        if (!this.config.enabled) {
            return {
                success: false,
                message: 'Scheduler is disabled'
            };
        }
        try {
            this.intervalId = setInterval(async () => {
                await this.updateHotnessScores();
            }, this.config.updateInterval);
            this.isRunning = true;
            console.log(`Hotness scheduler started with interval: ${this.config.updateInterval}ms`);
            return {
                success: true,
                message: 'Scheduler started successfully'
            };
        }
        catch (error) {
            console.error('Error starting hotness scheduler:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to start scheduler'
            };
        }
    }
    /**
     * 停止定时任务
     */
    stop() {
        if (!this.isRunning) {
            return {
                success: false,
                message: 'Scheduler is not running'
            };
        }
        try {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            this.isRunning = false;
            console.log('Hotness scheduler stopped');
            return {
                success: true,
                message: 'Scheduler stopped successfully'
            };
        }
        catch (error) {
            console.error('Error stopping hotness scheduler:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to stop scheduler'
            };
        }
    }
    /**
     * 重启调度器
     */
    restart(newConfig) {
        const stopResult = this.stop();
        if (!stopResult.success) {
            return stopResult;
        }
        if (newConfig) {
            this.updateConfig(newConfig);
        }
        return this.start();
    }
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('Hotness scheduler config updated:', this.config);
    }
    /**
     * 获取当前配置
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 获取运行状态
     */
    getStatus() {
        return {
            running: this.isRunning,
            config: this.config,
        };
    }
    /**
     * 立即执行一次热度更新
     */
    async executeNow() {
        try {
            console.log('Executing immediate hotness update...');
            const result = await this.updateHotnessScores();
            console.log(`Immediate hotness update completed. Updated: ${result.updated}, Failed: ${result.failed}`);
            return result;
        }
        catch (error) {
            console.error('Error in immediate hotness update:', error);
            return {
                success: false,
                updated: 0,
                failed: 0,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 执行热度分数更新
     */
    async updateHotnessScores() {
        try {
            // 计算时间阈值
            const maxAgeMs = this.config.maxAge * 60 * 60 * 1000;
            const cutoffTime = new Date(Date.now() - maxAgeMs);
            // 获取需要更新的帖子
            const posts = await Post_1.default.findAll({
                where: {
                    is_deleted: false,
                    created_at: {
                        [sequelize_1.Op.gte]: cutoffTime // 只处理指定时间内的帖子
                    }
                },
                attributes: ['id'],
                order: [['hotness_score', 'ASC']], // 优先处理热度低的帖子
                limit: this.config.batchSize
            });
            if (posts.length === 0) {
                return {
                    success: true,
                    updated: 0,
                    failed: 0,
                    message: 'No posts found for update'
                };
            }
            const postIds = posts.map(post => post.id);
            // 批量更新热度分数
            const result = await hotnessService_1.default.batchUpdateHotness(postIds);
            if (!result.success) {
                console.error('Batch hotness update failed:', result.error);
                return {
                    success: false,
                    updated: 0,
                    failed: postIds.length
                };
            }
            const updated = result.results?.length || 0;
            const failed = result.failed?.length || 0;
            // 记录更新日志
            if (updated > 0 || failed > 0) {
                console.log(`Hotness update completed - Updated: ${updated}, Failed: ${failed}, Batch size: ${this.config.batchSize}`);
            }
            return {
                success: true,
                updated: updated,
                failed: failed
            };
        }
        catch (error) {
            console.error('Error in scheduled hotness update:', error);
            return {
                success: false,
                updated: 0,
                failed: 0
            };
        }
    }
    /**
     * 清理过期帖子的热度分数（设置为0）
     */
    async cleanupExpiredPosts() {
        try {
            const maxAgeMs = this.config.maxAge * 60 * 60 * 1000;
            const cutoffTime = new Date(Date.now() - maxAgeMs);
            // 找到过期的帖子并将热度设置为0
            const [updatedCount] = await Post_1.default.update({ hotness_score: 0 }, {
                where: {
                    is_deleted: false,
                    created_at: {
                        [sequelize_1.Op.lt]: cutoffTime
                    },
                    hotness_score: {
                        [sequelize_1.Op.gt]: 0
                    }
                }
            });
            console.log(`Cleaned up ${updatedCount} expired posts (older than ${this.config.maxAge} hours)`);
            return {
                success: true,
                cleaned: updatedCount
            };
        }
        catch (error) {
            console.error('Error cleaning up expired posts:', error);
            return {
                success: false,
                cleaned: 0,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 获取热度更新统计
     */
    async getUpdateStatistics() {
        try {
            const maxAgeMs = this.config.maxAge * 60 * 60 * 1000;
            const cutoffTime = new Date(Date.now() - maxAgeMs);
            // 获取统计数据
            const [totalPosts, activePosts, expiredPosts, avgResult, maxResult] = await Promise.all([
                Post_1.default.count({ where: { is_deleted: false } }),
                Post_1.default.count({
                    where: {
                        is_deleted: false,
                        created_at: { [sequelize_1.Op.gte]: cutoffTime }
                    }
                }),
                Post_1.default.count({
                    where: {
                        is_deleted: false,
                        created_at: { [sequelize_1.Op.lt]: cutoffTime }
                    }
                }),
                Post_1.default.findOne({
                    where: { is_deleted: false },
                    order: [['hotness_score', 'DESC']],
                    attributes: ['hotness_score'],
                    raw: true
                }).then((result) => ({ max: result?.hotness_score || 0 })),
                Post_1.default.findAll({
                    where: { is_deleted: false },
                    attributes: ['hotness_score'],
                    raw: true
                }).then((results) => {
                    const sum = results.reduce((acc, r) => acc + (r.hotness_score || 0), 0);
                    return { avg: results.length > 0 ? sum / results.length : 0 };
                })
            ]);
            return {
                success: true,
                statistics: {
                    totalPosts,
                    activePosts,
                    expiredPosts,
                    avgHotness: parseFloat(avgResult?.avg || '0'),
                    maxHotness: parseFloat(maxResult?.max || '0'),
                    lastUpdated: new Date()
                }
            };
        }
        catch (error) {
            console.error('Error getting update statistics:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
exports.HotnessScheduler = HotnessScheduler;
exports.default = HotnessScheduler;
//# sourceMappingURL=hotnessScheduler.js.map