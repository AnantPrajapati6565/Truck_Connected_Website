const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { auth } = require('../middleware/auth');

// All booking routes require authentication
router.use(auth);

// My bookings
router.get('/my/shipper', bookingController.getMyShipperBookings);
router.get('/my/carrier', bookingController.getMyCarrierBookings);

// CRUD operations
router.post('/', bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBooking);
router.patch('/:id/status', bookingController.updateBookingStatus);

module.exports = router;