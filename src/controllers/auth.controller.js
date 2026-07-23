const { prisma } = require('../config/prisma');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken, cookieOptions } = require('../utils/jwt');
const { success, error } = require('../utils/response');

// ✅ REGISTER - Fixed
const register = async (req, res) => {
  try {
    console.log('📝 Register request received');
    console.log('📝 Body:', req.body);

    const { fullName, email, mobile, password, businessType } = req.body;

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingEmail) {
      return error(res, 'Email already registered', 400);
    }

    // Check if mobile exists
    const existingMobile = await prisma.user.findUnique({
      where: { mobile }
    });

    if (existingMobile) {
      return error(res, 'Mobile number already registered', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        mobile: mobile.trim(),
        password: hashedPassword,
        businessType,
        role: 'USER'
      }
    });

    console.log('✅ User created:', user.email);

    // Generate token
    const token = generateToken({ id: user.id, email: user.email });

    // ✅ FIX: Remove domain completely
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,  // false for development
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    console.log('✅ Cookie set for user:', user.email);

    // Remove password
    const { password: _, ...userData } = user;

    success(res, userData, 'Registration successful', 201);
  } catch (err) {
    console.error('❌ Register error:', err);
    error(res, err.message || 'Registration failed', 500);
  }
};







// // ✅ LOGIN - Fixed
// const login = async (req, res) => {
//   try {
//     console.log('📝 Login request received:', req.body.email);

//     const { email, password } = req.body;

//     const user = await prisma.user.findUnique({
//       where: { email: email.toLowerCase().trim() }
//     });

//     if (!user) {
//       return error(res, 'Invalid credentials', 401);
//     }

//     const isValid = await comparePassword(password, user.password);
//     if (!isValid) {
//       return error(res, 'Invalid credentials', 401);
//     }

//     const token = generateToken({ id: user.id, email: user.email });

//     // ✅ FIX: Remove domain completely
//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: false,  // false for development
//       sameSite: 'lax',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//       path: '/',
//     });

//     console.log('✅ Cookie set for user:', user.email);

//     const { password: _, ...userData } = user;
//     success(res, userData, 'Login successful');
//   } catch (err) {
//     console.error('❌ Login error:', err);
//     error(res, err.message || 'Login failed', 500);
//   }
// };


// LOGIN
const login = async (req, res) => {
  try {
    console.log('📝 Login request received:', req.body.email);

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return error(res, 'Invalid credentials', 401);
    }

    const token = generateToken({ id: user.id, email: user.email });

    // ✅ Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    console.log('✅ Cookie set for user:', user.email);

    // ✅ Remove password
    const { password: _, ...userData } = user;

    // ✅ Make sure we return user in data object
    success(res, { user: userData }, 'Login successful');
  } catch (err) {
    console.error('❌ Login error:', err);
    error(res, err.message || 'Login failed', 500);
  }
};









// GET CURRENT USER
const getMe = async (req, res) => {
  try {
    success(res, req.user, 'User profile fetched');
  } catch (err) {
    error(res, err.message, 500);
  }
};

// ✅ LOGOUT - Fixed
const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    success(res, null, 'Logged out successfully');
  } catch (err) {
    error(res, err.message, 500);
  }
};

// CHECK AUTH
const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return success(res, { isAuthenticated: false }, 'Not authenticated');
    }

    success(res, { isAuthenticated: true, user: req.user }, 'Authenticated');
  } catch (err) {
    error(res, err.message, 500);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  checkAuth
};