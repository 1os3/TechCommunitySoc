import User from '../models/User';
export interface AdminResult {
    success: boolean;
    user?: User;
    users?: User[];
    total?: number;
    message?: string;
    error?: string;
}
export interface CreateAdminData {
    username: string;
    email: string;
}
export declare class AdminService {
    static createAdminAccount(siteAdminId: number, adminData: CreateAdminData): Promise<AdminResult>;
    static deleteAdminAccount(siteAdminId: number, targetAdminId: number): Promise<AdminResult>;
    static getAdminAccounts(requestingUserId: number): Promise<AdminResult>;
    static verifyAdminAccess(userId: number): Promise<boolean>;
    static verifySiteAdminAccess(userId: number): Promise<boolean>;
    static deleteUserAccount(adminId: number, targetUserId: number): Promise<AdminResult>;
    static enableUserAccount(adminId: number, targetUserId: number): Promise<AdminResult>;
    static getUserList(adminId: number, page?: number, limit?: number): Promise<AdminResult>;
    static restoreUserAccount(adminId: number, targetUserId: number, newUsername?: string, newEmail?: string): Promise<AdminResult>;
    static getSoftDeletedUserList(adminId: number, page?: number, limit?: number, searchQuery?: string): Promise<AdminResult>;
    static getDisabledUserList(adminId: number, page?: number, limit?: number): Promise<AdminResult>;
}
//# sourceMappingURL=adminService.d.ts.map