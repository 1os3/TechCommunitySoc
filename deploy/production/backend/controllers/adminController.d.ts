import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class AdminController {
    static createAdmin(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteAdmin(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getAdmins(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getAdminStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deletePost(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteComment(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteUser(req: AuthenticatedRequest, res: Response): Promise<void>;
    static enableUser(req: AuthenticatedRequest, res: Response): Promise<void>;
    static restoreUser(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getSoftDeletedUsers(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUsers(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getSystemLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getErrorLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getAdminActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
    static clearLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
    static clearAllLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=adminController.d.ts.map