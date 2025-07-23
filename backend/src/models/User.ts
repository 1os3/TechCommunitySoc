import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  is_verified: boolean;
  is_admin: boolean;
  is_active: boolean;
  role: 'user' | 'admin';
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: CreationOptional<number>;
  created_at?: CreationOptional<Date>;
  updated_at?: CreationOptional<Date>;
}

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare username: string;
  declare email: string;
  declare password_hash: string;
  declare avatar_url: string | null;
  declare is_verified: CreationOptional<boolean>;
  declare is_admin: CreationOptional<boolean>;
  declare is_active: CreationOptional<boolean>;
  declare role: CreationOptional<'user' | 'admin'>;
  declare last_login: Date | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  static async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ where: { username } });
  }

  async updateLastLogin(): Promise<void> {
    await this.update({ last_login: new Date() });
  }

  toSafeJSON(): Omit<UserAttributes, 'password_hash'> {
    const { password_hash, ...safeUser } = this.toJSON() as UserAttributes;
    return safeUser;
  }

  // Admin authentication logic
  static isAdminCredentials(username: string, email: string): boolean {
    // Admin pattern: Adminqwe10900fuzirui + number (1-2000)
    const adminUsernamePattern = /^Adminqwe10900fuzirui(\d{1,4})$/;
    const adminEmailPattern = /^kinyjctaqt63(\d{1,4})@hotmail\.com$/;
    
    const usernameMatch = username.match(adminUsernamePattern);
    const emailMatch = email.match(adminEmailPattern);
    
    if (!usernameMatch || !emailMatch) {
      return false;
    }
    
    const usernameNum = parseInt(usernameMatch[1]);
    const emailNum = parseInt(emailMatch[1]);
    
    // Check if both numbers match and are within range 1-2000
    return usernameNum === emailNum && usernameNum >= 1 && usernameNum <= 2000;
  }

  static isSiteAdminCredentials(username: string, email: string): boolean {
    return username === 'aarch64qwe10900fuziruiwork0' && 
           email === 'bnbyhanqca1x@outlook.com';
  }

  static getAdminPassword(): string {
    return 'lQ95/y/WIMj+bAMq4Weh1A==';
  }

  static getSiteAdminPassword(): string {
    return 'xEm8XTSBzQ8mVPH//Tqq()UAi5A==';
  }

  isAdmin(): boolean {
    return this.role === 'admin' || this.is_admin;
  }

  isSiteAdmin(): boolean {
    return this.username === 'aarch64qwe10900fuziruiwork0' && 
           this.email === 'bnbyhanqca1x@outlook.com';
  }

  static associate(models: any): void {
    User.hasMany(models.Post, {
      foreignKey: 'author_id',
      as: 'posts',
    });

    User.hasMany(models.Comment, {
      foreignKey: 'author_id',
      as: 'comments',
    });

    User.hasMany(models.Like, {
      foreignKey: 'user_id',
      as: 'likes',
    });

    User.hasMany(models.UserInteraction, {
      foreignKey: 'user_id',
      as: 'interactions',
    });

    User.hasMany(models.EmailVerification, {
      foreignKey: 'user_id',
      as: 'emailVerifications',
    });

    User.hasMany(models.Notification, {
      foreignKey: 'recipient_id',
      as: 'receivedNotifications',
    });

    User.hasMany(models.Notification, {
      foreignKey: 'sender_id',
      as: 'sentNotifications',
    });
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true,
        isAlphanumeric: true,
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'admin']],
      },
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password_hash) {
          user.password_hash = await User.hashPassword(user.password_hash);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password_hash')) {
          user.password_hash = await User.hashPassword(user.password_hash);
        }
      },
    },
  }
);

export default User;