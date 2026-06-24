import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import axios from 'axios';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';
import { usePostalCode } from '../hooks/usePostalCode';
import { WeatherScreen } from '../components/WeatherBackground';
import { getCurrentWeather } from '../services/weatherService';
import { calculateWaterIntake } from '../services/waterIntakeService';
import { showToast } from '../components/Toast';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { AdBanner, AdBannerSmall } from '../components/AdBanner';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const SCREEN_WIDTH = Dimensions.get('window').width;

interface DealSlide {
  id: number;
  name: string;
  merchant: string;
  price: number | null;
  imageUrl: string;
}

function TrialBanner({ trialEndsAt }: { trialEndsAt: string | null }) {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return null;

  const isUrgent = daysLeft <= 3;
  return (
    <View style={[trialStyles.banner, isUrgent && trialStyles.bannerUrgent]}>
      <Text style={trialStyles.icon}>{isUrgent ? '⏰' : '🎁'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={trialStyles.title}>Essai Premium gratuit</Text>
        <Text style={trialStyles.sub}>
          {daysLeft === 1 ? 'Dernier jour!' : `${daysLeft} jours restants`} — Accès complet à toutes les fonctionnalités
        </Text>
      </View>
    </View>
  );
}

const trialStyles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#14532d', borderRadius: 12, padding: 14, marginBottom: 16, gap: 10, borderWidth: 1, borderColor: '#22c55e' },
  bannerUrgent: { backgroundColor: '#431407', borderColor: '#f97316' },
  icon: { fontSize: 24 },
  title: { color: '#22c55e', fontWeight: 'bold', fontSize: 14 },
  sub: { color: '#ccc', fontSize: 12, marginTop: 2 },
});

export function HomeScreen() {
  const weatherBg = useWeatherBg();
  const navigation = useNavigation<any>();
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const healthProfile = useStore((s) => s.healthProfile);
  const foodPreferences = useStore((s) => s.foodPreferences);
  const addGroceryItem = useStore((s) => s.addGroceryItem);
  const { t } = useTranslation();
  const postalCode = usePostalCode();
  const [deals, setDeals] = useState<DealSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [weather, setWeather] = useState<{ temperature: number; icon: string; description: string } | null>(null);
  const [waterPlan, setWaterPlan] = useState<{ dailyLiters: string; glassesCount: number; reason: string } | null>(null);
  const [suggestions, setSuggestions] = useState<{ name: string; merchant: string; price: number | null; imageUrl: string }[]>([]);

  useEffect(() => {
    if (token) loadDeals();
  }, [token]);

  useEffect(() => {
    if (!token || foodPreferences.length === 0) return;
    loadSuggestions();
  }, [token, foodPreferences]);

  const loadSuggestions = async () => {
    try {
      const prefs = foodPreferences.slice(0, 4);
      const allItems: { name: string; merchant: string; price: number | null; imageUrl: string }[] = [];
      for (const pref of prefs) {
        try {
          const { data } = await axios.get(`${API_URL}/deals`, {
            params: { search: pref, postal_code: postalCode },
            headers: { Authorization: `Bearer ${token}` },
          });
          const items = (Array.isArray(data) ? data : [])
            .filter((i: any) => i.price && i.imageUrl)
            .slice(0, 2)
            .map((i: any) => ({ name: i.name, merchant: i.merchant, price: i.price, imageUrl: i.imageUrl }));
          allItems.push(...items);
        } catch {}
      }
      setSuggestions(allItems);
    } catch {}
  };

  useEffect(() => {
    if (!token) return;
    getCurrentWeather(postalCode || undefined).then((w) => {
      if (!w) return;
      setWeather({ temperature: w.temperature, icon: w.icon, description: w.description });

      if (healthProfile?.weight) {
        const plan = calculateWaterIntake(
          parseFloat(healthProfile.weight) || 154,
          parseFloat(healthProfile.height) || 170,
          healthProfile.activityLevel || 'moderate',
          healthProfile.diet || 'none',
          w.temperature,
          healthProfile.gender || 'male'
        );
        setWaterPlan({ dailyLiters: plan.dailyLiters, glassesCount: plan.glassesCount, reason: plan.reason });
      }
    });
  }, [token, postalCode, healthProfile]);

  useEffect(() => {
    if (deals.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % deals.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [deals]);

  const loadDeals = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/deals/featured`, {
        params: { postal_code: postalCode },
      });
      setDeals(data);
    } catch {}
  };

  return (
    <WeatherScreen>
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <View />
        <LanguageSelector />
      </View>
      <View style={styles.header}>
        <Text style={styles.logo}>{t('app.name')}</Text>
        <Text style={styles.subtitle}>{t('app.tagline')}</Text>
      </View>

      <TrialBanner trialEndsAt={user?.trialEndsAt ?? null} />

      {/* Objectif hydratation du jour */}
      {waterPlan && (
        <View style={styles.waterCard}>
          <Text style={styles.waterIcon}>💧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.waterAmount}>{waterPlan.dailyLiters} L à boire aujourd'hui</Text>
            <Text style={styles.waterGlasses}>{waterPlan.glassesCount} verres · {waterPlan.reason}</Text>
          </View>
          {weather && weather.temperature >= 25 && (
            <Text style={styles.waterHot}>🔥 +eau</Text>
          )}
        </View>
      )}

      {deals.length > 0 && (
        <View style={styles.carouselSection}>
          <Text style={styles.carouselTitle}>{t('home.specials')}</Text>
          <TouchableOpacity
            style={styles.slide}
            onPress={() => setCurrentIndex((prev) => (prev + 1) % deals.length)}
            activeOpacity={0.9}
          >
            <View style={styles.slideContent}>
              {deals[currentIndex].imageUrl ? (
                <Image source={{ uri: deals[currentIndex].imageUrl }} style={styles.slideImage} resizeMode="cover" />
              ) : (
                <View style={[styles.slideImage, { backgroundColor: '#1a3a2a', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#22c55e', fontSize: 30 }}>$</Text>
                </View>
              )}
              <View style={styles.slideInfo}>
                <View style={styles.merchantBadge}>
                  <Text style={styles.merchantBadgeText}>{deals[currentIndex].merchant}</Text>
                </View>
                <Text style={styles.slideName} numberOfLines={2}>{deals[currentIndex].name}</Text>
                {deals[currentIndex].price && (
                  <Text style={styles.slidePrice}>${deals[currentIndex].price!.toFixed(2)}</Text>
                )}
              </View>
            </View>
            <View style={styles.slideProgress}>
              <View style={[styles.slideProgressBar, { width: `${((currentIndex + 1) / deals.length) * 100}%` }]} />
            </View>
          </TouchableOpacity>
          <View style={styles.dots}>
            {deals.map((_, i) => (
              <View key={i} style={[styles.dot, currentIndex === i && styles.dotActive]} />
            ))}
          </View>
          <Text style={styles.carouselHint}>{currentIndex + 1}/{deals.length} — {t('home.click.next')}</Text>
        </View>
      )}

      <AdBanner />

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scanner')}
      >
        <Text style={styles.scanIcon}>[ ]</Text>
        <Text style={styles.scanText}>{t('home.scan')}</Text>
      </TouchableOpacity>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>Suggestions pour toi</Text>
          <Text style={styles.suggestionsSub}>Basé sur tes préférences alimentaires</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20 }}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.sugCard}
                  onPress={() => navigation.navigate('Soldes', { searchQuery: s.name.split(/[,|/()]/).shift()?.trim().split(' ').slice(0, 2).join(' ') || s.name, returnTo: 'Accueil' })}
                  activeOpacity={0.8}
                >
                  {s.imageUrl ? (
                    <Image source={{ uri: s.imageUrl }} style={styles.sugImage} resizeMode="contain" />
                  ) : (
                    <View style={[styles.sugImage, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 20 }}>🛒</Text>
                    </View>
                  )}
                  <Text style={styles.sugName} numberOfLines={2}>{s.name}</Text>
                  <Text style={styles.sugStore}>{s.merchant}</Text>
                  {s.price && <Text style={styles.sugPrice}>${s.price.toFixed(2)}</Text>}
                  <TouchableOpacity
                    style={styles.sugAddBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      addGroceryItem(s.name, s.merchant, s.price, undefined, s.imageUrl);
                      showToast(`${s.name} ajouté à ta liste`);
                    }}
                  >
                    <Text style={styles.sugAddText}>+ Liste</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.features}>
        <TouchableOpacity style={[styles.featureCard, { borderLeftColor: '#3b82f6' }]} onPress={() => navigation.navigate('Soldes')}>
          <Text style={styles.featureTitle}>{t('home.deals')}</Text>
          <Text style={styles.featureDesc}>{t('home.deals.desc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.featureCard, { borderLeftColor: '#3b82f6' }]} onPress={() => navigation.navigate('Water')}>
          <Text style={styles.featureTitle}>{t('home.water')}</Text>
          <Text style={styles.featureDesc}>{t('home.water.desc')}</Text>
        </TouchableOpacity>
      </View>

      <AdBannerSmall />

      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userPlan}>
            {user.plan === 'PREMIUM' ? 'Premium' : 'Gratuit'}
            {user.groceryAddon ? ' + Épicerie' : ''}
          </Text>
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
    </WeatherScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  waterCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0c1a2e', borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1e3a5f', gap: 10 },
  waterIcon: { fontSize: 26 },
  waterAmount: { color: '#38bdf8', fontSize: 15, fontWeight: 'bold' },
  waterGlasses: { color: '#64748b', fontSize: 11, marginTop: 2 },
  waterHot: { color: '#f97316', fontSize: 11, fontWeight: '700' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, zIndex: 100 },
  header: { alignItems: 'center', marginTop: 10, marginBottom: 20, paddingHorizontal: 20 },
  logo: { color: '#22c55e', fontSize: 36, fontWeight: 'bold' },
  subtitle: { color: '#ccc', fontSize: 14, marginTop: 8 },
  carouselSection: { marginBottom: 20 },
  carouselTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 10 },
  slide: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f2d1f',
    borderWidth: 1,
    borderColor: '#22c55e30',
  },
  slideContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideImage: { width: 110, height: 110, borderTopLeftRadius: 15 },
  slideInfo: { flex: 1, padding: 14 },
  merchantBadge: {
    backgroundColor: '#22c55e',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  merchantBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  slideName: { color: '#e0e0e0', fontSize: 16, fontWeight: '600', lineHeight: 22 },
  slidePrice: { color: '#22c55e', fontSize: 24, fontWeight: 'bold', marginTop: 6 },
  slideProgress: { height: 3, backgroundColor: '#1a3a2a' },
  slideProgressBar: { height: 3, backgroundColor: '#22c55e' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  dotActive: { backgroundColor: '#22c55e', width: 20 },
  carouselHint: { color: '#aaa', fontSize: 11, textAlign: 'center', marginTop: 6 },
  scanButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  scanIcon: { color: '#fff', fontSize: 40, marginBottom: 8 },
  scanText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  suggestionsSection: { marginBottom: 20 },
  suggestionsTitle: { color: '#fff', fontSize: 18, fontWeight: '800', paddingHorizontal: 20 },
  suggestionsSub: { color: '#22c55e', fontSize: 12, fontWeight: '600', paddingHorizontal: 20, marginTop: 2 },
  sugCard: { backgroundColor: '#1a1a1a', borderRadius: 12, width: 140, overflow: 'hidden' },
  sugImage: { width: 140, height: 100, backgroundColor: '#222' },
  sugName: { color: '#eee', fontSize: 12, fontWeight: '600', padding: 8, paddingBottom: 2, lineHeight: 16 },
  sugStore: { color: '#22c55e', fontSize: 11, fontWeight: '700', paddingHorizontal: 8 },
  sugPrice: { color: '#22c55e', fontSize: 18, fontWeight: '800', paddingHorizontal: 8, paddingTop: 2 },
  sugAddBtn: { backgroundColor: '#22c55e', margin: 8, marginTop: 4, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  sugAddText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  features: { gap: 10, paddingHorizontal: 20 },
  featureCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  featureTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  featureDesc: { color: '#ccc', fontSize: 13 },
  userInfo: { marginTop: 20, alignItems: 'center' },
  userPlan: { color: '#22c55e', fontSize: 14 },
});
