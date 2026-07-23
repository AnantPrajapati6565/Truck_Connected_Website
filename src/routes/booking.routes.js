const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { auth } = require('../middleware/auth');

// All booking routes require authentication
router.use(auth);

// Get all bookings
router.get('/', bookingController.getBookings);

// Get my bookings
router.get('/my/shipper', bookingController.getMyShipperBookings);
router.get('/my/carrier', bookingController.getMyCarrierBookings);

// Create booking
router.post('/', bookingController.createBooking);

// Get single booking
router.get('/:id', bookingController.getBooking);

// Update booking status
router.patch('/:id/status', bookingController.updateBookingStatus);

module.exports = router;