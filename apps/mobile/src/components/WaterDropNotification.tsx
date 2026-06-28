import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { playWaterDropSound } from '../services/waterIntakeService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  message: string;
  ml: number;
  temperature?: number;
  weatherIcon?: string;
  onDismiss: () => void;
}

export function WaterDropNotification({ message, ml, temperature, weatherIcon, onDismiss }: Props) {
  const dropY = useRef(new Animated.Value(-80)).current;
  const dropOpacity = useRef(new Animated.Value(1)).current;
  const dropScale = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0.6)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    playWaterDropSound();

    // Phase 1 : la goutte tombe
    Animated.timing(dropY, {
      toValue: 160,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      // Phase 2 : impact — la goutte disparaît et le ripple s'étend
      Animated.parallel([
        Animated.timing(dropScale, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(dropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(rippleScale, { toValue: 3, duration: 500, useNativeDriver: true }),
        Animated.timing(rippleOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();

      // Phase 3 : la carte apparaît
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(cardY, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
      }, 300);
    });
  }, []);

  return (
    <View style={styles.overlay}>
      {/* Goutte qui tombe */}
      <Animated.View style={[styles.dropContainer, { transform: [{ translateY: dropY }, { scale: dropScale }], opacity: dropOpacity }]}>
        <View style={styles.drop}>
          <View style={styles.dropTop} />
          <View style={styles.dropBottom} />
        </View>
      </Animated.View>

      {/* Ripple à l'impact */}
      <Animated.View style={[
        styles.ripple,
        { transform: [{ scale: rippleScale }], opacity: rippleOpacity }
      ]} />

      {/* Carte notification */}
      <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.dropEmoji}>💧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Rappel hydratation</Text>
            {temperature !== undefined && (
              <Text style={styles.weather}>{weatherIcon} {temperature}°C dehors</Text>
            )}
          </View>
          <Text style={styles.ml}>{ml} ml</Text>
        </View>

        <Text style={styles.cardMessage}>{message}</Text>

        {temperature !== undefined && temperature >= 25 && (
          <View style={styles.hotAlert}>
            <Text style={styles.hotAlertText}>
              {temperature >= 30 ? '🔥 Chaleur intense — bois encore plus!' : '☀️ Il fait chaud — hydrate-toi davantage'}
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.doneBtn} onPress={onDismiss}>
            <Text style={styles.doneBtnText}>C'est bu!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterBtn} onPress={onDismiss}>
            <Text style={styles.laterBtnText}>Plus tard</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  dropContainer: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    zIndex: 10000,
  },
  drop: {
    alignItems: 'center',
  },
  dropTop: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#38bdf8',
  },
  dropBottom: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#38bdf8',
    marginTop: -2,
  },
  ripple: {
    position: 'absolute',
    top: 200,
    width: 60,
    height: 20,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#38bdf8',
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#0c1a2e',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  dropEmoji: { fontSize: 28 },
  cardTitle: { color: '#38bdf8', fontSize: 16, fontWeight: 'bold' },
  weather: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  ml: { color: '#38bdf8', fontSize: 22, fontWeight: 'bold' },
  cardMessage: { color: '#e2e8f0', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  hotAlert: {
    backgroundColor: '#1e1a0e',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
  },
  hotAlertText: { color: '#fdba74', fontSize: 13 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  doneBtn: {
    flex: 1,
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  doneBtnText: { color: '#0c1a2e', fontWeight: 'bold', fontSize: 15 },
  laterBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  laterBtnText: { color: '#94a3b8', fontSize: 15 },
});
