import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Animated } from 'react-native';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { LanguageSelector } from '../components/LanguageSelector';
import ConfettiCannon from 'react-native-confetti-cannon';

const GOALS = [
  { id: 'lose', label: 'Perdre du poids', labelEn: 'Lose weight', icon: '↓' },
  { id: 'maintain', label: 'Maintenir mon poids', labelEn: 'Maintain weight', icon: '→' },
  { id: 'gain', label: 'Prendre du poids', labelEn: 'Gain weight', icon: '↑' },
  { id: 'health', label: 'Manger plus sainement', labelEn: 'Eat healthier', icon: '♥' },
  { id: 'muscle', label: 'Prendre du muscle', labelEn: 'Build muscle', icon: '◆' },
];

const DIETS = [
  { id: 'none', label: 'Aucun régime', labelEn: 'No specific diet' },
  { id: 'vegetarian', label: 'Végétarien', labelEn: 'Vegetarian' },
  { id: 'vegan', label: 'Végan', labelEn: 'Vegan' },
  { id: 'keto', label: 'Keto / Faible en glucides', labelEn: 'Keto / Low carb' },
  { id: 'glutenfree', label: 'Sans gluten', labelEn: 'Gluten free' },
  { id: 'lactosefree', label: 'Sans lactose', labelEn: 'Lactose free' },
  { id: 'halal', label: 'Halal', labelEn: 'Halal' },
  { id: 'kosher', label: 'Casher', labelEn: 'Kosher' },
];

const ALLERGIES = [
  { id: 'nuts', label: 'Noix', labelEn: 'Nuts' },
  { id: 'peanuts', label: 'Arachides', labelEn: 'Peanuts' },
  { id: 'milk', label: 'Lait', labelEn: 'Milk' },
  { id: 'eggs', label: 'Oeufs', labelEn: 'Eggs' },
  { id: 'soy', label: 'Soja', labelEn: 'Soy' },
  { id: 'wheat', label: 'Blé', labelEn: 'Wheat' },
  { id: 'gluten', label: 'Gluten', labelEn: 'Gluten' },
  { id: 'fish', label: 'Poisson', labelEn: 'Fish' },
  { id: 'shellfish', label: 'Fruits de mer', labelEn: 'Shellfish' },
  { id: 'sesame', label: 'Sésame', labelEn: 'Sesame' },
  { id: 'mustard', label: 'Moutarde', labelEn: 'Mustard' },
  { id: 'celery', label: 'Céleri', labelEn: 'Celery' },
  { id: 'lupin', label: 'Lupin', labelEn: 'Lupin' },
  { id: 'mollusks', label: 'Mollusques', labelEn: 'Mollusks' },
  { id: 'sulphites', label: 'Sulfites', labelEn: 'Sulphites' },
  { id: 'corn', label: 'Maïs', labelEn: 'Corn' },
  { id: 'lactose', label: 'Lactose', labelEn: 'Lactose' },
  { id: 'fructose', label: 'Fructose', labelEn: 'Fructose' },
  { id: 'casein', label: 'Caséine', labelEn: 'Casein' },
  { id: 'coconut', label: 'Noix de coco', labelEn: 'Coconut' },
  { id: 'almonds', label: 'Amandes', labelEn: 'Almonds' },
  { id: 'cashews', label: 'Noix de cajou', labelEn: 'Cashews' },
  { id: 'pistachios', label: 'Pistaches', labelEn: 'Pistachios' },
  { id: 'walnuts', label: 'Noix de Grenoble', labelEn: 'Walnuts' },
  { id: 'pecans', label: 'Pacanes', labelEn: 'Pecans' },
  { id: 'hazelnuts', label: 'Noisettes', labelEn: 'Hazelnuts' },
  { id: 'macadamia', label: 'Macadamia', labelEn: 'Macadamia' },
  { id: 'brazil', label: 'Noix du Brésil', labelEn: 'Brazil nuts' },
  { id: 'oats', label: 'Avoine', labelEn: 'Oats' },
  { id: 'rye', label: 'Seigle', labelEn: 'Rye' },
  { id: 'barley', label: 'Orge', labelEn: 'Barley' },
  { id: 'kiwi', label: 'Kiwi', labelEn: 'Kiwi' },
  { id: 'banana', label: 'Banane', labelEn: 'Banana' },
  { id: 'avocado', label: 'Avocat', labelEn: 'Avocado' },
  { id: 'latex', label: 'Latex (croisée)', labelEn: 'Latex (cross)' },
  { id: 'msg', label: 'Glutamate (MSG)', labelEn: 'MSG' },
  { id: 'aspartame', label: 'Aspartame', labelEn: 'Aspartame' },
  { id: 'red_dye', label: 'Colorant rouge', labelEn: 'Red dye' },
  { id: 'preservatives', label: 'Agents de conservation', labelEn: 'Preservatives' },
  { id: 'nitrites', label: 'Nitrites', labelEn: 'Nitrites' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sédentaire', labelEn: 'Sedentary', desc: 'Bureau, peu d\'activité' },
  { id: 'light', label: 'Légèrement actif', labelEn: 'Lightly active', desc: '1-2x exercice/semaine' },
  { id: 'moderate', label: 'Modérément actif', labelEn: 'Moderately active', desc: '3-5x exercice/semaine' },
  { id: 'active', label: 'Très actif', labelEn: 'Very active', desc: '6-7x exercice/semaine' },
];

interface HealthProfile {
  goal: string;
  diet: string;
  allergies: string[];
  activityLevel: string;
  age: string;
  weight: string;
  height: string;
  gender: string;
}

function AllergyStep({ profile, toggleAllergy, language, onNext }: { profile: HealthProfile; toggleAllergy: (id: string) => void; language: string; onNext: () => void }) {
  const [search, setSearch] = useState('');

  const getLabel = (item: { label: string; labelEn: string }) => language === 'en' ? item.labelEn : item.label;

  const filtered = search.length > 0
    ? ALLERGIES.filter((a) => a.label.toLowerCase().includes(search.toLowerCase()) || a.labelEn.toLowerCase().includes(search.toLowerCase()))
    : ALLERGIES;

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Allergies</Text>
      <Text style={styles.stepSubtitle}>Sélectionne tes allergies (si applicable)</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher une allergie..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
      />

      {profile.allergies.length > 0 && (
        <Text style={styles.selectedCount}>{profile.allergies.length} sélectionnée{profile.allergies.length > 1 ? 's' : ''}</Text>
      )}

      <View style={styles.allergyGrid}>
        {filtered.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.allergyChip, profile.allergies.includes(a.id) && styles.allergyChipActive]}
            onPress={() => toggleAllergy(a.id)}
          >
            <Text style={[styles.allergyChipText, profile.allergies.includes(a.id) && styles.allergyChipTextActive]}>
              {getLabel(a)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 && (
        <Text style={styles.noResults}>Aucune allergie trouvée pour "{search}"</Text>
      )}

      <TouchableOpacity style={styles.nextButton} onPress={onNext}>
        <Text style={styles.nextButtonText}>Suivant</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNext}>
        <Text style={styles.skipText}>Aucune allergie</Text>
      </TouchableOpacity>
    </View>
  );
}

function BodyInfoStep({ profile, setProfile, onNext }: { profile: HealthProfile; setProfile: (p: HealthProfile) => void; onNext: () => void }) {
  const [age, setAge] = useState(profile.age);
  const [weight, setWeight] = useState(profile.weight);
  const [height, setHeight] = useState(profile.height);
  const [gender, setGender] = useState(profile.gender);

  const handleNext = () => {
    setProfile({ ...profile, age, weight, height, gender });
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Parle-nous de toi</Text>
      <Text style={styles.stepSubtitle}>Pour personnaliser tes recommandations</Text>

      <View style={styles.genderRow}>
        {[{ id: 'male', label: 'Homme' }, { id: 'female', label: 'Femme' }].map((g) => (
          <TouchableOpacity
            key={g.id}
            style={[styles.genderButton, gender === g.id && styles.genderActive]}
            onPress={() => setGender(g.id)}
          >
            <Text style={[styles.genderText, gender === g.id && styles.genderTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Âge</Text>
        <TextInput style={styles.profileInput} placeholder="25" placeholderTextColor="#666" keyboardType="number-pad" value={age} onChangeText={setAge} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Poids (lbs)</Text>
        <TextInput style={styles.profileInput} placeholder="160" placeholderTextColor="#666" keyboardType="number-pad" value={weight} onChangeText={setWeight} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Taille (cm)</Text>
        <TextInput style={styles.profileInput} placeholder="170" placeholderTextColor="#666" keyboardType="number-pad" value={height} onChangeText={setHeight} />
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>Suivant</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleNext}>
        <Text style={styles.skipText}>Passer cette étape</Text>
      </TouchableOpacity>
    </View>
  );
}

export function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const setOnboarded = useStore((s) => s.setOnboarded);
  const setHealthProfile = useStore((s) => s.setHealthProfile);
  const language = useStore((s) => s.language);
  const { t } = useTranslation();

  const [profile, setProfile] = useState<HealthProfile>({
    goal: '',
    diet: 'none',
    allergies: [],
    activityLevel: 'moderate',
    age: '',
    weight: '',
    height: '',
    gender: '',
  });

  const toggleAllergy = (id: string) => {
    setProfile((p) => ({
      ...p,
      allergies: p.allergies.includes(id)
        ? p.allergies.filter((a) => a !== id)
        : [...p.allergies, id],
    }));
  };

  const [showConfetti, setShowConfetti] = useState(false);

  const finish = () => {
    setHealthProfile(profile);
    setStep(totalStepsCount);
  };

  const finalFinish = () => {
    setOnboarded(true);
  };

  const totalStepsCount = 7;

  const getLabel = (item: { label: string; labelEn: string }) => {
    return language === 'en' ? item.labelEn : item.label;
  };

  const steps = [
    // Step 0: Welcome
    () => (
      <View style={styles.stepContainer}>
        <View style={styles.langPos}><LanguageSelector /></View>
        <Text style={styles.welcomeLogo}>FoodCheck</Text>
        <Text style={styles.welcomeTitle}>Bienvenue!</Text>
        <Text style={styles.welcomeSubtitle}>
          Ton assistant santé alimentaire personnel.{'\n\n'}
          Scanne tes produits, analyse les ingrédients, compare les prix et atteins tes objectifs santé.
        </Text>
        <View style={styles.welcomeFeatures}>
          <Text style={styles.welcomeFeature}>✓ Scanner de code-barres intelligent</Text>
          <Text style={styles.welcomeFeature}>✓ Analyse complète des ingrédients et additifs</Text>
          <Text style={styles.welcomeFeature}>✓ Circulaires d'épicerie en temps réel</Text>
          <Text style={styles.welcomeFeature}>✓ Analyse pH de l'eau</Text>
          <Text style={styles.welcomeFeature}>✓ Suivi de régime personnalisé</Text>
        </View>
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(1)}>
          <Text style={styles.nextButtonText}>Commencer</Text>
        </TouchableOpacity>
      </View>
    ),

    // Step 1: Goal
    () => (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Quel est ton objectif?</Text>
        <Text style={styles.stepSubtitle}>Choisis l'objectif qui te correspond le mieux</Text>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={[styles.optionCard, profile.goal === g.id && styles.optionCardActive]}
            onPress={() => setProfile({ ...profile, goal: g.id })}
          >
            <Text style={styles.optionIcon}>{g.icon}</Text>
            <Text style={[styles.optionLabel, profile.goal === g.id && styles.optionLabelActive]}>
              {getLabel(g)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.nextButton, !profile.goal && styles.nextButtonDisabled]}
          onPress={() => profile.goal && setStep(2)}
          disabled={!profile.goal}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    ),

    // Step 2: Body info
    () => <BodyInfoStep profile={profile} setProfile={setProfile} onNext={() => setStep(3)} />,

    // Step 3: Diet
    () => (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Régime alimentaire</Text>
        <Text style={styles.stepSubtitle}>Suis-tu un régime particulier?</Text>
        {DIETS.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={[styles.optionCardSmall, profile.diet === d.id && styles.optionCardActive]}
            onPress={() => setProfile({ ...profile, diet: d.id })}
          >
            <Text style={[styles.optionLabel, profile.diet === d.id && styles.optionLabelActive]}>
              {getLabel(d)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(4)}>
          <Text style={styles.nextButtonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    ),

    // Step 4: Allergies
    () => <AllergyStep profile={profile} toggleAllergy={toggleAllergy} language={language} onNext={() => setStep(5)} />,

    // Step 5: Activity level
    () => (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Niveau d'activité</Text>
        <Text style={styles.stepSubtitle}>Quel est ton niveau d'activité physique?</Text>
        {ACTIVITY_LEVELS.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.optionCard, profile.activityLevel === a.id && styles.optionCardActive]}
            onPress={() => setProfile({ ...profile, activityLevel: a.id })}
          >
            <View>
              <Text style={[styles.optionLabel, profile.activityLevel === a.id && styles.optionLabelActive]}>
                {getLabel(a)}
              </Text>
              <Text style={styles.optionDesc}>{a.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(6)}>
          <Text style={styles.nextButtonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    ),

    // Step 6: Plan
    () => (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Choisis ton plan</Text>
        <Text style={styles.stepSubtitle}>Commence avec 14 jours gratuits sur le régime santé</Text>

        <View style={styles.planCard}>
          <Text style={styles.planName}>Base</Text>
          <Text style={styles.planPrice}>$3.99<Text style={styles.planPeriod}>/mois</Text></Text>
          <Text style={styles.planFeature}>✓ Scans illimités</Text>
          <Text style={styles.planFeature}>✓ Analyse santé complète</Text>
          <Text style={styles.planFeature}>✓ Historique + Favoris</Text>
          <Text style={styles.planFeature}>✓ Analyse pH de l'eau</Text>
        </View>

        <View style={[styles.planCard, styles.planCardPopular]}>
          <View style={styles.popularBadge}><Text style={styles.popularText}>POPULAIRE</Text></View>
          <Text style={styles.planName}>Base + Circulaire</Text>
          <Text style={styles.planPrice}>$4.99<Text style={styles.planPeriod}>/mois</Text></Text>
          <Text style={styles.planFeature}>✓ Tout le plan Base</Text>
          <Text style={styles.planFeature}>✓ Circulaires en temps réel</Text>
          <Text style={styles.planFeature}>✓ Comparateur de prix</Text>
          <Text style={styles.planFeature}>✓ Liste d'épicerie intelligente</Text>
        </View>

        <View style={[styles.planCard, styles.planCardHealth]}>
          <View style={styles.trialBadge}><Text style={styles.trialText}>14 JOURS GRATUITS</Text></View>
          <Text style={styles.planName}>Régime Santé</Text>
          <Text style={styles.planPrice}>$1.99<Text style={styles.planPeriod}>/mois après l'essai</Text></Text>
          <Text style={styles.planFeature}>✓ Objectifs personnalisés</Text>
          <Text style={styles.planFeature}>✓ Suivi calories quotidien</Text>
          <Text style={styles.planFeature}>✓ Alertes produits incompatibles</Text>
          <Text style={styles.planFeature}>✓ Recommandations personnalisées</Text>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={finish}>
          <Text style={styles.nextButtonText}>Commencer mon essai gratuit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={finish}>
          <Text style={styles.skipText}>Continuer avec le plan gratuit</Text>
        </TouchableOpacity>
      </View>
    ),

    // Step 7: Félicitations
    () => (
      <View style={styles.congratsContainer}>
        <ConfettiCannon count={150} origin={{ x: 200, y: -20 }} fadeOut autoStart />
        <Text style={styles.congratsEmoji}>{'🎉'}</Text>
        <Text style={styles.congratsTitle}>Félicitations!</Text>
        <Text style={styles.congratsSubtitle}>Tu es sur la bonne voie!</Text>
        <Text style={styles.congratsText}>
          Ton profil santé est configuré.{'\n'}
          FoodCheck va maintenant t'aider à atteindre tes objectifs avec des recommandations personnalisées.
        </Text>

        <View style={styles.congratsSummary}>
          <Text style={styles.congratsSummaryTitle}>Ton profil</Text>
          {profile.goal && <Text style={styles.congratsItem}>Objectif: {GOALS.find(g => g.id === profile.goal)?.label}</Text>}
          {profile.diet !== 'none' && <Text style={styles.congratsItem}>Régime: {DIETS.find(d => d.id === profile.diet)?.label}</Text>}
          {profile.allergies.length > 0 && <Text style={styles.congratsItem}>Allergies: {profile.allergies.length} sélectionnées</Text>}
          {profile.weight && <Text style={styles.congratsItem}>Poids: {profile.weight} lbs</Text>}
        </View>

        <TouchableOpacity style={styles.congratsButton} onPress={finalFinish}>
          <Text style={styles.congratsButtonText}>Voir mon plan régime</Text>
        </TouchableOpacity>
      </View>
    ),
  ];

  const totalSteps = totalStepsCount + 1;
  const CurrentStep = steps[step];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {step > 0 && step < totalSteps - 1 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / (totalSteps - 1)) * 100}%` }]} />
        </View>
      )}
      {step > 0 && (
        <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Retour</Text>
        </TouchableOpacity>
      )}
      <CurrentStep />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  progressBar: { height: 4, backgroundColor: '#333', borderRadius: 2, marginBottom: 10 },
  progressFill: { height: 4, backgroundColor: '#22c55e', borderRadius: 2 },
  backBtn: { marginBottom: 10 },
  backBtnText: { color: '#3b82f6', fontSize: 15 },
  stepContainer: { flex: 1 },
  langPos: { alignItems: 'flex-end', marginBottom: 20, zIndex: 100 },
  welcomeLogo: { color: '#22c55e', fontSize: 42, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  welcomeTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginTop: 16 },
  welcomeSubtitle: { color: '#ccc', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  welcomeFeatures: { marginTop: 30, gap: 10 },
  welcomeFeature: { color: '#ccc', fontSize: 14, paddingLeft: 8 },
  stepTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  stepSubtitle: { color: '#ccc', fontSize: 14, marginTop: 4, marginBottom: 20 },
  optionCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#2a2a2a' },
  optionCardSmall: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, marginBottom: 6, borderWidth: 2, borderColor: '#2a2a2a' },
  optionCardActive: { borderColor: '#22c55e', backgroundColor: '#0f2d1f' },
  optionIcon: { fontSize: 24, marginRight: 14, width: 30, textAlign: 'center', color: '#ccc' },
  optionLabel: { color: '#ccc', fontSize: 16, fontWeight: '600' },
  optionLabelActive: { color: '#22c55e' },
  optionDesc: { color: '#bbb', fontSize: 12, marginTop: 2 },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  genderButton: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#2a2a2a' },
  genderActive: { borderColor: '#22c55e', backgroundColor: '#0f2d1f' },
  genderText: { color: '#ccc', fontSize: 16, fontWeight: '600' },
  genderTextActive: { color: '#22c55e' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { color: '#ccc', fontSize: 13, marginBottom: 6 },
  profileInput: { backgroundColor: '#222', color: '#fff', borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  allergyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  allergyChip: { backgroundColor: '#222', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  allergyChipActive: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
  allergyChipText: { color: '#ccc', fontSize: 13 },
  allergyChipTextActive: { color: '#fca5a5', fontWeight: 'bold' },
  searchInput: { backgroundColor: '#222', color: '#fff', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  selectedCount: { color: '#22c55e', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  noResults: { color: '#bbb', textAlign: 'center', marginVertical: 20, fontSize: 14 },
  congratsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  congratsEmoji: { fontSize: 60, marginBottom: 16 },
  congratsTitle: { color: '#22c55e', fontSize: 36, fontWeight: 'bold' },
  congratsSubtitle: { color: '#fff', fontSize: 20, fontWeight: '600', marginTop: 8 },
  congratsText: { color: '#ccc', fontSize: 14, textAlign: 'center', marginTop: 16, lineHeight: 22, paddingHorizontal: 20 },
  congratsSummary: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, marginTop: 24, width: '100%', borderWidth: 1, borderColor: '#22c55e30' },
  congratsSummaryTitle: { color: '#22c55e', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  congratsItem: { color: '#ccc', fontSize: 14, marginVertical: 3 },
  congratsButton: { backgroundColor: '#22c55e', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 24, width: '100%' },
  congratsButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  nextButton: { backgroundColor: '#22c55e', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  nextButtonDisabled: { opacity: 0.4 },
  nextButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  skipText: { color: '#bbb', textAlign: 'center', marginTop: 14, fontSize: 14 },
  planCard: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  planCardPopular: { borderColor: '#22c55e', borderWidth: 2 },
  planCardHealth: { borderColor: '#3b82f6', borderWidth: 2 },
  popularBadge: { backgroundColor: '#22c55e', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  popularText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  trialBadge: { backgroundColor: '#3b82f6', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  trialText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  planName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  planPrice: { color: '#22c55e', fontSize: 28, fontWeight: 'bold', marginTop: 6 },
  planPeriod: { color: '#ccc', fontSize: 14, fontWeight: 'normal' },
  planFeature: { color: '#aaa', fontSize: 13, marginTop: 6 },
});
