import React, { useEffect, useRef, useState } from 'react';
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
import { usePostalCode } from '../hooks/usePostalCode';

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

const STORES = ['IGA', 'Metro', 'Super C', 'Maxi', 'Walmart', 'Provigo', 'Adonis'];

export function DealsScreen() {
  const weatherBg = useWeatherBg();
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [selectedFlyer, setSelectedFlyer] = useState<Flyer | null>(null);
  const [flyerItems, setFlyerItems] = useState<Deal[]>([]);
  const [loadingFlyers, setLoadingFlyers] = useState(false);
  const [viewMode, setViewMode] = useState<'search' | 'flyers'>('flyers');
  const returnToTab = useRef<string | null>(null);

  const hasAccess = user?.plan === 'PREMIUM' && user?.groceryAddon;
  const { t } = useTranslation();
  const postalCode = usePostalCode();
  const setLastScannedProduct = useStore((s) => s.setLastScannedProduct);
  const addGroceryItem = useStore((s) => s.addGroceryItem);
  const [scanningDeal, setScanningDeal] = useState<number | null>(null);

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [otherStores, setOtherStores] = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

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
    addGroceryItem(deal.name, deal.merchant, deal.price, undefined, deal.imageUrl);
    setSelectedDeal(null);
    showToast(`${deal.name} ajouté à ta liste`);
  };

  useEffect(() => {
    if (hasAccess && token) loadFlyers();
  }, [hasAccess, token]);

  // Ouvre directement la fiche produit passée en paramètre (depuis DietScreen ou Liste)
  useEffect(() => {
    const dealItem = route.params?.dealItem;
    if (!dealItem) return;
    returnToTab.current = route.params?.returnTo || 'Régime';
    setSelectedDeal(dealItem);
    setOtherStores([]);
    navigation.setParams({ dealItem: undefined, returnTo: undefined });
  }, [route.params?.dealItem]);

  // Recherche automatique depuis un autre écran (ex: DietScreen)
  useEffect(() => {
    const q = route.params?.searchQuery;
    if (!q) return;
    setViewMode('search');
    setSearch(q);
    setSelectedDeal(null);
    navigation.setParams({ searchQuery: undefined });
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

  const handleStoreFilter = (store: string | null) => {
    setSelectedStore(store);
    if (search.length >= 2) {
      searchDeals(search, store || undefined);
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
          <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.upgradeButtonText}>Premium requis — $3.99/mois</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: '#f97316' }]} onPress={() => navigation.navigate('Profile')}>
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
          {item.price ? (
            <Text style={styles.salePrice}>${item.price.toFixed(2)}</Text>
          ) : (
            <Text style={styles.salePrice}>Voir circulaire</Text>
          )}
          {item.priceText ? (
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
            if (returnToTab.current) {
              const tab = returnToTab.current;
              returnToTab.current = null;
              navigation.navigate(tab);
            }
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
              {selectedDeal.price ? (
                <>
                  <Text style={styles.flyerProofPriceDollar}>$</Text>
                  <Text style={styles.flyerProofPrice}>{Math.floor(selectedDeal.price)}</Text>
                  <Text style={styles.flyerProofPriceCents}>{(selectedDeal.price % 1).toFixed(2).substring(1)}</Text>
                </>
              ) : (
                <Text style={styles.flyerProofPriceAlt}>Voir prix en magasin</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.flyerProofAddBtn}
              onPress={() => handleAddToList(selectedDeal)}
            >
              <Text style={styles.flyerProofAddIcon}>+</Text>
              <Text style={styles.flyerProofAddText}>Ajouter à ma liste</Text>
            </TouchableOpacity>
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
                    <Text style={[styles.storePriceText, i === 0 && { color: '#22c55e' }]}>${store.price?.toFixed(2)}</Text>
                    <TouchableOpacity
                      style={styles.miniAddBtn}
                      onPress={() => {
                        addGroceryItem(store.name, store.merchant, store.price, undefined, storeImg);
                        showToast(`${store.name} ajouté à ta liste`);
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
            if (returnToTab.current) {
              const tab = returnToTab.current;
              returnToTab.current = null;
              navigation.navigate(tab);
            }
          }}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{'<'} {returnToTab.current ? 'Retour' : 'Retour aux circulaires'}</Text>
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
      <Text style={styles.title}>{t('deals.title')}</Text>
      <Text style={styles.subtitle}>{t('deals.subtitle')}</Text>

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

      {viewMode === 'flyers' ? (
        loadingFlyers ? (
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Recherche dans les circulaires...</Text>
        </View>
      ) : (
        <FlatList style={{ backgroundColor: 'transparent' }}
          data={deals}
          renderItem={renderDeal}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            search.length >= 2 ? (
              <Text style={styles.emptyText}>Aucun solde trouvé pour "{search}"</Text>
            ) : (
              <Text style={styles.emptyText}>Tape un produit ou clique sur une recherche rapide</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: 'transparent' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, zIndex: 100 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  subtitle: { color: '#22c55e', fontSize: 13, marginBottom: 16, marginTop: 4 },
  searchInput: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickSearches: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  quickChip: { backgroundColor: '#1a2a1a', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#2a3a2a' },
  quickChipActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  quickChipText: { color: '#22c55e', fontSize: 13, fontWeight: '600' },
  quickChipTextActive: { color: '#fff', fontWeight: '800' },
  storeFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  storeChip: { backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
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
  modeToggle: { flexDirection: 'row', backgroundColor: '#222', borderRadius: 10, marginBottom: 12, padding: 3 },
  modeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
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
  backButton: { paddingVertical: 10, marginTop: 10 },
  backText: { color: '#3b82f6', fontSize: 15 },

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
});
