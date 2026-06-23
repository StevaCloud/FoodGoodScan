import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Language } from '../i18n/translations';

interface User {
  id: string;
  email: string;
  name: string | null;
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

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLastScannedProduct: (product: any) => void;
  logout: () => void;
  setWeatherData: (data: WeatherData | null) => void;
  addGroceryItem: (name: string, store: string, price: number | null, nutrition?: { calories: number; fat: number; sugars: number; proteins: number; salt: number; healthScore: number }, imageUrl?: string) => void;
  toggleGroceryItem: (id: string) => void;
  removeGroceryItem: (id: string) => void;
  clearGroceryList: () => void;
  setLanguage: (lang: Language) => void;
  setOnboarded: (v: boolean) => void;
  setHealthProfile: (profile: any) => void;
  setPostalCode: (code: string) => void;
  foodPreferences: string[];
  setFoodPreferences: (prefs: string[]) => void;

  quizBestScore: number;
  quizTotal: number;
  quizCorrect: number;
  updateQuizStats: (score: number, correct: number) => void;
}

const webStorage = createJSONStorage(() =>
  typeof window !== 'undefined' ? window.localStorage : ({} as Storage)
);

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
      quizBestScore: 0,
      quizTotal: 0,
      quizCorrect: 0,

      setUser: (user) => set({ user, isLoggedIn: !!user }),
      setToken: (token) => set({ token }),
      setLastScannedProduct: (product) => set({ lastScannedProduct: product }),
      logout: () => set({ user: null, token: null, isLoggedIn: false }),
      setWeatherData: (weatherData) => set({ weatherData }),

      addGroceryItem: (name, store, price, nutrition, imageUrl) => set((state) => ({
        groceryList: [...state.groceryList, {
          id: Date.now().toString(),
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
      setFoodPreferences: (prefs) => set({ foodPreferences: prefs }),

      updateQuizStats: (score, correct) => set((state) => ({
        quizBestScore: Math.max(state.quizBestScore, score),
        quizTotal: state.quizTotal + 1,
        quizCorrect: state.quizCorrect + correct,
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
      }),
    }
  )
);
