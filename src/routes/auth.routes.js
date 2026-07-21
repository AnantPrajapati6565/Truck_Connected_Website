const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes (need to be logged in)
router.get('/me', auth, authController.getMe);
router.post('/logout', auth, authController.logout);
router.get('/check', auth, authController.checkAuth);

module.exports = router;