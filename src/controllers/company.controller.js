// ✅ CORRECT - Destructure prisma from the exported object
const { prisma } = require('../config/prisma');
const { success, error } = require('../utils/response');

// ✅ Create Company
const createCompany = async (req, res) => {
  try {
    console.log('📝 Creating company...');
    
    const { companyName, gstNumber, phone, email, description, addressId } = req.body;

    // Validate required fields
    if (!companyName || !phone || !email || !addressId) {
      return error(res, 'companyName, phone, email, and addressId are required', 400);
    }

    // Check if address exists
    const address = await prisma.address.findUnique({
      where: { id: parseInt(addressId) }
    });

    if (!address) {
      return error(res, 'Address not found', 404);
    }

    const company = await prisma.company.create({
      data: {
        companyName,
        gstNumber: gstNumber || null,
        phone,
        email,
        description: description || null,
        addressId: parseInt(addressId),
      },
      include: {
        address: true,
      }
    });

    console.log('✅ Company created:', company.id);

    // Update user's companyId
    await prisma.user.update({
      where: { id: req.user.id },
      data: { companyId: company.id }
    });

    success(res, company, 'Company created successfully', 201);
  } catch (err) {
    console.error('❌ Create company error:', err);
    error(res, err.message || 'Failed to create company', 500);
  }
};

// ✅ Get All Companies (Admin only)
const getCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        address: true,
        users: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    success(res, companies, 'Companies fetched successfully');
  } catch (err) {
    console.error('❌ Get companies error:', err);
    error(res, err.message || 'Failed to fetch companies', 500);
  }
};

// ✅ Get My Company
const getMyCompany = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        company: {
          include: {
            address: true,
          }
        }
      }
    });

    if (!user.company) {
      return error(res, 'You do not have a company profile', 404);
    }

    success(res, user.company, 'Company fetched successfully');
  } catch (err) {
    console.error('❌ Get my company error:', err);
    error(res, err.message || 'Failed to fetch company', 500);
  }
};

// ✅ Get Single Company
const getCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(id) },
      include: {
        address: true,
        users: true,
      },
    });

    if (!company) {
      return error(res, 'Company not found', 404);
    }

    success(res, company, 'Company fetched successfully');
  } catch (err) {
    console.error('❌ Get company error:', err);
    error(res, err.message || 'Failed to fetch company', 500);
  }
};

// ✅ Update Company
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, gstNumber, phone, email, description, addressId } = req.body;

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCompany) {
      return error(res, 'Company not found', 404);
    }

    // Check if user owns this company or is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true }
    });

    if (user.companyId !== parseInt(id) && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to update this company', 403);
    }

    // Check if address exists if provided
    if (addressId) {
      const address = await prisma.address.findUnique({
        where: { id: parseInt(addressId) }
      });
      if (!address) {
        return error(res, 'Address not found', 404);
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id: parseInt(id) },
      data: {
        companyName: companyName || existingCompany.companyName,
        gstNumber: gstNumber !== undefined ? gstNumber : existingCompany.gstNumber,
        phone: phone || existingCompany.phone,
        email: email || existingCompany.email,
        description: description !== undefined ? description : existingCompany.description,
        addressId: addressId ? parseInt(addressId) : existingCompany.addressId,
      },
      include: {
        address: true,
      }
    });

    success(res, updatedCompany, 'Company updated successfully');
  } catch (err) {
    console.error('❌ Update company error:', err);
    error(res, err.message || 'Failed to update company', 500);
  }
};

// ✅ Delete Company
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCompany) {
      return error(res, 'Company not found', 404);
    }

    // Check if user owns this company or is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true }
    });

    if (user.companyId !== parseInt(id) && req.user.role !== 'ADMIN') {
      return error(res, 'You do not have permission to delete this company', 403);
    }

    // Remove company from user
    if (user.companyId === parseInt(id)) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { companyId: null }
      });
    }

    await prisma.company.delete({
      where: { id: parseInt(id) }
    });

    success(res, null, 'Company deleted successfully');
  } catch (err) {
    console.error('❌ Delete company error:', err);
    error(res, err.message || 'Failed to delete company', 500);
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getMyCompany,
  getCompany,
  updateCompany,
  deleteCompany,
};