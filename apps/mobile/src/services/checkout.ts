import { Platform, Alert } from 'react-native';
import { createCheckoutSession } from './api';

let _navigate: ((screen: string) => void) | null = null;

export function setCheckoutNavigator(nav: (screen: string) => void) {
  _navigate = nav;
}

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
    const errCode = error.response?.data?.error;
    const errMsg = error.response?.data?.message;

    if (errCode === 'PHONE_REQUIRED') {
      Alert.alert(
        '📱 Numéro requis',
        'Un numéro de téléphone est requis pour s\'abonner. Ajoute-le dans ton profil.',
        [
          { text: 'Plus tard', style: 'cancel' },
          {
            text: 'Aller au profil',
            onPress: () => _navigate?.('Profile'),
          },
        ]
      );
      return;
    }

    Alert.alert('Erreur', errMsg || errCode || 'Erreur de paiement');
  }
}
