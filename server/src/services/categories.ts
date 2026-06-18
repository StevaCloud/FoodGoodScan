export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'water', name: 'Eaux', icon: 'W', keywords: ['eau', 'water', 'mineral', 'spring', 'sparkling', 'gazeuse', 'aqua'] },
  { id: 'soda', name: 'Boissons gazeuses', icon: 'S', keywords: ['cola', 'soda', 'pepsi', 'sprite', 'fanta', 'ginger ale', 'tonic', 'limonade', 'lemonade', 'carbonated', 'gazeuse', '7up', 'dr pepper', 'mountain dew', 'orangina'] },
  { id: 'juice', name: 'Jus & Smoothies', icon: 'J', keywords: ['jus', 'juice', 'smoothie', 'nectar', 'orange juice', 'apple juice', 'tropicana', 'oasis', 'minute maid'] },
  { id: 'energy', name: 'Boissons énergisantes', icon: 'E', keywords: ['energy', 'energisant', 'red bull', 'monster', 'rockstar', 'celsius', 'bang', 'gatorade', 'powerade', 'sport'] },
  { id: 'coffee_tea', name: 'Café & Thé', icon: 'C', keywords: ['coffee', 'café', 'tea', 'thé', 'espresso', 'latte', 'cappuccino', 'matcha', 'chai'] },
  { id: 'milk', name: 'Laits & Boissons végétales', icon: 'L', keywords: ['lait', 'milk', 'amande', 'almond', 'soja', 'soy', 'avoine', 'oat', 'coco', 'coconut', 'lactose'] },
  { id: 'dairy', name: 'Produits laitiers', icon: 'D', keywords: ['yogourt', 'yogurt', 'fromage', 'cheese', 'crème', 'cream', 'beurre', 'butter', 'kéfir', 'kefir', 'cottage'] },
  { id: 'bread', name: 'Pains & Boulangerie', icon: 'P', keywords: ['pain', 'bread', 'baguette', 'croissant', 'muffin', 'brioche', 'tortilla', 'pita', 'wrap', 'bagel'] },
  { id: 'cereal', name: 'Céréales & Granola', icon: 'G', keywords: ['céréale', 'cereal', 'granola', 'muesli', 'avoine', 'oat', 'cheerios', 'corn flakes', 'flocons'] },
  { id: 'pasta', name: 'Pâtes & Riz', icon: 'R', keywords: ['pâte', 'pasta', 'spaghetti', 'penne', 'fusilli', 'riz', 'rice', 'noodle', 'ramen', 'nouille', 'couscous', 'quinoa'] },
  { id: 'chips', name: 'Chips & Snacks salés', icon: 'K', keywords: ['chips', 'crisp', 'nachos', 'pretzel', 'craquelin', 'cracker', 'popcorn', 'noix', 'nuts', 'amandes', 'cashew', 'trail mix'] },
  { id: 'chocolate', name: 'Chocolat & Confiserie', icon: 'H', keywords: ['chocolat', 'chocolate', 'bonbon', 'candy', 'caramel', 'gummy', 'réglisse', 'licorice', 'nutella', 'spread', 'tartiner'] },
  { id: 'cookies', name: 'Biscuits & Gâteaux', icon: 'B', keywords: ['biscuit', 'cookie', 'gâteau', 'cake', 'brownie', 'tarte', 'pie', 'oreo', 'barquette'] },
  { id: 'icecream', name: 'Crèmes glacées', icon: 'I', keywords: ['glace', 'ice cream', 'gelato', 'sorbet', 'frozen', 'popsicle', 'magnum', 'häagen'] },
  { id: 'meat', name: 'Viandes & Charcuteries', icon: 'V', keywords: ['viande', 'meat', 'poulet', 'chicken', 'boeuf', 'beef', 'porc', 'pork', 'jambon', 'ham', 'saucisse', 'sausage', 'bacon', 'dinde', 'turkey', 'salami', 'pepperoni'] },
  { id: 'fish', name: 'Poissons & Fruits de mer', icon: 'F', keywords: ['poisson', 'fish', 'saumon', 'salmon', 'thon', 'tuna', 'crevette', 'shrimp', 'sardine', 'morue', 'cod', 'fruits de mer', 'seafood'] },
  { id: 'frozen', name: 'Surgelés & Plats préparés', icon: 'Z', keywords: ['surgelé', 'frozen', 'pizza', 'lasagne', 'plat préparé', 'ready meal', 'micro-onde', 'microwave', 'tv dinner', 'poulet pané'] },
  { id: 'sauce', name: 'Sauces & Condiments', icon: 'A', keywords: ['sauce', 'ketchup', 'moutarde', 'mustard', 'mayonnaise', 'mayo', 'vinaigrette', 'soja', 'soy sauce', 'bbq', 'hot sauce', 'sriracha', 'salsa', 'relish'] },
  { id: 'canned', name: 'Conserves', icon: 'N', keywords: ['conserve', 'canned', 'tomate', 'tomato', 'haricot', 'bean', 'soupe', 'soup', 'maïs', 'corn', 'pois', 'peas'] },
  { id: 'baby', name: 'Bébé & Enfants', icon: 'T', keywords: ['bébé', 'baby', 'infant', 'enfant', 'kids', 'compote', 'purée', 'lait maternisé', 'formula'] },
  { id: 'organic', name: 'Bio & Santé', icon: 'O', keywords: ['bio', 'organic', 'vegan', 'végétal', 'plant-based', 'sans gluten', 'gluten free', 'protéine', 'protein bar'] },
];

export function detectCategory(productName: string, categories?: string): CategoryInfo {
  const text = `${productName} ${categories || ''}`.toLowerCase();

  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => text.includes(kw))) {
      return cat;
    }
  }

  return { id: 'other', name: 'Autre', icon: '?', keywords: [] };
}
