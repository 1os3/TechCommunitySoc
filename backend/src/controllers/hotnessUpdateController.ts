import { Response } from 'express';
import HotnessUpdateService from '../services/hotnessUpdateService';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class HotnessUpdateController {
  /**
   * 手动触发帖子热度更新
   */
  static async triggerPostUpdate(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { type, priority } = req.body;

      // 验证触发器类型
      if (!type || !['like', 'comment', 'view'].includes(type)) {
        res.status(400).json({
          error: {
            code: 'INVALID_TRIGGER_TYPE',
            message: 'Trigger type must be like, comment, or view',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // 验证优先级
      const validPriority = priority && ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';

      const updateService = HotnessUpdateService.getInstance();
      const result = await updateService.triggerUpdate({
        type,
        postId,
        userId: req.user.id,
        priority: validPriority,
        timestamp: new Date()
      });

      if (!result.success) {
        res.status(400).json({
          error: {
            code: 'UPDATE_TRIGGER_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Update trigger processed successfully',
        data: {
          postId,
          triggerType: type,
          priority: validPriority,
          immediate: result.immediate || false,
          message: result.message
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Trigger post update controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger update',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * 处理所有待更新的帖子
   */
  static async processAllPending(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const updateService = HotnessUpdateService.getInstance();
      const result = await updateService.processAllPending();

      if (!result.success) {
        res.status(500).json({
          error: {
            code: 'PROCESS_PENDING_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'All pending updates processed',
        data: {
          processed: result.processed,
          failed: result.failed,
          message: result.message
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Process all pending controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process pending updates',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * 获取更新队列状态
   */
  static async getQueueStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const updateService = HotnessUpdateService.getInstance();
      const status = updateService.getQueueStatus();

      res.status(200).json({
        success: true,
        message: 'Queue status retrieved successfully',
        data: {
          queueStatus: status,
          config: updateService.getConfig()
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get queue status controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve queue status',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * 更新配置
   */
  static async updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { config } = req.body;
      if (!config || typeof config !== 'object') {
        res.status(400).json({
          error: {
            code: 'INVALID_CONFIG',
            message: 'Config object is required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // 验证配置参数
      const validConfigKeys = ['realTimeEnabled', 'updateThreshold', 'batchUpdateSize', 'updateDelay', 'priorityThreshold'];
      const invalidKeys = Object.keys(config).filter(key => !validConfigKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_CONFIG_KEYS',
            message: `Invalid config keys: ${invalidKeys.join(', ')}`,
            details: { validKeys: validConfigKeys },
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // 验证数值范围
      if (config.updateThreshold !== undefined && (config.updateThreshold < 1 || config.updateThreshold > 100)) {
        res.status(400).json({
          error: {
            code: 'INVALID_UPDATE_THRESHOLD',
            message: 'Update threshold must be between 1 and 100',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (config.batchUpdateSize !== undefined && (config.batchUpdateSize < 1 || config.batchUpdateSize > 100)) {
        res.status(400).json({
          error: {
            code: 'INVALID_BATCH_UPDATE_SIZE',
            message: 'Batch update size must be between 1 and 100',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (config.updateDelay !== undefined && (config.updateDelay < 100 || config.updateDelay > 60000)) {
        res.status(400).json({
          error: {
            code: 'INVALID_UPDATE_DELAY',
            message: 'Update delay must be between 100ms and 60000ms',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (config.priorityThreshold !== undefined && (config.priorityThreshold < 1 || config.priorityThreshold > 50)) {
        res.status(400).json({
          error: {
            code: 'INVALID_PRIORITY_THRESHOLD',
            message: 'Priority threshold must be between 1 and 50',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const updateService = HotnessUpdateService.getInstance();
      updateService.updateConfig(config);

      res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        data: {
          config: updateService.getConfig()
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Update config controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update configuration',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * 清理过期触发器
   */
  static async cleanupExpiredTriggers(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const maxAgeParam = req.query.maxAge as string;
      const maxAge = maxAgeParam ? parseInt(maxAgeParam) : 300000; // 默认5分钟

      if (isNaN(maxAge) || maxAge < 1 || (maxAge > 10 && maxAge < 1000) || maxAge > 3600000) {
        res.status(400).json({
          error: {
            code: 'INVALID_MAX_AGE',
            message: 'Max age must be between 1-10ms (for testing) or 1000ms-3600000ms (1 hour)',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const updateService = HotnessUpdateService.getInstance();
      const result = await updateService.cleanupExpiredTriggers(maxAge);

      if (!result.success) {
        res.status(500).json({
          error: {
            code: 'CLEANUP_FAILED',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Expired triggers cleaned up successfully',
        data: {
          cleaned: result.cleaned,
          maxAge: maxAge,
          message: result.message
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Cleanup expired triggers controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cleanup expired triggers',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * 重置更新服务
   */
  static async resetService(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const updateService = HotnessUpdateService.getInstance();
      updateService.reset();

      res.status(200).json({
        success: true,
        message: 'Hotness update service reset successfully',
        data: {
          queueStatus: updateService.getQueueStatus()
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Reset service controller error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset service',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

export default HotnessUpdateController;