import { sequelize } from '../src/config/database';
import { initializeModels } from '../src/models';

let testDbName: string;

beforeAll(async () => {
  // Set environment to test
  process.env.NODE_ENV = 'test';
  
  // Create unique database name for this test run
  testDbName = `forum_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set test database configuration
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = testDbName;
  process.env.DB_USER = 'forum_user';
  process.env.DB_PASSWORD = 'forum_password';
  
  try {
    // Create test database dynamically
    const { Sequelize } = require('sequelize');
    const adminConnection = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: 'postgres',  // Connect to default postgres db to create test db
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      logging: false
    });
    
    try {
      await adminConnection.authenticate();
      await adminConnection.query(`CREATE DATABASE "${testDbName}";`);
      console.log(`Test database created: ${testDbName}`);
    } catch (createError: any) {
      if (!createError.message.includes('already exists')) {
        throw createError;
      }
    } finally {
      await adminConnection.close();
    }
    
    // Now connect to the test database
    await sequelize.authenticate();
    console.log('Test database connection established');
    
    // Initialize models with associations
    initializeModels();
    
    // Create all tables
    await sequelize.sync({ 
      force: true,
      hooks: false,
      logging: false
    });
    
    console.log('Test database synchronized');
  } catch (error) {
    console.error('Failed to set up test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
    
    // Clean up test database
    if (testDbName) {
      const { Sequelize } = require('sequelize');
      const adminConnection = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: 'postgres',
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        logging: false
      });
      
      try {
        await adminConnection.authenticate();
        await adminConnection.query(`DROP DATABASE IF EXISTS "${testDbName}";`);
        console.log(`Test database cleaned up: ${testDbName}`);
      } catch (error) {
        console.log('Cleanup warning:', error);
      } finally {
        await adminConnection.close();
      }
    }
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
});

beforeEach(async () => {
  // Clean up data between tests
  try {
    const models = sequelize.models;
    
    // For PostgreSQL, delete in reverse dependency order to avoid foreign key issues
    const deleteOrder = ['UserInteraction', 'EmailVerification', 'Like', 'Comment', 'Post', 'User'];
    
    for (const modelName of deleteOrder) {
      const model = models[modelName];
      if (model && typeof model.destroy === 'function') {
        await model.destroy({ where: {}, force: true });
      }
    }
  } catch (error: any) {
    // If cleanup fails, log but don't fail the test
    console.log('Cleanup warning:', error?.message || 'Unknown error');
  }
});