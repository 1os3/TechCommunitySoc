import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute, Op } from 'sequelize';
import { sequelize } from '../config/database';
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

class UserInteraction extends Model<InferAttributes<UserInteraction>, InferCreationAttributes<UserInteraction>> {
  declare id: CreationOptional<number>;
  declare user_id: ForeignKey<User['id']>;
  declare post_id: ForeignKey<Post['id']>;
  declare interaction_type: 'view' | 'like' | 'comment';
  declare interaction_weight: number;
  declare created_at: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare post?: NonAttribute<Post>;

  static async recordInteraction(
    userId: number,
    postId: number,
    interactionType: 'view' | 'like' | 'comment',
    weight: number = 1.0
  ): Promise<UserInteraction> {
    return this.create({
      user_id: userId,
      post_id: postId,
      interaction_type: interactionType,
      interaction_weight: weight,
    });
  }

  static async getUserInteractionHistory(userId: number, limit: number = 100): Promise<UserInteraction[]> {
    return this.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  static async getPostInteractionStats(postId: number): Promise<{
    views: number;
    likes: number;
    comments: number;
    totalWeight: number;
  }> {
    const stats = await this.findAll({
      where: { post_id: postId },
      attributes: [
        'interaction_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('interaction_weight')), 'total_weight'],
      ],
      group: ['interaction_type'],
      raw: true,
    }) as unknown as Array<{
      interaction_type: string;
      count: string;
      total_weight: string;
    }>;

    const result = {
      views: 0,
      likes: 0,
      comments: 0,
      totalWeight: 0,
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      const weight = parseFloat(stat.total_weight);
      
      switch (stat.interaction_type) {
        case 'view':
          result.views = count;
          break;
        case 'like':
          result.likes = count;
          break;
        case 'comment':
          result.comments = count;
          break;
      }
      result.totalWeight += weight;
    });

    return result;
  }

  static async getUserPreferences(userId: number): Promise<{
    totalInteractions: number;
    interactionsByType: Record<string, number>;
    averageWeight: number;
  }> {
    const interactions = await this.findAll({
      where: { user_id: userId },
      attributes: [
        'interaction_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('interaction_weight')), 'avg_weight'],
      ],
      group: ['interaction_type'],
      raw: true,
    }) as unknown as Array<{
      interaction_type: string;
      count: string;
      avg_weight: string;
    }>;

    const result = {
      totalInteractions: 0,
      interactionsByType: {} as Record<string, number>,
      averageWeight: 0,
    };

    let totalWeight = 0;
    interactions.forEach(interaction => {
      const count = parseInt(interaction.count);
      const avgWeight = parseFloat(interaction.avg_weight);
      
      result.totalInteractions += count;
      result.interactionsByType[interaction.interaction_type] = count;
      totalWeight += avgWeight * count;
    });

    result.averageWeight = result.totalInteractions > 0 ? totalWeight / result.totalInteractions : 0;

    return result;
  }

  static async findSimilarUsers(userId: number, limit: number = 10): Promise<number[]> {
    // Find users who have interacted with similar posts
    const userInteractions = await this.findAll({
      where: { user_id: userId },
      attributes: ['post_id'],
      group: ['post_id'],
    });

    const postIds = userInteractions.map(interaction => interaction.post_id);
    
    if (postIds.length === 0) {
      return [];
    }

    const similarUsers = await this.findAll({
      where: {
        post_id: postIds,
        user_id: { [Op.ne]: userId },
      },
      attributes: [
        'user_id',
        [sequelize.fn('COUNT', sequelize.col('post_id')), 'common_posts'],
        [sequelize.fn('SUM', sequelize.col('interaction_weight')), 'total_weight'],
      ],
      group: ['user_id'],
      order: [
        [sequelize.literal('common_posts'), 'DESC'],
        [sequelize.literal('total_weight'), 'DESC'],
      ],
      limit,
      raw: true,
    }) as unknown as Array<{
      user_id: number;
      common_posts: string;
      total_weight: string;
    }>;

    return similarUsers.map(user => user.user_id);
  }

  static associate(models: any): void {
    UserInteraction.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    UserInteraction.belongsTo(models.Post, {
      foreignKey: 'post_id',
      as: 'post',
    });
  }
}

UserInteraction.init(
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
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
    },
    interaction_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['view', 'like', 'comment']],
      },
    },
    interaction_weight: {
      type: DataTypes.REAL,
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: 0,
        max: 10,
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
    modelName: 'UserInteraction',
    tableName: 'user_interactions',
    timestamps: false,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['post_id'],
      },
      {
        fields: ['user_id', 'post_id'],
      },
      {
        fields: ['interaction_type'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default UserInteraction;