"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const posts_1 = __importDefault(require("./posts"));
const comments_1 = __importDefault(require("./comments"));
const likes_1 = __importDefault(require("./likes"));
const hotness_1 = __importDefault(require("./hotness"));
const userBehavior_1 = __importDefault(require("./userBehavior"));
const users_1 = __importDefault(require("./users"));
const notifications_1 = __importDefault(require("./notifications"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const router = (0, express_1.Router)();
// API version prefix
const API_VERSION = '/api/v1';
// Mount routes
router.use(`${API_VERSION}/auth`, auth_1.default);
router.use(`${API_VERSION}/posts`, posts_1.default);
router.use(`${API_VERSION}/comments`, comments_1.default);
router.use(`${API_VERSION}/likes`, likes_1.default);
router.use(`${API_VERSION}/hotness`, hotness_1.default);
router.use(`${API_VERSION}/behavior`, userBehavior_1.default);
router.use(`${API_VERSION}/users`, users_1.default);
router.use(`${API_VERSION}/notifications`, notifications_1.default);
router.use(`${API_VERSION}/admin`, adminRoutes_1.default);
// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
// API info endpoint
router.get(`${API_VERSION}/info`, (req, res) => {
    res.status(200).json({
        name: 'Tech Community SOC API',
        version: '1.0.0',
        description: 'Forum system API with user authentication, posts, comments, and recommendations',
        endpoints: {
            authentication: `${API_VERSION}/auth`,
            posts: `${API_VERSION}/posts`,
            comments: `${API_VERSION}/comments`,
            likes: `${API_VERSION}/likes`,
            hotness: `${API_VERSION}/hotness`,
            behavior: `${API_VERSION}/behavior`,
            users: `${API_VERSION}/users`,
            notifications: `${API_VERSION}/notifications`,
            admin: `${API_VERSION}/admin`,
        },
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map