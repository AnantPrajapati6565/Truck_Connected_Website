const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const addressRoutes = require('./address.routes');
const companyRoutes = require('./company.routes');
const loadRoutes = require('./load.routes');
const truckRoutes = require('./truck.routes');
const bookingRoutes = require('./booking.routes');  // ✅ NEW

// Routes
router.use('/auth', authRoutes);
router.use('/addresses', addressRoutes);
router.use('/companies', companyRoutes);
router.use('/loads', loadRoutes);
router.use('/trucks', truckRoutes);
router.use('/bookings', bookingRoutes);  // ✅ NEW

// Welcome
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TruckConnect API v1',
    endpoints: {
      auth: '/api/v1/auth',
      addresses: '/api/v1/addresses',
      companies: '/api/v1/companies',
      loads: '/api/v1/loads',
      trucks: '/api/v1/trucks',
      bookings: '/api/v1/bookings'
    }
  });
});

module.exports = router;