import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

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

export async function register(email: string, password: string, name?: string, phone?: string) {
  const { data } = await api.post('/auth/register', { email, password, name, phone: phone || undefined });
  setAuthToken(data.token);
  return data;
}

export async function updatePhone(phone: string) {
  const { data } = await api.put('/auth/phone', { phone });
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

export async function createCheckoutSession(priceKey: 'premium' | 'premium_grocery') {
  const { data } = await api.post('/subscriptions/create-checkout-session', { priceKey });
  return data;
}

export async function createPortalSession() {
  const { data } = await api.post('/subscriptions/create-portal-session');
  return data;
}

export async function verifyCheckoutSession(sessionId: string) {
  const { data } = await api.post('/subscriptions/verify-session', { sessionId });
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // Token déjà invalide ou réseau offline — on déconnecte quand même localement
  }
}

export async function forgotPassword(email: string) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const { data } = await api.post('/auth/reset-password', { email, code, newPassword });
  return data;
}

export async function getProductPrices(name: string, postal: string) {
  const { data } = await api.get('/products/prices', { params: { name, postal } });
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

export async function getLocalDeals(postalCode: string) {
  const { data } = await api.get('/deals/local', { params: { postal_code: postalCode } });
  return data;
}

export async function getCoupons() {
  const { data } = await api.get('/coupons');
  return data;
}

export async function getRealCoupons() {
  const { data } = await api.get('/coupons/real');
  return data;
}

export async function getMyCoupons() {
  const { data } = await api.get('/coupons/my');
  return data;
}

export async function claimCoupon(couponId: string) {
  const { data } = await api.post(`/coupons/claim/${couponId}`);
  return data;
}

export async function useCoupon(userCouponId: string) {
  const { data } = await api.post(`/coupons/use/${userCouponId}`);
  return data;
}

export async function deleteAccount() {
  await api.delete('/auth/account');
}

export async function getEuropeanDeals(country: string) {
  const { data } = await api.get('/deals/eu', { params: { country } });
  return data;
}

export default api;
