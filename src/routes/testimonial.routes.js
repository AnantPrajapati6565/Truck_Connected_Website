const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonial.controller');
const { auth, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/', testimonialController.getTestimonials);

// Admin only routes
router.post('/', auth, adminOnly, testimonialController.createTestimonial);
router.put('/:id', auth, adminOnly, testimonialController.updateTestimonial);
router.delete('/:id', auth, adminOnly, testimonialController.deleteTestimonial);

module.exports = router;