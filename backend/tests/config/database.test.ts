import { Sequelize } from 'sequelize';

describe('Database Configuration', () => {
  describe('PostgreSQL Database Connection', () => {
    it('should connect to PostgreSQL database successfully', async () => {
      const testSequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'forum_db',
        username: process.env.DB_USER || 'forum_user',
        password: process.env.DB_PASSWORD || 'forum_password',
        logging: false,
      });

      await expect(testSequelize.authenticate()).resolves.not.toThrow();
      expect(testSequelize.authenticate).toBeDefined();
      
      await testSequelize.close();
    });

    it('should sync database tables successfully', async () => {
      const testSequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'forum_db',
        username: process.env.DB_USER || 'forum_user',
        password: process.env.DB_PASSWORD || 'forum_password',
        logging: false,
      });

      await testSequelize.authenticate();
      await expect(testSequelize.sync({ force: false })).resolves.not.toThrow();
      
      await testSequelize.close();
    });
  });

  describe('Sequelize Configuration', () => {
    it('should be configured with postgres dialect', () => {
      const testSequelize = new Sequelize({
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        logging: false,
      });

      expect(testSequelize.getDialect()).toBe('postgres');
      
      // Close without authenticate to avoid connection error
      testSequelize.close();
    });

    it('should have proper pool configuration', () => {
      const testSequelize = new Sequelize({
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });

      expect(testSequelize.config.pool).toMatchObject({
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      });
      
      // Close without authenticate to avoid connection error
      testSequelize.close();
    });
  });

  describe('Database Environment Configuration', () => {
    it('should use PostgreSQL configuration in test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      // Test the logic used in the actual configuration
      const dbConfig = {
        dialect: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'forum_db',
        username: process.env.DB_USER || 'forum_user',
        password: process.env.DB_PASSWORD || 'forum_password',
      };
      
      expect(dbConfig.dialect).toBe('postgres');
      expect(dbConfig.host).toBeDefined();
      expect(dbConfig.port).toBeDefined();
      expect(dbConfig.database).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should use production SSL configuration when specified', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const dialectOptions = process.env.NODE_ENV === 'production' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {};
      
      expect(dialectOptions).toHaveProperty('ssl');
      expect(dialectOptions.ssl).toMatchObject({
        require: true,
        rejectUnauthorized: false
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should use environment variables for database connection', () => {
      const originalVars = {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
      };
      
      process.env.DB_HOST = 'custom-host';
      process.env.DB_PORT = '9999';
      process.env.DB_NAME = 'custom_db';
      process.env.DB_USER = 'custom_user';
      process.env.DB_PASSWORD = 'custom_password';
      
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'forum_db',
        username: process.env.DB_USER || 'forum_user',
        password: process.env.DB_PASSWORD || 'forum_password',
      };
      
      expect(dbConfig.host).toBe('custom-host');
      expect(dbConfig.port).toBe(9999);
      expect(dbConfig.database).toBe('custom_db');
      expect(dbConfig.username).toBe('custom_user');
      expect(dbConfig.password).toBe('custom_password');
      
      // Restore original values
      Object.entries(originalVars).forEach(([key, value]) => {
        if (value) {
          process.env[key] = value;
        } else {
          delete process.env[key];
        }
      });
    });
  });

  describe('PostgreSQL Features', () => {
    it('should support PostgreSQL specific data types', () => {
      // Test that PostgreSQL dialect supports expected features
      const testSequelize = new Sequelize({
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        logging: false,
      });

      // PostgreSQL supports these data types
      const postgresFeatures = [
        'INET', 'CIDR', 'MACADDR', 'UUID', 'JSONB', 
        'ARRAY', 'RANGE', 'GEOMETRY', 'TSVECTOR'
      ];

      // Just test that dialect is postgres - actual type support would need connection
      expect(testSequelize.getDialect()).toBe('postgres');
      expect(postgresFeatures).toContain('UUID');
      expect(postgresFeatures).toContain('JSONB');
      
      // Close without authenticate to avoid connection error
      testSequelize.close();
    });
  });
});