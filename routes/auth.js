// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { forwardAuthenticated } = require('../middleware/auth');

// Register page
router.get('/register', forwardAuthenticated, authController.renderRegister);

// Register user
router.post('/register', authController.register);

// Login page
router.get('/login', forwardAuthenticated, authController.renderLogin);

// Login user
router.post('/login', authController.login);

// Logout user
router.get('/logout', authController.logout);

module.exports = router;