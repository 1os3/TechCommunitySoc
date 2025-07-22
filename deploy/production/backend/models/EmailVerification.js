"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = __importDefault(require("./User"));
const crypto_1 = __importDefault(require("crypto"));
class EmailVerification extends sequelize_1.Model {
    static generateSecureToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static async createVerificationToken(userId, type, expiresInHours = 24) {
        const token = this.generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);
        // Invalidate any existing tokens of the same type for this user
        await this.update({ is_used: true }, {
            where: {
                user_id: userId,
                type,
                is_used: false,
            },
        });
        return this.create({
            user_id: userId,
            token,
            type,
            expires_at: expiresAt,
            is_used: false,
        });
    }
    static async findValidToken(token, type) {
        return this.findOne({
            where: {
                token,
                type,
                is_used: false,
                expires_at: {
                    [sequelize_1.Op.gt]: new Date(),
                },
            },
            include: [
                {
                    model: User_1.default,
                    as: 'user',
                },
            ],
        });
    }
    static async verifyToken(token, type) {
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
    async markAsUsed() {
        await this.update({ is_used: true });
    }
    isExpired() {
        return new Date() > this.expires_at;
    }
    isValid() {
        return !this.is_used && !this.isExpired();
    }
    static async cleanupExpiredTokens() {
        const result = await this.destroy({
            where: {
                expires_at: {
                    [sequelize_1.Op.lt]: new Date(),
                },
            },
        });
        return result;
    }
    static async cleanupUsedTokens(olderThanDays = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const result = await this.destroy({
            where: {
                is_used: true,
                created_at: {
                    [sequelize_1.Op.lt]: cutoffDate,
                },
            },
        });
        return result;
    }
    static async getUserActiveTokens(userId, type) {
        const whereClause = {
            user_id: userId,
            is_used: false,
            expires_at: {
                [sequelize_1.Op.gt]: new Date(),
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
    static associate(models) {
        EmailVerification.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user',
        });
    }
}
EmailVerification.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    token: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            len: [32, 255],
        },
    },
    type: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['verification', 'password_reset']],
        },
    },
    expires_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    is_used: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.sequelize,
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
});
exports.default = EmailVerification;
//# sourceMappingURL=EmailVerification.js.map