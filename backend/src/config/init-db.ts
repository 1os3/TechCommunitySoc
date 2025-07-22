import { sequelize } from './database';
import logger from '../utils/logger';
import { initializeModels } from '../models';

export const initializeDatabase = async (force: boolean = false): Promise<void> => {
  try {
    logger.info('Initializing database...');
    
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    // Initialize models with associations
    initializeModels();
    logger.info('Models initialized with associations');
    
    await sequelize.sync({ force });
    logger.info(`Database ${force ? 'reset and ' : ''}synchronized successfully`);
    
    if (force) {
      logger.info('Creating initial indexes...');
      await createIndexes();
      logger.info('Database indexes created');
    }
    
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

const createIndexes = async (): Promise<void> => {
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
      await sequelize.query(query);
    }
  } catch (error) {
    logger.error('Error creating indexes:', error);
    throw error;
  }
};

if (require.main === module) {
  const force = process.argv.includes('--force');
  initializeDatabase(force)
    .then(() => {
      logger.info('Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database initialization failed:', error);
      process.exit(1);
    });
}