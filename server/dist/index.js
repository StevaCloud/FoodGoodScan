"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const auth_1 = require("./routes/auth");
const products_1 = require("./routes/products");
const subscriptions_1 = require("./routes/subscriptions");
const deals_1 = require("./routes/deals");
const categories_1 = require("./routes/categories");
const webhooks_1 = require("./routes/webhooks");
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET manquant en production');
    process.exit(1);
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
    : ['http://localhost:8081', 'http://localhost:8082', 'http://localhost:3000', 'http://localhost:19006'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origin (apps mobiles, Postman)
        if (!origin || allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error('CORS non autorisé'));
    },
    credentials: true,
}));
// Webhook Stripe AVANT express.json (besoin du raw body)
app.use('/api/stripe', webhooks_1.webhookRouter);
app.use(express_1.default.json({ limit: '10kb' }));
// Rate limiting global
const globalLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, réessaie dans 15 minutes.' },
});
// Rate limiting strict pour l'auth : 10 req/15min
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de tentatives, réessaie dans 15 minutes.' },
});
app.use(globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth', auth_1.authRouter);
app.use('/api/products', products_1.productRouter);
app.use('/api/subscriptions', subscriptions_1.subscriptionRouter);
app.use('/api/deals', deals_1.dealRouter);
app.use('/api/categories', categories_1.categoryRouter);
const ALLOWED_IMAGE_HOSTS = ['backflipp.wishabi.com', 'images.flippenterprise.com', 'assets.flippenterprise.com', 'f.wishabi.net'];
app.get('/api/image-proxy', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            res.status(400).send('URL required');
            return;
        }
        // Valide que l'URL vient d'un hôte autorisé
        let parsed;
        try {
            parsed = new URL(url);
        }
        catch {
            res.status(400).send('URL invalide');
            return;
        }
        if (!ALLOWED_IMAGE_HOSTS.includes(parsed.hostname)) {
            res.status(403).send('Hôte non autorisé');
            return;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        const buffer = await response.arrayBuffer();
        res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(Buffer.from(buffer));
    }
    catch {
        res.status(404).send('');
    }
});
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`FoodGoodScan server running on port ${PORT}`);
});
