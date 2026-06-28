import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { verifyCheckoutSession, getSubscriptionStatus } from '../services/api';

export function SubscriptionSuccessScreen() {
  const navigation = useNavigation<any>();
  const setUser = useStore((s) => s.setUser);
  const user = useStore((s) => s.user);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const activate = async () => {
      try {
        // Récupère le session_id depuis l'URL (web)
        let sessionId: string | null = null;
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          sessionId = params.get('session_id');
        }

        if (sessionId) {
          // Vérifie et active directement via Stripe (sans webhook)
          const result = await verifyCheckoutSession(sessionId);
          if (user) {
            setUser({ ...user, plan: result.plan, groceryAddon: result.groceryAddon });
          }
        } else {
          // Fallback: recharge le statut depuis la DB
          const status = await getSubscriptionStatus();
          if (user) {
            setUser({ ...user, plan: status.plan, groceryAddon: status.groceryAddon });
          }
        }
      } catch {
        // En cas d'erreur, on recharge quand même le statut
        try {
          const status = await getSubscriptionStatus();
          if (user) setUser({ ...user, plan: status.plan, groceryAddon: status.groceryAddon });
        } catch {}
      } finally {
        setVerifying(false);
      }
    };
    activate();
  }, []);

  if (verifying) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={s.verifyTxt}>Activation en cours...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.emoji}>🎉</Text>
      <Text style={s.title}>Merci!</Text>
      <Text style={s.subtitle}>Ton abonnement Premium est actif</Text>
      <Text style={s.desc}>
        Tu as maintenant accès à toutes les fonctionnalités: circulaires, comparateur de prix, liste d'épicerie et plus.
      </Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Main')}>
        <Text style={s.btnText}>Commencer</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', padding: 30 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { color: '#22c55e', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 8 },
  desc: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 16, lineHeight: 22 },
  btn: { backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, marginTop: 30 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  verifyTxt: { color: '#aaa', marginTop: 16, fontSize: 15 },
});
