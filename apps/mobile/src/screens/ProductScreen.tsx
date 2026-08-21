import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, PanResponder, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { HealthScoreBadge } from '../components/HealthScoreBadge';
import { showToast } from '../components/Toast';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { NutriScoreBar } from '../components/NutriScoreBar';
import { addFavorite, getProductPrices, submitCorrection, uploadProductImage, ocrProductLabel } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { usePostalCode } from '../hooks/usePostalCode';

const LOUPE_SIZE = 190;
const LOUPE_RADIUS = LOUPE_SIZE / 2;
type SectionEntry = { key: string; y: number; height: number; getText: () => string };

interface PriceDeal {
  merchant: string;
  merchantLogo: string;
  price: number | null;
  priceText: string;
  name: string;
  saleStory: string;
  validUntil: string;
}

export function ProductScreen() {
  const weatherBg = useWeatherBg();
  const product = useStore((s) => s.lastScannedProduct);
  const user = useStore((s) => s.user);
  const lastScanOcrValues = useStore((s) => s.lastScanOcrValues);
  const setLastScanOcrValues = useStore((s) => s.setLastScanOcrValues);
  const navigation = useNavigation<any>();
  const postalCode = usePostalCode();
  const [prices, setPrices] = useState<PriceDeal[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrAutoFilled, setOcrAutoFilled] = useState(false);
  const [correctionFields, setCorrectionFields] = useState({
    calories: '', fat: '', saturatedFat: '', carbs: '', sugars: '', fiber: '', proteins: '', salt: '',
  });

  const [loupeVisible, setLoupeVisible] = useState(false);
  const [loupePosXY, setLoupePosXY] = useState(() => {
    const { width } = Dimensions.get('window');
    return { x: width / 2 - LOUPE_RADIUS, y: 280 };
  });
  const scrollOffsetY = useRef(0);
  const sectionEntries = useRef<SectionEntry[]>([]);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        setLoupePosXY({ x: g.moveX - LOUPE_RADIUS, y: g.moveY - LOUPE_RADIUS });
      },
    })
  ).current;
  const registerSection = (key: string, y: number, height: number, getText: () => string) => {
    sectionEntries.current = sectionEntries.current.filter(s => s.key !== key);
    sectionEntries.current.push({ key, y, height, getText });
    sectionEntries.current.sort((a, b) => a.y - b.y);
  };
  const getLoupeText = (): string => {
    if (!product) return '';
    const centerY = loupePosXY.y + LOUPE_RADIUS + scrollOffsetY.current;
    let best: SectionEntry | null = null;
    let bestDist = Infinity;
    for (const s of sectionEntries.current) {
      if (s.y <= centerY && s.y + s.height >= centerY) return s.getText();
      const d = Math.abs(s.y + s.height / 2 - centerY);
      if (d < bestDist) { bestDist = d; best = s; }
    }
    return best ? best.getText() : product.name;
  };

  const addGroceryItem = useStore((s) => s.addGroceryItem);
  const isPremium = user?.plan === 'PREMIUM';
  const hasScanPlus = isPremium && (user?.groceryAddon === true);

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
    if (product && hasScanPlus) {
      setLoadingPrices(true);
      getProductPrices(product.name, postalCode || 'J1H1A1')
        .then((res) => setPrices(res.prices || []))
        .catch(() => setPrices([]))
        .finally(() => setLoadingPrices(false));
    }
  }, [product]);

  // Auto-ouvrir le modal de correction si l'OCR a détecté des valeurs au scan
  useEffect(() => {
    if (lastScanOcrValues && product) {
      setCorrectionFields(lastScanOcrValues);
      setOcrAutoFilled(true);
      setLastScanOcrValues(null);
      // Petit délai pour laisser l'écran se rendre
      setTimeout(() => setShowCorrectModal(true), 600);
    }
  }, []);

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

  const handleUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorise l\'accès à ta galerie dans les paramètres.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    setUploadingImage(true);
    try {
      await uploadProductImage(product.barcode, result.assets[0].uri);
      showToast('📸 Image ajoutée pour ce produit !');
    } catch {
      showToast('Erreur lors de l\'upload');
    } finally {
      setUploadingImage(false);
    }
  };

  const captureForOcr = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast('Permission caméra refusée');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.5,
      base64: true,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    setOcrLoading(true);
    try {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const values = await ocrProductLabel(base64);
      setCorrectionFields(prev => ({
        calories: values.calories != null ? String(values.calories) : prev.calories,
        fat: values.fat != null ? String(values.fat) : prev.fat,
        saturatedFat: values.saturatedFat != null ? String(values.saturatedFat) : prev.saturatedFat,
        carbs: values.carbs != null ? String(values.carbs) : prev.carbs,
        sugars: values.sugars != null ? String(values.sugars) : prev.sugars,
        fiber: values.fiber != null ? String(values.fiber) : prev.fiber,
        proteins: values.proteins != null ? String(values.proteins) : prev.proteins,
        salt: values.salt != null ? String(values.salt) : prev.salt,
      }));
      showToast('Valeurs détectées — vérifie avant de soumettre');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Impossible de lire l\'étiquette');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmitCorrection = async () => {
    const parse = (v: string) => v.trim() === '' ? undefined : parseFloat(v.replace(',', '.'));
    const values = {
      calories: parse(correctionFields.calories),
      fat: parse(correctionFields.fat),
      saturatedFat: parse(correctionFields.saturatedFat),
      carbs: parse(correctionFields.carbs),
      sugars: parse(correctionFields.sugars),
      fiber: parse(correctionFields.fiber),
      proteins: parse(correctionFields.proteins),
      salt: parse(correctionFields.salt),
    };
    if (Object.values(values).every(v => v === undefined)) {
      showToast('Entre au moins une valeur');
      return;
    }
    setSubmittingCorrection(true);
    try {
      const result = await submitCorrection(product.barcode, product.name, values);
      setShowCorrectModal(false);
      if (result.status === 'CONFIRMED') {
        Alert.alert('✅ Confirmé !', `Valeurs validées par la communauté. +${result.pointsEarned} points !`);
      } else {
        Alert.alert('📝 Enregistré', 'En attente de confirmation par un autre utilisateur. Tu gagneras 10 points à la confirmation.');
      }
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Erreur lors de la soumission');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={[styles.container, { backgroundColor: weatherBg }]} onScroll={(e) => { scrollOffsetY.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />
      ) : (
        <TouchableOpacity style={[styles.image, styles.noImage]} onPress={handleUploadImage} disabled={uploadingImage}>
          {uploadingImage
            ? <ActivityIndicator color="#22c55e" size="large" />
            : <>
                <Text style={styles.noImageIcon}>📷</Text>
                <Text style={styles.noImageText}>Pas d'image</Text>
                <Text style={styles.noImageSub}>Appuie pour en ajouter une</Text>
              </>}
        </TouchableOpacity>
      )}

      <View style={styles.header} onLayout={(e) => registerSection('header', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () => `${product.name}${product.brand ? '\n' + product.brand : ''}${product.category ? '\n' + product.category.name : ''}`)}>
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

      {product.waterInfo && (
        <View style={styles.waterSection}>
          <Text style={styles.sectionTitle}>Analyse de l'eau</Text>
          {product.waterInfo.ph > 0 ? (
            <>
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
            </>
          ) : (
            <View style={styles.phRow}>
              <Text style={styles.phLabel}>pH</Text>
              <Text style={[styles.phValue, { color: '#888', fontSize: 16 }]}>Non disponible</Text>
            </View>
          )}
          <Text style={[styles.waterVerdict, { color: product.waterInfo.verdict.includes('Excellent') ? '#22c55e' : product.waterInfo.verdict.includes('Très') ? '#84cc16' : product.waterInfo.verdict.includes('non') ? '#888' : '#eab308' }]}>
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
        <View style={styles.section} onLayout={(e) => registerSection('pros', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () => 'Points positifs\n' + (product.pros || []).join('\n'))}>
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
        <View style={styles.section} onLayout={(e) => registerSection('cons', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () => 'Points négatifs\n' + (product.cons || []).join('\n'))}>
          <Text style={styles.sectionTitle}>Points négatifs</Text>
          {product.cons.map((con: string, i: number) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.conIcon}>-</Text>
              <Text style={styles.conText}>{con}</Text>
            </View>
          ))}
        </View>
      )}

      {product.novaGroup === 4 && (
        <View style={styles.novaExplainBox} onLayout={(e) => registerSection('nova', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () => 'Pourquoi ultra-transformé ?\nContient des additifs industriels : émulsifiants, conservateurs, arômes artificiels, colorants.')}>
          <Text style={styles.novaExplainTitle}>⚠️ Pourquoi ultra-transformé ?</Text>
          <Text style={styles.novaExplainText}>
            Ce produit est classé NOVA 4 car il contient des ingrédients et additifs industriels absents d'une cuisine ordinaire : émulsifiants, conservateurs, arômes artificiels, colorants, agents de texture, etc.
          </Text>
          {(product.additives?.length > 0) && (
            <Text style={styles.novaExplainSub}>
              {product.additives.length} additif{product.additives.length > 1 ? 's' : ''} détecté{product.additives.length > 1 ? 's' : ''} : {product.additives.slice(0, 5).map((a: string) => a.replace('en:', '').toUpperCase()).join(', ')}{product.additives.length > 5 ? '...' : ''}
            </Text>
          )}
          <Text style={styles.novaExplainTip}>
            💡 Consommé régulièrement, ce type de produit est associé à un risque accru de maladies cardiovasculaires et de diabète de type 2.
          </Text>
        </View>
      )}

      {isPremium && product.allergens?.length > 0 && (
        <View style={styles.section} onLayout={(e) => registerSection('allergens', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () => 'Allergènes\n' + (product.allergens || []).join(', '))}>
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

      {isPremium && product.additivesDetails?.length > 0 && (
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

      {isPremium && product.additives?.length > 0 && (!product.additivesDetails || product.additivesDetails.length === 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additifs ({product.additives.length})</Text>
          {product.additives.map((a: string, i: number) => (
            <Text key={i} style={styles.additive}>{a}</Text>
          ))}
        </View>
      )}

      {product.nutriments && (
        <View style={styles.section} onLayout={(e) => {
          const n = product.nutriments as any;
          const lines: string[] = ['Valeurs nutritives (100g)'];
          if (n?.['energy-kcal_100g']) lines.push(`Calories: ${n['energy-kcal_100g']} kcal`);
          if (n?.fat_100g != null) lines.push(`Gras: ${n.fat_100g}g`);
          if (n?.proteins_100g != null) lines.push(`Protéines: ${n.proteins_100g}g`);
          if (n?.carbohydrates_100g != null) lines.push(`Glucides: ${n.carbohydrates_100g}g`);
          if (n?.sugars_100g != null) lines.push(`Sucres: ${n.sugars_100g}g`);
          if (n?.fiber_100g != null) lines.push(`Fibres: ${n.fiber_100g}g`);
          if (n?.salt_100g != null) lines.push(`Sel: ${n.salt_100g}g`);
          registerSection('nutrition', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () => lines.join('\n'));
        }}>
          <Text style={styles.sectionTitle}>Valeurs nutritives (pour 100g)</Text>
          {(() => {
            const ocrLabels: Record<string, string> = (product.extraNutrients as any)?._labels || {};
            const hasOcr = Object.keys(ocrLabels).length > 0;
            const n = product.nutriments as any;

            if (hasOcr) {
              // Affiche exactement comme la capture OCR — même labels, même chiffres
              const UNITS: Record<string, string> = { calories: 'kcal', fat: 'g', saturatedFat: 'g', carbs: 'g', sugars: 'g', fiber: 'g', proteins: 'g', salt: 'g', cholesterol: 'mg', iron: 'mg', calcium: 'mg', potassium: 'mg', transFat: 'g', polyunsaturatedFat: 'g', monounsaturatedFat: 'g', omega3: 'g', omega6: 'g', addedSugars: 'g', starch: 'g', polyols: 'g', vitaminA: 'µg', vitaminB1: 'mg', vitaminB2: 'mg', vitaminB3: 'mg', vitaminB5: 'mg', vitaminB6: 'mg', vitaminB7: 'µg', vitaminB9: 'µg', vitaminB12: 'µg', vitaminC: 'mg', vitaminD: 'µg', vitaminE: 'mg', vitaminK: 'µg', magnesium: 'mg', phosphorus: 'mg', zinc: 'mg', selenium: 'µg', copper: 'mg', manganese: 'mg', iodine: 'µg', chromium: 'µg', molybdenum: 'µg', fluoride: 'mg', chloride: 'mg', caffeine: 'mg', alcohol: 'g', taurine: 'mg', creatine: 'g' };
              const stdMap: Record<string, number | null> = {
                calories: n['energy-kcal_100g'] ?? (n.energy_100g ? Math.round(n.energy_100g / 4.184) : null),
                fat: n.fat_100g ?? null, saturatedFat: n['saturated-fat_100g'] ?? null,
                carbs: n.carbohydrates_100g ?? null, sugars: n.sugars_100g ?? null,
                fiber: n.fiber_100g ?? null, proteins: n.proteins_100g ?? null,
                salt: n.salt_100g ?? null, cholesterol: n.cholesterol_100g ?? null,
                iron: n.iron_100g ?? null, calcium: n.calcium_100g ?? null, potassium: n.potassium_100g ?? null,
              };
              const rows: { key: string; label: string; unit: string; value: number }[] = [];
              for (const [k, v] of Object.entries(stdMap)) {
                if (ocrLabels[k] && v != null && v >= 0) rows.push({ key: k, label: ocrLabels[k], unit: UNITS[k] || '', value: v });
              }
              if (product.extraNutrients) {
                for (const [k, v] of Object.entries(product.extraNutrients as Record<string, any>)) {
                  if (k === '_labels') continue;
                  rows.push({ key: k, label: ocrLabels[k] || k, unit: UNITS[k] || '', value: v });
                }
              }
              return rows.map(r => (
                <View key={r.key} style={styles.nutriRow}>
                  <Text style={styles.nutriLabel}>{r.label}</Text>
                  <Text style={styles.nutriValue}>{r.value} {r.unit}</Text>
                </View>
              ));
            }

            // Pas d'OCR — tableau standard
            return (<>
              {n.energy_100g > 0 && (<View style={styles.nutriRow}><Text style={styles.nutriLabel}>Énergie</Text><Text style={styles.nutriValue}>{Math.round(n['energy-kcal_100g'] || n.energy_100g / 4.184)} kcal</Text></View>)}
              {n.fat_100g >= 0 && (<View style={styles.nutriRow}><Text style={styles.nutriLabel}>Gras</Text><Text style={[styles.nutriValue, n.fat_100g > 20 ? {color:'#ef4444'} : n.fat_100g > 10 ? {color:'#f97316'} : {color:'#22c55e'}]}>{n.fat_100g}g</Text></View>)}
              {n['saturated-fat_100g'] >= 0 && (<View style={styles.nutriRow}><Text style={styles.nutriLabelIndent}>dont saturés</Text><Text style={[styles.nutriValue, n['saturated-fat_100g'] > 5 ? {color:'#ef4444'} : {color:'#22c55e'}]}>{n['saturated-fat_100g']}g</Text></View>)}
              {n.carbohydrates_100g >= 0 && (<View style={styles.nutriRow}><Text style={styles.nutriLabel}>Glucides</Text><Text style={styles.nutriValue}>{n.carbohydrates_100g}g</Text></View>)}
              {n.sugars_100g >= 0 && (<View style={styles.nutriRow}><Text style={styles.nutriLabelIndent}>dont sucres</Text><Text style={[styles.nutriValue, n.sugars_100g > 20 ? {color:'#ef4444'} : n.sugars_100g > 10 ? {color:'#f97316'} : {color:'#22c55e'}]}>{n.sugars_100g}g</Text></View>)}
              {n.fiber_100g > 0 && (<View style={styles.nutriRow}><Text style={styles.nutriLabel}>Fibres</Text><Text style={[styles.nutriValue, {color:'#22c55e'}]}>{n.fiber_100g}g</Text></View>)}
              {n.proteins_100g >= 0 && (<View style={styles.nutriRow}><Text style={styles.nutriLabel}>Protéines</Text><Text style={[styles.nutriValue, n.proteins_100g > 10 ? {color:'#22c55e'} : {}]}>{n.proteins_100g}g</Text></View>)}
              {n.salt_100g >= 0 && (<View style={styles.nutriRow}><Text style={styles.nutriLabel}>Sel</Text><Text style={[styles.nutriValue, n.salt_100g > 1.5 ? {color:'#ef4444'} : n.salt_100g > 0.8 ? {color:'#f97316'} : {color:'#22c55e'}]}>{n.salt_100g}g</Text></View>)}
            </>);
          })()}
          {product.extraNutrients && Object.keys(product.extraNutrients).filter(k => k !== '_labels').length > 0 && !((product.extraNutrients as any)?._labels && Object.keys((product.extraNutrients as any)._labels).length > 0) && (() => {
            const savedRawLabels: Record<string, string> = (product.extraNutrients as any)._labels || {};
            const EXTRA_LABELS: Record<string, { label: string; unit: string }> = {
              transFat: { label: 'Gras trans', unit: 'g' },
              polyunsaturatedFat: { label: 'Gras polyinsaturés', unit: 'g' },
              monounsaturatedFat: { label: 'Gras monoinsaturés', unit: 'g' },
              omega3: { label: 'Oméga-3', unit: 'g' },
              omega6: { label: 'Oméga-6', unit: 'g' },
              addedSugars: { label: 'Sucres ajoutés', unit: 'g' },
              starch: { label: 'Amidon', unit: 'g' },
              polyols: { label: 'Polyols', unit: 'g' },
              vitaminA: { label: 'Vitamine A', unit: 'µg' },
              vitaminB1: { label: 'Vitamine B1', unit: 'mg' },
              vitaminB2: { label: 'Vitamine B2', unit: 'mg' },
              vitaminB3: { label: 'Vitamine B3', unit: 'mg' },
              vitaminB5: { label: 'Vitamine B5', unit: 'mg' },
              vitaminB6: { label: 'Vitamine B6', unit: 'mg' },
              vitaminB7: { label: 'Vitamine B7', unit: 'µg' },
              vitaminB9: { label: 'Vitamine B9', unit: 'µg' },
              vitaminB12: { label: 'Vitamine B12', unit: 'µg' },
              vitaminC: { label: 'Vitamine C', unit: 'mg' },
              vitaminD: { label: 'Vitamine D', unit: 'µg' },
              vitaminE: { label: 'Vitamine E', unit: 'mg' },
              vitaminK: { label: 'Vitamine K', unit: 'µg' },
              magnesium: { label: 'Magnésium', unit: 'mg' },
              phosphorus: { label: 'Phosphore', unit: 'mg' },
              zinc: { label: 'Zinc', unit: 'mg' },
              selenium: { label: 'Sélénium', unit: 'µg' },
              copper: { label: 'Cuivre', unit: 'mg' },
              manganese: { label: 'Manganèse', unit: 'mg' },
              iodine: { label: 'Iode', unit: 'µg' },
              chromium: { label: 'Chrome', unit: 'µg' },
              molybdenum: { label: 'Molybdène', unit: 'µg' },
              fluoride: { label: 'Fluorure', unit: 'mg' },
              chloride: { label: 'Chlorure', unit: 'mg' },
              caffeine: { label: 'Caféine', unit: 'mg' },
              alcohol: { label: 'Alcool', unit: 'g' },
              taurine: { label: 'Taurine', unit: 'mg' },
              creatine: { label: 'Créatine', unit: 'g' },
            };
            return Object.entries(product.extraNutrients as Record<string, any>)
              .filter(([k]) => k !== '_labels')
              .map(([k, v]) => {
                const rawLabel = savedRawLabels[k] || '';
                const meta = EXTRA_LABELS[k] || { label: k, unit: '' };
                const displayLabel = rawLabel || meta.label;
                return (
                  <View key={k} style={styles.nutriRow}>
                    <Text style={styles.nutriLabelIndent}>{displayLabel}</Text>
                    <Text style={styles.nutriValue}>{v} {meta.unit}</Text>
                  </View>
                );
              });
          })()}
        </View>
      )}

      {product.nutriments && (
        <TouchableOpacity style={styles.correctBtn} onPress={() => {
          const n = product.nutriments as any;
          setCorrectionFields({
            calories: String(n['energy-kcal_100g'] || ''),
            fat: String(n.fat_100g ?? ''),
            saturatedFat: String(n['saturated-fat_100g'] ?? ''),
            carbs: String(n.carbohydrates_100g ?? ''),
            sugars: String(n.sugars_100g ?? ''),
            fiber: String(n.fiber_100g ?? ''),
            proteins: String(n.proteins_100g ?? ''),
            salt: String(n.salt_100g ?? ''),
          });
          setShowCorrectModal(true);
        }}>
          <Text style={styles.correctBtnText}>✏️ Corriger les valeurs nutritives</Text>
          <Text style={styles.correctBtnSub}>+10 pts si confirmé par un autre utilisateur</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showCorrectModal} animationType="slide" transparent onRequestClose={() => { setShowCorrectModal(false); setOcrAutoFilled(false); }}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✏️ Corriger les valeurs</Text>
            {ocrAutoFilled
              ? <Text style={styles.ocrAutoHint}>📷 Valeurs lues automatiquement — vérifie avant de soumettre</Text>
              : <Text style={styles.modalSub}>Valeurs pour 100g — laisse vide si inconnue</Text>}
            <TouchableOpacity style={styles.ocrButton} onPress={captureForOcr} disabled={ocrLoading}>
              {ocrLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.ocrButtonText}>📷 Capturer l'étiquette nutritionnelle</Text>}
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {([
                { key: 'calories', label: 'Calories (kcal)' },
                { key: 'fat', label: 'Gras total (g)' },
                { key: 'saturatedFat', label: 'Gras saturés (g)' },
                { key: 'carbs', label: 'Glucides (g)' },
                { key: 'sugars', label: 'Sucres (g)' },
                { key: 'fiber', label: 'Fibres (g)' },
                { key: 'proteins', label: 'Protéines (g)' },
                { key: 'salt', label: 'Sel (g)' },
              ] as const).map(({ key, label }) => (
                <View key={key} style={styles.modalField}>
                  <Text style={styles.modalLabel}>{label}</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="decimal-pad"
                    value={correctionFields[key]}
                    onChangeText={v => setCorrectionFields(prev => ({ ...prev, [key]: v }))}
                    placeholder="0"
                    placeholderTextColor="#555"
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowCorrectModal(false); setOcrAutoFilled(false); }}>
                <Text style={styles.modalCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleSubmitCorrection} disabled={submittingCorrection}>
                {submittingCorrection
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalSubmitTxt}>Soumettre</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {!isPremium && (
        <TouchableOpacity style={styles.premiumBanner} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.premiumTitle}>🔒 Analyse complète</Text>
          <Text style={styles.premiumText}>
            Passe au Premium pour voir les additifs, allergènes et pourquoi ce produit est mauvais pour la santé.
          </Text>
          <Text style={styles.premiumPrice}>Premium — $3.99/mois</Text>
        </TouchableOpacity>
      )}

      {/* ── Prix en circulaire ── */}
      {hasScanPlus ? (
        <View style={styles.priceSection}>
          <View style={styles.priceSectionHeader}>
            <Text style={styles.priceSectionTitle}>🏷️ Prix en circulaire</Text>
            {loadingPrices && <ActivityIndicator size="small" color="#3b82f6" />}
          </View>
          {loadingPrices && prices.length === 0 && (
            <Text style={styles.priceLoading}>Recherche des meilleurs prix...</Text>
          )}
          {!loadingPrices && prices.length === 0 && (
            <Text style={styles.noPriceText}>Aucun prix en circulaire cette semaine</Text>
          )}
          {prices.length > 0 && (
            <>
              {(() => {
                const best = [...prices].sort((a, b) => (a.price || 999) - (b.price || 999))[0];
                return (
                  <View style={styles.bestPriceCard}>
                    <View style={styles.bestPriceBadge}><Text style={styles.bestPriceBadgeText}>MEILLEUR PRIX</Text></View>
                    <Text style={styles.bestPriceStore}>{best.merchant}</Text>
                    <Text style={styles.bestPriceName} numberOfLines={1}>{best.name}</Text>
                    {best.saleStory ? <Text style={styles.bestPriceSale}>{best.saleStory}</Text> : null}
                    <View style={styles.bestPriceRow}>
                      <Text style={styles.bestPriceValue}>${best.price?.toFixed(2)}</Text>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addToGroceryList(best.name, best.merchant, best.price)}>
                        <Text style={styles.addBtnText}>+ Liste</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
              {prices.slice(1, 5).map((p, i) => (
                <TouchableOpacity key={i} style={styles.priceCard} onPress={() => addToGroceryList(p.name, p.merchant, p.price)}>
                  <View style={styles.priceInfo}>
                    <Text style={styles.priceStore}>{p.merchant}</Text>
                    <Text style={styles.priceName} numberOfLines={1}>{p.name}</Text>
                    {p.validUntil && <Text style={styles.priceDate}>Jusqu'au {new Date(p.validUntil).toLocaleDateString('fr-CA')}</Text>}
                  </View>
                  <View style={styles.priceRight}>
                    <Text style={styles.priceValue}>${p.price?.toFixed(2)}</Text>
                    <Text style={styles.addHint}>+ liste</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      ) : isPremium ? (
        <TouchableOpacity style={styles.scanPlusLocked} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.priceLockedIcon}>🏷️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceLockedTitle}>Prix en circulaire</Text>
            <Text style={styles.priceLockedSub}>Compare les prix de toutes les épiceries • Scan Plus $5.99/mois</Text>
          </View>
          <Text style={styles.priceLockedArrow}>›</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.priceLocked} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.priceLockedIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceLockedTitle}>Prix en circulaire</Text>
            <Text style={styles.priceLockedSub}>Vois les prix de toutes les épiceries • Scan Plus $5.99/mois</Text>
          </View>
          <Text style={styles.priceLockedArrow}>›</Text>
        </TouchableOpacity>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.saveButton} onPress={handleFavorite}>
          <Text style={styles.saveButtonText}>Garder dans mes scans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()}>
          <Text style={styles.skipButtonText}>Ne pas garder</Text>
        </TouchableOpacity>
      </View>

      {product.nutritionLabelUrl ? (
        <View style={styles.nutritionLabelSection}>
          <Text style={styles.nutritionLabelTitle}>📷 Photo du tableau nutritif</Text>
          <Image source={{ uri: product.nutritionLabelUrl }} style={styles.nutritionLabelImage} resizeMode="contain" />
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>

    <TouchableOpacity style={styles.loupeToggleBtn} onPress={() => setLoupeVisible(v => !v)} activeOpacity={0.8}>
      <Text style={styles.loupeToggleIcon}>{loupeVisible ? '✕' : '🔍'}</Text>
    </TouchableOpacity>

    {loupeVisible && (
      <View style={[styles.loupeCircle, { left: loupePosXY.x, top: loupePosXY.y }]} {...panResponder.panHandlers}>
        <Text style={styles.loupeDragHint}>⠿ glisse</Text>
        <Text style={styles.loupeContent} numberOfLines={7}>{getLoupeText()}</Text>
      </View>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  nutritionLabelSection: { marginTop: 24, marginHorizontal: 4 },
  nutritionLabelTitle: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  nutritionLabelImage: { width: '100%', height: 260, borderRadius: 12, backgroundColor: '#111' },
  novaExplainBox: { backgroundColor: '#1c1008', borderLeftWidth: 3, borderLeftColor: '#f97316', borderRadius: 10, padding: 14, marginBottom: 16 },
  novaExplainTitle: { color: '#f97316', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  novaExplainText: { color: '#e2c9a0', fontSize: 13, lineHeight: 20, marginBottom: 8 },
  novaExplainSub: { color: '#f97316', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  novaExplainTip: { color: '#aaa', fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  container: { flex: 1, padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#bbb', fontSize: 16 },
  image: { width: '100%', height: 250, borderRadius: 12, marginBottom: 16, backgroundColor: '#222' },
  noImage: { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', gap: 6 },
  noImageIcon: { fontSize: 36 },
  noImageText: { color: '#bbb', fontSize: 14 },
  noImageSub: { color: '#555', fontSize: 12 },
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
  priceSection: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#1e3a5f' },
  priceSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceSectionTitle: { color: '#60a5fa', fontSize: 15, fontWeight: 'bold' },
  priceLoading: { color: '#555', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  bestPriceCard: { backgroundColor: '#0f2d1a', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#22c55e' },
  bestPriceBadge: { backgroundColor: '#22c55e', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },
  bestPriceBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },
  bestPriceStore: { color: '#86efac', fontSize: 13, fontWeight: 'bold' },
  bestPriceName: { color: '#ccc', fontSize: 13, marginTop: 2 },
  bestPriceSale: { color: '#f59e0b', fontSize: 12, marginTop: 2, fontWeight: '600' },
  bestPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  bestPriceValue: { color: '#22c55e', fontSize: 28, fontWeight: '900' },
  addBtn: { backgroundColor: '#22c55e', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  priceInfo: { flex: 1, marginRight: 12 },
  priceStore: { color: '#60a5fa', fontSize: 12, fontWeight: 'bold' },
  priceName: { color: '#ccc', fontSize: 12, marginTop: 2 },
  priceDate: { color: '#555', fontSize: 10, marginTop: 2 },
  priceRight: { alignItems: 'flex-end' },
  priceValue: { color: '#86efac', fontSize: 18, fontWeight: 'bold' },
  addHint: { color: '#3b82f6', fontSize: 10, marginTop: 2 },
  noPriceText: { color: '#555', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  priceLocked: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#1f2937', gap: 12 },
  scanPlusLocked: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#f59e0b50', gap: 12 },
  priceLockedIcon: { fontSize: 28 },
  priceLockedTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  priceLockedSub: { color: '#555', fontSize: 12, marginTop: 2 },
  priceLockedArrow: { color: '#3b82f6', fontSize: 24, fontWeight: 'bold' },
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
  correctBtn: { backgroundColor: '#1a2a1a', borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#22c55e40', alignItems: 'center' },
  correctBtnText: { color: '#22c55e', fontSize: 13, fontWeight: '600' },
  correctBtnSub: { color: '#555', fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  modalSub: { color: '#888', fontSize: 12, marginBottom: 10 },
  ocrAutoHint: { color: '#22c55e', fontSize: 12, fontWeight: '600', marginBottom: 10 },
  ocrButton: { backgroundColor: '#3b82f6', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 12, minHeight: 42, justifyContent: 'center' },
  ocrButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  modalField: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalLabel: { color: '#ccc', fontSize: 13, flex: 1 },
  modalInput: { backgroundColor: '#2a2a2a', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, width: 90, textAlign: 'right', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancel: { flex: 1, backgroundColor: '#333', borderRadius: 10, padding: 14, alignItems: 'center' },
  modalCancelTxt: { color: '#ccc', fontWeight: '600' },
  modalSubmit: { flex: 1, backgroundColor: '#22c55e', borderRadius: 10, padding: 14, alignItems: 'center' },
  modalSubmitTxt: { color: '#000', fontWeight: 'bold' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  categoryPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#444' },
  categoryPillSelected: { backgroundColor: '#22c55e20', borderColor: '#22c55e' },
  categoryPillText: { color: '#aaa', fontSize: 12 },
  categoryPillTextSelected: { color: '#22c55e', fontWeight: '600' },
  actionButtons: { marginTop: 16, gap: 8 },
  saveButton: { backgroundColor: '#22c55e', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  skipButton: { backgroundColor: '#333', borderRadius: 12, padding: 14, alignItems: 'center' },
  skipButtonText: { color: '#ccc', fontSize: 14 },
  loupeToggleBtn: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    zIndex: 100,
  },
  loupeToggleIcon: { fontSize: 24 },
  loupeCircle: {
    position: 'absolute',
    width: LOUPE_SIZE,
    height: LOUPE_SIZE,
    borderRadius: LOUPE_RADIUS,
    backgroundColor: '#111',
    borderWidth: 3,
    borderColor: '#22c55e',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    zIndex: 99,
  },
  loupeDragHint: { color: '#444', fontSize: 9, marginBottom: 6, letterSpacing: 1 },
  loupeContent: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});
