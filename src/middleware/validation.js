// Validate registration input
const validateRegister = (req, res, next) => {
  const errors = [];
  const { fullName, email, password, mobile, businessType } = req.body;

  if (!fullName || fullName.length < 2) {
    errors.push('Full name is required and must be at least 2 characters');
  }

  if (!email || !email.includes('@')) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!mobile || mobile.length < 10) {
    errors.push('Valid mobile number is required');
  }

  if (!businessType || !['SHIPPER', 'TRUCK_OWNER', 'TRANSPORTER'].includes(businessType)) {
    errors.push('Valid business type is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Validate login input
const validateLogin = (req, res, next) => {
  const errors = [];
  const { email, password } = req.body;

  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = { validateRegister, validateLogin };