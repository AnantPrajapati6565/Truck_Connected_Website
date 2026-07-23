const { prisma } = require('../config/prisma');
const { success, error } = require('../utils/response');

// ✅ Get All FAQs
const getFaqs = async (req, res) => {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: { createdAt: 'desc' },
    });
    success(res, faqs, 'FAQs fetched successfully');
  } catch (err) {
    console.error('❌ Get FAQs error:', err);
    error(res, err.message || 'Failed to fetch FAQs', 500);
  }
};

// ✅ Create FAQ (Admin only)
const createFaq = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return error(res, 'Question and answer are required', 400);
    }

    const faq = await prisma.faq.create({
      data: { question, answer },
    });

    success(res, faq, 'FAQ created successfully', 201);
  } catch (err) {
    console.error('❌ Create FAQ error:', err);
    error(res, err.message || 'Failed to create FAQ', 500);
  }
};

// ✅ Update FAQ (Admin only)
const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;

    const existing = await prisma.faq.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return error(res, 'FAQ not found', 404);
    }

    const faq = await prisma.faq.update({
      where: { id: parseInt(id) },
      data: {
        question: question || existing.question,
        answer: answer || existing.answer,
      },
    });

    success(res, faq, 'FAQ updated successfully');
  } catch (err) {
    console.error('❌ Update FAQ error:', err);
    error(res, err.message || 'Failed to update FAQ', 500);
  }
};

// ✅ Delete FAQ (Admin only)
const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.faq.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return error(res, 'FAQ not found', 404);
    }

    await prisma.faq.delete({
      where: { id: parseInt(id) },
    });

    success(res, null, 'FAQ deleted successfully');
  } catch (err) {
    console.error('❌ Delete FAQ error:', err);
    error(res, err.message || 'Failed to delete FAQ', 500);
  }
};

module.exports = {
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
};