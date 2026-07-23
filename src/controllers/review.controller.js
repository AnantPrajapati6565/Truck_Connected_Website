const { prisma } = require('../config/prisma');
const { success, error } = require('../utils/response');

// ✅ Create Review
const createReview = async (req, res) => {
  try {
    console.log('📝 Creating review...');
    console.log('📝 User:', req.user.id);
    console.log('📝 Body:', req.body);

    const { rating, comment, revieweeId, bookingId } = req.body;

    // Validate required fields
    if (!rating || !revieweeId || !bookingId) {
      return error(res, 'rating, revieweeId, and bookingId are required', 400);
    }

    // Validate rating (1-5)
    if (rating < 1 || rating > 5) {
      return error(res, 'Rating must be between 1 and 5', 400);
    }

    // Check if booking exists and is DELIVERED
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        load: true,
        truck: true,
        shipper: true,
        carrier: true,
      }
    });

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    // Check if booking is DELIVERED
    if (booking.status !== 'DELIVERED') {
      return error(res, 'You can only review completed (DELIVERED) bookings', 400);
    }

    // Check if user is involved in the booking
    if (booking.shipperId !== req.user.id && booking.carrierId !== req.user.id) {
      return error(res, 'You are not involved in this booking', 403);
    }

    // Check if user is trying to review themselves
    if (req.user.id === parseInt(revieweeId)) {
      return error(res, 'You cannot review yourself', 400);
    }

    // Check if reviewee is involved in the booking
    if (booking.shipperId !== parseInt(revieweeId) && booking.carrierId !== parseInt(revieweeId)) {
      return error(res, 'The reviewee is not involved in this booking', 400);
    }

    // Check if review already exists for this booking and reviewer
    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId: parseInt(bookingId),
        reviewerId: req.user.id,
      }
    });

    if (existingReview) {
      return error(res, 'You have already reviewed this booking', 400);
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        reviewerId: req.user.id,
        revieweeId: parseInt(revieweeId),
        bookingId: parseInt(bookingId),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        reviewee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        booking: {
          include: {
            load: true,
            truck: true,
          }
        }
      }
    });

    console.log('✅ Review created:', review.id);

    success(res, review, 'Review created successfully', 201);
  } catch (err) {
    console.error('❌ Create review error:', err);
    error(res, err.message || 'Failed to create review', 500);
  }
};

// ✅ Get Reviews (with filters)
const getReviews = async (req, res) => {
  try {
    const { revieweeId, reviewerId, bookingId, rating } = req.query;

    const where = {};

    if (revieweeId) where.revieweeId = parseInt(revieweeId);
    if (reviewerId) where.reviewerId = parseInt(reviewerId);
    if (bookingId) where.bookingId = parseInt(bookingId);
    if (rating) where.rating = parseInt(rating);

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        reviewee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        booking: {
          include: {
            load: true,
            truck: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, reviews, 'Reviews fetched successfully');
  } catch (err) {
    console.error('❌ Get reviews error:', err);
    error(res, err.message || 'Failed to fetch reviews', 500);
  }
};

// ✅ Get Single Review
const getReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        reviewee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        booking: {
          include: {
            load: true,
            truck: true,
          }
        }
      }
    });

    if (!review) {
      return error(res, 'Review not found', 404);
    }

    success(res, review, 'Review fetched successfully');
  } catch (err) {
    console.error('❌ Get review error:', err);
    error(res, err.message || 'Failed to fetch review', 500);
  }
};

// ✅ Delete Review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const existingReview = await prisma.review.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingReview) {
      return error(res, 'Review not found', 404);
    }

    if (existingReview.reviewerId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to delete this review', 403);
    }

    await prisma.review.delete({
      where: { id: parseInt(id) }
    });

    success(res, null, 'Review deleted successfully');
  } catch (err) {
    console.error('❌ Delete review error:', err);
    error(res, err.message || 'Failed to delete review', 500);
  }
};

// ✅ Get Average Rating for a User
const getUserRating = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { revieweeId: parseInt(userId) },
      select: { rating: true }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    };

    success(res, {
      userId: parseInt(userId),
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingDistribution,
    }, 'User rating fetched successfully');
  } catch (err) {
    console.error('❌ Get user rating error:', err);
    error(res, err.message || 'Failed to fetch user rating', 500);
  }
};

// ✅ Get Reviews for a Booking
const getBookingReviews = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { bookingId: parseInt(bookingId) },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        reviewee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, reviews, 'Booking reviews fetched successfully');
  } catch (err) {
    console.error('❌ Get booking reviews error:', err);
    error(res, err.message || 'Failed to fetch booking reviews', 500);
  }
};

module.exports = {
  createReview,
  getReviews,
  getReview,
  deleteReview,
  getUserRating,
  getBookingReviews,
};