import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { getSubscriptionStatus } from '../services/api';

export function SubscriptionSuccessScreen() {
  const navigation = useNavigation<any>();
  const setUser = useStore((s) => s.setUser);
  const user = useStore((s) => s.user);

  useEffect(() => {
    const refresh = async () => {
      try {
        const status = await getSubscriptionStatus();
        if (user) {
          setUser({ ...user, plan: status.plan, groceryAddon: status.groceryAddon });
        }
      } catch {}
    };
    refresh();
  }, []);

  return (
    <View style={s.container}>
      <Text style={s.emoji}>🎉</Text>
      <Text style={s.title}>Merci!</Text>
      <Text style={s.subtitle}>Ton abonnement Premium est actif</Text>
      <Text style={s.desc}>
        Tu as maintenant acces a toutes les fonctionnalites: circulaires, comparateur de prix, liste d'epicerie et plus.
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
});
