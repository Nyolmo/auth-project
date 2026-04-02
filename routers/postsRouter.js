const express = require('express');
const { identifier } = require('../middlewares/identification.js');
const postsController = require('../controllers/postsController')

const router = express.Router();


router.get('/all-posts', postsController.getPosts );
router.get('/:id', postsController.singlePost);
router.post('/create-post', identifier, postsController.createPost);
router.put('/update-post/:id', identifier, postsController.updatePost);
router.delete('/delete-post/:id', identifier, postsController.deletePost);
// router.patch('/change-password', identifier, authController.changePassword);

// router.patch('/send-forgot-password-code', identifier, authController.sendForgotPasswordCode);
// router.patch('/verify-forgot-password-code', identifier, authController.verifyForgotPasswordCode);


module.exports = router;