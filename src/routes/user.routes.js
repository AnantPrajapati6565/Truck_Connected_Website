const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth, adminOnly } = require('../middleware/auth');

// All user routes require authentication
router.use(auth);

// Get all users (Admin only)
router.get('/', adminOnly, userController.getUsers);

// Get single user
router.get('/:id', userController.getUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user (Admin only)
router.delete('/:id', adminOnly, userController.deleteUser);

module.exports = router;