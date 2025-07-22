import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class CommentController {
    static createComment(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getComment(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateComment(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteComment(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPostComments(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getCommentReplies(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUserComments(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPostCommentsTree(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPostCommentsFlattened(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPostCommentsSorted(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=commentController.d.ts.map