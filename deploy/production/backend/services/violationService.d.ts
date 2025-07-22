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
export declare class ViolationService {
    /**
     * Check content for violations using both simple words and regex patterns
     */
    static detectViolations(content: string): Promise<ViolationDetectionResult>;
    /**
     * Record violations in the database
     */
    static recordViolations(userId: number, contentType: 'post' | 'comment', contentId: number, content: string, violations: ViolationDetectionResult['violations']): Promise<boolean>;
    /**
     * Get users with violations exceeding threshold in time period
     */
    static getViolationStats(adminId: number, days?: number, threshold?: number): Promise<AdminViolationResult>;
    /**
     * Get all violation words for admin management
     */
    static getViolationWords(adminId: number): Promise<AdminViolationResult>;
    /**
     * Add a new violation word
     */
    static addViolationWord(adminId: number, word: string, isRegex?: boolean): Promise<AdminViolationResult>;
    /**
     * Remove a violation word
     */
    static removeViolationWord(adminId: number, wordId: number): Promise<AdminViolationResult>;
    /**
     * Get all violations for admin review
     */
    static getViolations(adminId: number, page?: number, limit?: number, status?: 'pending' | 'reviewed' | 'ignored'): Promise<AdminViolationResult>;
    /**
     * Update violation status
     */
    static updateViolationStatus(adminId: number, violationId: number, status: 'pending' | 'reviewed' | 'ignored', notes?: string): Promise<AdminViolationResult>;
}
//# sourceMappingURL=violationService.d.ts.map