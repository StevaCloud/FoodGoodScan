import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireGroceryAddon } from '../middleware/subscription';
import { searchFlippDeals, getGroceryFlyers, getFlyerItems } from '../services/flipp';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const postalCode = (req.query.postal_code as string) || 'J1H1A1';
    const store = (req.query.store as string) || '';

    if (!search) {
      res.json([]);
      return;
    }

    let deals = await searchFlippDeals(search, postalCode);

    if (store) {
      deals = deals.filter(d => d.merchant.toLowerCase().includes(store.toLowerCase()));
    }

    res.json(deals);
  } catch (error) {
    console.error('Deals error:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de soldes' });
  }
});

router.get('/popular', authenticateToken, requireGroceryAddon, async (req: AuthRequest, res: Response) => {
  try {
    const postalCode = (req.query.postal_code as string) || 'J1H1A1';

    const categories = ['lait', 'pain', 'poulet', 'fruits', 'légumes', 'fromage', 'yogourt', 'beurre'];
    const allDeals = [];

    for (const cat of categories) {
      const deals = await searchFlippDeals(cat, postalCode);
      allDeals.push(...deals.slice(0, 3));
    }

    res.json(allDeals);
  } catch (error) {
    console.error('Popular deals error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/flyers', authenticateToken, requireGroceryAddon, async (req: AuthRequest, res: Response) => {
  try {
    const postalCode = (req.query.postal_code as string) || 'J1H1A1';
    const flyers = await getGroceryFlyers(postalCode);
    res.json(flyers);
  } catch (error) {
    console.error('Flyers error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/flyer/:id', authenticateToken, requireGroceryAddon, async (req: AuthRequest, res: Response) => {
  try {
    const flyerId = parseInt(String(req.params.id), 10);
    if (!Number.isInteger(flyerId) || flyerId <= 0) {
      res.status(400).json({ error: 'ID de circulaire invalide' });
      return;
    }
    const postalCode = (req.query.postal_code as string) || 'J1H1A1';
    const items = await getFlyerItems(flyerId, postalCode);
    res.json(items);
  } catch (error) {
    console.error('Flyer items error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/featured', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const postalCode = (req.query.postal_code as string) || 'J1H1A1';
    const searches = ['poulet', 'fromage', 'fruits', 'lait', 'pain', 'chips', 'yogourt', 'pizza'];
    const randomSearch = searches[Math.floor(Math.random() * searches.length)];
    const deals = await searchFlippDeals(randomSearch, postalCode);
    const withImages = deals.filter(d => d.imageUrl && d.price).slice(0, 10);
    res.json(withImages);
  } catch (error) {
    res.json([]);
  }
});

router.get('/stores', authenticateToken, requireGroceryAddon, async (_req: AuthRequest, res: Response) => {
  res.json(['IGA', 'Metro', 'Super C', 'Maxi', 'Walmart', 'Provigo', 'Adonis', 'Marché Richelieu', 'Jean Coutu', 'Pharmaprix']);
});

// Offres locales géolocalisées — accessible à tous (free + premium)
router.get('/local', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const postalCode = (req.query.postal_code as string) || 'J1H1A1';
    const categories = [
      { query: 'poulet', label: 'Viande & Poisson' },
      { query: 'fruits légumes', label: 'Fruits & Légumes' },
      { query: 'fromage lait', label: 'Produits laitiers' },
      { query: 'pain céréales', label: 'Boulangerie' },
      { query: 'jus boisson', label: 'Boissons' },
      { query: 'shampooing savon', label: 'Beauté & Santé' },
      { query: 'vitamines médicament', label: 'Pharmacie' },
      { query: 'chips biscuit', label: 'Collations' },
    ];

    const results = await Promise.all(
      categories.map(async (cat) => {
        const deals = await searchFlippDeals(cat.query, postalCode);
        const valid = deals.filter(d => d.imageUrl && d.price && d.merchant).slice(0, 4);
        return valid.map(d => ({ ...d, categoryLabel: cat.label }));
      })
    );

    const allDeals = results.flat().filter(d => d.imageUrl && d.price);
    // Mélange pour varier
    allDeals.sort(() => Math.random() - 0.5);

    res.json(allDeals.slice(0, 40));
  } catch (error) {
    console.error('Local deals error:', error);
    res.json([]);
  }
});

export { router as dealRouter };
