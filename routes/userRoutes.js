// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const authController = require('./../controllers/authController');
//
// // Protect all routes after this middleware
// router.use(authController.protect);
// router.delete('/deleteMe', userController.deleteMe);
//
// // Only admin have permission to access for the below APIs
// router.use(authController.restrictTo('admin'));
//
// router
//     .route('/')
//     .get(userController.getAllUsers);
//
//
// router
//     .route('/:id')
//     .get(userController.getUser)
//     .patch(userController.updateUser)
//     .delete(userController.deleteUser);
//
// module.exports = router;