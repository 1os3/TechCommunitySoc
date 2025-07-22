import { Model, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute } from 'sequelize';
import User from './User';
import Post from './Post';
export interface CommentAttributes {
    id: number;
    content: string;
    author_id: number;
    post_id: number;
    parent_id?: number;
    like_count: number;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CommentCreationAttributes extends Omit<CommentAttributes, 'id' | 'like_count' | 'is_deleted' | 'created_at' | 'updated_at'> {
    id?: CreationOptional<number>;
    like_count?: CreationOptional<number>;
    is_deleted?: CreationOptional<boolean>;
    created_at?: CreationOptional<Date>;
    updated_at?: CreationOptional<Date>;
}
declare class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
    id: CreationOptional<number>;
    content: string;
    author_id: ForeignKey<User['id']>;
    post_id: ForeignKey<Post['id']>;
    parent_id: ForeignKey<Comment['id']> | null;
    like_count: CreationOptional<number>;
    is_deleted: CreationOptional<boolean>;
    created_at: CreationOptional<Date>;
    updated_at: CreationOptional<Date>;
    author?: NonAttribute<User>;
    post?: NonAttribute<Post>;
    parent?: NonAttribute<Comment>;
    replies?: NonAttribute<Comment[]>;
    static findByPostId(postId: number): Promise<Comment[]>;
    static findCommentTree(postId: number): Promise<Comment[]>;
    private static buildCommentTree;
    static findActiveCommentById(id: number): Promise<Comment | null>;
    incrementLikeCount(): Promise<void>;
    decrementLikeCount(): Promise<void>;
    softDelete(): Promise<void>;
    getRepliesCount(): Promise<number>;
    hasReplies(): Promise<boolean>;
    static associate(models: any): void;
}
export default Comment;
//# sourceMappingURL=Comment.d.ts.map