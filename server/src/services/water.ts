export interface WaterInfo {
  brand: string;
  ph: number;
  phRating: string;
  tds: number;
  minerals: {
    calcium?: number;
    magnesium?: number;
    sodium?: number;
    potassium?: number;
    bicarbonate?: number;
    silica?: number;
    fluoride?: number;
  };
  source: string;
  verdict: string;
  details: string[];
}

const WATER_DB: Record<string, WaterInfo> = {
  '3068320055008': {
    brand: 'Evian',
    ph: 7.2,
    phRating: 'Neutre',
    tds: 309,
    minerals: { calcium: 80, magnesium: 26, sodium: 6.5, potassium: 1, bicarbonate: 360, silica: 15 },
    source: 'Alpes françaises, Évian-les-Bains',
    verdict: 'Excellente',
    details: ['Eau neutre idéale pour consommation quotidienne', 'Riche en calcium (os, dents)', 'Bon apport en magnésium', 'Très faible en sodium (bon pour hypertension)'],
  },
  '3274080005003': {
    brand: 'Volvic',
    ph: 7.0,
    phRating: 'Neutre',
    tds: 130,
    minerals: { calcium: 12, magnesium: 8, sodium: 12, potassium: 6, bicarbonate: 74, silica: 32 },
    source: 'Volcans d\'Auvergne, France',
    verdict: 'Très bonne',
    details: ['pH parfaitement neutre', 'Eau légère faible en minéraux', 'Riche en silice (peau, cheveux)', 'Idéale pour les nourrissons'],
  },
  '3179732340225': {
    brand: 'Vittel',
    ph: 7.5,
    phRating: 'Légèrement alcaline',
    tds: 405,
    minerals: { calcium: 94, magnesium: 20, sodium: 7.1, potassium: 1, bicarbonate: 258 },
    source: 'Vosges, France',
    verdict: 'Très bonne',
    details: ['Légèrement alcaline, bon pour l\'équilibre acido-basique', 'Très riche en calcium', 'Faible en sodium', 'Bonne pour la digestion'],
  },
  '3057640100178': {
    brand: 'Contrex',
    ph: 7.4,
    phRating: 'Légèrement alcaline',
    tds: 2125,
    minerals: { calcium: 468, magnesium: 74.5, sodium: 9.4, potassium: 2.8, bicarbonate: 403 },
    source: 'Contrexéville, Vosges, France',
    verdict: 'Bonne (usage modéré)',
    details: ['Extrêmement riche en calcium et magnésium', 'Bonne pour les os et muscles', 'TDS très élevé — pas pour consommation exclusive', 'Idéale en cure, pas au quotidien'],
  },
  '5449000000996': {
    brand: 'N/A',
    ph: 0,
    phRating: 'N/A',
    tds: 0,
    minerals: {},
    source: '',
    verdict: '',
    details: [],
  },
  '3124480186003': {
    brand: 'Hépar',
    ph: 7.2,
    phRating: 'Neutre',
    tds: 2580,
    minerals: { calcium: 549, magnesium: 119, sodium: 14.2, potassium: 4, bicarbonate: 384 },
    source: 'Vittel, Vosges, France',
    verdict: 'Bonne (usage ciblé)',
    details: ['La plus riche en magnésium', 'Excellente contre la constipation', 'TDS très élevé — usage en cure', 'Goût prononcé dû aux minéraux'],
  },
  '3274080005300': {
    brand: 'Perrier',
    ph: 5.5,
    phRating: 'Acide',
    tds: 475,
    minerals: { calcium: 155, magnesium: 6.8, sodium: 11.5, potassium: 0.7, bicarbonate: 430, fluoride: 0.12 },
    source: 'Vergèze, Gard, France',
    verdict: 'Correcte (modération)',
    details: ['pH acide — peut éroder l\'émail dentaire à long terme', 'L\'eau gazeuse est plus acide naturellement', 'Riche en calcium', 'À consommer avec modération, pas comme eau principale'],
  },
  '8002270014901': {
    brand: 'San Pellegrino',
    ph: 7.7,
    phRating: 'Légèrement alcaline',
    tds: 1109,
    minerals: { calcium: 174, magnesium: 51.4, sodium: 33.3, potassium: 2.2, bicarbonate: 243 },
    source: 'San Pellegrino Terme, Italie',
    verdict: 'Bonne',
    details: ['Légèrement alcaline, bon pour la digestion', 'Bonne teneur en calcium et magnésium', 'Sodium un peu élevé', 'Gazeuse — érosion dentaire possible en excès'],
  },
  '068274000034': {
    brand: 'Fiji',
    ph: 7.7,
    phRating: 'Légèrement alcaline',
    tds: 224,
    minerals: { calcium: 18, magnesium: 15, sodium: 18, potassium: 5, silica: 93 },
    source: 'Aquifère de Yaqara, Îles Fidji',
    verdict: 'Très bonne',
    details: ['pH alcalin doux', 'Exceptionnellement riche en silice (93mg)', 'La silice est bonne pour la peau et les cheveux', 'Eau douce et légère'],
  },
  '4104450018113': {
    brand: 'Gerolsteiner',
    ph: 6.5,
    phRating: 'Neutre',
    tds: 2527,
    minerals: { calcium: 348, magnesium: 108, sodium: 118, potassium: 10.8, bicarbonate: 1816 },
    source: 'Eifel volcanique, Allemagne',
    verdict: 'Bonne (usage modéré)',
    details: ['Très riche en minéraux', 'Excellent apport calcium + magnésium', 'Sodium élevé — attention hypertension', 'Usage en alternance avec eau légère'],
  },
  '0068274359552': {
    brand: 'Essentia',
    ph: 9.5,
    phRating: 'Très alcaline',
    tds: 70,
    minerals: { sodium: 13, potassium: 1.5, magnesium: 1, calcium: 1 },
    source: 'Eau purifiée ionisée, USA',
    verdict: 'Marketing > Science',
    details: ['pH 9.5 artificiellement élevé par ionisation', 'Aucune preuve scientifique des bienfaits de l\'eau alcaline', 'Très faible en minéraux essentiels', 'Le corps régule son pH naturellement'],
  },
  '7613036600026': {
    brand: 'Nestlé Pure Life',
    ph: 7.0,
    phRating: 'Neutre',
    tds: 180,
    minerals: { calcium: 36, magnesium: 6, sodium: 9 },
    source: 'Sources multiples, purifiée',
    verdict: 'Correcte',
    details: ['pH neutre', 'Minéraux moyens', 'Eau purifiée, pas de source naturelle', 'Correcte mais pas exceptionnelle'],
  },

  // === EAUX CANADIENNES (épiceries IGA, Metro, Walmart, Costco, Maxi) ===

  '0085239903025': {
    brand: 'Eska',
    ph: 7.8,
    phRating: 'Légèrement alcaline',
    tds: 98,
    minerals: { calcium: 20, magnesium: 4, sodium: 2.3, potassium: 0.5, bicarbonate: 74 },
    source: 'Esker de Saint-Mathieu-d\'Harricana, Abitibi, Québec',
    verdict: 'Excellente',
    details: ['Eau naturellement alcaline du Québec', 'Filtrée par un esker de 10 000 ans', 'Très faible en sodium', 'Légère et pure, idéale au quotidien', 'Disponible chez IGA, Metro, Walmart'],
  },
  '0067259501013': {
    brand: 'Naya',
    ph: 7.2,
    phRating: 'Neutre',
    tds: 145,
    minerals: { calcium: 31, magnesium: 7, sodium: 4, potassium: 1, bicarbonate: 115 },
    source: 'Mirabel, Québec',
    verdict: 'Très bonne',
    details: ['Eau de source québécoise populaire', 'pH neutre idéal', 'Bonne teneur en calcium', 'Très faible en sodium', 'Disponible partout au Québec'],
  },
  '0063762012013': {
    brand: 'Saint-Justin',
    ph: 7.5,
    phRating: 'Légèrement alcaline',
    tds: 220,
    minerals: { calcium: 42, magnesium: 12, sodium: 5, bicarbonate: 170 },
    source: 'Saint-Justin, Mauricie, Québec',
    verdict: 'Très bonne',
    details: ['Eau de source québécoise artisanale', 'Légèrement alcaline naturellement', 'Bonne minéralisation', 'Marque locale de qualité'],
  },
  '0068700100017': {
    brand: 'Kirkland Signature (Costco)',
    ph: 7.0,
    phRating: 'Neutre',
    tds: 30,
    minerals: { calcium: 3, magnesium: 1, sodium: 3 },
    source: 'Eau purifiée par osmose inverse',
    verdict: 'Correcte',
    details: ['Eau purifiée très abordable', 'pH neutre', 'Très peu de minéraux (eau vide)', 'Bonne pour hydratation de base', 'Manque de minéraux essentiels'],
  },
  '0068113168612': {
    brand: 'Selection / Compliments',
    ph: 7.0,
    phRating: 'Neutre',
    tds: 25,
    minerals: { calcium: 2, magnesium: 1, sodium: 2 },
    source: 'Eau purifiée, marque maison IGA/Metro',
    verdict: 'Passable',
    details: ['Eau purifiée marque maison', 'Très peu de minéraux', 'pH neutre', 'Option économique mais peu nutritive', 'Préférer une eau de source'],
  },
  '0006827140103': {
    brand: 'Montclair',
    ph: 7.1,
    phRating: 'Neutre',
    tds: 140,
    minerals: { calcium: 28, magnesium: 8, sodium: 3.5, bicarbonate: 105 },
    source: 'Sainte-Marie-de-Beauce, Québec',
    verdict: 'Bonne',
    details: ['Eau de source québécoise abordable', 'pH neutre', 'Minéralisation correcte', 'Bon rapport qualité-prix'],
  },
  '0005765400004': {
    brand: 'Ice Mountain',
    ph: 7.2,
    phRating: 'Neutre',
    tds: 200,
    minerals: { calcium: 38, magnesium: 11, sodium: 3, bicarbonate: 160 },
    source: 'Sources naturelles, Michigan, USA',
    verdict: 'Bonne',
    details: ['Eau de source naturelle', 'Bonne minéralisation', 'pH neutre', 'Disponible chez Walmart'],
  },

  // === EAUX AMÉRICAINES POPULAIRES ===

  '0081817301022': {
    brand: 'Dasani',
    ph: 5.6,
    phRating: 'Acide',
    tds: 30,
    minerals: { magnesium: 5, potassium: 5, sodium: 5 },
    source: 'Eau du robinet purifiée par Coca-Cola',
    verdict: 'Médiocre',
    details: ['pH acide — mauvais pour l\'émail dentaire', 'Eau du robinet purifiée, pas de source', 'Ajout de minéraux pour le goût', 'Contient du sulfate de magnésium (laxatif)', 'Une des pires eaux embouteillées'],
  },
  '0012000001086': {
    brand: 'Aquafina',
    ph: 5.8,
    phRating: 'Acide',
    tds: 4,
    minerals: { sodium: 0 },
    source: 'Eau du robinet purifiée par PepsiCo',
    verdict: 'Médiocre',
    details: ['pH acide', 'Eau du robinet purifiée par osmose inverse', 'Presque aucun minéral (TDS de 4!)', 'Eau "morte" — aucune valeur nutritive', 'Éviter comme eau principale'],
  },
  '0042494700215': {
    brand: 'Poland Spring',
    ph: 7.2,
    phRating: 'Neutre',
    tds: 55,
    minerals: { calcium: 8, magnesium: 2, sodium: 4, potassium: 1 },
    source: 'Sources du Maine, USA',
    verdict: 'Bonne',
    details: ['Eau de source naturelle', 'pH neutre', 'Légère en minéraux', 'Populaire aux USA'],
  },
  '0085396800014': {
    brand: 'Smartwater',
    ph: 7.0,
    phRating: 'Neutre',
    tds: 20,
    minerals: { calcium: 2, magnesium: 1, potassium: 1 },
    source: 'Eau purifiée par distillation vapeur, Coca-Cola',
    verdict: 'Marketing > Qualité',
    details: ['Eau distillée avec minéraux ajoutés', 'Très peu de minéraux malgré le nom "Smart"', 'pH neutre', 'Cher pour ce que c\'est', 'Le marketing vaut plus que l\'eau'],
  },
  '0085396800038': {
    brand: 'Glacéau Vitaminwater',
    ph: 3.4,
    phRating: 'Très acide',
    tds: 100,
    minerals: { sodium: 0 },
    source: 'Eau purifiée + sucre + vitamines, Coca-Cola',
    verdict: 'Mauvaise',
    details: ['C\'est PAS de l\'eau — c\'est un soda déguisé', 'pH 3.4 extrêmement acide (comme du vinaigre)', 'Contient autant de sucre qu\'un Coca', 'Les vitamines ajoutées ne compensent pas les dégâts', 'À ÉVITER'],
  },

  // === MARQUES INTERNATIONALES ===

  '5000112602050': {
    brand: 'Highland Spring',
    ph: 7.8,
    phRating: 'Légèrement alcaline',
    tds: 121,
    minerals: { calcium: 35, magnesium: 8.5, sodium: 6, potassium: 0.6, bicarbonate: 144 },
    source: 'Ochil Hills, Écosse',
    verdict: 'Très bonne',
    details: ['Eau de source écossaise de qualité', 'Légèrement alcaline', 'Bonne minéralisation', 'Faible en sodium'],
  },
  '5010067000012': {
    brand: 'Buxton',
    ph: 7.4,
    phRating: 'Légèrement alcaline',
    tds: 280,
    minerals: { calcium: 55, magnesium: 19, sodium: 24, bicarbonate: 248 },
    source: 'Buxton, Derbyshire, Angleterre',
    verdict: 'Bonne',
    details: ['Eau de source anglaise historique', 'Bonne teneur en calcium et magnésium', 'Sodium un peu élevé', 'Utilisée depuis l\'époque romaine'],
  },
  '8801518100019': {
    brand: 'Jeju Samdasoo',
    ph: 7.8,
    phRating: 'Légèrement alcaline',
    tds: 30,
    minerals: { calcium: 2.8, magnesium: 1.4, sodium: 5.2, potassium: 1.5, silica: 21 },
    source: 'Île de Jeju, Corée du Sud',
    verdict: 'Bonne',
    details: ['Filtrée par roche volcanique pendant 18 ans', 'Eau très pure et légère', 'Riche en silice', 'L\'eau la plus vendue en Corée du Sud'],
  },
  '4902102112840': {
    brand: 'Suntory Tennensui',
    ph: 7.0,
    phRating: 'Neutre',
    tds: 30,
    minerals: { calcium: 6.5, magnesium: 1.5, sodium: 4.5 },
    source: 'Alpes japonaises du Sud',
    verdict: 'Bonne',
    details: ['Eau de source japonaise très populaire', 'Ultra-pure et légère', 'pH parfaitement neutre', 'L\'eau #1 au Japon'],
  },
  '8410076470133': {
    brand: 'Font Vella',
    ph: 7.3,
    phRating: 'Neutre',
    tds: 260,
    minerals: { calcium: 47, magnesium: 10, sodium: 11, bicarbonate: 184 },
    source: 'Sant Hilari Sacalm, Catalogne, Espagne',
    verdict: 'Très bonne',
    details: ['Eau de source espagnole de qualité', 'pH neutre', 'Bonne minéralisation équilibrée', 'Très populaire en Espagne'],
  },
  '0075720004003': {
    brand: 'Crystal Geyser',
    ph: 7.0,
    phRating: 'Neutre',
    tds: 190,
    minerals: { calcium: 32, magnesium: 13, sodium: 10, potassium: 1, bicarbonate: 160 },
    source: 'Mt. Shasta, Californie, USA',
    verdict: 'Très bonne',
    details: ['Eau de source naturelle du Mont Shasta', 'pH neutre', 'Bonne minéralisation', 'Une des meilleures eaux abordables aux USA'],
  },
  '5060335630018': {
    brand: 'VOSS',
    ph: 6.0,
    phRating: 'Légèrement acide',
    tds: 44,
    minerals: { calcium: 6, magnesium: 1, sodium: 7 },
    source: 'Iveland, Norvège',
    verdict: 'Surcotée',
    details: ['Eau artésienne norvégienne', 'pH légèrement acide', 'Très peu de minéraux', 'Vous payez pour la bouteille design', 'Qualité correcte mais prix injustifié'],
  },
  '0078742216300': {
    brand: 'Great Value (Walmart)',
    ph: 6.8,
    phRating: 'Neutre',
    tds: 20,
    minerals: { calcium: 2, magnesium: 1, sodium: 2 },
    source: 'Eau purifiée, marque maison Walmart',
    verdict: 'Passable',
    details: ['Eau purifiée marque maison', 'pH quasi-neutre', 'Presque aucun minéral', 'Option la moins chère', 'Correcte pour hydratation basique'],
  },
  '0072560800120': {
    brand: 'Deer Park',
    ph: 7.5,
    phRating: 'Légèrement alcaline',
    tds: 140,
    minerals: { calcium: 22, magnesium: 7, sodium: 6, bicarbonate: 100 },
    source: 'Sources naturelles, Est des USA',
    verdict: 'Bonne',
    details: ['Eau de source naturelle', 'Légèrement alcaline', 'Minéralisation correcte', 'Disponible sur la côte Est'],
  },
  '0073999501053': {
    brand: 'Zephyrhills',
    ph: 7.7,
    phRating: 'Légèrement alcaline',
    tds: 180,
    minerals: { calcium: 52, magnesium: 6, sodium: 5, potassium: 0.5, bicarbonate: 140 },
    source: 'Crystal Springs, Floride, USA',
    verdict: 'Très bonne',
    details: ['Eau de source floridienne', 'Naturellement alcaline', 'Riche en calcium', 'Faible en sodium', 'Une des meilleures eaux régionales aux USA'],
  },
  '0082657300016': {
    brand: 'Waiakea',
    ph: 8.2,
    phRating: 'Alcaline',
    tds: 64,
    minerals: { calcium: 3, magnesium: 3.5, sodium: 14, potassium: 3.5, silica: 35 },
    source: 'Volcan Mauna Loa, Hawaii',
    verdict: 'Bonne',
    details: ['Filtrée par roche volcanique', 'Naturellement alcaline (pas ionisée)', 'Riche en silice', 'Marque éco-responsable', 'Qualité légitime contrairement aux eaux "alcalines" artificielles'],
  },
  '0628451266013': {
    brand: 'Flow',
    ph: 8.1,
    phRating: 'Alcaline',
    tds: 285,
    minerals: { calcium: 59, magnesium: 21, sodium: 4, potassium: 0.5, bicarbonate: 270 },
    source: 'Bruce Peninsula, Ontario, Canada',
    verdict: 'Très bonne',
    details: ['Eau de source canadienne naturellement alcaline', 'Excellente minéralisation', 'Riche en calcium et magnésium', 'Très faible en sodium', 'Emballage éco-responsable', 'Disponible chez IGA, Metro, Walmart'],
  },
  '0068274345012': {
    brand: 'Icelandic Glacial',
    ph: 8.4,
    phRating: 'Alcaline',
    tds: 62,
    minerals: { calcium: 5, magnesium: 1.3, sodium: 5.5, potassium: 0.3, silica: 15 },
    source: 'Source Ölfus, Islande',
    verdict: 'Bonne',
    details: ['Eau de source islandaise', 'Naturellement alcaline', 'Très pure (source protégée)', 'Faible en minéraux mais pure', 'Certifiée CarbonNeutral'],
  },
  '0069116544017': {
    brand: 'Liquid Death',
    ph: 8.2,
    phRating: 'Alcaline',
    tds: 230,
    minerals: { calcium: 47, magnesium: 19, sodium: 5, bicarbonate: 210 },
    source: 'Alpes autrichiennes',
    verdict: 'Très bonne',
    details: ['Marketing punk mais eau de qualité légitime', 'Eau de source autrichienne naturellement alcaline', 'Bonne minéralisation', 'Canette aluminium recyclable', 'Bien meilleure que la plupart des eaux en plastique'],
  },
};

export function getWaterInfo(barcode: string): WaterInfo | null {
  return WATER_DB[barcode] || null;
}

export function isWaterProduct(productName: string, categories?: string): boolean {
  const name = (productName || '').toLowerCase();
  const cats = (categories || '').toLowerCase();
  const waterTerms = ['eau', 'water', 'acqua', 'agua', 'mineral', 'spring'];
  return waterTerms.some(t => name.includes(t) || cats.includes(t));
}

export function getPhRating(ph: number): { rating: string; color: string; emoji: string } {
  if (ph < 5.5) return { rating: 'Très acide', color: '#ef4444', emoji: '🔴' };
  if (ph < 6.5) return { rating: 'Acide', color: '#f97316', emoji: '🟠' };
  if (ph < 7.3) return { rating: 'Neutre (idéal)', color: '#22c55e', emoji: '🟢' };
  if (ph < 8.0) return { rating: 'Légèrement alcaline', color: '#84cc16', emoji: '🟢' };
  if (ph < 9.0) return { rating: 'Alcaline', color: '#eab308', emoji: '🟡' };
  return { rating: 'Très alcaline', color: '#f97316', emoji: '🟠' };
}
