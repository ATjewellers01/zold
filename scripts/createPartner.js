const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Create a partner account with linked user
 * @param {Object} data - Partner data
 * @returns {Object} Created user and partner
 */
async function createPartner(data) {
  try {
    // Validate required fields
    const required = ['businessName', 'ownerName', 'username', 'email', 'password', 'phone', 'city'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create user account
    const user = await prisma.user.create({
      data: {
        name: data.ownerName,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: 'PARTNER',
        isVerified: true,
      }
    });
    
    console.log('✅ User account created:', user.id);
    
    // Create partner profile
    const partner = await prisma.partner.create({
      data: {
        name: data.businessName,
        area: data.area || data.city,
        city: data.city,
        state: data.state || 'Chhattisgarh',
        country: 'India',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        phone: data.phone,
        email: data.email,
        website: data.website || null,
        timings: data.timings || '10:00 AM - 8:00 PM',
        services: JSON.stringify(data.services || ['jewellery']),
        offers: JSON.stringify(data.offers || []),
        description: data.description || null,
        commission: data.commission || 2.0,
        bankAccount: data.bankAccount || null,
        userId: user.id,
        isActive: true,
        isVerified: data.preApproved || false,
      }
    });
    
    // Create wallet for partner user
    await prisma.wallet.create({
      data: {
        userId: user.id,
        goldBalance: 0,
        pledgedGold: 0,
        rupeeBalance: 0,
      }
    });
    
    console.log('✅ Partner created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User ID:', user.id);
    console.log('Partner ID:', partner.id);
    console.log('Business:', data.businessName);
    console.log('Username:', data.username);
    console.log('Password:', data.password);
    console.log('Email:', data.email);
    console.log('Commission:', data.commission || 2.0, '%');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return { user, partner };
  } catch (error) {
    console.error('❌ Error creating partner:', error.message);
    throw error;
  }
}

// Example usage - Uncomment and modify to create a partner
async function main() {
  const partnerData = {
    businessName: 'Golden Jewellers',
    ownerName: 'Rajesh Kumar',
    username: 'rajesh_golden',
    email: 'rajesh@goldenjewellers.com',
    password: 'Partner@123',
    phone: '+919876543210',
    area: 'MG Road',
    city: 'Raipur',
    state: 'Chhattisgarh',
    latitude: 21.2514,
    longitude: 81.6296,
    timings: '10:00 AM - 9:00 PM',
    services: ['jewellery', 'pickup', 'loan'],
    commission: 2.5,
    bankAccount: 'HDFC1234567890',
    website: 'www.goldenjewellers.com',
    description: 'Premium gold jewellery with 20 years of experience',
    preApproved: true, // Set to true to auto-approve
  };

  try {
    await createPartner(partnerData);
    console.log('\n✅ Partner account ready to use!');
  } catch (error) {
    console.error('\n❌ Failed to create partner');
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = createPartner;
