"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductByBarcode = getProductByBarcode;
function calculateHealthScore(product) {
    let score = 50;
    const nutriScore = product.nutriscore_grade?.toLowerCase();
    if (nutriScore === 'a')
        score += 30;
    else if (nutriScore === 'b')
        score += 15;
    else if (nutriScore === 'c')
        score += 0;
    else if (nutriScore === 'd')
        score -= 15;
    else if (nutriScore === 'e')
        score -= 30;
    const nova = product.nova_group;
    if (nova === 1)
        score += 15;
    else if (nova === 2)
        score += 5;
    else if (nova === 3)
        score -= 5;
    else if (nova === 4)
        score -= 15;
    const additiveCount = product.additives_tags?.length || 0;
    score -= Math.min(additiveCount * 3, 20);
    return Math.max(0, Math.min(100, score));
}
function analyzePros(product) {
    const pros = [];
    const n = product.nutriments || {};
    if (n.proteins_100g > 10)
        pros.push('Riche en protéines');
    if (n.fiber_100g > 5)
        pros.push('Riche en fibres');
    if (product.nutriscore_grade?.toLowerCase() === 'a')
        pros.push('Excellent Nutri-Score A');
    if (product.nutriscore_grade?.toLowerCase() === 'b')
        pros.push('Bon Nutri-Score B');
    if (product.nova_group === 1)
        pros.push('Non transformé');
    if ((product.additives_tags?.length || 0) === 0)
        pros.push('Sans additifs');
    if (n.salt_100g < 0.3)
        pros.push('Faible en sel');
    if (n.sugars_100g < 5)
        pros.push('Faible en sucres');
    if (n.fat_100g < 3)
        pros.push('Faible en gras');
    return pros;
}
function analyzeCons(product) {
    const cons = [];
    const n = product.nutriments || {};
    if (n.sugars_100g > 20)
        cons.push('Très riche en sucres');
    else if (n.sugars_100g > 12)
        cons.push('Riche en sucres');
    if (n.salt_100g > 1.5)
        cons.push('Très riche en sel');
    else if (n.salt_100g > 0.8)
        cons.push('Riche en sel');
    if (n['saturated-fat_100g'] > 5)
        cons.push('Riche en gras saturés');
    if (n.fat_100g > 20)
        cons.push('Très riche en gras');
    if (product.nova_group === 4)
        cons.push('Ultra-transformé (NOVA 4)');
    if (product.nutriscore_grade?.toLowerCase() === 'e')
        cons.push('Mauvais Nutri-Score E');
    if (product.nutriscore_grade?.toLowerCase() === 'd')
        cons.push('Nutri-Score D médiocre');
    const additiveCount = product.additives_tags?.length || 0;
    if (additiveCount > 5)
        cons.push(`${additiveCount} additifs`);
    return cons;
}
const additives_1 = require("./additives");
async function getProductByBarcode(barcode) {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    if (!response.ok)
        return null;
    const data = await response.json();
    if (data.status !== 1 || !data.product)
        return null;
    const p = data.product;
    return {
        barcode,
        name: p.product_name || 'Produit inconnu',
        brand: p.brands || '',
        imageUrl: p.image_url || '',
        nutriScore: p.nutriscore_grade?.toUpperCase() || '?',
        novaGroup: p.nova_group || 0,
        ingredients: p.ingredients_text || '',
        allergens: p.allergens_tags?.map((a) => a.replace('en:', '')) || [],
        additives: p.additives_tags?.map((a) => a.replace('en:', '')) || [],
        additivesDetails: (0, additives_1.analyzeAdditives)(p.additives_tags || p.additives_original_tags || []),
        nutrientLevels: p.nutrient_levels || {},
        nutriments: p.nutriments || {},
        healthScore: calculateHealthScore(p),
        pros: analyzePros(p),
        cons: analyzeCons(p),
    };
}
