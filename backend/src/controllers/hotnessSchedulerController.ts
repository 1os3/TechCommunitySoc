import { Request, Response } from 'express';
import HotnessScheduler, { SchedulerConfig } from '../services/hotnessScheduler';

export class HotnessSchedulerController {
  /**
   * 启动热度调度器
   */
  static async startScheduler(req: Request, res: Response): Promise<void> {
    try {
      const config = req.body.config || {};

      // 验证配置参数
      const validation = HotnessSchedulerController.validateSchedulerConfig(config);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONFIG',
            message: 'Invalid scheduler configuration',
            details: validation.errors
          }
        });
        return;
      }

      const scheduler = HotnessScheduler.getInstance();
      scheduler.updateConfig(config);

      const result = scheduler.start();

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'START_FAILED',
            message: result.message
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          status: scheduler.getStatus()
        }
      });

    } catch (error) {
      console.error('Error starting scheduler:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }

  /**
   * 停止热度调度器
   */
  static async stopScheduler(req: Request, res: Response): Promise<void> {
    try {
      const scheduler = HotnessScheduler.getInstance();
      const result = scheduler.stop();

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'STOP_FAILED',
            message: result.message
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          status: scheduler.getStatus()
        }
      });

    } catch (error) {
      console.error('Error stopping scheduler:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }

  /**
   * 重启热度调度器
   */
  static async restartScheduler(req: Request, res: Response): Promise<void> {
    try {
      const config = req.body.config || {};

      // 验证配置参数
      const validation = HotnessSchedulerController.validateSchedulerConfig(config);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONFIG',
            message: 'Invalid scheduler configuration',
            details: validation.errors
          }
        });
        return;
      }

      const scheduler = HotnessScheduler.getInstance();
      const result = scheduler.restart(config);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'RESTART_FAILED',
            message: result.message
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          status: scheduler.getStatus()
        }
      });

    } catch (error) {
      console.error('Error restarting scheduler:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }

  /**
   * 获取调度器状态
   */
  static async getSchedulerStatus(req: Request, res: Response): Promise<void> {
    try {
      const scheduler = HotnessScheduler.getInstance();
      const status = scheduler.getStatus();

      res.status(200).json({
        success: true,
        data: {
          status: status
        }
      });

    } catch (error) {
      console.error('Error getting scheduler status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }

  /**
   * 更新调度器配置
   */
  static async updateSchedulerConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = req.body.config || {};

      // 验证配置参数
      const validation = HotnessSchedulerController.validateSchedulerConfig(config);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONFIG',
            message: 'Invalid scheduler configuration',
            details: validation.errors
          }
        });
        return;
      }

      const scheduler = HotnessScheduler.getInstance();
      scheduler.updateConfig(config);

      res.status(200).json({
        success: true,
        data: {
          message: 'Configuration updated successfully',
          config: scheduler.getConfig()
        }
      });

    } catch (error) {
      console.error('Error updating scheduler config:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }

  /**
   * 立即执行热度更新
   */
  static async executeImmediateUpdate(req: Request, res: Response): Promise<void> {
    try {
      const scheduler = HotnessScheduler.getInstance();
      const result = await scheduler.executeNow();

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: {
            code: 'EXECUTION_FAILED',
            message: result.error || 'Failed to execute immediate update'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          updated: result.updated,
          failed: result.failed,
          message: result.message || 'Immediate update completed successfully'
        }
      });

    } catch (error) {
      console.error('Error executing immediate update:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }

  /**
   * 清理过期帖子
   */
  static async cleanupExpiredPosts(req: Request, res: Response): Promise<void> {
    try {
      const scheduler = HotnessScheduler.getInstance();
      const result = await scheduler.cleanupExpiredPosts();

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: {
            code: 'CLEANUP_FAILED',
            message: result.error || 'Failed to cleanup expired posts'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          cleaned: result.cleaned,
          message: result.message || 'Cleanup completed successfully'
        }
      });

    } catch (error) {
      console.error('Error cleaning up expired posts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }

  /**
   * 获取更新统计
   */
  static async getUpdateStatistics(req: Request, res: Response): Promise<void> {
    try {
      const scheduler = HotnessScheduler.getInstance();
      const result = await scheduler.getUpdateStatistics();

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: {
            code: 'STATISTICS_FAILED',
            message: result.error || 'Failed to get update statistics'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          statistics: result.statistics
        }
      });

    } catch (error) {
      console.error('Error getting update statistics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }

  /**
   * 验证调度器配置
   */
  private static validateSchedulerConfig(config: Partial<SchedulerConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
      errors.push('Enabled must be a boolean');
    }

    if (config.updateInterval !== undefined) {
      if (typeof config.updateInterval !== 'number' || config.updateInterval < 60000 || config.updateInterval > 86400000) {
        errors.push('Update interval must be between 60,000ms (1 minute) and 86,400,000ms (24 hours)');
      }
    }

    if (config.batchSize !== undefined) {
      if (typeof config.batchSize !== 'number' || config.batchSize < 1 || config.batchSize > 1000) {
        errors.push('Batch size must be between 1 and 1000');
      }
    }

    if (config.maxAge !== undefined) {
      if (typeof config.maxAge !== 'number' || config.maxAge < 1 || config.maxAge > 8760) {
        errors.push('Max age must be between 1 and 8760 hours (1 year)');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

export default HotnessSchedulerController;