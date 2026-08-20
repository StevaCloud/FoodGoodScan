import { Router, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requirePremium, requireGroceryAddon } from '../middleware/subscription';
import { getProductByBarcode } from '../services/openfoodfacts';
import { analyzeAdditives } from '../services/additives';
import { getWaterInfo, getWaterInfoByName, isWaterProduct, getPhRating } from '../services/water';
import { detectCategory, getCategoryById } from '../services/categories';
import { addPoints, POINTS } from './coupons';

const router = Router();

const ocrLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Trop de scans OCR, attends une minute.' },
});

const saveNutritionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Trop de sauvegardes, attends une minute.' },
});

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
    const isExpired = sub?.expiresAt != null && sub.expiresAt < new Date();
    const isPremium = sub?.plan === 'PREMIUM' && !isExpired;

    const [product, confirmedCorrection, communityImage] = await Promise.all([
      getProductByBarcode(barcode),
      prisma.productCorrection.findFirst({
        where: { barcode, status: 'CONFIRMED' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.productImage.findUnique({ where: { barcode } }),
    ]);

    if (!product) {
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }

    // Utiliser l'image communautaire si le produit n'en a pas
    if (communityImage && !product.imageUrl) {
      (product as any).imageUrl = communityImage.imageUrl;
    }

    // Appliquer les valeurs nutritives corrigées si disponibles
    if (confirmedCorrection && product.nutriments) {
      const n = product.nutriments as any;
      if (confirmedCorrection.calories != null) n['energy-kcal_100g'] = confirmedCorrection.calories;
      if (confirmedCorrection.fat != null) n.fat_100g = confirmedCorrection.fat;
      if (confirmedCorrection.saturatedFat != null) n['saturated-fat_100g'] = confirmedCorrection.saturatedFat;
      if (confirmedCorrection.carbs != null) n.carbohydrates_100g = confirmedCorrection.carbs;
      if (confirmedCorrection.sugars != null) n.sugars_100g = confirmedCorrection.sugars;
      if (confirmedCorrection.fiber != null) n.fiber_100g = confirmedCorrection.fiber;
      if (confirmedCorrection.proteins != null) n.proteins_100g = confirmedCorrection.proteins;
      if (confirmedCorrection.salt != null) n.salt_100g = confirmedCorrection.salt;
    }

    // Vérifier si c'est un nouveau produit avant d'enregistrer le scan
    const alreadyScanned = await prisma.scanHistory.findFirst({
      where: { userId, barcode },
      select: { id: true },
    });

    await prisma.scanHistory.create({
      data: { userId, barcode, productName: product.name, healthScore: product.healthScore },
    });
    // Garder seulement les 5 derniers scans par utilisateur
    const scans = await prisma.scanHistory.findMany({
      where: { userId },
      orderBy: { scannedAt: 'desc' },
      skip: 5,
      select: { id: true },
    });
    if (scans.length > 0) {
      await prisma.scanHistory.deleteMany({ where: { id: { in: scans.map((s) => s.id) } } });
    }

    // Points uniquement si c'est la première fois que cet article est scanné
    if (!alreadyScanned) {
      await addPoints(userId, POINTS.scan);
    }

    if (!isPremium) {
      const category = (confirmedCorrection?.category ? getCategoryById(confirmedCorrection.category) : null) ?? detectCategory(product.name);
      res.json({
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        healthScore: product.healthScore,
        nutriScore: product.nutriScore,
        nutriments: product.nutriments,
        pros: product.pros,
        cons: product.cons,
        novaGroup: product.novaGroup,
        additives: product.additives,
        category,
        nutritionLabelUrl: confirmedCorrection?.nutritionLabelUrl ?? null,
        premium: false,
      });
      return;
    }

    const additivesDetails = analyzeAdditives(product.additives || []);

    let waterInfo = getWaterInfo(barcode) || getWaterInfoByName(product.name, product.brand);
    if (!waterInfo && isWaterProduct(product.name)) {
      const n = product.nutriments as any;
      const ph = n?.ph_100g ?? n?.ph ?? 0;
      const calcium = n?.calcium_100g ?? 0;
      const magnesium = n?.magnesium_100g ?? 0;
      const sodium = n?.sodium_100g ? Math.round(n.sodium_100g * 1000) : (n?.salt_100g ? Math.round(n.salt_100g * 400) : 0);
      const potassium = n?.potassium_100g ? Math.round(n.potassium_100g * 1000) : 0;
      const bicarbonate = n?.bicarbonate_100g ? Math.round(n.bicarbonate_100g * 1000) : 0;
      const tds = Math.round(calcium + magnesium + sodium + potassium + bicarbonate);
      waterInfo = {
        brand: product.brand || product.name,
        ph,
        phRating: ph > 0 ? getPhRating(ph).rating : 'Données non disponibles',
        tds,
        minerals: {
          ...(calcium > 0 ? { calcium } : {}),
          ...(magnesium > 0 ? { magnesium } : {}),
          ...(sodium > 0 ? { sodium } : {}),
          ...(potassium > 0 ? { potassium } : {}),
          ...(bicarbonate > 0 ? { bicarbonate } : {}),
        },
        source: 'OpenFoodFacts',
        verdict: ph > 0
          ? (ph >= 6.5 && ph <= 8.0 ? 'Bonne' : ph < 6.5 ? 'Attention (eau acide)' : 'Alcaline')
          : 'Données non disponibles pour cette marque',
        details: ph === 0 ? ['pH non renseigné pour ce produit sur OpenFoodFacts'] : [],
      };
    }

    const category = (confirmedCorrection?.category ? getCategoryById(confirmedCorrection.category) : null) ?? detectCategory(product.name);
    res.json({ ...product, additivesDetails, waterInfo, category, nutritionLabelUrl: confirmedCorrection?.nutritionLabelUrl ?? null, premium: true });
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

// POST /save-nutrition — sauvegarde directe des valeurs OCR, confirmées immédiatement
router.post('/save-nutrition', authenticateToken, saveNutritionLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { barcode, productName, calories, fat, saturatedFat, carbs, sugars, fiber, proteins, salt, cholesterol, iron, calcium, potassium, extraNutrients } = req.body;

    if (!barcode || !productName) {
      res.status(400).json({ error: 'barcode et productName requis' });
      return;
    }
    if (!BARCODE_REGEX.test(String(barcode))) {
      res.status(400).json({ error: 'Code-barres invalide' });
      return;
    }

    const userId = req.userId!;
    const data = {
      barcode: String(barcode),
      productName: String(productName),
      userId,
      status: 'CONFIRMED' as const,
      calories:     calories     ?? null,
      fat:          fat          ?? null,
      saturatedFat: saturatedFat ?? null,
      carbs:        carbs        ?? null,
      sugars:       sugars       ?? null,
      fiber:        fiber        ?? null,
      proteins:     proteins     ?? null,
      salt:         salt         ?? null,
      cholesterol:  cholesterol  ?? null,
      iron:         iron         ?? null,
      calcium:      calcium      ?? null,
      potassium:    potassium    ?? null,
      extraNutrients: extraNutrients ?? null,
      category:     null,
    };

    await prisma.productCorrection.upsert({
      where: { barcode_userId: { barcode: String(barcode), userId } },
      create: data,
      update: { ...data },
    });

    res.json({ saved: true });
  } catch (err) {
    console.error('save-nutrition error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/ocr', authenticateToken, ocrLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      res.status(400).json({ error: 'Image requise' });
      return;
    }

    const base64Match = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s);
    if (!base64Match) {
      res.status(400).json({ error: 'Format image invalide' });
      return;
    }

    const mimeType = base64Match[1] === 'jpg' ? 'image/jpeg' : `image/${base64Match[1]}`;
    const base64Data = base64Match[2];

    if (base64Data.length > 4_000_000) {
      res.status(413).json({ error: 'Image trop volumineuse (max 3 MB)' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'Service OCR non configuré' });
      return;
    }

    const prompt = `Analyse cette étiquette nutritionnelle et extrais les valeurs pour 100g ou 100ml. Si les valeurs sont par portion, convertis-les. Retourne UNIQUEMENT ce JSON (valeurs numériques, null si absent) :
{"calories":null,"fat":null,"saturatedFat":null,"carbs":null,"sugars":null,"fiber":null,"proteins":null,"salt":null}
Pour "salt" : utilise le sel en g directement, ou sodium en mg × 0.00254. Aucun texte avant ou après le JSON.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } },
          ] }],
          generationConfig: { maxOutputTokens: 256, temperature: 0.1 },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini OCR error:', await response.text());
      res.status(502).json({ error: 'Erreur du service OCR' });
      return;
    }

    const data = await response.json() as any;
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      res.status(422).json({ error: 'Aucune valeur nutritionnelle détectée dans l\'image' });
      return;
    }

    const values = JSON.parse(jsonMatch[0]);
    res.json(values);
  } catch (err) {
    console.error('OCR error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export { router as productRouter };
