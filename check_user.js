const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findFirst({
    where: {
      name: {
        contains: 'vikas',
        mode: 'insensitive'
      }
    }
  });
  console.log(user);
}

checkUser()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
