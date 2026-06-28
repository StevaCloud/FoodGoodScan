"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePremium = requirePremium;
exports.requireGroceryAddon = requireGroceryAddon;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function requirePremium(req, res, next) {
    checkSubscription(req, res, next, false);
}
function requireGroceryAddon(req, res, next) {
    checkSubscription(req, res, next, true);
}
async function checkSubscription(req, res, next, requireGrocery) {
    if (!req.userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
    }
    const sub = await prisma.subscription.findUnique({
        where: { userId: req.userId },
    });
    if (!sub || sub.plan !== 'PREMIUM') {
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
