export interface WorkerTask {
    id: string;
    type: 'calculate' | 'batch_update' | 'cleanup' | 'statistics';
    payload: any;
    priority: 'low' | 'medium' | 'high';
    timestamp: Date;
    retries: number;
    maxRetries: number;
}
export interface WorkerResult {
    taskId: string;
    success: boolean;
    result?: any;
    error?: string;
    processingTime: number;
}
export interface WorkerConfig {
    enabled: boolean;
    maxWorkers: number;
    maxQueueSize: number;
    taskTimeout: number;
    retryDelay: number;
    cleanupInterval: number;
    statisticsInterval: number;
}
export declare class HotnessWorkerService {
    private static instance;
    private workers;
    private taskQueue;
    private activeTasks;
    private results;
    private cleanupTimer;
    private statisticsTimer;
    private readonly defaultConfig;
    private config;
    private statistics;
    private constructor();
    /**
     * 获取工作服务实例（单例模式）
     */
    static getInstance(config?: Partial<WorkerConfig>): HotnessWorkerService;
    /**
     * 启动工作服务
     */
    start(): Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }>;
    /**
     * 停止工作服务
     */
    stop(): Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }>;
    /**
     * 创建工作线程
     */
    private createWorker;
    /**
     * 处理工作结果
     */
    private handleWorkerResult;
    /**
     * 处理工作错误
     */
    private handleWorkerError;
    /**
     * 处理工作线程退出
     */
    private handleWorkerExit;
    /**
     * 重新创建工作线程
     */
    private recreateWorker;
    /**
     * 处理任务失败
     */
    private handleTaskFailure;
    /**
     * 添加任务到队列
     */
    addTask(type: WorkerTask['type'], payload: any, priority?: WorkerTask['priority'], maxRetries?: number): Promise<{
        success: boolean;
        taskId?: string;
        message?: string;
        error?: string;
    }>;
    /**
     * 处理下一个任务
     */
    private processNextTask;
    /**
     * 获取任务结果
     */
    getTaskResult(taskId: string): WorkerResult | null;
    /**
     * 获取队列状态
     */
    getQueueStatus(): {
        enabled: boolean;
        queueSize: number;
        activeTasks: number;
        availableWorkers: number;
        statistics: {
            tasksProcessed: number;
            tasksSucceeded: number;
            tasksFailed: number;
            averageProcessingTime: number;
            queueSize: number;
            activeWorkers: number;
            lastUpdated: Date;
        };
    };
    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<WorkerConfig>): void;
    /**
     * 获取配置
     */
    getConfig(): WorkerConfig;
    /**
     * 启动定时任务
     */
    private startPeriodicTasks;
    /**
     * 停止定时任务
     */
    private stopPeriodicTasks;
    /**
     * 清理过期结果
     */
    private cleanupExpiredResults;
    /**
     * 更新统计数据
     */
    private updateStatistics;
    /**
     * 更新统计指标
     */
    private updateStatisticsMetrics;
    /**
     * 清理所有队列和结果
     */
    reset(): void;
}
export default HotnessWorkerService;
//# sourceMappingURL=hotnessWorkerService.d.ts.map