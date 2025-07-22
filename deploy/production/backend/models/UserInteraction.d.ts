import { Model, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute } from 'sequelize';
import User from './User';
import Post from './Post';
export interface UserInteractionAttributes {
    id: number;
    user_id: number;
    post_id: number;
    interaction_type: 'view' | 'like' | 'comment';
    interaction_weight: number;
    created_at: Date;
}
export interface UserInteractionCreationAttributes extends Omit<UserInteractionAttributes, 'id' | 'created_at'> {
    id?: CreationOptional<number>;
    created_at?: CreationOptional<Date>;
}
declare class UserInteraction extends Model<InferAttributes<UserInteraction>, InferCreationAttributes<UserInteraction>> {
    id: CreationOptional<number>;
    user_id: ForeignKey<User['id']>;
    post_id: ForeignKey<Post['id']>;
    interaction_type: 'view' | 'like' | 'comment';
    interaction_weight: number;
    created_at: CreationOptional<Date>;
    user?: NonAttribute<User>;
    post?: NonAttribute<Post>;
    static recordInteraction(userId: number, postId: number, interactionType: 'view' | 'like' | 'comment', weight?: number): Promise<UserInteraction>;
    static getUserInteractionHistory(userId: number, limit?: number): Promise<UserInteraction[]>;
    static getPostInteractionStats(postId: number): Promise<{
        views: number;
        likes: number;
        comments: number;
        totalWeight: number;
    }>;
    static getUserPreferences(userId: number): Promise<{
        totalInteractions: number;
        interactionsByType: Record<string, number>;
        averageWeight: number;
    }>;
    static findSimilarUsers(userId: number, limit?: number): Promise<number[]>;
    static associate(models: any): void;
}
export default UserInteraction;
//# sourceMappingURL=UserInteraction.d.ts.map