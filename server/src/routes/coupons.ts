import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { randomBytes } from 'crypto';
import { getRealCoupons } from '../services/rss-coupons';

const router = Router();

// Points gagnés par action
export const POINTS = { scan: 5, quiz: 3, dailyLogin: 2, premiumBonus: 10 };

// Vrais coupons RSS (RedFlagDeals, Smartcanucks, Reducteur)
router.get('/real', authenticateToken, async (_req: AuthRequest, res: Response) => {
  try {
    const coupons = await getRealCoupons();
    res.json(coupons);
  } catch {
    res.json([]);
  }
});

// Liste des coupons points disponibles
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const coupons = await prisma.coupon.findMany({
    where: { isActive: true },
    orderBy: { pointsCost: 'asc' },
  });
  res.json(coupons);
});

// Solde de points + coupons réclamés de l'utilisateur
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { points: true },
  });
  const claimed = await prisma.userCoupon.findMany({
    where: { userId: req.userId! },
    include: { coupon: true },
    orderBy: { claimedAt: 'desc' },
  });
  res.json({ points: user?.points ?? 0, coupons: claimed });
});

// Réclamer un coupon
router.post('/claim/:couponId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { couponId } = req.params;
  const userId = req.userId!;

  const [coupon, user] = await Promise.all([
    prisma.coupon.findUnique({ where: { id: couponId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { points: true } }),
  ]);

  if (!coupon || !coupon.isActive) {
    res.status(404).json({ error: 'Coupon introuvable ou inactif' });
    return;
  }
  if (!user || user.points < coupon.pointsCost) {
    res.status(400).json({ error: `Points insuffisants — il vous faut ${coupon.pointsCost} points` });
    return;
  }

  const alreadyClaimed = await prisma.userCoupon.findFirst({ where: { userId, couponId } });
  if (alreadyClaimed) {
    res.status(400).json({ error: 'Vous avez déjà réclamé ce coupon' });
    return;
  }

  const code = randomBytes(4).toString('hex').toUpperCase();

  const [, userCoupon] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { points: { decrement: coupon.pointsCost } } }),
    prisma.userCoupon.create({ data: { userId, couponId, code }, include: { coupon: true } }),
  ]);

  res.json({ ok: true, userCoupon });
});

// Marquer un coupon comme utilisé
router.post('/use/:userCouponId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const uc = await prisma.userCoupon.findFirst({
    where: { id: req.params.userCouponId, userId: req.userId! },
  });
  if (!uc) { res.status(404).json({ error: 'Coupon introuvable' }); return; }
  if (uc.usedAt) { res.status(400).json({ error: 'Coupon déjà utilisé' }); return; }
  const updated = await prisma.userCoupon.update({
    where: { id: uc.id },
    data: { usedAt: new Date() },
    include: { coupon: true },
  });
  res.json({ ok: true, userCoupon: updated });
});

const DAILY_QUIZ_LIMIT = 3;
// userId -> { date: string, count: number }
const quizTracker = new Map<string, { date: string; count: number }>();

// Ajouter des points depuis le client (quiz, scan, etc.)
router.post('/earn', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { action, amount } = req.body as { action?: string; amount?: number };
  const userId = req.userId!;

  let pts = 0;
  if (action === 'quiz' && typeof amount === 'number' && amount > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const entry = quizTracker.get(userId);
    if (entry && entry.date === today && entry.count >= DAILY_QUIZ_LIMIT) {
      res.status(429).json({ error: `Maximum ${DAILY_QUIZ_LIMIT} quiz par jour` });
      return;
    }
    quizTracker.set(userId, {
      date: today,
      count: entry?.date === today ? entry.count + 1 : 1,
    });
    pts = Math.min(amount, 30);
  } else if (action === 'scan') {
    pts = POINTS.scan;
  } else if (action === 'dailyLogin') {
    pts = POINTS.dailyLogin;
  } else {
    res.status(400).json({ error: 'Action invalide' });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: pts } },
    select: { points: true },
  });

  res.json({ ok: true, earned: pts, total: updated.points });
});

// Ajouter des points (appelé en interne par d'autres routes)
export async function addPoints(userId: string, amount: number) {
  return prisma.user.update({ where: { id: userId }, data: { points: { increment: amount } } });
}

export { router as couponsRouter };
