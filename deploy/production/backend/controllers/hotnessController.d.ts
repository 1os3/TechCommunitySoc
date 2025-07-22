import { Request, Response } from 'express';
export declare class HotnessController {
    /**
     * 计算单个帖子的热度分数
     */
    static calculatePostHotness(req: Request, res: Response): Promise<void>;
    /**
     * 批量更新帖子热度分数
     */
    static batchUpdateHotness(req: Request, res: Response): Promise<void>;
    /**
     * 更新所有活跃帖子的热度分数
     */
    static updateAllPostsHotness(req: Request, res: Response): Promise<void>;
    /**
     * 获取热门帖子列表
     */
    static getHotPosts(req: Request, res: Response): Promise<void>;
    /**
     * 基于时间范围获取热门帖子
     */
    static getHotPostsByTimeRange(req: Request, res: Response): Promise<void>;
    /**
     * 获取热度算法配置
     */
    static getHotnessConfig(req: Request, res: Response): Promise<void>;
    /**
     * 计算热度趋势
     */
    static calculateHotnessTrend(req: Request, res: Response): Promise<void>;
}
export default HotnessController;
//# sourceMappingURL=hotnessController.d.ts.map