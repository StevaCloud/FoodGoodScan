import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform, Modal, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { scanProduct, ocrProductLabel, saveNutritionDirect } from '../services/api';
import { useStore } from '../store/useStore';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { WeatherScreen } from '../components/WeatherBackground';
import { triggerInterstitial } from '../components/Interstitial';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';
import { CameraView, useCameraPermissions } from 'expo-camera';

export function ScannerScreen() {
  const weatherBg = useWeatherBg();
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [webcamActive, setWebcamActive] = useState(false);
  const [nativeScanActive, setNativeScanActive] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [scanMode, setScanMode] = useState<'barcode' | 'nutrition'>('barcode');
  const [pendingProduct, setPendingProduct] = useState<any>(null);
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

  // Scan caméra native : code-barres d'abord
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
      const n = product.nutriments as any;
      const hasNutrition = n && (
        (n['energy-kcal_100g'] || 0) > 0 ||
        (n.proteins_100g || 0) > 0 ||
        (n.fat_100g || 0) > 0
      );
      if (hasNutrition) {
        // Valeurs déjà dans la BD → pas de scan tableau
        setLastScanOcrValues(null);
        goToProduct(product);
      } else {
        // Pas de valeurs → afficher l'étape scan tableau
        setPendingProduct(product);
        setScanMode('nutrition');
        setLoading(false);
        setScanStatus('');
        setScanned(false);
      }
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

  // Capture le tableau nutritif → OCR → sauvegarde directe confirmée sur le serveur
  const captureAndSaveNutrition = async () => {
    if (!cameraRef.current || !pendingProduct) return;
    setNutritionCapturing(true);
    setOcrError('');
    setScanStatus('Lecture des valeurs...');
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5, exif: false });
      if (!photo?.base64) {
        setOcrError('Impossible de prendre la photo. Réessaie.');
        setNutritionCapturing(false);
        setScanStatus('');
        return;
      }

      const ocr = await ocrProductLabel(`data:image/jpeg;base64,${photo.base64}`);
      const hasOcr = Object.values(ocr).some(v => v != null && (v as number) > 0);

      if (!hasOcr) {
        // OCR n'a rien trouvé → rester sur l'écran, laisser réessayer
        setOcrError('Tableau non détecté. Rapproche la caméra et réessaie.');
        setNutritionCapturing(false);
        setScanStatus('');
        return;
      }

      // Sauvegarde directe CONFIRMÉE sur le serveur
      const values = {
        calories:     ocr.calories     ?? null,
        fat:          ocr.fat          ?? null,
        saturatedFat: ocr.saturatedFat ?? null,
        carbs:        ocr.carbs        ?? null,
        sugars:       ocr.sugars       ?? null,
        fiber:        ocr.fiber        ?? null,
        proteins:     ocr.proteins     ?? null,
        salt:         ocr.salt         ?? null,
      };
      try { await saveNutritionDirect(pendingProduct.barcode, pendingProduct.name, values); } catch {}

      // Passer les valeurs à ProductScreen pour affichage
      setLastScanOcrValues({
        calories:     ocr.calories     != null ? String(ocr.calories)     : '',
        fat:          ocr.fat          != null ? String(ocr.fat)          : '',
        saturatedFat: ocr.saturatedFat != null ? String(ocr.saturatedFat) : '',
        carbs:        ocr.carbs        != null ? String(ocr.carbs)        : '',
        sugars:       ocr.sugars       != null ? String(ocr.sugars)       : '',
        fiber:        ocr.fiber        != null ? String(ocr.fiber)        : '',
        proteins:     ocr.proteins     != null ? String(ocr.proteins)     : '',
        salt:         ocr.salt         != null ? String(ocr.salt)         : '',
      });

      setNutritionCapturing(false);
      setScanStatus('');
      goToProduct(pendingProduct);
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
    setScanMode('barcode');
    setPendingProduct(null);
    setNutritionCapturing(false);
    setNativeScanActive(true);
  };

  const closeNativeCamera = () => {
    setNativeScanActive(false);
    setScanMode('barcode');
    setPendingProduct(null);
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
                <Text style={styles.viewfinderHint}>Cadre le code-barres dans le rectangle</Text>
              </View>
            </View>
          )}

          {/* ── Mode tableau nutritif (seulement si valeurs manquantes) ── */}
          {scanMode === 'nutrition' && (
            <>
              <View style={styles.cameraOverlay} pointerEvents="none">
                <View style={styles.cameraOverlayTop} />
                <View style={styles.cameraOverlayMiddle}>
                  <View style={styles.cameraOverlaySide} />
                  <View style={styles.nutritionFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                  <View style={styles.cameraOverlaySide} />
                </View>
                <View style={styles.cameraOverlayBottom} />
              </View>
              <View style={styles.nutritionPromptHeader} pointerEvents="none">
                <Text style={styles.nutritionPromptTitle}>📊 Valeurs nutritives manquantes</Text>
                <Text style={styles.nutritionPromptSub}>Aide la communauté en scannant le tableau nutritif</Text>
              </View>
              <View style={styles.nutritionPromptFooter}>
                {nutritionCapturing ? (
                  <View style={styles.capturingRow}>
                    <ActivityIndicator color="#22c55e" size="small" />
                    <Text style={styles.capturingText}>Lecture des valeurs...</Text>
                  </View>
                ) : (
                  <>
                    {ocrError ? <Text style={styles.ocrErrorText}>{ocrError}</Text> : null}
                    <TouchableOpacity style={styles.captureBtn} onPress={captureAndSaveNutrition}>
                      <Text style={styles.captureBtnText}>{ocrError ? '🔄  Réessayer' : '📷  Scanner le tableau nutritif'}</Text>
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
  cameraOverlayMiddle: { flexDirection: 'row', height: 220 },
  cameraOverlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  nutritionFrame: { width: 290, height: 220, position: 'relative' },
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
  // Shared
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 15, textAlign: 'center', paddingHorizontal: 30 },
  closeCameraBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  closeCameraBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
