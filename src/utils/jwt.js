const jwt = require("jsonwebtoken");

// Generate token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Verify token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// ✅ Cookie options for development
const cookieOptions = {
  httpOnly: true,
  secure: false, // ✅ false for localhost (no HTTPS)
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

module.exports = { generateToken, verifyToken, cookieOptions };
