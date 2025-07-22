"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../src/config/database");
beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test') {
        process.env.NODE_ENV = 'test';
        process.env.DB_PATH = ':memory:';
    }
});
afterAll(async () => {
    await database_1.sequelize.close();
});
beforeEach(async () => {
    await database_1.sequelize.sync({ force: true });
});
afterEach(async () => {
    await database_1.sequelize.drop();
});
//# sourceMappingURL=setup.js.map