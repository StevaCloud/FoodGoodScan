import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function SubscriptionCancelScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <Text style={s.emoji}>😔</Text>
      <Text style={s.title}>Paiement annule</Text>
      <Text style={s.desc}>
        Pas de souci! Tu peux t'abonner a tout moment depuis ton profil.
      </Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Main')}>
        <Text style={s.btnText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', padding: 30 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  desc: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 16, lineHeight: 22 },
  btn: { backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, marginTop: 30 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
