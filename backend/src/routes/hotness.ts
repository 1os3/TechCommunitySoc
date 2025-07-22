import express from 'express';
import HotnessController from '../controllers/hotnessController';
import HotnessSchedulerController from '../controllers/hotnessSchedulerController';
import HotnessUpdateController from '../controllers/hotnessUpdateController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/v1/hotness/config
 * @desc 获取热度算法配置
 * @access Public
 */
router.get('/config', HotnessController.getHotnessConfig);

/**
 * @route GET /api/v1/hotness/posts/hot
 * @desc 获取热门帖子列表
 * @access Public
 * @query limit - 限制返回数量 (1-100, 默认20)
 * @query minScore - 最小热度分数 (默认0)
 */
router.get('/posts/hot', HotnessController.getHotPosts);

/**
 * @route GET /api/v1/hotness/posts/trending
 * @desc 基于时间范围获取热门帖子
 * @access Public
 * @query hours - 时间范围小时数 (1-8760, 默认24)
 * @query limit - 限制返回数量 (1-100, 默认20)
 */
router.get('/posts/trending', HotnessController.getHotPostsByTimeRange);

/**
 * @route POST /api/v1/hotness/posts/:id/calculate
 * @desc 计算单个帖子的热度分数
 * @access Private (Admin or system)
 * @body config - 可选的热度算法配置
 */
router.post('/posts/:id/calculate', authenticateToken, HotnessController.calculatePostHotness);

/**
 * @route POST /api/v1/hotness/posts/:id/trend
 * @desc 计算帖子热度趋势
 * @access Private (Admin or system)
 * @body config - 可选的热度算法配置
 */
router.post('/posts/:id/trend', authenticateToken, HotnessController.calculateHotnessTrend);

/**
 * @route POST /api/v1/hotness/posts/batch-update
 * @desc 批量更新帖子热度分数
 * @access Private (Admin or system)
 * @body postIds - 帖子ID数组
 * @body config - 可选的热度算法配置
 */
router.post('/posts/batch-update', authenticateToken, HotnessController.batchUpdateHotness);

/**
 * @route POST /api/v1/hotness/posts/update-all
 * @desc 更新所有活跃帖子的热度分数
 * @access Private (Admin or system)
 * @body config - 可选的热度算法配置
 */
router.post('/posts/update-all', authenticateToken, HotnessController.updateAllPostsHotness);

// 调度器管理路由
/**
 * @route GET /api/v1/hotness/scheduler/status
 * @desc 获取热度调度器状态
 * @access Private (Admin or system)
 */
router.get('/scheduler/status', authenticateToken, HotnessSchedulerController.getSchedulerStatus);

/**
 * @route POST /api/v1/hotness/scheduler/start
 * @desc 启动热度调度器
 * @access Private (Admin or system)
 * @body config - 可选的调度器配置
 */
router.post('/scheduler/start', authenticateToken, HotnessSchedulerController.startScheduler);

/**
 * @route POST /api/v1/hotness/scheduler/stop
 * @desc 停止热度调度器
 * @access Private (Admin or system)
 */
router.post('/scheduler/stop', authenticateToken, HotnessSchedulerController.stopScheduler);

/**
 * @route POST /api/v1/hotness/scheduler/restart
 * @desc 重启热度调度器
 * @access Private (Admin or system)
 * @body config - 可选的调度器配置
 */
router.post('/scheduler/restart', authenticateToken, HotnessSchedulerController.restartScheduler);

/**
 * @route PUT /api/v1/hotness/scheduler/config
 * @desc 更新调度器配置
 * @access Private (Admin or system)
 * @body config - 调度器配置
 */
router.put('/scheduler/config', authenticateToken, HotnessSchedulerController.updateSchedulerConfig);

/**
 * @route POST /api/v1/hotness/scheduler/execute
 * @desc 立即执行热度更新
 * @access Private (Admin or system)
 */
router.post('/scheduler/execute', authenticateToken, HotnessSchedulerController.executeImmediateUpdate);

/**
 * @route POST /api/v1/hotness/scheduler/cleanup
 * @desc 清理过期帖子
 * @access Private (Admin or system)
 */
router.post('/scheduler/cleanup', authenticateToken, HotnessSchedulerController.cleanupExpiredPosts);

/**
 * @route GET /api/v1/hotness/scheduler/statistics
 * @desc 获取热度更新统计
 * @access Private (Admin or system)
 */
router.get('/scheduler/statistics', authenticateToken, HotnessSchedulerController.getUpdateStatistics);

// 实时热度更新路由
/**
 * @route POST /api/v1/hotness/updates/trigger/:postId
 * @desc 手动触发帖子热度更新
 * @access Private (authenticated users)
 * @body type - 触发器类型 (like, comment, view)
 * @body priority - 优先级 (low, medium, high)
 */
router.post('/updates/trigger/:postId', authenticateToken, HotnessUpdateController.triggerPostUpdate);

/**
 * @route POST /api/v1/hotness/updates/process-all
 * @desc 处理所有待更新的帖子
 * @access Private (Admin or system)
 */
router.post('/updates/process-all', authenticateToken, HotnessUpdateController.processAllPending);

/**
 * @route GET /api/v1/hotness/updates/queue-status
 * @desc 获取更新队列状态
 * @access Private (authenticated users)
 */
router.get('/updates/queue-status', authenticateToken, HotnessUpdateController.getQueueStatus);

/**
 * @route PUT /api/v1/hotness/updates/config
 * @desc 更新实时更新配置
 * @access Private (Admin or system)
 * @body config - 更新服务配置
 */
router.put('/updates/config', authenticateToken, HotnessUpdateController.updateConfig);

/**
 * @route POST /api/v1/hotness/updates/cleanup
 * @desc 清理过期触发器
 * @access Private (Admin or system)
 * @query maxAge - 最大年龄（毫秒）
 */
router.post('/updates/cleanup', authenticateToken, HotnessUpdateController.cleanupExpiredTriggers);

/**
 * @route POST /api/v1/hotness/updates/reset
 * @desc 重置更新服务
 * @access Private (Admin or system)
 */
router.post('/updates/reset', authenticateToken, HotnessUpdateController.resetService);

export default router;