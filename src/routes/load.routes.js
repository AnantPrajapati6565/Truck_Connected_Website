const express = require('express');
const router = express.Router();
const loadController = require('../controllers/load.controller');
const { auth } = require('../middleware/auth');

// Public routes (authentication optional for viewing)
router.get('/', loadController.getLoads);
router.get('/:id', loadController.getLoad);

// Protected routes
router.use(auth);

// My loads
router.get('/my/loads', loadController.getMyLoads);

// CRUD operations
router.post('/', loadController.createLoad);
router.put('/:id', loadController.updateLoad);
router.delete('/:id', loadController.deleteLoad);
router.patch('/:id/status', loadController.updateLoadStatus);

module.exports = router;