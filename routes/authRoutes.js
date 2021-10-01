const express = require('express');
const router = express.Router();
const AuthController = require('./../controllers/AuthController');

// // Protect all routes after this middleware
router.use(AuthController.protect);

// // Routes
router.get('/logout', AuthController.logout);


module.exports = router;