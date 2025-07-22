import Comment from '../models/Comment';
export interface CreateCommentData {
    content: string;
    post_id: number;
    author_id: number;
    parent_id?: number;
}
export interface UpdateCommentData {
    content?: string;
}
export interface CommentResult {
    success: boolean;
    comment?: Comment;
    message?: string;
    error?: string;
}
export interface CommentListResult {
    success: boolean;
    comments?: Comment[];
    total?: number;
    message?: string;
    error?: string;
}
export interface CommentTree {
    comment: Comment;
    replies: CommentTree[];
    replyCount: number;
    level: number;
}
export interface CommentTreeResult {
    success: boolean;
    commentTree?: CommentTree[];
    total?: number;
    message?: string;
    error?: string;
}
export declare class CommentService {
    static createComment(commentData: CreateCommentData): Promise<CommentResult>;
    static getCommentById(id: number): Promise<CommentResult>;
    static updateComment(commentId: number, userId: number, updateData: UpdateCommentData): Promise<CommentResult>;
    static deleteComment(commentId: number, userId: number): Promise<CommentResult>;
    static adminDeleteComment(commentId: number, adminId: number): Promise<CommentResult>;
    static getPostComments(postId: number, page?: number, limit?: number, orderBy?: string): Promise<CommentListResult>;
    static getCommentReplies(commentId: number, page?: number, limit?: number): Promise<CommentListResult>;
    static getUserComments(userId: number, page?: number, limit?: number): Promise<CommentListResult>;
    /**
     * Build hierarchical comment tree structure
     */
    static buildCommentTree(comments: Comment[], level?: number): CommentTree[];
    /**
     * Recursively build comment tree structure
     */
    private static buildCommentTreeRecursive;
    /**
     * Count total replies for a comment (including nested replies)
     */
    private static countReplies;
    /**
     * Get post comments with hierarchical tree structure
     */
    static getPostCommentsTree(postId: number, page?: number, limit?: number, orderBy?: string, maxDepth?: number): Promise<CommentTreeResult>;
    /**
     * Get flattened comment structure with level indicators
     */
    static getPostCommentsFlattened(postId: number, page?: number, limit?: number, orderBy?: string, maxDepth?: number): Promise<CommentListResult>;
    /**
     * Sort comments with different strategies
     */
    static getPostCommentsSorted(postId: number, sortBy?: 'oldest' | 'newest' | 'most_replies', page?: number, limit?: number): Promise<CommentTreeResult>;
}
//# sourceMappingURL=commentService.d.ts.map