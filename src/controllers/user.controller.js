const { prisma } = require('../config/prisma');
const { success, error } = require('../utils/response');

// ✅ Get All Users (Admin only)
const getUsers = async (req, res) => {
  try {
    const { role, businessType } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (businessType) where.businessType = businessType;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        role: true,
        businessType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, users, 'Users fetched successfully');
  } catch (err) {
    console.error('❌ Get users error:', err);
    error(res, err.message || 'Failed to fetch users', 500);
  }
};

// ✅ Get Single User
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        role: true,
        businessType: true,
        addressId: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    success(res, user, 'User fetched successfully');
  } catch (err) {
    console.error('❌ Get user error:', err);
    error(res, err.message || 'Failed to fetch user', 500);
  }
};

// ✅ Update User
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, mobile, businessType, addressId, companyId } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return error(res, 'User not found', 404);
    }

    // Check if user is updating themselves or is admin
    if (parseInt(id) !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to update this user', 403);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        fullName: fullName || existingUser.fullName,
        email: email || existingUser.email,
        mobile: mobile || existingUser.mobile,
        businessType: businessType || existingUser.businessType,
        addressId: addressId !== undefined ? parseInt(addressId) : existingUser.addressId,
        companyId: companyId !== undefined ? parseInt(companyId) : existingUser.companyId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        role: true,
        businessType: true,
        addressId: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    success(res, updatedUser, 'User updated successfully');
  } catch (err) {
    console.error('❌ Update user error:', err);
    error(res, err.message || 'Failed to update user', 500);
  }
};

// ✅ Delete User (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return error(res, 'User not found', 404);
    }

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return error(res, 'You cannot delete your own account', 400);
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    success(res, null, 'User deleted successfully');
  } catch (err) {
    console.error('❌ Delete user error:', err);
    error(res, err.message || 'Failed to delete user', 500);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
