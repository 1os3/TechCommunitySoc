export interface HotnessConfig {
    likeWeight: number;
    commentWeight: number;
    viewWeight: number;
    gravity: number;
    baseHours: number;
}
export interface HotnessResult {
    postId: number;
    score: number;
    previousScore: number;
    factors: {
        likes: number;
        comments: number;
        views: number;
        age: number;
        engagement: number;
    };
}
export declare class HotnessService {
    private static readonly DEFAULT_CONFIG;
    /**
     * 计算单个帖子的热度分数
     */
    static calculatePostHotness(postId: number, config?: Partial<HotnessConfig>): Promise<{
        success: boolean;
        result?: HotnessResult;
        message?: string;
        error?: string;
    }>;
    /**
     * 批量更新多个帖子的热度分数
     */
    static batchUpdateHotness(postIds: number[], config?: Partial<HotnessConfig>): Promise<{
        success: boolean;
        results?: HotnessResult[];
        failed?: number[];
        message?: string;
        error?: string;
    }>;
    /**
     * 更新所有活跃帖子的热度分数
     */
    static updateAllActivePostsHotness(config?: Partial<HotnessConfig>): Promise<{
        success: boolean;
        updated?: number;
        failed?: number;
        message?: string;
        error?: string;
    }>;
    /**
     * 获取热门帖子列表
     */
    static getHotPosts(limit?: number, minScore?: number): Promise<{
        success: boolean;
        posts?: any[];
        message?: string;
        error?: string;
    }>;
    /**
     * 基于时间范围获取热门帖子
     */
    static getHotPostsByTimeRange(hours?: number, limit?: number): Promise<{
        success: boolean;
        posts?: any[];
        timeframe?: {
            start: Date;
            end: Date;
        };
        message?: string;
        error?: string;
    }>;
    /**
     * 获取热度算法配置信息
     */
    static getDefaultConfig(): HotnessConfig;
    /**
     * 验证热度配置
     */
    static validateConfig(config: Partial<HotnessConfig>): {
        valid: boolean;
        errors: string[];
    };
    /**
     * 计算热度趋势（对比历史数据）
     */
    static calculateHotnessTrend(postId: number, config?: Partial<HotnessConfig>): Promise<{
        success: boolean;
        trend?: {
            current: number;
            change: number;
            percentage: number;
        };
        message?: string;
        error?: string;
    }>;
}
export default HotnessService;
//# sourceMappingURL=hotnessService.d.ts.map