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
export declare class LogService {
    static clearAllLogs(adminId: number): Promise<LogResult>;
    static clearLogs(adminId: number, olderThanDays?: number, level?: string): Promise<LogResult>;
    static getSystemLogs(adminId: number, page?: number, limit?: number, level?: string, startDate?: string, endDate?: string): Promise<LogResult>;
    static getErrorLogs(adminId: number, limit?: number): Promise<LogResult>;
    static getAdminActivityLogs(adminId: number, limit?: number): Promise<LogResult>;
}
//# sourceMappingURL=logService.d.ts.map