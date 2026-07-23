// const { prisma } = require('../config/prisma');
// const { success, error } = require('../utils/response');

// // ✅ Get All Bookings
// const getBookings = async (req, res) => {
//   try {
//     const { status } = req.query;
    
//     const where = {};
//     if (status) where.status = status;

//     // If user is not admin, only show their bookings
//     if (req.user.role !== 'ADMIN') {
//       where.OR = [
//         { shipperId: req.user.id },
//         { carrierId: req.user.id }
//       ];
//     }

//     const bookings = await prisma.booking.findMany({
//       where,
//       include: {
//         load: {
//           include: {
//             user: true,
//           }
//         },
//         truck: {
//           include: {
//             user: true,
//           }
//         },
//         shipper: true,
//         carrier: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     success(res, bookings, 'Bookings fetched successfully');
//   } catch (err) {
//     console.error('❌ Get bookings error:', err);
//     error(res, err.message || 'Failed to fetch bookings', 500);
//   }
// };

// // ✅ Get My Shipper Bookings
// const getMyShipperBookings = async (req, res) => {
//   try {
//     const bookings = await prisma.booking.findMany({
//       where: { shipperId: req.user.id },
//       include: {
//         load: {
//           include: {
//             user: true,
//           }
//         },
//         truck: {
//           include: {
//             user: true,
//           }
//         },
//         carrier: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     success(res, bookings, 'My shipper bookings fetched successfully');
//   } catch (err) {
//     console.error('❌ Get my shipper bookings error:', err);
//     error(res, err.message || 'Failed to fetch shipper bookings', 500);
//   }
// };

// // ✅ Get My Carrier Bookings
// const getMyCarrierBookings = async (req, res) => {
//   try {
//     const bookings = await prisma.booking.findMany({
//       where: { carrierId: req.user.id },
//       include: {
//         load: {
//           include: {
//             user: true,
//           }
//         },
//         truck: {
//           include: {
//             user: true,
//           }
//         },
//         shipper: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     success(res, bookings, 'My carrier bookings fetched successfully');
//   } catch (err) {
//     console.error('❌ Get my carrier bookings error:', err);
//     error(res, err.message || 'Failed to fetch carrier bookings', 500);
//   }
// };

// // ✅ Create Booking
// const createBooking = async (req, res) => {
//   try {
//     const { loadId, truckId, initiatedBy, agreedPrice, notes } = req.body;

//     // Validate
//     if (!loadId || !truckId || !initiatedBy) {
//       return error(res, 'loadId, truckId, and initiatedBy are required', 400);
//     }

//     // Check if load exists
//     const load = await prisma.load.findUnique({
//       where: { id: parseInt(loadId) },
//     });

//     if (!load) {
//       return error(res, 'Load not found', 404);
//     }

//     // Check if truck exists
//     const truck = await prisma.truck.findUnique({
//       where: { id: parseInt(truckId) },
//     });

//     if (!truck) {
//       return error(res, 'Truck not found', 404);
//     }

//     // Determine shipperId and carrierId
//     let shipperId, carrierId;

//     if (initiatedBy === 'SHIPPER') {
//       shipperId = req.user.id;
//       carrierId = truck.userId;
//     } else {
//       shipperId = load.userId;
//       carrierId = req.user.id;
//     }

//     const booking = await prisma.booking.create({
//       data: {
//         loadId: parseInt(loadId),
//         truckId: parseInt(truckId),
//         shipperId,
//         carrierId,
//         initiatedBy,
//         status: 'PENDING',
//         agreedPrice: agreedPrice ? parseFloat(agreedPrice) : null,
//         notes: notes || null,
//       },
//       include: {
//         load: true,
//         truck: true,
//         shipper: true,
//         carrier: true,
//       }
//     });

//     success(res, booking, 'Booking created successfully', 201);
//   } catch (err) {
//     console.error('❌ Create booking error:', err);
//     error(res, err.message || 'Failed to create booking', 500);
//   }
// };

// // ✅ Get Single Booking
// const getBooking = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const booking = await prisma.booking.findUnique({
//       where: { id: parseInt(id) },
//       include: {
//         load: {
//           include: {
//             user: true,
//           }
//         },
//         truck: {
//           include: {
//             user: true,
//           }
//         },
//         shipper: true,
//         carrier: true,
//       }
//     });

//     if (!booking) {
//       return error(res, 'Booking not found', 404);
//     }

//     // Check if user is involved
//     if (booking.shipperId !== req.user.id && 
//         booking.carrierId !== req.user.id && 
//         req.user.role !== 'ADMIN') {
//       return error(res, 'You do not have permission to view this booking', 403);
//     }

//     success(res, booking, 'Booking fetched successfully');
//   } catch (err) {
//     console.error('❌ Get booking error:', err);
//     error(res, err.message || 'Failed to fetch booking', 500);
//   }
// };

// // ✅ Update Booking Status
// const updateBookingStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
//     if (!validStatuses.includes(status)) {
//       return error(res, 'Invalid status', 400);
//     }

//     const existingBooking = await prisma.booking.findUnique({
//       where: { id: parseInt(id) },
//     });

//     if (!existingBooking) {
//       return error(res, 'Booking not found', 404);
//     }

//     // Check if user is involved
//     if (existingBooking.shipperId !== req.user.id && 
//         existingBooking.carrierId !== req.user.id && 
//         req.user.role !== 'ADMIN') {
//       return error(res, 'You do not have permission to update this booking', 403);
//     }

//     const updatedBooking = await prisma.booking.update({
//       where: { id: parseInt(id) },
//       data: { status },
//       include: {
//         load: true,
//         truck: true,
//         shipper: true,
//         carrier: true,
//       }
//     });

//     success(res, updatedBooking, `Booking ${status.toLowerCase()} successfully`);
//   } catch (err) {
//     console.error('❌ Update booking status error:', err);
//     error(res, err.message || 'Failed to update booking status', 500);
//   }
// };

// module.exports = {
//   getBookings,
//   getMyShipperBookings,
//   getMyCarrierBookings,
//   createBooking,
//   getBooking,
//   updateBookingStatus,
// };














const { prisma } = require('../config/prisma');
const { success, error } = require('../utils/response');

// ✅ Create Booking
const createBooking = async (req, res) => {
  try {
    const { loadId, truckId, initiatedBy, agreedPrice, notes } = req.body;

    // Validate
    if (!loadId || !truckId || !initiatedBy) {
      return error(res, 'loadId, truckId, and initiatedBy are required', 400);
    }

    // Check if load exists
    const load = await prisma.load.findUnique({
      where: { id: parseInt(loadId) },
      include: { user: true }
    });

    if (!load) {
      return error(res, 'Load not found', 404);
    }

    // Check if truck exists
    const truck = await prisma.truck.findUnique({
      where: { id: parseInt(truckId) },
      include: { user: true }
    });

    if (!truck) {
      return error(res, 'Truck not found', 404);
    }

    // ✅ Determine shipperId and carrierId based on initiatedBy
    let shipperId, carrierId;

    if (initiatedBy === 'SHIPPER') {
      // SHIPPER is requesting a truck for their load
      shipperId = req.user.id;
      carrierId = truck.userId; // Truck owner becomes carrier
      
      // Verify the user is the load owner
      if (load.userId !== req.user.id) {
        return error(res, 'You can only book trucks for your own loads', 403);
      }
    } else if (initiatedBy === 'CARRIER') {
      // TRUCK OWNER is requesting to transport a load
      shipperId = load.userId; // Load owner becomes shipper
      carrierId = req.user.id;
      
      // Verify the user is the truck owner
      if (truck.userId !== req.user.id) {
        return error(res, 'You can only offer your own trucks', 403);
      }
    } else {
      return error(res, 'Invalid initiatedBy value', 400);
    }

    // Check if user is SHIPPER or CARRIER
    if (initiatedBy === 'SHIPPER' && req.user.businessType !== 'SHIPPER') {
      return error(res, 'Only SHIPPER can initiate as SHIPPER', 403);
    }
    if (initiatedBy === 'CARRIER' && req.user.businessType !== 'TRUCK_OWNER') {
      return error(res, 'Only TRUCK_OWNER can initiate as CARRIER', 403);
    }

    // Check if booking already exists
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
            user: true,
          }
        },
        truck: {
          include: {
            user: true,
          }
        },
        shipper: true,
        carrier: true,
      }
    });

    console.log('✅ Booking created:', booking.id);
    console.log('📌 Shipper ID:', shipperId, 'Carrier ID:', carrierId);
    console.log('📌 Initiated By:', initiatedBy);

    success(res, booking, 'Booking created successfully', 201);
  } catch (err) {
    console.error('❌ Create booking error:', err);
    error(res, err.message || 'Failed to create booking', 500);
  }
};

// ✅ Update Booking Status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return error(res, 'Invalid status', 400);
    }

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

    // ✅ Check permissions based on status
    const isShipper = existingBooking.shipperId === req.user.id;
    const isCarrier = existingBooking.carrierId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // PENDING → ACCEPTED/REJECTED (Only recipient can do this)
    if (existingBooking.status === 'PENDING') {
      // If SHIPPER initiated, CARRIER must accept/reject
      // If CARRIER initiated, SHIPPER must accept/reject
      const canAcceptReject = (existingBooking.initiatedBy === 'SHIPPER' && isCarrier) ||
                               (existingBooking.initiatedBy === 'CARRIER' && isShipper) ||
                               isAdmin;

      if (status === 'ACCEPTED' || status === 'REJECTED') {
        if (!canAcceptReject) {
          return error(res, 'Only the recipient can accept or reject this booking', 403);
        }
      }
      
      // Cancelling (Only initiator or admin)
      if (status === 'CANCELLED') {
        const isInitiator = (existingBooking.initiatedBy === 'SHIPPER' && isShipper) ||
                             (existingBooking.initiatedBy === 'CARRIER' && isCarrier);
        if (!isInitiator && !isAdmin) {
          return error(res, 'Only the initiator can cancel this booking', 403);
        }
      }
    }

    // ACCEPTED → IN_TRANSIT/CANCELLED (Any involved party)
    if (existingBooking.status === 'ACCEPTED') {
      if (!isShipper && !isCarrier && !isAdmin) {
        return error(res, 'You are not involved in this booking', 403);
      }
      if (status === 'REJECTED') {
        return error(res, 'Cannot reject an accepted booking', 400);
      }
    }

    // IN_TRANSIT → DELIVERED/CANCELLED (Any involved party)
    if (existingBooking.status === 'IN_TRANSIT') {
      if (!isShipper && !isCarrier && !isAdmin) {
        return error(res, 'You are not involved in this booking', 403);
      }
      if (status === 'REJECTED' || status === 'ACCEPTED') {
        return error(res, 'Invalid status transition', 400);
      }
    }

    // Can't change from final states
    if (['DELIVERED', 'CANCELLED', 'REJECTED'].includes(existingBooking.status)) {
      return error(res, `Cannot change from ${existingBooking.status} status`, 400);
    }

    // ✅ Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        load: {
          include: {
            user: true,
          }
        },
        truck: {
          include: {
            user: true,
          }
        },
        shipper: true,
        carrier: true,
      }
    });

    // ✅ Update Load and Truck statuses
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

    console.log('✅ Booking status updated:', id, '→', status);

    success(res, updatedBooking, `Booking ${status.toLowerCase()} successfully`);
  } catch (err) {
    console.error('❌ Update booking status error:', err);
    error(res, err.message || 'Failed to update booking status', 500);
  }
};

// ✅ Get My Shipper Bookings
const getMyShipperBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { shipperId: req.user.id },
      include: {
        load: {
          include: {
            user: true,
          }
        },
        truck: {
          include: {
            user: true,
          }
        },
        shipper: true,
        carrier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, bookings, 'My shipper bookings fetched successfully');
  } catch (err) {
    console.error('❌ Get my shipper bookings error:', err);
    error(res, err.message || 'Failed to fetch shipper bookings', 500);
  }
};

// ✅ Get My Carrier Bookings
const getMyCarrierBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { carrierId: req.user.id },
      include: {
        load: {
          include: {
            user: true,
          }
        },
        truck: {
          include: {
            user: true,
          }
        },
        shipper: true,
        carrier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, bookings, 'My carrier bookings fetched successfully');
  } catch (err) {
    console.error('❌ Get my carrier bookings error:', err);
    error(res, err.message || 'Failed to fetch carrier bookings', 500);
  }
};

// ✅ Get All Bookings
const getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) where.status = status;

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
            user: true,
          }
        },
        truck: {
          include: {
            user: true,
          }
        },
        shipper: true,
        carrier: true,
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
            user: true,
          }
        },
        truck: {
          include: {
            user: true,
          }
        },
        shipper: true,
        carrier: true,
      }
    });

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    // Check if user is involved
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

module.exports = {
  getBookings,
  getMyShipperBookings,
  getMyCarrierBookings,
  createBooking,
  getBooking,
  updateBookingStatus,
};





