"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class UserInteraction extends sequelize_1.Model {
    static async recordInteraction(userId, postId, interactionType, weight = 1.0) {
        return this.create({
            user_id: userId,
            post_id: postId,
            interaction_type: interactionType,
            interaction_weight: weight,
        });
    }
    static async getUserInteractionHistory(userId, limit = 100) {
        return this.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit,
        });
    }
    static async getPostInteractionStats(postId) {
        const stats = await this.findAll({
            where: { post_id: postId },
            attributes: [
                'interaction_type',
                [database_1.sequelize.fn('COUNT', database_1.sequelize.col('id')), 'count'],
                [database_1.sequelize.fn('SUM', database_1.sequelize.col('interaction_weight')), 'total_weight'],
            ],
            group: ['interaction_type'],
            raw: true,
        });
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
    static async getUserPreferences(userId) {
        const interactions = await this.findAll({
            where: { user_id: userId },
            attributes: [
                'interaction_type',
                [database_1.sequelize.fn('COUNT', database_1.sequelize.col('id')), 'count'],
                [database_1.sequelize.fn('AVG', database_1.sequelize.col('interaction_weight')), 'avg_weight'],
            ],
            group: ['interaction_type'],
            raw: true,
        });
        const result = {
            totalInteractions: 0,
            interactionsByType: {},
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
    static async findSimilarUsers(userId, limit = 10) {
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
                user_id: { [sequelize_1.Op.ne]: userId },
            },
            attributes: [
                'user_id',
                [database_1.sequelize.fn('COUNT', database_1.sequelize.col('post_id')), 'common_posts'],
                [database_1.sequelize.fn('SUM', database_1.sequelize.col('interaction_weight')), 'total_weight'],
            ],
            group: ['user_id'],
            order: [
                [database_1.sequelize.literal('common_posts'), 'DESC'],
                [database_1.sequelize.literal('total_weight'), 'DESC'],
            ],
            limit,
            raw: true,
        });
        return similarUsers.map(user => user.user_id);
    }
    static associate(models) {
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
UserInteraction.init({
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
    post_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'posts',
            key: 'id',
        },
    },
    interaction_type: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['view', 'like', 'comment']],
        },
    },
    interaction_weight: {
        type: sequelize_1.DataTypes.REAL,
        allowNull: false,
        defaultValue: 1.0,
        validate: {
            min: 0,
            max: 10,
        },
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.sequelize,
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
});
exports.default = UserInteraction;
//# sourceMappingURL=UserInteraction.js.map