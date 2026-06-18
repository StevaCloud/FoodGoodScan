export interface Product {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string;
  nutriScore: string;
  novaGroup: number;
  healthScore: number;
  pros: string[];
  cons: string[];
  premium: boolean;
  ingredients?: string;
  allergens?: string[];
  additives?: string[];
  nutrientLevels?: Record<string, string>;
  nutriments?: Record<string, number>;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: 'FREE' | 'PREMIUM';
  groceryAddon: boolean;
}

export interface Deal {
  id: string;
  store: string;
  productName: string;
  barcode: string | null;
  regularPrice: number;
  salePrice: number;
  discount: string;
  imageUrl: string | null;
  validFrom: string;
  validUntil: string;
}

export interface ScanHistoryItem {
  id: string;
  barcode: string;
  productName: string;
  healthScore: number;
  scannedAt: string;
}

export type HealthRating = 'excellent' | 'bon' | 'moyen' | 'mauvais' | 'terrible';
