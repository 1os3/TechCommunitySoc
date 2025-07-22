import { Model, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute } from 'sequelize';
import User from './User';
export interface EmailVerificationAttributes {
    id: number;
    user_id: number;
    token: string;
    type: 'verification' | 'password_reset';
    expires_at: Date;
    is_used: boolean;
    created_at: Date;
}
export interface EmailVerificationCreationAttributes extends Omit<EmailVerificationAttributes, 'id' | 'created_at'> {
    id?: CreationOptional<number>;
    created_at?: CreationOptional<Date>;
}
declare class EmailVerification extends Model<InferAttributes<EmailVerification>, InferCreationAttributes<EmailVerification>> {
    id: CreationOptional<number>;
    user_id: ForeignKey<User['id']>;
    token: string;
    type: 'verification' | 'password_reset';
    expires_at: Date;
    is_used: CreationOptional<boolean>;
    created_at: CreationOptional<Date>;
    user?: NonAttribute<User>;
    static generateSecureToken(): string;
    static createVerificationToken(userId: number, type: 'verification' | 'password_reset', expiresInHours?: number): Promise<EmailVerification>;
    static findValidToken(token: string, type: 'verification' | 'password_reset'): Promise<EmailVerification | null>;
    static verifyToken(token: string, type: 'verification' | 'password_reset'): Promise<{
        valid: boolean;
        verification?: EmailVerification;
        user?: User;
    }>;
    markAsUsed(): Promise<void>;
    isExpired(): boolean;
    isValid(): boolean;
    static cleanupExpiredTokens(): Promise<number>;
    static cleanupUsedTokens(olderThanDays?: number): Promise<number>;
    static getUserActiveTokens(userId: number, type?: 'verification' | 'password_reset'): Promise<EmailVerification[]>;
    static associate(models: any): void;
}
export default EmailVerification;
//# sourceMappingURL=EmailVerification.d.ts.map