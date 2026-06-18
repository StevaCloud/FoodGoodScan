import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import { scanProduct } from '../services/api';
import axios from 'axios';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';
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
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const navigation = useNavigation<any>();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [selectedFlyer, setSelectedFlyer] = useState<Flyer | null>(null);
  const [flyerItems, setFlyerItems] = useState<Deal[]>([]);
  const [loadingFlyers, setLoadingFlyers] = useState(false);
  const [viewMode, setViewMode] = useState<'search' | 'flyers'>('flyers');

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
        }));
      setOtherStores(items);
    } catch {} finally { setLoadingStores(false); }
  };

  const handleAddToList = (deal: Deal) => {
    addGroceryItem(deal.name, deal.merchant, deal.price);
    setSelectedDeal(null);
    Alert.alert('Ajouté!', `${deal.name} ajouté à ta liste d'épicerie`);
  };

  useEffect(() => {
    if (hasAccess && token) loadFlyers();
  }, [hasAccess, token]);

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
      <View style={styles.locked}>
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
      </View>
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
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedDeal(null)} style={styles.backButton}>
          <Text style={styles.backText}>{'<'} Retour</Text>
        </TouchableOpacity>

        {selectedDeal.imageUrl ? (
          <Image source={{ uri: selectedDeal.imageUrl }} style={styles.detailImage} resizeMode="contain" />
        ) : null}

        <View style={styles.detailHeader}>
          <View style={styles.detailMerchantBadge}>
            <Text style={styles.detailMerchantText}>{selectedDeal.merchant}</Text>
          </View>
          {selectedDeal.price && (
            <Text style={styles.detailPrice}>${selectedDeal.price.toFixed(2)}</Text>
          )}
        </View>

        <Text style={styles.detailName}>{selectedDeal.name}</Text>

        <View style={styles.detailInfoCard}>
          <View style={styles.detailInfoRow}>
            <Text style={styles.detailInfoLabel}>Magasin</Text>
            <Text style={styles.detailInfoValue}>{selectedDeal.merchant}</Text>
          </View>
          {selectedDeal.price && (
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoLabel}>Prix spécial</Text>
              <Text style={[styles.detailInfoValue, { color: '#22c55e' }]}>${selectedDeal.price.toFixed(2)}</Text>
            </View>
          )}
          {selectedDeal.priceText && (
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoLabel}>Détails prix</Text>
              <Text style={styles.detailInfoValue}>{selectedDeal.priceText}</Text>
            </View>
          )}
          <View style={styles.detailInfoRow}>
            <Text style={styles.detailInfoLabel}>Catégorie</Text>
            <Text style={styles.detailInfoValue}>{selectedDeal.category || 'Alimentation'}</Text>
          </View>
          <View style={[styles.detailInfoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailInfoLabel}>Valide jusqu'au</Text>
            <Text style={styles.detailInfoValue}>{new Date(selectedDeal.validUntil).toLocaleDateString('fr-CA')}</Text>
          </View>
        </View>

        <View style={styles.otherStoresCard}>
          <Text style={styles.otherStoresTitle}>Disponible dans les épiceries</Text>
          {loadingStores && (
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <ActivityIndicator size="small" color="#22c55e" />
              <Text style={{ color: '#ccc', marginTop: 6, fontSize: 12 }}>Recherche dans les circulaires...</Text>
            </View>
          )}
          {!loadingStores && otherStores.length > 0 && (
            otherStores
              .sort((a, b) => (a.price || 999) - (b.price || 999))
              .map((store, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.storeRow, i === 0 && styles.storeRowBest]}
                onPress={() => {
                  addGroceryItem(store.name, store.merchant, store.price);
                  Alert.alert('Ajouté!', `${store.name} (${store.merchant}) ajouté à ta liste`);
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.storeNameText}>{store.merchant}</Text>
                    {i === 0 && <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>MEILLEUR PRIX</Text></View>}
                  </View>
                  <Text style={styles.storeProductText} numberOfLines={1}>{store.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.storePriceText, i === 0 && { color: '#22c55e' }]}>${store.price?.toFixed(2)}</Text>
                  <Text style={styles.storeAddText}>+ Liste</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          {!loadingStores && otherStores.length === 0 && (
            <Text style={{ color: '#bbb', fontSize: 13, textAlign: 'center', marginVertical: 12 }}>Aucun autre magasin trouvé cette semaine</Text>
          )}
        </View>

        <TouchableOpacity style={styles.addToListButton} onPress={() => handleAddToList(selectedDeal)}>
          <Text style={styles.addToListButtonText}>Ajouter à ma liste d'épicerie</Text>
        </TouchableOpacity>

        <Text style={styles.scanTipText}>Pour voir les ingrédients et la valeur nutritive, scanne le code-barres du produit en magasin.</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  if (selectedFlyer) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => { setSelectedFlyer(null); setFlyerItems([]); }} style={styles.backButton}>
          <Text style={styles.backText}>{'<'} Retour aux circulaires</Text>
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
          <FlatList
            data={flyerItems}
            renderItem={renderDeal}
            keyExtractor={(item) => String(item.id)}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <FlatList
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
        <FlatList
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
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
  quickChip: { backgroundColor: '#1a2a1a', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: '#2a3a2a' },
  quickChipActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  quickChipText: { color: '#22c55e', fontSize: 12 },
  quickChipTextActive: { color: '#fff', fontWeight: 'bold' },
  storeFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  storeChip: { backgroundColor: '#222', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  storeChipActive: { backgroundColor: '#3b82f6' },
  storeChipText: { color: '#ccc', fontSize: 11 },
  storeChipTextActive: { color: '#fff', fontWeight: 'bold' },
  loadingContainer: { alignItems: 'center', marginTop: 40 },
  loadingText: { color: '#22c55e', marginTop: 10, fontSize: 14 },
  dealCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  dealImage: { width: 90, height: 90 },
  dealInfo: { flex: 1, padding: 10 },
  dealStore: { color: '#22c55e', fontSize: 11, fontWeight: 'bold' },
  dealName: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  salePrice: { color: '#22c55e', fontSize: 17, fontWeight: 'bold' },
  priceText: { color: '#ccc', fontSize: 12 },
  validDate: { color: '#ccc', fontSize: 11, marginTop: 4 },
  locked: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', padding: 32 },
  lockedTitle: { color: '#f97316', fontSize: 24, fontWeight: 'bold' },
  lockedSubtitle: { color: '#fb923c', fontSize: 14, marginTop: 4, marginBottom: 16 },
  lockedText: { color: '#ccc', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  upgradeButton: { backgroundColor: '#22c55e', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center' },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#bbb', textAlign: 'center', marginTop: 40, fontSize: 14 },
  clickHint: { color: '#3b82f6', fontSize: 10, marginTop: 4 },
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
  otherStoresCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginTop: 16 },
  otherStoresTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  storeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  storeRowBest: { backgroundColor: '#0f2d1f', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 8 },
  storeNameText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  bestBadge: { backgroundColor: '#22c55e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bestBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  storeProductText: { color: '#ccc', fontSize: 12, marginTop: 2 },
  storePriceText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  storeAddText: { color: '#3b82f6', fontSize: 10, marginTop: 2 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#222', borderRadius: 10, marginBottom: 12, padding: 3 },
  modeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  modeActive: { backgroundColor: '#22c55e' },
  modeText: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  flyerCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#22c55e' },
  flyerMerchant: { color: '#22c55e', fontSize: 18, fontWeight: 'bold' },
  flyerName: { color: '#ccc', fontSize: 13, marginTop: 4 },
  flyerDate: { color: '#bbb', fontSize: 12, marginTop: 6 },
  flyerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  flyerSubtitle: { color: '#ccc', fontSize: 13, marginTop: 4 },
  flyerCount: { color: '#22c55e', fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 12 },
  backButton: { paddingVertical: 10, marginTop: 10 },
  backText: { color: '#3b82f6', fontSize: 15 },
});
