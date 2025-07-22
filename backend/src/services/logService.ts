import { AdminService } from './adminService';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service?: string;
  userId?: number;
  stack?: string;
}

export interface LogResult {
  success: boolean;
  logs?: LogEntry[];
  message?: string;
  error?: string;
  total?: number;
}

export class LogService {
  // Clear all logs (admin access required)
  static async clearAllLogs(adminId: number): Promise<LogResult> {
    try {
      logger.info(`Clear all logs request by admin: ${adminId}`);

      // Verify the requesting user is an admin
      const isAdmin = await AdminService.verifyAdminAccess(adminId);
      if (!isAdmin) {
        logger.warn(`Unauthorized clear all logs request by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      // Get the current log file path
      const logDir = process.env.LOG_DIR || 'logs';
      const logFile = path.join(logDir, 'combined.log');

      // Check if log file exists
      if (!fs.existsSync(logFile)) {
        logger.info(`Clear all logs: No log file found at ${logFile}`);
        return {
          success: true,
          message: 'No log file found to clear',
          total: 0,
        };
      }

      // Count existing logs before clearing
      const logContent = fs.readFileSync(logFile, 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim());
      const totalLogs = logLines.length;

      // Clear the log file by writing empty content
      fs.writeFileSync(logFile, '');

      logger.info(`All logs cleared by admin ${adminId}: ${totalLogs} logs removed`);

      return {
        success: true,
        message: `All logs cleared successfully. Removed ${totalLogs} logs.`,
        total: totalLogs,
      };
    } catch (error) {
      logger.error('Clear all logs error:', error);
      return {
        success: false,
        error: 'Failed to clear all logs',
      };
    }
  }

  // Clear old logs (admin access required)
  static async clearLogs(
    adminId: number, 
    olderThanDays: number = 30,
    level?: string
  ): Promise<LogResult> {
    try {
      logger.info(`Log cleanup request by admin: ${adminId}, older than ${olderThanDays} days, level: ${level || 'all'}`);

      // Verify the requesting user is an admin
      const isAdmin = await AdminService.verifyAdminAccess(adminId);
      if (!isAdmin) {
        logger.warn(`Unauthorized log cleanup request by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      // Get the current log file path
      const logDir = process.env.LOG_DIR || 'logs';
      const logFile = path.join(logDir, 'combined.log');

      // Check if log file exists
      if (!fs.existsSync(logFile)) {
        logger.info(`Log cleanup: No log file found at ${logFile}`);
        return {
          success: true,
          message: 'No log file found to clean',
          total: 0,
        };
      }

      // Read log file
      const logContent = fs.readFileSync(logFile, 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim());

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Filter logs to keep (newer than cutoff date and not matching level filter)
      const filteredLines: string[] = [];
      let removedCount = 0;

      for (const line of logLines) {
        try {
          // Try to parse as JSON (Winston format)
          const logEntry = JSON.parse(line);
          const logDate = new Date(logEntry.timestamp);

          // Keep log if it's newer than cutoff date
          if (logDate >= cutoffDate) {
            // If level filter specified, remove logs of that level
            if (level && logEntry.level === level) {
              removedCount++;
            } else {
              filteredLines.push(line);
            }
          } else {
            // Log is older than cutoff, remove it
            removedCount++;
          }
        } catch (parseError) {
          // If JSON parsing fails, keep the line (might be important system info)
          filteredLines.push(line);
        }
      }

      // Write filtered logs back to file
      const newLogContent = filteredLines.join('\n');
      fs.writeFileSync(logFile, newLogContent);

      logger.info(`Log cleanup completed by admin ${adminId}: ${removedCount} logs removed, ${filteredLines.length} logs retained`);

      return {
        success: true,
        message: `Log cleanup completed. Removed ${removedCount} logs, retained ${filteredLines.length} logs.`,
        total: removedCount,
      };
    } catch (error) {
      logger.error('Log cleanup error:', error);
      return {
        success: false,
        error: 'Failed to clean logs',
      };
    }
  }

  // Get system logs (admin access required)
  static async getSystemLogs(
    adminId: number, 
    page: number = 1, 
    limit: number = 100,
    level?: string,
    startDate?: string,
    endDate?: string
  ): Promise<LogResult> {
    try {
      logger.info(`System logs request by admin: ${adminId}, page: ${page}, limit: ${limit}`);

      // Verify the requesting user is an admin
      const isAdmin = await AdminService.verifyAdminAccess(adminId);
      if (!isAdmin) {
        logger.warn(`Unauthorized system logs request by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      // Get the current log file path
      const logDir = process.env.LOG_DIR || 'logs';
      const logFile = path.join(logDir, 'combined.log');

      // Check if log file exists
      if (!fs.existsSync(logFile)) {
        logger.warn(`Log file not found: ${logFile}`);
        return {
          success: true,
          logs: [],
          message: 'No log file found',
          total: 0,
        };
      }

      // Read log file
      const logContent = fs.readFileSync(logFile, 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim());

      // Parse log entries
      const logs: LogEntry[] = [];
      for (const line of logLines) {
        try {
          // Try to parse as JSON (Winston format)
          const logEntry = JSON.parse(line);
          
          // Filter by level if specified
          if (level && logEntry.level !== level) {
            continue;
          }

          // Filter by date range if specified
          if (startDate || endDate) {
            const logDate = new Date(logEntry.timestamp);
            if (startDate && logDate < new Date(startDate)) {
              continue;
            }
            if (endDate && logDate > new Date(endDate)) {
              continue;
            }
          }

          logs.push({
            timestamp: logEntry.timestamp,
            level: logEntry.level,
            message: logEntry.message,
            service: logEntry.service,
            userId: logEntry.userId,
            stack: logEntry.stack,
          });
        } catch (parseError) {
          // If JSON parsing fails, treat as plain text log
          const timestamp = new Date().toISOString();
          logs.push({
            timestamp,
            level: 'info',
            message: line,
          });
        }
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply pagination
      const total = logs.length;
      const offset = (page - 1) * limit;
      const paginatedLogs = logs.slice(offset, offset + limit);

      logger.info(`System logs retrieved: ${paginatedLogs.length} logs found, total: ${total}`);

      return {
        success: true,
        logs: paginatedLogs,
        message: `Logs retrieved successfully. Page ${page}, showing ${paginatedLogs.length} of ${total} logs.`,
        total,
      };
    } catch (error) {
      logger.error('System logs retrieval error:', error);
      return {
        success: false,
        error: 'Failed to retrieve system logs',
      };
    }
  }

  // Get recent error logs (admin access required)
  static async getErrorLogs(adminId: number, limit: number = 50): Promise<LogResult> {
    try {
      logger.info(`Error logs request by admin: ${adminId}, limit: ${limit}`);

      // Verify the requesting user is an admin
      const isAdmin = await AdminService.verifyAdminAccess(adminId);
      if (!isAdmin) {
        logger.warn(`Unauthorized error logs request by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      // Get all logs first
      const result = await this.getSystemLogs(adminId, 1, 1000); // Get more logs for filtering
      
      if (result.success && result.logs) {
        // Filter for error logs more strictly
        const errorLogs = result.logs.filter(log => {
          const level = (log.level || '').toLowerCase();
          const message = log.message || '';
          
          // Only show actual errors
          if (level === 'error') return true;
          if (log.stack) return true; // Has error stack trace
          
          // Check for error keywords in message (case-sensitive for better precision)
          const errorKeywords = [
            'Error:', 'ERROR:', 'Failed to', 'failed to', 'Exception:',
            'Uncaught', 'Unhandled', 'Cannot', 'Unable to', 'Invalid',
            'Timeout', 'Connection refused', 'Access denied', 'Permission denied'
          ];
          
          const hasErrorKeyword = errorKeywords.some(keyword => message.includes(keyword));
          
          // Exclude info/debug logs that might contain "error" in context
          const excludePatterns = [
            'info', 'debug', 'Request', 'response', 'logs request',
            'retrieved successfully', 'completed successfully'
          ];
          
          const shouldExclude = excludePatterns.some(pattern => 
            message.toLowerCase().includes(pattern.toLowerCase())
          );
          
          return hasErrorKeyword && !shouldExclude;
        }).slice(0, limit);

        return {
          success: true,
          logs: errorLogs,
          message: `Recent error logs retrieved successfully. Showing ${errorLogs.length} error logs.`,
          total: errorLogs.length,
        };
      }

      return result;
    } catch (error) {
      logger.error('Error logs retrieval error:', error);
      return {
        success: false,
        error: 'Failed to retrieve error logs',
      };
    }
  }

  // Get admin activity logs (admin access required)
  static async getAdminActivityLogs(adminId: number, limit: number = 100): Promise<LogResult> {
    try {
      logger.info(`Admin activity logs request by admin: ${adminId}, limit: ${limit}`);

      // Verify the requesting user is an admin
      const isAdmin = await AdminService.verifyAdminAccess(adminId);
      if (!isAdmin) {
        logger.warn(`Unauthorized admin activity logs request by user: ${adminId}`);
        return {
          success: false,
          error: 'Unauthorized: Admin access required',
        };
      }

      // Get all logs and filter for admin activities
      const result = await this.getSystemLogs(adminId, 1, 1000); // Get more logs for filtering
      
      if (result.success && result.logs) {
        // Filter for admin-related activities with more specific keywords
        const adminActivityKeywords = [
          'Admin deleting', 'Admin delete', 'deleted by admin', 'created by admin',
          'Admin account created', 'Admin account deleted', 'Site admin',
          'Admin logs request', 'Admin activity logs', 'Log cleanup',
          'Admin enable user', 'Admin restore user', 'Admin creating',
          'violation word', 'Violation word', 'Clear logs'
        ];

        const adminLogs = result.logs.filter(log => {
          const message = log.message || '';
          // More specific filtering - must contain specific admin action keywords
          return adminActivityKeywords.some(keyword => 
            message.includes(keyword)
          );
        }).slice(0, limit);

        return {
          success: true,
          logs: adminLogs,
          message: `Admin activity logs retrieved successfully. Showing ${adminLogs.length} activity logs.`,
          total: adminLogs.length,
        };
      }

      return result;
    } catch (error) {
      logger.error('Admin activity logs retrieval error:', error);
      return {
        success: false,
        error: 'Failed to retrieve admin activity logs',
      };
    }
  }
}