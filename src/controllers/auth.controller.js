const prismaModule = require("../config/prisma");
const prisma = prismaModule.prisma || globalThis.__truckconnectPrisma;
const { hashPassword, comparePassword } = require("../utils/password");
const { generateToken, cookieOptions } = require("../utils/jwt");
const { success, error } = require("../utils/response");

// REGISTER
const register = async (req, res) => {
  try {
    console.log("📝 Register request received");

    const { fullName, email, mobile, password, businessType } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedMobile = mobile?.trim();
    const normalizedBusinessType = businessType?.toUpperCase();

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      return error(res, "Email already registered", 400);
    }

    // Check if mobile exists
    const existingMobile = await prisma.user.findUnique({
      where: { mobile: normalizedMobile },
    });

    if (existingMobile) {
      return error(res, "Mobile number already registered", 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        mobile: normalizedMobile,
        password: hashedPassword,
        businessType: normalizedBusinessType,
        role: "USER",
      },
    });

    console.log("✅ User created:", user.email);

    // Generate token
    const token = generateToken({ id: user.id, email: user.email });

    // Set cookie
    res.cookie("token", token, cookieOptions);

    // Remove password
    const { password: _, ...userData } = user;

    success(res, userData, "Registration successful", 201);
  } catch (err) {
    console.error("❌ Register error:", err);
    error(res, err.message || "Registration failed", 500);
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return error(res, "Invalid credentials", 401);
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return error(res, "Invalid credentials", 401);
    }

    const token = generateToken({ id: user.id, email: user.email });
    res.cookie("token", token, cookieOptions);

    const { password: _, ...userData } = user;
    success(res, userData, "Login successful");
  } catch (err) {
    console.error("❌ Login error:", err);
    error(res, err.message || "Login failed", 500);
  }
};

// GET CURRENT USER
const getMe = async (req, res) => {
  try {
    success(res, req.user, "User profile fetched");
  } catch (err) {
    error(res, err.message, 500);
  }
};

// LOGOUT
const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    success(res, null, "Logged out successfully");
  } catch (err) {
    error(res, err.message, 500);
  }
};

// CHECK AUTH
const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return success(res, { isAuthenticated: false }, "Not authenticated");
    }

    success(res, { isAuthenticated: true, user: req.user }, "Authenticated");
  } catch (err) {
    error(res, err.message, 500);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  checkAuth,
};
