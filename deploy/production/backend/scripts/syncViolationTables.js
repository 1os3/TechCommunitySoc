"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
async function syncViolationTables() {
    try {
        console.log('Syncing violation tables...');
        // Sync the new tables
        await models_1.ViolationWord.sync({ force: false });
        await models_1.Violation.sync({ force: false });
        console.log('Violation tables synced successfully');
        // Check if we have any violation words already
        const existingWords = await models_1.ViolationWord.count();
        if (existingWords === 0) {
            console.log('Adding default violation words...');
            // Find a site admin to set as creator
            const siteAdmin = await models_1.User.findOne({
                where: {
                    username: 'aarch64qwe10900fuziruiwork0',
                    is_admin: true
                }
            });
            if (!siteAdmin) {
                console.log('No site admin found, skipping default violation words');
                return;
            }
            const defaultWords = [
                { word: '垃圾', is_regex: false },
                { word: '广告', is_regex: false },
                { word: '测试违规', is_regex: false },
                { word: '傻逼', is_regex: false },
                { word: '骗子', is_regex: false },
                { word: '\\b(fuck|shit|damn)\\b', is_regex: true },
                { word: '色情|黄色|成人', is_regex: true },
                { word: '赌博|博彩|彩票', is_regex: true }
            ];
            for (const wordData of defaultWords) {
                await models_1.ViolationWord.create({
                    word: wordData.word,
                    is_regex: wordData.is_regex,
                    is_active: true,
                    created_by: siteAdmin.id
                });
            }
            console.log(`Added ${defaultWords.length} default violation words`);
        }
        else {
            console.log(`Found ${existingWords} existing violation words`);
        }
        console.log('Setup complete!');
    }
    catch (error) {
        console.error('Error syncing violation tables:', error);
        throw error;
    }
}
// Run if called directly
if (require.main === module) {
    syncViolationTables()
        .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}
exports.default = syncViolationTables;
//# sourceMappingURL=syncViolationTables.js.map