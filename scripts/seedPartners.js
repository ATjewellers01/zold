const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const seedPartners = async () => {
  try {
    console.log('Seeding partners...');

    const partners = [
      {
        name: 'Botivate Services LLP',
        area: 'Vidhan sabha road',
        city: 'Raipur',
        state: 'Chhattisgarh',
        latitude: 21.28281,
        longitude: 81.70326,
        distance: 1,
        phone: '+91 98765 43210',
        email: 'contact@botivate.com',
        rating: 4.8,
        reviews: 234,
        timings: '10:00 AM - 6:00 PM',
        services: JSON.stringify(['Web Development', 'Mobile App Development', 'Automation', 'AI']),
        offers: JSON.stringify(['10% discount on first order']),
        description: 'Leading tech service provider',
        isActive: true,
        isVerified: true,
      },
      {
        name: 'AT Plus Jewellers',
        area: 'Sadar Bazar',
        city: 'Raipur',
        state: 'Chhattisgarh',
        latitude: 21.23831,
        longitude: 81.63365,
        distance: 11.3,
        phone: '+91 98765 43211',
        email: 'info@atplusjewellers.com',
        rating: 4.6,
        reviews: 156,
        timings: '11:00 AM - 7:00 PM',
        services: JSON.stringify(['jewellery', 'loan']),
        offers: JSON.stringify([]),
        description: 'Trusted jewellery store',
        isActive: true,
        isVerified: true,
      },
      {
        name: 'Kalyan Jewellers',
        area: 'Pandari',
        city: 'Raipur',
        state: 'Chhattisgarh',
        latitude: 21.25233,
        longitude: 81.64860,
        distance: 7.7,
        phone: '+91 98765 43212',
        email: 'support@kalyanjewellers.com',
        rating: 4.9,
        reviews: 412,
        timings: '10:30 AM - 9:00 PM',
        services: JSON.stringify(['pickup', 'jewellery']),
        offers: JSON.stringify(['Special discount on gold coins', 'Free insurance for 1 year']),
        description: 'Premium jewellery destination',
        isActive: true,
        isVerified: true,
      },
    ];

    for (const partner of partners) {
      await prisma.partner.create({ data: partner });
    }

    console.log('✅ Partners seeded successfully!');
  } catch (error) {
    console.error('Error seeding partners:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedPartners();
