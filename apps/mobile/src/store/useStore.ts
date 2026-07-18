import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../i18n/translations';

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  plan: 'FREE' | 'PREMIUM';
  groceryAddon: boolean;
  trialEndsAt: string | null;
}

export interface GroceryItem {
  id: string;
  name: string;
  store: string;
  price: number | null;
  imageUrl: string;
  checked: boolean;
  addedAt: string;
  calories: number;
  fat: number;
  sugars: number;
  proteins: number;
  salt: number;
  healthScore: number;
}

interface WeatherData {
  temperature: number;
  weatherCode: number;
  icon: string;
  description: string;
  city: string;
}

export interface Pet {
  type: 'dog' | 'cat';
  name: string;
  color: string;
  hunger: number;
  thirst: number;
  lastFed: string;
  lastWatered: string;
  lastUpdated: string;
  coins: number;
  xp: number;
  stage: 'baby' | 'child' | 'teen' | 'adult';
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
  weatherData: WeatherData | null;
  pet: Pet | null;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLastScannedProduct: (product: any) => void;
  logout: () => void;
  setWeatherData: (data: WeatherData | null) => void;
  addGroceryItem: (name: string, store: string, price: number | null, nutrition?: { calories: number; fat: number; sugars: number; proteins: number; salt: number; healthScore: number }, imageUrl?: string) => string;
  updateGroceryItemNutrition: (id: string, nutrition: { calories: number; fat: number; sugars: number; proteins: number; salt: number; healthScore: number }) => void;
  toggleGroceryItem: (id: string) => void;
  removeGroceryItem: (id: string) => void;
  clearGroceryList: () => void;
  setLanguage: (lang: Language) => void;
  setOnboarded: (v: boolean) => void;
  setHealthProfile: (profile: any) => void;
  setPostalCode: (code: string) => void;
  foodPreferences: string[];
  setFoodPreferences: (prefs: string[]) => void;

  dailyCalorieGoal: number;
  setDailyCalorieGoal: (goal: number) => void;

  quizBestScore: number;
  quizTotal: number;
  quizCorrect: number;
  lastQuizAt: number | null;
  updateQuizStats: (score: number, correct: number) => void;

  savedDeals: any[];
  saveDeal: (deal: any) => void;
  removeSavedDeal: (id: string) => void;

  setPet: (pet: Pet) => void;
  feedPet: () => void;
  waterPet: () => void;
  earnCoins: (n: number) => void;
  earnXP: (n: number) => void;
  tickPet: () => void;
}

// Stockage universel : localStorage sur web, AsyncStorage sur mobile avec fallback mémoire
const memCache = new Map<string, string>();
const safeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? window.localStorage.getItem(name) : null;
      }
      return await AsyncStorage.getItem(name);
    } catch {
      return memCache.get(name) ?? null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    memCache.set(name, value);
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.localStorage.setItem(name, value);
        return;
      }
      await AsyncStorage.setItem(name, value);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    memCache.delete(name);
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.localStorage.removeItem(name);
        return;
      }
      await AsyncStorage.removeItem(name);
    } catch {}
  },
};
const webStorage = createJSONStorage(() => safeStorage);

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      lastScannedProduct: null,
      groceryList: [],
      language: 'fr' as Language,
      onboarded: false,
      healthProfile: null,
      postalCode: '',
      foodPreferences: [],
      weatherData: null,
      dailyCalorieGoal: 2000,
      quizBestScore: 0,
      quizTotal: 0,
      quizCorrect: 0,
      lastQuizAt: null,
      savedDeals: [],

      setUser: (user) => set({ user, isLoggedIn: !!user }),
      setToken: (token) => set({ token }),
      setLastScannedProduct: (product) => set({ lastScannedProduct: product }),
      logout: () => set({ user: null, token: null, isLoggedIn: false, onboarded: false, healthProfile: null, foodPreferences: [] }),
      setWeatherData: (weatherData) => set({ weatherData }),

      addGroceryItem: (name, store, price, nutrition, imageUrl) => {
        const id = Date.now().toString();
        set((state) => ({
          groceryList: [...state.groceryList, {
            id,
            name,
            store,
            price,
            imageUrl: imageUrl || '',
            checked: false,
            addedAt: new Date().toISOString(),
            calories: nutrition?.calories || 0,
            fat: nutrition?.fat || 0,
            sugars: nutrition?.sugars || 0,
            proteins: nutrition?.proteins || 0,
            salt: nutrition?.salt || 0,
            healthScore: nutrition?.healthScore || 0,
          }],
        }));
        return id;
      },

      updateGroceryItemNutrition: (id, nutrition) => set((state) => ({
        groceryList: state.groceryList.map((item) =>
          item.id === id ? { ...item, ...nutrition } : item
        ),
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
      setDailyCalorieGoal: (goal) => set({ dailyCalorieGoal: goal }),
      setLanguage: (lang) => set({ language: lang }),
      setOnboarded: (v) => set({ onboarded: v }),
      setHealthProfile: (profile) => set({ healthProfile: profile }),
      setPostalCode: (code) => set({ postalCode: code }),
      setFoodPreferences: (prefs) => set({ foodPreferences: prefs }),

      updateQuizStats: (score, correct) => set((state) => ({
        quizBestScore: Math.max(state.quizBestScore, score),
        quizTotal: state.quizTotal + 1,
        quizCorrect: state.quizCorrect + correct,
        lastQuizAt: Date.now(),
      })),

      saveDeal: (deal) => set((state) => {
        const exists = state.savedDeals.some((d) => d.id === deal.id);
        if (exists) return {};
        return { savedDeals: [deal, ...state.savedDeals] };
      }),
      removeSavedDeal: (id) => set((state) => ({
        savedDeals: state.savedDeals.filter((d) => d.id !== id),
      })),

    }),
    {
      name: 'foodcheck-storage',
      storage: webStorage,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        language: state.language,
        onboarded: state.onboarded,
        healthProfile: state.healthProfile,
        postalCode: state.postalCode,
        foodPreferences: state.foodPreferences,
        groceryList: state.groceryList,
        quizBestScore: state.quizBestScore,
        quizTotal: state.quizTotal,
        quizCorrect: state.quizCorrect,
        savedDeals: state.savedDeals,
      }),
    }
  )
);
