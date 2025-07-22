import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class ContentController {
    /**
     * Get posts for admin management
     */
    static getPosts(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get comments for admin management
     */
    static getComments(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get violations for admin review
     */
    static getViolations(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update violation status
     */
    static updateViolationStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get violation statistics
     */
    static getViolationStats(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get violation words
     */
    static getViolationWords(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Add violation word
     */
    static addViolationWord(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Remove violation word
     */
    static removeViolationWord(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=contentController.d.ts.map