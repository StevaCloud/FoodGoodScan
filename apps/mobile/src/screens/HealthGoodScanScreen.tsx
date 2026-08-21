import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, SafeAreaView, PanResponder, Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useStore } from '../store/useStore';
import { WeatherScreen } from '../components/WeatherBackground';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// ── Ingrédients problématiques ─────────────────────────────────────────
const BAD_INGREDIENTS = [
  { name: 'Parabènes',      keywords: ['paraben'],                                          icon: '⚠️', risk: 'eleve',    desc: 'Perturbateurs endocriniens suspectés' },
  { name: 'Sulfates',       keywords: ['sodium lauryl sulfate', 'sls', 'sodium laureth sulfate', 'sles'], icon: '⚠️', risk: 'modere',  desc: 'Irritants cutanés fréquents' },
  { name: 'Silicones',      keywords: ['dimethicone', 'cyclomethicone', 'siloxane', 'methicone'], icon: 'ℹ️', risk: 'faible',  desc: 'Forment une couche imperméable sur la peau' },
  { name: 'Formaldéhyde',   keywords: ['formaldehyde', 'formalin', 'dmdm hydantoin', 'quaternium-15'], icon: '🚨', risk: 'critique', desc: 'Cancérigène connu' },
  { name: 'Phtalates',      keywords: ['phthalate', 'dbp', 'dep', 'dehp'],                  icon: '⚠️', risk: 'eleve',    desc: 'Perturbateurs endocriniens' },
  { name: 'Triclosan',      keywords: ['triclosan'],                                         icon: '⚠️', risk: 'eleve',    desc: 'Perturbateur endocrinien' },
  { name: 'Alcool dénaturé',keywords: ['alcohol denat', 'sd alcohol', 'isopropyl alcohol'], icon: 'ℹ️', risk: 'faible',  desc: 'Peut assécher la peau' },
  { name: 'BHA / BHT',      keywords: ['butylated hydroxy'],                                icon: '⚠️', risk: 'modere',  desc: 'Perturbateurs endocriniens potentiels' },
  { name: 'PEG',            keywords: ['peg-', 'polyethylene glycol'],                      icon: 'ℹ️', risk: 'faible',  desc: 'Peuvent contenir des impuretés cancérigènes' },
];

const RISK_COLORS: Record<string, string> = { critique: '#dc2626', eleve: '#ef4444', modere: '#f97316', faible: '#eab308' };
const RISK_LABELS: Record<string, string> = { critique: 'CRITIQUE', eleve: 'ÉLEVÉ', modere: 'MODÉRÉ', faible: 'FAIBLE' };

function analyzeIngredients(text: string) {
  const lower = text.toLowerCase();
  return BAD_INGREDIENTS.filter(b => b.keywords.some(k => lower.includes(k)));
}

function HighlightedIngredients({ text, bad }: { text: string; bad: typeof BAD_INGREDIENTS }) {
  const lower = text.toLowerCase();
  const highlights: { start: number; end: number; color: string }[] = [];

  for (const b of bad) {
    const c = RISK_COLORS[b.risk];
    for (const keyword of b.keywords) {
      let idx = lower.indexOf(keyword);
      while (idx !== -1) {
        highlights.push({ start: idx, end: idx + keyword.length, color: c });
        idx = lower.indexOf(keyword, idx + keyword.length);
      }
    }
  }

  highlights.sort((a, b) => a.start - b.start);

  const segments: { text: string; color: string | null }[] = [];
  let pos = 0;
  for (const h of highlights) {
    if (h.start >= pos) {
      if (h.start > pos) segments.push({ text: text.slice(pos, h.start), color: null });
      segments.push({ text: text.slice(h.start, h.end), color: h.color });
      pos = h.end;
    }
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), color: null });

  return (
    <Text style={styles.ingredientsText}>
      {segments.map((s, i) =>
        s.color
          ? <Text key={i} style={{ color: s.color, fontWeight: 'bold', backgroundColor: s.color + '22' }}>{s.text}</Text>
          : <Text key={i}>{s.text}</Text>
      )}
    </Text>
  );
}

function getScore(badCount: number) {
  if (badCount === 0) return {
    grade: 'A', color: '#22c55e', label: 'Excellent',
    verdict: '✅ Formule saine',
    detail: 'Aucun ingrédient préoccupant détecté dans ce produit.',
  };
  if (badCount === 1) return {
    grade: 'B', color: '#84cc16', label: 'Acceptable',
    verdict: '🟡 Formule acceptable',
    detail: '1 ingrédient à surveiller. Selon ta sensibilité cutanée, ce produit peut convenir.',
  };
  if (badCount === 2) return {
    grade: 'C', color: '#eab308', label: 'Moyen',
    verdict: '🟠 Formule moyenne',
    detail: 'Quelques ingrédients potentiellement irritants ou perturbateurs. À utiliser avec modération.',
  };
  if (badCount <= 4) return {
    grade: 'D', color: '#f97316', label: 'Préoccupant',
    verdict: '⚠️ Formule préoccupante',
    detail: 'Plusieurs ingrédients liés à des risques documentés. Préfère un substitut si possible.',
  };
  return {
    grade: 'E', color: '#ef4444', label: 'À éviter',
    verdict: '🔴 Formule chargée',
    detail: 'Nombreux ingrédients controversés. Il existe probablement de meilleures alternatives.',
  };
}

// ── Home ───────────────────────────────────────────────────────────────
function HomeView({ onScan }: { onScan: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={styles.hgsHeader}>
          <Text style={styles.hgsLogo}>
            <Text style={styles.hgsLogoHealth}>Health</Text>
            <Text style={styles.hgsLogoGood}>Good</Text>
            <Text style={styles.hgsLogoScan}>Scan</Text>
          </Text>
          <Text style={styles.hgsSubtitle}>Cosmétiques · Hygiène · Beauté</Text>
          <Text style={styles.hgsSwipeHint}>← glisse vers la droite pour FoodGoodScan</Text>
        </View>

        <TouchableOpacity style={styles.bigScanBtn} onPress={onScan} activeOpacity={0.85}>
          <Text style={styles.bigScanIcon}>📷</Text>
          <Text style={styles.bigScanText}>Scanner un produit</Text>
          <Text style={styles.bigScanSub}>Savon · shampoing · crème · dentifrice...</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>🌿 Ce qu'on analyse</Text>
          <View style={styles.infoGrid}>
            {[
              { icon: '🧪', label: 'Parabènes' },
              { icon: '🫧', label: 'Sulfates' },
              { icon: '⚗️', label: 'Formaldéhyde' },
              { icon: '🔬', label: 'Phtalates' },
              { icon: '💊', label: 'Triclosan' },
              { icon: '🏷️', label: 'BHA / BHT' },
              { icon: '🧴', label: 'Silicones' },
              { icon: '🔗', label: 'PEG' },
            ].map((item, i) => (
              <View key={i} style={styles.infoChip}>
                <Text style={styles.infoChipIcon}>{item.icon}</Text>
                <Text style={styles.infoChipLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.gradeCard}>
          <Text style={styles.gradeCardTitle}>Système de notation</Text>
          {[
            { grade: 'A', color: '#22c55e', label: '0 ingrédient problématique' },
            { grade: 'B', color: '#84cc16', label: '1 ingrédient à surveiller' },
            { grade: 'C', color: '#eab308', label: '2 ingrédients à surveiller' },
            { grade: 'D', color: '#f97316', label: '3–4 ingrédients problématiques' },
            { grade: 'E', color: '#ef4444', label: '5+ ingrédients problématiques' },
          ].map(g => (
            <View key={g.grade} style={styles.gradeRow}>
              <View style={[styles.gradeBadge, { backgroundColor: g.color }]}>
                <Text style={styles.gradeBadgeText}>{g.grade}</Text>
              </View>
              <Text style={styles.gradeRowLabel}>{g.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.poweredBy}>Données : Open Beauty Facts</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Scanner ────────────────────────────────────────────────────────────
function ScannerView({
  onBarcode, onClose, loading, permission, requestPermission,
}: {
  onBarcode: (b: string) => void;
  onClose: () => void;
  loading: boolean;
  permission: any;
  requestPermission: () => void;
}) {
  const scannedRef = useRef(false);

  if (!permission?.granted) {
    return (
      <View style={styles.scannerContainer}>
        <Text style={styles.permText}>Accès caméra requis</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Autoriser</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
          <Text style={{ color: '#888' }}>Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
        onBarcodeScanned={({ data }) => {
          if (scannedRef.current || loading) return;
          scannedRef.current = true;
          onBarcode(data);
        }}
      />
      <View style={styles.scanOverlay}>
        <SafeAreaView>
          <View style={styles.scanHeader}>
            <Text style={styles.scanHeaderLogo}>HealthGoodScan</Text>
            <TouchableOpacity style={styles.scanCloseBtn} onPress={onClose}>
              <Text style={styles.scanCloseTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.scanFrameWrapper}>
          <View style={styles.scanFrame}>
            <View style={[styles.scanCorner, styles.scanCornerTL]} />
            <View style={[styles.scanCorner, styles.scanCornerTR]} />
            <View style={[styles.scanCorner, styles.scanCornerBL]} />
            <View style={[styles.scanCorner, styles.scanCornerBR]} />
          </View>
        </View>
        <Text style={styles.scanHint}>Pointez vers le code-barres du produit</Text>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Product result ─────────────────────────────────────────────────────
const LOUPE_SIZE = 190;
const LOUPE_RADIUS = LOUPE_SIZE / 2;
type SectionEntry = { key: string; y: number; height: number; getText: () => string };

function ProductView({ product, onBack, onOcrSave }: {
  product: any;
  onBack: () => void;
  onOcrSave?: (barcode: string, ingredients: string, name: string, brand: string) => void;
}) {
  const dbIngredients = product.ingredients_text_fr || product.ingredients_text || '';
  const [ocrIngredients, setOcrIngredients] = useState<string | null>(null);
  const [capturingOcr, setCapturingOcr] = useState(false);
  const ingredientsText = ocrIngredients ?? dbIngredients;
  const bad = analyzeIngredients(ingredientsText);
  const score = getScore(bad.length);
  const barcode = product.code || product._barcode || '';

  const captureIngredientsOcr = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission caméra requise'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.85, allowsEditing: false });
    if (result.canceled || !result.assets?.[0]) return;
    setCapturingOcr(true);
    try {
      const recognized = await TextRecognition.recognize(result.assets[0].uri);
      if (recognized.text?.trim()) {
        const text = recognized.text.trim();
        setOcrIngredients(text);
        if (barcode) {
          onOcrSave?.(barcode, text, product.product_name || 'Produit cosmétique', product.brands || '');
        }
      } else {
        Alert.alert('Rien détecté', 'Essaie de mieux éclairer l\'étiquette.');
      }
    } catch {
      Alert.alert('Erreur OCR', 'Impossible de lire l\'étiquette.');
    } finally {
      setCapturingOcr(false);
    }
  };

  const [loupeVisible, setLoupeVisible] = useState(false);
  const [loupePosXY, setLoupePosXY] = useState(() => {
    const { width } = Dimensions.get('window');
    return { x: width / 2 - LOUPE_RADIUS, y: 300 };
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
    const centerY = loupePosXY.y + LOUPE_RADIUS + scrollOffsetY.current;
    let best: SectionEntry | null = null;
    let bestDist = Infinity;
    for (const s of sectionEntries.current) {
      if (s.y <= centerY && s.y + s.height >= centerY) return s.getText();
      const d = Math.abs(s.y + s.height / 2 - centerY);
      if (d < bestDist) { bestDist = d; best = s; }
    }
    return best ? best.getText() : product.product_name || '';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          onScroll={(e) => { scrollOffsetY.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
        >
          <View style={styles.productTopBar}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backBtnTxt}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.productTopTitle}>HealthGoodScan</Text>
          </View>

          {(product.image_url || product.image_front_url) ? (
            <Image source={{ uri: product.image_url || product.image_front_url }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <View style={[styles.productImage, styles.noProductImage]}>
              <Text style={{ fontSize: 48 }}>🧴</Text>
            </View>
          )}

          {product._notFound ? (
            <View style={styles.notFoundBox}>
              <Text style={styles.notFoundIcon}>🔍</Text>
              <Text style={styles.notFoundTitle}>Produit non trouvé</Text>
              <Text style={styles.notFoundSub}>Code-barres : {product._barcode}</Text>
              <Text style={styles.notFoundHint}>Ce produit n'est pas dans nos bases de données.{'\n'}Capture l'étiquette d'ingrédients ci-dessous pour l'analyser.</Text>
            </View>
          ) : (
            <View
              style={styles.productNameRow}
              onLayout={(e) => registerSection('header', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () =>
                `${product.product_name || 'Produit inconnu'}${product.brands ? '\n' + product.brands : ''}`
              )}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.productName}>{product.product_name || 'Produit inconnu'}</Text>
                {product.brands ? <Text style={styles.productBrand}>{product.brands}</Text> : null}
              </View>
              <View style={[styles.scoreCircle, { borderColor: score.color }]}>
                <Text style={[styles.scoreGrade, { color: score.color }]}>{score.grade}</Text>
                <Text style={[styles.scoreLabel, { color: score.color }]}>{score.label}</Text>
              </View>
            </View>
          )}

          {/* Verdict — affiché si ingrédients disponibles (base ou OCR) */}
          {ingredientsText ? (
            <View style={[styles.verdictBanner, { borderLeftColor: score.color }]}>
              <Text style={[styles.verdictTitle, { color: score.color }]}>{score.verdict}</Text>
              <Text style={styles.verdictDetail}>{score.detail}</Text>
            </View>
          ) : null}

          {!product._notFound && bad.length > 0 ? (
            <View
              style={styles.badSection}
              onLayout={(e) => registerSection('bad', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () =>
                'Ingrédients à surveiller\n' + bad.map(b => `${b.name} — ${b.desc}`).join('\n')
              )}
            >
              <Text style={styles.badSectionTitle}>⚠️ Ingrédients à surveiller ({bad.length})</Text>
              {bad.map((b, i) => {
                const c = RISK_COLORS[b.risk];
                return (
                  <View key={i} style={styles.badCard}>
                    <View style={styles.badCardHeader}>
                      <Text style={styles.badCardName}>{b.icon} {b.name}</Text>
                      <View style={[styles.riskPill, { backgroundColor: c + '25', borderColor: c }]}>
                        <Text style={[styles.riskPillText, { color: c }]}>{RISK_LABELS[b.risk]}</Text>
                      </View>
                    </View>
                    <Text style={styles.badCardDesc}>{b.desc}</Text>
                  </View>
                );
              })}
            </View>
          ) : !product._notFound ? (
            <View
              style={styles.cleanSection}
              onLayout={(e) => registerSection('clean', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () =>
                'Aucun ingrédient problématique détecté'
              )}
            >
              <Text style={styles.cleanIcon}>✅</Text>
              <Text style={styles.cleanText}>Aucun ingrédient problématique détecté</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.ocrCaptureBtn} onPress={captureIngredientsOcr} disabled={capturingOcr} activeOpacity={0.85}>
            {capturingOcr
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.ocrCaptureTxt}>📷  Capturer l'étiquette d'ingrédients</Text>}
          </TouchableOpacity>
          {ocrIngredients && (
            <>
              <View style={styles.ocrBadge}>
                <Text style={styles.ocrBadgeTxt}>📸 Texte lu depuis la photo</Text>
                <TouchableOpacity onPress={() => setOcrIngredients(null)}>
                  <Text style={styles.ocrBadgeReset}>Réinitialiser</Text>
                </TouchableOpacity>
              </View>
              {/* Score recalculé sur les ingrédients OCR */}
              {product._notFound && (
                <View style={[styles.productNameRow, { marginTop: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>Analyse des ingrédients</Text>
                    <Text style={styles.productBrand}>Depuis la photo capturée</Text>
                  </View>
                  <View style={[styles.scoreCircle, { borderColor: score.color }]}>
                    <Text style={[styles.scoreGrade, { color: score.color }]}>{score.grade}</Text>
                    <Text style={[styles.scoreLabel, { color: score.color }]}>{score.label}</Text>
                  </View>
                </View>
              )}
              {product._notFound && bad.length > 0 && (
                <View style={styles.badSection}>
                  <Text style={styles.badSectionTitle}>⚠️ Ingrédients à surveiller ({bad.length})</Text>
                  {bad.map((b, i) => {
                    const c = RISK_COLORS[b.risk];
                    return (
                      <View key={i} style={styles.badCard}>
                        <View style={styles.badCardHeader}>
                          <Text style={styles.badCardName}>{b.icon} {b.name}</Text>
                          <View style={[styles.riskPill, { backgroundColor: c + '25', borderColor: c }]}>
                            <Text style={[styles.riskPillText, { color: c }]}>{RISK_LABELS[b.risk]}</Text>
                          </View>
                        </View>
                        <Text style={styles.badCardDesc}>{b.desc}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
              {product._notFound && bad.length === 0 && (
                <View style={styles.cleanSection}>
                  <Text style={styles.cleanIcon}>✅</Text>
                  <Text style={styles.cleanText}>Aucun ingrédient problématique détecté</Text>
                </View>
              )}
            </>
          )}

          {ingredientsText ? (
            <View
              style={styles.ingredientsSection}
              onLayout={(e) => registerSection('ingredients', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () =>
                'Ingrédients\n' + ingredientsText
              )}
            >
              <Text style={styles.ingredientsTitle}>
                Liste des ingrédients
                {bad.length > 0 ? <Text style={styles.ingredientsTitleHint}> — {bad.length} surlignés</Text> : null}
              </Text>
              <HighlightedIngredients text={ingredientsText} bad={bad} />
            </View>
          ) : null}

          {product.categories ? (
            <View
              style={styles.catSection}
              onLayout={(e) => registerSection('cat', e.nativeEvent.layout.y, e.nativeEvent.layout.height, () =>
                'Catégories\n' + String(product.categories).split(',').slice(0, 4).map((c: string) => c.trim()).join(', ')
              )}
            >
              <Text style={styles.catTitle}>Catégories</Text>
              <Text style={styles.catText}>
                {String(product.categories).split(',').slice(0, 4).map((c: string) => c.trim()).join(' · ')}
              </Text>
            </View>
          ) : null}

          <Text style={styles.poweredBy}>Source : Open Beauty Facts</Text>
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
    </SafeAreaView>
  );
}

// ── Root ───────────────────────────────────────────────────────────────
type HGSState = 'home' | 'scanning' | 'product';

export function HealthGoodScanScreen() {
  const [state, setState] = useState<HGSState>('home');
  const [cosmeticProduct, setCosmeticProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const token = useStore(s => s.token);

  const saveCosmeticToServer = async (
    barcode: string,
    ingredients: string,
    name: string,
    brand: string,
    source: 'obf' | 'user' = 'user',
    imageUrl?: string,
  ) => {
    if (!token || !ingredients.trim()) return;
    try {
      const bad = analyzeIngredients(ingredients);
      const score = getScore(bad.length);
      await fetch(`${API_URL}/cosmetics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          barcode,
          name: name || 'Produit cosmétique',
          brand: brand || null,
          ingredients,
          score: score.grade,
          badIngredients: bad.map(b => b.name),
          imageUrl: imageUrl || null,
          source,
        }),
      });
    } catch {}
  };

  const handleBarcode = async (barcode: string) => {
    setLoading(true);
    try {
      // Essai 0 : notre base de données serveur (la plus rapide)
      try {
        const serverRes = await fetch(`${API_URL}/cosmetics/${barcode}`);
        if (serverRes.ok) {
          const cached = await serverRes.json();
          setCosmeticProduct({
            _fromServer: true,
            code: barcode,
            product_name: cached.name,
            brands: cached.brand,
            ingredients_text_fr: cached.ingredients,
            ingredients_text: cached.ingredients,
            image_url: cached.imageUrl,
          });
          setState('product');
          return;
        }
      } catch {}

      // Essai 1 : Open Beauty Facts
      const res = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        setCosmeticProduct({ ...data.product, code: barcode });
        setState('product');
        const ing = data.product.ingredients_text_fr || data.product.ingredients_text || '';
        if (ing) saveCosmeticToServer(barcode, ing, data.product.product_name || '', data.product.brands || '', 'obf', data.product.image_url);
        return;
      }

      // Essai 2 : Open Food Facts
      const res2 = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data2 = await res2.json();
      if (data2.status === 1 && data2.product) {
        setCosmeticProduct({ ...data2.product, code: barcode });
        setState('product');
        const ing = data2.product.ingredients_text_fr || data2.product.ingredients_text || '';
        if (ing) saveCosmeticToServer(barcode, ing, data2.product.product_name || '', data2.product.brands || '', 'obf', data2.product.image_url);
        return;
      }

      // Produit absent — OCR disponible
      setCosmeticProduct({ _notFound: true, _barcode: barcode });
      setState('product');
    } catch {
      setCosmeticProduct({ _notFound: true, _barcode: barcode });
      setState('product');
    } finally {
      setLoading(false);
    }
  };

  if (state === 'scanning') {
    return (
      <ScannerView
        onBarcode={handleBarcode}
        onClose={() => setState('home')}
        loading={loading}
        permission={permission}
        requestPermission={requestPermission}
      />
    );
  }
  if (state === 'product' && cosmeticProduct) {
    return (
      <WeatherScreen>
        <ProductView product={cosmeticProduct} onBack={() => setState('home')} onOcrSave={saveCosmeticToServer} />
      </WeatherScreen>
    );
  }
  return (
    <WeatherScreen>
      <HomeView onScan={() => setState('scanning')} />
    </WeatherScreen>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },

  hgsHeader: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
  hgsLogo: { fontSize: 32, fontWeight: '900', letterSpacing: 1 },
  hgsLogoHealth: { color: '#fff' },
  hgsLogoGood: { color: '#a855f7' },
  hgsLogoScan: { color: '#fff' },
  hgsSubtitle: { color: '#888', fontSize: 13, marginTop: 6 },
  hgsSwipeHint: { color: '#444', fontSize: 11, marginTop: 10, fontStyle: 'italic' },

  bigScanBtn: { backgroundColor: '#1a0d2e', borderWidth: 2, borderColor: '#a855f7', borderRadius: 18, marginHorizontal: 20, marginBottom: 20, padding: 24, alignItems: 'center' },
  bigScanIcon: { fontSize: 44, marginBottom: 10 },
  bigScanText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  bigScanSub: { color: '#888', fontSize: 12, marginTop: 6 },

  infoCard: { backgroundColor: '#111', borderRadius: 14, marginHorizontal: 20, marginBottom: 16, padding: 16 },
  infoCardTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoChip: { backgroundColor: '#1a1a2e', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoChipIcon: { fontSize: 14 },
  infoChipLabel: { color: '#ccc', fontSize: 12 },

  gradeCard: { backgroundColor: '#111', borderRadius: 14, marginHorizontal: 20, marginBottom: 16, padding: 16 },
  gradeCardTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
  gradeBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  gradeBadgeText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  gradeRowLabel: { color: '#ccc', fontSize: 13 },

  poweredBy: { color: '#333', fontSize: 11, textAlign: 'center', marginTop: 8 },

  scannerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  scanOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingBottom: 60 },
  scanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  scanHeaderLogo: { color: '#a855f7', fontSize: 18, fontWeight: 'bold' },
  scanCloseBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  scanCloseTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  scanFrameWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 260, height: 160, borderRadius: 8, position: 'relative' },
  scanCorner: { position: 'absolute', width: 20, height: 20, borderColor: '#a855f7', borderWidth: 3 },
  scanCornerTL: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 4 },
  scanCornerTR: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 4 },
  scanCornerBL: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 4 },
  scanCornerBR: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 4 },
  scanHint: { color: '#ccc', fontSize: 13, textAlign: 'center', marginBottom: 20, paddingHorizontal: 40 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', gap: 12 },
  loadingText: { color: '#a855f7', fontSize: 14, fontWeight: '600' },
  permText: { color: '#fff', fontSize: 16, marginBottom: 16, textAlign: 'center', paddingHorizontal: 32 },
  permBtn: { backgroundColor: '#a855f7', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  verdictBanner: {
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 4,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
  },
  verdictTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  verdictDetail: { color: '#ccc', fontSize: 13, lineHeight: 19 },

  notFoundBox: { alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 14, marginHorizontal: 16, marginTop: 16, padding: 24, gap: 8 },
  notFoundIcon: { fontSize: 40 },
  notFoundTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  notFoundSub: { color: '#555', fontSize: 12 },
  notFoundHint: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 4 },

  productTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  backBtnTxt: { color: '#a855f7', fontSize: 14, fontWeight: '600' },
  productTopTitle: { color: '#a855f7', fontSize: 16, fontWeight: 'bold' },
  productImage: { width: '100%', height: 220, backgroundColor: '#1a1a1a' },
  noProductImage: { justifyContent: 'center', alignItems: 'center' },
  productNameRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#111', marginTop: 8 },
  productName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  productBrand: { color: '#888', fontSize: 13 },
  scoreCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d0d14' },
  scoreGrade: { fontSize: 28, fontWeight: '900' },
  scoreLabel: { fontSize: 9, fontWeight: '700', marginTop: -2 },

  badSection: { backgroundColor: '#1a0d0d', borderRadius: 14, marginHorizontal: 16, marginTop: 12, padding: 16 },
  badSectionTitle: { color: '#ef4444', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  badCard: { backgroundColor: '#2a1a1a', borderRadius: 10, padding: 12, marginBottom: 8 },
  badCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badCardName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  riskPill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  riskPillText: { fontSize: 9, fontWeight: 'bold' },
  badCardDesc: { color: '#aaa', fontSize: 12 },

  cleanSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d1a0d', borderRadius: 14, marginHorizontal: 16, marginTop: 12, padding: 16, gap: 10 },
  cleanIcon: { fontSize: 28 },
  cleanText: { color: '#22c55e', fontSize: 14, fontWeight: '600', flex: 1 },

  ocrCaptureBtn: { backgroundColor: '#1a0d2e', borderWidth: 1.5, borderColor: '#a855f7', borderRadius: 12, marginHorizontal: 16, marginTop: 14, paddingVertical: 13, alignItems: 'center', minHeight: 46, justifyContent: 'center' },
  ocrCaptureTxt: { color: '#d8b4fe', fontSize: 13, fontWeight: '600' },
  ocrBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1a0d2e', borderRadius: 8 },
  ocrBadgeTxt: { color: '#a855f7', fontSize: 11, fontWeight: '600' },
  ocrBadgeReset: { color: '#666', fontSize: 11, textDecorationLine: 'underline' },

  ingredientsSection: { backgroundColor: '#111', borderRadius: 14, marginHorizontal: 16, marginTop: 12, padding: 16 },
  ingredientsTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  ingredientsTitleHint: { color: '#f97316', fontSize: 12, fontWeight: '500' },
  ingredientsText: { color: '#888', fontSize: 12, lineHeight: 18 },

  catSection: { backgroundColor: '#111', borderRadius: 14, marginHorizontal: 16, marginTop: 12, padding: 16 },
  catTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  catText: { color: '#888', fontSize: 12 },

  loupeToggleBtn: { position: 'absolute', bottom: 90, right: 20, width: 54, height: 54, borderRadius: 27, backgroundColor: '#a855f7', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 5, zIndex: 100 },
  loupeToggleIcon: { fontSize: 24 },
  loupeCircle: { position: 'absolute', width: LOUPE_SIZE, height: LOUPE_SIZE, borderRadius: LOUPE_RADIUS, backgroundColor: '#111', borderWidth: 3, borderColor: '#a855f7', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', padding: 14, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 8, zIndex: 99 },
  loupeDragHint: { color: '#444', fontSize: 9, marginBottom: 6, letterSpacing: 1 },
  loupeContent: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
});
