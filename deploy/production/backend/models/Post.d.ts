import { Model, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute } from 'sequelize';
import User from './User';
export interface PostAttributes {
    id: number;
    title: string;
    content: string;
    author_id: number;
    view_count: number;
    like_count: number;
    comment_count: number;
    hotness_score: number;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface PostCreationAttributes extends Omit<PostAttributes, 'id' | 'view_count' | 'like_count' | 'comment_count' | 'hotness_score' | 'is_deleted' | 'created_at' | 'updated_at'> {
    id?: CreationOptional<number>;
    view_count?: CreationOptional<number>;
    like_count?: CreationOptional<number>;
    comment_count?: CreationOptional<number>;
    hotness_score?: CreationOptional<number>;
    is_deleted?: CreationOptional<boolean>;
    created_at?: CreationOptional<Date>;
    updated_at?: CreationOptional<Date>;
}
declare class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
    id: CreationOptional<number>;
    title: string;
    content: string;
    author_id: ForeignKey<User['id']>;
    view_count: CreationOptional<number>;
    like_count: CreationOptional<number>;
    comment_count: CreationOptional<number>;
    hotness_score: CreationOptional<number>;
    is_deleted: CreationOptional<boolean>;
    created_at: CreationOptional<Date>;
    updated_at: CreationOptional<Date>;
    author?: NonAttribute<User>;
    static findActivePostById(id: number): Promise<Post | null>;
    static findActivePosts(limit?: number, offset?: number, orderBy?: string): Promise<Post[]>;
    static findHotPosts(limit?: number): Promise<Post[]>;
    incrementViewCount(): Promise<void>;
    incrementLikeCount(): Promise<void>;
    decrementLikeCount(): Promise<void>;
    incrementCommentCount(): Promise<void>;
    decrementCommentCount(): Promise<void>;
    updateHotnessScore(): Promise<void>;
    softDelete(): Promise<void>;
    static associate(models: any): void;
}
export default Post;
//# sourceMappingURL=Post.d.ts.map