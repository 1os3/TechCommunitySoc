"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Notification extends sequelize_1.Model {
    static associate(models) {
        Notification.belongsTo(models.User, {
            foreignKey: 'recipient_id',
            as: 'recipient',
        });
        Notification.belongsTo(models.User, {
            foreignKey: 'sender_id',
            as: 'sender',
        });
        Notification.belongsTo(models.Post, {
            foreignKey: 'post_id',
            as: 'post',
        });
        Notification.belongsTo(models.Comment, {
            foreignKey: 'comment_id',
            as: 'comment',
        });
    }
}
Notification.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    recipient_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    sender_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    type: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['like', 'comment', 'reply']],
        },
    },
    post_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'posts',
            key: 'id',
        },
    },
    comment_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'comments',
            key: 'id',
        },
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    is_read: {
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
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        {
            fields: ['recipient_id'],
        },
        {
            fields: ['recipient_id', 'is_read'],
        },
        {
            fields: ['created_at'],
        },
    ],
});
exports.default = Notification;
//# sourceMappingURL=Notification.js.map