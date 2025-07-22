"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAdmin = exports.requireVerifiedEmail = exports.authenticateToken = void 0;
const authService_1 = require("../services/authService");
const logger_1 = __importDefault(require("../utils/logger"));
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            res.status(401).json({
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Access token is required',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }
        const user = await authService_1.AuthService.getUserFromToken(token);
        if (!user) {
            res.status(401).json({
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid or expired token',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }
        req.user = user;
        req.userId = user.id;
        next();
    }
    catch (error) {
        logger_1.default.error('Authentication middleware error:', error);
        res.status(401).json({
            error: {
                code: 'AUTHENTICATION_ERROR',
                message: 'Authentication failed',
                timestamp: new Date().toISOString(),
            },
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireVerifiedEmail = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            error: {
                code: 'NOT_AUTHENTICATED',
                message: 'Authentication required',
                timestamp: new Date().toISOString(),
            },
        });
        return;
    }
    if (!req.user.is_verified) {
        res.status(403).json({
            error: {
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Email verification required to access this resource',
                timestamp: new Date().toISOString(),
            },
        });
        return;
    }
    next();
};
exports.requireVerifiedEmail = requireVerifiedEmail;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            error: {
                code: 'NOT_AUTHENTICATED',
                message: 'Authentication required',
                timestamp: new Date().toISOString(),
            },
        });
        return;
    }
    if (req.user.role !== 'admin') {
        res.status(403).json({
            error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Admin privileges required',
                timestamp: new Date().toISOString(),
            },
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const user = await authService_1.AuthService.getUserFromToken(token);
            if (user) {
                req.user = user;
                req.userId = user.id;
            }
        }
        next();
    }
    catch (error) {
        // For optional auth, we don't fail on token errors
        logger_1.default.warn('Optional auth error (continuing):', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map