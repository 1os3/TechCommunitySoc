import Like from '../models/Like';
export interface LikeResult {
    success: boolean;
    liked?: boolean;
    like?: Like;
    message?: string;
    error?: string;
}
export interface LikeStatusResult {
    success: boolean;
    likeStatus?: Map<string, boolean>;
    message?: string;
    error?: string;
}
export interface LikeCountResult {
    success: boolean;
    count?: number;
    message?: string;
    error?: string;
}
export interface LikeStatistics {
    totalLikes: number;
    postsLiked: number;
    commentsLiked: number;
    likesReceived: number;
    postLikesReceived: number;
    commentLikesReceived: number;
}
export interface UserLikeActivity {
    userId: number;
    username: string;
    totalLikes: number;
    recentLikes: number;
}
export declare class LikeService {
    static togglePostLike(userId: number, postId: number): Promise<LikeResult>;
    static toggleCommentLike(userId: number, commentId: number): Promise<LikeResult>;
    static getPostLikeStatus(userId: number, postId: number): Promise<LikeResult>;
    static getCommentLikeStatus(userId: number, commentId: number): Promise<LikeResult>;
    static getBatchLikeStatus(userId: number, targets: Array<{
        type: 'post' | 'comment';
        id: number;
    }>): Promise<LikeStatusResult>;
    static getPostLikeCount(postId: number): Promise<LikeCountResult>;
    static getCommentLikeCount(commentId: number): Promise<LikeCountResult>;
    static getUserLikedPosts(userId: number, page?: number, limit?: number): Promise<{
        success: boolean;
        posts?: any[];
        total?: number;
        message?: string;
        error?: string;
    }>;
    static getUserLikedComments(userId: number, page?: number, limit?: number): Promise<{
        success: boolean;
        comments?: any[];
        total?: number;
        message?: string;
        error?: string;
    }>;
    static getUserLikeStatistics(userId: number): Promise<{
        success: boolean;
        statistics?: LikeStatistics;
        message?: string;
        error?: string;
    }>;
    static getTopLikedContent(type: 'post' | 'comment', limit?: number, timeframe?: {
        start: Date;
        end: Date;
    }): Promise<{
        success: boolean;
        content?: any[];
        message?: string;
        error?: string;
    }>;
    static getMostActiveUsers(limit?: number, days?: number): Promise<{
        success: boolean;
        users?: UserLikeActivity[];
        message?: string;
        error?: string;
    }>;
    static getLikeActivityMetrics(days?: number): Promise<{
        success: boolean;
        metrics?: any;
        message?: string;
        error?: string;
    }>;
}
//# sourceMappingURL=likeService.d.ts.map