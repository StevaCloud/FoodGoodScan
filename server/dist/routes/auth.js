"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const email_1 = require("../services/email");
// In-memory reset codes: email -> { code, expiresAt, attempts }
const resetCodes = new Map();
const MAX_RESET_ATTEMPTS = 5;
const router = (0, express_1.Router)();
exports.authRouter = router;
const prisma = new client_1.PrismaClient();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(6, 'Mot de passe minimum 6 caractères'),
    name: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = registerSchema.parse(req.body);
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(400).json({ error: 'Email déjà utilisé' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
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
        const token = (0, auth_1.generateToken)(user.id);
        res.status(201).json({
            token,
            user: { id: user.id, email: user.email, name: user.name },
            trial: { days: 14, endsAt: trialEndsAt },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors[0].message });
            return;
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email },
            include: { subscription: true },
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            return;
        }
        const token = (0, auth_1.generateToken)(user.id);
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors[0].message });
            return;
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email requis' });
            return;
        }
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
                await (0, email_1.sendResetCode)(email, code);
                res.json({ message: 'Un code a été envoyé à ton adresse email.' });
            }
            catch (emailError) {
                console.error('Erreur envoi email:', emailError?.message || emailError);
                res.json({ message: 'Code généré (erreur email)', code });
            }
        }
        else {
            res.json({ message: 'Code généré', code });
        }
    }
    catch (err) {
        console.error('forgot-password error:', err?.message || err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.post('/reset-password', async (req, res) => {
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
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma.user.update({ where: { email }, data: { password: hashedPassword } });
        resetCodes.delete(email);
        res.json({ message: 'Mot de passe réinitialisé avec succès' });
    }
    catch {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.delete('/account', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        // Supprime toutes les données de l'utilisateur (cascade via Prisma)
        await prisma.scanHistory.deleteMany({ where: { userId } });
        await prisma.favorite.deleteMany({ where: { userId } });
        await prisma.subscription.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
        res.json({ message: 'Compte supprimé avec succès' });
    }
    catch {
        res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
    }
});
router.get('/me', auth_1.authenticateToken, async (req, res) => {
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
