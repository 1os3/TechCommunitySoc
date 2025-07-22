export interface SchedulerConfig {
    enabled: boolean;
    updateInterval: number;
    batchSize: number;
    maxAge: number;
}
export declare class HotnessScheduler {
    private static instance;
    private intervalId;
    private isRunning;
    private readonly defaultConfig;
    private config;
    private constructor();
    /**
     * 获取调度器实例（单例模式）
     */
    static getInstance(config?: Partial<SchedulerConfig>): HotnessScheduler;
    /**
     * 启动定时任务
     */
    start(): {
        success: boolean;
        message: string;
    };
    /**
     * 停止定时任务
     */
    stop(): {
        success: boolean;
        message: string;
    };
    /**
     * 重启调度器
     */
    restart(newConfig?: Partial<SchedulerConfig>): {
        success: boolean;
        message: string;
    };
    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<SchedulerConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): SchedulerConfig;
    /**
     * 获取运行状态
     */
    getStatus(): {
        running: boolean;
        config: SchedulerConfig;
        lastUpdate?: Date;
    };
    /**
     * 立即执行一次热度更新
     */
    executeNow(): Promise<{
        success: boolean;
        updated: number;
        failed: number;
        message?: string;
        error?: string;
    }>;
    /**
     * 执行热度分数更新
     */
    private updateHotnessScores;
    /**
     * 清理过期帖子的热度分数（设置为0）
     */
    cleanupExpiredPosts(): Promise<{
        success: boolean;
        cleaned: number;
        message?: string;
        error?: string;
    }>;
    /**
     * 获取热度更新统计
     */
    getUpdateStatistics(): Promise<{
        success: boolean;
        statistics?: {
            totalPosts: number;
            activePosts: number;
            expiredPosts: number;
            avgHotness: number;
            maxHotness: number;
            lastUpdated: Date;
        };
        error?: string;
    }>;
}
export default HotnessScheduler;
//# sourceMappingURL=hotnessScheduler.d.ts.map