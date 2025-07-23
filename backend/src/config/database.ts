import { Sequelize } from 'sequelize';
import logger from '../utils/logger';

// PostgreSQL connection configuration
const dbConfig = {
  dialect: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'forum_db',
  username: process.env.DB_USER || 'forum_user',
  password: process.env.DB_PASSWORD || 'forum_password',
  logging: process.env.NODE_ENV === 'development' ? (msg: string) => logger.debug(msg) : false,
  dialectOptions: {
    // SSL disabled for Docker deployment
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

export const sequelize = new Sequelize(dbConfig);

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    if (process.env.NODE_ENV !== 'test') {
      await sequelize.sync({ force: false });
      logger.info('Database models synchronized.');
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connection closed.');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

export default sequelize;