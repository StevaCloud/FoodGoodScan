import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.25:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  setAuthToken(data.token);
  return data;
}

export async function register(email: string, password: string, name?: string) {
  const { data } = await api.post('/auth/register', { email, password, name });
  setAuthToken(data.token);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function scanProduct(barcode: string) {
  const { data } = await api.get(`/products/scan/${barcode}`);
  return data;
}

export async function getScanHistory() {
  const { data } = await api.get('/products/history');
  return data;
}

export async function getFavorites() {
  const { data } = await api.get('/products/favorites');
  return data;
}

export async function addFavorite(barcode: string) {
  const { data } = await api.post(`/products/favorites/${barcode}`);
  return data;
}

export async function removeFavorite(barcode: string) {
  const { data } = await api.delete(`/products/favorites/${barcode}`);
  return data;
}

export async function getSubscriptionStatus() {
  const { data } = await api.get('/subscriptions/status');
  return data;
}

export async function upgradeSubscription(plan: string, groceryAddon: boolean) {
  const { data } = await api.post('/subscriptions/upgrade', { plan, groceryAddon });
  return data;
}

export async function getDeals(store?: string, search?: string) {
  const params: any = {};
  if (store) params.store = store;
  if (search) params.search = search;
  const { data } = await api.get('/deals', { params });
  return data;
}

export async function getDealStores() {
  const { data } = await api.get('/deals/stores');
  return data;
}

export default api;
