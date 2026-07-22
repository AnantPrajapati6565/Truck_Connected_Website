const { prisma } = require('../config/prisma');
const { success, error } = require('../utils/response');

// ✅ Create Load (SHIPPER only)
const createLoad = async (req, res) => {
  try {
    console.log('📝 Creating load...');
    console.log('📝 User:', req.user.id);

    const {
      materialType,
      weight,
      truckType,
      pickupDate,
      pickupCity,
      pickupState,
      dropCity,
      dropState,
      contactName,
      contactNumber,
      companyName,
      email,
      pickupAddress,
      dropAddress
    } = req.body;

    // Validate required fields
    if (!materialType || !weight || !truckType || !pickupDate || 
        !pickupCity || !pickupState || !dropCity || !dropState) {
      return error(res, 'All required fields must be provided', 400);
    }

    // Check if user is SHIPPER
    if (req.user.businessType !== 'SHIPPER' && req.user.role !== 'ADMIN') {
      return error(res, 'Only SHIPPER can create loads', 403);
    }

    const load = await prisma.load.create({
      data: {
        materialType,
        weight: parseFloat(weight),
        truckType,
        pickupDate: new Date(pickupDate),
        pickupCity,
        pickupState,
        dropCity,
        dropState,
        contactName: contactName || req.user.fullName,
        contactNumber: contactNumber || req.user.mobile,
        companyName: companyName || req.user.company?.companyName || null,
        email: email || req.user.email,
        status: 'AVAILABLE',
        userId: req.user.id,
        pickupAddress: pickupAddress || {},
        dropAddress: dropAddress || {},
      },
      include: {
        user: {
          include: {
            company: true,
          }
        }
      }
    });

    console.log('✅ Load created:', load.id);

    success(res, load, 'Load created successfully', 201);
  } catch (err) {
    console.error('❌ Create load error:', err);
    error(res, err.message || 'Failed to create load', 500);
  }
};

// ✅ Get All Loads (with filters)
const getLoads = async (req, res) => {
  try {
    const {
      status,
      truckType,
      pickupCity,
      dropCity,
      fromDate,
      toDate,
      userId
    } = req.query;

    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (truckType) where.truckType = truckType;
    if (pickupCity) where.pickupCity = { contains: pickupCity, mode: 'insensitive' };
    if (dropCity) where.dropCity = { contains: dropCity, mode: 'insensitive' };
    if (userId) where.userId = parseInt(userId);

    // Date range filter
    if (fromDate || toDate) {
      where.pickupDate = {};
      if (fromDate) where.pickupDate.gte = new Date(fromDate);
      if (toDate) where.pickupDate.lte = new Date(toDate);
    }

    const loads = await prisma.load.findMany({
      where,
      include: {
        user: {
          include: {
            company: true,
          }
        },
        bookings: {
          include: {
            truck: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, loads, 'Loads fetched successfully');
  } catch (err) {
    console.error('❌ Get loads error:', err);
    error(res, err.message || 'Failed to fetch loads', 500);
  }
};

// ✅ Get Single Load
const getLoad = async (req, res) => {
  try {
    const { id } = req.params;

    const load = await prisma.load.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          include: {
            company: true,
          }
        },
        bookings: {
          include: {
            truck: {
              include: {
                user: true,
              }
            },
            shipper: true,
            carrier: true,
          }
        }
      }
    });

    if (!load) {
      return error(res, 'Load not found', 404);
    }

    success(res, load, 'Load fetched successfully');
  } catch (err) {
    console.error('❌ Get load error:', err);
    error(res, err.message || 'Failed to fetch load', 500);
  }
};

// ✅ Update Load (SHIPPER only)
const updateLoad = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      materialType,
      weight,
      truckType,
      pickupDate,
      pickupCity,
      pickupState,
      dropCity,
      dropState,
      contactName,
      contactNumber,
      companyName,
      email,
      pickupAddress,
      dropAddress,
      status
    } = req.body;

    // Check if load exists
    const existingLoad = await prisma.load.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!existingLoad) {
      return error(res, 'Load not found', 404);
    }

    // Check if user owns this load or is admin
    if (existingLoad.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to update this load', 403);
    }

    // Check if user is SHIPPER (unless admin)
    if (req.user.businessType !== 'SHIPPER' && req.user.role !== 'ADMIN') {
      return error(res, 'Only SHIPPER can update loads', 403);
    }

    const updatedLoad = await prisma.load.update({
      where: { id: parseInt(id) },
      data: {
        materialType: materialType || existingLoad.materialType,
        weight: weight ? parseFloat(weight) : existingLoad.weight,
        truckType: truckType || existingLoad.truckType,
        pickupDate: pickupDate ? new Date(pickupDate) : existingLoad.pickupDate,
        pickupCity: pickupCity || existingLoad.pickupCity,
        pickupState: pickupState || existingLoad.pickupState,
        dropCity: dropCity || existingLoad.dropCity,
        dropState: dropState || existingLoad.dropState,
        contactName: contactName || existingLoad.contactName,
        contactNumber: contactNumber || existingLoad.contactNumber,
        companyName: companyName !== undefined ? companyName : existingLoad.companyName,
        email: email || existingLoad.email,
        pickupAddress: pickupAddress || existingLoad.pickupAddress,
        dropAddress: dropAddress || existingLoad.dropAddress,
        status: status || existingLoad.status,
      },
      include: {
        user: {
          include: {
            company: true,
          }
        }
      }
    });

    success(res, updatedLoad, 'Load updated successfully');
  } catch (err) {
    console.error('❌ Update load error:', err);
    error(res, err.message || 'Failed to update load', 500);
  }
};

// ✅ Delete Load (SHIPPER only)
const deleteLoad = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if load exists
    const existingLoad = await prisma.load.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLoad) {
      return error(res, 'Load not found', 404);
    }

    // Check if user owns this load or is admin
    if (existingLoad.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to delete this load', 403);
    }

    // Check if user is SHIPPER (unless admin)
    if (req.user.businessType !== 'SHIPPER' && req.user.role !== 'ADMIN') {
      return error(res, 'Only SHIPPER can delete loads', 403);
    }

    // Check if load has bookings
    const bookings = await prisma.booking.findMany({
      where: { loadId: parseInt(id) }
    });

    if (bookings.length > 0) {
      return error(res, 'Cannot delete load with existing bookings', 400);
    }

    await prisma.load.delete({
      where: { id: parseInt(id) }
    });

    success(res, null, 'Load deleted successfully');
  } catch (err) {
    console.error('❌ Delete load error:', err);
    error(res, err.message || 'Failed to delete load', 500);
  }
};

// ✅ Update Load Status
const updateLoadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['AVAILABLE', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return error(res, 'Invalid status', 400);
    }

    // Check if load exists
    const existingLoad = await prisma.load.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLoad) {
      return error(res, 'Load not found', 404);
    }

    // Check if user owns this load or is admin
    if (existingLoad.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to update this load', 403);
    }

    const updatedLoad = await prisma.load.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: {
          include: {
            company: true,
          }
        }
      }
    });

    success(res, updatedLoad, 'Load status updated successfully');
  } catch (err) {
    console.error('❌ Update load status error:', err);
    error(res, err.message || 'Failed to update load status', 500);
  }
};

// ✅ Get Loads by User
const getMyLoads = async (req, res) => {
  try {
    const loads = await prisma.load.findMany({
      where: { userId: req.user.id },
      include: {
        user: {
          include: {
            company: true,
          }
        },
        bookings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, loads, 'My loads fetched successfully');
  } catch (err) {
    console.error('❌ Get my loads error:', err);
    error(res, err.message || 'Failed to fetch my loads', 500);
  }
};

module.exports = {
  createLoad,
  getLoads,
  getLoad,
  updateLoad,
  deleteLoad,
  updateLoadStatus,
  getMyLoads,
};