import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

export const cosmeticsRouter = Router();

// GET /api/cosmetics/:barcode — cherche un produit cosmétique dans la base (pas d'auth requise)
cosmeticsRouter.get('/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await prisma.cosmeticProduct.findUnique({ where: { barcode } });
    if (!product) {
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cosmetics — sauvegarde un produit cosmétique analysé
cosmeticsRouter.post('/', authenticateToken, async (req, res) => {
  try {
    const { barcode, name, brand, ingredients, score, badIngredients, imageUrl, source } = req.body;
    if (!barcode || !ingredients || !score) {
      res.status(400).json({ error: 'barcode, ingredients et score sont requis' });
      return;
    }

    const product = await prisma.cosmeticProduct.upsert({
      where: { barcode },
      update: {
        name:          name || 'Produit cosmétique',
        brand:         brand || null,
        ingredients,
        score,
        badIngredients: badIngredients || [],
        imageUrl:      imageUrl || null,
        source:        source || 'user',
      },
      create: {
        barcode,
        name:          name || 'Produit cosmétique',
        brand:         brand || null,
        ingredients,
        score,
        badIngredients: badIngredients || [],
        imageUrl:      imageUrl || null,
        source:        source || 'user',
      },
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
