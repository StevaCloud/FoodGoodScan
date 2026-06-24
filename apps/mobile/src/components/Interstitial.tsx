import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const AD_SEARCHES = ['poulet', 'lait', 'fromage', 'chips', 'pizza', 'yogourt', 'fruits', 'pain', 'chocolat', 'beurre'];
const COUNTDOWN = 5;

interface AdDeal {
  name: string;
  merchant: string;
  price: number | null;
  imageUrl: string;
}

let triggerCount = 0;
let showInterstitialFn: (() => void) | null = null;

export function triggerInterstitial() {
  triggerCount++;
  if (triggerCount % 3 === 0) {
    showInterstitialFn?.();
  }
}

export function InterstitialProvider({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const navigation = useNavigation<any>();
  const [visible, setVisible] = useState(false);
  const [ad, setAd] = useState<AdDeal | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN);
  const addGroceryItem = useStore((s) => s.addGroceryItem);

  const isPremium = user?.plan === 'PREMIUM';

  const loadAd = useCallback(async () => {
    if (!token) return;
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
  }, [token]);

  const show = useCallback(() => {
    if (isPremium) return;
    loadAd();
    setCountdown(COUNTDOWN);
    setVisible(true);
  }, [isPremium, loadAd]);

  useEffect(() => {
    showInterstitialFn = show;
    return () => { showInterstitialFn = null; };
  }, [show]);

  useEffect(() => {
    if (!visible) return;
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [visible, countdown]);

  if (isPremium || !visible) return <>{children}</>;

  return (
    <>
      {children}
      <Modal visible={visible} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.container}>
            <View style={s.header}>
              <Text style={s.adLabel}>PUBLICITE</Text>
              {countdown > 0 ? (
                <View style={s.countdownBadge}>
                  <Text style={s.countdownText}>Fermer dans {countdown}s</Text>
                </View>
              ) : (
                <TouchableOpacity style={s.closeBtn} onPress={() => setVisible(false)}>
                  <Text style={s.closeBtnText}>X Fermer</Text>
                </TouchableOpacity>
              )}
            </View>

            {ad?.imageUrl ? (
              <Image source={{ uri: ad.imageUrl }} style={s.adImage} resizeMode="contain" />
            ) : (
              <View style={[s.adImage, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 60 }}>🛒</Text>
              </View>
            )}

            {ad && (
              <View style={s.adInfo}>
                <Text style={s.adMerchant}>{ad.merchant}</Text>
                <Text style={s.adName} numberOfLines={2}>{ad.name}</Text>
                {ad.price && <Text style={s.adPrice}>${ad.price.toFixed(2)}</Text>}
                <TouchableOpacity
                  style={s.addBtn}
                  onPress={() => { setVisible(false); navigation.navigate('Profil'); }}
                >
                  <Text style={s.addBtnText}>Plan Premium pour ajouter a la liste</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={s.upgradeBtn}
              onPress={() => { setVisible(false); navigation.navigate('Profil'); }}
            >
              <Text style={s.upgradeBtnTitle}>Premium — $3.99/mois</Text>
              <Text style={s.upgradeBtnFeatures}>Circulaires + Comparateur de prix + Liste d'epicerie + Sans pub</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#111',
  },
  adLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  countdownBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countdownText: { color: '#888', fontSize: 13, fontWeight: '700' },
  closeBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  adImage: { width: '100%', height: 250, backgroundColor: '#222' },
  adInfo: { padding: 16 },
  adMerchant: { color: '#22c55e', fontSize: 14, fontWeight: '800' },
  adName: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 4, lineHeight: 24 },
  adPrice: { color: '#22c55e', fontSize: 32, fontWeight: '900', marginTop: 8 },
  addBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  upgradeBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    alignItems: 'center',
  },
  upgradeBtnTitle: { color: '#000', fontSize: 16, fontWeight: '900' },
  upgradeBtnFeatures: { color: '#000', fontSize: 12, fontWeight: '800', marginTop: 2 },
});
