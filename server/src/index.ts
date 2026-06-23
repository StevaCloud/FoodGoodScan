import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { productRouter } from './routes/products';
import { subscriptionRouter } from './routes/subscriptions';
import { dealRouter } from './routes/deals';
import { categoryRouter } from './routes/categories';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET manquant en production');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
  : ['http://localhost:8081', 'http://localhost:8082', 'http://localhost:3000', 'http://localhost:19006'];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (apps mobiles, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS non autorisé'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessaie dans 15 minutes.' },
});

// Rate limiting strict pour l'auth : 10 req/15min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessaie dans 15 minutes.' },
});

app.use(globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/deals', dealRouter);
app.use('/api/categories', categoryRouter);

const ALLOWED_IMAGE_HOSTS = ['backflipp.wishabi.com', 'images.flippenterprise.com', 'assets.flippenterprise.com', 'f.wishabi.net'];

app.get('/api/image-proxy', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) { res.status(400).send('URL required'); return; }

    // Valide que l'URL vient d'un hôte autorisé
    let parsed: URL;
    try { parsed = new URL(url); } catch { res.status(400).send('URL invalide'); return; }
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
  } catch {
    res.status(404).send('');
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`FoodGoodScan server running on port ${PORT}`);
});
