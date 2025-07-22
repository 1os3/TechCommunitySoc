import Joi from 'joi';

export const userRegistrationSchema = Joi.object({
  username: Joi.string()
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
  email: Joi.string()
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
  password: Joi.string()
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

export const userLoginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

export const userUpdateSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .optional(),
  email: Joi.string()
    .email()
    .max(100)
    .optional(),
  avatar_url: Joi.string()
    .uri()
    .optional()
    .allow(null),
});

export const passwordResetSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
}).unknown(false);

export const passwordChangeSchema = Joi.object({
  newPassword: Joi.string()
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

export const postCreationSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Title is required',
    }),
  content: Joi.string()
    .min(1)
    .max(50000)
    .required()
    .messages({
      'string.min': 'Content cannot be empty',
      'string.max': 'Content must not exceed 50000 characters',
      'any.required': 'Content is required',
    }),
});

export const postUpdateSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .optional(),
  content: Joi.string()
    .min(1)
    .max(50000)
    .optional(),
});

export const commentCreationSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Comment cannot be empty',
      'string.max': 'Comment must not exceed 5000 characters',
      'any.required': 'Comment content is required',
    }),
  parent_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.integer': 'Parent ID must be an integer',
      'number.positive': 'Parent ID must be positive',
    }),
});

export const commentUpdateSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(5000)
    .optional(),
});

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
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