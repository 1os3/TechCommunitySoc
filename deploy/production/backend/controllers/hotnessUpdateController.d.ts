import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class HotnessUpdateController {
    /**
     * 手动触发帖子热度更新
     */
    static triggerPostUpdate(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 处理所有待更新的帖子
     */
    static processAllPending(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取更新队列状态
     */
    static getQueueStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 更新配置
     */
    static updateConfig(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 清理过期触发器
     */
    static cleanupExpiredTriggers(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 重置更新服务
     */
    static resetService(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export default HotnessUpdateController;
//# sourceMappingURL=hotnessUpdateController.d.ts.map