import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { scanProduct } from '../services/api';
import { useStore } from '../store/useStore';
import axios from 'axios';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';
import { usePostalCode } from '../hooks/usePostalCode';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FlippDeal {
  id: number;
  name: string;
  merchant: string;
  price: number | null;
  imageUrl: string;
  validUntil: string;
}

const CATEGORIES = [
  {
    id: 'water', name: 'Eaux', color: '#3b82f6', searchTerm: 'eau',
    products: [
      { name: 'Evian 500ml', code: '3068320055008', note: 'pH 7.2 — Excellente' },
      { name: 'Evian 33cl', code: '3068320063003', note: 'pH 7.2 — Petit format' },
      { name: 'Evian 1L', code: '3068320055015', note: 'pH 7.2 — Grand format' },
      { name: 'Volvic 1.5L', code: '3057640100178', note: 'pH 7.0 — Volcans d\'Auvergne' },
      { name: 'Volvic 50cl', code: '3057640117008', note: 'pH 7.0 — Petit format' },
      { name: 'Cristaline', code: '3274080005003', note: 'pH 7.5 — Eau de source' },
      { name: 'Aquafina', code: '0012000001086', note: 'pH 5.8 — Eau purifiée PepsiCo' },
      { name: 'San Pellegrino', code: '8002270014901', note: 'pH 7.7 — Gazeuse italienne' },
      { name: 'Gerolsteiner', code: '4104450018113', note: 'pH 6.5 — Très minéralisée' },
    ],
  },
  {
    id: 'soda', name: 'Boissons gazeuses', color: '#ef4444', searchTerm: 'boisson gazeuse',
    products: [
      { name: 'Coca-Cola', code: '5449000000996', note: 'Le classique' },
      { name: 'Coca-Cola Zero', code: '5449000131829', note: 'Sans sucre' },
      { name: 'Coca-Cola 500ml', code: '5449000054227', note: 'Bouteille' },
      { name: 'Coca-Cola Zero Sugar', code: '5449000131805', note: 'Canette' },
      { name: 'Sprite', code: '5449000014535', note: 'Citron-lime' },
      { name: 'Fanta Orange', code: '5449000011527', note: 'Orange' },
      { name: 'Fuze Tea Peach', code: '5449000189325', note: 'Thé glacé pêche' },
      { name: 'Red Bull', code: '9002490100070', note: 'Boisson énergisante' },
    ],
  },
  {
    id: 'chocolate', name: 'Chocolat & Confiserie', color: '#92400e', searchTerm: 'chocolat',
    products: [
      { name: 'Nutella', code: '3017620422003', note: 'Pâte à tartiner' },
      { name: 'Nutella B-ready', code: '8000500217078', note: 'Biscuit Nutella' },
      { name: 'Kinder Bueno', code: '8000500037560', note: 'Barre chocolatée' },
      { name: 'Milka Chocolat au lait', code: '3045140105502', note: 'Chocolat au lait' },
      { name: 'Lindt 85% Cacao', code: '3046920028363', note: 'Chocolat noir' },
      { name: 'Toblerone', code: '7614500010013', note: 'Chocolat suisse' },
      { name: 'Snickers', code: '5000159461122', note: 'Cacahuètes caramel' },
      { name: 'Twix', code: '5000159459228', note: 'Biscuit caramel' },
    ],
  },
  {
    id: 'chips', name: 'Chips & Snacks salés', color: '#d97706', searchTerm: 'chips',
    products: [
      { name: 'Pringles Original', code: '5053990101573', note: 'Croustilles' },
      { name: 'Tuc Original', code: '5410041001204', note: 'Crackers salés' },
      { name: 'Quaker Cruesli Noix', code: '3168930010265', note: 'Mélange de noix' },
    ],
  },
  {
    id: 'dairy', name: 'Produits laitiers', color: '#0891b2', searchTerm: 'fromage',
    products: [
      { name: 'Président Emmental', code: '3228021170022', note: 'Fromage râpé' },
    ],
  },
  {
    id: 'pasta', name: 'Pâtes & Sauces', color: '#ca8a04', searchTerm: 'pâtes',
    products: [
      { name: 'Barilla Spaghetti N°5', code: '8076800195057', note: 'Pâtes classiques' },
      { name: 'Barilla Penne Rigate', code: '8076802085738', note: 'Pâtes courtes' },
      { name: 'Barilla Sauce Bolognese', code: '8076809513678', note: 'Sauce tomate viande' },
    ],
  },
  {
    id: 'cereal', name: 'Céréales & Petit-déjeuner', color: '#16a34a', searchTerm: 'céréales',
    products: [
      { name: 'Nesquik Cacao', code: '3033710065967', note: 'Chocolat en poudre' },
      { name: 'Chocapic', code: '7613034626844', note: 'Céréales chocolat' },
      { name: 'Weetabix', code: '5010029215618', note: 'Céréales blé complet' },
      { name: 'Gerblé Pomme Noisette', code: '3175681851849', note: 'Biscuits santé' },
    ],
  },
  {
    id: 'meat', name: 'Viandes', color: '#b91c1c', searchTerm: 'poulet',
    products: [],
  },
  {
    id: 'fruit', name: 'Fruits & Légumes', color: '#15803d', searchTerm: 'fruits',
    products: [],
  },
  {
    id: 'bread', name: 'Pains & Boulangerie', color: '#a16207', searchTerm: 'pain',
    products: [
      { name: 'Harrys Pain Complet', code: '3228857000906', note: 'Pain de mie' },
    ],
  },
  {
    id: 'cookies', name: 'Biscuits & Gâteaux', color: '#a855f7', searchTerm: 'biscuits',
    products: [
      { name: 'Prince Chocolat', code: '7622210449283', note: 'Biscuit blé complet' },
      { name: 'Oreo Chocolat', code: '7622300489434', note: 'Biscuit sandwich' },
    ],
  },
  {
    id: 'frozen', name: 'Surgelés & Pizza', color: '#6366f1', searchTerm: 'pizza',
    products: [
      { name: 'Dr. Oetker Pizza Mozzarella', code: '4001724819806', note: 'Pizza surgelée' },
    ],
  },
  {
    id: 'sauce', name: 'Sauces & Condiments', color: '#dc2626', searchTerm: 'sauce',
    products: [
      { name: 'Heinz Ketchup', code: '87157277', note: 'Le classique' },
    ],
  },
  {
    id: 'coffee', name: 'Café & Boissons chaudes', color: '#78350f', searchTerm: 'café',
    products: [
      { name: 'Nescafé Dolce Gusto Cappuccino', code: '7613036271868', note: 'Capsules' },
      { name: 'Minute Maid Orange', code: '90494024', note: 'Jus d\'orange' },
    ],
  },
];

export function ExploreScreen() {
  const navigation = useNavigation<any>();
  const setLastScannedProduct = useStore((s) => s.setLastScannedProduct);
  const { t } = useTranslation();
  const postalCode = usePostalCode();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState('');
  const [flippDeals, setFlippDeals] = useState<FlippDeal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [dealsCategory, setDealsCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<FlippDeal[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const toggleCategory = (id: string) => {
    if (openCategory === id) {
      setOpenCategory(null);
      setFlippDeals([]);
      setDealsCategory(null);
    } else {
      setOpenCategory(id);
      setFlippDeals([]);
      setDealsCategory(null);
    }
  };

  const handleProduct = async (code: string) => {
    if (loading) return;
    setLoading(code);
    try {
      const product = await scanProduct(code);
      setLastScannedProduct(product);
      navigation.navigate('Product');
    } catch {} finally {
      setLoading('');
    }
  };

  const loadFlippDeals = async (searchTerm: string, catId: string) => {
    if (loadingDeals) return;
    if (dealsCategory === catId) {
      setDealsCategory(null);
      setFlippDeals([]);
      return;
    }
    setLoadingDeals(true);
    setDealsCategory(catId);
    try {
      const url = `https://backflipp.wishabi.com/flipp/items/search?q=${encodeURIComponent(searchTerm)}&postal_code=${postalCode}&locale=fr`;
      const { data } = await axios.get(url);
      const items = (data.items || []).map((i: any) => ({
        id: i.id || i.flyer_item_id,
        name: i.name || '',
        merchant: i.merchant_name || '',
        price: i.current_price || null,
        imageUrl: i.clipping_image_url || '',
        validUntil: i.valid_to || '',
      }));
      setFlippDeals(items);
    } catch {
      try {
        const { data } = await axios.get(`${API_URL}/deals`, {
          params: { search: searchTerm, postal_code: 'J1H1A1' },
          headers: { Authorization: `Bearer ${useStore.getState().token}` },
        });
        setFlippDeals(data);
      } catch {
        setFlippDeals([]);
      }
    } finally {
      setLoadingDeals(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearch(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const url = `https://backflipp.wishabi.com/flipp/items/search?q=${encodeURIComponent(text)}&postal_code=${postalCode}&locale=fr`;
      const { data } = await axios.get(url);
      setSearchResults((data.items || []).map((i: any) => ({
        id: i.id || i.flyer_item_id,
        name: i.name || '',
        merchant: i.merchant_name || '',
        price: i.current_price || null,
        imageUrl: i.clipping_image_url || '',
        validUntil: i.valid_to || '',
      })));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}><View /><LanguageSelector /></View>
      <Text style={styles.title}>{t('explore.title')}</Text>
      <Text style={styles.subtitle}>{CATEGORIES.length} {t('explore.subtitle')}</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un produit dans les circulaires..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={handleSearch}
      />

      {searchLoading && (
        <View style={styles.searchLoading}>
          <ActivityIndicator size="small" color="#22c55e" />
          <Text style={styles.searchLoadingText}>Recherche...</Text>
        </View>
      )}

      {search.length >= 2 && searchResults.length > 0 && (
        <View style={styles.searchResultsSection}>
          <Text style={styles.searchResultsTitle}>{searchResults.length} résultats pour "{search}"</Text>
          {searchResults.map((deal) => (
            <View key={deal.id} style={styles.dealCard}>
              {deal.imageUrl ? <Image source={{ uri: deal.imageUrl }} style={styles.dealImage} /> : null}
              <View style={styles.dealInfo}>
                <Text style={styles.dealStore}>{deal.merchant}</Text>
                <Text style={styles.dealName} numberOfLines={2}>{deal.name}</Text>
                {deal.price && <Text style={styles.dealPrice}>${deal.price.toFixed(2)}</Text>}
                {deal.validUntil && <Text style={styles.dealDate}>Jusqu'au {new Date(deal.validUntil).toLocaleDateString('fr-CA')}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {search.length >= 2 && searchResults.length === 0 && !searchLoading && (
        <Text style={styles.noDeals}>Aucun résultat pour "{search}"</Text>
      )}

      {CATEGORIES.map((cat) => {
        const isOpen = openCategory === cat.id;
        const showDeals = dealsCategory === cat.id;
        return (
          <View key={cat.id} style={styles.categorySection}>
            <TouchableOpacity
              style={[styles.categoryHeader, { borderLeftColor: cat.color }]}
              onPress={() => toggleCategory(cat.id)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryLeft}>
                <Text style={[styles.categoryName, { color: cat.color }]}>{cat.name}</Text>
                <Text style={styles.categoryCount}>
                  {cat.products.length} produits
                </Text>
              </View>
              <Text style={[styles.arrow, { color: cat.color }]}>{isOpen ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={styles.productList}>
                <TouchableOpacity
                  style={[styles.flippButton, { borderColor: cat.color }]}
                  onPress={() => loadFlippDeals(cat.searchTerm, cat.id)}
                >
                  {loadingDeals && dealsCategory === cat.id ? (
                    <ActivityIndicator size="small" color={cat.color} />
                  ) : (
                    <Text style={[styles.flippButtonText, { color: cat.color }]}>
                      {showDeals ? '✕ Fermer les spéciaux' : '$ Voir les spéciaux en circulaire'}
                    </Text>
                  )}
                </TouchableOpacity>

                {showDeals && flippDeals.length > 0 && (
                  <View style={styles.dealsSection}>
                    <Text style={styles.dealsTitle}>{flippDeals.length} spéciaux cette semaine</Text>
                    {flippDeals.map((deal) => (
                      <View key={deal.id} style={styles.dealCard}>
                        {deal.imageUrl ? (
                          <Image source={{ uri: deal.imageUrl }} style={styles.dealImage} />
                        ) : null}
                        <View style={styles.dealInfo}>
                          <Text style={[styles.dealStore, { color: cat.color }]}>{deal.merchant}</Text>
                          <Text style={styles.dealName} numberOfLines={2}>{deal.name}</Text>
                          {deal.price && <Text style={styles.dealPrice}>${deal.price.toFixed(2)}</Text>}
                          {deal.validUntil && (
                            <Text style={styles.dealDate}>
                              Jusqu'au {new Date(deal.validUntil).toLocaleDateString('fr-CA')}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {showDeals && flippDeals.length === 0 && !loadingDeals && (
                  <Text style={styles.noDeals}>Aucun spécial trouvé cette semaine</Text>
                )}

                {cat.products.length > 0 && (
                  <Text style={styles.productsLabel}>Produits à scanner :</Text>
                )}

                {cat.products.map((p) => (
                  <TouchableOpacity
                    key={p.code}
                    style={styles.productItem}
                    onPress={() => handleProduct(p.code)}
                    disabled={loading === p.code}
                  >
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productNote}>{p.note}</Text>
                    </View>
                    {loading === p.code ? (
                      <ActivityIndicator size="small" color={cat.color} />
                    ) : (
                      <Text style={styles.productArrow}>{'>'}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, zIndex: 100 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  subtitle: { color: '#bbb', fontSize: 13, marginBottom: 20, marginTop: 4 },
  categorySection: { marginBottom: 4 },
  categoryHeader: {
    borderLeftWidth: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: { flex: 1 },
  categoryName: { fontSize: 17, fontWeight: 'bold' },
  categoryCount: { color: '#bbb', fontSize: 12, marginTop: 2 },
  arrow: { fontSize: 14 },
  productList: { paddingLeft: 16, paddingTop: 8, paddingBottom: 8 },
  flippButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#111',
  },
  flippButtonText: { fontSize: 14, fontWeight: '600' },
  dealsSection: { marginBottom: 12 },
  dealsTitle: { color: '#22c55e', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  dealCard: {
    backgroundColor: '#222',
    borderRadius: 10,
    marginBottom: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  dealImage: { width: 70, height: 70 },
  dealInfo: { flex: 1, padding: 10 },
  dealStore: { fontSize: 11, fontWeight: 'bold' },
  dealName: { color: '#ddd', fontSize: 13, marginTop: 2 },
  dealPrice: { color: '#22c55e', fontSize: 17, fontWeight: 'bold', marginTop: 4 },
  dealDate: { color: '#ccc', fontSize: 10, marginTop: 2 },
  noDeals: { color: '#bbb', textAlign: 'center', paddingVertical: 12, fontSize: 13 },
  productsLabel: { color: '#ccc', fontSize: 12, marginTop: 8, marginBottom: 4 },
  productItem: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: { flex: 1 },
  productName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  productNote: { color: '#ccc', fontSize: 12, marginTop: 2 },
  productArrow: { color: '#aaa', fontSize: 16 },
  searchInput: { backgroundColor: '#222', color: '#fff', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  searchLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  searchLoadingText: { color: '#22c55e', fontSize: 13 },
  searchResultsSection: { marginBottom: 16 },
  searchResultsTitle: { color: '#22c55e', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
});
