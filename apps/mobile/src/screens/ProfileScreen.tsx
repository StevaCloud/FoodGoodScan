import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useStore } from '../store/useStore';
import { upgradeSubscription } from '../services/api';
import { LANGUAGE_NAMES, Language } from '../i18n/translations';
import { useTranslation } from '../i18n/useTranslation';

const LANGUAGES: Language[] = ['fr', 'en', 'es', 'ar'];

export function ProfileScreen() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const logout = useStore((s) => s.logout);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const { t } = useTranslation();

  const handleUpgrade = async (groceryAddon: boolean) => {
    try {
      await upgradeSubscription('PREMIUM', groceryAddon);
      if (user) {
        setUser({ ...user, plan: 'PREMIUM', groceryAddon });
      }
      Alert.alert('Félicitations!', 'Ton abonnement est activé!');
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Erreur');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('profile.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.name}>{user?.name || 'Utilisateur'}</Text>
        <View style={styles.planBadge}>
          <Text style={styles.planText}>
            {user?.plan === 'PREMIUM' ? 'Premium' : 'Gratuit'}
          </Text>
        </View>
      </View>

      {user?.plan !== 'PREMIUM' && (
        <View style={styles.upgradeCard}>
          <Text style={styles.upgradeTitle}>Passe au Premium</Text>
          <Text style={styles.upgradeDesc}>
            Scans illimités, analyse complète, historique, favoris et recommandations
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => handleUpgrade(false)}
          >
            <Text style={styles.upgradeButtonText}>Premium — $3.99/mois</Text>
          </TouchableOpacity>
        </View>
      )}

      {user?.plan === 'PREMIUM' && !user?.groceryAddon && (
        <View style={[styles.upgradeCard, { borderColor: '#f97316' }]}>
          <Text style={[styles.upgradeTitle, { color: '#f97316' }]}>Add-on Épicerie</Text>
          <Text style={styles.upgradeDesc}>
            Accès aux articles en solde, alertes, comparateur de prix
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: '#f97316' }]}
            onPress={() => handleUpgrade(true)}
          >
            <Text style={styles.upgradeButtonText}>Épicerie — $1.99/mois</Text>
          </TouchableOpacity>
        </View>
      )}

      {user?.groceryAddon && (
        <View style={styles.activeCard}>
          <Text style={styles.activeText}>Premium + Épicerie actifs</Text>
          <Text style={styles.activePrice}>$5.98/mois</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 20 },
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
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  upgradeTitle: { color: '#22c55e', fontSize: 18, fontWeight: 'bold' },
  upgradeDesc: { color: '#ccc', fontSize: 13, marginTop: 8, marginBottom: 16 },
  upgradeButton: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  activeCard: {
    backgroundColor: '#14532d',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  activeText: { color: '#86efac', fontSize: 16, fontWeight: 'bold' },
  activePrice: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
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
