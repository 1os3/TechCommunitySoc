import { ViolationWord, Violation, User } from '../models';
import { QueryTypes } from 'sequelize';
import logger from '../utils/logger';

export interface ViolationDetectionResult {
  hasViolations: boolean;
  violations: Array<{
    word: string;
    matchedText: string;
    isRegex: boolean;
    violationWordId: number;
  }>;
}

export interface ViolationStats {
  userId: number;
  username: string;
  violationCount: number;
  lastViolation: Date;
}

export interface AdminViolationResult {
  success: boolean;
  message?: string;
  error?: string;
  violations?: any[];
  total?: number;
  stats?: ViolationStats[];
  violationWords?: any[];
}

export class ViolationService {
  /**
   * Check content for violations using both simple words and regex patterns
   */
  static async detectViolations(content: string): Promise<ViolationDetectionResult> {
    try {
      const violationWords = await ViolationWord.findAll({
        where: { is_active: true },
        order: [['id', 'ASC']]
      });

      const violations: ViolationDetectionResult['violations'] = [];
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
          } else {
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
        } catch (regexError) {
          logger.error(`Invalid regex pattern in violation word ${violationWord.id}: ${violationWord.word}`, regexError);
          // Continue with other patterns
        }
      }

      return {
        hasViolations: violations.length > 0,
        violations
      };
    } catch (error) {
      logger.error('Violation detection error:', error);
      return {
        hasViolations: false,
        violations: []
      };
    }
  }

  /**
   * Record violations in the database
   */
  static async recordViolations(
    userId: number,
    contentType: 'post' | 'comment',
    contentId: number,
    content: string,
    violations: ViolationDetectionResult['violations']
  ): Promise<boolean> {
    try {
      for (const violation of violations) {
        // Create content snippet (100 chars around the violation)
        const matchIndex = content.toLowerCase().indexOf(violation.matchedText.toLowerCase());
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(content.length, matchIndex + violation.matchedText.length + 50);
        const snippet = content.substring(start, end);

        await Violation.create({
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
    } catch (error) {
      logger.error('Record violations error:', error);
      return false;
    }
  }

  /**
   * Get users with violations exceeding threshold in time period
   */
  static async getViolationStats(
    adminId: number, 
    days: number = 10, 
    threshold: number = 15
  ): Promise<AdminViolationResult> {
    try {
      // Verify admin access
      const admin = await User.findByPk(adminId);
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

      const rawResults = await Violation.sequelize!.query(query, {
        replacements: { cutoffDate, threshold },
        type: QueryTypes.SELECT
      }) as any[];

      // Map the raw results to ensure correct field names
      const results: ViolationStats[] = rawResults.map(row => ({
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
    } catch (error) {
      logger.error('Get violation stats error:', error);
      return {
        success: false,
        error: 'Failed to get violation statistics'
      };
    }
  }

  /**
   * Get all violation words for admin management
   */
  static async getViolationWords(adminId: number): Promise<AdminViolationResult> {
    try {
      // Verify admin access
      const admin = await User.findByPk(adminId);
      if (!admin?.is_admin) {
        return {
          success: false,
          error: 'Unauthorized: Admin access required'
        };
      }

      const violationWords = await ViolationWord.findAll({
        include: [
          {
            model: User,
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
    } catch (error) {
      logger.error('Get violation words error:', error);
      return {
        success: false,
        error: 'Failed to get violation words'
      };
    }
  }

  /**
   * Add a new violation word
   */
  static async addViolationWord(
    adminId: number,
    word: string,
    isRegex: boolean = false
  ): Promise<AdminViolationResult> {
    try {
      // Verify admin access
      const admin = await User.findByPk(adminId);
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
        } catch (regexError) {
          return {
            success: false,
            error: 'Invalid regex pattern'
          };
        }
      }

      // Check for duplicates
      const existing = await ViolationWord.findOne({
        where: { word, is_regex: isRegex }
      });

      if (existing) {
        return {
          success: false,
          error: 'Violation word already exists'
        };
      }

      const violationWord = await ViolationWord.create({
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
    } catch (error) {
      logger.error('Add violation word error:', error);
      return {
        success: false,
        error: 'Failed to add violation word'
      };
    }
  }

  /**
   * Remove a violation word
   */
  static async removeViolationWord(adminId: number, wordId: number): Promise<AdminViolationResult> {
    try {
      // Verify admin access
      const admin = await User.findByPk(adminId);
      if (!admin?.is_admin) {
        return {
          success: false,
          error: 'Unauthorized: Admin access required'
        };
      }

      const violationWord = await ViolationWord.findByPk(wordId);
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
    } catch (error) {
      logger.error('Remove violation word error:', error);
      return {
        success: false,
        error: 'Failed to remove violation word'
      };
    }
  }

  /**
   * Get all violations for admin review
   */
  static async getViolations(
    adminId: number,
    page: number = 1,
    limit: number = 20,
    status?: 'pending' | 'reviewed' | 'ignored'
  ): Promise<AdminViolationResult> {
    try {
      // Verify admin access
      const admin = await User.findByPk(adminId);
      if (!admin?.is_admin) {
        return {
          success: false,
          error: 'Unauthorized: Admin access required'
        };
      }

      const offset = (page - 1) * limit;
      const whereClause: any = {};
      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await Violation.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          },
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'username']
          },
          {
            model: ViolationWord,
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
    } catch (error) {
      logger.error('Get violations error:', error);
      return {
        success: false,
        error: 'Failed to get violations'
      };
    }
  }

  /**
   * Update violation status
   */
  static async updateViolationStatus(
    adminId: number,
    violationId: number,
    status: 'pending' | 'reviewed' | 'ignored',
    notes?: string
  ): Promise<AdminViolationResult> {
    try {
      // Verify admin access
      const admin = await User.findByPk(adminId);
      if (!admin?.is_admin) {
        return {
          success: false,
          error: 'Unauthorized: Admin access required'
        };
      }

      const violation = await Violation.findByPk(violationId);
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
    } catch (error) {
      logger.error('Update violation status error:', error);
      return {
        success: false,
        error: 'Failed to update violation status'
      };
    }
  }
}