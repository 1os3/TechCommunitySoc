import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class AuthController {
    static register(req: Request, res: Response): Promise<void>;
    static login(req: Request, res: Response): Promise<void>;
    static verifyEmail(req: Request, res: Response): Promise<void>;
    static resendVerificationEmail(req: Request, res: Response): Promise<void>;
    static getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void>;
    static logout(req: AuthenticatedRequest, res: Response): Promise<void>;
    static requestPasswordReset(req: Request, res: Response): Promise<void>;
    static resetPassword(req: Request, res: Response): Promise<void>;
    static changePassword(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void>;
    static checkUserStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=authController.d.ts.map