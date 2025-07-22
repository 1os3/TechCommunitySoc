import { Model, DataTypes, Sequelize } from 'sequelize';
import { Models } from './index';

export interface ViolationWordAttributes {
  id: number;
  word: string;
  is_regex: boolean;
  is_active: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface ViolationWordCreationAttributes extends Omit<ViolationWordAttributes, 'id' | 'created_at' | 'updated_at'> {}

class ViolationWord extends Model<ViolationWordAttributes, ViolationWordCreationAttributes> implements ViolationWordAttributes {
  public id!: number;
  public word!: string;
  public is_regex!: boolean;
  public is_active!: boolean;
  public created_by!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  static associate(models: Models): void {
    ViolationWord.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  }

  public toJSON(): Partial<ViolationWordAttributes> {
    return {
      id: this.id,
      word: this.word,
      is_regex: this.is_regex,
      is_active: this.is_active,
      created_by: this.created_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export const initViolationWord = (sequelize: Sequelize): typeof ViolationWord => {
  ViolationWord.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      word: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Violation word or regex pattern',
      },
      is_regex: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this is a regex pattern',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this rule is active',
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'Admin who created this rule',
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
      modelName: 'ViolationWord',
      tableName: 'violation_words',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['is_active'],
        },
        {
          fields: ['created_by'],
        },
      ],
    }
  );

  return ViolationWord;
};

export default ViolationWord;