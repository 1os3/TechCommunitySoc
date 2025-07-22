import { Model, DataTypes, Sequelize } from 'sequelize';
import { Models } from './index';

export interface ViolationAttributes {
  id: number;
  user_id: number;
  content_type: 'post' | 'comment';
  content_id: number;
  violation_word_id: number;
  matched_text: string;
  content_snippet: string;
  detected_at: Date;
  status: 'pending' | 'reviewed' | 'ignored';
  reviewed_by?: number;
  reviewed_at?: Date;
  notes?: string;
}

export interface ViolationCreationAttributes extends Omit<ViolationAttributes, 'id' | 'detected_at' | 'reviewed_by' | 'reviewed_at' | 'notes'> {}

class Violation extends Model<ViolationAttributes, ViolationCreationAttributes> implements ViolationAttributes {
  public id!: number;
  public user_id!: number;
  public content_type!: 'post' | 'comment';
  public content_id!: number;
  public violation_word_id!: number;
  public matched_text!: string;
  public content_snippet!: string;
  public readonly detected_at!: Date;
  public status!: 'pending' | 'reviewed' | 'ignored';
  public reviewed_by?: number;
  public reviewed_at?: Date;
  public notes?: string;

  static associate(models: Models): void {
    Violation.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    Violation.belongsTo(models.User, {
      foreignKey: 'reviewed_by',
      as: 'reviewer'
    });

    Violation.belongsTo(models.ViolationWord, {
      foreignKey: 'violation_word_id',
      as: 'violation_word'
    });
  }

  public toJSON(): Partial<ViolationAttributes> {
    return {
      id: this.id,
      user_id: this.user_id,
      content_type: this.content_type,
      content_id: this.content_id,
      violation_word_id: this.violation_word_id,
      matched_text: this.matched_text,
      content_snippet: this.content_snippet,
      detected_at: this.detected_at,
      status: this.status,
      reviewed_by: this.reviewed_by,
      reviewed_at: this.reviewed_at,
      notes: this.notes,
    };
  }
}

export const initViolation = (sequelize: Sequelize): typeof Violation => {
  Violation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'User who posted the violating content',
      },
      content_type: {
        type: DataTypes.ENUM('post', 'comment'),
        allowNull: false,
        comment: 'Type of content that violated rules',
      },
      content_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID of the violating content',
      },
      violation_word_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'violation_words',
          key: 'id',
        },
        comment: 'Which violation rule was triggered',
      },
      matched_text: {
        type: DataTypes.STRING(1000),
        allowNull: false,
        comment: 'The actual text that matched the violation rule',
      },
      content_snippet: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Snippet of content around the violation for context',
      },
      detected_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM('pending', 'reviewed', 'ignored'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Review status of this violation',
      },
      reviewed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'Admin who reviewed this violation',
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When this violation was reviewed',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Admin notes about this violation',
      },
    },
    {
      sequelize,
      modelName: 'Violation',
      tableName: 'violations',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          fields: ['content_type', 'content_id'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['detected_at'],
        },
        {
          fields: ['user_id', 'detected_at'],
        },
      ],
    }
  );

  return Violation;
};

export default Violation;