module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Database test configuration
  maxWorkers: 1,                    // Disable concurrent execution
  testTimeout: 30000,               // Increase timeout for database operations
  forceExit: true,                  // Force exit to prevent hanging
  detectOpenHandles: true           // Detect open handles
};