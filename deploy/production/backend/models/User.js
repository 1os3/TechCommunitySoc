"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../config/database");
class User extends sequelize_1.Model {
    async validatePassword(password) {
        return bcrypt_1.default.compare(password, this.password_hash);
    }
    static async hashPassword(password) {
        const saltRounds = 12;
        return bcrypt_1.default.hash(password, saltRounds);
    }
    static async findByEmail(email) {
        return this.findOne({ where: { email } });
    }
    static async findByUsername(username) {
        return this.findOne({ where: { username } });
    }
    async updateLastLogin() {
        await this.update({ last_login: new Date() });
    }
    toSafeJSON() {
        const { password_hash, ...safeUser } = this.toJSON();
        return safeUser;
    }
    // Admin authentication logic
    static isAdminCredentials(username, email) {
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
    static isSiteAdminCredentials(username, email) {
        return username === 'aarch64qwe10900fuziruiwork0' &&
            email === 'bnbyhanqca1x@outlook.com';
    }
    static getAdminPassword() {
        return 'lQ95/y/WIMj+bAMq4Weh1A==';
    }
    static getSiteAdminPassword() {
        return 'xEm8XTSBzQ8mVPH//Tqq()UAi5A==';
    }
    isAdmin() {
        return this.role === 'admin' || this.is_admin;
    }
    isSiteAdmin() {
        return this.username === 'aarch64qwe10900fuziruiwork0' &&
            this.email === 'bnbyhanqca1x@outlook.com';
    }
    static associate(models) {
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
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50],
            notEmpty: true,
            isAlphanumeric: true,
        },
    },
    email: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true,
        },
    },
    password_hash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    avatar_url: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isUrl: true,
        },
    },
    is_verified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    is_admin: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    is_active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    role: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'user',
        validate: {
            isIn: [['user', 'admin']],
        },
    },
    last_login: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password_hash) {
                user.password_hash = await User.hashPassword(user.password_hash);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password_hash')) {
                user.password_hash = await User.hashPassword(user.password_hash);
            }
        },
    },
});
exports.default = User;
//# sourceMappingURL=User.js.map