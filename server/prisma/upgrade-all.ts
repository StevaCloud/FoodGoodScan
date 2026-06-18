import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { subscription: true } });
  for (const u of users) {
    await prisma.subscription.upsert({
      where: { userId: u.id },
      create: { userId: u.id, plan: 'PREMIUM', groceryAddon: true, expiresAt: new Date('2027-01-01') },
      update: { plan: 'PREMIUM', groceryAddon: true, expiresAt: new Date('2027-01-01') },
    });
    console.log('Upgraded:', u.email);
  }
  await prisma.$disconnect();
}

main();
