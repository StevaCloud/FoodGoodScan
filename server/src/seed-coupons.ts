import { prisma } from './lib/prisma';

const coupons = [
  // Restaurants
  { title: '10% de rabais chez McDonald\'s', description: 'Valide sur tout le menu, dîner ou souper.', category: 'restaurant', partner: 'McDonald\'s', discount: '10%', imageEmoji: '🍔', pointsCost: 50 },
  { title: 'Café gratuit chez Tim Hortons', description: 'Un café de taille moyenne offert à l\'achat d\'un sandwich.', category: 'restaurant', partner: 'Tim Hortons', discount: '1 café gratuit', imageEmoji: '☕', pointsCost: 40 },
  { title: '15% chez St-Hubert', description: 'Sur toute commande de 25$ et plus.', category: 'restaurant', partner: 'St-Hubert', discount: '15%', imageEmoji: '🍗', pointsCost: 75 },
  { title: 'Pizza gratuite chez Pizza Hut', description: 'Une pizza moyenne offerte à l\'achat d\'une grande.', category: 'restaurant', partner: 'Pizza Hut', discount: '1 pizza offerte', imageEmoji: '🍕', pointsCost: 100 },
  { title: '20% chez Subway', description: 'Sur tout sous-marin de 30 cm.', category: 'restaurant', partner: 'Subway', discount: '20%', imageEmoji: '🥖', pointsCost: 60 },
  { title: 'Dessert gratuit chez Dairy Queen', description: 'Un Blizzard moyen offert.', category: 'restaurant', partner: 'Dairy Queen', discount: '1 Blizzard gratuit', imageEmoji: '🍦', pointsCost: 55 },

  // Épicerie
  { title: '5$ de rabais chez IGA', description: 'Sur tout achat de 50$ ou plus.', category: 'epicerie', partner: 'IGA', discount: '5$', imageEmoji: '🛒', pointsCost: 30 },
  { title: '10% chez Métro', description: 'Sur les produits biologiques et santé.', category: 'epicerie', partner: 'Métro', discount: '10%', imageEmoji: '🥦', pointsCost: 35 },
  { title: '8$ de rabais chez Maxi', description: 'Sur tout achat de 60$ ou plus.', category: 'epicerie', partner: 'Maxi', discount: '8$', imageEmoji: '🏪', pointsCost: 40 },
  { title: 'Produit bio gratuit chez Rachelle-Béry', description: 'Un produit biologique au choix jusqu\'à 5$ de valeur.', category: 'epicerie', partner: 'Rachelle-Béry', discount: 'Produit gratuit', imageEmoji: '🌿', pointsCost: 45 },

  // Voyage
  { title: '50$ de rabais chez Transat', description: 'Sur tout forfait voyage de 1000$ et plus.', category: 'voyage', partner: 'Transat', discount: '50$', imageEmoji: '✈️', pointsCost: 200 },
  { title: '30$ chez Sunwing', description: 'En réduction sur votre prochain voyage soleil.', category: 'voyage', partner: 'Sunwing', discount: '30$', imageEmoji: '🌴', pointsCost: 150 },
  { title: 'Nuit gratuite chez Best Western', description: 'Une nuit offerte à l\'achat de 3 nuits.', category: 'voyage', partner: 'Best Western', discount: '1 nuit gratuite', imageEmoji: '🏨', pointsCost: 300 },
  { title: 'Upgrade de chambre chez Marriott', description: 'Surclassement gratuit à l\'arrivée selon disponibilité.', category: 'voyage', partner: 'Marriott', discount: 'Upgrade gratuit', imageEmoji: '🛎️', pointsCost: 180 },

  // Rabais divers
  { title: '25% chez Cinéplex', description: 'Sur le prix d\'entrée, valide du lundi au jeudi.', category: 'divers', partner: 'Cinéplex', discount: '25%', imageEmoji: '🎬', pointsCost: 80 },
  { title: '15% chez Sport Expert', description: 'Sur les équipements sportifs et vêtements.', category: 'divers', partner: 'Sport Expert', discount: '15%', imageEmoji: '⚽', pointsCost: 90 },
  { title: '20$ chez Pharmaprix', description: 'À la caisse sur tout achat de 40$.', category: 'divers', partner: 'Pharmaprix', discount: '20$', imageEmoji: '💊', pointsCost: 70 },
  { title: 'Billet gratuit au zoo de Granby', description: 'Un billet adulte offert à l\'achat d\'un billet plein tarif.', category: 'divers', partner: 'Zoo de Granby', discount: '1 billet gratuit', imageEmoji: '🦁', pointsCost: 120 },
];

async function main() {
  console.log('Seeding coupons...');
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { id: c.title.substring(0, 10) },
      update: {},
      create: { ...c, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    }).catch(async () => {
      await prisma.coupon.create({
        data: { ...c, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
      });
    });
  }
  console.log(`Seeded ${coupons.length} coupons.`);
  await prisma.$disconnect();
}

main().catch(console.error);
