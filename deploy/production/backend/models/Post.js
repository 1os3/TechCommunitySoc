"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Post extends sequelize_1.Model {
    static async findActivePostById(id) {
        return this.findOne({
            where: { id, is_deleted: false },
        });
    }
    static async findActivePosts(limit = 20, offset = 0, orderBy = 'created_at') {
        const validOrderColumns = ['created_at', 'updated_at', 'hotness_score', 'like_count', 'view_count'];
        const orderColumn = validOrderColumns.includes(orderBy) ? orderBy : 'created_at';
        return this.findAll({
            where: { is_deleted: false },
            order: [[orderColumn, 'DESC']],
            limit,
            offset,
        });
    }
    static async findHotPosts(limit = 20) {
        return this.findAll({
            where: { is_deleted: false },
            order: [['hotness_score', 'DESC']],
            limit,
        });
    }
    async incrementViewCount() {
        await this.increment('view_count');
    }
    async incrementLikeCount() {
        await this.increment('like_count');
    }
    async decrementLikeCount() {
        await this.decrement('like_count');
    }
    async incrementCommentCount() {
        await this.increment('comment_count');
    }
    async decrementCommentCount() {
        await this.decrement('comment_count');
    }
    async updateHotnessScore() {
        const ageInHours = (Date.now() - this.created_at.getTime()) / (1000 * 60 * 60);
        const gravity = 1.8;
        const score = (this.like_count * 2 + this.comment_count * 3 + this.view_count * 0.1)
            / Math.pow(ageInHours + 2, gravity);
        await this.update({ hotness_score: score });
    }
    async softDelete() {
        await this.update({ is_deleted: true });
    }
    static associate(models) {
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
Post.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
        validate: {
            len: [1, 200],
            notEmpty: true,
        },
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 50000],
            notEmpty: true,
        },
    },
    author_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    view_count: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    like_count: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    comment_count: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    hotness_score: {
        type: sequelize_1.DataTypes.REAL,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    is_deleted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
});
exports.default = Post;
//# sourceMappingURL=Post.js.map