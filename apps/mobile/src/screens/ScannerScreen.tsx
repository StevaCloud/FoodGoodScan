import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { scanProduct } from '../services/api';
import { useStore } from '../store/useStore';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { WeatherScreen } from '../components/WeatherBackground';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';

export function ScannerScreen() {
  const weatherBg = useWeatherBg();
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [webcamActive, setWebcamActive] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const navigation = useNavigation<any>();
  const setLastScannedProduct = useStore((s) => s.setLastScannedProduct);
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const handleScan = async (barcode: string) => {
    if (loading || !barcode) return;
    if (!/^\d{8,14}$/.test(barcode)) {
      Alert.alert('Code invalide', 'Le code-barres doit contenir entre 8 et 14 chiffres.');
      return;
    }
    setLoading(true);
    setScanStatus('');

    try {
      const product = await scanProduct(barcode);
      setLastScannedProduct(product);
      stopWebcam();
      navigation.navigate('Product');
    } catch (error: any) {
      if (error.response?.data?.upgrade) {
        Alert.alert('Limite atteinte', 'Tu as atteint la limite de 3 scans gratuits par jour. Passe au Premium!', [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Premium $3.99/mois', onPress: () => navigation.navigate('Profile') },
        ]);
      } else if (error.response?.status === 404) {
        Alert.alert('Produit non trouvé', 'Ce code-barres n\'est pas dans notre base de données.');
      } else {
        Alert.alert('Erreur', 'Impossible de scanner le produit.');
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
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanStatus('Caméra active — montre un code-barres...');

      setTimeout(() => {
        startBarcodeDetection();
      }, 1000);
    } catch (err: any) {
      setWebcamActive(false);
      setScanStatus('');
      Alert.alert('Erreur caméra', `Impossible d'accéder à la caméra.\n\n${err?.message || 'Vérifie les permissions dans les paramètres Chrome.'}`);
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
          handleScan(code);
        }
      } catch {}
    }, 300);
  };

  if (Platform.OS === 'web') {
    return (
      <WeatherScreen><View style={styles.container}>
        <View style={styles.topBar}><View /><LanguageSelector /></View>
        <Text style={styles.title}>{ t('scanner.title') }</Text>
        <Text style={styles.subtitle}>{ t('scanner.subtitle') }</Text>

        {!webcamActive ? (
          <TouchableOpacity style={styles.cameraButton} onPress={startWebcam}>
            <Text style={styles.cameraIcon}>[ ]</Text>
            <Text style={styles.cameraText}>{ t('scanner.open.camera') }</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.webcamContainer}>
            <View style={styles.webcamWrapper}>
              {/* @ts-ignore */}
              <video
                ref={videoRef as any}
                style={{ width: '100%', height: 300, borderRadius: 12, objectFit: 'cover', background: '#000' }}
                autoPlay
                playsInline
                muted
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
              <Text style={styles.stopButtonText}>{ t('scanner.close.camera') }</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.manualSection}>
          <Text style={styles.sectionTitle}>{ t('scanner.manual') }</Text>
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
              onPress={() => handleScan(manualBarcode)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.scanButtonText}>{ t('scanner.analyze') }</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View></WeatherScreen>
    );
  }

  return (
    <WeatherScreen><View style={styles.container}>
      <View style={styles.topBar}><View /><LanguageSelector /></View>
      <Text style={styles.title}>{ t('scanner.title') }</Text>
      <Text style={styles.subtitle}>{ t('scanner.subtitle') }</Text>

      <TouchableOpacity style={styles.cameraButton}>
        <Text style={styles.cameraIcon}>[ ]</Text>
        <Text style={styles.cameraText}>{ t('scanner.open.camera') }</Text>
      </TouchableOpacity>

      <View style={styles.manualSection}>
        <Text style={styles.sectionTitle}>{ t('scanner.manual') }</Text>
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
            onPress={() => handleScan(manualBarcode)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.scanButtonText}>{ t('scanner.analyze') }</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View></WeatherScreen>
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
    top: '50%',
    left: '50%',
    width: 220,
    height: 140,
    marginTop: -70,
    marginLeft: -110,
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
});
