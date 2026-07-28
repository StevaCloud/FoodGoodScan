import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { addPoints, POINTS } from './coupons';

const router = Router();

const POINTS_CORRECTION = 10;
const TOLERANCE = 0.12; // 12% de tolérance

function isClose(a: number | null | undefined, b: number | null | undefined): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (a === 0 && b === 0) return true;
  const avg = (Math.abs(a) + Math.abs(b)) / 2;
  return avg === 0 || Math.abs(a - b) / avg <= TOLERANCE;
}

function correctionsMatch(a: any, b: any): boolean {
  return (
    isClose(a.calories, b.calories) &&
    isClose(a.fat, b.fat) &&
    isClose(a.carbs, b.carbs) &&
    isClose(a.proteins, b.proteins) &&
    isClose(a.salt, b.salt)
  );
}

// POST /api/corrections/:barcode — soumettre une correction
router.post('/:barcode', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const barcode = String(req.params.barcode);
    const userId = req.userId!;
    const { productName, calories, fat, saturatedFat, carbs, sugars, fiber, proteins, salt } = req.body;

    if (!productName) {
      res.status(400).json({ error: 'productName requis' });
      return;
    }

    const newValues = { calories, fat, saturatedFat, carbs, sugars, fiber, proteins, salt };

    // Vérifier si l'utilisateur a déjà soumis pour ce produit
    const existing = await prisma.productCorrection.findUnique({
      where: { barcode_userId: { barcode, userId } },
    });
    if (existing) {
      res.status(409).json({ error: 'Tu as déjà soumis une correction pour ce produit.' });
      return;
    }

    // Chercher une correction PENDING d'un autre utilisateur
    const pending = await prisma.productCorrection.findFirst({
      where: { barcode, status: 'PENDING', userId: { not: userId } },
    });

    if (pending && correctionsMatch(pending, newValues)) {
      // Les valeurs correspondent — confirmer les deux entrées
      await prisma.$transaction([
        prisma.productCorrection.update({
          where: { id: pending.id },
          data: { status: 'CONFIRMED', confirmedBy: userId },
        }),
        prisma.productCorrection.create({
          data: { barcode, productName, userId, status: 'CONFIRMED', confirmedBy: pending.userId, ...newValues },
        }),
      ]);

      // Donner les points aux deux utilisateurs
      await Promise.all([
        addPoints(pending.userId, POINTS_CORRECTION),
        addPoints(userId, POINTS_CORRECTION),
      ]);

      res.json({ status: 'CONFIRMED', pointsEarned: POINTS_CORRECTION, message: 'Valeurs confirmées ! +10 points' });
    } else {
      // Première soumission — enregistrer en PENDING
      await prisma.productCorrection.create({
        data: { barcode, productName, userId, status: 'PENDING', ...newValues },
      });
      res.json({ status: 'PENDING', pointsEarned: 0, message: 'Correction enregistrée. En attente de confirmation par un autre utilisateur.' });
    }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Tu as déjà soumis une correction pour ce produit.' });
      return;
    }
    console.error('correction error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/corrections/:barcode — récupérer la correction confirmée (utilisée par le scan)
router.get('/:barcode', async (req, res) => {
  try {
    const barcode = String(req.params.barcode);
    const confirmed = await prisma.productCorrection.findFirst({
      where: { barcode, status: 'CONFIRMED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!confirmed) {
      res.json({ found: false });
      return;
    }
    res.json({
      found: true,
      nutriments: {
        'energy-kcal_100g': confirmed.calories ?? undefined,
        fat_100g: confirmed.fat ?? undefined,
        'saturated-fat_100g': confirmed.saturatedFat ?? undefined,
        carbohydrates_100g: confirmed.carbs ?? undefined,
        sugars_100g: confirmed.sugars ?? undefined,
        fiber_100g: confirmed.fiber ?? undefined,
        proteins_100g: confirmed.proteins ?? undefined,
        salt_100g: confirmed.salt ?? undefined,
      },
    });
  } catch {
    res.json({ found: false });
  }
});

export { router as correctionsRouter };
