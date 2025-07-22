import { Request, Response } from 'express';
export declare class HotnessSchedulerController {
    /**
     * 启动热度调度器
     */
    static startScheduler(req: Request, res: Response): Promise<void>;
    /**
     * 停止热度调度器
     */
    static stopScheduler(req: Request, res: Response): Promise<void>;
    /**
     * 重启热度调度器
     */
    static restartScheduler(req: Request, res: Response): Promise<void>;
    /**
     * 获取调度器状态
     */
    static getSchedulerStatus(req: Request, res: Response): Promise<void>;
    /**
     * 更新调度器配置
     */
    static updateSchedulerConfig(req: Request, res: Response): Promise<void>;
    /**
     * 立即执行热度更新
     */
    static executeImmediateUpdate(req: Request, res: Response): Promise<void>;
    /**
     * 清理过期帖子
     */
    static cleanupExpiredPosts(req: Request, res: Response): Promise<void>;
    /**
     * 获取更新统计
     */
    static getUpdateStatistics(req: Request, res: Response): Promise<void>;
    /**
     * 验证调度器配置
     */
    private static validateSchedulerConfig;
}
export default HotnessSchedulerController;
//# sourceMappingURL=hotnessSchedulerController.d.ts.map