import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

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

class Notification extends Model<InferAttributes<Notification>, InferCreationAttributes<Notification>> {
  declare id: CreationOptional<number>;
  declare recipient_id: number;
  declare sender_id: number;
  declare type: 'like' | 'comment' | 'reply';
  declare post_id: number | null;
  declare comment_id: number | null;
  declare message: string;
  declare is_read: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  static associate(models: any): void {
    Notification.belongsTo(models.User, {
      foreignKey: 'recipient_id',
      as: 'recipient',
    });

    Notification.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender',
    });

    Notification.belongsTo(models.Post, {
      foreignKey: 'post_id',
      as: 'post',
    });

    Notification.belongsTo(models.Comment, {
      foreignKey: 'comment_id',
      as: 'comment',
    });
  }
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['like', 'comment', 'reply']],
      },
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'posts',
        key: 'id',
      },
    },
    comment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['recipient_id'],
      },
      {
        fields: ['recipient_id', 'is_read'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default Notification;