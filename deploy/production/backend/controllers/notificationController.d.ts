import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class NotificationController {
    static getNotifications(req: AuthenticatedRequest, res: Response): Promise<void>;
    static markAsRead(req: AuthenticatedRequest, res: Response): Promise<void>;
    static markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=notificationController.d.ts.map