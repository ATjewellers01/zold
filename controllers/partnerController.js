const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Get all partners
exports.getAllPartners = async (req, res) => {
  try {
    const { city, isActive } = req.query;
    
    const where = {};
    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const partners = await prisma.partner.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isVerified: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Parse JSON strings for services and offers
    const parsedPartners = partners.map(partner => ({
      ...partner,
      services: JSON.parse(partner.services || '[]'),
      offers: JSON.parse(partner.offers || '[]'),
    }));
    
    res.json({
      success: true,
      partners: parsedPartners,
    });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partners',
      error: error.message,
    });
  }
};

// Get partner by ID
exports.getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            username: true,
            isVerified: true,
          }
        }
      }
    });
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
      });
    }
    
    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services || '[]'),
      offers: JSON.parse(partner.offers || '[]'),
    };
    
    res.json({
      success: true,
      partner: parsedPartner,
    });
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner',
      error: error.message,
    });
  }
};

// Create new partner (basic - no user account)
exports.createPartner = async (req, res) => {
  try {
    const {
      name,
      area,
      city,
      state,
      country,
      latitude,
      longitude,
      distance,
      phone,
      email,
      website,
      rating,
      reviews,
      timings,
      services,
      offers,
      description,
      isActive,
      isVerified,
    } = req.body;
    
    // Validate required fields
    if (!name || !area || !city || !latitude || !longitude || !phone || !timings) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }
    
    // Create partner with JSON stringified arrays
    const partner = await prisma.partner.create({
      data: {
        name,
        area,
        city,
        state: state || 'Chhattisgarh',
        country: country || 'India',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        distance: distance ? parseFloat(distance) : 0,
        phone,
        email,
        website,
        rating: rating ? parseFloat(rating) : 0,
        reviews: reviews ? parseInt(reviews) : 0,
        timings,
        services: JSON.stringify(services || []),
        offers: JSON.stringify(offers || []),
        description,
        isActive: isActive !== undefined ? isActive : true,
        isVerified: isVerified || false,
      },
    });
    
    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services || '[]'),
      offers: JSON.parse(partner.offers || '[]'),
    };
    
    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      partner: parsedPartner,
    });
  } catch (error) {
    console.error('Error creating partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create partner',
      error: error.message,
    });
  }
};

// Create partner with user account (ADMIN ONLY)
exports.createPartnerAccount = async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      username,
      email,
      password,
      phone,
      area,
      city,
      state,
      latitude,
      longitude,
      timings,
      services,
      commission,
      bankAccount,
      website,
      description,
    } = req.body;
    
    // Validate required fields
    if (!businessName || !ownerName || !username || !email || !password || !phone || !city) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: businessName, ownerName, username, email, password, phone, city',
      });
    }
    
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user account
    const user = await prisma.user.create({
      data: {
        name: ownerName,
        username,
        email,
        password: hashedPassword,
        phone,
        role: 'PARTNER',
        isVerified: true,
      }
    });
    
    // Create wallet for partner
    await prisma.wallet.create({
      data: {
        userId: user.id,
        goldBalance: 0,
        pledgedGold: 0,
        rupeeBalance: 0,
      }
    });
    
    // Create partner profile
    const partner = await prisma.partner.create({
      data: {
        name: businessName,
        area: area || city,
        city,
        state: state || 'Chhattisgarh',
        country: 'India',
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        phone,
        email,
        website: website || null,
        timings: timings || '10:00 AM - 8:00 PM',
        services: JSON.stringify(services || ['jewellery']),
        offers: JSON.stringify([]),
        description: description || null,
        commission: commission ? parseFloat(commission) : 2.0,
        bankAccount: bankAccount || null,
        userId: user.id,
        isActive: true,
        isVerified: true,
      }
    });
    
    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services),
      offers: JSON.parse(partner.offers),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
      }
    };
    
    res.status(201).json({
      success: true,
      message: 'Partner account created successfully',
      partner: parsedPartner,
      credentials: {
        username,
        password, // In production, send via email instead
      }
    });
  } catch (error) {
    console.error('Error creating partner account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create partner account',
      error: error.message,
    });
  }
};

// Update partner
exports.updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Convert arrays to JSON strings if present
    if (updateData.services) {
      updateData.services = JSON.stringify(updateData.services);
    }
    if (updateData.offers) {
      updateData.offers = JSON.stringify(updateData.offers);
    }
    
    // Convert numeric strings to numbers
    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
    if (updateData.distance) updateData.distance = parseFloat(updateData.distance);
    if (updateData.rating) updateData.rating = parseFloat(updateData.rating);
    if (updateData.reviews) updateData.reviews = parseInt(updateData.reviews);
    if (updateData.commission) updateData.commission = parseFloat(updateData.commission);
    
    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
    });
    
    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services || '[]'),
      offers: JSON.parse(partner.offers || '[]'),
    };
    
    res.json({
      success: true,
      message: 'Partner updated successfully',
      partner: parsedPartner,
    });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update partner',
      error: error.message,
    });
  }
};

// Delete partner
exports.deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.partner.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Partner deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete partner',
      error: error.message,
    });
  }
};

// Search partners
exports.searchPartners = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }
    
    const partners = await prisma.partner.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { area: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      orderBy: { rating: 'desc' },
    });
    
    const parsedPartners = partners.map(partner => ({
      ...partner,
      services: JSON.parse(partner.services || '[]'),
      offers: JSON.parse(partner.offers || '[]'),
    }));
    
    res.json({
      success: true,
      partners: parsedPartners,
    });
  } catch (error) {
    console.error('Error searching partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search partners',
      error: error.message,
    });
  }
};


// Get all partners
exports.getAllPartners = async (req, res) => {
  try {
    const { city, isActive } = req.query;
    
    const where = {};
    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const partners = await prisma.partner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    // Parse JSON strings for services and offers
    const parsedPartners = partners.map(partner => ({
      ...partner,
      services: JSON.parse(partner.services || '[]'),
      offers: JSON.parse(partner.offers || '[]'),
    }));
    
    res.json({
      success: true,
      partners: parsedPartners,
    });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partners',
      error: error.message,
    });
  }
};

// Get partner by ID
exports.getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const partner = await prisma.partner.findUnique({
      where: { id },
    });
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
      });
    }
    
    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services || '[]'),
      offers: JSON.parse(partner.offers || '[]'),
    };
    
    res.json({
      success: true,
      partner: parsedPartner,
    });
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner',
      error: error.message,
    });
  }
};

// Create new partner
exports.createPartner = async (req, res) => {
  try {
    const {
      name,
      area,
      city,
      state,
      country,
      latitude,
      longitude,
      distance,
      phone,
      email,
      website,
      rating,
      reviews,
      timings,
      services,
      offers,
      description,
      isActive,
      isVerified,
    } = req.body;
    
    // Validate required fields
    if (!name || !area || !city || !latitude || !longitude || !phone || !timings) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }
    
    // Create partner with JSON stringified arrays
    const partner = await prisma.partner.create({
      data: {
        name,
        area,
        city,
        state: state || 'Chhattisgarh',
        country: country || 'India',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        distance: distance ? parseFloat(distance) : 0,
        phone,
        email,
        website,
        rating: rating ? parseFloat(rating) : 0,
        reviews: reviews ? parseInt(reviews) : 0,
        timings,
        services: JSON.stringify(services || []),
        offers: JSON.stringify(offers || []),
        description,
        isActive: isActive !== undefined ? isActive : true,
        isVerified: isVerified || false,
      },
    });
    
    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services || '[]'),
      offers: JSON.parse(partner.offers || '[]'),
    };
    
    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      partner: parsedPartner,
    });
  } catch (error) {
    console.error('Error creating partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create partner',
      error: error.message,
    });
  }
};

// Update partner
exports.updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Convert arrays to JSON strings if present
    if (updateData.services) {
      updateData.services = JSON.stringify(updateData.services);
    }
    if (updateData.offers) {
      updateData.offers = JSON.stringify(updateData.offers);
    }
    
    // Convert numeric strings to numbers
    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
    if (updateData.distance) updateData.distance = parseFloat(updateData.distance);
    if (updateData.rating) updateData.rating = parseFloat(updateData.rating);
    if (updateData.reviews) updateData.reviews = parseInt(updateData.reviews);
    
    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
    });
    
    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services || '[]'),
      offers: JSON.parse(partner.offers || '[]'),
    };
    
    res.json({
      success: true,
      message: 'Partner updated successfully',
      partner: parsedPartner,
    });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update partner',
      error: error.message,
    });
  }
};

// Delete partner
exports.deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.partner.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Partner deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete partner',
      error: error.message,
    });
  }
};

// Search partners
exports.searchPartners = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }
    
    const partners = await prisma.partner.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { area: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      orderBy: { rating: 'desc' },
    });
    
    const parsedPartners = partners.map(partner => ({
      ...partner,
      services: JSON.parse(partner.services || '[]'),
      offers: JSON.parse(partner.offers || '[]'),
    }));
    
    res.json({
      success: true,
      partners: parsedPartners,
    });
  } catch (error) {
    console.error('Error searching partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search partners',
      error: error.message,
    });
  }
};
