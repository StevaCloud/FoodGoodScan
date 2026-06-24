import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { WeatherScreen } from '../components/WeatherBackground';
import { createCheckoutSession, createPortalSession, getSubscriptionStatus } from '../services/api';
import { LANGUAGE_NAMES, Language } from '../i18n/translations';
import { useTranslation } from '../i18n/useTranslation';

const LANGUAGES: Language[] = ['fr', 'en', 'es', 'ar'];

function openURL(url: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_self');
  } else {
    import('react-native').then(({ Linking }) => Linking.openURL(url));
  }
}

export function ProfileScreen() {
  const weatherBg = useWeatherBg();
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const logout = useStore((s) => s.logout);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const { t } = useTranslation();
  const [loading, setLoading] = useState('');

  const handleUpgrade = async (priceKey: 'premium' | 'premium_grocery') => {
    try {
      setLoading(priceKey);
      const { url } = await createCheckoutSession(priceKey);
      if (url) openURL(url);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Erreur lors de la création de la session');
    } finally {
      setLoading('');
    }
  };

  const handleManage = async () => {
    try {
      setLoading('manage');
      const { url } = await createPortalSession();
      if (url) openURL(url);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Erreur');
    } finally {
      setLoading('');
    }
  };

  return (
    <WeatherScreen><ScrollView style={styles.container}>
      <Text style={styles.title}>{t('profile.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.name}>{user?.name || 'Utilisateur'}</Text>
        <View style={styles.planBadge}>
          <Text style={styles.planText}>
            {user?.plan === 'PREMIUM' ? (user?.groceryAddon ? 'Premium + Épicerie' : 'Premium') : 'Gratuit'}
          </Text>
        </View>
      </View>

      {user?.plan !== 'PREMIUM' && (
        <>
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Premium</Text>
            <Text style={styles.upgradeDesc}>
              Circulaires en temps réel, comparateur de prix, régime santé personnalisé, sans pub
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => handleUpgrade('premium')}
              disabled={loading === 'premium'}
            >
              {loading === 'premium' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.upgradeButtonText}>Premium — $3.99/mois</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.upgradeCard, { borderColor: '#f59e0b' }]}>
            <View style={styles.popularBadge}><Text style={styles.popularText}>POPULAIRE</Text></View>
            <Text style={[styles.upgradeTitle, { color: '#f59e0b' }]}>Premium + Épicerie</Text>
            <Text style={styles.upgradeDesc}>
              Tout le Premium + liste d'épicerie intelligente, suggestions ciblées, tout inclus
            </Text>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: '#f59e0b' }]}
              onPress={() => handleUpgrade('premium_grocery')}
              disabled={loading === 'premium_grocery'}
            >
              {loading === 'premium_grocery' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.upgradeButtonText}>Premium + Épicerie — $5.99/mois</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {user?.plan === 'PREMIUM' && (
        <View style={styles.activeCard}>
          <Text style={styles.activeText}>
            {user?.groceryAddon ? 'Premium + Épicerie actifs' : 'Premium actif'}
          </Text>
          <Text style={styles.activePrice}>
            {user?.groceryAddon ? '$5.99/mois' : '$3.99/mois'}
          </Text>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={handleManage}
            disabled={loading === 'manage'}
          >
            {loading === 'manage' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.manageButtonText}>Gérer mon abonnement</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.languageCard}>
        <Text style={styles.languageTitle}>{t('profile.language')}</Text>
        <View style={styles.languageOptions}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.languageOption, language === lang && styles.languageOptionActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.languageOptionText, language === lang && styles.languageOptionTextActive]}>
                {LANGUAGE_NAMES[lang]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
    </ScrollView></WeatherScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 20 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  email: { color: '#ccc', fontSize: 14 },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  planBadge: {
    backgroundColor: '#22c55e20',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  planText: { color: '#22c55e', fontWeight: 'bold', fontSize: 12 },
  upgradeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  upgradeTitle: { color: '#22c55e', fontSize: 20, fontWeight: '800' },
  upgradeDesc: { color: '#ccc', fontSize: 14, marginTop: 8, marginBottom: 16, lineHeight: 20 },
  upgradeButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  upgradeButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  popularBadge: { backgroundColor: '#f59e0b', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  popularText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  activeCard: {
    backgroundColor: '#14532d',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  activeText: { color: '#86efac', fontSize: 16, fontWeight: 'bold' },
  activePrice: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  manageButton: {
    backgroundColor: '#166534',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  manageButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  logoutButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: { color: '#ef4444', fontSize: 16 },
  languageCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 },
  languageTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  languageOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languageOption: { backgroundColor: '#333', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#444' },
  languageOptionActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  languageOptionText: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  languageOptionTextActive: { color: '#fff' },
});
