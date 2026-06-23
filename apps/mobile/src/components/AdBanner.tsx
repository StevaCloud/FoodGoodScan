import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const AD_SEARCHES = ['poulet', 'lait', 'fromage', 'chips', 'pizza', 'yogourt', 'fruits', 'pain', 'beurre', 'chocolat', 'eau', 'jus'];

interface AdDeal {
  name: string;
  merchant: string;
  price: number | null;
  imageUrl: string;
}

export function AdBanner() {
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const navigation = useNavigation<any>();
  const [ad, setAd] = useState<AdDeal | null>(null);

  const isPremium = user?.plan === 'PREMIUM';

  useEffect(() => {
    if (isPremium || !token) return;
    loadAd();
  }, [isPremium, token]);

  const loadAd = async () => {
    try {
      const term = AD_SEARCHES[Math.floor(Math.random() * AD_SEARCHES.length)];
      const { data } = await axios.get(`${API_URL}/deals`, {
        params: { search: term, postal_code: 'J1H1A1' },
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = (Array.isArray(data) ? data : []).filter((i: any) => i.price && i.imageUrl);
      if (items.length > 0) {
        const pick = items[Math.floor(Math.random() * Math.min(items.length, 5))];
        setAd({ name: pick.name, merchant: pick.merchant, price: pick.price, imageUrl: pick.imageUrl });
      }
    } catch {}
  };

  if (isPremium || !ad) return null;

  return (
    <View style={s.container}>
      <View style={s.adLabel}>
        <Text style={s.adLabelText}>Publicite</Text>
      </View>
      <TouchableOpacity
        style={s.adContent}
        onPress={() => navigation.navigate('Soldes', { searchQuery: ad.name.split(/[,|/()]/).shift()?.trim().split(' ').slice(0, 2).join(' ') || ad.name })}
        activeOpacity={0.8}
      >
        {ad.imageUrl ? (
          <Image source={{ uri: ad.imageUrl }} style={s.adImage} resizeMode="contain" />
        ) : null}
        <View style={s.adInfo}>
          <Text style={s.adMerchant}>{ad.merchant}</Text>
          <Text style={s.adName} numberOfLines={2}>{ad.name}</Text>
          {ad.price && <Text style={s.adPrice}>${ad.price.toFixed(2)}</Text>}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={s.upgradeBar} onPress={() => navigation.navigate('Profil')}>
        <Text style={s.upgradeText}>Passe a Premium pour enlever les pubs</Text>
      </TouchableOpacity>
    </View>
  );
}

export function AdBannerSmall() {
  const user = useStore((s) => s.user);
  const navigation = useNavigation<any>();

  if (user?.plan === 'PREMIUM') return null;

  return (
    <TouchableOpacity style={s.smallBanner} onPress={() => navigation.navigate('Profil')} activeOpacity={0.8}>
      <Text style={s.smallText}>Enleve les pubs — Passe a Premium $3.99/mois</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  adLabel: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 8,
  },
  adLabelText: { color: '#888', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  adImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#222' },
  adInfo: { flex: 1 },
  adMerchant: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  adName: { color: '#ddd', fontSize: 13, fontWeight: '600', marginTop: 2, lineHeight: 17 },
  adPrice: { color: '#22c55e', fontSize: 18, fontWeight: '800', marginTop: 4 },
  upgradeBar: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    alignItems: 'center',
  },
  upgradeText: { color: '#000', fontSize: 12, fontWeight: '800' },
  smallBanner: {
    backgroundColor: '#2a1a00',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  smallText: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
});
