import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/leaderboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const [top10, currentUser] = await Promise.all([
      prisma.user.findMany({
        take: 10,
        orderBy: { points: 'desc' },
        where: { points: { gt: 0 } },
        select: { id: true, name: true, points: true },
      }),
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { points: true },
      }),
    ]);

    const myPoints = currentUser?.points || 0;
    const myRank = await prisma.user.count({ where: { points: { gt: myPoints } } }) + 1;

    res.json({
      leaderboard: top10.map((u, i) => {
        const parts = (u.name || '').trim().split(' ');
        const displayName = parts.length >= 2
          ? `${parts[0]} ${parts[1].charAt(0)}.`
          : parts[0] || `Joueur ${i + 1}`;
        return { rank: i + 1, name: displayName, points: u.points, isMe: u.id === req.userId };
      }),
      me: { rank: myRank, points: myPoints },
    });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/pick-winner', async (req: any, res: Response) => {
  const adminPass = process.env.ADMIN_PASSWORD || 'fgs-admin-2026';
  if (req.headers['x-admin-key'] !== adminPass) {
    res.status(401).json({ error: 'Non autorisé' }); return;
  }
  try {
    const winner = await pickMonthlyWinner();
    if (!winner) { res.json({ ok: true, message: 'Aucun gagnant' }); return; }
    res.json({ ok: true, winner: { email: winner.email, points: winner.points } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export async function pickMonthlyWinner() {
  const winner = await prisma.user.findFirst({
    orderBy: { points: 'desc' },
    where: { points: { gt: 0 } },
  });

  if (!winner) {
    console.log('[Quiz] Aucun gagnant ce mois (aucun utilisateur avec des points)');
    return null;
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { userId: winner.id },
    create: { userId: winner.id, plan: 'PREMIUM', groceryAddon: true, expiresAt },
    update: { plan: 'PREMIUM', groceryAddon: true, expiresAt },
  });

  console.log(`[Quiz] Gagnant : ${winner.email} (${winner.points} pts) → Premium + Épicerie jusqu'au ${expiresAt.toLocaleDateString('fr-CA')}`);
  return winner;
}

export { router as quizRouter };
