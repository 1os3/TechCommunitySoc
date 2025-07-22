export interface HotnessUpdateConfig {
    realTimeEnabled: boolean;
    updateThreshold: number;
    batchUpdateSize: number;
    updateDelay: number;
    priorityThreshold: number;
}
export interface UpdateTrigger {
    type: 'like' | 'comment' | 'view';
    postId: number;
    userId?: number;
    priority: 'low' | 'medium' | 'high';
    timestamp: Date;
}
export declare class HotnessUpdateService {
    private static instance;
    private updateQueue;
    private processingQueue;
    private updateTimeout;
    private readonly defaultConfig;
    private config;
    private constructor();
    /**
     * 获取热度更新服务实例（单例模式）
     */
    static getInstance(config?: Partial<HotnessUpdateConfig>): HotnessUpdateService;
    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<HotnessUpdateConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): HotnessUpdateConfig;
    /**
     * 触发帖子热度更新
     */
    triggerUpdate(trigger: UpdateTrigger): Promise<{
        success: boolean;
        immediate?: boolean;
        message?: string;
        error?: string;
    }>;
    /**
     * 用户点赞帖子时触发热度更新
     */
    onPostLike(postId: number, userId: number, liked: boolean): Promise<void>;
    /**
     * 用户评论帖子时触发热度更新
     */
    onPostComment(postId: number, userId: number, commentId: number): Promise<void>;
    /**
     * 用户浏览帖子时触发热度更新
     */
    onPostView(postId: number, userId?: number): Promise<void>;
    /**
     * 安排延迟批量更新
     */
    private scheduleDelayedUpdate;
    /**
     * 处理批量更新
     */
    processBatchUpdates(): Promise<{
        success: boolean;
        processed: number;
        failed: number;
        message?: string;
        error?: string;
    }>;
    /**
     * 处理单个帖子的热度更新
     */
    private processPostUpdate;
    /**
     * 立即处理所有待更新的帖子
     */
    processAllPending(): Promise<{
        success: boolean;
        processed: number;
        failed: number;
        message?: string;
        error?: string;
    }>;
    /**
     * 获取更新队列状态
     */
    getQueueStatus(): {
        pendingPosts: number;
        totalTriggers: number;
        processingPosts: number;
        queueDetails: {
            postId: number;
            triggerCount: number;
            types: string[];
        }[];
    };
    /**
     * 清理过期的触发器
     */
    cleanupExpiredTriggers(maxAge?: number): Promise<{
        success: boolean;
        cleaned: number;
        message?: string;
        error?: string;
    }>;
    /**
     * 重置更新服务状态
     */
    reset(): void;
}
export default HotnessUpdateService;
//# sourceMappingURL=hotnessUpdateService.d.ts.map