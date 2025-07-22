"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
// import { EmailService } from './services/emailService'; // 暂时注释掉
const logger_1 = __importDefault(require("./utils/logger"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const routes_1 = __importDefault(require("./routes"));
const models_1 = require("./models");
const behaviorTracking_1 = require("./middleware/behaviorTracking");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Only apply rate limiting in production environments
if (process.env.NODE_ENV === 'production') {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1分钟窗口
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200'), // 每分钟200次请求
        message: {
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: '请求过于频繁，请稍后再试',
                timestamp: new Date().toISOString()
            }
        },
        standardHeaders: true, // 返回限流信息在headers中
        legacyHeaders: false,
    });
    app.use('/api', limiter);
}
// Add behavior tracking middleware (applied to all routes)
app.use((0, behaviorTracking_1.trackBehavior)({
    trackViews: true,
    trackLikes: true,
    trackComments: true,
    debounceTime: 30000 // 30 seconds
}));
// Mount routes
app.use('/', routes_1.default);
app.use(errorHandler_1.default);
async function startServer() {
    try {
        await database_1.sequelize.authenticate();
        logger_1.default.info('Database connection established successfully');
        // Initialize models with associations
        (0, models_1.initializeModels)();
        logger_1.default.info('Models initialized with associations');
        if (process.env.NODE_ENV !== 'test') {
            await database_1.sequelize.sync({ force: false });
            logger_1.default.info('Database synchronized');
        }
        // Initialize email service - 暂时注释掉
        // try {
        //   await EmailService.initialize();
        //   logger.info('Email service initialized successfully');
        // } catch (error) {
        //   logger.warn('Email service initialization failed:', error);
        //   // Continue startup even if email service fails
        // }
        app.listen(PORT, () => {
            logger_1.default.info(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error('Unable to start server:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=index.js.map