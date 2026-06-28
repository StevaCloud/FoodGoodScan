import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';

const DOG_COLORS = [
  { id: 'golden', label: 'Doré',  hex: '#C8860A' },
  { id: 'brown',  label: 'Brun',  hex: '#8B4513' },
  { id: 'black',  label: 'Noir',  hex: '#3a3a3a' },
  { id: 'cream',  label: 'Crème', hex: '#E8DFC0' },
  { id: 'gray',   label: 'Gris',  hex: '#909090' },
];

const CAT_COLORS = [
  { id: 'gray',   label: 'Gris',  hex: '#8C96A8' },
  { id: 'orange', label: 'Roux',  hex: '#C4611A' },
  { id: 'black',  label: 'Noir',  hex: '#3a3a3a' },
  { id: 'white',  label: 'Blanc', hex: '#E8DFC0' },
  { id: 'calico', label: 'Tigré', hex: '#C49A14' },
];

export function PetSelectionScreen() {
  const navigation = useNavigation<any>();
  const setPet = useStore((s) => s.setPet);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<'dog' | 'cat'>('dog');
  const [name, setName] = useState('');
  const [color, setColor] = useState(DOG_COLORS[0].hex);

  const colors = type === 'dog' ? DOG_COLORS : CAT_COLORS;

  const confirm = () => {
    const now = new Date().toISOString();
    setPet({
      type,
      name: name.trim() || (type === 'dog' ? 'Rex' : 'Minou'),
      color,
      hunger: 80,
      thirst: 80,
      lastFed: now,
      lastWatered: now,
      lastUpdated: now,
    });
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Étape 1 — Choisir l'animal */}
      {step === 1 && (
        <>
          <Text style={s.emoji}>🐾</Text>
          <Text style={s.title}>Choisissez votre compagnon</Text>
          <Text style={s.sub}>Votre animal compte sur vous pour le nourrir et l'hydrater chaque jour !</Text>

          <TouchableOpacity
            style={[s.animalCard, type === 'dog' && s.animalCardActive]}
            onPress={() => { setType('dog'); setColor(DOG_COLORS[0].hex); }}
          >
            <Text style={s.animalEmoji}>🐶</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.animalName}>Chien</Text>
              <Text style={s.animalDesc}>Fidèle et joyeux — le meilleur ami de l'homme</Text>
            </View>
            {type === 'dog' && <Text style={s.check}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.animalCard, type === 'cat' && s.animalCardActive]}
            onPress={() => { setType('cat'); setColor(CAT_COLORS[0].hex); }}
          >
            <Text style={s.animalEmoji}>🐱</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.animalName}>Chat</Text>
              <Text style={s.animalDesc}>Indépendant et câlin — un compagnon mystérieux</Text>
            </View>
            {type === 'cat' && <Text style={s.check}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.btn} onPress={() => setStep(2)}>
            <Text style={s.btnText}>Suivant →</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Étape 2 — Nom */}
      {step === 2 && (
        <>
          <Text style={s.emoji}>{type === 'dog' ? '🐶' : '🐱'}</Text>
          <Text style={s.title}>Comment s'appelle-t-il ?</Text>
          <Text style={s.sub}>Donnez un prénom à votre {type === 'dog' ? 'chien' : 'chat'}</Text>

          <TextInput
            style={s.nameInput}
            placeholder={type === 'dog' ? 'Rex, Buddy, Max...' : 'Minou, Luna, Simba...'}
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
            maxLength={20}
            autoFocus
          />

          <View style={s.row}>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setStep(1)}>
              <Text style={s.btnSecondaryText}>← Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={() => setStep(3)}>
              <Text style={s.btnText}>Suivant →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Étape 3 — Couleur */}
      {step === 3 && (
        <>
          <Text style={s.emoji}>{type === 'dog' ? '🐶' : '🐱'}</Text>
          <Text style={s.title}>Quelle est sa couleur ?</Text>
          <Text style={s.sub}>Personnalisez l'apparence de {name || (type === 'dog' ? 'votre chien' : 'votre chat')}</Text>

          <View style={s.colorGrid}>
            {colors.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[s.colorSwatch, { backgroundColor: c.hex }, color === c.hex && s.colorSwatchActive]}
                onPress={() => setColor(c.hex)}
              >
                {color === c.hex && <Text style={s.colorCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.colorLabels}>
            {colors.map((c) => (
              <Text key={c.id} style={[s.colorLabel, color === c.hex && { color: '#fff' }]}>{c.label}</Text>
            ))}
          </View>

          {/* Aperçu */}
          <View style={[s.preview, { borderColor: color }]}>
            <Text style={{ fontSize: 60 }}>{type === 'dog' ? '🐶' : '🐱'}</Text>
            <View style={[s.colorDot, { backgroundColor: color }]} />
            <Text style={s.previewName}>{name || (type === 'dog' ? 'Rex' : 'Minou')}</Text>
          </View>

          <View style={s.row}>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setStep(2)}>
              <Text style={s.btnSecondaryText}>← Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={confirm}>
              <Text style={s.btnText}>Adopter ! 🐾</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Indicateur d'étape */}
      <View style={s.steps}>
        {([1, 2, 3] as const).map((n) => (
          <View key={n} style={[s.stepDot, step === n && s.stepDotActive]} />
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 24, paddingTop: 60, alignItems: 'center', minHeight: '100%' },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  sub: { color: '#aaa', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 32, paddingHorizontal: 10 },
  animalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 18, marginBottom: 12, width: '100%', borderWidth: 2, borderColor: '#2a2a2a', gap: 14 },
  animalCardActive: { borderColor: '#22c55e', backgroundColor: '#0f2d1f' },
  animalEmoji: { fontSize: 44 },
  animalName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  animalDesc: { color: '#aaa', fontSize: 13, marginTop: 3 },
  check: { color: '#22c55e', fontSize: 22, fontWeight: 'bold' },
  nameInput: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 18, color: '#fff', fontSize: 20, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: '#333', textAlign: 'center' },
  colorGrid: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  colorSwatch: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  colorSwatchActive: { borderWidth: 3, borderColor: '#fff' },
  colorCheck: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  colorLabels: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  colorLabel: { width: 52, color: '#555', fontSize: 10, textAlign: 'center' },
  preview: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 28, width: '100%', borderWidth: 2, gap: 8 },
  colorDot: { width: 20, height: 20, borderRadius: 10 },
  previewName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnSecondary: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  btnSecondaryText: { color: '#aaa', fontSize: 16 },
  steps: { flexDirection: 'row', gap: 8, marginTop: 32 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#333' },
  stepDotActive: { backgroundColor: '#22c55e', width: 24 },
});
