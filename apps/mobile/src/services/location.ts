import { Platform } from 'react-native';

export async function detectPostalCode(): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      return await detectPostalCodeWeb();
    }
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return 'J1H1A1';

    const location = await Location.getCurrentPositionAsync({});
    return await reverseGeocode(location.coords.latitude, location.coords.longitude);
  } catch {
    return 'J1H1A1';
  }
}

async function detectPostalCodeWeb(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve('J1H1A1'); return; }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const code = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        resolve(code);
      },
      () => resolve('J1H1A1'),
      { timeout: 10000 }
    );
  });
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'FoodCheck/1.0' } }
    );
    const data = await response.json();
    const postcode = data.address?.postcode || '';
    if (postcode) return postcode.replace(/\s/g, '').substring(0, 6);
    return 'J1H1A1';
  } catch {
    return 'J1H1A1';
  }
}
