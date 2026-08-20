import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform, Modal, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { scanProduct, saveNutritionDirect, uploadNutritionLabel } from '../services/api';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useStore } from '../store/useStore';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { WeatherScreen } from '../components/WeatherBackground';
import { triggerInterstitial } from '../components/Interstitial';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';
import { CameraView, useCameraPermissions } from 'expo-camera';

function parseNutritionFromOCR(rawText: string) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const getNum = (s: string): number | null => {
    const m = s.match(/(\d+[.,]\d+|\d+)\s*(?:g|mg|mcg|µg|kcal|kj|cal|ui|iu)?/i);
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  };

  const search = (keywords: string[], exclude: string[] = []): number | null => {
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].toLowerCase();
      if (keywords.some(k => l.includes(k)) && !exclude.some(k => l.includes(k))) {
        const n = getNum(lines[i]);
        if (n !== null) return n;
        if (i + 1 < lines.length) {
          const n2 = getNum(lines[i + 1]);
          if (n2 !== null) return n2;
        }
      }
    }
    return null;
  };

  const sodium = search(['sodium']);
  const saltDirect = search(['sel /', ' sel ', 'salt /', ' salt '], ['sodium']);

  // Valeurs standard (colonnes BD)
  const standard = {
    calories:     search(['calorie', 'calories', 'énergie', 'energie', 'energy']),
    fat:          search(['lipide', 'lipides', 'fat', 'matière grasse', 'total fat'], ['saturé', 'saturated', 'trans', 'insatur', 'mono', 'poly']),
    saturatedFat: search(['saturé', 'saturated', 'acides gras sat', 'sat. fat', 'gras saturé']),
    carbs:        search(['glucide', 'glucides', 'carbohydrate', 'carbohydrates', 'hydrate de carbone', 'total carb'], ['sucre', 'sugar', 'fibre', 'fiber', 'amidon', 'starch']),
    sugars:       search(['sucre', 'sucres', 'sugar', 'sugars', 'dont sucres', 'of which sugars']),
    fiber:        search(['fibre', 'fibres', 'fiber', 'dietary fiber', 'fibres alimentaires', 'fibre alimentaire']),
    proteins:     search(['protéine', 'protéines', 'protein', 'proteins', 'proteine']),
    salt:         saltDirect ?? (sodium !== null ? Math.round(sodium * 0.00254 * 100) / 100 : null),
    cholesterol:  search(['cholestérol', 'cholesterol']),
    iron:         search([' fer ', 'iron', 'fer\t', '\tfer']),
    calcium:      search(['calcium']),
    potassium:    search(['potassium']),
  };

  // Valeurs extra (JSON)
  const extra: Record<string, number> = {};
  const tryAdd = (key: string, keywords: string[], exclude: string[] = []) => {
    const v = search(keywords, exclude);
    if (v !== null) extra[key] = v;
  };

  // Acides gras
  tryAdd('transFat',            ['trans fat', 'acides gras trans', 'gras trans']);
  tryAdd('polyunsaturatedFat',  ['polyunsaturated', 'polyinsaturé', 'acides gras polyinsaturés']);
  tryAdd('monounsaturatedFat',  ['monounsaturated', 'monoinsaturé', 'acides gras monoinsaturés']);
  tryAdd('omega3',              ['oméga-3', 'omega-3', 'omega 3']);
  tryAdd('omega6',              ['oméga-6', 'omega-6', 'omega 6']);
  tryAdd('addedSugars',         ['sucres ajoutés', 'added sugars', 'sucre ajouté']);
  tryAdd('starch',              ['amidon', 'starch']);
  tryAdd('polyols',             ['polyol', 'alcool de sucre', 'sugar alcohol', 'érythritol', 'sorbitol', 'xylitol', 'maltitol']);

  // Vitamines
  tryAdd('vitaminA',   ['vitamine a', 'vitamin a', 'vit. a', 'rétinol', 'retinol']);
  tryAdd('vitaminB1',  ['vitamine b1', 'vitamin b1', 'thiamine', 'thiamin']);
  tryAdd('vitaminB2',  ['vitamine b2', 'vitamin b2', 'riboflavine', 'riboflavin']);
  tryAdd('vitaminB3',  ['vitamine b3', 'vitamin b3', 'niacine', 'niacin']);
  tryAdd('vitaminB5',  ['vitamine b5', 'vitamin b5', 'acide pantothénique', 'pantothenic']);
  tryAdd('vitaminB6',  ['vitamine b6', 'vitamin b6', 'pyridoxine']);
  tryAdd('vitaminB7',  ['vitamine b7', 'vitamin b7', 'biotine', 'biotin']);
  tryAdd('vitaminB9',  ['vitamine b9', 'vitamin b9', 'folate', 'acide folique', 'folic acid']);
  tryAdd('vitaminB12', ['vitamine b12', 'vitamin b12', 'cobalamine', 'cobalamin']);
  tryAdd('vitaminC',   ['vitamine c', 'vitamin c', 'acide ascorbique', 'ascorbic acid']);
  tryAdd('vitaminD',   ['vitamine d', 'vitamin d', 'calciférol', 'calciferol']);
  tryAdd('vitaminE',   ['vitamine e', 'vitamin e', 'tocophérol', 'tocopherol']);
  tryAdd('vitaminK',   ['vitamine k', 'vitamin k', 'phylloquinone']);

  // Minéraux
  tryAdd('magnesium',   ['magnésium', 'magnesium']);
  tryAdd('phosphorus',  ['phosphore', 'phosphorus']);
  tryAdd('zinc',        ['zinc']);
  tryAdd('selenium',    ['sélénium', 'selenium']);
  tryAdd('copper',      ['cuivre', 'copper']);
  tryAdd('manganese',   ['manganèse', 'manganese']);
  tryAdd('iodine',      ['iode', 'iodine', 'iodure']);
  tryAdd('chromium',    ['chrome', 'chromium']);
  tryAdd('molybdenum',  ['molybdène', 'molybdenum']);
  tryAdd('fluoride',    ['fluorure', 'fluoride', 'fluor']);
  tryAdd('chloride',    ['chlorure', 'chloride']);

  // Autres
  tryAdd('caffeine',    ['caféine', 'caffeine']);
  tryAdd('alcohol',     ['alcool', 'alcohol']);
  tryAdd('taurine',     ['taurine']);
  tryAdd('creatine',    ['créatine', 'creatine']);

  return { standard, extra };
}

export function ScannerScreen() {
  const weatherBg = useWeatherBg();
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [webcamActive, setWebcamActive] = useState(false);
  const [nativeScanActive, setNativeScanActive] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [scanMode, setScanMode] = useState<'barcode' | 'nutrition'>('nutrition');
  const [capturedOcrValues, setCapturedOcrValues] = useState<any>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [ocrPreview, setOcrPreview] = useState<any>(null);
  const [nutritionCapturing, setNutritionCapturing] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const navigation = useNavigation<any>();
  const setLastScannedProduct = useStore((s) => s.setLastScannedProduct);
  const setLastScanOcrValues = useStore((s) => s.setLastScanOcrValues);
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    return () => { stopWebcam(); };
  }, []);

  const goToProduct = (product: any) => {
    setLastScannedProduct(product);
    stopWebcam();
    setNativeScanActive(false);
    triggerInterstitial();
    navigation.navigate('Product');
  };

  // Scan caméra native : code-barres (après capture du tableau nutritif)
  const handleBarcodeDetected = async (barcode: string) => {
    if (loading || !barcode) return;
    if (!/^\d{8,14}$/.test(barcode)) {
      Alert.alert('Code invalide', 'Le code-barres doit contenir entre 8 et 14 chiffres.');
      setScanned(false);
      return;
    }
    setLoading(true);
    setScanStatus('Recherche du produit...');
    try {
      const product = await scanProduct(barcode);

      if (capturedOcrValues) {
        const values = {
          calories:     capturedOcrValues.calories     ?? null,
          fat:          capturedOcrValues.fat          ?? null,
          saturatedFat: capturedOcrValues.saturatedFat ?? null,
          carbs:        capturedOcrValues.carbs        ?? null,
          sugars:       capturedOcrValues.sugars       ?? null,
          fiber:        capturedOcrValues.fiber        ?? null,
          proteins:     capturedOcrValues.proteins     ?? null,
          salt:         capturedOcrValues.salt         ?? null,
          cholesterol:  capturedOcrValues.cholesterol  ?? null,
          iron:         capturedOcrValues.iron         ?? null,
          calcium:      capturedOcrValues.calcium      ?? null,
          potassium:    capturedOcrValues.potassium    ?? null,
          extraNutrients: capturedOcrValues.extra && Object.keys(capturedOcrValues.extra).length > 0 ? capturedOcrValues.extra : undefined,
        };
        try { await saveNutritionDirect(product.barcode, product.name, values); } catch {}
        if (capturedPhotoUri) {
          uploadNutritionLabel(product.barcode, capturedPhotoUri).catch(() => {});
        }
        setLastScanOcrValues({
          calories:     capturedOcrValues.calories     != null ? String(capturedOcrValues.calories)     : '',
          fat:          capturedOcrValues.fat          != null ? String(capturedOcrValues.fat)          : '',
          saturatedFat: capturedOcrValues.saturatedFat != null ? String(capturedOcrValues.saturatedFat) : '',
          carbs:        capturedOcrValues.carbs        != null ? String(capturedOcrValues.carbs)        : '',
          sugars:       capturedOcrValues.sugars       != null ? String(capturedOcrValues.sugars)       : '',
          fiber:        capturedOcrValues.fiber        != null ? String(capturedOcrValues.fiber)        : '',
          proteins:     capturedOcrValues.proteins     != null ? String(capturedOcrValues.proteins)     : '',
          salt:         capturedOcrValues.salt         != null ? String(capturedOcrValues.salt)         : '',
        });
      } else {
        setLastScanOcrValues(null);
      }

      goToProduct(product);
    } catch (error: any) {
      setTimeout(() => setScanned(false), 2000);
      if (error.response?.data?.upgrade) {
        Alert.alert('Limite atteinte', 'Tu as atteint la limite de 3 scans gratuits par jour. Passe au Premium!', [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Premium $3.99/mois', onPress: () => navigation.navigate('Profile') },
        ]);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        // intercepteur axios gère la déconnexion
      } else if (error.response?.status === 404) {
        Alert.alert('Produit non trouvé', 'Ce code-barres n\'est pas dans notre base de données.');
      } else {
        Alert.alert('Erreur', 'Impossible de scanner le produit. Vérifie ta connexion internet.');
      }
      setLoading(false);
      setScanStatus('');
    }
  };

  // Étape 1 : capture le tableau nutritif → ML Kit on-device → passe au scan code-barres
  const captureNutrition = async () => {
    if (!cameraRef.current) return;
    setNutritionCapturing(true);
    setOcrError('');
    setScanStatus('Lecture des valeurs...');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, exif: false });
      if (!photo?.uri) {
        setOcrError('Impossible de prendre la photo. Réessaie.');
        setNutritionCapturing(false);
        setScanStatus('');
        return;
      }

      const result = await TextRecognition.recognize(photo.uri);
      const { standard, extra } = parseNutritionFromOCR(result.text);
      const hasValues = Object.values(standard).some(v => v !== null) || Object.keys(extra).length > 0;

      if (!hasValues) {
        setOcrError('Tableau non détecté. Rapproche la caméra et réessaie.');
        setNutritionCapturing(false);
        setScanStatus('');
        return;
      }

      setCapturedPhotoUri(photo.uri);
      setOcrPreview({ ...standard, extra });
      setNutritionCapturing(false);
      setScanStatus('');
    } catch {
      setOcrError('Erreur lors de la lecture. Réessaie.');
      setNutritionCapturing(false);
      setScanStatus('');
    }
  };

  // Scan manuel (texte) : pas de caméra disponible → navigue directement
  const handleManualScan = async (barcode: string) => {
    if (loading || !barcode) return;
    if (!/^\d{8,14}$/.test(barcode)) {
      Alert.alert('Code invalide', 'Le code-barres doit contenir entre 8 et 14 chiffres.');
      return;
    }
    setLoading(true);
    try {
      const product = await scanProduct(barcode);
      setLastScanOcrValues(null);
      goToProduct(product);
    } catch (error: any) {
      if (error.response?.data?.upgrade) {
        Alert.alert('Limite atteinte', 'Tu as atteint la limite de 3 scans gratuits par jour. Passe au Premium!', [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Premium $3.99/mois', onPress: () => navigation.navigate('Profile') },
        ]);
      } else if (error.response?.status === 404) {
        Alert.alert('Produit non trouvé', 'Ce code-barres n\'est pas dans notre base de données.');
      } else {
        Alert.alert('Erreur', 'Impossible de scanner le produit. Vérifie ta connexion internet.');
      }
    } finally {
      setLoading(false);
      setManualBarcode('');
    }
  };

  const startWebcam = async () => {
    if (Platform.OS !== 'web') return;
    try {
      setWebcamActive(true);
      setScanStatus('Activation de la caméra...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: 'environment' } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanStatus('Caméra active — montre un code-barres...');
      setTimeout(() => { startBarcodeDetection(); }, 1000);
    } catch (err: any) {
      setWebcamActive(false);
      setScanStatus('');
      Alert.alert('Erreur caméra', `Impossible d'accéder à la caméra.\n\n${err?.message || 'Vérifie les permissions dans les paramètres.'}`);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setWebcamActive(false);
    setScanStatus('');
  };

  const startBarcodeDetection = async () => {
    let detector: any = null;
    try {
      // @ts-ignore
      if ('BarcodeDetector' in window) {
        // @ts-ignore
        detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      } else {
        const { BarcodeDetector } = await import('barcode-detector');
        detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      }
    } catch {
      setScanStatus('Erreur de chargement du scanner. Entre le code manuellement.');
      return;
    }
    setScanStatus('Scanner prêt — montre un code-barres...');
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          setScanStatus(`Code détecté: ${code}`);
          clearInterval(scanIntervalRef.current);
          handleManualScan(code);
        }
      } catch {}
    }, 300);
  };

  const openNativeCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission refusée', 'L\'accès à la caméra est nécessaire pour scanner les codes-barres. Active-le dans les paramètres de l\'app.');
        return;
      }
    }
    setScanned(false);
    setScanMode('nutrition');
    setCapturedOcrValues(null);
    setCapturedPhotoUri(null);
    setOcrPreview(null);
    setNutritionCapturing(false);
    setOcrError('');
    setNativeScanActive(true);
  };

  const closeNativeCamera = () => {
    setNativeScanActive(false);
    setScanMode('nutrition');
    setCapturedOcrValues(null);
    setCapturedPhotoUri(null);
    setOcrPreview(null);
    setNutritionCapturing(false);
    setOcrError('');
  };

  // ─── Web ────────────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <WeatherScreen><View style={styles.container}>
        <View style={styles.topBar}><View /><LanguageSelector /></View>
        <Text style={styles.title}>{t('scanner.title')}</Text>
        <Text style={styles.subtitle}>{t('scanner.subtitle')}</Text>

        {!webcamActive ? (
          <TouchableOpacity style={styles.cameraButton} onPress={startWebcam}>
            <Text style={styles.cameraIcon}>[ ]</Text>
            <Text style={styles.cameraText}>{t('scanner.open.camera')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.webcamContainer}>
            <View style={styles.webcamWrapper}>
              {/* @ts-ignore */}
              <video
                ref={videoRef as any}
                style={{ width: '100%', height: 300, borderRadius: 12, objectFit: 'cover', background: '#000' }}
                autoPlay playsInline muted
              />
              <View style={styles.scanOverlay}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              {/* @ts-ignore */}
              <canvas ref={canvasRef as any} style={{ display: 'none' }} />
            </View>
            {scanStatus ? <Text style={styles.scanStatus}>{scanStatus}</Text> : null}
            {loading && <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 10 }} />}
            <TouchableOpacity style={styles.stopButton} onPress={stopWebcam}>
              <Text style={styles.stopButtonText}>{t('scanner.close.camera')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.manualSection}>
          <Text style={styles.sectionTitle}>{t('scanner.manual')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ex: 3017620422003"
              placeholderTextColor="#666"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="number-pad"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.scanButton, loading && styles.disabled]}
              onPress={() => handleManualScan(manualBarcode)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.scanButtonText}>{t('scanner.analyze')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View></WeatherScreen>
    );
  }

  // ─── Native (Android / iOS) ─────────────────────────────────────────────────
  return (
    <>
      <Modal visible={nativeScanActive} animationType="slide" statusBarTranslucent onRequestClose={closeNativeCamera}>
        <StatusBar hidden />
        <View style={styles.cameraFullScreen}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            autofocus="on"
            barcodeScannerSettings={scanMode === 'barcode' ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] } : undefined}
            onBarcodeScanned={scanMode === 'barcode' && !scanned ? (result) => { setScanned(true); handleBarcodeDetected(result.data); } : undefined}
          />

          {/* ── Mode code-barres (défaut) ── */}
          {scanMode === 'barcode' && (
            <View style={styles.cameraOverlay} pointerEvents="none">
              <View style={styles.cameraOverlayTop} />
              <View style={styles.cameraOverlayMiddle}>
                <View style={styles.cameraOverlaySide} />
                <View style={styles.barcodeFrame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <View style={styles.cameraOverlaySide} />
              </View>
              <View style={styles.cameraOverlayBottom}>
                <Text style={styles.viewfinderHint}>Étape 2 — Cadre le code-barres dans le rectangle</Text>
              </View>
            </View>
          )}

          {/* ── Mode tableau nutritif ── */}
          {scanMode === 'nutrition' && (
            <>
              <View style={styles.nutritionPromptFooter}>
                {nutritionCapturing ? (
                  <View style={styles.capturingRow}>
                    <ActivityIndicator color="#22c55e" size="small" />
                    <Text style={styles.capturingText}>Lecture des valeurs...</Text>
                  </View>
                ) : ocrPreview ? (
                  <>
                    <View style={styles.ocrResultBox}>
                      {[
                        { label: 'Calories', key: 'calories', unit: 'kcal' },
                        { label: 'Lipides', key: 'fat', unit: 'g' },
                        { label: 'Saturés', key: 'saturatedFat', unit: 'g' },
                        { label: 'Gras trans', key: 'transFat', unit: 'g' },
                        { label: 'Glucides', key: 'carbs', unit: 'g' },
                        { label: 'Sucres', key: 'sugars', unit: 'g' },
                        { label: 'Fibres', key: 'fiber', unit: 'g' },
                        { label: 'Protéines', key: 'proteins', unit: 'g' },
                        { label: 'Sel', key: 'salt', unit: 'g' },
                        { label: 'Cholestérol', key: 'cholesterol', unit: 'mg' },
                        { label: 'Fer', key: 'iron', unit: 'mg' },
                        { label: 'Calcium', key: 'calcium', unit: 'mg' },
                        { label: 'Potassium', key: 'potassium', unit: 'mg' },
                      ].filter(r => ocrPreview[r.key] != null).map(r => (
                        <Text key={r.key} style={styles.ocrResultRow}>
                          <Text style={styles.ocrResultLabel}>{r.label}: </Text>
                          <Text style={styles.ocrResultValue}>{ocrPreview[r.key]} {r.unit}</Text>
                        </Text>
                      ))}
                      {ocrPreview.extra && Object.entries(ocrPreview.extra).map(([k, v]) => (
                        <Text key={k} style={styles.ocrResultRow}>
                          <Text style={styles.ocrResultLabel}>{k}: </Text>
                          <Text style={styles.ocrResultValue}>{String(v)}</Text>
                        </Text>
                      ))}
                    </View>
                    <TouchableOpacity style={styles.captureBtn} onPress={() => { setCapturedOcrValues(ocrPreview); setOcrPreview(null); setScanned(false); setScanMode('barcode'); }}>
                      <Text style={styles.captureBtnText}>✅  Confirmer — Scanner le code-barres</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.skipBtn} onPress={() => { setOcrPreview(null); setOcrError(''); }}>
                      <Text style={styles.skipBtnText}>🔄  Réessayer</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {ocrError ? <Text style={styles.ocrErrorText}>{ocrError}</Text> : null}
                    <TouchableOpacity style={styles.captureBtn} onPress={captureNutrition}>
                      <Text style={styles.captureBtnText}>{ocrError ? '🔄  Réessayer' : '📷  Scanner le tableau nutritif'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.skipBtn} onPress={() => { setCapturedOcrValues(null); setOcrError(''); setScanMode('barcode'); setScanned(false); }}>
                      <Text style={styles.skipBtnText}>Passer →</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>{scanStatus || 'Recherche du produit...'}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.closeCameraBtn} onPress={closeNativeCamera}>
            <Text style={styles.closeCameraBtnText}>✕ Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <WeatherScreen><View style={styles.container}>
        <View style={styles.topBar}><View /><LanguageSelector /></View>
        <Text style={styles.title}>{t('scanner.title')}</Text>
        <Text style={styles.subtitle}>{t('scanner.subtitle')}</Text>

        <TouchableOpacity style={styles.cameraButton} onPress={openNativeCamera}>
          <Text style={styles.cameraIcon}>[ ]</Text>
          <Text style={styles.cameraText}>{t('scanner.open.camera')}</Text>
        </TouchableOpacity>

        <View style={styles.manualSection}>
          <Text style={styles.sectionTitle}>{t('scanner.manual')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ex: 3017620422003"
              placeholderTextColor="#666"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="number-pad"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.scanButton, loading && styles.disabled]}
              onPress={() => handleManualScan(manualBarcode)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.scanButtonText}>{t('scanner.analyze')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View></WeatherScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  subtitle: { color: '#ccc', fontSize: 13, marginTop: 4, marginBottom: 30 },
  cameraButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  cameraIcon: { color: '#fff', fontSize: 40, marginBottom: 8 },
  cameraText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  webcamContainer: { marginBottom: 20 },
  webcamWrapper: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  scanOverlay: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: 220, height: 140,
    marginTop: -70, marginLeft: -110,
  },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#22c55e' },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanStatus: { color: '#22c55e', fontSize: 13, textAlign: 'center', marginTop: 10 },
  stopButton: { backgroundColor: '#333', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  stopButtonText: { color: '#ef4444', fontSize: 14 },
  manualSection: { marginBottom: 28 },
  sectionTitle: { color: '#ccc', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  scanButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // Native camera full-screen
  cameraFullScreen: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject },
  cameraOverlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  cameraOverlayMiddle: { flexDirection: 'row', minHeight: 220 },
  cameraOverlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  nutritionFrame: { width: 270, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 6, overflow: 'hidden', borderWidth: 2, borderColor: '#000' },
  nfHeader: { backgroundColor: '#fff', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 },
  nfHeaderTextBig: { color: '#000', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  nfHeaderTextSm: { color: '#000', fontSize: 12, fontWeight: '700' },
  nfDividerThick: { height: 8, backgroundColor: '#000' },
  nfDivider: { height: 1, backgroundColor: '#ccc', marginHorizontal: 10 },
  nfRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 4 },
  nfLabel: { color: '#000', fontSize: 12, fontWeight: '600' },
  nfValue: { color: '#1a7a1a', fontSize: 12, fontWeight: '700' },
  nfPlaceholder: { paddingHorizontal: 10, paddingVertical: 16, alignItems: 'center' },
  nfPlaceholderText: { color: '#888', fontSize: 12, textAlign: 'center' },
  ocrResultBox: { backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 12, padding: 12, marginBottom: 12, width: '100%', maxHeight: 200 },
  ocrResultRow: { fontSize: 13, marginBottom: 2 },
  ocrResultLabel: { color: '#ccc' },
  ocrResultValue: { color: '#22c55e', fontWeight: '700' },
  barcodeFrame: { width: 290, height: 220, position: 'relative' },
  cameraOverlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 14 },
  viewfinderHint: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  // Nutrition prompt (affiché seulement si valeurs manquantes)
  nutritionPromptHeader: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  nutritionPromptTitle: { color: '#fff', fontSize: 19, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  nutritionPromptSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' },
  nutritionPromptFooter: { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 30 },
  capturingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  capturingText: { color: '#22c55e', fontSize: 15, fontWeight: '600' },
  ocrErrorText: { color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 12, paddingHorizontal: 10 },
  captureBtn: { backgroundColor: '#22c55e', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  captureBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  skipBtn: { marginTop: 12, paddingVertical: 10, alignItems: 'center' },
  skipBtnText: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  // Shared
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 15, textAlign: 'center', paddingHorizontal: 30 },
  closeCameraBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  closeCameraBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
