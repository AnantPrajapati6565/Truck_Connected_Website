// ✅ CORRECT - Destructure prisma from the exported object
const { prisma } = require('../config/prisma');
const { success, error } = require('../utils/response');

// ✅ Create Address
const createAddress = async (req, res) => {
  try {
    console.log('📝 Creating address...');
    
    const { 
      addressLine1, 
      addressLine2, 
      area, 
      landmark, 
      city, 
      district, 
      state, 
      pinCode, 
      country,
      latitude,
      longitude 
    } = req.body;

    // Validate required fields
    if (!addressLine1 || !city || !state || !pinCode) {
      return error(res, 'addressLine1, city, state, and pinCode are required', 400);
    }

    const address = await prisma.address.create({
      data: {
        addressLine1,
        addressLine2: addressLine2 || null,
        area: area || null,
        landmark: landmark || null,
        city,
        district: district || null,
        state,
        pinCode,
        country: country || 'India',
        latitude: latitude || null,
        longitude: longitude || null,
      }
    });

    console.log('✅ Address created:', address.id);

    // Update user's addressId if provided in query
    if (req.query.linkToUser === 'true') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { addressId: address.id }
      });
    }

    success(res, address, 'Address created successfully', 201);
  } catch (err) {
    console.error('❌ Create address error:', err);
    error(res, err.message || 'Failed to create address', 500);
  }
};

// ✅ Get All Addresses (Admin only)
const getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      include: {
        users: true,
        companies: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, addresses, 'Addresses fetched successfully');
  } catch (err) {
    console.error('❌ Get addresses error:', err);
    error(res, err.message || 'Failed to fetch addresses', 500);
  }
};

// ✅ Get Single Address
const getAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: true,
        companies: true,
      },
    });

    if (!address) {
      return error(res, 'Address not found', 404);
    }

    success(res, address, 'Address fetched successfully');
  } catch (err) {
    console.error('❌ Get address error:', err);
    error(res, err.message || 'Failed to fetch address', 500);
  }
};

// ✅ Update Address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      addressLine1, 
      addressLine2, 
      area, 
      landmark, 
      city, 
      district, 
      state, 
      pinCode, 
      country,
      latitude,
      longitude 
    } = req.body;

    // Check if address exists
    const existingAddress = await prisma.address.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAddress) {
      return error(res, 'Address not found', 404);
    }

    // Check if user owns this address or is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { address: true }
    });

    if (user.addressId !== parseInt(id) && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to update this address', 403);
    }

    const updatedAddress = await prisma.address.update({
      where: { id: parseInt(id) },
      data: {
        addressLine1: addressLine1 || existingAddress.addressLine1,
        addressLine2: addressLine2 !== undefined ? addressLine2 : existingAddress.addressLine2,
        area: area !== undefined ? area : existingAddress.area,
        landmark: landmark !== undefined ? landmark : existingAddress.landmark,
        city: city || existingAddress.city,
        district: district !== undefined ? district : existingAddress.district,
        state: state || existingAddress.state,
        pinCode: pinCode || existingAddress.pinCode,
        country: country || existingAddress.country,
        latitude: latitude !== undefined ? latitude : existingAddress.latitude,
        longitude: longitude !== undefined ? longitude : existingAddress.longitude,
      }
    });

    success(res, updatedAddress, 'Address updated successfully');
  } catch (err) {
    console.error('❌ Update address error:', err);
    error(res, err.message || 'Failed to update address', 500);
  }
};

// ✅ Delete Address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if address exists
    const existingAddress = await prisma.address.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAddress) {
      return error(res, 'Address not found', 404);
    }

    // Check if user owns this address or is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { address: true }
    });

    if (user.addressId !== parseInt(id) && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to delete this address', 403);
    }

    // Remove address from user
    if (user.addressId === parseInt(id)) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { addressId: null }
      });
    }

    await prisma.address.delete({
      where: { id: parseInt(id) }
    });

    success(res, null, 'Address deleted successfully');
  } catch (err) {
    console.error('❌ Delete address error:', err);
    error(res, err.message || 'Failed to delete address', 500);
  }
};

module.exports = {
  createAddress,
  getAddresses,
  getAddress,
  updateAddress,
  deleteAddress,
};