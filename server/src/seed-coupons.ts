import { prisma } from './lib/prisma';

async function main() {
  console.log('Suppression des faux coupons...');

  // Trouver les IDs des faux coupons
  const fakeCoupons = await prisma.coupon.findMany({
    where: { couponType: { not: 'PROMO_CODE' } },
    select: { id: true },
  });
  const fakeIds = fakeCoupons.map(c => c.id);
  console.log(`${fakeIds.length} faux coupons trouvés.`);

  // Supprimer les UserCoupons liés d'abord
  const deletedUC = await prisma.userCoupon.deleteMany({
    where: { couponId: { in: fakeIds } },
  });
  console.log(`${deletedUC.count} UserCoupons supprimés.`);

  // Supprimer les faux coupons
  const deletedC = await prisma.coupon.deleteMany({
    where: { id: { in: fakeIds } },
  });
  console.log(`${deletedC.count} faux coupons supprimés.`);

  await prisma.$disconnect();
}

main().catch(console.error);
