const { prisma } = require('../config/prisma');
const { success, error } = require('../utils/response');

// ✅ Get All Active Testimonials
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    success(res, testimonials, 'Testimonials fetched successfully');
  } catch (err) {
    console.error('❌ Get testimonials error:', err);
    error(res, err.message || 'Failed to fetch testimonials', 500);
  }
};

// ✅ Create Testimonial (Admin only)
const createTestimonial = async (req, res) => {
  try {
    const { name, role, company, content, rating, isActive } = req.body;

    if (!name || !role || !content) {
      return error(res, 'name, role, and content are required', 400);
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role,
        company: company || null,
        content,
        rating: rating || 5,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    success(res, testimonial, 'Testimonial created successfully', 201);
  } catch (err) {
    console.error('❌ Create testimonial error:', err);
    error(res, err.message || 'Failed to create testimonial', 500);
  }
};

// ✅ Update Testimonial (Admin only)
const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, company, content, rating, isActive } = req.body;

    const existing = await prisma.testimonial.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return error(res, 'Testimonial not found', 404);
    }

    const testimonial = await prisma.testimonial.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existing.name,
        role: role || existing.role,
        company: company !== undefined ? company : existing.company,
        content: content || existing.content,
        rating: rating || existing.rating,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    success(res, testimonial, 'Testimonial updated successfully');
  } catch (err) {
    console.error('❌ Update testimonial error:', err);
    error(res, err.message || 'Failed to update testimonial', 500);
  }
};

// ✅ Delete Testimonial (Admin only)
const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.testimonial.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return error(res, 'Testimonial not found', 404);
    }

    await prisma.testimonial.delete({
      where: { id: parseInt(id) },
    });

    success(res, null, 'Testimonial deleted successfully');
  } catch (err) {
    console.error('❌ Delete testimonial error:', err);
    error(res, err.message || 'Failed to delete testimonial', 500);
  }
};

module.exports = {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};