"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Comment extends sequelize_1.Model {
    static async findByPostId(postId) {
        return this.findAll({
            where: {
                post_id: postId,
                is_deleted: false
            },
            order: [['created_at', 'ASC']],
        });
    }
    static async findCommentTree(postId) {
        const comments = await this.findByPostId(postId);
        return this.buildCommentTree(comments);
    }
    static buildCommentTree(comments) {
        const commentMap = new Map();
        const rootComments = [];
        comments.forEach(comment => {
            const commentWithReplies = comment;
            commentWithReplies.replies = [];
            commentMap.set(comment.id, commentWithReplies);
        });
        comments.forEach(comment => {
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.replies.push(comment);
                }
            }
            else {
                rootComments.push(comment);
            }
        });
        return rootComments;
    }
    static async findActiveCommentById(id) {
        return this.findOne({
            where: { id, is_deleted: false },
        });
    }
    async incrementLikeCount() {
        await this.increment('like_count');
    }
    async decrementLikeCount() {
        await this.decrement('like_count');
    }
    async softDelete() {
        await this.update({
            is_deleted: true,
            content: '[已删除]'
        });
    }
    async getRepliesCount() {
        return Comment.count({
            where: {
                parent_id: this.id,
                is_deleted: false
            }
        });
    }
    async hasReplies() {
        const count = await this.getRepliesCount();
        return count > 0;
    }
    static associate(models) {
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
Comment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 5000],
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
    post_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'posts',
            key: 'id',
        },
    },
    parent_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'comments',
            key: 'id',
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
});
exports.default = Comment;
//# sourceMappingURL=Comment.js.map