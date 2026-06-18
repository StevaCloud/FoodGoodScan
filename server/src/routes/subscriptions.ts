import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  const sub = await prisma.subscription.findUnique({
    where: { userId: req.userId },
  });

  res.json({
    plan: sub?.plan || 'FREE',
    groceryAddon: sub?.groceryAddon || false,
    expiresAt: sub?.expiresAt,
    prices: {
      premium: '$3.99/mois',
      groceryAddon: '$1.99/mois',
    },
  });
});

router.post('/upgrade', authenticateToken, async (req: AuthRequest, res: Response) => {
  // TODO: Intégrer Stripe pour le vrai paiement
  // Pour le dev, on upgrade directement
  const { plan, groceryAddon } = req.body;

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const sub = await prisma.subscription.upsert({
    where: { userId: req.userId! },
    create: {
      userId: req.userId!,
      plan: plan || 'PREMIUM',
      groceryAddon: groceryAddon || false,
      expiresAt,
    },
    update: {
      plan: plan || 'PREMIUM',
      groceryAddon: groceryAddon ?? undefined,
      expiresAt,
    },
  });

  res.json(sub);
});

router.post('/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  await prisma.subscription.update({
    where: { userId: req.userId! },
    data: { plan: 'FREE', groceryAddon: false },
  });

  res.json({ ok: true, message: 'Abonnement annulé' });
});

export { router as subscriptionRouter };
