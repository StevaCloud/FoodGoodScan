import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth';


export function requirePremium(req: AuthRequest, res: Response, next: NextFunction) {
  checkSubscription(req, res, next, false);
}

export function requireGroceryAddon(req: AuthRequest, res: Response, next: NextFunction) {
  checkSubscription(req, res, next, true);
}

async function checkSubscription(req: AuthRequest, res: Response, next: NextFunction, requireGrocery: boolean) {
  if (!req.userId) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: req.userId },
  });

  if (!sub || sub.plan !== 'PREMIUM' as string) {
    res.status(403).json({ error: 'Abonnement Premium requis ($3.99/mois)' });
    return;
  }

  if (sub.expiresAt && sub.expiresAt < new Date()) {
    res.status(403).json({ error: 'Abonnement expiré' });
    return;
  }

  if (requireGrocery && !sub.groceryAddon) {
    res.status(403).json({ error: 'Scan Plus requis ($5.99/mois)', upgradeToScanPlus: true });
    return;
  }

  next();
}
