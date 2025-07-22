"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViolationService = void 0;
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const logger_1 = __importDefault(require("../utils/logger"));
class ViolationService {
    /**
     * Check content for violations using both simple words and regex patterns
     */
    static async detectViolations(content) {
        try {
            const violationWords = await models_1.ViolationWord.findAll({
                where: { is_active: true },
                order: [['id', 'ASC']]
            });
            const violations = [];
            const contentLower = content.toLowerCase();
            for (const violationWord of violationWords) {
                try {
                    if (violationWord.is_regex) {
                        // Handle regex patterns
                        const regex = new RegExp(violationWord.word, 'gi');
                        let match;
                        while ((match = regex.exec(content)) !== null) {
                            violations.push({
                                word: violationWord.word,
                                matchedText: match[0],
                                isRegex: true,
                                violationWordId: violationWord.id
                            });
                        }
                    }
                    else {
                        // Handle simple word matching
                        const wordLower = violationWord.word.toLowerCase();
                        if (contentLower.includes(wordLower)) {
                            // Find the actual matched text with original case
                            const startIndex = contentLower.indexOf(wordLower);
                            const matchedText = content.substring(startIndex, startIndex + wordLower.length);
                            violations.push({
                                word: violationWord.word,
                                matchedText: matchedText,
                                isRegex: false,
                                violationWordId: violationWord.id
                            });
                        }
                    }
                }
                catch (regexError) {
                    logger_1.default.error(`Invalid regex pattern in violation word ${violationWord.id}: ${violationWord.word}`, regexError);
                    // Continue with other patterns
                }
            }
            return {
                hasViolations: violations.length > 0,
                violations
            };
        }
        catch (error) {
            logger_1.default.error('Violation detection error:', error);
            return {
                hasViolations: false,
                violations: []
            };
        }
    }
    /**
     * Record violations in the database
     */
    static async recordViolations(userId, contentType, contentId, content, violations) {
        try {
            for (const violation of violations) {
                // Create content snippet (100 chars around the violation)
                const matchIndex = content.toLowerCase().indexOf(violation.matchedText.toLowerCase());
                const start = Math.max(0, matchIndex - 50);
                const end = Math.min(content.length, matchIndex + violation.matchedText.length + 50);
                const snippet = content.substring(start, end);
                await models_1.Violation.create({
                    user_id: userId,
                    content_type: contentType,
                    content_id: contentId,
                    violation_word_id: violation.violationWordId,
                    matched_text: violation.matchedText,
                    content_snippet: snippet,
                    status: 'pending'
                });
            }
            return true;
        }
        catch (error) {
            logger_1.default.error('Record violations error:', error);
            return false;
        }
    }
    /**
     * Get users with violations exceeding threshold in time period
     */
    static async getViolationStats(adminId, days = 10, threshold = 15) {
        try {
            // Verify admin access
            const admin = await models_1.User.findByPk(adminId);
            if (!admin?.is_admin) {
                return {
                    success: false,
                    error: 'Unauthorized: Admin access required'
                };
            }
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const query = `
        SELECT 
          v.user_id,
          u.username,
          COUNT(*) as violation_count,
          MAX(v.detected_at) as last_violation
        FROM violations v
        JOIN users u ON v.user_id = u.id
        WHERE v.detected_at >= :cutoffDate
        GROUP BY v.user_id, u.username
        HAVING COUNT(*) >= :threshold
        ORDER BY violation_count DESC, last_violation DESC
      `;
            const rawResults = await models_1.Violation.sequelize.query(query, {
                replacements: { cutoffDate, threshold },
                type: sequelize_1.QueryTypes.SELECT
            });
            // Map the raw results to ensure correct field names
            const results = rawResults.map(row => ({
                userId: row.user_id,
                username: row.username,
                violationCount: parseInt(row.violation_count) || 0,
                lastViolation: row.last_violation
            }));
            return {
                success: true,
                message: `Found ${results.length} users with ${threshold}+ violations in last ${days} days`,
                stats: results
            };
        }
        catch (error) {
            logger_1.default.error('Get violation stats error:', error);
            return {
                success: false,
                error: 'Failed to get violation statistics'
            };
        }
    }
    /**
     * Get all violation words for admin management
     */
    static async getViolationWords(adminId) {
        try {
            // Verify admin access
            const admin = await models_1.User.findByPk(adminId);
            if (!admin?.is_admin) {
                return {
                    success: false,
                    error: 'Unauthorized: Admin access required'
                };
            }
            const violationWords = await models_1.ViolationWord.findAll({
                include: [
                    {
                        model: models_1.User,
                        as: 'creator',
                        attributes: ['id', 'username']
                    }
                ],
                order: [['created_at', 'DESC']]
            });
            return {
                success: true,
                violationWords: violationWords.map(vw => vw.toJSON()),
                total: violationWords.length
            };
        }
        catch (error) {
            logger_1.default.error('Get violation words error:', error);
            return {
                success: false,
                error: 'Failed to get violation words'
            };
        }
    }
    /**
     * Add a new violation word
     */
    static async addViolationWord(adminId, word, isRegex = false) {
        try {
            // Verify admin access
            const admin = await models_1.User.findByPk(adminId);
            if (!admin?.is_admin) {
                return {
                    success: false,
                    error: 'Unauthorized: Admin access required'
                };
            }
            // Validate regex if it's a regex pattern
            if (isRegex) {
                try {
                    new RegExp(word);
                }
                catch (regexError) {
                    return {
                        success: false,
                        error: 'Invalid regex pattern'
                    };
                }
            }
            // Check for duplicates
            const existing = await models_1.ViolationWord.findOne({
                where: { word, is_regex: isRegex }
            });
            if (existing) {
                return {
                    success: false,
                    error: 'Violation word already exists'
                };
            }
            const violationWord = await models_1.ViolationWord.create({
                word,
                is_regex: isRegex,
                is_active: true,
                created_by: adminId
            });
            return {
                success: true,
                message: 'Violation word added successfully',
                violationWords: [violationWord.toJSON()]
            };
        }
        catch (error) {
            logger_1.default.error('Add violation word error:', error);
            return {
                success: false,
                error: 'Failed to add violation word'
            };
        }
    }
    /**
     * Remove a violation word
     */
    static async removeViolationWord(adminId, wordId) {
        try {
            // Verify admin access
            const admin = await models_1.User.findByPk(adminId);
            if (!admin?.is_admin) {
                return {
                    success: false,
                    error: 'Unauthorized: Admin access required'
                };
            }
            const violationWord = await models_1.ViolationWord.findByPk(wordId);
            if (!violationWord) {
                return {
                    success: false,
                    error: 'Violation word not found'
                };
            }
            await violationWord.destroy();
            return {
                success: true,
                message: 'Violation word removed successfully'
            };
        }
        catch (error) {
            logger_1.default.error('Remove violation word error:', error);
            return {
                success: false,
                error: 'Failed to remove violation word'
            };
        }
    }
    /**
     * Get all violations for admin review
     */
    static async getViolations(adminId, page = 1, limit = 20, status) {
        try {
            // Verify admin access
            const admin = await models_1.User.findByPk(adminId);
            if (!admin?.is_admin) {
                return {
                    success: false,
                    error: 'Unauthorized: Admin access required'
                };
            }
            const offset = (page - 1) * limit;
            const whereClause = {};
            if (status) {
                whereClause.status = status;
            }
            const { count, rows } = await models_1.Violation.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: models_1.User,
                        as: 'user',
                        attributes: ['id', 'username']
                    },
                    {
                        model: models_1.User,
                        as: 'reviewer',
                        attributes: ['id', 'username']
                    },
                    {
                        model: models_1.ViolationWord,
                        as: 'violation_word',
                        attributes: ['id', 'word', 'is_regex']
                    }
                ],
                offset,
                limit,
                order: [['detected_at', 'DESC']]
            });
            return {
                success: true,
                violations: rows.map(v => v.toJSON()),
                total: count
            };
        }
        catch (error) {
            logger_1.default.error('Get violations error:', error);
            return {
                success: false,
                error: 'Failed to get violations'
            };
        }
    }
    /**
     * Update violation status
     */
    static async updateViolationStatus(adminId, violationId, status, notes) {
        try {
            // Verify admin access
            const admin = await models_1.User.findByPk(adminId);
            if (!admin?.is_admin) {
                return {
                    success: false,
                    error: 'Unauthorized: Admin access required'
                };
            }
            const violation = await models_1.Violation.findByPk(violationId);
            if (!violation) {
                return {
                    success: false,
                    error: 'Violation not found'
                };
            }
            await violation.update({
                status,
                reviewed_by: adminId,
                reviewed_at: new Date(),
                notes
            });
            return {
                success: true,
                message: 'Violation status updated successfully'
            };
        }
        catch (error) {
            logger_1.default.error('Update violation status error:', error);
            return {
                success: false,
                error: 'Failed to update violation status'
            };
        }
    }
}
exports.ViolationService = ViolationService;
//# sourceMappingURL=violationService.js.map