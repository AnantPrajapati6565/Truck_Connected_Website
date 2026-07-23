const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const addressRoutes = require('./address.routes');
const companyRoutes = require('./company.routes');
const loadRoutes = require('./load.routes');
const truckRoutes = require('./truck.routes');
const bookingRoutes = require('./booking.routes');
// ✅ ADD THIS
const reviewRoutes = require('./review.routes');

const testimonialRoutes = require('./testimonial.routes'); // ✅ NEW
const faqRoutes = require('./faq.routes');

// Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/addresses', addressRoutes);
router.use('/companies', companyRoutes);
router.use('/loads', loadRoutes);
router.use('/trucks', truckRoutes);
router.use('/bookings', bookingRoutes);
// ✅ ADD THIS
router.use('/reviews', reviewRoutes);


router.use('/testimonials', testimonialRoutes); // ✅ NEW

router.use('/faqs', faqRoutes);

// Welcome
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TruckConnect API v1',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      addresses: '/api/v1/addresses',
      companies: '/api/v1/companies',
      loads: '/api/v1/loads',
      trucks: '/api/v1/trucks',
      bookings: '/api/v1/bookings',
      reviews: '/api/v1/reviews',
         testimonials: '/api/v1/testimonials',
    }
  });
});

module.exports = router;