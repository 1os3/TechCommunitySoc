"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabaseConnection = exports.connectDatabase = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const logger_1 = __importDefault(require("../utils/logger"));
// PostgreSQL connection configuration
const dbConfig = {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'forum_db',
    username: process.env.DB_USER || 'forum_user',
    password: process.env.DB_PASSWORD || 'forum_password',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger_1.default.debug(msg) : false,
    dialectOptions: {
        // SSL configuration for production
        ...(process.env.NODE_ENV === 'production' && {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        })
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
    }
};
exports.sequelize = new sequelize_1.Sequelize(dbConfig);
const connectDatabase = async () => {
    try {
        await exports.sequelize.authenticate();
        logger_1.default.info('Database connection has been established successfully.');
        if (process.env.NODE_ENV !== 'test') {
            await exports.sequelize.sync({ force: false });
            logger_1.default.info('Database models synchronized.');
        }
    }
    catch (error) {
        logger_1.default.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const closeDatabaseConnection = async () => {
    try {
        await exports.sequelize.close();
        logger_1.default.info('Database connection closed.');
    }
    catch (error) {
        logger_1.default.error('Error closing database connection:', error);
        throw error;
    }
};
exports.closeDatabaseConnection = closeDatabaseConnection;
exports.default = exports.sequelize;
//# sourceMappingURL=database.js.map