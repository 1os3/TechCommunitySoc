"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, next) => {
    const errorResponse = {
        error: {
            code: err.name || 'UNKNOWN_ERROR',
            message: err.message || 'An unexpected error occurred',
            timestamp: new Date().toISOString(),
        },
    };
    logger_1.default.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });
    const statusCode = getStatusCodeFromError(err);
    res.status(statusCode).json(errorResponse);
};
function getStatusCodeFromError(error) {
    switch (error.name) {
        case 'ValidationError':
            return 400;
        case 'UnauthorizedError':
            return 401;
        case 'ForbiddenError':
            return 403;
        case 'NotFoundError':
            return 404;
        case 'ConflictError':
            return 409;
        case 'SequelizeValidationError':
            return 400;
        case 'SequelizeUniqueConstraintError':
            return 409;
        case 'SequelizeForeignKeyConstraintError':
            return 400;
        default:
            return 500;
    }
}
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map