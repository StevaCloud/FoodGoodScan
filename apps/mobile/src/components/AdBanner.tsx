import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { openCheckout } from '../services/checkout';
import { AD_UNIT_IDS, ADS_TEST_MODE } from '../config/ads';

// AppLovin MAX — natif seulement (iOS/Android)
let AppLovinMAX: any = null;
let AdView: any = null;
if (Platform.OS !== 'web') {
  try {
    const sdk = require('react-native-applovin-max');
    AppLovinMAX = sdk.default || sdk.AppLovinMAX;
    AdView = sdk.AdView || sdk.BannerAd;
  } catch {}
}

export function AdBanner() {
  const user = useStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';

  if (isPremium) return null;

  // Web → bannière upgrade Premium (AppLovin ne supporte pas le web)
  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity style={s.webBanner} onPress={() => openCheckout()} activeOpacity={0.8}>
        <Text style={s.webBannerText}>🌿 Premium $3.99/mois — Sans pub, circulaires + comparateur de prix</Text>
      </TouchableOpacity>
    );
  }

  // Mobile natif → bannière AppLovin MAX
  if (!AdView || !AD_UNIT_IDS.banner) return null;

  return (
    <View style={s.bannerContainer}>
      <AdView
        adUnitId={AD_UNIT_IDS.banner}
        adFormat="BANNER"
        style={s.banner}
      />
    </View>
  );
}

export function AdBannerSmall() {
  const user = useStore((s) => s.user);
  if (user?.plan === 'PREMIUM') return null;

  return (
    <TouchableOpacity style={s.smallBanner} onPress={() => openCheckout()} activeOpacity={0.8}>
      <Text style={s.smallText}>Premium $3.99/mois — Circulaires + comparateur de prix + liste + sans pub</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  bannerContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    width: '100%',
  },
  banner: {
    width: 320,
    height: 50,
  },
  webBanner: {
    backgroundColor: '#1a2a1a',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22c55e44',
  },
  webBannerText: { color: '#22c55e', fontSize: 13, fontWeight: '700' },
  smallBanner: {
    backgroundColor: '#f59e0b',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  smallText: { color: '#000', fontSize: 13, fontWeight: '900' },
});
