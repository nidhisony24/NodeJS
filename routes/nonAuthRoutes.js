const express = require('express');
const router = express.Router();
const AuthController = require('./../controllers/AuthController');

router.post('/login', AuthController.login);
router.post('/signup', AuthController.signup);
router.post('/verify-account', AuthController.verifyAccount);
router.post('/forgot-password', AuthController.ForgotPassword);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router;