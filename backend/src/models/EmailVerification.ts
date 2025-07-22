import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute, Op } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';
import crypto from 'crypto';

export interface EmailVerificationAttributes {
  id: number;
  user_id: number;
  token: string;
  type: 'verification' | 'password_reset';
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
}

export interface EmailVerificationCreationAttributes extends Omit<EmailVerificationAttributes, 'id' | 'created_at'> {
  id?: CreationOptional<number>;
  created_at?: CreationOptional<Date>;
}

class EmailVerification extends Model<InferAttributes<EmailVerification>, InferCreationAttributes<EmailVerification>> {
  declare id: CreationOptional<number>;
  declare user_id: ForeignKey<User['id']>;
  declare token: string;
  declare type: 'verification' | 'password_reset';
  declare expires_at: Date;
  declare is_used: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;

  declare user?: NonAttribute<User>;

  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async createVerificationToken(userId: number, type: 'verification' | 'password_reset', expiresInHours: number = 24): Promise<EmailVerification> {
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Invalidate any existing tokens of the same type for this user
    await this.update(
      { is_used: true },
      {
        where: {
          user_id: userId,
          type,
          is_used: false,
        },
      }
    );

    return this.create({
      user_id: userId,
      token,
      type,
      expires_at: expiresAt,
      is_used: false,
    });
  }

  static async findValidToken(token: string, type: 'verification' | 'password_reset'): Promise<EmailVerification | null> {
    return this.findOne({
      where: {
        token,
        type,
        is_used: false,
        expires_at: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });
  }

  static async verifyToken(token: string, type: 'verification' | 'password_reset'): Promise<{ valid: boolean; verification?: EmailVerification; user?: User }> {
    const verification = await this.findValidToken(token, type);
    
    if (!verification) {
      return { valid: false };
    }

    return {
      valid: true,
      verification,
      user: verification.user,
    };
  }

  async markAsUsed(): Promise<void> {
    await this.update({ is_used: true });
  }

  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  isValid(): boolean {
    return !this.is_used && !this.isExpired();
  }

  static async cleanupExpiredTokens(): Promise<number> {
    const result = await this.destroy({
      where: {
        expires_at: {
          [Op.lt]: new Date(),
        },
      },
    });
    return result;
  }

  static async cleanupUsedTokens(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.destroy({
      where: {
        is_used: true,
        created_at: {
          [Op.lt]: cutoffDate,
        },
      },
    });
    return result;
  }

  static async getUserActiveTokens(userId: number, type?: 'verification' | 'password_reset'): Promise<EmailVerification[]> {
    const whereClause: any = {
      user_id: userId,
      is_used: false,
      expires_at: {
        [Op.gt]: new Date(),
      },
    };

    if (type) {
      whereClause.type = type;
    }

    return this.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
    });
  }

  static associate(models: any): void {
    EmailVerification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}

EmailVerification.init(
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
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        len: [32, 255],
      },
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['verification', 'password_reset']],
      },
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'EmailVerification',
    tableName: 'email_verifications',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['token'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['is_used'],
      },
    ],
  }
);

export default EmailVerification;