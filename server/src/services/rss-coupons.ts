export interface RealCoupon {
  id: string;
  title: string;
  store: string;
  code: string | null;
  discount: string;
  description: string;
  url: string;
  source: string;
  category: string;
  postedAt: string;
  imageEmoji: string;
}

// Cache en mémoire — 1h
let cache: { data: RealCoupon[]; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

const SOURCES = [
  {
    name: 'RedFlagDeals',
    url: 'https://forums.redflagdeals.com/hot-deals-f9/?rss',
    lang: 'en',
  },
  {
    name: 'Smartcanucks',
    url: 'https://www.smartcanucks.ca/feed/',
    lang: 'en',
  },
  {
    name: 'Reducteur',
    url: 'https://www.reducteur.com/feed/',
    lang: 'fr',
  },
];

function parseRSS(xml: string, sourceName: string): RealCoupon[] {
  const items: RealCoupon[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title     = stripTags(extractTag(block, 'title')).trim();
    const link      = extractTag(block, 'link').trim();
    const desc      = stripTags(extractTag(block, 'description') || extractTag(block, 'content:encoded')).trim();
    const pubDate   = extractTag(block, 'pubDate').trim();

    if (!title) continue;

    const full = `${title} ${desc}`;
    const code = extractCouponCode(full);
    const store = extractStore(title, desc);
    const discount = extractDiscount(full);
    const category = guessCategory(full);
    const emoji = categoryEmoji(category);

    items.push({
      id: Buffer.from(link || title).toString('base64').substring(0, 20),
      title: cleanTitle(title),
      store,
      code,
      discount,
      description: desc.substring(0, 200),
      url: link,
      source: sourceName,
      category,
      postedAt: pubDate,
      imageEmoji: emoji,
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(xml);
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractCouponCode(text: string): string | null {
  // Patterns explicites
  const explicit = [
    /(?:code|promo|coupon|promocode|rabais code)[:\s]+([A-Z0-9]{3,20})/i,
    /(?:use code|utilize|enter code|apply code)[:\s]+([A-Z0-9]{3,20})/i,
    /(?:utilisez le code|code de réduction|code promo)[:\s]+([A-Z0-9]{3,20})/i,
    /"([A-Z][A-Z0-9]{3,14})"/,
    /'([A-Z][A-Z0-9]{3,14})'/,
  ];
  for (const re of explicit) {
    const m = re.exec(text);
    if (m) return m[1].toUpperCase();
  }

  // Codes qui ressemblent à des codes promo (majuscules + chiffres, 4-15 chars)
  const general = /\b([A-Z]{2,}[0-9]{1,6}|[A-Z]{3,15}(?:OFF|SAVE|FREE|DEAL|PROMO|RABAIS|EXTRA))\b/g;
  const candidates: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = general.exec(text)) !== null) {
    const c = m[1];
    if (c.length >= 4 && c.length <= 15) candidates.push(c);
  }
  // Exclure mots courants non-codes
  const excluded = new Set(['FREE', 'DEAL', 'SAVE', 'SALE', 'CODE', 'PROMO', 'EXTRA', 'PLUS', 'ONLY', 'FROM', 'WITH', 'COUPON', 'CANADA', 'ONLINE', 'STORE']);
  const valid = candidates.filter(c => !excluded.has(c));
  return valid[0] || null;
}

function extractStore(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  const stores = [
    'Amazon', 'Walmart', 'Best Buy', 'Canadian Tire', 'Sport Expert',
    'Sportium', 'Reitmans', 'La Baie', 'Winners', 'HomeSense',
    'Indigo', 'Chapters', 'Costco', 'Dollarama', 'Tim Hortons',
    'McDonald\'s', 'Pizza Hut', 'Subway', 'Expedia', 'VRBO',
    'Booking.com', 'Air Canada', 'Air Transat', 'IGA', 'Maxi',
    'Metro', 'Pharmaprix', 'Jean Coutu', 'IKEA', 'Zara', 'H&M',
    'Nike', 'Adidas', 'Apple', 'Samsung', 'Dell', 'Microsoft',
    'Cineplex', 'EB Games', 'GameStop', 'Lego', 'Mattel', 'Fisher-Price',
  ];
  for (const s of stores) {
    if (text.includes(s.toLowerCase())) return s;
  }
  // Essaie d'extraire le premier mot en majuscule du titre
  const m = /^([A-Z][a-zA-Z&\-']+(?:\s[A-Z][a-zA-Z]+)?)/u.exec(title);
  return m ? m[1] : 'Partenaire';
}

function extractDiscount(text: string): string {
  const patterns = [
    /(\d+)\s*%\s*(?:de\s+)?(?:rabais|off|réduction|discount)/i,
    /(\d+)\s*%\s*(?:off|rabais)/i,
    /(?:save|économisez|économise)\s+\$?(\d+)/i,
    /\$(\d+(?:\.\d{2})?)\s+(?:off|de\s+rabais)/i,
    /(\d+)\s*%/,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) {
      if (text.includes('%')) return `${m[1]}% de rabais`;
      return `${m[1]}$ de rabais`;
    }
  }
  if (/free shipping|livraison gratuite/i.test(text)) return 'Livraison gratuite';
  if (/free|gratuit/i.test(text)) return 'Offre gratuite';
  return 'Rabais exclusif';
}

function guessCategory(text: string): string {
  const t = text.toLowerCase();
  if (/restaurant|pizza|burger|café|coffee|tim horton|subway|food|nourriture/i.test(t)) return 'restaurant';
  if (/voyage|travel|hotel|hôtel|flight|vol|airbnb|expedia|transat|booking/i.test(t)) return 'voyage';
  if (/épicerie|grocery|iga|maxi|metro|walmart food|provigo|loblaws/i.test(t)) return 'epicerie';
  if (/pharma|jean coutu|médicament|vitamin|santé|health|beauté|beauty/i.test(t)) return 'sante';
  if (/vêtement|fashion|clothing|zara|h&m|nike|reitmans|winners/i.test(t)) return 'mode';
  if (/tech|electronic|best buy|apple|samsung|ordinateur|laptop|phone/i.test(t)) return 'tech';
  if (/jeu|game|jouet|toy|lego|enfant|child/i.test(t)) return 'loisirs';
  return 'divers';
}

function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    restaurant: '🍽️', voyage: '✈️', epicerie: '🛒',
    sante: '💊', mode: '👗', tech: '💻', loisirs: '🎮', divers: '🏷️',
  };
  return map[cat] || '🎁';
}

function cleanTitle(title: string): string {
  return title.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim().substring(0, 100);
}

export async function getRealCoupons(): Promise<RealCoupon[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.data;

  const results: RealCoupon[] = [];

  await Promise.allSettled(
    SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FoodGoodScan/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml',
          },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return;
        const xml = await res.text();
        const items = parseRSS(xml, source.name);
        results.push(...items);
      } catch {}
    })
  );

  // Filtre les doublons par titre similaire
  const seen = new Set<string>();
  const deduped = results.filter(c => {
    const key = c.title.toLowerCase().substring(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Tri : coupons avec code en premier
  deduped.sort((a, b) => (b.code ? 1 : 0) - (a.code ? 1 : 0));

  cache = { data: deduped, fetchedAt: Date.now() };
  return deduped;
}
