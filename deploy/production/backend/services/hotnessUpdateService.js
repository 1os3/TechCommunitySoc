"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotnessUpdateService = void 0;
const hotnessService_1 = __importDefault(require("./hotnessService"));
const Post_1 = __importDefault(require("../models/Post"));
class HotnessUpdateService {
    constructor(config = {}) {
        this.updateQueue = new Map(); // postId -> triggers
        this.processingQueue = new Set(); // Currently processing post IDs
        this.updateTimeout = null;
        this.defaultConfig = {
            realTimeEnabled: true,
            updateThreshold: 1, // 至少1个触发器才更新
            batchUpdateSize: 10, // 每次批量更新10个帖子
            updateDelay: 2000, // 2秒延迟合并更新
            priorityThreshold: 5 // 5个高优先级触发器立即更新
        };
        this.config = { ...this.defaultConfig, ...config };
    }
    /**
     * 获取热度更新服务实例（单例模式）
     */
    static getInstance(config = {}) {
        if (!HotnessUpdateService.instance) {
            HotnessUpdateService.instance = new HotnessUpdateService(config);
        }
        return HotnessUpdateService.instance;
    }
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('HotnessUpdateService config updated:', this.config);
    }
    /**
     * 获取当前配置
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 触发帖子热度更新
     */
    async triggerUpdate(trigger) {
        try {
            if (!this.config.realTimeEnabled) {
                return {
                    success: true,
                    message: 'Real-time updates are disabled'
                };
            }
            // 验证帖子是否存在
            const post = await Post_1.default.findByPk(trigger.postId);
            if (!post || post.is_deleted) {
                return {
                    success: false,
                    error: 'Post not found or deleted'
                };
            }
            // 检查是否正在处理中
            if (this.processingQueue.has(trigger.postId)) {
                console.log(`Post ${trigger.postId} is already being processed, skipping trigger`);
                return {
                    success: true,
                    message: 'Update already in progress'
                };
            }
            // 添加到更新队列
            if (!this.updateQueue.has(trigger.postId)) {
                this.updateQueue.set(trigger.postId, []);
            }
            this.updateQueue.get(trigger.postId).push(trigger);
            console.log(`Added hotness update trigger for post ${trigger.postId}: ${trigger.type} (${trigger.priority})`);
            // 检查是否需要立即更新
            const triggers = this.updateQueue.get(trigger.postId);
            const highPriorityCount = triggers.filter(t => t.priority === 'high').length;
            if (highPriorityCount >= this.config.priorityThreshold) {
                // 立即处理高优先级更新 (强制处理，忽略threshold)
                console.log(`Immediate update triggered for post ${trigger.postId} (${highPriorityCount} high-priority triggers)`);
                await this.processPostUpdate(trigger.postId, true);
                return {
                    success: true,
                    immediate: true,
                    message: 'High-priority update processed immediately'
                };
            }
            // 设置延迟批量更新
            this.scheduleDelayedUpdate();
            return {
                success: true,
                immediate: false,
                message: 'Update scheduled for batch processing'
            };
        }
        catch (error) {
            console.error('Error triggering hotness update:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 用户点赞帖子时触发热度更新
     */
    async onPostLike(postId, userId, liked) {
        const trigger = {
            type: 'like',
            postId,
            userId,
            priority: 'high', // 点赞是高优先级事件
            timestamp: new Date()
        };
        await this.triggerUpdate(trigger);
    }
    /**
     * 用户评论帖子时触发热度更新
     */
    async onPostComment(postId, userId, commentId) {
        const trigger = {
            type: 'comment',
            postId,
            userId,
            priority: 'high', // 评论是高优先级事件
            timestamp: new Date()
        };
        await this.triggerUpdate(trigger);
    }
    /**
     * 用户浏览帖子时触发热度更新
     */
    async onPostView(postId, userId) {
        const trigger = {
            type: 'view',
            postId,
            userId,
            priority: 'low', // 浏览是低优先级事件
            timestamp: new Date()
        };
        await this.triggerUpdate(trigger);
    }
    /**
     * 安排延迟批量更新
     */
    scheduleDelayedUpdate() {
        // 清除现有的定时器
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        // 设置新的定时器
        this.updateTimeout = setTimeout(async () => {
            await this.processBatchUpdates();
        }, this.config.updateDelay);
    }
    /**
     * 处理批量更新
     */
    async processBatchUpdates() {
        try {
            console.log(`Processing batch hotness updates for ${this.updateQueue.size} posts`);
            const postIds = Array.from(this.updateQueue.keys())
                .filter(postId => !this.processingQueue.has(postId))
                .slice(0, this.config.batchUpdateSize);
            if (postIds.length === 0) {
                return {
                    success: true,
                    processed: 0,
                    failed: 0,
                    message: 'No posts to update'
                };
            }
            // 处理选中的帖子
            const results = await Promise.allSettled(postIds.map(postId => this.processPostUpdate(postId)));
            const processed = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`Batch hotness update completed: ${processed} processed, ${failed} failed`);
            // 如果还有待处理的帖子，继续安排更新
            if (this.updateQueue.size > 0) {
                this.scheduleDelayedUpdate();
            }
            return {
                success: true,
                processed,
                failed
            };
        }
        catch (error) {
            console.error('Error in batch hotness updates:', error);
            return {
                success: false,
                processed: 0,
                failed: 0,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 处理单个帖子的热度更新
     */
    async processPostUpdate(postId, forceProcess = false) {
        try {
            // 标记为正在处理
            this.processingQueue.add(postId);
            // 获取触发器信息
            const triggers = this.updateQueue.get(postId) || [];
            if (!forceProcess && triggers.length < this.config.updateThreshold) {
                console.log(`Post ${postId} has insufficient triggers (${triggers.length}), skipping update`);
                return;
            }
            // 计算热度分数
            const result = await hotnessService_1.default.calculatePostHotness(postId);
            if (result.success) {
                console.log(`Hotness updated for post ${postId}: ${result.result?.score} (triggers: ${triggers.length})`);
                // 记录触发器统计
                const triggerStats = {
                    likes: triggers.filter(t => t.type === 'like').length,
                    comments: triggers.filter(t => t.type === 'comment').length,
                    views: triggers.filter(t => t.type === 'view').length,
                    highPriority: triggers.filter(t => t.priority === 'high').length
                };
                console.log(`Trigger stats for post ${postId}:`, triggerStats);
            }
            else {
                console.error(`Failed to update hotness for post ${postId}:`, result.error || result.message || 'Unknown error');
            }
            // 清理队列中的该帖子
            this.updateQueue.delete(postId);
        }
        catch (error) {
            console.error(`Error processing hotness update for post ${postId}:`, error);
            throw error;
        }
        finally {
            // 移除处理标记
            this.processingQueue.delete(postId);
        }
    }
    /**
     * 立即处理所有待更新的帖子
     */
    async processAllPending() {
        try {
            console.log(`Processing all pending hotness updates for ${this.updateQueue.size} posts`);
            // 清除定时器
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
                this.updateTimeout = null;
            }
            const postIds = Array.from(this.updateQueue.keys());
            if (postIds.length === 0) {
                return {
                    success: true,
                    processed: 0,
                    failed: 0,
                    message: 'No pending updates'
                };
            }
            // 处理所有帖子 (强制处理，忽略threshold)
            const results = await Promise.allSettled(postIds.map(postId => this.processPostUpdate(postId, true)));
            const processed = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`All pending hotness updates completed: ${processed} processed, ${failed} failed`);
            return {
                success: true,
                processed,
                failed
            };
        }
        catch (error) {
            console.error('Error processing all pending updates:', error);
            return {
                success: false,
                processed: 0,
                failed: 0,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 获取更新队列状态
     */
    getQueueStatus() {
        const queueDetails = Array.from(this.updateQueue.entries()).map(([postId, triggers]) => ({
            postId,
            triggerCount: triggers.length,
            types: [...new Set(triggers.map(t => t.type))]
        }));
        return {
            pendingPosts: this.updateQueue.size,
            totalTriggers: Array.from(this.updateQueue.values()).reduce((sum, triggers) => sum + triggers.length, 0),
            processingPosts: this.processingQueue.size,
            queueDetails
        };
    }
    /**
     * 清理过期的触发器
     */
    async cleanupExpiredTriggers(maxAge = 300000) {
        try {
            const now = new Date();
            let cleaned = 0;
            for (const [postId, triggers] of this.updateQueue.entries()) {
                const validTriggers = triggers.filter(trigger => now.getTime() - trigger.timestamp.getTime() < maxAge);
                const removedCount = triggers.length - validTriggers.length;
                cleaned += removedCount;
                if (validTriggers.length === 0) {
                    this.updateQueue.delete(postId);
                }
                else if (removedCount > 0) {
                    this.updateQueue.set(postId, validTriggers);
                }
            }
            console.log(`Cleaned up ${cleaned} expired hotness triggers`);
            return {
                success: true,
                cleaned,
                message: `Cleaned ${cleaned} expired triggers`
            };
        }
        catch (error) {
            console.error('Error cleaning up expired triggers:', error);
            return {
                success: false,
                cleaned: 0,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 重置更新服务状态
     */
    reset() {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }
        this.updateQueue.clear();
        this.processingQueue.clear();
        console.log('HotnessUpdateService reset');
    }
}
exports.HotnessUpdateService = HotnessUpdateService;
exports.default = HotnessUpdateService;
//# sourceMappingURL=hotnessUpdateService.js.map