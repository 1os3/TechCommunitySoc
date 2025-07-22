import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
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

class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  declare id: CreationOptional<number>;
  declare content: string;
  declare author_id: ForeignKey<User['id']>;
  declare post_id: ForeignKey<Post['id']>;
  declare parent_id: ForeignKey<Comment['id']> | null;
  declare like_count: CreationOptional<number>;
  declare is_deleted: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare author?: NonAttribute<User>;
  declare post?: NonAttribute<Post>;
  declare parent?: NonAttribute<Comment>;
  declare replies?: NonAttribute<Comment[]>;

  static async findByPostId(postId: number): Promise<Comment[]> {
    return this.findAll({
      where: { 
        post_id: postId,
        is_deleted: false 
      },
      order: [['created_at', 'ASC']],
    });
  }

  static async findCommentTree(postId: number): Promise<Comment[]> {
    const comments = await this.findByPostId(postId);
    return this.buildCommentTree(comments);
  }

  private static buildCommentTree(comments: Comment[]): Comment[] {
    const commentMap = new Map<number, Comment & { replies: Comment[] }>();
    const rootComments: Comment[] = [];

    comments.forEach(comment => {
      const commentWithReplies = comment as Comment & { replies: Comment[] };
      commentWithReplies.replies = [];
      commentMap.set(comment.id, commentWithReplies);
    });

    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }

  static async findActiveCommentById(id: number): Promise<Comment | null> {
    return this.findOne({
      where: { id, is_deleted: false },
    });
  }

  async incrementLikeCount(): Promise<void> {
    await this.increment('like_count');
  }

  async decrementLikeCount(): Promise<void> {
    await this.decrement('like_count');
  }

  async softDelete(): Promise<void> {
    await this.update({ 
      is_deleted: true,
      content: '[已删除]'
    });
  }

  async getRepliesCount(): Promise<number> {
    return Comment.count({
      where: { 
        parent_id: this.id,
        is_deleted: false 
      }
    });
  }

  async hasReplies(): Promise<boolean> {
    const count = await this.getRepliesCount();
    return count > 0;
  }

  static associate(models: any): void {
    Comment.belongsTo(models.User, {
      foreignKey: 'author_id',
      as: 'author',
    });

    Comment.belongsTo(models.Post, {
      foreignKey: 'post_id',
      as: 'post',
    });

    Comment.belongsTo(models.Comment, {
      foreignKey: 'parent_id',
      as: 'parent',
    });

    Comment.hasMany(models.Comment, {
      foreignKey: 'parent_id',
      as: 'replies',
    });
  }
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000],
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
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
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
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: true,
    indexes: [
      {
        fields: ['post_id'],
      },
      {
        fields: ['author_id'],
      },
      {
        fields: ['parent_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default Comment;