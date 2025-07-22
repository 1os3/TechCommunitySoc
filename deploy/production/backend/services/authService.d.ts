import User from '../models/User';
export interface RegisterUserData {
    username: string;
    email: string;
    password: string;
}
export interface LoginUserData {
    email: string;
    password: string;
}
export interface AuthResult {
    success: boolean;
    user?: User;
    token?: string;
    message?: string;
    error?: string;
}
export interface RegistrationResult {
    success: boolean;
    user?: User;
    message?: string;
    error?: string;
    verificationToken?: string;
}
export interface PasswordResetResult {
    success: boolean;
    message?: string;
    error?: string;
}
export declare class AuthService {
    private static readonly JWT_SECRET;
    private static readonly JWT_EXPIRES_IN;
    private static readonly SALT_ROUNDS;
    static registerUser(userData: RegisterUserData): Promise<RegistrationResult>;
    static loginUser(loginData: LoginUserData): Promise<AuthResult>;
    static verifyEmail(token: string): Promise<AuthResult>;
    static resendVerificationEmail(email: string): Promise<{
        success: boolean;
        message?: string;
        error?: string;
        verificationToken?: string;
    }>;
    static generateJwtToken(user: User): string;
    static verifyJwtToken(token: string): any;
    static getUserFromToken(token: string): Promise<User | null>;
    static requestPasswordReset(email: string): Promise<PasswordResetResult>;
    static resetPassword(token: string, newPassword: string): Promise<PasswordResetResult>;
    static changePassword(userId: number, currentPassword: string, newPassword: string): Promise<PasswordResetResult>;
    static deleteAccount(userId: number, password: string): Promise<PasswordResetResult>;
    static checkUserStatus(userId: number): Promise<{
        success: boolean;
        error?: string;
        message?: string;
        isActive?: boolean;
        isDisabled?: boolean;
    }>;
}
//# sourceMappingURL=authService.d.ts.map