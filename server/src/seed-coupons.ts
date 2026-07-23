import { prisma } from './lib/prisma';

async function main() {
  console.log('Suppression des faux coupons...');
  const deleted = await prisma.coupon.deleteMany({
    where: { couponType: { not: 'PROMO_CODE' } },
  });
  console.log(`${deleted.count} faux coupons supprimés.`);
  await prisma.$disconnect();
}

main().catch(console.error);
