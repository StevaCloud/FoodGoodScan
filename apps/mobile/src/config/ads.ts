import { Platform } from 'react-native';

// ─── Remplace ces valeurs après avoir créé ton compte AppLovin MAX ───────────
// Dashboard: https://dash.applovin.com → MAX → Mediation → Manage Apps
// SDK Key : visible en haut de ton dashboard MAX

export const APPLOVIN_SDK_KEY = 'VOTRE_SDK_KEY_ICI'; // ex: "abc123XYZ..."

// Ad Unit IDs — crée-les dans MAX → Mediation → Manage → Ad Units
// Format Android : "xxxxxxxxxxxxxxxx"  Format iOS : "xxxxxxxxxxxxxxxx"
export const AD_UNIT_IDS = {
  banner: Platform.select({
    android: 'BANNER_ANDROID_UNIT_ID',
    ios:     'BANNER_IOS_UNIT_ID',
    default: '',
  }),
  interstitial: Platform.select({
    android: 'INTERSTITIAL_ANDROID_UNIT_ID',
    ios:     'INTERSTITIAL_IOS_UNIT_ID',
    default: '',
  }),
  rewarded: Platform.select({
    android: 'REWARDED_ANDROID_UNIT_ID',
    ios:     'REWARDED_IOS_UNIT_ID',
    default: '',
  }),
} as const;

// En mode test : AppLovin affiche de vraies pubs de test sans compte
export const ADS_TEST_MODE = true; // mettre false en production
