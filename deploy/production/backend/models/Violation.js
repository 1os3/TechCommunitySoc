"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initViolation = void 0;
const sequelize_1 = require("sequelize");
class Violation extends sequelize_1.Model {
    static associate(models) {
        Violation.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
        Violation.belongsTo(models.User, {
            foreignKey: 'reviewed_by',
            as: 'reviewer'
        });
        Violation.belongsTo(models.ViolationWord, {
            foreignKey: 'violation_word_id',
            as: 'violation_word'
        });
    }
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            content_type: this.content_type,
            content_id: this.content_id,
            violation_word_id: this.violation_word_id,
            matched_text: this.matched_text,
            content_snippet: this.content_snippet,
            detected_at: this.detected_at,
            status: this.status,
            reviewed_by: this.reviewed_by,
            reviewed_at: this.reviewed_at,
            notes: this.notes,
        };
    }
}
const initViolation = (sequelize) => {
    Violation.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            comment: 'User who posted the violating content',
        },
        content_type: {
            type: sequelize_1.DataTypes.ENUM('post', 'comment'),
            allowNull: false,
            comment: 'Type of content that violated rules',
        },
        content_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: 'ID of the violating content',
        },
        violation_word_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'violation_words',
                key: 'id',
            },
            comment: 'Which violation rule was triggered',
        },
        matched_text: {
            type: sequelize_1.DataTypes.STRING(1000),
            allowNull: false,
            comment: 'The actual text that matched the violation rule',
        },
        content_snippet: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
            comment: 'Snippet of content around the violation for context',
        },
        detected_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('pending', 'reviewed', 'ignored'),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Review status of this violation',
        },
        reviewed_by: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
            comment: 'Admin who reviewed this violation',
        },
        reviewed_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            comment: 'When this violation was reviewed',
        },
        notes: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'Admin notes about this violation',
        },
    }, {
        sequelize,
        modelName: 'Violation',
        tableName: 'violations',
        timestamps: false,
        underscored: true,
        indexes: [
            {
                fields: ['user_id'],
            },
            {
                fields: ['content_type', 'content_id'],
            },
            {
                fields: ['status'],
            },
            {
                fields: ['detected_at'],
            },
            {
                fields: ['user_id', 'detected_at'],
            },
        ],
    });
    return Violation;
};
exports.initViolation = initViolation;
exports.default = Violation;
//# sourceMappingURL=Violation.js.map