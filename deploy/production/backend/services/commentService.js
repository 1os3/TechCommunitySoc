"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const Comment_1 = __importDefault(require("../models/Comment"));
const Post_1 = __importDefault(require("../models/Post"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
const hotnessUpdateService_1 = __importDefault(require("./hotnessUpdateService"));
const notificationService_1 = require("./notificationService");
const violationService_1 = require("./violationService");
class CommentService {
    static async createComment(commentData) {
        try {
            logger_1.default.info(`Creating comment for post: ${commentData.post_id} by user: ${commentData.author_id}`);
            // Verify user exists and is active
            const user = await User_1.default.findByPk(commentData.author_id);
            if (!user) {
                logger_1.default.warn(`Comment creation failed: User not found ${commentData.author_id}`);
                return {
                    success: false,
                    error: 'User not found',
                };
            }
            if (!user.is_active) {
                logger_1.default.warn(`Comment creation failed: User account is deactivated ${commentData.author_id}`);
                return {
                    success: false,
                    error: 'Account is deactivated',
                };
            }
            // Verify post exists and is not deleted
            const post = await Post_1.default.findActivePostById(commentData.post_id);
            if (!post) {
                logger_1.default.warn(`Comment creation failed: Post not found ${commentData.post_id}`);
                return {
                    success: false,
                    error: 'Post not found',
                };
            }
            // If this is a reply, verify parent comment exists
            if (commentData.parent_id) {
                const parentComment = await Comment_1.default.findOne({
                    where: {
                        id: commentData.parent_id,
                        post_id: commentData.post_id,
                        is_deleted: false,
                    },
                });
                if (!parentComment) {
                    logger_1.default.warn(`Comment creation failed: Parent comment not found ${commentData.parent_id}`);
                    return {
                        success: false,
                        error: 'Parent comment not found',
                    };
                }
            }
            // Check for violations in comment content
            const violationResult = await violationService_1.ViolationService.detectViolations(commentData.content);
            // Block comment creation if violations found and record violations
            if (violationResult.hasViolations) {
                logger_1.default.warn(`Comment creation blocked for user ${commentData.author_id} due to ${violationResult.violations.length} violations`);
                // Record the violation attempt (use a temporary ID since comment wasn't created)
                await violationService_1.ViolationService.recordViolations(commentData.author_id, 'comment', 0, // Use 0 for blocked content
                commentData.content, violationResult.violations);
                const violatedWords = violationResult.violations.map(v => v.word).join(', ');
                return {
                    success: false,
                    error: `评论包含违规词汇，无法发布。违规词汇: ${violatedWords}`
                };
            }
            // Create comment
            const comment = await Comment_1.default.create({
                content: commentData.content,
                post_id: commentData.post_id,
                author_id: commentData.author_id,
                parent_id: commentData.parent_id || null,
            });
            // Update post comment count
            await post.incrementCommentCount();
            // Create notification
            try {
                if (commentData.parent_id) {
                    // This is a reply - notify the parent comment author
                    await notificationService_1.NotificationService.createReplyNotification(commentData.author_id, commentData.post_id, comment.id, commentData.parent_id, user.username, post.title);
                }
                else {
                    // This is a direct comment - notify the post author
                    await notificationService_1.NotificationService.createCommentNotification(commentData.author_id, commentData.post_id, comment.id, user.username, post.title);
                }
            }
            catch (notificationError) {
                logger_1.default.warn(`Failed to create comment notification for post ${commentData.post_id}:`, notificationError);
            }
            // Trigger real-time hotness update
            try {
                const hotnessUpdateService = hotnessUpdateService_1.default.getInstance();
                await hotnessUpdateService.onPostComment(commentData.post_id, commentData.author_id, comment.id);
            }
            catch (hotnessError) {
                // Don't fail the comment creation if hotness update fails
                logger_1.default.warn(`Failed to trigger hotness update for post ${commentData.post_id}:`, hotnessError);
            }
            logger_1.default.info(`Comment created successfully: ${comment.id}`);
            return {
                success: true,
                comment,
                message: 'Comment created successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Comment creation error:', error);
            return {
                success: false,
                error: 'Comment creation failed due to server error',
            };
        }
    }
    static async getCommentById(id) {
        try {
            logger_1.default.info(`Fetching comment: ${id}`);
            const comment = await Comment_1.default.findOne({
                where: { id, is_deleted: false },
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                ],
            });
            if (!comment) {
                logger_1.default.warn(`Comment not found: ${id}`);
                return {
                    success: false,
                    error: 'Comment not found',
                };
            }
            logger_1.default.info(`Comment fetched successfully: ${comment.id}`);
            return {
                success: true,
                comment,
                message: 'Comment retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get comment error:', error);
            return {
                success: false,
                error: 'Failed to retrieve comment',
            };
        }
    }
    static async updateComment(commentId, userId, updateData) {
        try {
            logger_1.default.info(`Updating comment ${commentId} by user ${userId}`);
            const comment = await Comment_1.default.findOne({
                where: { id: commentId, is_deleted: false },
            });
            if (!comment) {
                logger_1.default.warn(`Update failed: Comment not found ${commentId}`);
                return {
                    success: false,
                    error: 'Comment not found',
                };
            }
            // Check if user is the author
            if (comment.author_id !== userId) {
                logger_1.default.warn(`Update failed: User ${userId} is not the author of comment ${commentId}`);
                return {
                    success: false,
                    error: 'You can only edit your own comments',
                };
            }
            // Update comment
            await comment.update(updateData);
            logger_1.default.info(`Comment updated successfully: ${comment.id}`);
            return {
                success: true,
                comment,
                message: 'Comment updated successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Comment update error:', error);
            return {
                success: false,
                error: 'Comment update failed due to server error',
            };
        }
    }
    static async deleteComment(commentId, userId) {
        try {
            logger_1.default.info(`Deleting comment ${commentId} by user ${userId}`);
            const comment = await Comment_1.default.findOne({
                where: { id: commentId, is_deleted: false },
            });
            if (!comment) {
                logger_1.default.warn(`Delete failed: Comment not found ${commentId}`);
                return {
                    success: false,
                    error: 'Comment not found',
                };
            }
            // Check if user is the author
            if (comment.author_id !== userId) {
                logger_1.default.warn(`Delete failed: User ${userId} is not the author of comment ${commentId}`);
                return {
                    success: false,
                    error: 'You can only delete your own comments',
                };
            }
            // Check if comment has replies
            const replyCount = await Comment_1.default.count({
                where: {
                    parent_id: commentId,
                    is_deleted: false,
                },
            });
            if (replyCount > 0) {
                // If comment has replies, replace content with deletion placeholder to preserve structure
                await comment.update({
                    content: '[This comment has been deleted]',
                    is_deleted: true,
                });
                logger_1.default.info(`Comment with replies soft deleted (placeholder): ${comment.id}`);
            }
            else {
                // If no replies, perform normal soft delete
                await comment.update({ is_deleted: true });
                logger_1.default.info(`Comment soft deleted: ${comment.id}`);
            }
            // Update post comment count
            const post = await Post_1.default.findByPk(comment.post_id);
            if (post) {
                await post.decrementCommentCount();
            }
            return {
                success: true,
                message: 'Comment deleted successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Comment deletion error:', error);
            return {
                success: false,
                error: 'Comment deletion failed due to server error',
            };
        }
    }
    // Admin delete comment (can delete any comment)
    static async adminDeleteComment(commentId, adminId) {
        try {
            logger_1.default.info(`Admin deleting comment ${commentId} by admin ${adminId}`);
            const comment = await Comment_1.default.findOne({
                where: { id: commentId, is_deleted: false },
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username'],
                    },
                ],
            });
            if (!comment) {
                logger_1.default.warn(`Admin delete failed: Comment not found ${commentId}`);
                return {
                    success: false,
                    error: 'Comment not found',
                };
            }
            // Check if comment has replies
            const replyCount = await Comment_1.default.count({
                where: {
                    parent_id: commentId,
                    is_deleted: false,
                },
            });
            if (replyCount > 0) {
                // If comment has replies, replace content with deletion placeholder to preserve structure
                await comment.update({
                    content: '[This comment has been deleted by admin]',
                    is_deleted: true,
                });
                logger_1.default.info(`Comment with replies deleted by admin (placeholder): ${comment.id} (author: ${comment.author?.username || 'unknown'}) by admin: ${adminId}`);
            }
            else {
                // If no replies, perform normal soft delete
                await comment.update({ is_deleted: true });
                logger_1.default.info(`Comment deleted by admin: ${comment.id} (author: ${comment.author?.username || 'unknown'}) by admin: ${adminId}`);
            }
            // Update post comment count
            const post = await Post_1.default.findByPk(comment.post_id);
            if (post) {
                await post.decrementCommentCount();
            }
            return {
                success: true,
                message: 'Comment deleted successfully by admin',
                comment,
            };
        }
        catch (error) {
            logger_1.default.error('Admin comment deletion error:', error);
            return {
                success: false,
                error: 'Admin comment deletion failed due to server error',
            };
        }
    }
    static async getPostComments(postId, page = 1, limit = 20, orderBy = 'created_at') {
        try {
            logger_1.default.info(`Fetching comments for post ${postId}: page ${page}, limit ${limit}, order by ${orderBy}`);
            // Verify post exists
            const post = await Post_1.default.findActivePostById(postId);
            if (!post) {
                logger_1.default.warn(`Get comments failed: Post not found ${postId}`);
                return {
                    success: false,
                    error: 'Post not found',
                };
            }
            const offset = (page - 1) * limit;
            const validOrderColumns = ['created_at', 'updated_at'];
            const orderColumn = validOrderColumns.includes(orderBy) ? orderBy : 'created_at';
            // Get top-level comments (no parent_id)
            const comments = await Comment_1.default.findAll({
                where: {
                    post_id: postId,
                    parent_id: null,
                    is_deleted: false,
                },
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                ],
                order: [[orderColumn, 'ASC']],
                limit,
                offset,
            });
            // Get total count for pagination
            const total = await Comment_1.default.count({
                where: {
                    post_id: postId,
                    parent_id: null,
                    is_deleted: false,
                },
            });
            logger_1.default.info(`Post comments fetched successfully: ${comments.length} comments`);
            return {
                success: true,
                comments,
                total,
                message: 'Comments retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get post comments error:', error);
            return {
                success: false,
                error: 'Failed to retrieve comments',
            };
        }
    }
    static async getCommentReplies(commentId, page = 1, limit = 10) {
        try {
            logger_1.default.info(`Fetching replies for comment ${commentId}: page ${page}, limit ${limit}`);
            // Verify parent comment exists
            const parentComment = await Comment_1.default.findOne({
                where: { id: commentId, is_deleted: false },
            });
            if (!parentComment) {
                logger_1.default.warn(`Get replies failed: Parent comment not found ${commentId}`);
                return {
                    success: false,
                    error: 'Parent comment not found',
                };
            }
            const offset = (page - 1) * limit;
            const replies = await Comment_1.default.findAll({
                where: {
                    parent_id: commentId,
                    is_deleted: false,
                },
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                ],
                order: [['created_at', 'ASC']],
                limit,
                offset,
            });
            // Get total count for pagination
            const total = await Comment_1.default.count({
                where: {
                    parent_id: commentId,
                    is_deleted: false,
                },
            });
            logger_1.default.info(`Comment replies fetched successfully: ${replies.length} replies`);
            return {
                success: true,
                comments: replies,
                total,
                message: 'Replies retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get comment replies error:', error);
            return {
                success: false,
                error: 'Failed to retrieve replies',
            };
        }
    }
    static async getUserComments(userId, page = 1, limit = 20) {
        try {
            logger_1.default.info(`Fetching comments for user ${userId}: page ${page}, limit ${limit}`);
            const offset = (page - 1) * limit;
            const comments = await Comment_1.default.findAll({
                where: {
                    author_id: userId,
                    is_deleted: false,
                },
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                    {
                        model: Post_1.default,
                        as: 'post',
                        attributes: ['id', 'title'],
                        where: { is_deleted: false },
                    },
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });
            // Get total count for pagination
            const total = await Comment_1.default.count({
                where: {
                    author_id: userId,
                    is_deleted: false,
                },
                include: [
                    {
                        model: Post_1.default,
                        as: 'post',
                        where: { is_deleted: false },
                    },
                ],
            });
            logger_1.default.info(`User comments fetched successfully: ${comments.length} comments`);
            return {
                success: true,
                comments,
                total,
                message: 'User comments retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get user comments error:', error);
            return {
                success: false,
                error: 'Failed to retrieve user comments',
            };
        }
    }
    /**
     * Build hierarchical comment tree structure
     */
    static buildCommentTree(comments, level = 0) {
        const tree = [];
        const commentMap = new Map();
        // Group comments by parent_id
        comments.forEach(comment => {
            const parentId = comment.parent_id || 0;
            if (!commentMap.has(parentId)) {
                commentMap.set(parentId, []);
            }
            commentMap.get(parentId).push(comment);
        });
        // Build tree structure for top-level comments (parent_id = null/0)
        const topLevelComments = commentMap.get(0) || [];
        for (const comment of topLevelComments) {
            const replies = this.buildCommentTreeRecursive(comment.id, commentMap, level + 1);
            const replyCount = this.countReplies(comment.id, commentMap);
            // Include top-level comment if:
            // 1. It's not deleted, OR
            // 2. It's deleted but has non-deleted replies (to preserve structure)
            if (!comment.is_deleted || replies.length > 0) {
                tree.push({
                    comment,
                    replies,
                    replyCount,
                    level,
                });
            }
        }
        return tree;
    }
    /**
     * Recursively build comment tree structure
     */
    static buildCommentTreeRecursive(parentId, commentMap, level) {
        const tree = [];
        const children = commentMap.get(parentId) || [];
        for (const comment of children) {
            const replies = this.buildCommentTreeRecursive(comment.id, commentMap, level + 1);
            const replyCount = this.countReplies(comment.id, commentMap);
            // Include comment if:
            // 1. It's not deleted, OR
            // 2. It's deleted but has non-deleted replies (to preserve structure)
            if (!comment.is_deleted || replies.length > 0) {
                tree.push({
                    comment,
                    replies,
                    replyCount,
                    level,
                });
            }
        }
        return tree;
    }
    /**
     * Count total replies for a comment (including nested replies)
     */
    static countReplies(commentId, commentMap) {
        const directReplies = commentMap.get(commentId) || [];
        let totalCount = 0;
        // Count only non-deleted replies
        for (const reply of directReplies) {
            if (!reply.is_deleted) {
                totalCount += 1;
                totalCount += this.countReplies(reply.id, commentMap);
            }
            else {
                // For deleted replies, still count their children if they exist
                totalCount += this.countReplies(reply.id, commentMap);
            }
        }
        return totalCount;
    }
    /**
     * Get post comments with hierarchical tree structure
     */
    static async getPostCommentsTree(postId, page = 1, limit = 20, orderBy = 'created_at', maxDepth = 5) {
        try {
            logger_1.default.info(`Fetching comment tree for post ${postId}: page ${page}, limit ${limit}, maxDepth ${maxDepth}`);
            // Verify post exists
            const post = await Post_1.default.findActivePostById(postId);
            if (!post) {
                logger_1.default.warn(`Get comment tree failed: Post not found ${postId}`);
                return {
                    success: false,
                    error: 'Post not found',
                };
            }
            const validOrderColumns = ['created_at', 'updated_at'];
            const orderColumn = validOrderColumns.includes(orderBy) ? orderBy : 'created_at';
            // Get all comments for the post including deleted ones (we'll build the tree structure in memory)
            // We need deleted comments to preserve the hierarchy structure
            const allComments = await Comment_1.default.findAll({
                where: {
                    post_id: postId,
                },
                include: [
                    {
                        model: User_1.default,
                        as: 'author',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                ],
                order: [[orderColumn, 'ASC']],
            });
            // Build the hierarchical tree structure
            const commentTree = this.buildCommentTree(allComments);
            // Apply pagination to top-level comments only
            const offset = (page - 1) * limit;
            const paginatedTree = commentTree.slice(offset, offset + limit);
            // Get total count of top-level comments for pagination
            const total = await Comment_1.default.count({
                where: {
                    post_id: postId,
                    parent_id: null,
                    is_deleted: false,
                },
            });
            logger_1.default.info(`Comment tree fetched successfully: ${commentTree.length} top-level comments`);
            return {
                success: true,
                commentTree: paginatedTree,
                total,
                message: 'Comment tree retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get comment tree error:', error);
            return {
                success: false,
                error: 'Failed to retrieve comment tree',
            };
        }
    }
    /**
     * Get flattened comment structure with level indicators
     */
    static async getPostCommentsFlattened(postId, page = 1, limit = 50, orderBy = 'created_at', maxDepth = 5) {
        try {
            logger_1.default.info(`Fetching flattened comments for post ${postId}: page ${page}, limit ${limit}, maxDepth ${maxDepth}`);
            // Get the comment tree first
            const treeResult = await this.getPostCommentsTree(postId, page, limit, orderBy, maxDepth);
            if (!treeResult.success || !treeResult.commentTree) {
                return {
                    success: false,
                    error: treeResult.error || 'Failed to build comment tree',
                };
            }
            // Flatten the tree structure
            const flattenedComments = [];
            const flattenTree = (tree) => {
                for (const node of tree) {
                    // Add level property to comment for display purposes
                    node.comment.level = node.level;
                    node.comment.replyCount = node.replyCount;
                    flattenedComments.push(node.comment);
                    // Recursively add replies
                    if (node.replies.length > 0) {
                        flattenTree(node.replies);
                    }
                }
            };
            flattenTree(treeResult.commentTree);
            logger_1.default.info(`Flattened comments retrieved: ${flattenedComments.length} comments`);
            return {
                success: true,
                comments: flattenedComments,
                total: treeResult.total,
                message: 'Flattened comments retrieved successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Get flattened comments error:', error);
            return {
                success: false,
                error: 'Failed to retrieve flattened comments',
            };
        }
    }
    /**
     * Sort comments with different strategies
     */
    static async getPostCommentsSorted(postId, sortBy = 'oldest', page = 1, limit = 20) {
        try {
            logger_1.default.info(`Fetching sorted comments for post ${postId}: sortBy ${sortBy}, page ${page}, limit ${limit}`);
            let orderBy;
            switch (sortBy) {
                case 'newest':
                    orderBy = 'created_at';
                    break;
                case 'most_replies':
                    // For most replies, we'll need to count after building the tree
                    orderBy = 'created_at';
                    break;
                case 'oldest':
                default:
                    orderBy = 'created_at';
                    break;
            }
            const treeResult = await this.getPostCommentsTree(postId, page, limit, orderBy);
            if (!treeResult.success || !treeResult.commentTree) {
                return treeResult;
            }
            // Apply custom sorting if needed
            if (sortBy === 'newest') {
                treeResult.commentTree.sort((a, b) => new Date(b.comment.created_at).getTime() - new Date(a.comment.created_at).getTime());
            }
            else if (sortBy === 'most_replies') {
                treeResult.commentTree.sort((a, b) => b.replyCount - a.replyCount);
            }
            logger_1.default.info(`Sorted comments retrieved successfully: ${treeResult.commentTree.length} comments`);
            return {
                ...treeResult,
                message: `Comments sorted by ${sortBy} retrieved successfully`,
            };
        }
        catch (error) {
            logger_1.default.error('Get sorted comments error:', error);
            return {
                success: false,
                error: 'Failed to retrieve sorted comments',
            };
        }
    }
}
exports.CommentService = CommentService;
//# sourceMappingURL=commentService.js.map