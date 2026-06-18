import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { useStore } from '../store/useStore';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';
import { usePostalCode } from '../hooks/usePostalCode';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const MEAL_PLANS = {
  lose: {
    title: 'Plan Perte de poids',
    calories: 1500,
    macros: { proteins: 30, carbs: 40, fat: 30 },
    meals: [
      { time: '07:00', name: 'Petit-déjeuner', items: ['2 oeufs brouillés', 'Toast blé entier', 'Fruits frais', 'Thé vert'], calories: 350 },
      { time: '10:00', name: 'Collation', items: ['Yogourt grec nature', 'Amandes (15g)'], calories: 150 },
      { time: '12:30', name: 'Dîner', items: ['Poitrine de poulet grillée', 'Salade verte', 'Quinoa (100g)', 'Huile d\'olive'], calories: 450 },
      { time: '15:30', name: 'Collation', items: ['Pomme', 'Beurre d\'amande (1 c.s.)'], calories: 150 },
      { time: '18:30', name: 'Souper', items: ['Saumon grillé', 'Légumes vapeur', 'Riz brun (80g)'], calories: 400 },
    ],
  },
  maintain: {
    title: 'Plan Maintien',
    calories: 2000,
    macros: { proteins: 25, carbs: 50, fat: 25 },
    meals: [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Gruau avoine', 'Banane', 'Lait', 'Miel'], calories: 450 },
      { time: '10:00', name: 'Collation', items: ['Barre de granola', 'Jus d\'orange'], calories: 200 },
      { time: '12:30', name: 'Dîner', items: ['Sandwich poulet', 'Soupe légumes', 'Fruits'], calories: 550 },
      { time: '15:30', name: 'Collation', items: ['Fromage', 'Craquelins blé entier'], calories: 200 },
      { time: '18:30', name: 'Souper', items: ['Pâtes sauce tomate', 'Salade César', 'Pain ail'], calories: 600 },
    ],
  },
  gain: {
    title: 'Plan Prise de poids',
    calories: 2800,
    macros: { proteins: 30, carbs: 45, fat: 25 },
    meals: [
      { time: '07:00', name: 'Petit-déjeuner', items: ['4 oeufs brouillés', '2 toasts beurre', 'Avocat', 'Jus d\'orange'], calories: 650 },
      { time: '10:00', name: 'Collation', items: ['Shake protéiné', 'Banane', 'Beurre d\'arachide'], calories: 400 },
      { time: '12:30', name: 'Dîner', items: ['Poitrine de poulet (200g)', 'Riz (200g)', 'Légumes', 'Huile d\'olive'], calories: 700 },
      { time: '15:30', name: 'Collation', items: ['Yogourt grec', 'Granola', 'Fruits secs'], calories: 350 },
      { time: '18:30', name: 'Souper', items: ['Steak (200g)', 'Patates douces', 'Brocoli', 'Beurre'], calories: 700 },
    ],
  },
  muscle: {
    title: 'Plan Prise de muscle',
    calories: 2500,
    macros: { proteins: 40, carbs: 35, fat: 25 },
    meals: [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Omelette 4 oeufs + épinards', 'Toast blé entier', 'Avocat'], calories: 550 },
      { time: '10:00', name: 'Post-entraînement', items: ['Shake whey protéine', 'Banane', 'Flocons d\'avoine'], calories: 400 },
      { time: '12:30', name: 'Dîner', items: ['Poulet grillé (200g)', 'Riz brun (150g)', 'Légumes verts'], calories: 600 },
      { time: '15:30', name: 'Collation', items: ['Thon en conserve', 'Craquelins', 'Fromage cottage'], calories: 350 },
      { time: '18:30', name: 'Souper', items: ['Saumon (200g)', 'Patates douces', 'Asperges', 'Huile d\'olive'], calories: 600 },
    ],
  },
  health: {
    title: 'Plan Alimentation saine',
    calories: 1800,
    macros: { proteins: 25, carbs: 45, fat: 30 },
    meals: [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Smoothie vert (épinards, banane, lait amande)', 'Noix mélangées'], calories: 350 },
      { time: '10:00', name: 'Collation', items: ['Fruits frais de saison', 'Amandes'], calories: 150 },
      { time: '12:30', name: 'Dîner', items: ['Bowl de quinoa', 'Légumes grillés', 'Pois chiches', 'Tahini'], calories: 500 },
      { time: '15:30', name: 'Collation', items: ['Hummus', 'Crudités'], calories: 150 },
      { time: '18:30', name: 'Souper', items: ['Poisson blanc grillé', 'Légumes rôtis', 'Riz basmati'], calories: 450 },
    ],
  },
};

const KETO_PLAN = {
  title: 'Plan Keto',
  calories: 1800,
  macros: { proteins: 25, carbs: 5, fat: 70 },
  meals: [
    { time: '07:00', name: 'Petit-déjeuner', items: ['3 oeufs au beurre', 'Bacon', 'Avocat'], calories: 500 },
    { time: '12:30', name: 'Dîner', items: ['Salade César sans croûtons', 'Poulet grillé', 'Parmesan'], calories: 450 },
    { time: '15:30', name: 'Collation', items: ['Fromage', 'Noix de macadamia'], calories: 250 },
    { time: '18:30', name: 'Souper', items: ['Saumon beurre citron', 'Asperges au beurre', 'Salade verte'], calories: 600 },
  ],
};

const VEGETARIAN_PLAN = {
  title: 'Plan Végétarien',
  calories: 1800,
  macros: { proteins: 20, carbs: 50, fat: 30 },
  meals: [
    { time: '07:00', name: 'Petit-déjeuner', items: ['Gruau avoine + fruits', 'Lait d\'amande', 'Graines de chia'], calories: 400 },
    { time: '10:00', name: 'Collation', items: ['Yogourt grec', 'Granola maison'], calories: 200 },
    { time: '12:30', name: 'Dîner', items: ['Buddha bowl (tofu, quinoa, légumes)', 'Vinaigrette tahini'], calories: 500 },
    { time: '15:30', name: 'Collation', items: ['Hummus + crudités'], calories: 150 },
    { time: '18:30', name: 'Souper', items: ['Curry de lentilles', 'Riz basmati', 'Naan'], calories: 550 },
  ],
};

interface DealItem {
  name: string;
  merchant: string;
  price: number | null;
  imageUrl: string;
}

const HEALTHY_CATEGORIES = [
  { search: 'poulet frais', category: 'Viandes fraîches', icon: 'V' },
  { search: 'saumon frais', category: 'Poissons frais', icon: 'P' },
  { search: 'oeufs', category: 'Oeufs', icon: 'O' },
  { search: 'pomme', category: 'Fruits frais', icon: 'F' },
  { search: 'banane orange', category: 'Fruits frais', icon: 'F' },
  { search: 'brocoli', category: 'Légumes frais', icon: 'L' },
  { search: 'salade laitue', category: 'Légumes frais', icon: 'L' },
  { search: 'avocat', category: 'Légumes frais', icon: 'L' },
  { search: 'yogourt grec', category: 'Produits laitiers sains', icon: 'D' },
  { search: 'amandes noix', category: 'Noix & Graines', icon: 'N' },
  { search: 'quinoa riz brun', category: 'Grains entiers', icon: 'G' },
  { search: 'huile olive', category: 'Bons gras', icon: 'H' },
];

const JUNK_KEYWORDS = ['chips', 'pizza surgelée', 'nuggets', 'hot dog', 'saucisse', 'bonbon', 'chocolat', 'gâteau', 'biscuit', 'croustilles', 'frites', 'pogo', 'pop tart', 'sodas', 'energy drink', 'slush'];

export function DietScreen() {
  const healthProfile = useStore((s) => s.healthProfile);
  const token = useStore((s) => s.token);
  const setLastScannedProduct = useStore((s) => s.setLastScannedProduct);
  const { t } = useTranslation();
  const postalCode = usePostalCode();
  const navigation = useNavigation<any>();
  const [activeDay, setActiveDay] = useState(0);
  const [waterCount, setWaterCount] = useState(0);
  const [weeklyDeals, setWeeklyDeals] = useState<Record<string, DealItem[]>>({});
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState('');

  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);
  const [otherStores, setOtherStores] = useState<DealItem[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const addGroceryItem = useStore((s) => s.addGroceryItem);

  const handleDealClick = async (item: DealItem) => {
    setSelectedDeal(item);
    setOtherStores([]);
    setLoadingStores(true);
    try {
      const searchName = item.name.split(/[,|/()]/).shift()?.trim().split(' ').slice(0, 2).join(' ') || item.name;
      const { data } = await axios.get(`${API_URL}/deals`, {
        params: { search: searchName, postal_code: postalCode },
        headers: { Authorization: `Bearer ${token}` },
      });
      setOtherStores(Array.isArray(data) ? data : []);
    } catch {
      setOtherStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    loadWeeklyDeals();
  }, []);

  const isJunkFood = (name: string): boolean => {
    const lower = name.toLowerCase();
    return JUNK_KEYWORDS.some(junk => lower.includes(junk));
  };

  const loadWeeklyDeals = async () => {
    setLoadingDeals(true);
    const deals: Record<string, DealItem[]> = {};
    try {
      for (const cat of HEALTHY_CATEGORIES) {
        try {
          const { data } = await axios.get(`${API_URL}/deals`, {
            params: { search: cat.search, postal_code: postalCode },
            headers: { Authorization: `Bearer ${token}` },
          });
          const items = (Array.isArray(data) ? data : [])
            .filter((i: any) => i.price && !isJunkFood(i.name || ''))
            .slice(0, 5);
          if (items.length > 0) {
            if (!deals[cat.category]) deals[cat.category] = [];
            deals[cat.category].push(...items);
          }
        } catch {}
      }
    } catch {}
    setWeeklyDeals(deals);
    setLoadingDeals(false);
  };

  const goal = healthProfile?.goal || 'health';
  const diet = healthProfile?.diet || 'none';

  let plan: any;
  if (diet === 'keto') plan = KETO_PLAN;
  else if (diet === 'vegetarian' || diet === 'vegan') plan = VEGETARIAN_PLAN;
  else plan = MEAL_PLANS[goal as keyof typeof MEAL_PLANS] || MEAL_PLANS.health;

  const weightLbs = parseFloat(healthProfile?.weight || '160');
  const heightCm = parseFloat(healthProfile?.height || '170');
  const weightKg = weightLbs * 0.453592;
  const waterLiters = Math.round((weightKg * 0.033 + (heightCm > 180 ? 0.3 : 0)) * 10) / 10;
  const waterMl = Math.round(waterLiters * 1000);
  const waterGoal = Math.round(waterLiters / 0.25);

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const totalMealCalories = plan.meals.reduce((sum: number, m: any) => sum + m.calories, 0);

  if (selectedDeal) {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedDeal(null)} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Retour au régime</Text>
        </TouchableOpacity>

        {selectedDeal.imageUrl ? (
          <Image source={{ uri: selectedDeal.imageUrl }} style={styles.selectedImage} resizeMode="contain" />
        ) : null}

        <View style={styles.selectedHeader}>
          <View style={styles.selectedMerchantBadge}>
            <Text style={styles.selectedMerchantText}>{selectedDeal.merchant}</Text>
          </View>
          {selectedDeal.price && <Text style={styles.selectedPrice}>${selectedDeal.price.toFixed(2)}</Text>}
        </View>

        <Text style={styles.selectedName}>{selectedDeal.name}</Text>

        <View style={styles.selectedInfoCard}>
          <Text style={styles.selectedInfoTitle}>Détails</Text>
          <View style={styles.selectedInfoRow}>
            <Text style={styles.selectedInfoLabel}>Magasin</Text>
            <Text style={styles.selectedInfoValue}>{selectedDeal.merchant}</Text>
          </View>
          {selectedDeal.price && (
            <View style={styles.selectedInfoRow}>
              <Text style={styles.selectedInfoLabel}>Prix spécial</Text>
              <Text style={[styles.selectedInfoValue, { color: '#22c55e' }]}>${selectedDeal.price.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.selectedInfoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.selectedInfoLabel}>Type</Text>
            <Text style={styles.selectedInfoValue}>Aliment frais</Text>
          </View>
        </View>

        <View style={styles.otherStoresSection}>
          <Text style={styles.otherStoresTitle}>Disponible dans les épiceries</Text>
          {loadingStores && (
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <ActivityIndicator size="small" color="#22c55e" />
              <Text style={{ color: '#ccc', marginTop: 6, fontSize: 12 }}>Recherche dans les circulaires...</Text>
            </View>
          )}
          {!loadingStores && otherStores.length > 0 && (
            otherStores
              .sort((a, b) => (a.price || 999) - (b.price || 999))
              .map((store, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.storeRow, i === 0 && styles.storeRowBest]}
                onPress={() => {
                  addGroceryItem(store.name, store.merchant, store.price);
                  const { Alert } = require('react-native');
                  Alert.alert('Ajouté!', `${store.name} (${store.merchant}) ajouté à ta liste`);
                }}
              >
                <View style={styles.storeInfo}>
                  <View style={styles.storeNameRow}>
                    <Text style={styles.storeName}>{store.merchant}</Text>
                    {i === 0 && <View style={styles.bestPriceBadge}><Text style={styles.bestPriceText}>MEILLEUR PRIX</Text></View>}
                  </View>
                  <Text style={styles.storeProduct} numberOfLines={1}>{store.name}</Text>
                </View>
                <View style={styles.storePriceCol}>
                  {store.price && <Text style={[styles.storePrice, i === 0 && { color: '#22c55e' }]}>${store.price.toFixed(2)}</Text>}
                  <Text style={styles.storeAddHint}>+ Liste</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          {!loadingStores && otherStores.length === 0 && (
            <Text style={{ color: '#bbb', fontSize: 13, textAlign: 'center', marginVertical: 12 }}>Aucun autre magasin trouvé cette semaine</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.addListBtn}
          onPress={() => {
            addGroceryItem(selectedDeal.name, selectedDeal.merchant, selectedDeal.price);
            const { Alert } = require('react-native');
            Alert.alert('Ajouté!', `${selectedDeal.name} ajouté à ta liste d'épicerie`);
            setSelectedDeal(null);
          }}
        >
          <Text style={styles.addListBtnText}>Ajouter à ma liste d'épicerie</Text>
        </TouchableOpacity>

        <Text style={styles.scanTip}>Pour voir les ingrédients et la valeur nutritive, scanne le code-barres du produit en magasin.</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}><View /><LanguageSelector /></View>

      <Text style={styles.title}>Mon Régime</Text>
      <Text style={styles.planName}>{plan.title}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{plan.calories}</Text>
          <Text style={styles.summaryLabel}>cal/jour</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{plan.macros.proteins}%</Text>
          <Text style={styles.summaryLabel}>Protéines</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{plan.macros.carbs}%</Text>
          <Text style={styles.summaryLabel}>Glucides</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{plan.macros.fat}%</Text>
          <Text style={styles.summaryLabel}>Gras</Text>
        </View>
      </View>

      <View style={styles.macroBar}>
        <View style={[styles.macroSegment, { flex: plan.macros.proteins, backgroundColor: '#3b82f6' }]} />
        <View style={[styles.macroSegment, { flex: plan.macros.carbs, backgroundColor: '#22c55e' }]} />
        <View style={[styles.macroSegment, { flex: plan.macros.fat, backgroundColor: '#f59e0b' }]} />
      </View>
      <View style={styles.macroLegend}>
        <View style={styles.macroLegendItem}><View style={[styles.macroLegendDot, { backgroundColor: '#3b82f6' }]} /><Text style={styles.macroLegendText}>Protéines</Text></View>
        <View style={styles.macroLegendItem}><View style={[styles.macroLegendDot, { backgroundColor: '#22c55e' }]} /><Text style={styles.macroLegendText}>Glucides</Text></View>
        <View style={styles.macroLegendItem}><View style={[styles.macroLegendDot, { backgroundColor: '#f59e0b' }]} /><Text style={styles.macroLegendText}>Gras</Text></View>
      </View>

      <View style={styles.waterSection}>
        <Text style={styles.sectionTitle}>Eau aujourd'hui</Text>
        <View style={styles.waterInfoRow}>
          <View style={styles.waterInfoItem}>
            <Text style={styles.waterInfoValue}>{waterLiters}L</Text>
            <Text style={styles.waterInfoLabel}>objectif/jour</Text>
          </View>
          <View style={styles.waterInfoItem}>
            <Text style={styles.waterInfoValue}>{waterMl}ml</Text>
            <Text style={styles.waterInfoLabel}>{waterGoal} verres de 250ml</Text>
          </View>
        </View>
        <Text style={styles.waterCalc}>Basé sur ton poids ({weightLbs} lbs / {weightKg.toFixed(1)} kg){heightCm > 180 ? ' + 300ml (taille > 180cm)' : ''}</Text>
        <View style={styles.waterRow}>
          <TouchableOpacity style={styles.waterBtn} onPress={() => setWaterCount(Math.max(0, waterCount - 1))}>
            <Text style={styles.waterBtnText}>-</Text>
          </TouchableOpacity>
          <View style={styles.waterDisplay}>
            <Text style={styles.waterCount}>{waterCount}</Text>
            <Text style={styles.waterGoal}>/ {waterGoal} verres</Text>
            <Text style={styles.waterLiters}>{(waterCount * 0.25).toFixed(2)}L / {waterLiters}L</Text>
          </View>
          <TouchableOpacity style={styles.waterBtn} onPress={() => setWaterCount(waterCount + 1)}>
            <Text style={styles.waterBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.waterProgress}>
          <View style={[styles.waterProgressFill, { width: `${Math.min((waterCount / waterGoal) * 100, 100)}%` }]} />
        </View>
        {waterCount >= waterGoal && <Text style={styles.waterComplete}>Objectif atteint!</Text>}
      </View>

      <View style={styles.daySelector}>
        {days.map((d, i) => (
          <TouchableOpacity
            key={d}
            style={[styles.dayChip, activeDay === i && styles.dayChipActive]}
            onPress={() => setActiveDay(i)}
          >
            <Text style={[styles.dayText, activeDay === i && styles.dayTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Plan de repas suggéré</Text>
      <Text style={styles.totalCal}>{totalMealCalories} calories totales</Text>

      {plan.meals.map((meal: any, i: number) => (
        <View key={i} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <View>
              <Text style={styles.mealTime}>{meal.time}</Text>
              <Text style={styles.mealName}>{meal.name}</Text>
            </View>
            <Text style={styles.mealCalories}>{meal.calories} cal</Text>
          </View>
          {meal.items.map((item: string, j: number) => (
            <Text key={j} style={styles.mealItem}>• {item}</Text>
          ))}
        </View>
      ))}

      <View style={styles.dealsSection}>
        <Text style={styles.sectionTitle}>Aliments frais en spécial</Text>
        <Text style={styles.dealsSubtitle}>Produits sains en circulaire cette semaine — mange bien et économise!</Text>

        {loadingDeals && (
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={{ color: '#ccc', marginTop: 8, fontSize: 13 }}>Chargement des spéciaux...</Text>
          </View>
        )}

        {Object.entries(weeklyDeals).map(([category, items]) => (
          <View key={category} style={styles.dealCategory}>
            <Text style={styles.dealCategoryTitle}>{category}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dealRow}>
                {items.slice(0, 6).map((item, i) => (
                  <TouchableOpacity key={i} style={styles.dealCard} onPress={() => handleDealClick(item)}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.dealImage} />
                    ) : (
                      <View style={[styles.dealImage, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#bbb' }}>$</Text>
                      </View>
                    )}
                    <Text style={styles.dealName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.dealStore}>{item.merchant}</Text>
                    {item.price && <Text style={styles.dealPrice}>${item.price.toFixed(2)}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        ))}

        {!loadingDeals && Object.keys(weeklyDeals).length === 0 && (
          <Text style={{ color: '#bbb', textAlign: 'center', marginVertical: 20 }}>Aucun spécial trouvé</Text>
        )}
      </View>

      {healthProfile?.allergies?.length > 0 && (
        <View style={styles.allergyWarning}>
          <Text style={styles.allergyWarningTitle}>Tes allergies</Text>
          <Text style={styles.allergyWarningText}>
            Les repas ci-dessus sont des suggestions générales. Vérifie toujours les ingrédients selon tes allergies : {healthProfile.allergies.join(', ')}
          </Text>
        </View>
      )}

      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Conseils</Text>
        {goal === 'lose' && (
          <>
            <Text style={styles.tipItem}>• Bois un verre d'eau avant chaque repas</Text>
            <Text style={styles.tipItem}>• Mange lentement — 20 min minimum par repas</Text>
            <Text style={styles.tipItem}>• Évite les aliments ultra-transformés (NOVA 4)</Text>
            <Text style={styles.tipItem}>• Privilégie les protéines pour la satiété</Text>
          </>
        )}
        {goal === 'gain' && (
          <>
            <Text style={styles.tipItem}>• Mange toutes les 3 heures</Text>
            <Text style={styles.tipItem}>• Ajoute des calories saines (avocat, noix, huiles)</Text>
            <Text style={styles.tipItem}>• Shake protéiné après l'entraînement</Text>
            <Text style={styles.tipItem}>• Ne saute jamais le petit-déjeuner</Text>
          </>
        )}
        {goal === 'muscle' && (
          <>
            <Text style={styles.tipItem}>• 1.6-2.2g de protéines par kg de poids</Text>
            <Text style={styles.tipItem}>• Mange dans les 30 min après l'entraînement</Text>
            <Text style={styles.tipItem}>• Dors 7-9 heures par nuit</Text>
            <Text style={styles.tipItem}>• Créatine 3-5g par jour</Text>
          </>
        )}
        {(goal === 'health' || goal === 'maintain') && (
          <>
            <Text style={styles.tipItem}>• Mange 5 portions de fruits/légumes par jour</Text>
            <Text style={styles.tipItem}>• Limite le sucre ajouté à 25g par jour</Text>
            <Text style={styles.tipItem}>• Choisis des grains entiers</Text>
            <Text style={styles.tipItem}>• Varie tes sources de protéines</Text>
          </>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, zIndex: 100 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  planName: { color: '#22c55e', fontSize: 16, fontWeight: '600', marginTop: 4, marginBottom: 16 },
  summaryCard: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  summaryLabel: { color: '#ccc', fontSize: 11, marginTop: 2 },
  macroBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  macroSegment: { height: 8 },
  macroLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8, marginBottom: 16 },
  macroLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroLegendDot: { width: 10, height: 10, borderRadius: 5 },
  macroLegendText: { color: '#ccc', fontSize: 11 },
  waterSection: { backgroundColor: '#0c2d48', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e6091' },
  waterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 8 },
  waterBtn: { backgroundColor: '#1e6091', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  waterBtnText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  waterDisplay: { alignItems: 'center' },
  waterCount: { color: '#60a5fa', fontSize: 36, fontWeight: 'bold' },
  waterGoal: { color: '#6b9ec0', fontSize: 13 },
  waterInfoRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  waterInfoItem: { alignItems: 'center' },
  waterInfoValue: { color: '#60a5fa', fontSize: 24, fontWeight: 'bold' },
  waterInfoLabel: { color: '#6b9ec0', fontSize: 11 },
  waterCalc: { color: '#4a7a9b', fontSize: 11, textAlign: 'center', fontStyle: 'italic', marginBottom: 10 },
  waterLiters: { color: '#6b9ec0', fontSize: 12, marginTop: 2 },
  waterComplete: { color: '#22c55e', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  waterProgress: { height: 6, backgroundColor: '#1a3a5c', borderRadius: 3, marginTop: 12 },
  waterProgressFill: { height: 6, backgroundColor: '#3b82f6', borderRadius: 3 },
  daySelector: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  dayChip: { flex: 1, backgroundColor: '#222', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  dayChipActive: { backgroundColor: '#22c55e' },
  dayText: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  dayTextActive: { color: '#fff' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  totalCal: { color: '#22c55e', fontSize: 13, marginBottom: 12 },
  mealCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 8 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mealTime: { color: '#22c55e', fontSize: 12, fontWeight: 'bold' },
  mealName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  mealCalories: { color: '#f59e0b', fontSize: 16, fontWeight: 'bold' },
  mealItem: { color: '#bbb', fontSize: 13, marginVertical: 2, paddingLeft: 4 },
  allergyWarning: { backgroundColor: '#7f1d1d', borderRadius: 12, padding: 14, marginTop: 12 },
  allergyWarningTitle: { color: '#fca5a5', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  allergyWarningText: { color: '#fca5a5', fontSize: 12, lineHeight: 18 },
  tipsSection: { marginTop: 16 },
  tipItem: { color: '#aaa', fontSize: 13, marginVertical: 3, lineHeight: 20 },
  dealsSection: { marginTop: 20 },
  dealsSubtitle: { color: '#22c55e', fontSize: 12, marginBottom: 12 },
  dealCategory: { marginBottom: 16 },
  dealCategoryTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  dealRow: { flexDirection: 'row', gap: 10 },
  dealCard: { backgroundColor: '#1a1a1a', borderRadius: 10, width: 130, overflow: 'hidden' },
  dealImage: { width: 130, height: 80 },
  dealName: { color: '#ddd', fontSize: 11, padding: 6, paddingBottom: 2 },
  dealStore: { color: '#22c55e', fontSize: 10, paddingHorizontal: 6 },
  dealPrice: { color: '#22c55e', fontSize: 16, fontWeight: 'bold', padding: 6, paddingTop: 2 },
  backBtn: { paddingVertical: 10, marginTop: 10 },
  backBtnText: { color: '#3b82f6', fontSize: 15 },
  selectedImage: { width: '100%', height: 250, borderRadius: 12, marginTop: 10, backgroundColor: '#222' },
  selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  selectedMerchantBadge: { backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  selectedMerchantText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  selectedPrice: { color: '#22c55e', fontSize: 32, fontWeight: 'bold' },
  selectedName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  selectedInfoCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginTop: 16 },
  selectedInfoTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  selectedInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  selectedInfoLabel: { color: '#ccc', fontSize: 14 },
  selectedInfoValue: { color: '#ddd', fontSize: 14, fontWeight: '600' },
  addListBtn: { backgroundColor: '#22c55e', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  addListBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  scanTip: { color: '#bbb', fontSize: 12, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  otherStoresSection: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginTop: 16 },
  otherStoresTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  storeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  storeRowBest: { backgroundColor: '#0f2d1f', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 8 },
  storeInfo: { flex: 1, marginRight: 12 },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storeName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  bestPriceBadge: { backgroundColor: '#22c55e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bestPriceText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  storeProduct: { color: '#ccc', fontSize: 12, marginTop: 2 },
  storePriceCol: { alignItems: 'flex-end' },
  storePrice: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  storeAddHint: { color: '#3b82f6', fontSize: 10, marginTop: 2 },
});
