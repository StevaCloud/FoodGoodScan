import { Router, Request, Response } from 'express';

const router = Router();

// Proxy Open Food Facts — évite CORS depuis le navigateur
router.get('/search', async (req: Request, res: Response) => {
  const name = (req.query.name as string || '').trim();
  if (!name) { res.status(400).json({ error: 'name requis' }); return; }

  const tryFetch = async (url: string) => {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'FoodGoodScan/1.0 (stevatrade91@gmail.com)' },
    });
    if (!r.ok) return null;
    return r.json();
  };

  try {
    // v2 API — plus fiable
    const v2 = await tryFetch(
      `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(name)}&page_size=3&fields=nutriments&json=1`
    );
    const products = v2?.products ?? [];

    // Cherche le premier produit avec des données nutritionnelles
    for (const p of products) {
      const nv = p?.nutriments;
      if (!nv) continue;

      const cal = nv['energy-kcal_100g'] ?? nv['energy-kcal'] ?? Math.round((nv['energy_100g'] ?? 0) / 4.184);
      const fat      = nv['fat_100g']      ?? nv['fat']      ?? 0;
      const sugars   = nv['sugars_100g']   ?? nv['sugars']   ?? 0;
      const proteins = nv['proteins_100g'] ?? nv['proteins'] ?? 0;
      const salt     = nv['salt_100g']     ?? nv['salt']     ?? 0;

      if (cal === 0 && fat === 0 && proteins === 0) continue;

      let score = 50;
      if (proteins > 10) score += 10;
      if (sugars   > 20) score -= 15;
      if (sugars   > 40) score -= 10;
      if (fat      > 20) score -= 10;
      if (salt     > 1.5) score -= 10;
      if (cal      > 400) score -= 5;
      if (cal      < 150) score += 5;
      score = Math.max(0, Math.min(100, score));

      res.json({
        calories:    Math.round(cal),
        fat:         Number(fat),
        sugars:      Number(sugars),
        proteins:    Number(proteins),
        salt:        Number(salt),
        healthScore: score,
      });
      return;
    }

    res.status(404).json({ error: 'Aucune donnée nutritionnelle trouvée' });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export { router as nutritionRouter };
