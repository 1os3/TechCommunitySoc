"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentController = void 0;
const commentService_1 = require("../services/commentService");
const logger_1 = __importDefault(require("../utils/logger"));
class CommentController {
    static async createComment(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    error: {
                        code: 'NOT_AUTHENTICATED',
                        message: 'Authentication required',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const commentData = {
                content: req.body.content,
                post_id: parseInt(req.params.postId),
                author_id: req.user.id,
                parent_id: req.body.parent_id ? parseInt(req.body.parent_id) : undefined,
            };
            if (isNaN(commentData.post_id)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_POST_ID',
                        message: 'Invalid post ID',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await commentService_1.CommentService.createComment(commentData);
            if (!result.success) {
                const statusCode = result.error === 'Post not found' || result.error === 'Parent comment not found' ? 404 : 400;
                res.status(statusCode).json({
                    error: {
                        code: 'COMMENT_CREATION_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            // Fetch the created comment with author information
            const commentWithAuthor = await commentService_1.CommentService.getCommentById(result.comment.id);
            if (!commentWithAuthor.success || !commentWithAuthor.comment) {
                res.status(500).json({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Comment created but failed to retrieve with author info',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(201).json({
                success: true,
                message: result.message,
                data: {
                    comment: {
                        id: commentWithAuthor.comment.id,
                        content: commentWithAuthor.comment.content,
                        post_id: commentWithAuthor.comment.post_id,
                        author_id: commentWithAuthor.comment.author_id,
                        parent_id: commentWithAuthor.comment.parent_id,
                        author: commentWithAuthor.comment.author,
                        created_at: commentWithAuthor.comment.created_at,
                        updated_at: commentWithAuthor.comment.updated_at,
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Create comment controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Comment creation failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async getComment(req, res) {
        try {
            const commentId = parseInt(req.params.id);
            if (isNaN(commentId)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_COMMENT_ID',
                        message: 'Invalid comment ID',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await commentService_1.CommentService.getCommentById(commentId);
            if (!result.success) {
                const statusCode = result.error === 'Comment not found' ? 404 : 400;
                res.status(statusCode).json({
                    error: {
                        code: 'COMMENT_NOT_FOUND',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    comment: {
                        id: result.comment.id,
                        content: result.comment.content,
                        post_id: result.comment.post_id,
                        author_id: result.comment.author_id,
                        parent_id: result.comment.parent_id,
                        author: result.comment.author,
                        created_at: result.comment.created_at,
                        updated_at: result.comment.updated_at,
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get comment controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve comment',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async updateComment(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    error: {
                        code: 'NOT_AUTHENTICATED',
                        message: 'Authentication required',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const commentId = parseInt(req.params.id);
            if (isNaN(commentId)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_COMMENT_ID',
                        message: 'Invalid comment ID',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const updateData = {
                content: req.body.content,
            };
            const result = await commentService_1.CommentService.updateComment(commentId, req.user.id, updateData);
            if (!result.success) {
                const statusCode = result.error === 'Comment not found' ? 404 :
                    result.error === 'You can only edit your own comments' ? 403 : 400;
                res.status(statusCode).json({
                    error: {
                        code: 'COMMENT_UPDATE_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    comment: {
                        id: result.comment.id,
                        content: result.comment.content,
                        post_id: result.comment.post_id,
                        author_id: result.comment.author_id,
                        parent_id: result.comment.parent_id,
                        created_at: result.comment.created_at,
                        updated_at: result.comment.updated_at,
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Update comment controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Comment update failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async deleteComment(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    error: {
                        code: 'NOT_AUTHENTICATED',
                        message: 'Authentication required',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const commentId = parseInt(req.params.id);
            if (isNaN(commentId)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_COMMENT_ID',
                        message: 'Invalid comment ID',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await commentService_1.CommentService.deleteComment(commentId, req.user.id);
            if (!result.success) {
                const statusCode = result.error === 'Comment not found' ? 404 :
                    result.error === 'You can only delete your own comments' ? 403 : 400;
                res.status(statusCode).json({
                    error: {
                        code: 'COMMENT_DELETION_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Delete comment controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Comment deletion failed due to server error',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async getPostComments(req, res) {
        try {
            const postId = parseInt(req.params.postId);
            if (isNaN(postId)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_POST_ID',
                        message: 'Invalid post ID',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const orderBy = req.query.orderBy || 'created_at';
            // Validate pagination parameters
            if (page < 1 || limit < 1 || limit > 100) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_PAGINATION',
                        message: 'Invalid pagination parameters',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await commentService_1.CommentService.getPostComments(postId, page, limit, orderBy);
            if (!result.success) {
                const statusCode = result.error === 'Post not found' ? 404 : 400;
                res.status(statusCode).json({
                    error: {
                        code: 'GET_COMMENTS_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    comments: result.comments.map(comment => ({
                        id: comment.id,
                        content: comment.content,
                        post_id: comment.post_id,
                        author_id: comment.author_id,
                        parent_id: comment.parent_id,
                        author: comment.author,
                        created_at: comment.created_at,
                        updated_at: comment.updated_at,
                    })),
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / limit),
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get post comments controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve comments',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async getCommentReplies(req, res) {
        try {
            const commentId = parseInt(req.params.id);
            if (isNaN(commentId)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_COMMENT_ID',
                        message: 'Invalid comment ID',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            // Validate pagination parameters
            if (page < 1 || limit < 1 || limit > 100) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_PAGINATION',
                        message: 'Invalid pagination parameters',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await commentService_1.CommentService.getCommentReplies(commentId, page, limit);
            if (!result.success) {
                const statusCode = result.error === 'Parent comment not found' ? 404 : 400;
                res.status(statusCode).json({
                    error: {
                        code: 'GET_REPLIES_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    replies: result.comments.map(comment => ({
                        id: comment.id,
                        content: comment.content,
                        post_id: comment.post_id,
                        author_id: comment.author_id,
                        parent_id: comment.parent_id,
                        author: comment.author,
                        created_at: comment.created_at,
                        updated_at: comment.updated_at,
                    })),
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / limit),
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get comment replies controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve replies',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async getUserComments(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_USER_ID',
                        message: 'Invalid user ID',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            // Validate pagination parameters
            if (page < 1 || limit < 1 || limit > 100) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_PAGINATION',
                        message: 'Invalid pagination parameters',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await commentService_1.CommentService.getUserComments(userId, page, limit);
            if (!result.success) {
                res.status(400).json({
                    error: {
                        code: 'GET_USER_COMMENTS_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    comments: result.comments.map(comment => ({
                        id: comment.id,
                        content: comment.content,
                        post_id: comment.post_id,
                        author_id: comment.author_id,
                        parent_id: comment.parent_id,
                        author: comment.author,
                        post: comment.post,
                        created_at: comment.created_at,
                        updated_at: comment.updated_at,
                    })),
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / limit),
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get user comments controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve user comments',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async getPostCommentsTree(req, res) {
        try {
            const postId = parseInt(req.params.postId);
            if (isNaN(postId)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_POST_ID',
                        message: 'Invalid post ID',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const orderBy = req.query.orderBy || 'created_at';
            const maxDepth = parseInt(req.query.maxDepth) || 5;
            // Validate pagination parameters
            if (page < 1 || limit < 1 || limit > 100 || maxDepth < 1 || maxDepth > 50) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_PARAMETERS',
                        message: 'Invalid pagination or depth parameters',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await commentService_1.CommentService.getPostCommentsTree(postId, page, limit, orderBy, maxDepth);
            if (!result.success) {
                const statusCode = result.error === 'Post not found' ? 404 : 400;
                res.status(statusCode).json({
                    error: {
                        code: 'GET_COMMENT_TREE_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    commentTree: result.commentTree,
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / limit),
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get comment tree controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve comment tree',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async getPostCommentsFlattened(req, res) {
        try {
            const postId = parseInt(req.params.postId);
            if (isNaN(postId)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_POST_ID',
                        message: 'Invalid post ID',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const orderBy = req.query.orderBy || 'created_at';
            const maxDepth = parseInt(req.query.maxDepth) || 5;
            // Validate pagination parameters
            if (page < 1 || limit < 1 || limit > 100 || maxDepth < 1 || maxDepth > 50) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_PARAMETERS',
                        message: 'Invalid pagination or depth parameters',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await commentService_1.CommentService.getPostCommentsFlattened(postId, page, limit, orderBy, maxDepth);
            if (!result.success) {
                const statusCode = result.error === 'Post not found' ? 404 : 400;
                res.status(statusCode).json({
                    error: {
                        code: 'GET_FLATTENED_COMMENTS_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    comments: result.comments.map(comment => ({
                        id: comment.id,
                        content: comment.content,
                        post_id: comment.post_id,
                        author_id: comment.author_id,
                        parent_id: comment.parent_id,
                        author: comment.author,
                        level: comment.level || 0,
                        replyCount: comment.replyCount || 0,
                        created_at: comment.created_at,
                        updated_at: comment.updated_at,
                    })),
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / limit),
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get flattened comments controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve flattened comments',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    static async getPostCommentsSorted(req, res) {
        try {
            const postId = parseInt(req.params.postId);
            if (isNaN(postId)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_POST_ID',
                        message: 'Invalid post ID',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const sortBy = req.query.sortBy || 'oldest';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const validSortOptions = ['oldest', 'newest', 'most_replies'];
            if (!validSortOptions.includes(sortBy)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_SORT_OPTION',
                        message: 'Invalid sort option. Must be one of: oldest, newest, most_replies',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            // Validate pagination parameters
            if (page < 1 || limit < 1 || limit > 100) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_PAGINATION',
                        message: 'Invalid pagination parameters',
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            const result = await commentService_1.CommentService.getPostCommentsSorted(postId, sortBy, page, limit);
            if (!result.success) {
                const statusCode = result.error === 'Post not found' ? 404 : 400;
                res.status(statusCode).json({
                    error: {
                        code: 'GET_SORTED_COMMENTS_FAILED',
                        message: result.error,
                        timestamp: new Date().toISOString(),
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    commentTree: result.commentTree,
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / limit),
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get sorted comments controller error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve sorted comments',
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
}
exports.CommentController = CommentController;
//# sourceMappingURL=commentController.js.map