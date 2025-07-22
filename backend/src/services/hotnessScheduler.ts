import HotnessService from './hotnessService';
import Post from '../models/Post';
import { Op } from 'sequelize';

export interface SchedulerConfig {
  enabled: boolean;
  updateInterval: number; // 更新间隔（毫秒）
  batchSize: number;      // 批处理大小
  maxAge: number;         // 最大年龄（小时），超过这个时间的帖子不再计算热度
}

export class HotnessScheduler {
  private static instance: HotnessScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  
  private readonly defaultConfig: SchedulerConfig = {
    enabled: false,
    updateInterval: 30 * 60 * 1000, // 30分钟
    batchSize: 50,                   // 每次处理50个帖子
    maxAge: 168                      // 7天（168小时）
  };

  private config: SchedulerConfig;

  private constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * 获取调度器实例（单例模式）
   */
  static getInstance(config: Partial<SchedulerConfig> = {}): HotnessScheduler {
    if (!HotnessScheduler.instance) {
      HotnessScheduler.instance = new HotnessScheduler(config);
    }
    return HotnessScheduler.instance;
  }

  /**
   * 启动定时任务
   */
  start(): { success: boolean; message: string } {
    if (this.isRunning) {
      return {
        success: false,
        message: 'Scheduler is already running'
      };
    }

    if (!this.config.enabled) {
      return {
        success: false,
        message: 'Scheduler is disabled'
      };
    }

    try {
      this.intervalId = setInterval(async () => {
        await this.updateHotnessScores();
      }, this.config.updateInterval);

      this.isRunning = true;

      console.log(`Hotness scheduler started with interval: ${this.config.updateInterval}ms`);
      
      return {
        success: true,
        message: 'Scheduler started successfully'
      };

    } catch (error) {
      console.error('Error starting hotness scheduler:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start scheduler'
      };
    }
  }

  /**
   * 停止定时任务
   */
  stop(): { success: boolean; message: string } {
    if (!this.isRunning) {
      return {
        success: false,
        message: 'Scheduler is not running'
      };
    }

    try {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      this.isRunning = false;

      console.log('Hotness scheduler stopped');

      return {
        success: true,
        message: 'Scheduler stopped successfully'
      };

    } catch (error) {
      console.error('Error stopping hotness scheduler:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to stop scheduler'
      };
    }
  }

  /**
   * 重启调度器
   */
  restart(newConfig?: Partial<SchedulerConfig>): { success: boolean; message: string } {
    const stopResult = this.stop();
    if (!stopResult.success) {
      return stopResult;
    }

    if (newConfig) {
      this.updateConfig(newConfig);
    }

    return this.start();
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Hotness scheduler config updated:', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): SchedulerConfig {
    return { ...this.config };
  }

  /**
   * 获取运行状态
   */
  getStatus(): { running: boolean; config: SchedulerConfig; lastUpdate?: Date } {
    return {
      running: this.isRunning,
      config: this.config,
    };
  }

  /**
   * 立即执行一次热度更新
   */
  async executeNow(): Promise<{ success: boolean; updated: number; failed: number; message?: string; error?: string }> {
    try {
      console.log('Executing immediate hotness update...');
      
      const result = await this.updateHotnessScores();
      
      console.log(`Immediate hotness update completed. Updated: ${result.updated}, Failed: ${result.failed}`);
      
      return result;

    } catch (error) {
      console.error('Error in immediate hotness update:', error);
      return {
        success: false,
        updated: 0,
        failed: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 执行热度分数更新
   */
  private async updateHotnessScores(): Promise<{ success: boolean; updated: number; failed: number; message?: string }> {
    try {
      // 计算时间阈值
      const maxAgeMs = this.config.maxAge * 60 * 60 * 1000;
      const cutoffTime = new Date(Date.now() - maxAgeMs);

      // 获取需要更新的帖子
      const posts = await Post.findAll({
        where: {
          is_deleted: false,
          created_at: {
            [Op.gte]: cutoffTime // 只处理指定时间内的帖子
          }
        },
        attributes: ['id'],
        order: [['hotness_score', 'ASC']], // 优先处理热度低的帖子
        limit: this.config.batchSize
      });

      if (posts.length === 0) {
        return {
          success: true,
          updated: 0,
          failed: 0,
          message: 'No posts found for update'
        };
      }

      const postIds = posts.map(post => post.id);

      // 批量更新热度分数
      const result = await HotnessService.batchUpdateHotness(postIds);

      if (!result.success) {
        console.error('Batch hotness update failed:', result.error);
        return {
          success: false,
          updated: 0,
          failed: postIds.length
        };
      }

      const updated = result.results?.length || 0;
      const failed = result.failed?.length || 0;

      // 记录更新日志
      if (updated > 0 || failed > 0) {
        console.log(`Hotness update completed - Updated: ${updated}, Failed: ${failed}, Batch size: ${this.config.batchSize}`);
      }

      return {
        success: true,
        updated: updated,
        failed: failed
      };

    } catch (error) {
      console.error('Error in scheduled hotness update:', error);
      return {
        success: false,
        updated: 0,
        failed: 0
      };
    }
  }

  /**
   * 清理过期帖子的热度分数（设置为0）
   */
  async cleanupExpiredPosts(): Promise<{ success: boolean; cleaned: number; message?: string; error?: string }> {
    try {
      const maxAgeMs = this.config.maxAge * 60 * 60 * 1000;
      const cutoffTime = new Date(Date.now() - maxAgeMs);

      // 找到过期的帖子并将热度设置为0
      const [updatedCount] = await Post.update(
        { hotness_score: 0 },
        {
          where: {
            is_deleted: false,
            created_at: {
              [Op.lt]: cutoffTime
            },
            hotness_score: {
              [Op.gt]: 0
            }
          }
        }
      );

      console.log(`Cleaned up ${updatedCount} expired posts (older than ${this.config.maxAge} hours)`);

      return {
        success: true,
        cleaned: updatedCount
      };

    } catch (error) {
      console.error('Error cleaning up expired posts:', error);
      return {
        success: false,
        cleaned: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 获取热度更新统计
   */
  async getUpdateStatistics(): Promise<{
    success: boolean;
    statistics?: {
      totalPosts: number;
      activePosts: number;
      expiredPosts: number;
      avgHotness: number;
      maxHotness: number;
      lastUpdated: Date;
    };
    error?: string;
  }> {
    try {
      const maxAgeMs = this.config.maxAge * 60 * 60 * 1000;
      const cutoffTime = new Date(Date.now() - maxAgeMs);

      // 获取统计数据
      const [totalPosts, activePosts, expiredPosts, avgResult, maxResult] = await Promise.all([
        Post.count({ where: { is_deleted: false } }),
        Post.count({ 
          where: { 
            is_deleted: false,
            created_at: { [Op.gte]: cutoffTime }
          }
        }),
        Post.count({ 
          where: { 
            is_deleted: false,
            created_at: { [Op.lt]: cutoffTime }
          }
        }),
        Post.findOne({
          where: { is_deleted: false },
          order: [['hotness_score', 'DESC']],
          attributes: ['hotness_score'],
          raw: true
        }).then((result: any) => ({ max: result?.hotness_score || 0 })),
        Post.findAll({
          where: { is_deleted: false },
          attributes: ['hotness_score'],
          raw: true
        }).then((results: any[]) => {
          const sum = results.reduce((acc, r) => acc + (r.hotness_score || 0), 0);
          return { avg: results.length > 0 ? sum / results.length : 0 };
        })
      ]);

      return {
        success: true,
        statistics: {
          totalPosts,
          activePosts,
          expiredPosts,
          avgHotness: parseFloat((avgResult as any)?.avg || '0'),
          maxHotness: parseFloat((maxResult as any)?.max || '0'),
          lastUpdated: new Date()
        }
      };

    } catch (error) {
      console.error('Error getting update statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export default HotnessScheduler;