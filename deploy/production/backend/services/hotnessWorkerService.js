"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotnessWorkerService = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
class HotnessWorkerService {
    constructor(config = {}) {
        this.workers = [];
        this.taskQueue = new Map();
        this.activeTasks = new Map();
        this.results = new Map();
        this.cleanupTimer = null;
        this.statisticsTimer = null;
        this.defaultConfig = {
            enabled: false, // 默认禁用，需要手动启用
            maxWorkers: 2, // 2个工作线程
            maxQueueSize: 1000, // 最多1000个任务
            taskTimeout: 30000, // 30秒超时
            retryDelay: 5000, // 5秒重试延迟
            cleanupInterval: 60000, // 1分钟清理间隔
            statisticsInterval: 300000 // 5分钟统计间隔
        };
        this.statistics = {
            tasksProcessed: 0,
            tasksSucceeded: 0,
            tasksFailed: 0,
            averageProcessingTime: 0,
            queueSize: 0,
            activeWorkers: 0,
            lastUpdated: new Date()
        };
        this.config = { ...this.defaultConfig, ...config };
    }
    /**
     * 获取工作服务实例（单例模式）
     */
    static getInstance(config = {}) {
        if (!HotnessWorkerService.instance) {
            HotnessWorkerService.instance = new HotnessWorkerService(config);
        }
        return HotnessWorkerService.instance;
    }
    /**
     * 启动工作服务
     */
    async start() {
        try {
            if (!this.config.enabled) {
                return {
                    success: false,
                    message: 'Worker service is disabled'
                };
            }
            if (this.workers.length > 0) {
                return {
                    success: false,
                    message: 'Worker service is already running'
                };
            }
            // 创建工作线程
            for (let i = 0; i < this.config.maxWorkers; i++) {
                await this.createWorker();
            }
            // 启动定时任务
            this.startPeriodicTasks();
            console.log(`HotnessWorkerService started with ${this.config.maxWorkers} workers`);
            return {
                success: true,
                message: `Worker service started with ${this.config.maxWorkers} workers`
            };
        }
        catch (error) {
            console.error('Error starting worker service:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 停止工作服务
     */
    async stop() {
        try {
            // 停止定时任务
            this.stopPeriodicTasks();
            // 终止所有工作线程
            await Promise.all(this.workers.map(worker => worker.terminate()));
            this.workers = [];
            // 清理状态
            this.activeTasks.clear();
            console.log('HotnessWorkerService stopped');
            return {
                success: true,
                message: 'Worker service stopped successfully'
            };
        }
        catch (error) {
            console.error('Error stopping worker service:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 创建工作线程
     */
    async createWorker() {
        const workerPath = path_1.default.join(__dirname, '../workers/hotnessWorker.js');
        const worker = new worker_threads_1.Worker(`
      const { parentPort } = require('worker_threads');
      const HotnessService = require('../services/hotnessService').default;
      
      parentPort.on('message', async (task) => {
        const startTime = Date.now();
        try {
          let result;
          
          switch (task.type) {
            case 'calculate':
              result = await HotnessService.calculatePostHotness(task.payload.postId, task.payload.config);
              break;
            case 'batch_update':
              result = await HotnessService.batchUpdateHotness(task.payload.postIds, task.payload.config);
              break;
            case 'cleanup':
              // 实现清理逻辑
              result = { success: true, message: 'Cleanup completed' };
              break;
            case 'statistics':
              // 实现统计逻辑
              result = { success: true, statistics: {} };
              break;
            default:
              throw new Error('Unknown task type: ' + task.type);
          }
          
          parentPort.postMessage({
            taskId: task.id,
            success: true,
            result: result,
            processingTime: Date.now() - startTime
          });
          
        } catch (error) {
          parentPort.postMessage({
            taskId: task.id,
            success: false,
            error: error.message,
            processingTime: Date.now() - startTime
          });
        }
      });
    `, { eval: true });
        worker.on('message', (result) => {
            this.handleWorkerResult(result);
        });
        worker.on('error', (error) => {
            console.error('Worker error:', error);
            this.handleWorkerError(worker, error);
        });
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
                this.handleWorkerExit(worker);
            }
        });
        this.workers.push(worker);
        return worker;
    }
    /**
     * 处理工作结果
     */
    handleWorkerResult(result) {
        // 存储结果
        this.results.set(result.taskId, result);
        // 从活跃任务中移除
        const activeTask = this.activeTasks.get(result.taskId);
        if (activeTask) {
            this.activeTasks.delete(result.taskId);
        }
        // 从队列中移除任务
        this.taskQueue.delete(result.taskId);
        // 更新统计
        this.updateStatistics(result);
        // 处理下一个任务
        this.processNextTask();
        console.log(`Task ${result.taskId} completed: ${result.success ? 'success' : 'failed'} (${result.processingTime}ms)`);
    }
    /**
     * 处理工作错误
     */
    handleWorkerError(worker, error) {
        console.error('Worker error:', error);
        // 找到失败的任务
        for (const [taskId, activeTask] of this.activeTasks.entries()) {
            if (activeTask.worker === worker) {
                this.handleTaskFailure(taskId, error.message);
                break;
            }
        }
        // 重新创建工作线程
        this.recreateWorker(worker);
    }
    /**
     * 处理工作线程退出
     */
    handleWorkerExit(worker) {
        // 找到失败的任务
        for (const [taskId, activeTask] of this.activeTasks.entries()) {
            if (activeTask.worker === worker) {
                this.handleTaskFailure(taskId, 'Worker exited unexpectedly');
                break;
            }
        }
        // 重新创建工作线程
        this.recreateWorker(worker);
    }
    /**
     * 重新创建工作线程
     */
    async recreateWorker(failedWorker) {
        try {
            // 从工作线程列表中移除失败的线程
            const index = this.workers.indexOf(failedWorker);
            if (index > -1) {
                this.workers.splice(index, 1);
            }
            // 创建新的工作线程
            await this.createWorker();
            console.log('Worker recreated successfully');
        }
        catch (error) {
            console.error('Failed to recreate worker:', error);
        }
    }
    /**
     * 处理任务失败
     */
    handleTaskFailure(taskId, error) {
        const task = this.taskQueue.get(taskId);
        if (!task)
            return;
        // 移除活跃任务
        this.activeTasks.delete(taskId);
        // 检查是否可以重试
        if (task.retries < task.maxRetries) {
            task.retries++;
            console.log(`Retrying task ${taskId} (attempt ${task.retries}/${task.maxRetries})`);
            // 延迟重试
            setTimeout(() => {
                this.processNextTask();
            }, this.config.retryDelay);
        }
        else {
            // 任务最终失败
            this.results.set(taskId, {
                taskId,
                success: false,
                error: `Task failed after ${task.maxRetries} retries: ${error}`,
                processingTime: 0
            });
            this.taskQueue.delete(taskId);
            console.error(`Task ${taskId} failed permanently: ${error}`);
        }
    }
    /**
     * 添加任务到队列
     */
    async addTask(type, payload, priority = 'medium', maxRetries = 3) {
        try {
            if (!this.config.enabled) {
                return {
                    success: false,
                    message: 'Worker service is disabled'
                };
            }
            if (this.taskQueue.size >= this.config.maxQueueSize) {
                return {
                    success: false,
                    error: 'Task queue is full'
                };
            }
            const taskId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const task = {
                id: taskId,
                type,
                payload,
                priority,
                timestamp: new Date(),
                retries: 0,
                maxRetries
            };
            this.taskQueue.set(taskId, task);
            // 立即尝试处理任务
            this.processNextTask();
            console.log(`Task ${taskId} added to queue (${type}, ${priority} priority)`);
            return {
                success: true,
                taskId,
                message: 'Task added to queue successfully'
            };
        }
        catch (error) {
            console.error('Error adding task to queue:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * 处理下一个任务
     */
    processNextTask() {
        if (!this.config.enabled)
            return;
        // 找到可用的工作线程
        const availableWorker = this.workers.find(worker => !Array.from(this.activeTasks.values()).some(active => active.worker === worker));
        if (!availableWorker) {
            // 没有可用的工作线程
            return;
        }
        // 按优先级排序任务
        const sortedTasks = Array.from(this.taskQueue.values()).sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority] ||
                a.timestamp.getTime() - b.timestamp.getTime();
        });
        const nextTask = sortedTasks[0];
        if (!nextTask) {
            // 没有待处理的任务
            return;
        }
        // 分配任务给工作线程
        this.activeTasks.set(nextTask.id, {
            worker: availableWorker,
            startTime: new Date()
        });
        // 设置任务超时
        setTimeout(() => {
            if (this.activeTasks.has(nextTask.id)) {
                this.handleTaskFailure(nextTask.id, 'Task timeout');
            }
        }, this.config.taskTimeout);
        // 发送任务给工作线程
        availableWorker.postMessage(nextTask);
        console.log(`Task ${nextTask.id} assigned to worker`);
    }
    /**
     * 获取任务结果
     */
    getTaskResult(taskId) {
        return this.results.get(taskId) || null;
    }
    /**
     * 获取队列状态
     */
    getQueueStatus() {
        return {
            enabled: this.config.enabled,
            queueSize: this.taskQueue.size,
            activeTasks: this.activeTasks.size,
            availableWorkers: this.workers.length - this.activeTasks.size,
            statistics: { ...this.statistics }
        };
    }
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('HotnessWorkerService config updated:', this.config);
    }
    /**
     * 获取配置
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 启动定时任务
     */
    startPeriodicTasks() {
        // 定期清理过期结果
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredResults();
        }, this.config.cleanupInterval);
        // 定期更新统计
        this.statisticsTimer = setInterval(() => {
            this.updateStatisticsMetrics();
        }, this.config.statisticsInterval);
    }
    /**
     * 停止定时任务
     */
    stopPeriodicTasks() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        if (this.statisticsTimer) {
            clearInterval(this.statisticsTimer);
            this.statisticsTimer = null;
        }
    }
    /**
     * 清理过期结果
     */
    cleanupExpiredResults() {
        const expireTime = Date.now() - 3600000; // 1小时前
        let cleaned = 0;
        for (const [taskId, result] of this.results.entries()) {
            // 这里应该检查结果的时间戳，但我们的结果对象没有时间戳
            // 简单起见，如果结果超过一定数量就清理最老的
            if (this.results.size > 1000) {
                this.results.delete(taskId);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} expired task results`);
        }
    }
    /**
     * 更新统计数据
     */
    updateStatistics(result) {
        this.statistics.tasksProcessed++;
        if (result.success) {
            this.statistics.tasksSucceeded++;
        }
        else {
            this.statistics.tasksFailed++;
        }
        // 更新平均处理时间
        const totalTime = this.statistics.averageProcessingTime * (this.statistics.tasksProcessed - 1) + result.processingTime;
        this.statistics.averageProcessingTime = totalTime / this.statistics.tasksProcessed;
        this.statistics.queueSize = this.taskQueue.size;
        this.statistics.activeWorkers = this.activeTasks.size;
        this.statistics.lastUpdated = new Date();
    }
    /**
     * 更新统计指标
     */
    updateStatisticsMetrics() {
        this.statistics.queueSize = this.taskQueue.size;
        this.statistics.activeWorkers = this.activeTasks.size;
        this.statistics.lastUpdated = new Date();
    }
    /**
     * 清理所有队列和结果
     */
    reset() {
        this.taskQueue.clear();
        this.activeTasks.clear();
        this.results.clear();
        this.statistics = {
            tasksProcessed: 0,
            tasksSucceeded: 0,
            tasksFailed: 0,
            averageProcessingTime: 0,
            queueSize: 0,
            activeWorkers: 0,
            lastUpdated: new Date()
        };
        console.log('HotnessWorkerService reset');
    }
}
exports.HotnessWorkerService = HotnessWorkerService;
exports.default = HotnessWorkerService;
//# sourceMappingURL=hotnessWorkerService.js.map