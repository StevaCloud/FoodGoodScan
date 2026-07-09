export interface EuropeanDeal {
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
}

// Lidl country domains
const LIDL_CONFIG: Record<string, { domain: string; lang: string }> = {
  FR: { domain: 'lidl.fr',     lang: 'fr' },
  DE: { domain: 'lidl.de',     lang: 'de' },
  BE: { domain: 'lidl.be',     lang: 'fr' },
  NL: { domain: 'lidl.nl',     lang: 'nl' },
  ES: { domain: 'lidl.es',     lang: 'es' },
  UK: { domain: 'lidl.co.uk',  lang: 'en' },
  IT: { domain: 'lidl.it',     lang: 'it' },
  AT: { domain: 'lidl.at',     lang: 'de' },
  CH: { domain: 'lidl.ch',     lang: 'fr' },
};

function normalizeOffer(offer: any, idx: number): EuropeanDeal | null {
  const name = offer.name || offer.title || offer.product_name || '';
  if (!name) return null;

  const price =
    offer.price?.value ??
    offer.currentPrice ??
    offer.price_value ??
    (typeof offer.price === 'number' ? offer.price : null);

  return {
    id: idx + 1,
    name,
    merchant: 'Lidl',
    merchantLogo: '',
    price: price != null ? Number(price) : null,
    priceText: offer.priceText || offer.price?.text || '',
    imageUrl: offer.image?.url || offer.imageUrl || offer.image_url || offer.thumbnail || '',
    validFrom:  offer.validFrom  || offer.startDate  || new Date().toISOString(),
    validUntil: offer.validUntil || offer.endDate    || new Date(Date.now() + 7 * 86400000).toISOString(),
    category: offer.category || '',
  };
}

export async function getEuropeanDeals(country: string): Promise<EuropeanDeal[]> {
  const cfg = LIDL_CONFIG[country.toUpperCase()];
  if (!cfg) return [];

  const endpoints = [
    `https://www.${cfg.domain}/q/api/v1/local-flyer/highlights/offers?lang=${cfg.lang}`,
    `https://www.${cfg.domain}/q/api/v2/dmu-ssp-service/highlights/offers?lang=${cfg.lang}&countryCode=${country}`,
    `https://www.${cfg.domain}/api/v1/offers?lang=${cfg.lang}`,
  ];

  for (const url of endpoints) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; FoodGoodScan/1.0)',
        },
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const data: any = await res.json();

      const items: any[] = Array.isArray(data?.offers)
        ? data.offers
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      const deals = items
        .map((o, i) => normalizeOffer(o, i))
        .filter((d): d is EuropeanDeal => d !== null)
        .slice(0, 60);

      if (deals.length > 0) return deals;
    } catch {
      // Try next endpoint
    }
  }

  return [];
}
