import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useStore } from '../store/useStore';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { WeatherScreen } from '../components/WeatherBackground';
import { createCheckoutSession, createPortalSession, updatePhone, logout as apiLogout, deleteAccount as apiDeleteAccount } from '../services/api';
import { LANGUAGE_NAMES, Language } from '../i18n/translations';
import { useTranslation } from '../i18n/useTranslation';
import { useUserCountry } from '../hooks/useUserCountry';
import { getCountryFlag, getCountryLabel, CurrencyInfo } from '../utils/countryDetection';

function fmtPrice(amount: string, currency: CurrencyInfo): string {
  if (currency.symbolAfter) return `${amount} ${currency.symbol}`;
  return `${currency.symbol}${amount}`;
}

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
  const { country, currency } = useUserCountry();
  const [loading, setLoading] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingPriceKey, setPendingPriceKey] = useState<'premium' | 'premium_grocery' | null>(null);

  const handleUpgrade = async (priceKey: 'premium' | 'premium_grocery') => {
    if (!user?.phone) {
      setPendingPriceKey(priceKey);
      setPhoneInput('');
      setShowPhoneModal(true);
      return;
    }
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

  const handleSavePhone = async () => {
    if (!phoneInput.trim() || phoneInput.trim().length < 7) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide (minimum 7 chiffres)');
      return;
    }
    setPhoneLoading(true);
    try {
      await updatePhone(phoneInput.trim());
      setUser({ ...user!, phone: phoneInput.trim() });
      setShowPhoneModal(false);
      if (pendingPriceKey) {
        const key = pendingPriceKey;
        setPendingPriceKey(null);
        setTimeout(() => handleUpgrade(key), 300);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setPhoneLoading(false);
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
      <Modal visible={showPhoneModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Numéro de téléphone requis</Text>
            <Text style={styles.modalDesc}>
              Pour souscrire un abonnement, nous avons besoin de votre numéro de téléphone afin d'éviter les abus de réinscription.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Votre numéro de téléphone"
              placeholderTextColor="#666"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => { setShowPhoneModal(false); setPendingPriceKey(null); }}
              >
                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, phoneLoading && { opacity: 0.5 }]}
                onPress={handleSavePhone}
                disabled={phoneLoading}
              >
                {phoneLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalBtnPrimaryText}>Confirmer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.title}>{t('profile.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.name}>{user?.name || 'Utilisateur'}</Text>
        <View style={styles.planBadge}>
          <Text style={styles.planText}>
            {user?.plan === 'PREMIUM' ? (user?.groceryAddon ? 'Premium + Épicerie' : 'Premium') : 'Gratuit'}
          </Text>
        </View>
        {user?.phone ? (
          <Text style={styles.phoneInfo}>Tel : {user.phone}</Text>
        ) : (
          <Text style={styles.phoneWarning}>Aucun telephone — requis pour s'abonner</Text>
        )}
        <View style={styles.countryRow}>
          <Text style={styles.countryFlag}>{getCountryFlag(country)}</Text>
          <Text style={styles.countryText}>{getCountryLabel(country)}</Text>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyText}>{currency.symbol} {currency.code}</Text>
          </View>
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
                <Text style={styles.upgradeButtonText}>Premium — {fmtPrice('3.99', currency)}/mois</Text>
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
                <Text style={styles.upgradeButtonText}>Premium + Épicerie — {fmtPrice('5.99', currency)}/mois</Text>
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
            {user?.groceryAddon ? fmtPrice('5.99', currency) : fmtPrice('3.99', currency)}/mois
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

      <View style={styles.phoneCard}>
        <Text style={styles.phoneCardTitle}>Numéro de téléphone</Text>
        <Text style={styles.phoneCardDesc}>
          {user?.phone ? `Numéro actuel : ${user.phone}` : 'Aucun numéro — requis pour souscrire un abonnement.'}
        </Text>
        <TextInput
          style={styles.phoneCardInput}
          placeholder={user?.phone ? 'Nouveau numéro' : 'Votre numéro de téléphone'}
          placeholderTextColor="#666"
          value={phoneInput}
          onChangeText={setPhoneInput}
          keyboardType="phone-pad"
        />
        <TouchableOpacity
          style={[styles.phoneCardButton, phoneLoading && { opacity: 0.5 }]}
          onPress={handleSavePhone}
          disabled={phoneLoading}
        >
          {phoneLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.phoneCardButtonText}>{user?.phone ? 'Modifier' : 'Enregistrer'}</Text>}
        </TouchableOpacity>
      </View>

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

      <TouchableOpacity style={styles.logoutButton} onPress={async () => {
        await apiLogout();
        logout();
      }}>
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            'Supprimer mon compte',
            'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await apiDeleteAccount();
                    logout();
                  } catch {
                    Alert.alert('Erreur', 'Impossible de supprimer le compte. Réessayez.');
                  }
                },
              },
            ]
          );
        }}
      >
        <Text style={styles.deleteText}>Supprimer mon compte</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
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
  phoneInfo: { color: '#86efac', fontSize: 13, marginTop: 6 },
  phoneWarning: { color: '#f59e0b', fontSize: 13, marginTop: 6 },
  countryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  countryFlag: { fontSize: 20 },
  countryText: { color: '#ccc', fontSize: 13, fontWeight: '600' },
  currencyBadge: { backgroundColor: '#1e3a5f', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 4 },
  currencyText: { color: '#60a5fa', fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalDesc: { color: '#aaa', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  modalInput: { backgroundColor: '#222', color: '#fff', borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#333', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  modalBtnPrimary: { backgroundColor: '#22c55e' },
  modalBtnSecondary: { backgroundColor: '#333' },
  modalBtnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalBtnSecondaryText: { color: '#ccc', fontSize: 15 },
  phoneCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 },
  phoneCardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  phoneCardDesc: { color: '#aaa', fontSize: 13, marginBottom: 12 },
  phoneCardInput: { backgroundColor: '#222', color: '#fff', borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#333', marginBottom: 10 },
  phoneCardButton: { backgroundColor: '#22c55e', borderRadius: 10, padding: 12, alignItems: 'center' },
  phoneCardButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  logoutButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: { color: '#ef4444', fontSize: 16 },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteText: { color: '#7f1d1d', fontSize: 14 },
  languageCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 },
  languageTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  languageOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languageOption: { backgroundColor: '#333', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#444' },
  languageOptionActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  languageOptionText: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  languageOptionTextActive: { color: '#fff' },
});
