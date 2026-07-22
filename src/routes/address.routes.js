const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { auth, adminOnly } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Address CRUD
router.post('/', addressController.createAddress);
router.get('/', adminOnly, addressController.getAddresses);  // Admin only
router.get('/:id', addressController.getAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;