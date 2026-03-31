const Joi = require('joi');

exports.signupSchema = Joi.object({
    email: Joi.string()
        .min(6)
        .max(60)
        .required()
        .email({
            tlds: { allow: ['com', 'net'] }
        }),

    password: Joi.string()
        .required()
        .pattern(
            new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')
        )
        .message('Password must be at least 8 chars, include uppercase, lowercase, number and special character')
});

exports.signinSchema = Joi.object({
    email:Joi.string()
        .min(6)
        .max(60)
        .required()
        .email({
            tlds:{ allow: ['com','net'] }
        }),
    password: Joi.string()
        .pattern(
            new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')
        )
        .message('Password must be at least 8 chars, include uppercase, lowercase, number and special character')

});

exports.acceptCodeSchema = Joi.object({
    email: Joi.string()
        .min(6)
        .max(60)
        .required()
        .email({
            tlds: { allow: ['com', 'net']},
        }),
        code: 
            Joi.required()
});