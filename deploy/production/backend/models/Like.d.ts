import { Model, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute } from 'sequelize';
import User from './User';
export interface LikeAttributes {
    id: number;
    user_id: number;
    target_type: 'post' | 'comment';
    target_id: number;
    created_at: Date;
}
export interface LikeCreationAttributes extends Omit<LikeAttributes, 'id' | 'created_at'> {
    id?: CreationOptional<number>;
    created_at?: CreationOptional<Date>;
}
declare class Like extends Model<InferAttributes<Like>, InferCreationAttributes<Like>> {
    id: CreationOptional<number>;
    user_id: ForeignKey<User['id']>;
    target_type: 'post' | 'comment';
    target_id: number;
    created_at: CreationOptional<Date>;
    user?: NonAttribute<User>;
    static findByUserAndTarget(userId: number, targetType: 'post' | 'comment', targetId: number): Promise<Like | null>;
    static countByTarget(targetType: 'post' | 'comment', targetId: number): Promise<number>;
    static getUserLikeStatus(userId: number, targets: Array<{
        type: 'post' | 'comment';
        id: number;
    }>): Promise<Map<string, boolean>>;
    static createLike(userId: number, targetType: 'post' | 'comment', targetId: number): Promise<Like>;
    static removeLike(userId: number, targetType: 'post' | 'comment', targetId: number): Promise<boolean>;
    static toggleLike(userId: number, targetType: 'post' | 'comment', targetId: number): Promise<{
        liked: boolean;
        like?: Like;
    }>;
    static associate(models: any): void;
}
export default Like;
//# sourceMappingURL=Like.d.ts.map