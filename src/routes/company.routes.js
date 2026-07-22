const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { auth, adminOnly } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Company routes
router.post('/', companyController.createCompany);
router.get('/me', companyController.getMyCompany);
router.get('/', adminOnly, companyController.getCompanies);  // Admin only
router.get('/:id', companyController.getCompany);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

module.exports = router;