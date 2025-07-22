import { Model, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
export interface NotificationAttributes {
    id: number;
    recipient_id: number;
    sender_id: number;
    type: 'like' | 'comment' | 'reply';
    post_id?: number;
    comment_id?: number;
    message: string;
    is_read: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface NotificationCreationAttributes extends Omit<NotificationAttributes, 'id' | 'created_at' | 'updated_at'> {
    id?: CreationOptional<number>;
    created_at?: CreationOptional<Date>;
    updated_at?: CreationOptional<Date>;
}
declare class Notification extends Model<InferAttributes<Notification>, InferCreationAttributes<Notification>> {
    id: CreationOptional<number>;
    recipient_id: number;
    sender_id: number;
    type: 'like' | 'comment' | 'reply';
    post_id: number | null;
    comment_id: number | null;
    message: string;
    is_read: CreationOptional<boolean>;
    created_at: CreationOptional<Date>;
    updated_at: CreationOptional<Date>;
    static associate(models: any): void;
}
export default Notification;
//# sourceMappingURL=Notification.d.ts.map