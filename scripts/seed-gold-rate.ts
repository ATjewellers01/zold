import prisma from "../src/config/db";

async function seedGoldRate() {
  try {
    console.log("🌱 Seeding gold rate...");

    // Deactivate any existing rates
    await prisma.goldRate.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create default gold rate
    const goldRate = await prisma.goldRate.create({
      data: {
        buyRate: 6245.50, // ₹6,245.50 per gram
        sellRate: 6145.50, // ₹6,145.50 per gram (₹100 less)
        isActive: true,
      },
    });

    console.log("✅ Gold rate seeded successfully:");
    console.log(`   Buy Rate: ₹${goldRate.buyRate}/g`);
    console.log(`   Sell Rate: ₹${goldRate.sellRate}/g`);
    console.log(`   Active: ${goldRate.isActive}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding gold rate:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedGoldRate();
