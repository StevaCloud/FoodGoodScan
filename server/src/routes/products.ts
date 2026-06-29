import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requirePremium, requireGroceryAddon } from '../middleware/subscription';
import { getProductByBarcode } from '../services/openfoodfacts';
import { analyzeAdditives } from '../services/additives';
import { getWaterInfo, isWaterProduct, getPhRating } from '../services/water';
import { detectCategory } from '../services/categories';

const router = Router();

const FREE_SCAN_LIMIT = 3;

const BARCODE_REGEX = /^\d{8,14}$/;

router.get('/scan/:barcode', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const barcode = String(req.params.barcode);

    if (!BARCODE_REGEX.test(barcode)) {
      res.status(400).json({ error: 'Code-barres invalide (8 à 14 chiffres requis)' });
      return;
    }

    const userId = req.userId!;

    const sub = await prisma.subscription.findUnique({ where: { userId } });
    const isPremium = sub?.plan === 'PREMIUM';

    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scanCount = await prisma.scanHistory.count({
        where: { userId, scannedAt: { gte: today } },
      });
      if (scanCount >= FREE_SCAN_LIMIT) {
        res.status(403).json({
          error: `Limite de ${FREE_SCAN_LIMIT} scans/jour atteinte`,
          upgrade: true,
        });
        return;
      }
    }

    const product = await getProductByBarcode(barcode);
    if (!product) {
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }

    await prisma.scanHistory.create({
      data: {
        userId,
        barcode,
        productName: product.name,
        healthScore: product.healthScore,
      },
    });

    if (!isPremium) {
      res.json({
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        healthScore: product.healthScore,
        nutriScore: product.nutriScore,
        premium: false,
      });
      return;
    }

    const additivesDetails = analyzeAdditives(product.additives || []);
    const waterInfo = getWaterInfo(barcode) || (isWaterProduct(product.name) ? { detected: true, message: 'Eau détectée mais données pH non disponibles pour cette marque' } : null);
    const category = detectCategory(product.name);
    res.json({ ...product, additivesDetails, waterInfo, category, premium: true });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Erreur lors du scan' });
  }
});

router.get('/prices', authenticateToken, requireGroceryAddon, async (req: AuthRequest, res: Response) => {
  try {
    const name = (req.query.name as string || '').trim();
    const postal = (req.query.postal as string) || 'J1H1A1';
    if (!name) { res.status(400).json({ error: 'name requis' }); return; }

    const searchTerms = name.split(' ').slice(0, 3).join(' ');
    const url = `https://backflipp.wishabi.com/flipp/items/search?q=${encodeURIComponent(searchTerms)}&postal_code=${encodeURIComponent(postal)}&locale=fr`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!response.ok) { res.json({ prices: [] }); return; }

    const data = await response.json() as any;
    const items = (data.items || [])
      .filter((i: any) => i.current_price && i.merchant_name)
      .slice(0, 8)
      .map((i: any) => ({
        merchant: i.merchant_name || '',
        merchantLogo: i.merchant_logo || '',
        price: i.current_price,
        priceText: i.pre_price_text || '',
        name: i.name || '',
        saleStory: i.sale_story || '',
        validUntil: i.valid_to || '',
        imageUrl: i.clean_image_url || i.clipping_image_url || '',
      }));

    res.json({ prices: items });
  } catch (err) {
    console.error('prices error:', err);
    res.json({ prices: [] });
  }
});

router.get('/search-name/:name', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.params.name);
    const response = await fetch(
      `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(name)}&json=1&page_size=1&fields=product_name,brands,ingredients_text,allergens_tags,additives_tags,nutriscore_grade,nova_group,nutriments,image_url`
    );
    const data = await response.json() as any;
    const products = data.products || [];
    if (products.length === 0) {
      res.json({ found: false });
      return;
    }
    const p = products[0];
    const { analyzeAdditives } = await import('../services/additives');
    res.json({
      found: true,
      name: p.product_name || name,
      brand: p.brands || '',
      ingredients: p.ingredients_text || '',
      allergens: (p.allergens_tags || []).map((a: string) => a.replace('en:', '')),
      additives: (p.additives_tags || []).map((a: string) => a.replace('en:', '')),
      additivesDetails: analyzeAdditives(p.additives_tags || []),
      nutriScore: (p.nutriscore_grade || '?').toUpperCase(),
      novaGroup: p.nova_group || 0,
      nutriments: p.nutriments || {},
      imageUrl: p.image_url || '',
    });
  } catch (error) {
    res.json({ found: false });
  }
});

router.get('/history', authenticateToken, requirePremium, async (req: AuthRequest, res: Response) => {
  const history = await prisma.scanHistory.findMany({
    where: { userId: req.userId },
    orderBy: { scannedAt: 'desc' },
    take: 50,
  });
  res.json(history);
});

router.post('/favorites/:barcode', authenticateToken, requirePremium, async (req: AuthRequest, res: Response) => {
  const barcode = String(req.params.barcode);
  const product = await getProductByBarcode(barcode);

  if (!product) {
    res.status(404).json({ error: 'Produit non trouvé' });
    return;
  }

  const favorite = await prisma.favorite.upsert({
    where: { userId_barcode: { userId: req.userId!, barcode } },
    create: { userId: req.userId!, barcode, productName: product.name },
    update: {},
  });

  res.json(favorite);
});

router.delete('/favorites/:barcode', authenticateToken, requirePremium, async (req: AuthRequest, res: Response) => {
  await prisma.favorite.deleteMany({
    where: { userId: req.userId, barcode: String(req.params.barcode) },
  });
  res.json({ ok: true });
});

router.get('/favorites', authenticateToken, requirePremium, async (req: AuthRequest, res: Response) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.userId },
    orderBy: { addedAt: 'desc' },
  });
  res.json(favorites);
});

export { router as productRouter };
