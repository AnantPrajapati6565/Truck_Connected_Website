const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');

router.use('/auth', authRoutes);

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TruckConnect API v1',
    endpoints: {
      auth: '/api/v1/auth'
    }
  });
});

module.exports = router;