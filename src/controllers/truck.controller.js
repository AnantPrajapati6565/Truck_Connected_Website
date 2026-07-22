const { prisma } = require('../config/prisma');
const { success, error } = require('../utils/response');

// ✅ Create Truck (TRUCK_OWNER only)
const createTruck = async (req, res) => {
  try {
    console.log('📝 Creating truck...');
    console.log('📝 User:', req.user.id);

    const {
      truckNumber,
      truckType,
      capacity,
      availableRoutes,
      availabilityDate,
      ownerName,
      contactNumber,
      currentLocation
    } = req.body;

    // Validate required fields
    if (!truckNumber || !truckType || !capacity || !availabilityDate) {
      return error(res, 'truckNumber, truckType, capacity, and availabilityDate are required', 400);
    }

    // Check if user is TRUCK_OWNER
    if (req.user.businessType !== 'TRUCK_OWNER' && req.user.role !== 'ADMIN') {
      return error(res, 'Only TRUCK_OWNER can create trucks', 403);
    }

    // Check if truck number already exists
    const existingTruck = await prisma.truck.findUnique({
      where: { truckNumber }
    });

    if (existingTruck) {
      return error(res, 'Truck number already exists', 400);
    }

    const truck = await prisma.truck.create({
      data: {
        truckNumber,
        truckType,
        capacity: parseFloat(capacity),
        availableRoutes: availableRoutes || [],
        availabilityDate: new Date(availabilityDate),
        ownerName: ownerName || req.user.fullName,
        contactNumber: contactNumber || req.user.mobile,
        status: 'AVAILABLE',
        userId: req.user.id,
        currentLocation: currentLocation || {},
      },
      include: {
        user: {
          include: {
            company: true,
          }
        }
      }
    });

    console.log('✅ Truck created:', truck.id);

    success(res, truck, 'Truck created successfully', 201);
  } catch (err) {
    console.error('❌ Create truck error:', err);
    error(res, err.message || 'Failed to create truck', 500);
  }
};

// ✅ Get All Trucks (with filters)
const getTrucks = async (req, res) => {
  try {
    const {
      status,
      truckType,
      minCapacity,
      maxCapacity,
      fromDate,
      toDate,
      userId,
      availableRoute
    } = req.query;

    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (truckType) where.truckType = truckType;
    if (userId) where.userId = parseInt(userId);

    // Capacity range filter
    if (minCapacity || maxCapacity) {
      where.capacity = {};
      if (minCapacity) where.capacity.gte = parseFloat(minCapacity);
      if (maxCapacity) where.capacity.lte = parseFloat(maxCapacity);
    }

    // Availability date range
    if (fromDate || toDate) {
      where.availabilityDate = {};
      if (fromDate) where.availabilityDate.gte = new Date(fromDate);
      if (toDate) where.availabilityDate.lte = new Date(toDate);
    }

    // Available routes filter
    if (availableRoute) {
      where.availableRoutes = {
        has: availableRoute
      };
    }

    const trucks = await prisma.truck.findMany({
      where,
      include: {
        user: {
          include: {
            company: true,
          }
        },
        bookings: {
          include: {
            load: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, trucks, 'Trucks fetched successfully');
  } catch (err) {
    console.error('❌ Get trucks error:', err);
    error(res, err.message || 'Failed to fetch trucks', 500);
  }
};

// ✅ Get Single Truck
const getTruck = async (req, res) => {
  try {
    const { id } = req.params;

    const truck = await prisma.truck.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          include: {
            company: true,
          }
        },
        bookings: {
          include: {
            load: {
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

    if (!truck) {
      return error(res, 'Truck not found', 404);
    }

    success(res, truck, 'Truck fetched successfully');
  } catch (err) {
    console.error('❌ Get truck error:', err);
    error(res, err.message || 'Failed to fetch truck', 500);
  }
};

// ✅ Update Truck (TRUCK_OWNER only)
const updateTruck = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      truckNumber,
      truckType,
      capacity,
      availableRoutes,
      availabilityDate,
      ownerName,
      contactNumber,
      status,
      currentLocation
    } = req.body;

    // Check if truck exists
    const existingTruck = await prisma.truck.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!existingTruck) {
      return error(res, 'Truck not found', 404);
    }

    // Check if user owns this truck or is admin
    if (existingTruck.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to update this truck', 403);
    }

    // Check if user is TRUCK_OWNER (unless admin)
    if (req.user.businessType !== 'TRUCK_OWNER' && req.user.role !== 'ADMIN') {
      return error(res, 'Only TRUCK_OWNER can update trucks', 403);
    }

    // Check if truck number is being changed and already exists
    if (truckNumber && truckNumber !== existingTruck.truckNumber) {
      const existingTruckNumber = await prisma.truck.findUnique({
        where: { truckNumber }
      });
      if (existingTruckNumber) {
        return error(res, 'Truck number already exists', 400);
      }
    }

    const updatedTruck = await prisma.truck.update({
      where: { id: parseInt(id) },
      data: {
        truckNumber: truckNumber || existingTruck.truckNumber,
        truckType: truckType || existingTruck.truckType,
        capacity: capacity ? parseFloat(capacity) : existingTruck.capacity,
        availableRoutes: availableRoutes !== undefined ? availableRoutes : existingTruck.availableRoutes,
        availabilityDate: availabilityDate ? new Date(availabilityDate) : existingTruck.availabilityDate,
        ownerName: ownerName || existingTruck.ownerName,
        contactNumber: contactNumber || existingTruck.contactNumber,
        status: status || existingTruck.status,
        currentLocation: currentLocation || existingTruck.currentLocation,
      },
      include: {
        user: {
          include: {
            company: true,
          }
        }
      }
    });

    success(res, updatedTruck, 'Truck updated successfully');
  } catch (err) {
    console.error('❌ Update truck error:', err);
    error(res, err.message || 'Failed to update truck', 500);
  }
};

// ✅ Delete Truck (TRUCK_OWNER only)
const deleteTruck = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if truck exists
    const existingTruck = await prisma.truck.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTruck) {
      return error(res, 'Truck not found', 404);
    }

    // Check if user owns this truck or is admin
    if (existingTruck.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to delete this truck', 403);
    }

    // Check if user is TRUCK_OWNER (unless admin)
    if (req.user.businessType !== 'TRUCK_OWNER' && req.user.role !== 'ADMIN') {
      return error(res, 'Only TRUCK_OWNER can delete trucks', 403);
    }

    // Check if truck has bookings
    const bookings = await prisma.booking.findMany({
      where: { truckId: parseInt(id) }
    });

    if (bookings.length > 0) {
      return error(res, 'Cannot delete truck with existing bookings', 400);
    }

    await prisma.truck.delete({
      where: { id: parseInt(id) }
    });

    success(res, null, 'Truck deleted successfully');
  } catch (err) {
    console.error('❌ Delete truck error:', err);
    error(res, err.message || 'Failed to delete truck', 500);
  }
};

// ✅ Update Truck Status
const updateTruckStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'UNAVAILABLE'];
    if (!validStatuses.includes(status)) {
      return error(res, 'Invalid status. Valid statuses: AVAILABLE, ON_TRIP, MAINTENANCE, UNAVAILABLE', 400);
    }

    // Check if truck exists
    const existingTruck = await prisma.truck.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTruck) {
      return error(res, 'Truck not found', 404);
    }

    // Check if user owns this truck or is admin
    if (existingTruck.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to update this truck', 403);
    }

    const updatedTruck = await prisma.truck.update({
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

    success(res, updatedTruck, 'Truck status updated successfully');
  } catch (err) {
    console.error('❌ Update truck status error:', err);
    error(res, err.message || 'Failed to update truck status', 500);
  }
};

// ✅ Get My Trucks
const getMyTrucks = async (req, res) => {
  try {
    const trucks = await prisma.truck.findMany({
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

    success(res, trucks, 'My trucks fetched successfully');
  } catch (err) {
    console.error('❌ Get my trucks error:', err);
    error(res, err.message || 'Failed to fetch my trucks', 500);
  }
};

// ✅ Get Available Trucks (For booking)
const getAvailableTrucks = async (req, res) => {
  try {
    const { pickupCity, dropCity, truckType, minCapacity, date } = req.query;

    const where = {
      status: 'AVAILABLE',
    };

    if (truckType) where.truckType = truckType;
    if (minCapacity) where.capacity = { gte: parseFloat(minCapacity) };
    if (date) where.availabilityDate = { lte: new Date(date) };

    // Filter by available routes
    if (pickupCity && dropCity) {
      // Find trucks that have routes containing both cities
      // This is a simple approach - you can make it more sophisticated
      where.availableRoutes = {
        hasSome: [pickupCity, dropCity]
      };
    }

    const trucks = await prisma.truck.findMany({
      where,
      include: {
        user: {
          include: {
            company: true,
          }
        }
      },
      orderBy: { availabilityDate: 'asc' },
    });

    success(res, trucks, 'Available trucks fetched successfully');
  } catch (err) {
    console.error('❌ Get available trucks error:', err);
    error(res, err.message || 'Failed to fetch available trucks', 500);
  }
};

module.exports = {
  createTruck,
  getTrucks,
  getTruck,
  updateTruck,
  deleteTruck,
  updateTruckStatus,
  getMyTrucks,
  getAvailableTrucks,
};