const express = require('express');

const router = express.Router();
const authController = require('../controllers/authController')

router.post('/signup', authController.signup );
router.post('/signin', authController.signin);
router.post('/signout', authController.signout);
router.patch('/send-code',authController.sendVerificationCode);
router.post('/verify-code', authController.verifyVerificationCode);

module.exports = router;