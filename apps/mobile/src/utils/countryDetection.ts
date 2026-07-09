export type Country = 'CA' | 'US' | 'FR' | 'UK' | 'DE' | 'BE' | 'NL' | 'ES' | 'IT' | 'CH' | 'AT' | 'AU';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  symbolAfter: boolean;
}

const PREFIX_MAP: [string, Country][] = [
  ['+33', 'FR'], ['+44', 'UK'], ['+49', 'DE'], ['+32', 'BE'],
  ['+31', 'NL'], ['+34', 'ES'], ['+39', 'IT'], ['+41', 'CH'],
  ['+43', 'AT'], ['+61', 'AU'],
];

export const CURRENCY_MAP: Record<Country, CurrencyInfo> = {
  CA: { code: 'CAD', symbol: '$',   symbolAfter: false },
  US: { code: 'USD', symbol: '$',   symbolAfter: false },
  FR: { code: 'EUR', symbol: '€',   symbolAfter: true  },
  UK: { code: 'GBP', symbol: '£',   symbolAfter: false },
  DE: { code: 'EUR', symbol: '€',   symbolAfter: true  },
  BE: { code: 'EUR', symbol: '€',   symbolAfter: true  },
  NL: { code: 'EUR', symbol: '€',   symbolAfter: true  },
  ES: { code: 'EUR', symbol: '€',   symbolAfter: true  },
  IT: { code: 'EUR', symbol: '€',   symbolAfter: true  },
  AT: { code: 'EUR', symbol: '€',   symbolAfter: true  },
  CH: { code: 'CHF', symbol: 'CHF', symbolAfter: true  },
  AU: { code: 'AUD', symbol: 'A$',  symbolAfter: false },
};

export const EU_COUNTRIES: Country[] = ['FR', 'UK', 'DE', 'BE', 'NL', 'ES', 'IT', 'AT'];

const COUNTRY_FLAG: Record<Country, string> = {
  CA: '🇨🇦', US: '🇺🇸', FR: '🇫🇷', UK: '🇬🇧', DE: '🇩🇪',
  BE: '🇧🇪', NL: '🇳🇱', ES: '🇪🇸', IT: '🇮🇹', CH: '🇨🇭',
  AT: '🇦🇹', AU: '🇦🇺',
};

const COUNTRY_LABEL: Record<Country, string> = {
  CA: 'Canada', US: 'États-Unis', FR: 'France', UK: 'Royaume-Uni',
  DE: 'Allemagne', BE: 'Belgique', NL: 'Pays-Bas', ES: 'Espagne',
  IT: 'Italie', CH: 'Suisse', AT: 'Autriche', AU: 'Australie',
};

function isCanadianPostal(code: string): boolean {
  return /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(code.trim());
}

function isUSZip(code: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(code.trim());
}

export function detectCountry(phone: string | null | undefined, postalCode: string): Country {
  const postal = postalCode.trim().toUpperCase();

  if (isCanadianPostal(postal)) return 'CA';
  if (isUSZip(postal)) return 'US';

  if (!phone) return 'CA';

  const cleaned = phone.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('+1')) {
    return isUSZip(postal) ? 'US' : 'CA';
  }

  for (const [prefix, country] of PREFIX_MAP) {
    if (cleaned.startsWith(prefix)) return country;
  }

  return 'CA';
}

export function getCurrencyInfo(country: Country): CurrencyInfo {
  return CURRENCY_MAP[country] || CURRENCY_MAP.CA;
}

export function formatPrice(price: number, country: Country): string {
  const { symbol, symbolAfter } = getCurrencyInfo(country);
  const n = price.toFixed(2);
  if (symbolAfter) return `${n} ${symbol}`;
  return `${symbol}${n}`;
}

export function getCountryFlag(country: Country): string {
  return COUNTRY_FLAG[country] || '🌍';
}

export function getCountryLabel(country: Country): string {
  return COUNTRY_LABEL[country] || country;
}

export function isEuropean(country: Country): boolean {
  return EU_COUNTRIES.includes(country);
}

export function isUS(country: Country): boolean {
  return country === 'US';
}
