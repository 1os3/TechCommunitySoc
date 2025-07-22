import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
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

class Like extends Model<InferAttributes<Like>, InferCreationAttributes<Like>> {
  declare id: CreationOptional<number>;
  declare user_id: ForeignKey<User['id']>;
  declare target_type: 'post' | 'comment';
  declare target_id: number;
  declare created_at: CreationOptional<Date>;

  declare user?: NonAttribute<User>;

  static async findByUserAndTarget(userId: number, targetType: 'post' | 'comment', targetId: number): Promise<Like | null> {
    return this.findOne({
      where: {
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
      },
    });
  }

  static async countByTarget(targetType: 'post' | 'comment', targetId: number): Promise<number> {
    return this.count({
      where: {
        target_type: targetType,
        target_id: targetId,
      },
    });
  }

  static async getUserLikeStatus(userId: number, targets: Array<{ type: 'post' | 'comment'; id: number }>): Promise<Map<string, boolean>> {
    const likes = await this.findAll({
      where: {
        user_id: userId,
        target_type: targets.map(t => t.type),
        target_id: targets.map(t => t.id),
      },
    });

    const likeStatus = new Map<string, boolean>();
    
    targets.forEach(target => {
      const key = `${target.type}_${target.id}`;
      likeStatus.set(key, false);
    });

    likes.forEach(like => {
      const key = `${like.target_type}_${like.target_id}`;
      likeStatus.set(key, true);
    });

    return likeStatus;
  }

  static async createLike(userId: number, targetType: 'post' | 'comment', targetId: number): Promise<Like> {
    return this.create({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
    });
  }

  static async removeLike(userId: number, targetType: 'post' | 'comment', targetId: number): Promise<boolean> {
    const result = await this.destroy({
      where: {
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
      },
    });
    return result > 0;
  }

  static async toggleLike(userId: number, targetType: 'post' | 'comment', targetId: number): Promise<{ liked: boolean; like?: Like }> {
    const existingLike = await this.findByUserAndTarget(userId, targetType, targetId);
    
    if (existingLike) {
      await this.removeLike(userId, targetType, targetId);
      return { liked: false };
    } else {
      const like = await this.createLike(userId, targetType, targetId);
      return { liked: true, like };
    }
  }

  static associate(models: any): void {
    Like.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}

Like.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    target_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['post', 'comment']],
      },
    },
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Like',
    tableName: 'likes',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'target_type', 'target_id'],
      },
      {
        fields: ['target_type', 'target_id'],
      },
      {
        fields: ['user_id'],
      },
    ],
  }
);

export default Like;