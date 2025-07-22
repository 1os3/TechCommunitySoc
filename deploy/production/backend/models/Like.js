"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Like extends sequelize_1.Model {
    static async findByUserAndTarget(userId, targetType, targetId) {
        return this.findOne({
            where: {
                user_id: userId,
                target_type: targetType,
                target_id: targetId,
            },
        });
    }
    static async countByTarget(targetType, targetId) {
        return this.count({
            where: {
                target_type: targetType,
                target_id: targetId,
            },
        });
    }
    static async getUserLikeStatus(userId, targets) {
        const likes = await this.findAll({
            where: {
                user_id: userId,
                target_type: targets.map(t => t.type),
                target_id: targets.map(t => t.id),
            },
        });
        const likeStatus = new Map();
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
    static async createLike(userId, targetType, targetId) {
        return this.create({
            user_id: userId,
            target_type: targetType,
            target_id: targetId,
        });
    }
    static async removeLike(userId, targetType, targetId) {
        const result = await this.destroy({
            where: {
                user_id: userId,
                target_type: targetType,
                target_id: targetId,
            },
        });
        return result > 0;
    }
    static async toggleLike(userId, targetType, targetId) {
        const existingLike = await this.findByUserAndTarget(userId, targetType, targetId);
        if (existingLike) {
            await this.removeLike(userId, targetType, targetId);
            return { liked: false };
        }
        else {
            const like = await this.createLike(userId, targetType, targetId);
            return { liked: true, like };
        }
    }
    static associate(models) {
        Like.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user',
        });
    }
}
Like.init({
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
    target_type: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['post', 'comment']],
        },
    },
    target_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
        },
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.sequelize,
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
});
exports.default = Like;
//# sourceMappingURL=Like.js.map