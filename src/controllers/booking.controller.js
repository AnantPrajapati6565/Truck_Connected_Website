const { prisma } = require('../config/prisma');
const { success, error } = require('../utils/response');

// ✅ Create Booking (SHIPPER or CARRIER initiated)
const createBooking = async (req, res) => {
  try {
    console.log('📝 Creating booking...');
    console.log('📝 User:', req.user.id);

    const { loadId, truckId, initiatedBy, agreedPrice, notes } = req.body;

    // Validate required fields
    if (!loadId || !truckId || !initiatedBy) {
      return error(res, 'loadId, truckId, and initiatedBy are required', 400);
    }

    // Validate initiatedBy
    if (!['SHIPPER', 'CARRIER'].includes(initiatedBy)) {
      return error(res, 'initiatedBy must be SHIPPER or CARRIER', 400);
    }

    // Check if load exists
    const load = await prisma.load.findUnique({
      where: { id: parseInt(loadId) },
      include: { user: true }
    });

    if (!load) {
      return error(res, 'Load not found', 404);
    }

    // Check if load is available
    if (load.status !== 'AVAILABLE') {
      return error(res, 'Load is not available for booking', 400);
    }

    // Check if truck exists
    const truck = await prisma.truck.findUnique({
      where: { id: parseInt(truckId) },
      include: { user: true }
    });

    if (!truck) {
      return error(res, 'Truck not found', 404);
    }

    // Check if truck is available
    if (truck.status !== 'AVAILABLE') {
      return error(res, 'Truck is not available for booking', 400);
    }

    // Determine shipperId and carrierId based on initiatedBy
    let shipperId, carrierId;

    if (initiatedBy === 'SHIPPER') {
      // SHIPPER is requesting a truck
      shipperId = req.user.id;
      carrierId = truck.userId;
    } else {
      // CARRIER is requesting a load
      shipperId = load.userId;
      carrierId = req.user.id;
    }

    // Check if user is authorized
    if (initiatedBy === 'SHIPPER' && req.user.businessType !== 'SHIPPER' && req.user.role !== 'ADMIN') {
      return error(res, 'Only SHIPPER can initiate booking as SHIPPER', 403);
    }

    if (initiatedBy === 'CARRIER' && req.user.businessType !== 'TRUCK_OWNER' && req.user.role !== 'ADMIN') {
      return error(res, 'Only TRUCK_OWNER can initiate booking as CARRIER', 403);
    }

    // Check if booking already exists for this load and truck
    const existingBooking = await prisma.booking.findFirst({
      where: {
        loadId: parseInt(loadId),
        truckId: parseInt(truckId),
        status: { in: ['PENDING', 'ACCEPTED', 'IN_TRANSIT'] }
      }
    });

    if (existingBooking) {
      return error(res, 'A booking already exists for this load and truck', 400);
    }

    const booking = await prisma.booking.create({
      data: {
        loadId: parseInt(loadId),
        truckId: parseInt(truckId),
        shipperId,
        carrierId,
        initiatedBy,
        status: 'PENDING',
        agreedPrice: agreedPrice ? parseFloat(agreedPrice) : null,
        notes: notes || null,
      },
      include: {
        load: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        truck: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        shipper: {
          include: {
            company: true,
          }
        },
        carrier: {
          include: {
            company: true,
          }
        }
      }
    });

    console.log('✅ Booking created:', booking.id);

    success(res, booking, 'Booking created successfully', 201);
  } catch (err) {
    console.error('❌ Create booking error:', err);
    error(res, err.message || 'Failed to create booking', 500);
  }
};

// ✅ Get All Bookings (with filters)
const getBookings = async (req, res) => {
  try {
    const {
      status,
      loadId,
      truckId,
      shipperId,
      carrierId,
      initiatedBy,
      fromDate,
      toDate
    } = req.query;

    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (loadId) where.loadId = parseInt(loadId);
    if (truckId) where.truckId = parseInt(truckId);
    if (shipperId) where.shipperId = parseInt(shipperId);
    if (carrierId) where.carrierId = parseInt(carrierId);
    if (initiatedBy) where.initiatedBy = initiatedBy;

    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    // If user is not admin, only show their bookings
    if (req.user.role !== 'ADMIN') {
      where.OR = [
        { shipperId: req.user.id },
        { carrierId: req.user.id }
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        load: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        truck: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        shipper: {
          include: {
            company: true,
          }
        },
        carrier: {
          include: {
            company: true,
          }
        },
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, bookings, 'Bookings fetched successfully');
  } catch (err) {
    console.error('❌ Get bookings error:', err);
    error(res, err.message || 'Failed to fetch bookings', 500);
  }
};

// ✅ Get Single Booking
const getBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        load: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        truck: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        shipper: {
          include: {
            company: true,
          }
        },
        carrier: {
          include: {
            company: true,
          }
        },
        reviews: {
          include: {
            reviewer: true,
            reviewee: true,
          }
        }
      }
    });

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    // Check if user is involved or admin
    if (booking.shipperId !== req.user.id && 
        booking.carrierId !== req.user.id && 
        req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to view this booking', 403);
    }

    success(res, booking, 'Booking fetched successfully');
  } catch (err) {
    console.error('❌ Get booking error:', err);
    error(res, err.message || 'Failed to fetch booking', 500);
  }
};

// ✅ Update Booking Status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, agreedPrice, notes } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return error(res, 'Invalid status', 400);
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        load: true,
        truck: true,
        shipper: true,
        carrier: true,
      }
    });

    if (!existingBooking) {
      return error(res, 'Booking not found', 404);
    }

    // Check if user is involved or admin
    if (existingBooking.shipperId !== req.user.id && 
        existingBooking.carrierId !== req.user.id && 
        req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to update this booking', 403);
    }

    // Validate status transitions
    const currentStatus = existingBooking.status;
    
    // PENDING → ACCEPTED/REJECTED/CANCELLED
    if (currentStatus === 'PENDING' && !['ACCEPTED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return error(res, 'PENDING can only go to ACCEPTED, REJECTED, or CANCELLED', 400);
    }

    // ACCEPTED → IN_TRANSIT/CANCELLED
    if (currentStatus === 'ACCEPTED' && !['IN_TRANSIT', 'CANCELLED'].includes(status)) {
      return error(res, 'ACCEPTED can only go to IN_TRANSIT or CANCELLED', 400);
    }

    // IN_TRANSIT → DELIVERED/CANCELLED
    if (currentStatus === 'IN_TRANSIT' && !['DELIVERED', 'CANCELLED'].includes(status)) {
      return error(res, 'IN_TRANSIT can only go to DELIVERED or CANCELLED', 400);
    }

    // Can't change from final states
    if (['DELIVERED', 'CANCELLED', 'REJECTED'].includes(currentStatus)) {
      return error(res, `Cannot change from ${currentStatus} status`, 400);
    }

    const updateData = { status };
    if (agreedPrice !== undefined) updateData.agreedPrice = parseFloat(agreedPrice);
    if (notes !== undefined) updateData.notes = notes;

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        load: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        truck: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        shipper: {
          include: {
            company: true,
          }
        },
        carrier: {
          include: {
            company: true,
          }
        }
      }
    });

    // Update load and truck status based on booking status
    if (status === 'ACCEPTED') {
      await prisma.load.update({
        where: { id: existingBooking.loadId },
        data: { status: 'BOOKED' }
      });
      await prisma.truck.update({
        where: { id: existingBooking.truckId },
        data: { status: 'ON_TRIP' }
      });
    }

    if (status === 'DELIVERED') {
      await prisma.load.update({
        where: { id: existingBooking.loadId },
        data: { status: 'DELIVERED' }
      });
      await prisma.truck.update({
        where: { id: existingBooking.truckId },
        data: { status: 'AVAILABLE' }
      });
    }

    if (status === 'REJECTED' || status === 'CANCELLED') {
      await prisma.load.update({
        where: { id: existingBooking.loadId },
        data: { status: 'AVAILABLE' }
      });
      await prisma.truck.update({
        where: { id: existingBooking.truckId },
        data: { status: 'AVAILABLE' }
      });
    }

    success(res, updatedBooking, `Booking ${status.toLowerCase()} successfully`);
  } catch (err) {
    console.error('❌ Update booking status error:', err);
    error(res, err.message || 'Failed to update booking status', 500);
  }
};

// ✅ Get My Bookings (as Shipper)
const getMyShipperBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { shipperId: req.user.id },
      include: {
        load: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        truck: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        carrier: {
          include: {
            company: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, bookings, 'My shipper bookings fetched successfully');
  } catch (err) {
    console.error('❌ Get my shipper bookings error:', err);
    error(res, err.message || 'Failed to fetch my shipper bookings', 500);
  }
};

// ✅ Get My Bookings (as Carrier)
const getMyCarrierBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { carrierId: req.user.id },
      include: {
        load: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        truck: {
          include: {
            user: {
              include: {
                company: true,
              }
            }
          }
        },
        shipper: {
          include: {
            company: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, bookings, 'My carrier bookings fetched successfully');
  } catch (err) {
    console.error('❌ Get my carrier bookings error:', err);
    error(res, err.message || 'Failed to fetch my carrier bookings', 500);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  getMyShipperBookings,
  getMyCarrierBookings,
};