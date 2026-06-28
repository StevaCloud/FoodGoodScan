"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFlippDeals = searchFlippDeals;
exports.getGroceryFlyers = getGroceryFlyers;
exports.getFlyerItems = getFlyerItems;
async function searchFlippDeals(query, postalCode = 'J1H1A1') {
    const url = `https://backflipp.wishabi.com/flipp/items/search?q=${encodeURIComponent(query)}&postal_code=${encodeURIComponent(postalCode)}&locale=fr`;
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!response.ok)
        return [];
    const data = await response.json();
    const items = data.items || [];
    return items.map((item) => ({
        id: item.id || item.flyer_item_id,
        name: item.name || '',
        merchant: item.merchant_name || '',
        merchantLogo: item.merchant_logo || '',
        price: item.current_price || null,
        priceText: item.pre_price_text || '',
        imageUrl: item.clean_image_url || item.clipping_image_url || '',
        validFrom: item.valid_from || '',
        validUntil: item.valid_to || '',
        category: item._L2 || item._L1 || '',
        saleStory: item.sale_story || '',
    }));
}
const GROCERY_STORES = ['iga', 'metro', 'super c', 'maxi', 'walmart', 'provigo', 'adonis', 'marché richelieu', 'pharmaprix', 'jean coutu', 'loblaws', 'food basics', 'les aliments m&m', 'mayrand', 'club entrepôt', 'marché sheng tai', 'marché lian tai', 'vie en vert', 'supermarché aurès'];
async function getGroceryFlyers(postalCode = 'J1H1A1') {
    const url = `https://backflipp.wishabi.com/flipp/flyers?locale=fr&postal_code=${encodeURIComponent(postalCode)}`;
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!response.ok)
        return [];
    const data = await response.json();
    const flyers = Array.isArray(data) ? data : data.flyers || [];
    return flyers
        .filter((f) => {
        const name = (f.merchant_name || f.merchant || '').toLowerCase();
        return GROCERY_STORES.some(s => name.includes(s));
    })
        .map((f) => ({
        id: f.id,
        merchant: f.merchant_name || f.merchant || '',
        name: f.name || '',
        validFrom: f.valid_from || '',
        validUntil: f.valid_to || '',
    }));
}
async function getFlyerItems(flyerId, postalCode = 'J1H1A1') {
    const url = `https://backflipp.wishabi.com/flipp/items/search?locale=fr&postal_code=${encodeURIComponent(postalCode)}&flyer_ids=${flyerId}`;
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!response.ok)
        return [];
    const data = await response.json();
    const items = data.items || [];
    return items.map((item) => ({
        id: item.id || item.flyer_item_id,
        name: item.name || '',
        merchant: item.merchant_name || '',
        merchantLogo: item.merchant_logo || '',
        price: item.current_price || null,
        priceText: item.pre_price_text || '',
        imageUrl: item.clean_image_url || item.clipping_image_url || '',
        validFrom: item.valid_from || '',
        validUntil: item.valid_to || '',
        category: item._L2 || item._L1 || '',
        saleStory: item.sale_story || '',
    }));
}
