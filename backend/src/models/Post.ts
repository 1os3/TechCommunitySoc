import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
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

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare content: string;
  declare author_id: ForeignKey<User['id']>;
  declare view_count: CreationOptional<number>;
  declare like_count: CreationOptional<number>;
  declare comment_count: CreationOptional<number>;
  declare hotness_score: CreationOptional<number>;
  declare is_deleted: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare author?: NonAttribute<User>;

  static async findActivePostById(id: number): Promise<Post | null> {
    return this.findOne({
      where: { id, is_deleted: false },
    });
  }

  static async findActivePosts(limit: number = 20, offset: number = 0, orderBy: string = 'created_at'): Promise<Post[]> {
    const validOrderColumns = ['created_at', 'updated_at', 'hotness_score', 'like_count', 'view_count'];
    const orderColumn = validOrderColumns.includes(orderBy) ? orderBy : 'created_at';
    
    return this.findAll({
      where: { is_deleted: false },
      order: [[orderColumn, 'DESC']],
      limit,
      offset,
    });
  }

  static async findHotPosts(limit: number = 20): Promise<Post[]> {
    return this.findAll({
      where: { is_deleted: false },
      order: [['hotness_score', 'DESC']],
      limit,
    });
  }

  async incrementViewCount(): Promise<void> {
    await this.increment('view_count');
  }

  async incrementLikeCount(): Promise<void> {
    await this.increment('like_count');
  }

  async decrementLikeCount(): Promise<void> {
    await this.decrement('like_count');
  }

  async incrementCommentCount(): Promise<void> {
    await this.increment('comment_count');
  }

  async decrementCommentCount(): Promise<void> {
    await this.decrement('comment_count');
  }

  async updateHotnessScore(): Promise<void> {
    const ageInHours = (Date.now() - this.created_at.getTime()) / (1000 * 60 * 60);
    const gravity = 1.8;
    
    const score = (this.like_count * 2 + this.comment_count * 3 + this.view_count * 0.1) 
                  / Math.pow(ageInHours + 2, gravity);
    
    await this.update({ hotness_score: score });
  }

  async softDelete(): Promise<void> {
    await this.update({ is_deleted: true });
  }

  static associate(models: any): void {
    Post.belongsTo(models.User, {
      foreignKey: 'author_id',
      as: 'author',
    });

    Post.hasMany(models.Comment, {
      foreignKey: 'post_id',
      as: 'comments',
    });

    Post.hasMany(models.UserInteraction, {
      foreignKey: 'post_id',
      as: 'interactions',
    });
  }
}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
        notEmpty: true,
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 50000],
        notEmpty: true,
      },
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    like_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    comment_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    hotness_score: {
      type: DataTypes.REAL,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    is_deleted: {
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
    modelName: 'Post',
    tableName: 'posts',
    timestamps: true,
    indexes: [
      {
        fields: ['author_id'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['hotness_score'],
      },
      {
        fields: ['is_deleted'],
      },
    ],
  }
);

export default Post;