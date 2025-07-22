import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class LikeController {
    static togglePostLike(req: AuthenticatedRequest, res: Response): Promise<void>;
    static toggleCommentLike(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPostLikeStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getCommentLikeStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getBatchLikeStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPostLikeCount(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getCommentLikeCount(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUserLikedPosts(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUserLikedComments(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUserLikeStatistics(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getTopLikedContent(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getMostActiveUsers(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getLikeActivityMetrics(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=likeController.d.ts.map