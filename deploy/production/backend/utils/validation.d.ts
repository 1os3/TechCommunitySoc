import Joi from 'joi';
export declare const userRegistrationSchema: Joi.ObjectSchema<any>;
export declare const userLoginSchema: Joi.ObjectSchema<any>;
export declare const userUpdateSchema: Joi.ObjectSchema<any>;
export declare const passwordResetSchema: Joi.ObjectSchema<any>;
export declare const passwordChangeSchema: Joi.ObjectSchema<any>;
export declare const postCreationSchema: Joi.ObjectSchema<any>;
export declare const postUpdateSchema: Joi.ObjectSchema<any>;
export declare const commentCreationSchema: Joi.ObjectSchema<any>;
export declare const commentUpdateSchema: Joi.ObjectSchema<any>;
export declare const validateRequest: (schema: Joi.ObjectSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=validation.d.ts.map