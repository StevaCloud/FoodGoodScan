export interface FlippDeal {
  id: number;
  name: string;
  merchant: string;
  merchantLogo: string;
  price: number | null;
  priceText: string;
  imageUrl: string;
  validFrom: string;
  validUntil: string;
  category: string;
  saleStory: string;
}

export async function searchFlippDeals(query: string, postalCode: string = 'J1H1A1'): Promise<FlippDeal[]> {
  const url = `https://backflipp.wishabi.com/flipp/items/search?q=${encodeURIComponent(query)}&postal_code=${encodeURIComponent(postalCode)}&locale=fr`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });

  if (!response.ok) return [];

  const data = await response.json();
  const items = data.items || [];

  return items.map((item: any) => ({
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

export interface FlippFlyer {
  id: number;
  merchant: string;
  name: string;
  validFrom: string;
  validUntil: string;
  itemCount?: number;
}

const GROCERY_STORES = ['iga', 'metro', 'super c', 'maxi', 'walmart', 'provigo', 'adonis', 'marché richelieu', 'pharmaprix', 'jean coutu', 'loblaws', 'food basics', 'les aliments m&m', 'mayrand', 'club entrepôt', 'marché sheng tai', 'marché lian tai', 'vie en vert', 'supermarché aurès'];

export async function getGroceryFlyers(postalCode: string = 'J1H1A1'): Promise<FlippFlyer[]> {
  const url = `https://backflipp.wishabi.com/flipp/flyers?locale=fr&postal_code=${encodeURIComponent(postalCode)}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });

  if (!response.ok) return [];

  const data = await response.json();
  const flyers = Array.isArray(data) ? data : data.flyers || [];

  return flyers
    .filter((f: any) => {
      const name = (f.merchant_name || f.merchant || '').toLowerCase();
      return GROCERY_STORES.some(s => name.includes(s));
    })
    .map((f: any) => ({
      id: f.id,
      merchant: f.merchant_name || f.merchant || '',
      name: f.name || '',
      validFrom: f.valid_from || '',
      validUntil: f.valid_to || '',
    }));
}

export async function getFlyerItems(flyerId: number, postalCode: string = 'J1H1A1'): Promise<FlippDeal[]> {
  const url = `https://backflipp.wishabi.com/flipp/items/search?locale=fr&postal_code=${encodeURIComponent(postalCode)}&flyer_ids=${flyerId}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });

  if (!response.ok) return [];

  const data = await response.json();
  const items = data.items || [];

  return items.map((item: any) => ({
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
