"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.commentUpdateSchema = exports.commentCreationSchema = exports.postUpdateSchema = exports.postCreationSchema = exports.passwordChangeSchema = exports.passwordResetSchema = exports.userUpdateSchema = exports.userLoginSchema = exports.userRegistrationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.userRegistrationSchema = joi_1.default.object({
    username: joi_1.default.string()
        .alphanum()
        .min(3)
        .max(50)
        .required()
        .custom((value, helpers) => {
        // Check for reserved prefixes
        if (value.toLowerCase().startsWith('deleted') || value.toLowerCase().startsWith('restored')) {
            return helpers.error('username.reserved');
        }
        return value;
    })
        .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 50 characters',
        'username.reserved': 'Username cannot start with "deleted" or "restored"',
        'any.required': 'Username is required',
    }),
    email: joi_1.default.string()
        .email()
        .max(100)
        .required()
        .custom((value, helpers) => {
        // Check for reserved prefixes in email
        const emailLower = value.toLowerCase();
        if (emailLower.startsWith('deleted') || emailLower.startsWith('restored')) {
            return helpers.error('email.reserved');
        }
        return value;
    })
        .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email must not exceed 100 characters',
        'email.reserved': 'Email cannot start with "deleted" or "restored"',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string()
        .min(8)
        .max(128)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
        'any.required': 'Password is required',
    }),
});
exports.userLoginSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Password is required',
    }),
});
exports.userUpdateSchema = joi_1.default.object({
    username: joi_1.default.string()
        .alphanum()
        .min(3)
        .max(50)
        .optional(),
    email: joi_1.default.string()
        .email()
        .max(100)
        .optional(),
    avatar_url: joi_1.default.string()
        .uri()
        .optional()
        .allow(null),
});
exports.passwordResetSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
}).unknown(false);
exports.passwordChangeSchema = joi_1.default.object({
    newPassword: joi_1.default.string()
        .min(8)
        .max(128)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
        'any.required': 'New password is required',
    }),
}).unknown(false);
exports.postCreationSchema = joi_1.default.object({
    title: joi_1.default.string()
        .min(1)
        .max(200)
        .required()
        .messages({
        'string.min': 'Title cannot be empty',
        'string.max': 'Title must not exceed 200 characters',
        'any.required': 'Title is required',
    }),
    content: joi_1.default.string()
        .min(1)
        .max(50000)
        .required()
        .messages({
        'string.min': 'Content cannot be empty',
        'string.max': 'Content must not exceed 50000 characters',
        'any.required': 'Content is required',
    }),
});
exports.postUpdateSchema = joi_1.default.object({
    title: joi_1.default.string()
        .min(1)
        .max(200)
        .optional(),
    content: joi_1.default.string()
        .min(1)
        .max(50000)
        .optional(),
});
exports.commentCreationSchema = joi_1.default.object({
    content: joi_1.default.string()
        .min(1)
        .max(5000)
        .required()
        .messages({
        'string.min': 'Comment cannot be empty',
        'string.max': 'Comment must not exceed 5000 characters',
        'any.required': 'Comment content is required',
    }),
    parent_id: joi_1.default.number()
        .integer()
        .positive()
        .optional()
        .messages({
        'number.integer': 'Parent ID must be an integer',
        'number.positive': 'Parent ID must be positive',
    }),
});
exports.commentUpdateSchema = joi_1.default.object({
    content: joi_1.default.string()
        .min(1)
        .max(5000)
        .optional(),
});
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message,
                    details: error.details,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        next();
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map