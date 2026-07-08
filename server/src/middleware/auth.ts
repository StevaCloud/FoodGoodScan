import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('JWT_SECRET manquant'); })()
  : 'foodcheck-dev-secret-change-in-prod');

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token requis' });
    return;
  }

  let decoded: { userId: string; ver: number };
  try {
    decoded = jwt.verify(token, JWT_SECRET) as { userId: string; ver: number };
  } catch {
    res.status(403).json({ error: 'Token invalide' });
    return;
  }

  // Vérifie que le token n'a pas été révoqué (logout ou changement de mot de passe)
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { tokenVersion: true },
  });

  if (!user || user.tokenVersion !== decoded.ver) {
    res.status(401).json({ error: 'Session expirée, reconnecte-toi' });
    return;
  }

  req.userId = decoded.userId;
  next();
}

export function generateToken(userId: string, tokenVersion: number): string {
  return jwt.sign({ userId, ver: tokenVersion }, JWT_SECRET, { expiresIn: '7d' });
}
