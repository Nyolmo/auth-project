const jwt = require('jsonwebtoken');
const { signupSchema, signinSchema, acceptCodeSchema, changePasswordSchema,acceptFPCodeSchema } = require('../middlewares/validator.js');
const User = require('../models/usersModel.js');
const { doHash, doHashValidation, hmacProcess } = require('../utils/hashing.js');
const transport = require('../middlewares/sendMail.js');


exports.signup = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { error } = signupSchema.validate({ email, password });

        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(401).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await doHash(password, 12);

        const newUser = new User({
            email,
            password: hashedPassword,
        });

        const result = await newUser.save();
        result.password = undefined;

        res.status(201).json({
            success: true,
            message: "Your account has been created successfully",
            result,
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


exports.signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { error } = signinSchema.validate({ email, password });

        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message
            });
        }

        const existingUser = await User.findOne({ email }).select('+password');

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: 'User does not exist!'
            });
        }

        const isValid = await doHashValidation(password, existingUser.password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Credentials'
            });
        }

        const token = jwt.sign(
            {
                userId: existingUser._id,
                email: existingUser.email,
                verified: existingUser.verified,
            },
            process.env.TOKEN_SECRET,
            { expiresIn: '8h' }
        );

        res.cookie('Authorization', 'Bearer ' + token, {
            expires: new Date(Date.now() + 8 * 3600000),
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
        }).json({
            success: true,
            token,
            message: "Logged in successfully"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



exports.signout = async (req, res) => {
    res.clearCookie('Authorization')
        .status(200)
        .json({
            success: true,
            message: 'Logged out successfully'
        });
};



exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User does not exist!'
            });
        }

        if (existingUser.verified) {
            return res.status(400).json({
                success: false,
                message: 'You are already verified!'
            });
        }

  
        const codeValue = Math.floor(100000 + Math.random() * 900000).toString();

        const info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Verification Code",
            html: `<h1>${codeValue}</h1>`
        });

        console.log("EMAIL RESPONSE:", info);

        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(
                codeValue,
                process.env.HMAC_VERIFICATION_CODE_SECRET
            );

            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now() + 5 * 60 * 1000;

            await existingUser.save();

            return res.status(200).json({
                success: true,
                message: 'Verification code sent!'
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Failed to send code'
        });

    } catch (error) {
        console.log("EMAIL ERROR:", error);
        res.status(500).json({
            success: false,
            message: 'Email failed to send'
        });
    }
};



exports.verifyVerificationCode = async (req, res) => {
    const { email, code } = req.body;

    try {
        const { error, value } = acceptCodeSchema.validate({ email, code });

        if(error){
            return res.status(401).json({
                success: false,
                message: error.details[0].message
            });
        }

        const codeValue = code.toString();
        const existingUser = await User.findOne({email}).select("+verificationCode +verificationCodeValidation");

        if(!existingUser){
            return res.status(404).json({
                success:false,
                message: "User not found!"
            });
        }

        if(existingUser.verified){
            return res.status(400).json({
                 success:false,
                 message: "You are already verified!"
             });
        }

        if(!existingUser.verificationCode || !existingUser.verificationCodeValidation){
            return res.status(400).json({
                success: false,
                message: "Something went wrong, please request a new code"
            });
        }

        if(Date.now()-existingUser.verificationCodeValidation > 5 * 60 * 1000){
            return res.status(400).json({
                success:false,
                message: "Code expired, please request a new one"
            });

        }

        const hashedCodeValue = hmacProcess(
            codeValue,
            process.env.HMAC_VERIFICATION_CODE_SECRET
        )

        if(hashedCodeValue === existingUser.verificationCode){
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;

            await existingUser.save();
            return res
                .status(200)
                .json({
                    success: true,
                    message: "Your account has been verified successfully"
                });
        }
        return res
            .status(400)
            .json({
                success: false,
                message: "Invalid code, please try again"
            });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.changePassword = async (req, res) => {
    const { userId, verified} = req.user;
    const { oldPassword, newPassword } = req.body;

    try {
        const { error, value} = changePasswordSchema.validate({ oldPassword, newPassword})
        if(error){
            return res.status(401).json({
                success:false,
                message: error.details[0].message
            });
        }
        if(!verified){
            return res.status(403).json({
                success:false,
                message: "You must be verified to change your password"
            });
        }

        const existingUser = await User.findById({_id:userId}).select('+password');
        if(!existingUser) {
            return res.status(401).json({
                success:false,
                message: "User does not exist!"
            })
        }

        const isValid = await doHashValidation(oldPassword, existingUser.password);

        if(!isValid) {
            return res.status(401).json({
                success:false,
                message: "Invalid credentials"
            });
        }

        const hashedNewPassword = await doHash(newPassword, 12);
        existingUser.password = hashedNewPassword;
        await existingUser.save();

        return res.status(200).json({
            success:true,
            message: "Password changed successfully"
        });
                
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message: "Server error"
        });
        
    }
}

exports.sendForgotPasswordCode = async (req, res) => {
    const { email } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User does not exist!'
            });
        }
  
        const codeValue = Math.floor(100000 + Math.random() * 900000).toString();

        const info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Forgot password Code",
            html: `<h1>${codeValue}</h1>`
        });

        console.log("EMAIL RESPONSE:", info);

        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(
                codeValue,
                process.env.HMAC_VERIFICATION_CODE_SECRET
            );

            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now() + 5 * 60 * 1000;

            await existingUser.save();

            return res.status(200).json({
                success: true,
                message: 'Verification code sent!'
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Failed to send code'
        });

    } catch (error) {
        console.log("EMAIL ERROR:", error);
        res.status(500).json({
            success: false,
            message: 'Email failed to send'
        });
    }
};



exports.verifyForgotPasswordCode = async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        const { error, value } = acceptFPCodeSchema.validate({ email, code, newPassword });

        if(error){
            return res.status(401).json({
                success: false,
                message: error.details[0].message  
            });
        }

        const codeValue = code.toString();
        const existingUser = await User.findOne({email}).select("+forgotPasswordCode +forgotPasswordCodeValidation");

        if(!existingUser){
            return res.status(404).json({
                success:false,
                message: "User not found!"
            });
        }


        if(!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation){
            return res.status(400).json({
                success: false,
                message: "Something went wrong, please request a new code"
            });
        }

        if(Date.now()-existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000){
            return res.status(400).json({
                success:false,
                message: "Code expired, please request a new one"
            });

        }

        const hashedCodeValue = hmacProcess(
            codeValue,
            process.env.HMAC_VERIFICATION_CODE_SECRET
        )

        if(hashedCodeValue === existingUser.forgotPasswordCode){
            const hashedNewPassword = await doHash(newPassword, 12);
            existingUser.password = hashedNewPassword;
            existingUser.verified = true;
            existingUser.forgotPasswordCode = undefined;
            existingUser.forgotPasswordCodeValidation = undefined;

            await existingUser.save();
            return res
                .status(200)
                .json({
                    success: true,
                    message: "Your password has been changed successfully"
                });
        }
        return res
            .status(400)
            .json({
                success: false,
                message: "Invalid code, please try again"
            });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};