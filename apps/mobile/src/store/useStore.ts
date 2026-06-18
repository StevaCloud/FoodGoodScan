import { create } from 'zustand';
import { Language } from '../i18n/translations';

interface User {
  id: string;
  email: string;
  name: string | null;
  plan: 'FREE' | 'PREMIUM';
  groceryAddon: boolean;
}

export interface GroceryItem {
  id: string;
  name: string;
  store: string;
  price: number | null;
  checked: boolean;
  addedAt: string;
  calories: number;
  fat: number;
  sugars: number;
  proteins: number;
  salt: number;
  healthScore: number;
}

interface AppState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  lastScannedProduct: any | null;
  groceryList: GroceryItem[];
  language: Language;
  onboarded: boolean;
  healthProfile: any | null;
  postalCode: string;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLastScannedProduct: (product: any) => void;
  logout: () => void;
  addGroceryItem: (name: string, store: string, price: number | null, nutrition?: { calories: number; fat: number; sugars: number; proteins: number; salt: number; healthScore: number }) => void;
  toggleGroceryItem: (id: string) => void;
  removeGroceryItem: (id: string) => void;
  clearGroceryList: () => void;
  setLanguage: (lang: Language) => void;
  setOnboarded: (v: boolean) => void;
  setHealthProfile: (profile: any) => void;
  setPostalCode: (code: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  lastScannedProduct: null,
  groceryList: [],
  language: 'fr' as Language,
  onboarded: false,
  healthProfile: null,
  postalCode: '',

  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setToken: (token) => set({ token }),
  setLastScannedProduct: (product) => set({ lastScannedProduct: product }),
  logout: () => set({ user: null, token: null, isLoggedIn: false }),

  addGroceryItem: (name, store, price, nutrition) => set((state) => ({
    groceryList: [...state.groceryList, {
      id: Date.now().toString(),
      name,
      store,
      price,
      checked: false,
      addedAt: new Date().toISOString(),
      calories: nutrition?.calories || 0,
      fat: nutrition?.fat || 0,
      sugars: nutrition?.sugars || 0,
      proteins: nutrition?.proteins || 0,
      salt: nutrition?.salt || 0,
      healthScore: nutrition?.healthScore || 0,
    }],
  })),

  toggleGroceryItem: (id) => set((state) => ({
    groceryList: state.groceryList.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ),
  })),

  removeGroceryItem: (id) => set((state) => ({
    groceryList: state.groceryList.filter((item) => item.id !== id),
  })),

  clearGroceryList: () => set({ groceryList: [] }),
  setLanguage: (lang) => set({ language: lang }),
  setOnboarded: (v) => set({ onboarded: v }),
  setHealthProfile: (profile) => set({ healthProfile: profile }),
  setPostalCode: (code) => set({ postalCode: code }),
}));
