"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const violationService_1 = require("../services/violationService");
const logger_1 = __importDefault(require("../utils/logger"));
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
class ContentController {
    /**
     * Get posts for admin management
     */
    static async getPosts(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const search = req.query.search;
            const status = req.query.status; // 'active', 'deleted', 'all'
            const offset = (page - 1) * limit;
            const whereClause = {};
            // Filter by search term
            if (search) {
                whereClause[sequelize_1.Op.or] = [
                    { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { content: { [sequelize_1.Op.iLike]: `%${search}%` } }
                ];
            }
            // Filter by status
            if (status === 'deleted') {
                whereClause.is_deleted = true;
            }
            else if (status === 'active') {
                whereClause.is_deleted = false;
            }
            // 'all' shows both
            const { count, rows } = await models_1.Post.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: models_1.User,
                        as: 'author',
                        attributes: ['id', 'username']
                    }
                ],
                offset,
                limit,
                order: [['created_at', 'DESC']],
                paranoid: false // Include soft-deleted posts
            });
            res.status(200).json({
                success: true,
                data: {
                    posts: rows.map(post => ({
                        id: post.id,
                        title: post.title,
                        content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
                        author: post.author?.username,
                        author_id: post.author_id,
                        view_count: post.view_count,
                        like_count: post.like_count,
                        comment_count: post.comment_count,
                        is_deleted: post.is_deleted,
                        created_at: post.created_at,
                        updated_at: post.updated_at
                    })),
                    page,
                    limit,
                    total: count,
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get posts for admin error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Get comments for admin management
     */
    static async getComments(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const search = req.query.search;
            const status = req.query.status; // 'active', 'deleted', 'all'
            const postId = req.query.postId;
            const offset = (page - 1) * limit;
            const whereClause = {};
            // Filter by search term
            if (search) {
                whereClause.content = { [sequelize_1.Op.iLike]: `%${search}%` };
            }
            // Filter by post
            if (postId) {
                whereClause.post_id = parseInt(postId);
            }
            // Filter by status
            if (status === 'deleted') {
                whereClause.is_deleted = true;
            }
            else if (status === 'active') {
                whereClause.is_deleted = false;
            }
            const { count, rows } = await models_1.Comment.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: models_1.User,
                        as: 'author',
                        attributes: ['id', 'username']
                    },
                    {
                        model: models_1.Post,
                        as: 'post',
                        attributes: ['id', 'title']
                    }
                ],
                offset,
                limit,
                order: [['created_at', 'DESC']],
                paranoid: false // Include soft-deleted comments
            });
            res.status(200).json({
                success: true,
                data: {
                    comments: rows.map(comment => ({
                        id: comment.id,
                        content: comment.content.substring(0, 150) + (comment.content.length > 150 ? '...' : ''),
                        author: comment.author?.username,
                        author_id: comment.author_id,
                        post_title: comment.post?.title,
                        post_id: comment.post_id,
                        parent_id: comment.parent_id,
                        like_count: comment.like_count,
                        is_deleted: comment.is_deleted,
                        created_at: comment.created_at,
                        updated_at: comment.updated_at
                    })),
                    page,
                    limit,
                    total: count,
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error('Get comments for admin error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Get violations for admin review
     */
    static async getViolations(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const status = req.query.status;
            const result = await violationService_1.ViolationService.getViolations(adminId, page, limit, status);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: {
                        violations: result.violations,
                        page,
                        limit,
                        total: result.total,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Get violations error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Update violation status
     */
    static async updateViolationStatus(req, res) {
        try {
            const adminId = req.user?.id;
            const { violationId } = req.params;
            const { status, notes } = req.body;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const violationIdNum = parseInt(violationId);
            if (isNaN(violationIdNum)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid violation ID',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            if (!['pending', 'reviewed', 'ignored'].includes(status)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid status. Must be pending, reviewed, or ignored',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await violationService_1.ViolationService.updateViolationStatus(adminId, violationIdNum, status, notes);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 :
                    result.error?.includes('not found') ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Update violation status error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Get violation statistics
     */
    static async getViolationStats(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const days = parseInt(req.query.days) || 10;
            const threshold = parseInt(req.query.threshold) || 15;
            const result = await violationService_1.ViolationService.getViolationStats(adminId, days, threshold);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: {
                        stats: result.stats,
                        days,
                        threshold,
                    },
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Get violation stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Get violation words
     */
    static async getViolationWords(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await violationService_1.ViolationService.getViolationWords(adminId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: {
                        violation_words: result.violationWords,
                        total: result.total,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Get violation words error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Add violation word
     */
    static async addViolationWord(req, res) {
        try {
            const adminId = req.user?.id;
            const { word, is_regex } = req.body;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            if (!word || typeof word !== 'string' || word.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Word is required and must be a non-empty string',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await violationService_1.ViolationService.addViolationWord(adminId, word.trim(), Boolean(is_regex));
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: result.message,
                    data: {
                        violation_word: result.violationWords?.[0],
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 :
                    result.error?.includes('already exists') ? 409 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Add violation word error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Remove violation word
     */
    static async removeViolationWord(req, res) {
        try {
            const adminId = req.user?.id;
            const { wordId } = req.params;
            if (!adminId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const wordIdNum = parseInt(wordId);
            if (isNaN(wordIdNum)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid word ID',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = await violationService_1.ViolationService.removeViolationWord(adminId, wordIdNum);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const statusCode = result.error?.includes('Unauthorized') ? 403 :
                    result.error?.includes('not found') ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Remove violation word error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
            });
        }
    }
}
exports.ContentController = ContentController;
//# sourceMappingURL=contentController.js.map