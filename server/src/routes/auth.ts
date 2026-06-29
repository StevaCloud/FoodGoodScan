import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { sendResetCode } from '../services/email';

// In-memory reset codes: email -> { code, expiresAt, attempts }
const resetCodes = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const MAX_RESET_ATTEMPTS = 5;

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'Email déjà utilisé' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        subscription: {
          create: {
            plan: 'PREMIUM',
            groceryAddon: true,
            expiresAt: trialEndsAt,
          },
        },
      },
    });

    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      trial: { days: 14, endsAt: trialEndsAt },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    const token = generateToken(user.id);
    const sub = user.subscription;
    const isExpired = sub?.expiresAt && sub.expiresAt < new Date();
    const effectivePlan = (isExpired ? 'FREE' : sub?.plan) || 'FREE';

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: effectivePlan,
        groceryAddon: isExpired ? false : (sub?.groceryAddon || false),
        trialEndsAt: sub?.expiresAt || null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'Email requis' }); return; }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists
      res.json({ message: 'Si cet email existe, un code a été envoyé.' });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes.set(email, { code, expiresAt: Date.now() + 15 * 60 * 1000, attempts: 0 });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendResetCode(email, code);
        res.json({ message: 'Un code a été envoyé à ton adresse email.' });
      } catch (emailError: any) {
        console.error('Erreur envoi email:', emailError?.message || emailError);
        res.json({ message: 'Code généré (erreur email)', code });
      }
    } else {
      res.json({ message: 'Code généré', code });
    }
  } catch (err: any) {
    console.error('forgot-password error:', err?.message || err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, code et nouveau mot de passe requis' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Mot de passe minimum 6 caractères' });
      return;
    }

    const entry = resetCodes.get(email);
    if (!entry || Date.now() > entry.expiresAt) {
      res.status(400).json({ error: 'Code invalide ou expiré' });
      return;
    }
    if (entry.attempts >= MAX_RESET_ATTEMPTS) {
      resetCodes.delete(email);
      res.status(429).json({ error: 'Trop de tentatives — demande un nouveau code' });
      return;
    }
    if (entry.code !== code) {
      entry.attempts += 1;
      res.status(400).json({ error: `Code invalide (${MAX_RESET_ATTEMPTS - entry.attempts} tentatives restantes)` });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email }, data: { password: hashedPassword } });
    resetCodes.delete(email);

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/account', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    // Supprime toutes les données de l'utilisateur (cascade via Prisma)
    await prisma.scanHistory.deleteMany({ where: { userId } });
    await prisma.favorite.deleteMany({ where: { userId } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Compte supprimé avec succès' });
  } catch {
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { subscription: true },
    omit: { password: true },
  });

  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  res.json(user);
});

export { router as authRouter };
