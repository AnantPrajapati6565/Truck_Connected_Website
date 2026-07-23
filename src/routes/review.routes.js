const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { auth } = require('../middleware/auth');

// All review routes require authentication
router.use(auth);

// Create review
router.post('/', reviewController.createReview);

// Get reviews with filters
router.get('/', reviewController.getReviews);

// Get user rating
router.get('/rating/:userId', reviewController.getUserRating);

// Get booking reviews
router.get('/booking/:bookingId', reviewController.getBookingReviews);

// Get single review
router.get('/:id', reviewController.getReview);

// Delete review
router.delete('/:id', reviewController.deleteReview);

module.exports = router;