import { Model, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
export interface UserAttributes {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    avatar_url?: string;
    is_verified: boolean;
    is_admin: boolean;
    is_active: boolean;
    role: 'user' | 'admin';
    last_login?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'created_at' | 'updated_at'> {
    id?: CreationOptional<number>;
    created_at?: CreationOptional<Date>;
    updated_at?: CreationOptional<Date>;
}
declare class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    id: CreationOptional<number>;
    username: string;
    email: string;
    password_hash: string;
    avatar_url: string | null;
    is_verified: CreationOptional<boolean>;
    is_admin: CreationOptional<boolean>;
    is_active: CreationOptional<boolean>;
    role: CreationOptional<'user' | 'admin'>;
    last_login: Date | null;
    created_at: CreationOptional<Date>;
    updated_at: CreationOptional<Date>;
    validatePassword(password: string): Promise<boolean>;
    static hashPassword(password: string): Promise<string>;
    static findByEmail(email: string): Promise<User | null>;
    static findByUsername(username: string): Promise<User | null>;
    updateLastLogin(): Promise<void>;
    toSafeJSON(): Omit<UserAttributes, 'password_hash'>;
    static isAdminCredentials(username: string, email: string): boolean;
    static isSiteAdminCredentials(username: string, email: string): boolean;
    static getAdminPassword(): string;
    static getSiteAdminPassword(): string;
    isAdmin(): boolean;
    isSiteAdmin(): boolean;
    static associate(models: any): void;
}
export default User;
//# sourceMappingURL=User.d.ts.map