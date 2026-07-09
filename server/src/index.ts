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
import { webhookRouter } from './routes/webhooks';
import { couponsRouter } from './routes/coupons';
import { nutritionRouter } from './routes/nutrition';

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

// Webhook Stripe AVANT express.json (besoin du raw body)
app.use('/api/stripe', webhookRouter);

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
app.use('/api/coupons', couponsRouter);
app.use('/api/nutrition', nutritionRouter);

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

app.get('/privacy', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Politique de confidentialité — FoodGoodScan</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #222; line-height: 1.7; }
  h1 { color: #16a34a; } h2 { color: #15803d; margin-top: 32px; }
  a { color: #16a34a; }
</style>
</head>
<body>
<h1>Politique de confidentialité — FoodGoodScan</h1>
<p><strong>Dernière mise à jour :</strong> 9 juillet 2026</p>

<h2>1. Informations collectées</h2>
<p>FoodGoodScan collecte les informations suivantes :</p>
<ul>
  <li><strong>Adresse courriel</strong> : utilisée pour la création de compte et la connexion.</li>
  <li><strong>Numéro de téléphone</strong> : utilisé pour la prévention des abus d'abonnement.</li>
  <li><strong>Code postal</strong> : utilisé pour afficher les circulaires et offres de votre région.</li>
  <li><strong>Données de scan</strong> : codes-barres des produits scannés, conservés dans votre historique.</li>
  <li><strong>Localisation approximative</strong> : utilisée pour les données météo et les offres locales (non stockée de manière permanente).</li>
</ul>

<h2>2. Utilisation des données</h2>
<p>Vos données sont utilisées exclusivement pour :</p>
<ul>
  <li>Fournir les fonctionnalités de l'application (scan, circulaires, listes d'épicerie, quiz)</li>
  <li>Gérer votre abonnement via Stripe</li>
  <li>Afficher des publicités personnalisées via AppLovin MAX (avec votre consentement)</li>
  <li>Améliorer les recommandations nutritionnelles</li>
</ul>

<h2>3. Partage des données</h2>
<p>Nous ne vendons jamais vos données personnelles. Elles peuvent être partagées avec :</p>
<ul>
  <li><strong>Stripe</strong> : traitement des paiements (stripe.com/privacy)</li>
  <li><strong>AppLovin</strong> : publicités dans l'application (applovin.com/privacy)</li>
  <li><strong>Open Food Facts</strong> : données nutritionnelles publiques</li>
</ul>

<h2>4. Conservation des données</h2>
<p>Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la suppression de votre compte et de toutes vos données à tout moment.</p>

<h2>5. Sécurité</h2>
<p>Vos données sont protégées par chiffrement (HTTPS, bcrypt pour les mots de passe, JWT sécurisés).</p>

<h2>6. Vos droits</h2>
<p>Conformément à la Loi 25 (Québec) et au RGPD (Europe), vous avez le droit d'accéder, de corriger ou de supprimer vos données.</p>

<h2>7. Contact</h2>
<p>Pour toute question : <a href="mailto:foodgoodscan.app@gmail.com">foodgoodscan.app@gmail.com</a></p>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`FoodGoodScan server running on port ${PORT}`);
});
