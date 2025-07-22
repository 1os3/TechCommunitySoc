"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const database_1 = require("./database");
const logger_1 = __importDefault(require("../utils/logger"));
const models_1 = require("../models");
const initializeDatabase = async (force = false) => {
    try {
        logger_1.default.info('Initializing database...');
        await database_1.sequelize.authenticate();
        logger_1.default.info('Database connection established');
        // Initialize models with associations
        (0, models_1.initializeModels)();
        logger_1.default.info('Models initialized with associations');
        await database_1.sequelize.sync({ force });
        logger_1.default.info(`Database ${force ? 'reset and ' : ''}synchronized successfully`);
        if (force) {
            logger_1.default.info('Creating initial indexes...');
            await createIndexes();
            logger_1.default.info('Database indexes created');
        }
    }
    catch (error) {
        logger_1.default.error('Database initialization failed:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
const createIndexes = async () => {
    try {
        const queries = [
            'CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);',
            'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);',
            'CREATE INDEX IF NOT EXISTS idx_posts_hotness_score ON posts(hotness_score);',
            'CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted);',
            'CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);',
            'CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);',
            'CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);',
            'CREATE INDEX IF NOT EXISTS idx_likes_user_target ON likes(user_id, target_type, target_id);',
            'CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_user_interactions_post_id ON user_interactions(post_id);',
            'CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);',
            'CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);'
        ];
        for (const query of queries) {
            await database_1.sequelize.query(query);
        }
    }
    catch (error) {
        logger_1.default.error('Error creating indexes:', error);
        throw error;
    }
};
if (require.main === module) {
    const force = process.argv.includes('--force');
    (0, exports.initializeDatabase)(force)
        .then(() => {
        logger_1.default.info('Database initialization completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('Database initialization failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=init-db.js.map