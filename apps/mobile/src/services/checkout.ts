import { Platform, Alert } from 'react-native';
import { createCheckoutSession } from './api';

export async function openCheckout(priceKey: 'premium' | 'premium_grocery' = 'premium_grocery') {
  try {
    const { url } = await createCheckoutSession(priceKey);
    if (url) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_self');
      } else {
        const { Linking } = require('react-native');
        Linking.openURL(url);
      }
    }
  } catch (error: any) {
    Alert.alert('Erreur', error.response?.data?.error || 'Erreur de paiement');
  }
}
