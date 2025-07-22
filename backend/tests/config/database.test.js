"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../../src/config/database");
describe('Database Configuration', () => {
    afterEach(async () => {
        if (database_1.sequelize.getDialect() === 'SQLite' && database_1.sequelize.config.storage === ':memory:') {
            await database_1.sequelize.drop();
        }
    });
    describe('connectDatabase', () => {
        it('should connect to database successfully', async () => {
            await expect((0, database_1.connectDatabase)()).resolves.not.toThrow();
            expect(database_1.sequelize.authenticate).toBeDefined();
        });
        it('should create tables when connecting', async () => {
            await (0, database_1.connectDatabase)();
            const queryInterface = database_1.sequelize.getQueryInterface();
            const tables = await queryInterface.showAllTables();
            expect(Array.isArray(tables)).toBe(true);
        });
    });
    describe('closeDatabaseConnection', () => {
        it('should close database connection successfully', async () => {
            await (0, database_1.connectDatabase)();
            await expect((0, database_1.closeDatabaseConnection)()).resolves.not.toThrow();
        });
    });
    describe('sequelize instance', () => {
        it('should be configured with SQLite dialect', () => {
            expect(database_1.sequelize.getDialect()).toBe('SQLite');
        });
        it('should use memory storage for tests', () => {
            expect(database_1.sequelize.config.storage).toBe(':memory:');
        });
        it('should have proper pool configuration', () => {
            expect(database_1.sequelize.config.pool).toMatchObject({
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            });
        });
    });
});
//# sourceMappingURL=database.test.js.map