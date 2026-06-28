"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const subscription_1 = require("../middleware/subscription");
const openfoodfacts_1 = require("../services/openfoodfacts");
const additives_1 = require("../services/additives");
const water_1 = require("../services/water");
const categories_1 = require("../services/categories");
const router = (0, express_1.Router)();
exports.productRouter = router;
const prisma = new client_1.PrismaClient();
const FREE_SCAN_LIMIT = 3;
const BARCODE_REGEX = /^\d{8,14}$/;
router.get('/scan/:barcode', auth_1.authenticateToken, async (req, res) => {
    try {
        const barcode = String(req.params.barcode);
        if (!BARCODE_REGEX.test(barcode)) {
            res.status(400).json({ error: 'Code-barres invalide (8 à 14 chiffres requis)' });
            return;
        }
        const userId = req.userId;
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
        const product = await (0, openfoodfacts_1.getProductByBarcode)(barcode);
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
        const additivesDetails = (0, additives_1.analyzeAdditives)(product.additives || []);
        const waterInfo = (0, water_1.getWaterInfo)(barcode) || ((0, water_1.isWaterProduct)(product.name) ? { detected: true, message: 'Eau détectée mais données pH non disponibles pour cette marque' } : null);
        const category = (0, categories_1.detectCategory)(product.name);
        res.json({ ...product, additivesDetails, waterInfo, category, premium: true });
    }
    catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ error: 'Erreur lors du scan' });
    }
});
router.get('/prices', auth_1.authenticateToken, subscription_1.requireGroceryAddon, async (req, res) => {
    try {
        const name = (req.query.name || '').trim();
        const postal = req.query.postal || 'J1H1A1';
        if (!name) {
            res.status(400).json({ error: 'name requis' });
            return;
        }
        const searchTerms = name.split(' ').slice(0, 3).join(' ');
        const url = `https://backflipp.wishabi.com/flipp/items/search?q=${encodeURIComponent(searchTerms)}&postal_code=${encodeURIComponent(postal)}&locale=fr`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        if (!response.ok) {
            res.json({ prices: [] });
            return;
        }
        const data = await response.json();
        const items = (data.items || [])
            .filter((i) => i.current_price && i.merchant_name)
            .slice(0, 8)
            .map((i) => ({
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
    }
    catch (err) {
        console.error('prices error:', err);
        res.json({ prices: [] });
    }
});
router.get('/search-name/:name', auth_1.authenticateToken, async (req, res) => {
    try {
        const name = String(req.params.name);
        const response = await fetch(`https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(name)}&json=1&page_size=1&fields=product_name,brands,ingredients_text,allergens_tags,additives_tags,nutriscore_grade,nova_group,nutriments,image_url`);
        const data = await response.json();
        const products = data.products || [];
        if (products.length === 0) {
            res.json({ found: false });
            return;
        }
        const p = products[0];
        const { analyzeAdditives } = await Promise.resolve().then(() => __importStar(require('../services/additives')));
        res.json({
            found: true,
            name: p.product_name || name,
            brand: p.brands || '',
            ingredients: p.ingredients_text || '',
            allergens: (p.allergens_tags || []).map((a) => a.replace('en:', '')),
            additives: (p.additives_tags || []).map((a) => a.replace('en:', '')),
            additivesDetails: analyzeAdditives(p.additives_tags || []),
            nutriScore: (p.nutriscore_grade || '?').toUpperCase(),
            novaGroup: p.nova_group || 0,
            nutriments: p.nutriments || {},
            imageUrl: p.image_url || '',
        });
    }
    catch (error) {
        res.json({ found: false });
    }
});
router.get('/history', auth_1.authenticateToken, subscription_1.requirePremium, async (req, res) => {
    const history = await prisma.scanHistory.findMany({
        where: { userId: req.userId },
        orderBy: { scannedAt: 'desc' },
        take: 50,
    });
    res.json(history);
});
router.post('/favorites/:barcode', auth_1.authenticateToken, subscription_1.requirePremium, async (req, res) => {
    const barcode = String(req.params.barcode);
    const product = await (0, openfoodfacts_1.getProductByBarcode)(barcode);
    if (!product) {
        res.status(404).json({ error: 'Produit non trouvé' });
        return;
    }
    const favorite = await prisma.favorite.upsert({
        where: { userId_barcode: { userId: req.userId, barcode } },
        create: { userId: req.userId, barcode, productName: product.name },
        update: {},
    });
    res.json(favorite);
});
router.delete('/favorites/:barcode', auth_1.authenticateToken, subscription_1.requirePremium, async (req, res) => {
    await prisma.favorite.deleteMany({
        where: { userId: req.userId, barcode: String(req.params.barcode) },
    });
    res.json({ ok: true });
});
router.get('/favorites', auth_1.authenticateToken, subscription_1.requirePremium, async (req, res) => {
    const favorites = await prisma.favorite.findMany({
        where: { userId: req.userId },
        orderBy: { addedAt: 'desc' },
    });
    res.json(favorites);
});
