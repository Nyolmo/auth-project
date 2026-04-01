const express = require('express');
const { identifier } = require('../middlewares/identification.js');

const router = express.Router();
const authController = require('../controllers/authController')

router.post('/signup', authController.signup );
router.post('/signin', authController.signin);
router.post('/signout', identifier, authController.signout);
router.patch('/send-code', identifier, authController.sendVerificationCode);
router.patch('/verify-code', identifier, authController.verifyVerificationCode);
router.patch('/change-password', identifier, authController.changePassword);

router.patch('/send-forgot-password-code', identifier, authController.sendForgotPasswordCode);
router.patch('/verify-forgot-password-code', identifier, authController.verifyForgotPasswordCode);


module.exports = router;