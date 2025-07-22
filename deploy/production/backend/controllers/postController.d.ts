import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class PostController {
    static createPost(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPost(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updatePost(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deletePost(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPostList(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUserPosts(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getHotPosts(req: AuthenticatedRequest, res: Response): Promise<void>;
    static searchPosts(req: AuthenticatedRequest, res: Response): Promise<void>;
    static searchUsers(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=postController.d.ts.map