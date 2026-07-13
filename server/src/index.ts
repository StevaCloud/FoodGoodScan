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
import { prisma } from './lib/prisma';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET manquant en production');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/admin', async (req, res) => {
  // Basic Auth
  const adminPass = process.env.ADMIN_PASSWORD || 'fgs-admin-2026';
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="FoodGoodScan Admin"');
    res.status(401).send('Accès refusé');
    return;
  }
  const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
  if (user !== 'admin' || pass !== adminPass) {
    res.setHeader('WWW-Authenticate', 'Basic realm="FoodGoodScan Admin"');
    res.status(401).send('Mot de passe incorrect');
    return;
  }

  try {
    const [totalUsers, premiumUsers, trialUsers, totalScans, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({ where: { plan: 'PREMIUM' } }),
      prisma.subscription.count({ where: { plan: 'TRIAL' } }),
      prisma.scanHistory.count(),
      prisma.user.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { subscription: true },
      }),
    ]);

    const freeUsers = totalUsers - premiumUsers - trialUsers;

    const rows = recentUsers.map(u => {
      const plan = u.subscription?.plan || 'FREE';
      const planColor = plan === 'PREMIUM' ? '#22c55e' : plan === 'TRIAL' ? '#f59e0b' : '#888';
      const date = new Date(u.createdAt).toLocaleDateString('fr-CA');
      return `<tr>
        <td>${u.email}</td>
        <td><span style="color:${planColor};font-weight:700">${plan}</span></td>
        <td>${u.points}</td>
        <td>${date}</td>
      </tr>`;
    }).join('');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin — FoodGoodScan</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, sans-serif; background: #0a0a0a; color: #e5e5e5; padding: 24px; }
  h1 { color: #22c55e; font-size: 28px; margin-bottom: 8px; }
  .sub { color: #666; font-size: 13px; margin-bottom: 32px; }
  .stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
  .card { background: #1a1a1a; border: 1px solid #222; border-radius: 12px; padding: 20px 28px; min-width: 140px; }
  .card-num { font-size: 36px; font-weight: 800; color: #22c55e; }
  .card-label { font-size: 13px; color: #888; margin-top: 4px; }
  .card.orange .card-num { color: #f59e0b; }
  .card.blue .card-num { color: #60a5fa; }
  .card.gray .card-num { color: #aaa; }
  h2 { font-size: 18px; color: #ccc; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; background: #111; border-radius: 12px; overflow: hidden; }
  th { background: #1a1a1a; color: #888; font-size: 12px; text-transform: uppercase; padding: 12px 16px; text-align: left; }
  td { padding: 12px 16px; border-top: 1px solid #1a1a1a; font-size: 14px; }
  tr:hover td { background: #161616; }
</style>
</head>
<body>
<h1>FoodGoodScan Admin</h1>
<p class="sub">Dernière mise à jour : ${new Date().toLocaleString('fr-CA')}</p>

<div class="stats">
  <div class="card"><div class="card-num">${totalUsers}</div><div class="card-label">Utilisateurs total</div></div>
  <div class="card"><div class="card-num">${premiumUsers}</div><div class="card-label">Premium</div></div>
  <div class="card orange"><div class="card-num">${trialUsers}</div><div class="card-label">En essai</div></div>
  <div class="card gray"><div class="card-num">${freeUsers}</div><div class="card-label">Free</div></div>
  <div class="card blue"><div class="card-num">${totalScans}</div><div class="card-label">Scans total</div></div>
</div>

<h2>Utilisateurs récents (50 derniers)</h2>
<table>
  <thead><tr><th>Email</th><th>Plan</th><th>Points</th><th>Inscrit le</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body>
</html>`);
  } catch (err) {
    res.status(500).send('Erreur serveur');
  }
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
  <li><strong>Données biométriques (empreinte digitale / Face ID)</strong> : utilisées uniquement pour déverrouiller l'accès à l'application. Ces données ne quittent jamais votre appareil et ne sont jamais transmises à nos serveurs.</li>
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
  <li><strong>Stripe</strong> : traitement des paiements</li>
  <li><strong>AppLovin</strong> : publicités dans l'application</li>
  <li><strong>Open Food Facts</strong> : données nutritionnelles publiques</li>
</ul>

<h2>4. Conservation des données</h2>
<p>Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la suppression à tout moment.</p>

<h2>5. Sécurité</h2>
<p>Vos données sont protégées par chiffrement (HTTPS, bcrypt, JWT sécurisés).</p>

<h2>6. Vos droits</h2>
<p>Conformément à la Loi 25 (Québec) et au RGPD, vous avez le droit d'accéder, de corriger ou de supprimer vos données.</p>

<h2>7. Contact</h2>
<p><a href="mailto:foodgoodscan.app@gmail.com">foodgoodscan.app@gmail.com</a></p>
</body>
</html>`);
});

app.get('/delete-account', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Supprimer mon compte — FoodGoodScan</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; color: #222; line-height: 1.7; }
  h1 { color: #dc2626; } h2 { color: #111; margin-top: 28px; }
  .warn { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 16px 0; color: #991b1b; }
  .step { display: flex; gap: 12px; margin-bottom: 14px; }
  .num { background: #dc2626; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }
  a { color: #16a34a; } ul { padding-left: 20px; }
  .btn { display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; margin-top: 8px; }
</style>
</head>
<body>
<h1>Supprimer mon compte FoodGoodScan</h1>
<div class="warn">⚠️ <strong>Attention :</strong> La suppression est irréversible. Toutes vos données seront effacées définitivement.</div>

<h2>Données supprimées</h2>
<ul>
  <li>Adresse courriel et mot de passe</li>
  <li>Numéro de téléphone</li>
  <li>Historique de scans</li>
  <li>Liste d'épicerie</li>
  <li>Points et coupons</li>
  <li>Profil de santé et préférences</li>
</ul>

<h2>Comment supprimer votre compte</h2>
<div class="step"><div class="num">1</div><div>Envoyez un courriel à <strong>foodgoodscan.app@gmail.com</strong> avec le sujet <strong>"Suppression de compte"</strong>.</div></div>
<div class="step"><div class="num">2</div><div>Vous recevrez une confirmation dans les <strong>48 heures</strong>.</div></div>
<div class="step"><div class="num">3</div><div>Votre compte sera supprimé dans un délai maximum de <strong>30 jours</strong>.</div></div>
<a href="mailto:foodgoodscan.app@gmail.com?subject=Suppression%20de%20compte" class="btn">📧 Demander la suppression</a>

<h2>Contact</h2>
<p><a href="mailto:foodgoodscan.app@gmail.com">foodgoodscan.app@gmail.com</a></p>
</body>
</html>`);
});

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

app.listen(PORT, () => {
  console.log(`FoodGoodScan server running on port ${PORT}`);
});
