"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initViolationWord = void 0;
const sequelize_1 = require("sequelize");
class ViolationWord extends sequelize_1.Model {
    static associate(models) {
        ViolationWord.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });
    }
    toJSON() {
        return {
            id: this.id,
            word: this.word,
            is_regex: this.is_regex,
            is_active: this.is_active,
            created_by: this.created_by,
            created_at: this.created_at,
            updated_at: this.updated_at,
        };
    }
}
const initViolationWord = (sequelize) => {
    ViolationWord.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        word: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: false,
            comment: 'Violation word or regex pattern',
        },
        is_regex: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether this is a regex pattern',
        },
        is_active: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether this rule is active',
        },
        created_by: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            comment: 'Admin who created this rule',
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
        sequelize,
        modelName: 'ViolationWord',
        tableName: 'violation_words',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['is_active'],
            },
            {
                fields: ['created_by'],
            },
        ],
    });
    return ViolationWord;
};
exports.initViolationWord = initViolationWord;
exports.default = ViolationWord;
//# sourceMappingURL=ViolationWord.js.map