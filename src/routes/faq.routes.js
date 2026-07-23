const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faq.controller');
const { auth, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/', faqController.getFaqs);

// Admin only routes
router.post('/', auth, adminOnly, faqController.createFaq);
router.put('/:id', auth, adminOnly, faqController.updateFaq);
router.delete('/:id', auth, adminOnly, faqController.deleteFaq);

module.exports = router;