"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dealRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const subscription_1 = require("../middleware/subscription");
const flipp_1 = require("../services/flipp");
const router = (0, express_1.Router)();
exports.dealRouter = router;
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const search = req.query.search || '';
        const postalCode = req.query.postal_code || 'J1H1A1';
        const store = req.query.store || '';
        if (!search) {
            res.json([]);
            return;
        }
        let deals = await (0, flipp_1.searchFlippDeals)(search, postalCode);
        if (store) {
            deals = deals.filter(d => d.merchant.toLowerCase().includes(store.toLowerCase()));
        }
        res.json(deals);
    }
    catch (error) {
        console.error('Deals error:', error);
        res.status(500).json({ error: 'Erreur lors de la recherche de soldes' });
    }
});
router.get('/popular', auth_1.authenticateToken, subscription_1.requireGroceryAddon, async (req, res) => {
    try {
        const postalCode = req.query.postal_code || 'J1H1A1';
        const categories = ['lait', 'pain', 'poulet', 'fruits', 'légumes', 'fromage', 'yogourt', 'beurre'];
        const allDeals = [];
        for (const cat of categories) {
            const deals = await (0, flipp_1.searchFlippDeals)(cat, postalCode);
            allDeals.push(...deals.slice(0, 3));
        }
        res.json(allDeals);
    }
    catch (error) {
        console.error('Popular deals error:', error);
        res.status(500).json({ error: 'Erreur' });
    }
});
router.get('/flyers', auth_1.authenticateToken, subscription_1.requireGroceryAddon, async (req, res) => {
    try {
        const postalCode = req.query.postal_code || 'J1H1A1';
        const flyers = await (0, flipp_1.getGroceryFlyers)(postalCode);
        res.json(flyers);
    }
    catch (error) {
        console.error('Flyers error:', error);
        res.status(500).json({ error: 'Erreur' });
    }
});
router.get('/flyer/:id', auth_1.authenticateToken, subscription_1.requireGroceryAddon, async (req, res) => {
    try {
        const flyerId = parseInt(String(req.params.id), 10);
        if (!Number.isInteger(flyerId) || flyerId <= 0) {
            res.status(400).json({ error: 'ID de circulaire invalide' });
            return;
        }
        const postalCode = req.query.postal_code || 'J1H1A1';
        const items = await (0, flipp_1.getFlyerItems)(flyerId, postalCode);
        res.json(items);
    }
    catch (error) {
        console.error('Flyer items error:', error);
        res.status(500).json({ error: 'Erreur' });
    }
});
router.get('/featured', auth_1.authenticateToken, async (req, res) => {
    try {
        const postalCode = req.query.postal_code || 'J1H1A1';
        const searches = ['poulet', 'fromage', 'fruits', 'lait', 'pain', 'chips', 'yogourt', 'pizza'];
        const randomSearch = searches[Math.floor(Math.random() * searches.length)];
        const deals = await (0, flipp_1.searchFlippDeals)(randomSearch, postalCode);
        const withImages = deals.filter(d => d.imageUrl && d.price).slice(0, 10);
        res.json(withImages);
    }
    catch (error) {
        res.json([]);
    }
});
router.get('/stores', auth_1.authenticateToken, subscription_1.requireGroceryAddon, async (_req, res) => {
    res.json(['IGA', 'Metro', 'Super C', 'Maxi', 'Walmart', 'Provigo', 'Adonis', 'Marché Richelieu', 'Jean Coutu', 'Pharmaprix']);
});
