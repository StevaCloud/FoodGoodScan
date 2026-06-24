import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { HealthScoreBadge } from '../components/HealthScoreBadge';
import { showToast } from '../components/Toast';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { NutriScoreBar } from '../components/NutriScoreBar';
import { addFavorite } from '../services/api';
import axios from 'axios';
import { usePostalCode } from '../hooks/usePostalCode';

interface PriceDeal {
  merchant: string;
  price: number | null;
  name: string;
  validUntil: string;
}

export function ProductScreen() {
  const weatherBg = useWeatherBg();
  const product = useStore((s) => s.lastScannedProduct);
  const navigation = useNavigation<any>();
  const postalCode = usePostalCode();
  const [prices, setPrices] = useState<PriceDeal[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const addGroceryItem = useStore((s) => s.addGroceryItem);

  const addToGroceryList = (name: string, store: string, price: number | null) => {
    const n = product?.nutriments || {};
    addGroceryItem(name, store, price, {
      calories: n['energy-kcal_100g'] || Math.round((n.energy_100g || 0) / 4.184),
      fat: n.fat_100g || 0,
      sugars: n.sugars_100g || 0,
      proteins: n.proteins_100g || 0,
      salt: n.salt_100g || 0,
      healthScore: product?.healthScore || 0,
    });
    showToast(`${name} ajouté à ta liste`);
  };

  useEffect(() => {
    setPrices([]);
    setShowPrices(false);
  }, [product]);

  const loadPrices = async () => {
    if (!product) return;
    if (showPrices) { setShowPrices(false); return; }
    setLoadingPrices(true);
    setShowPrices(true);
    try {
      const searchName = product.name.split(' ').slice(0, 3).join(' ');
      const url = `https://backflipp.wishabi.com/flipp/items/search?q=${encodeURIComponent(searchName)}&postal_code=${postalCode}&locale=fr`;
      const { data } = await axios.get(url);
      const items = (data.items || [])
        .filter((i: any) => i.current_price)
        .map((i: any) => ({
          merchant: i.merchant_name || '',
          price: i.current_price,
          name: i.name || '',
          validUntil: i.valid_to || '',
        }));
      setPrices(items);
    } catch { setPrices([]); } finally { setLoadingPrices(false); }
  };

  if (!product) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucun produit scanné</Text>
      </View>
    );
  }

  const handleFavorite = async () => {
    try {
      await addFavorite(product.barcode);
      Alert.alert('Sauvegardé!', `${product.name} ajouté à tes scans`);
    } catch {
      Alert.alert('Sauvegardé!', `${product.name} ajouté à tes scans`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: weatherBg }]}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Text style={styles.noImageText}>Pas d'image</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{product.name}</Text>
          {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
          {product.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category.name}</Text>
            </View>
          )}
        </View>
        <HealthScoreBadge score={product.healthScore} />
      </View>

      <NutriScoreBar grade={product.nutriScore} />

      {product.waterInfo && product.waterInfo.ph > 0 && (
        <View style={styles.waterSection}>
          <Text style={styles.sectionTitle}>Analyse de l'eau</Text>
          <View style={styles.phRow}>
            <Text style={styles.phLabel}>pH</Text>
            <Text style={[styles.phValue, { color: product.waterInfo.ph >= 6.5 && product.waterInfo.ph <= 8.0 ? '#22c55e' : '#f97316' }]}>
              {product.waterInfo.ph}
            </Text>
            <Text style={styles.phRating}>{product.waterInfo.phRating}</Text>
          </View>
          <View style={styles.phBar}>
            <View style={[styles.phIndicator, { left: `${Math.min(Math.max((product.waterInfo.ph - 4) / 7 * 100, 0), 100)}%` }]} />
            <Text style={[styles.phScale, { left: '0%' }]}>4</Text>
            <Text style={[styles.phScale, { left: '36%' }]}>6.5</Text>
            <Text style={[styles.phScale, { left: '57%' }]}>8</Text>
            <Text style={[styles.phScale, { right: '0%' }]}>11</Text>
          </View>
          <Text style={[styles.waterVerdict, { color: product.waterInfo.verdict.includes('Excellent') ? '#22c55e' : product.waterInfo.verdict.includes('Très') ? '#84cc16' : '#eab308' }]}>
            Verdict: {product.waterInfo.verdict}
          </Text>
          {product.waterInfo.minerals && (
            <View style={styles.mineralsGrid}>
              {product.waterInfo.minerals.calcium > 0 && <Text style={styles.mineralItem}>Calcium: {product.waterInfo.minerals.calcium} mg/L</Text>}
              {product.waterInfo.minerals.magnesium > 0 && <Text style={styles.mineralItem}>Magnésium: {product.waterInfo.minerals.magnesium} mg/L</Text>}
              {product.waterInfo.minerals.sodium > 0 && <Text style={styles.mineralItem}>Sodium: {product.waterInfo.minerals.sodium} mg/L</Text>}
              {product.waterInfo.minerals.potassium > 0 && <Text style={styles.mineralItem}>Potassium: {product.waterInfo.minerals.potassium} mg/L</Text>}
              {product.waterInfo.minerals.bicarbonate > 0 && <Text style={styles.mineralItem}>Bicarbonate: {product.waterInfo.minerals.bicarbonate} mg/L</Text>}
              {product.waterInfo.minerals.silica > 0 && <Text style={styles.mineralItem}>Silice: {product.waterInfo.minerals.silica} mg/L</Text>}
            </View>
          )}
          <Text style={styles.waterSource}>Source: {product.waterInfo.source}</Text>
          {product.waterInfo.details?.map((d: string, i: number) => (
            <Text key={i} style={styles.waterDetail}>{'•'} {d}</Text>
          ))}
          <Text style={styles.tdsLabel}>TDS: {product.waterInfo.tds} mg/L {product.waterInfo.tds < 300 ? '(Eau légère)' : product.waterInfo.tds < 600 ? '(Eau moyenne)' : '(Eau très minéralisée)'}</Text>
        </View>
      )}

      {product.pros && product.pros.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points positifs</Text>
          {product.pros.map((pro: string, i: number) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.proIcon}>+</Text>
              <Text style={styles.proText}>{pro}</Text>
            </View>
          ))}
        </View>
      )}

      {product.cons && product.cons.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points négatifs</Text>
          {product.cons.map((con: string, i: number) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.conIcon}>-</Text>
              <Text style={styles.conText}>{con}</Text>
            </View>
          ))}
        </View>
      )}

      {product.premium && product.allergens?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergènes</Text>
          <View style={styles.tags}>
            {product.allergens.map((a: string, i: number) => (
              <View key={i} style={styles.allergenTag}>
                <Text style={styles.allergenText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {product.premium && product.additivesDetails?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additifs ({product.additivesDetails.length})</Text>
          {product.additivesDetails.map((a: any, i: number) => {
            const riskColor = a.risk === 'critique' ? '#dc2626' : a.risk === 'eleve' ? '#ef4444' : a.risk === 'modere' ? '#f97316' : '#22c55e';
            const riskLabel = a.risk === 'critique' ? 'CRITIQUE' : a.risk === 'eleve' ? 'ÉLEVÉ' : a.risk === 'modere' ? 'MODÉRÉ' : 'FAIBLE';
            return (
              <View key={i} style={styles.additiveCard}>
                <View style={styles.additiveHeader}>
                  <Text style={styles.additiveCode}>{a.code}</Text>
                  <View style={[styles.riskBadge, { backgroundColor: riskColor + '30', borderColor: riskColor }]}>
                    <Text style={[styles.riskText, { color: riskColor }]}>{riskLabel}</Text>
                  </View>
                </View>
                <Text style={styles.additiveName}>{a.name}</Text>
                <Text style={styles.additiveCategory}>{a.category}</Text>
                <Text style={styles.additiveDesc}>{a.description}</Text>
                {a.effects.length > 0 && (
                  <View style={styles.effectsList}>
                    {a.effects.map((effect: string, j: number) => (
                      <Text key={j} style={[styles.effectItem, { color: riskColor }]}>
                        {'⚠'} {effect}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {product.premium && product.additives?.length > 0 && (!product.additivesDetails || product.additivesDetails.length === 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additifs ({product.additives.length})</Text>
          {product.additives.map((a: string, i: number) => (
            <Text key={i} style={styles.additive}>{a}</Text>
          ))}
        </View>
      )}

      {product.premium && product.nutriments && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valeurs nutritives (pour 100g)</Text>
          {product.nutriments.energy_100g > 0 && (
            <View style={styles.nutriRow}>
              <Text style={styles.nutriLabel}>Énergie</Text>
              <Text style={styles.nutriValue}>{Math.round(product.nutriments['energy-kcal_100g'] || product.nutriments.energy_100g / 4.184)} kcal</Text>
            </View>
          )}
          {product.nutriments.fat_100g >= 0 && (
            <View style={styles.nutriRow}>
              <Text style={styles.nutriLabel}>Gras</Text>
              <Text style={[styles.nutriValue, product.nutriments.fat_100g > 20 ? {color:'#ef4444'} : product.nutriments.fat_100g > 10 ? {color:'#f97316'} : {color:'#22c55e'}]}>
                {product.nutriments.fat_100g}g
              </Text>
            </View>
          )}
          {product.nutriments['saturated-fat_100g'] >= 0 && (
            <View style={styles.nutriRow}>
              <Text style={styles.nutriLabelIndent}>dont saturés</Text>
              <Text style={[styles.nutriValue, product.nutriments['saturated-fat_100g'] > 5 ? {color:'#ef4444'} : {color:'#22c55e'}]}>
                {product.nutriments['saturated-fat_100g']}g
              </Text>
            </View>
          )}
          {product.nutriments.carbohydrates_100g >= 0 && (
            <View style={styles.nutriRow}>
              <Text style={styles.nutriLabel}>Glucides</Text>
              <Text style={styles.nutriValue}>{product.nutriments.carbohydrates_100g}g</Text>
            </View>
          )}
          {product.nutriments.sugars_100g >= 0 && (
            <View style={styles.nutriRow}>
              <Text style={styles.nutriLabelIndent}>dont sucres</Text>
              <Text style={[styles.nutriValue, product.nutriments.sugars_100g > 20 ? {color:'#ef4444'} : product.nutriments.sugars_100g > 10 ? {color:'#f97316'} : {color:'#22c55e'}]}>
                {product.nutriments.sugars_100g}g
              </Text>
            </View>
          )}
          {product.nutriments.fiber_100g > 0 && (
            <View style={styles.nutriRow}>
              <Text style={styles.nutriLabel}>Fibres</Text>
              <Text style={[styles.nutriValue, { color: '#22c55e' }]}>{product.nutriments.fiber_100g}g</Text>
            </View>
          )}
          {product.nutriments.proteins_100g >= 0 && (
            <View style={styles.nutriRow}>
              <Text style={styles.nutriLabel}>Protéines</Text>
              <Text style={[styles.nutriValue, product.nutriments.proteins_100g > 10 ? {color:'#22c55e'} : {}]}>
                {product.nutriments.proteins_100g}g
              </Text>
            </View>
          )}
          {product.nutriments.salt_100g >= 0 && (
            <View style={styles.nutriRow}>
              <Text style={styles.nutriLabel}>Sel</Text>
              <Text style={[styles.nutriValue, product.nutriments.salt_100g > 1.5 ? {color:'#ef4444'} : product.nutriments.salt_100g > 0.8 ? {color:'#f97316'} : {color:'#22c55e'}]}>
                {product.nutriments.salt_100g}g
              </Text>
            </View>
          )}
        </View>
      )}

      {!product.premium && (
        <View style={styles.premiumBanner}>
          <Text style={styles.premiumTitle}>Analyse complète</Text>
          <Text style={styles.premiumText}>
            Passe au Premium pour voir les additifs, allergènes, ingrédients détaillés et plus.
          </Text>
          <Text style={styles.premiumPrice}>$3.99/mois</Text>
        </View>
      )}

      <TouchableOpacity style={styles.priceButton} onPress={loadPrices}>
        {loadingPrices ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.priceButtonText}>
            {showPrices ? '✕ Fermer les prix' : '$ Voir les prix spéciaux de cette semaine'}
          </Text>
        )}
      </TouchableOpacity>

      {showPrices && prices.length > 0 && (
        <View style={styles.priceSection}>
          <Text style={styles.priceSectionTitle}>{prices.length} prix trouvés cette semaine</Text>
          {prices.map((p, i) => (
            <TouchableOpacity key={i} style={styles.priceCard} onPress={() => addToGroceryList(p.name, p.merchant, p.price)}>
              <View style={styles.priceInfo}>
                <Text style={styles.priceStore}>{p.merchant}</Text>
                <Text style={styles.priceName} numberOfLines={2}>{p.name}</Text>
                {p.validUntil && (
                  <Text style={styles.priceDate}>Jusqu'au {new Date(p.validUntil).toLocaleDateString('fr-CA')}</Text>
                )}
                <Text style={styles.addToListHint}>Clique pour ajouter à la liste</Text>
              </View>
              <Text style={styles.priceValue}>${p.price?.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showPrices && prices.length === 0 && !loadingPrices && (
        <View style={styles.noPriceSection}>
          <Text style={styles.noPriceText}>Aucun prix en circulaire cette semaine pour ce produit</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.saveButton} onPress={handleFavorite}>
          <Text style={styles.saveButtonText}>Garder dans mes scans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()}>
          <Text style={styles.skipButtonText}>Ne pas garder</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#bbb', fontSize: 16 },
  image: { width: '100%', height: 250, borderRadius: 12, marginBottom: 16, backgroundColor: '#222' },
  noImage: { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  noImageText: { color: '#bbb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerInfo: { flex: 1, marginRight: 12 },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  brand: { color: '#ccc', fontSize: 14, marginTop: 4 },
  categoryBadge: { backgroundColor: '#22c55e20', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  categoryText: { color: '#22c55e', fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginTop: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  proIcon: { color: '#22c55e', fontSize: 18, fontWeight: 'bold', width: 24 },
  proText: { color: '#ccc', fontSize: 14 },
  conIcon: { color: '#ef4444', fontSize: 18, fontWeight: 'bold', width: 24 },
  conText: { color: '#ccc', fontSize: 14 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergenTag: { backgroundColor: '#7f1d1d', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  allergenText: { color: '#fca5a5', fontSize: 12 },
  additive: { color: '#f97316', fontSize: 13, marginVertical: 2 },
  waterSection: { backgroundColor: '#0c2d48', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#1e6091' },
  phRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  phLabel: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
  phValue: { fontSize: 28, fontWeight: 'bold' },
  phRating: { color: '#93c5fd', fontSize: 14 },
  phBar: { height: 8, backgroundColor: '#333', borderRadius: 4, marginVertical: 8, position: 'relative' },
  phIndicator: { position: 'absolute', top: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#60a5fa', borderWidth: 2, borderColor: '#fff' },
  phScale: { position: 'absolute', top: 12, color: '#bbb', fontSize: 10 },
  waterVerdict: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  mineralsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: 8 },
  mineralItem: { color: '#93c5fd', fontSize: 12, backgroundColor: '#1a3a5c', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  waterSource: { color: '#bbb', fontSize: 11, fontStyle: 'italic', marginTop: 8 },
  waterDetail: { color: '#87ceeb', fontSize: 12, marginVertical: 2 },
  tdsLabel: { color: '#60a5fa', fontSize: 12, marginTop: 8 },
  nutriRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  nutriLabel: { color: '#ddd', fontSize: 14, fontWeight: '600' },
  nutriLabelIndent: { color: '#aaa', fontSize: 13, paddingLeft: 16 },
  nutriValue: { color: '#ddd', fontSize: 14, fontWeight: 'bold' },
  priceButton: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  priceButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  priceSection: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginTop: 12 },
  priceSectionTitle: { color: '#3b82f6', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  priceInfo: { flex: 1, marginRight: 12 },
  priceStore: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
  priceName: { color: '#ccc', fontSize: 13, marginTop: 2 },
  priceDate: { color: '#ccc', fontSize: 10, marginTop: 2 },
  priceValue: { color: '#22c55e', fontSize: 22, fontWeight: 'bold' },
  noPriceSection: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginTop: 12, alignItems: 'center' },
  noPriceText: { color: '#ccc', fontSize: 13, textAlign: 'center' },
  addToListHint: { color: '#3b82f6', fontSize: 10, marginTop: 3 },
  additiveCard: { backgroundColor: '#222', borderRadius: 10, padding: 12, marginBottom: 8 },
  additiveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  additiveCode: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  riskText: { fontSize: 10, fontWeight: 'bold' },
  additiveName: { color: '#ddd', fontSize: 14, fontWeight: '600' },
  additiveCategory: { color: '#ccc', fontSize: 12, marginBottom: 4 },
  additiveDesc: { color: '#aaa', fontSize: 12, marginBottom: 6 },
  effectsList: { marginTop: 4 },
  effectItem: { fontSize: 12, marginVertical: 1 },
  premiumBanner: {
    backgroundColor: '#1e3a5f',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  premiumTitle: { color: '#60a5fa', fontSize: 18, fontWeight: 'bold' },
  premiumText: { color: '#93c5fd', fontSize: 13, textAlign: 'center', marginTop: 8 },
  premiumPrice: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  actionButtons: { marginTop: 16, gap: 8 },
  saveButton: { backgroundColor: '#22c55e', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  skipButton: { backgroundColor: '#333', borderRadius: 12, padding: 14, alignItems: 'center' },
  skipButtonText: { color: '#ccc', fontSize: 14 },
});
