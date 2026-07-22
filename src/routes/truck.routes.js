const express = require('express');
const router = express.Router();
const truckController = require('../controllers/truck.controller');
const { auth } = require('../middleware/auth');

// Public routes (authentication optional for viewing)
router.get('/', truckController.getTrucks);
router.get('/available', truckController.getAvailableTrucks);
router.get('/:id', truckController.getTruck);

// Protected routes
router.use(auth);

// My trucks
router.get('/my/trucks', truckController.getMyTrucks);

// CRUD operations
router.post('/', truckController.createTruck);
router.put('/:id', truckController.updateTruck);
router.delete('/:id', truckController.deleteTruck);
router.patch('/:id/status', truckController.updateTruckStatus);

module.exports = router;