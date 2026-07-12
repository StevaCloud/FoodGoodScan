import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useStore } from '../store/useStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scanProduct } from '../services/api';
import axios from 'axios';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';
import { showToast } from '../components/Toast';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { WeatherScreen } from '../components/WeatherBackground';
import { openCheckout } from '../services/checkout';
import { usePostalCode } from '../hooks/usePostalCode';
import { fetchNutritionByName } from '../utils/fetchNutrition';
import { useUserCountry } from '../hooks/useUserCountry';
import { formatPrice, isEuropean, isUS, getCountryFlag, getCountryLabel } from '../utils/countryDetection';
import { getEuropeanDeals } from '../services/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Deal {
  id: number;
  name: string;
  merchant: string;
  merchantLogo: string;
  price: number | null;
  priceText: string;
  imageUrl: string;
  validFrom: string;
  validUntil: string;
  category: string;
}

const QUICK_SEARCHES = ['lait', 'pain', 'poulet', 'chips', 'eau', 'fromage', 'yogourt', 'beurre', 'oeufs', 'fruits', 'légumes', 'pizza'];

interface Flyer {
  id: number;
  merchant: string;
  name: string;
  validFrom: string;
  validUntil: string;
}

const CA_STORES = ['IGA', 'Metro', 'Super C', 'Maxi', 'Walmart', 'Provigo', 'Adonis'];
const US_STORES = ['Walmart', 'Kroger', 'Safeway', 'Costco', 'Target', 'Aldi', 'Whole Foods'];
const EU_ONLINE_DEALS: Record<string, { store: string; emoji: string; title: string; url: string }[]> = {
  FR: [
    { store: 'Lidl France',    emoji: '🏷️', title: 'Promos Lidl',       url: 'https://www.lidl.fr/promotions' },
    { store: 'Carrefour',      emoji: '🛒', title: 'Promo de la semaine', url: 'https://www.carrefour.fr/service/promotions' },
    { store: 'Aldi France',    emoji: '💰', title: 'Offres Aldi',         url: 'https://www.aldi.fr/offres-de-la-semaine.html' },
    { store: 'Leclerc',        emoji: '🏬', title: 'Promo E.Leclerc',     url: 'https://www.e.leclerc/catalogue' },
    { store: 'Intermarché',    emoji: '🌿', title: 'Catalogue Intermarché',url: 'https://www.intermarche.com/offres-promotionnelles' },
  ],
  DE: [
    { store: 'Lidl Deutschland', emoji: '🏷️', title: 'Aktuelle Angebote',   url: 'https://www.lidl.de/aktuelle-angebote' },
    { store: 'Aldi Süd',         emoji: '💰', title: 'Angebote der Woche',   url: 'https://www.aldi-sued.de/de/angebote.html' },
    { store: 'Rewe',             emoji: '🛒', title: 'Rewe Angebote',        url: 'https://www.rewe.de/angebote/' },
    { store: 'Edeka',            emoji: '🏬', title: 'Edeka Prospekte',      url: 'https://www.edeka.de/angebote/' },
  ],
  UK: [
    { store: 'Lidl UK',    emoji: '🏷️', title: 'Weekly Offers',        url: 'https://www.lidl.co.uk/offers' },
    { store: 'Aldi UK',    emoji: '💰', title: 'Super 6 & Specials',    url: 'https://www.aldi.co.uk/offers' },
    { store: 'Tesco',      emoji: '🛒', title: 'Clubcard Prices',       url: 'https://www.tesco.com/groceries/en-GB/promotions' },
    { store: 'Sainsbury',  emoji: '🏬', title: 'Nectar Prices',         url: 'https://www.sainsburys.co.uk/gol-ui/promotions' },
  ],
  BE: [
    { store: 'Lidl Belgique', emoji: '🏷️', title: 'Promotions',     url: 'https://www.lidl.be/promotions' },
    { store: 'Delhaize',      emoji: '🛒', title: 'Promos Delhaize', url: 'https://www.delhaize.be/fr-be/folder' },
    { store: 'Colruyt',       emoji: '💰', title: 'Promos Colruyt',  url: 'https://www.colruyt.be/fr/folder-semaine' },
    { store: 'Albert Heijn',  emoji: '🏬', title: 'Aanbiedingen',    url: 'https://www.ah.be/promoties' },
  ],
  ES: [
    { store: 'Lidl España',  emoji: '🏷️', title: 'Ofertas',               url: 'https://www.lidl.es/ofertas' },
    { store: 'Mercadona',    emoji: '🛒', title: 'Novedades y Ofertas',    url: 'https://www.mercadona.es' },
    { store: 'Carrefour ES', emoji: '🏬', title: 'Ofertas de la Semana',   url: 'https://www.carrefour.es/supermercado/ofertas' },
    { store: 'Aldi España',  emoji: '💰', title: 'Ofertas Semanales',      url: 'https://www.aldi.es/nuestras-ofertas.html' },
  ],
  IT: [
    { store: 'Lidl Italia',  emoji: '🏷️', title: 'Offerte',              url: 'https://www.lidl.it/offerte' },
    { store: 'Esselunga',    emoji: '🛒', title: 'Offerte della settimana',url: 'https://www.esselunga.it/cms/esselunga/it/offerte' },
    { store: 'Eurospin',     emoji: '💰', title: 'Volantino Eurospin',     url: 'https://www.eurospin.it/volantino/' },
    { store: 'Conad',        emoji: '🏬', title: 'Offerte Conad',          url: 'https://www.conad.it/offerte' },
  ],
};

function getDefaultEuDeals(country: string) {
  return EU_ONLINE_DEALS[country] || EU_ONLINE_DEALS.FR;
}

export function DealsScreen() {
  const weatherBg = useWeatherBg();
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { country, currency } = useUserCountry();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [selectedFlyer, setSelectedFlyer] = useState<Flyer | null>(null);
  const [flyerItems, setFlyerItems] = useState<Deal[]>([]);
  const [loadingFlyers, setLoadingFlyers] = useState(false);
  const [viewMode, setViewMode] = useState<'search' | 'flyers'>('flyers');
  const [canGoBack, setCanGoBack] = useState(false);
  const [returnToTab, setReturnToTab] = useState<string | null>(null);
  const [euDeals, setEuDeals] = useState<Deal[]>([]);
  const [loadingEu, setLoadingEu] = useState(false);

  const STORES = isUS(country) ? US_STORES : CA_STORES;

  const hasAccess = true;
  const isPremium = user?.plan === 'PREMIUM';
  const { t } = useTranslation();
  const postalCode = usePostalCode();
  const setLastScannedProduct = useStore((s) => s.setLastScannedProduct);
  const addGroceryItem = useStore((s) => s.addGroceryItem);
  const updateGroceryItemNutrition = useStore((s) => s.updateGroceryItemNutrition);
  const [scanningDeal, setScanningDeal] = useState<number | null>(null);

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [otherStores, setOtherStores] = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const goBackToOrigin = () => {
    setCanGoBack(false);
    if (returnToTab) { setReturnToTab(null); navigation.navigate(returnToTab); }
    else navigation.goBack();
  };

  const handleDealClick = async (deal: Deal) => {
    setSelectedDeal(deal);
    setOtherStores([]);
    setLoadingStores(true);
    try {
      const searchName = deal.name.split(/[,|/()]/).shift()?.trim().split(' ').slice(0, 2).join(' ') || deal.name;
      const { data } = await axios.get(
        `https://backflipp.wishabi.com/flipp/items/search?q=${encodeURIComponent(searchName)}&postal_code=${postalCode}&locale=fr`,
      );
      const items = (data.items || [])
        .filter((i: any) => i.current_price)
        .map((i: any) => ({
          name: i.name || '',
          merchant: i.merchant_name || '',
          price: i.current_price,
          imageUrl: i.clean_image_url || i.clipping_image_url || '',
          merchantLogo: i.merchant_logo || '',
        }));
      setOtherStores(items);
    } catch {} finally { setLoadingStores(false); }
  };

  const handleAddToList = (deal: Deal) => {
    const id = addGroceryItem(deal.name, deal.merchant, deal.price, undefined, deal.imageUrl);
    setSelectedDeal(null);
    showToast(`${deal.name} ajouté à ta liste`);
    fetchNutritionByName(deal.name).then((n) => { if (n) updateGroceryItemNutrition(id, n); });
  };

  useEffect(() => {
    if (token && !isEuropean(country)) loadFlyers();
  }, [token, country]);

  useEffect(() => {
    if (token && isEuropean(country)) loadEuDeals();
  }, [token, country]);

  const loadEuDeals = async () => {
    setLoadingEu(true);
    try {
      const data = await getEuropeanDeals(country);
      setEuDeals(Array.isArray(data) ? data : []);
    } catch { setEuDeals([]); } finally { setLoadingEu(false); }
  };

  // Ouvre directement la fiche produit passée en paramètre (depuis DietScreen ou Liste)
  useEffect(() => {
    const dealItem = route.params?.dealItem;
    if (!dealItem) return;
    setCanGoBack(true);
    setReturnToTab(route.params?.returnTo || null);
    setSelectedDeal(dealItem);
    setOtherStores([]);
    navigation.setParams({ dealItem: undefined, returnTo: undefined });
  }, [route.params?.dealItem]);

  // Recherche automatique depuis un autre écran (ex: DietScreen, Quiz)
  useEffect(() => {
    const q = route.params?.searchQuery;
    if (!q) return;
    setCanGoBack(true);
    setReturnToTab(route.params?.returnTo || null);
    setViewMode('search');
    setSearch(q);
    setSelectedDeal(null);
    navigation.setParams({ searchQuery: undefined, returnTo: undefined });
    searchDeals(q);
  }, [route.params?.searchQuery]);

  const loadFlyers = async () => {
    setLoadingFlyers(true);
    try {
      const { data } = await axios.get(`${API_URL}/deals/flyers`, {
        params: { postal_code: postalCode },
        headers: { Authorization: `Bearer ${token}` },
      });
      setFlyers(data);
    } catch {} finally { setLoadingFlyers(false); }
  };

  const loadFlyerItems = async (flyer: Flyer) => {
    setSelectedFlyer(flyer);
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/deals/flyer/${flyer.id}`, {
        params: { postal_code: postalCode },
        headers: { Authorization: `Bearer ${token}` },
      });
      setFlyerItems(data);
    } catch { setFlyerItems([]); } finally { setLoading(false); }
  };

  const searchDeals = async (query: string, store?: string) => {
    if (!query || !token) return;
    setLoading(true);
    try {
      const params: any = { search: query, postal_code: postalCode };
      if (store) params.store = store;
      const { data } = await axios.get(`${API_URL}/deals`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeals(data);
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.length >= 2) {
      searchDeals(text, selectedStore || undefined);
    } else {
      setDeals([]);
    }
  };

  const handleQuickSearch = (term: string) => {
    setSearch(term);
    searchDeals(term, selectedStore || undefined);
  };

  const handleStoreFilter = async (store: string | null) => {
    setSelectedStore(store);
    if (!store) {
      if (search.length >= 2) searchDeals(search, undefined);
      else setDeals([]);
      return;
    }
    // Cherche la circulaire du magasin sélectionné
    const flyer = flyers.find(f =>
      f.merchant.toLowerCase().includes(store.toLowerCase()) ||
      store.toLowerCase().includes(f.merchant.toLowerCase())
    );
    if (flyer) {
      setLoading(true);
      setSearch('');
      try {
        const { data } = await axios.get(`${API_URL}/deals/flyer/${flyer.id}`, {
          params: { postal_code: postalCode },
          headers: { Authorization: `Bearer ${token}` },
        });
        setDeals(Array.isArray(data) ? data : []);
      } catch { setDeals([]); }
      finally { setLoading(false); }
    } else if (search.length >= 2) {
      searchDeals(search, store);
    } else {
      // Pas de circulaire trouvée : recherche large pour ce magasin
      setLoading(true);
      const terms = ['lait', 'poulet', 'fruits', 'fromage', 'légumes', 'pain', 'yogourt', 'chips'];
      const all: Deal[] = [];
      for (const t of terms) {
        try {
          const { data } = await axios.get(`${API_URL}/deals`, {
            params: { search: t, postal_code: postalCode, store },
            headers: { Authorization: `Bearer ${token}` },
          });
          all.push(...(Array.isArray(data) ? data : []));
        } catch {}
      }
      const seen = new Set<number>();
      setDeals(all.filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; }));
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <WeatherScreen><View style={styles.locked}>
        <Text style={styles.lockedTitle}>Soldes Épicerie</Text>
        <Text style={styles.lockedSubtitle}>En temps réel de vos circulaires</Text>
        <Text style={styles.lockedText}>
          IGA, Metro, Super C, Maxi, Walmart, Provigo, Adonis et plus.{'\n\n'}
          Recherchez n'importe quel produit et voyez les meilleurs prix près de chez vous.
        </Text>
        {user?.plan !== 'PREMIUM' ? (
          <TouchableOpacity style={styles.upgradeButton} onPress={() => openCheckout()}>
            <Text style={styles.upgradeButtonText}>Premium requis — $3.99/mois</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: '#f97316' }]} onPress={() => openCheckout()}>
            <Text style={styles.upgradeButtonText}>Add-on Épicerie — $1.99/mois</Text>
          </TouchableOpacity>
        )}
      </View></WeatherScreen>
    );
  }

  const renderDeal = ({ item }: { item: Deal }) => (
    <TouchableOpacity style={styles.dealCard} onPress={() => handleDealClick(item)}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.dealImage} />
      ) : (
        <View style={[styles.dealImage, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#aaa' }}>?</Text>
        </View>
      )}
      <View style={styles.dealInfo}>
        <Text style={styles.dealStore}>{item.merchant}</Text>
        <Text style={styles.dealName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
          {isPremium ? (
            item.price ? (
              <Text style={styles.salePrice}>{formatPrice(item.price, country)}</Text>
            ) : (
              <Text style={styles.salePrice}>Voir circulaire</Text>
            )
          ) : (
            <Text style={[styles.salePrice, { color: '#555' }]}>$ ?.??  🔒</Text>
          )}
          {isPremium && item.priceText ? (
            <Text style={styles.priceText}>{item.priceText}</Text>
          ) : null}
        </View>
        <Text style={styles.validDate}>
          Valide jusqu'au {new Date(item.validUntil).toLocaleDateString('fr-CA')}
        </Text>
        <Text style={styles.clickHint}>Clique pour voir les détails</Text>
      </View>
    </TouchableOpacity>
  );

  if (selectedDeal) {
    const validUntilDate = selectedDeal.validUntil ? new Date(selectedDeal.validUntil).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const validFromDate = selectedDeal.validFrom ? new Date(selectedDeal.validFrom).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const daysLeft = selectedDeal.validUntil ? Math.max(0, Math.ceil((new Date(selectedDeal.validUntil).getTime() - Date.now()) / 86400000)) : 0;

    return (
      <WeatherScreen><ScrollView style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            setSelectedDeal(null);
            if (canGoBack) goBackToOrigin();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{'<'} Retour</Text>
        </TouchableOpacity>

        {/* === PREUVE CIRCULAIRE === */}
        <View style={styles.flyerProof}>
          {/* En-tête magasin */}
          <View style={styles.flyerProofHeader}>
            {selectedDeal.merchantLogo ? (
              <Image source={{ uri: selectedDeal.merchantLogo }} style={styles.flyerProofLogo} resizeMode="contain" />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.flyerProofMerchant}>{selectedDeal.merchant}</Text>
              <Text style={styles.flyerProofLabel}>CIRCULAIRE EN VIGUEUR</Text>
            </View>
            {daysLeft > 0 && daysLeft <= 3 && (
              <View style={styles.flyerProofUrgent}>
                <Text style={styles.flyerProofUrgentText}>{daysLeft}j restant{daysLeft > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>

          {/* Image produit */}
          {selectedDeal.imageUrl ? (
            <View style={styles.flyerProofImageWrap}>
              <Image source={{ uri: selectedDeal.imageUrl }} style={styles.flyerProofImage} resizeMode="contain" />
            </View>
          ) : null}

          {/* Nom produit */}
          <Text style={styles.flyerProofName}>{selectedDeal.name}</Text>

          {/* Prix encadré + bouton ajouter */}
          <View style={styles.flyerProofPriceRow}>
            <View style={styles.flyerProofPriceBox}>
              {!isPremium ? (
                <Text style={styles.flyerProofPriceAlt}>🔒 Premium</Text>
              ) : selectedDeal.price ? (
                <>
                  {!currency.symbolAfter && (
                    <Text style={styles.flyerProofPriceDollar}>{currency.symbol}</Text>
                  )}
                  <Text style={styles.flyerProofPrice}>{Math.floor(selectedDeal.price)}</Text>
                  <Text style={styles.flyerProofPriceCents}>{(selectedDeal.price % 1).toFixed(2).substring(1)}</Text>
                  {currency.symbolAfter && (
                    <Text style={[styles.flyerProofPriceDollar, { marginTop: 6, fontSize: 22 }]}> {currency.symbol}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.flyerProofPriceAlt}>Voir prix en magasin</Text>
              )}
            </View>
            {isPremium ? (
              <TouchableOpacity
                style={styles.flyerProofAddBtn}
                onPress={() => handleAddToList(selectedDeal)}
              >
                <Text style={styles.flyerProofAddIcon}>+</Text>
                <Text style={styles.flyerProofAddText}>Ajouter à ma liste</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.flyerProofAddBtn, { backgroundColor: '#f59e0b' }]}
                onPress={() => openCheckout()}
              >
                <Text style={styles.flyerProofAddIcon}>⭐</Text>
                <Text style={styles.flyerProofAddText}>Voir le prix</Text>
              </TouchableOpacity>
            )}
          </View>
          {selectedDeal.priceText ? (
            <Text style={styles.flyerProofPriceDetail}>{selectedDeal.priceText}</Text>
          ) : null}

          {/* Dates de validité */}
          <View style={styles.flyerProofDates}>
            <View style={styles.flyerProofDateItem}>
              <Text style={styles.flyerProofDateLabel}>Valide du</Text>
              <Text style={styles.flyerProofDateValue}>{validFromDate || '—'}</Text>
            </View>
            <View style={styles.flyerProofDateDivider} />
            <View style={styles.flyerProofDateItem}>
              <Text style={styles.flyerProofDateLabel}>Valide jusqu'au</Text>
              <Text style={styles.flyerProofDateValue}>{validUntilDate || '—'}</Text>
            </View>
          </View>

          {/* Badge officiel */}
          <View style={styles.flyerProofBadge}>
            <Text style={styles.flyerProofBadgeText}>Prix tiré de la circulaire officielle de {selectedDeal.merchant}</Text>
          </View>
        </View>

        {/* Comparateur de prix */}
        <View style={styles.otherStoresCard}>
          <Text style={styles.otherStoresTitle}>Comparer les prix — autres magasins</Text>
          {loadingStores && (
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <ActivityIndicator size="small" color="#22c55e" />
              <Text style={{ color: '#ccc', marginTop: 6, fontSize: 12 }}>Recherche dans les circulaires...</Text>
            </View>
          )}
          {!loadingStores && otherStores.length > 0 && (
            otherStores
              .sort((a, b) => (a.price || 999) - (b.price || 999))
              .map((store, i) => {
                const storeImg = store.imageUrl || selectedDeal.imageUrl || '';
                return (
                <View key={i} style={[styles.storeRow, i === 0 && styles.storeRowBest]}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}
                    onPress={() => {
                      setSelectedDeal({
                        id: i,
                        name: store.name,
                        merchant: store.merchant,
                        merchantLogo: store.merchantLogo || '',
                        price: store.price,
                        priceText: '',
                        imageUrl: storeImg,
                        validFrom: '',
                        validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
                        category: '',
                      });
                      setOtherStores([]);
                    }}
                  >
                    {storeImg ? (
                      <Image source={{ uri: storeImg }} style={styles.storeThumb} resizeMode="contain" />
                    ) : (
                      <View style={[styles.storeThumb, { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 16 }}>🛒</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {store.merchantLogo ? (
                          <Image source={{ uri: store.merchantLogo }} style={styles.storeMiniLogo} resizeMode="contain" />
                        ) : null}
                        <Text style={styles.storeNameText}>{store.merchant}</Text>
                        {i === 0 && <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>MEILLEUR PRIX</Text></View>}
                      </View>
                      <Text style={styles.storeProductText} numberOfLines={1}>{store.name}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={[styles.storePriceText, i === 0 && { color: '#22c55e' }]}>{store.price ? formatPrice(store.price, country) : '—'}</Text>
                    <TouchableOpacity
                      style={styles.miniAddBtn}
                      onPress={() => {
                        const sid = addGroceryItem(store.name, store.merchant, store.price, undefined, storeImg);
                        showToast(`${store.name} ajouté à ta liste`);
                        fetchNutritionByName(store.name).then((n) => { if (n) updateGroceryItemNutrition(sid, n); });
                      }}
                    >
                      <Text style={styles.miniAddBtnText}>+ Liste</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                );
              })
          )}
          {!loadingStores && otherStores.length === 0 && (
            <Text style={{ color: '#bbb', fontSize: 13, textAlign: 'center', marginVertical: 12 }}>Aucun autre magasin trouvé cette semaine</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView></WeatherScreen>
    );
  }

  if (selectedFlyer) {
    return (
      <WeatherScreen><View style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            setSelectedFlyer(null);
            setFlyerItems([]);
            if (canGoBack) goBackToOrigin();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{'<'} {canGoBack ? 'Retour' : 'Retour aux circulaires'}</Text>
        </TouchableOpacity>
        <Text style={styles.flyerTitle}>{selectedFlyer.merchant}</Text>
        <Text style={styles.flyerSubtitle}>
          {selectedFlyer.name} — Valide jusqu'au {new Date(selectedFlyer.validUntil).toLocaleDateString('fr-CA')}
        </Text>
        <Text style={styles.flyerCount}>{flyerItems.length} articles en spécial</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Chargement de la circulaire...</Text>
          </View>
        ) : (
          <FlatList style={{ backgroundColor: 'transparent' }}
            data={flyerItems}
            renderItem={renderDeal}
            keyExtractor={(item) => String(item.id)}
          />
        )}
      </View></WeatherScreen>
    );
  }

  return (
    <WeatherScreen><View style={styles.container}>
      <View style={styles.topBar}><View /><LanguageSelector /></View>
      {canGoBack && (
        <TouchableOpacity onPress={() => goBackToOrigin()} style={styles.backButton}>
          <Text style={styles.backText}>{'<'} Retour</Text>
        </TouchableOpacity>
      )}

      {/* Bandeau livraison bientôt disponible */}
      <View style={styles.deliveryBanner}>
        <Text style={styles.deliveryBannerIcon}>🚚</Text>
        <Text style={styles.deliveryBannerText}>Commande bientôt disponible à votre domicile</Text>
        <View style={styles.deliveryBannerBadge}><Text style={styles.deliveryBannerBadgeText}>Bientôt</Text></View>
      </View>

      {!isPremium && (
        <TouchableOpacity style={styles.premiumBanner} onPress={() => openCheckout()}>
          <Text style={styles.premiumBannerText}>🔒 Premium — Voir les prix des circulaires · $3.99/mois</Text>
        </TouchableOpacity>
      )}

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'flyers' && styles.modeActive]}
          onPress={() => setViewMode('flyers')}
        >
          <Text style={[styles.modeText, viewMode === 'flyers' && styles.modeTextActive]}>Circulaires</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'search' && styles.modeActive]}
          onPress={() => setViewMode('search')}
        >
          <Text style={[styles.modeText, viewMode === 'search' && styles.modeTextActive]}>Recherche</Text>
        </TouchableOpacity>
      </View>

      {/* Bandeau pays détecté */}
      <View style={styles.countryBanner}>
        <Text style={styles.countryBannerText}>
          {getCountryFlag(country)} {getCountryLabel(country)} · {currency.symbol} {currency.code}
        </Text>
      </View>

      {viewMode === 'flyers' ? (
        isEuropean(country) ? (
          /* Vue Europe */
          <ScrollView style={{ backgroundColor: 'transparent' }}>
            {/* Deals Lidl depuis l'API */}
            {loadingEu ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Chargement des circulaires Lidl...</Text>
              </View>
            ) : euDeals.length > 0 ? (
              <>
                <Text style={[styles.flyerTitle, { fontSize: 16, marginTop: 8, marginBottom: 6 }]}>
                  Lidl — {getCountryLabel(country)}
                </Text>
                <FlatList
                  style={{ backgroundColor: 'transparent' }}
                  data={euDeals}
                  renderItem={renderDeal}
                  keyExtractor={(item) => String(item.id)}
                  scrollEnabled={false}
                />
              </>
            ) : (
              /* Liens vers sites officiels européens */
              <>
                <Text style={[styles.flyerTitle, { fontSize: 16, marginTop: 8 }]}>
                  Circulaires {getCountryLabel(country)}
                </Text>
                <Text style={[styles.flyerSubtitle, { marginBottom: 12 }]}>
                  Accédez aux offres officielles de vos supermarchés
                </Text>
                {getDefaultEuDeals(country).map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.flyerCard}
                    onPress={() => {
                      if (typeof window !== 'undefined') {
                        (window as any).open(d.url, '_blank');
                      } else {
                        import('react-native').then(({ Linking }) => Linking.openURL(d.url));
                      }
                    }}
                  >
                    <Text style={styles.flyerMerchant}>{d.emoji} {d.store}</Text>
                    <Text style={styles.flyerName}>{d.title}</Text>
                    <Text style={[styles.flyerDate, { color: '#60a5fa' }]}>Voir le site officiel →</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.euComingSoonBox}>
                  <Text style={styles.euComingSoonTitle}>Circulaires intégrées bientôt</Text>
                  <Text style={styles.euComingSoonText}>
                    Lidl, Aldi, Carrefour et autres seront intégrés directement dans l'app prochainement.
                  </Text>
                </View>
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        ) : loadingFlyers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Chargement des circulaires...</Text>
          </View>
        ) : (
          <FlatList style={{ backgroundColor: 'transparent' }}
            data={flyers}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.flyerCard} onPress={() => loadFlyerItems(item)}>
                <Text style={styles.flyerMerchant}>{item.merchant}</Text>
                <Text style={styles.flyerName}>{item.name}</Text>
                <Text style={styles.flyerDate}>
                  Valide jusqu'au {new Date(item.validUntil).toLocaleDateString('fr-CA')}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucune circulaire disponible</Text>}
          />
        )
      ) : (
      <>
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un produit... (ex: lait, poulet, chips)"
        placeholderTextColor="#666"
        value={search}
        onChangeText={handleSearch}
      />

      <View style={styles.quickSearches}>
        {QUICK_SEARCHES.map((term) => (
          <TouchableOpacity
            key={term}
            style={[styles.quickChip, search === term && styles.quickChipActive]}
            onPress={() => handleQuickSearch(term)}
          >
            <Text style={[styles.quickChipText, search === term && styles.quickChipTextActive]}>{term}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.storeFilters}>
        <TouchableOpacity
          style={[styles.storeChip, !selectedStore && styles.storeChipActive]}
          onPress={() => handleStoreFilter(null)}
        >
          <Text style={[styles.storeChipText, !selectedStore && styles.storeChipTextActive]}>Tous</Text>
        </TouchableOpacity>
        {STORES.map((store) => (
          <TouchableOpacity
            key={store}
            style={[styles.storeChip, selectedStore === store && styles.storeChipActive]}
            onPress={() => handleStoreFilter(store)}
          >
            <Text style={[styles.storeChipText, selectedStore === store && styles.storeChipTextActive]}>{store}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedStore && deals.length > 0 && (
        <View style={styles.storeHeaderBanner}>
          <Text style={styles.storeHeaderText}>📦 Articles de {selectedStore}</Text>
          <Text style={styles.storeHeaderCount}>{deals.length} article{deals.length > 1 ? 's' : ''} en spécial</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>
            {selectedStore ? `Chargement des articles de ${selectedStore}...` : 'Recherche dans les circulaires...'}
          </Text>
        </View>
      ) : (
        <FlatList style={{ backgroundColor: 'transparent' }}
          data={deals}
          renderItem={renderDeal}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            selectedStore ? (
              <Text style={styles.emptyText}>Aucun article trouvé pour {selectedStore}</Text>
            ) : search.length >= 2 ? (
              <Text style={styles.emptyText}>Aucun solde trouvé pour "{search}"</Text>
            ) : (
              <Text style={styles.emptyText}>Clique sur un magasin pour voir ses articles, ou tape un produit</Text>
            )
          }
        />
      )}
      </>
      )}
    </View></WeatherScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8, backgroundColor: 'transparent' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, marginBottom: 4, zIndex: 100 },
  deliveryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0a1f0a', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#166534', marginBottom: 6,
  },
  deliveryBannerIcon: { fontSize: 16 },
  deliveryBannerText: { flex: 1, color: '#86efac', fontSize: 12, fontWeight: '600' },
  deliveryBannerBadge: { backgroundColor: '#166534', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  deliveryBannerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  premiumBanner: { backgroundColor: '#1c1400', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8 },
  premiumBannerText: { color: '#f59e0b', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  subtitle: { color: '#22c55e', fontSize: 11, marginBottom: 6, marginTop: 1 },
  searchInput: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 10,
    padding: 7,
    fontSize: 13,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickSearches: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginBottom: 5 },
  quickChip: { backgroundColor: '#1a2a1a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#2a3a2a' },
  quickChipActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  quickChipText: { color: '#22c55e', fontSize: 11, fontWeight: '600' },
  quickChipTextActive: { color: '#fff', fontWeight: '800' },
  storeFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginBottom: 6 },
  storeChip: { backgroundColor: '#222', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9 },
  storeChipActive: { backgroundColor: '#3b82f6' },
  storeChipText: { color: '#ccc', fontSize: 13, fontWeight: '600' },
  storeChipTextActive: { color: '#fff', fontWeight: '800' },
  loadingContainer: { alignItems: 'center', marginTop: 40 },
  loadingText: { color: '#22c55e', marginTop: 10, fontSize: 14 },
  dealCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  dealImage: { width: 100, height: 100 },
  dealInfo: { flex: 1, padding: 12 },
  dealStore: { color: '#22c55e', fontSize: 13, fontWeight: '800' },
  dealName: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 3, lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  salePrice: { color: '#22c55e', fontSize: 20, fontWeight: '800' },
  priceText: { color: '#ddd', fontSize: 13, fontWeight: '500' },
  validDate: { color: '#aaa', fontSize: 12, fontWeight: '500', marginTop: 4 },
  locked: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: 'transparent' },
  lockedTitle: { color: '#f97316', fontSize: 24, fontWeight: 'bold' },
  lockedSubtitle: { color: '#fb923c', fontSize: 14, marginTop: 4, marginBottom: 16 },
  lockedText: { color: '#ccc', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  upgradeButton: { backgroundColor: '#22c55e', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center' },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#bbb', textAlign: 'center', marginTop: 40, fontSize: 14 },
  clickHint: { color: '#60a5fa', fontSize: 12, fontWeight: '600', marginTop: 4 },
  detailImage: { width: '100%', height: 250, borderRadius: 12, marginTop: 10, backgroundColor: '#222' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  detailMerchantBadge: { backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  detailMerchantText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  detailPrice: { color: '#22c55e', fontSize: 36, fontWeight: 'bold' },
  detailName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  detailInfoCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginTop: 16 },
  detailInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  detailInfoLabel: { color: '#ccc', fontSize: 14 },
  detailInfoValue: { color: '#ddd', fontSize: 14, fontWeight: '600' },
  addToListButton: { backgroundColor: '#22c55e', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  addToListButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  ingredientsSection: { marginTop: 16, gap: 10 },
  ingredientsSectionTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  ingredientsText: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  scanTipText: { color: '#bbb', fontSize: 12, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  otherStoresCard: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 18, marginTop: 16 },
  otherStoresTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 14 },
  storeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  storeRowBest: { backgroundColor: '#0f2d1f', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 8 },
  storeNameText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bestBadge: { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  bestBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  storeProductText: { color: '#ddd', fontSize: 13, fontWeight: '500', marginTop: 3, lineHeight: 17 },
  storePriceText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  storeAddText: { color: '#60a5fa', fontSize: 12, fontWeight: '600', marginTop: 2 },
  storeThumb: { width: 62, height: 62, borderRadius: 10, backgroundColor: '#222' },
  storeMiniLogo: { width: 22, height: 22, borderRadius: 4 },
  storeTapHint: { color: '#60a5fa', fontSize: 12, fontWeight: '600', marginTop: 3 },
  miniAddBtn: { backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  miniAddBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#222', borderRadius: 10, marginBottom: 8, padding: 3 },
  modeButton: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  modeActive: { backgroundColor: '#22c55e' },
  modeText: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  flyerCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#22c55e' },
  flyerMerchant: { color: '#22c55e', fontSize: 20, fontWeight: '800' },
  flyerName: { color: '#ddd', fontSize: 14, fontWeight: '500', marginTop: 4, lineHeight: 19 },
  flyerDate: { color: '#aaa', fontSize: 13, fontWeight: '500', marginTop: 6 },
  flyerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 10 },
  flyerSubtitle: { color: '#ddd', fontSize: 14, fontWeight: '500', marginTop: 4, lineHeight: 19 },
  flyerCount: { color: '#22c55e', fontSize: 15, fontWeight: '700', marginTop: 8, marginBottom: 12 },
  backButton: { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginTop: 14, alignSelf: 'flex-start' },
  backText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  storeHeaderBanner: { backgroundColor: '#0f2d1f', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#22c55e' },
  storeHeaderText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  storeHeaderCount: { color: '#22c55e', fontSize: 13, fontWeight: '600', marginTop: 2 },

  // === PREUVE CIRCULAIRE ===
  flyerProof: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d4d4d4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  flyerProofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  flyerProofLogo: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#fff' },
  flyerProofMerchant: { color: '#000', fontSize: 22, fontWeight: '800' },
  flyerProofLabel: { color: '#16a34a', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 },
  flyerProofUrgent: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  flyerProofUrgentText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  flyerProofImageWrap: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 20,
  },
  flyerProofImage: { width: '85%', height: 240, borderRadius: 8 },
  flyerProofName: {
    color: '#000',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    lineHeight: 26,
  },
  flyerProofPriceRow: {
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 10,
  },
  flyerProofPriceBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  flyerProofAddBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  flyerProofAddIcon: { color: '#fff', fontSize: 22, fontWeight: '900' },
  flyerProofAddText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  flyerProofPriceDollar: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 6 },
  flyerProofPrice: { color: '#fff', fontSize: 58, fontWeight: '900', lineHeight: 62 },
  flyerProofPriceCents: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 6 },
  flyerProofPriceAlt: { color: '#fff', fontSize: 20, fontWeight: '800' },
  flyerProofPriceDetail: { color: '#555', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  flyerProofDates: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
  },
  flyerProofDateItem: { flex: 1, alignItems: 'center' },
  flyerProofDateLabel: { color: '#666', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  flyerProofDateValue: { color: '#111', fontSize: 15, fontWeight: '800', marginTop: 3 },
  flyerProofDateDivider: { width: 1, height: 32, backgroundColor: '#d4d4d4' },
  flyerProofBadge: {
    backgroundColor: '#f0fdf4',
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
    padding: 12,
    alignItems: 'center',
  },
  flyerProofBadgeText: { color: '#15803d', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  countryBanner: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 12, marginBottom: 6,
    alignSelf: 'flex-start',
  },
  countryBannerText: { color: '#86efac', fontSize: 12, fontWeight: '700' },

  euComingSoonBox: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, margin: 4, marginTop: 8,
    borderWidth: 1, borderColor: '#3b4f8a',
  },
  euComingSoonTitle: { color: '#93c5fd', fontSize: 14, fontWeight: '800', marginBottom: 6 },
  euComingSoonText: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },
});
