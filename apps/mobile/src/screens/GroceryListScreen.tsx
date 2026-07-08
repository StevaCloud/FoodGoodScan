import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, TextInput, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, GroceryItem } from '../store/useStore';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';
import { AdBanner } from '../components/AdBanner';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { WeatherScreen } from '../components/WeatherBackground';

export function GroceryListScreen() {
  const groceryList = useStore((s) => s.groceryList);
  const toggleGroceryItem = useStore((s) => s.toggleGroceryItem);
  const removeGroceryItem = useStore((s) => s.removeGroceryItem);
  const clearGroceryList = useStore((s) => s.clearGroceryList);
  const dailyCalorieGoal = useStore((s) => s.dailyCalorieGoal);
  const setDailyCalorieGoal = useStore((s) => s.setDailyCalorieGoal);
  const navigation = useNavigation<any>();
  const weatherBg = useWeatherBg();
  const { t } = useTranslation();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyCalorieGoal));
  const progressAnim = useRef(new Animated.Value(0)).current;

  const total = groceryList.reduce((sum, i) => sum + (i.price || 0), 0);
  const checkedCount = groceryList.filter((i) => i.checked).length;

  const totalCalories = groceryList.reduce((sum, i) => sum + i.calories, 0);
  const totalFat = groceryList.reduce((sum, i) => sum + i.fat, 0);
  const totalSugars = groceryList.reduce((sum, i) => sum + i.sugars, 0);
  const totalProteins = groceryList.reduce((sum, i) => sum + i.proteins, 0);
  const totalSalt = groceryList.reduce((sum, i) => sum + i.salt, 0);

  const avgHealthScore = groceryList.length > 0
    ? Math.round(groceryList.reduce((sum, i) => sum + i.healthScore, 0) / groceryList.length)
    : 0;

  const caloriePct = Math.min(totalCalories / dailyCalorieGoal, 1);
  const calorieRemaining = dailyCalorieGoal - totalCalories;
  const calorieColor = caloriePct < 0.75 ? '#22c55e' : caloriePct < 1 ? '#f97316' : '#ef4444';
  const calorieOver = totalCalories > dailyCalorieGoal;

  // Anime la barre de progression à chaque changement
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: caloriePct,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [caloriePct]);

  const barWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const handleGoalSave = () => {
    const v = parseInt(goalInput);
    if (!isNaN(v) && v > 0) setDailyCalorieGoal(v);
    setEditingGoal(false);
  };

  const handleClear = () => {
    Alert.alert('Vider la liste?', 'Tous les articles seront supprimés', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Vider', style: 'destructive', onPress: clearGroceryList },
    ]);
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert('Supprimer?', `Retirer ${name}?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeGroceryItem(id) },
    ]);
  };

  const storeGroups: Record<string, GroceryItem[]> = {};
  groceryList.forEach((item) => {
    const store = item.store || 'Autre';
    if (!storeGroups[store]) storeGroups[store] = [];
    storeGroups[store].push(item);
  });

  return (
    <WeatherScreen><ScrollView style={styles.container}>
      <View style={styles.topBar}><View /><LanguageSelector /></View>
      <View style={styles.header}>
        <Text style={styles.title}>{t('list.title')}</Text>
        {groceryList.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>{t('list.clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {groceryList.length > 0 && (
        <>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>{t('list.total')}</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            <Text style={styles.totalSub}>{groceryList.length} articles — {checkedCount} cochés</Text>
          </View>

          {/* ── Compteur calorique journalier ── */}
          <View style={styles.calorieCard}>
            <View style={styles.calorieHeader}>
              <Text style={styles.calorieTitle}>Compteur calorique</Text>
              {editingGoal ? (
                <View style={styles.goalEditRow}>
                  <TextInput
                    style={styles.goalInput}
                    value={goalInput}
                    onChangeText={setGoalInput}
                    keyboardType="numeric"
                    maxLength={5}
                    autoFocus
                    selectTextOnFocus
                  />
                  <TouchableOpacity onPress={handleGoalSave} style={styles.goalSaveBtn}>
                    <Text style={styles.goalSaveTxt}>OK</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => { setGoalInput(String(dailyCalorieGoal)); setEditingGoal(true); }}>
                  <Text style={styles.goalEditTxt}>Objectif: {dailyCalorieGoal} kcal ✏️</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Calories actuelles vs objectif */}
            <View style={styles.calorieCountRow}>
              <Text style={[styles.calorieCount, { color: calorieColor }]}>{totalCalories}</Text>
              <Text style={styles.calorieSlash}> / {dailyCalorieGoal} kcal</Text>
            </View>

            {/* Barre de progression animée */}
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressBar, { width: barWidth, backgroundColor: calorieColor }]} />
              {/* Marqueur 100% */}
              <View style={styles.progressMark100} />
            </View>

            <Text style={[styles.calorieRemaining, { color: calorieColor }]}>
              {calorieOver
                ? `+${Math.abs(calorieRemaining)} kcal au-dessus de l'objectif`
                : calorieRemaining > 0
                  ? `${calorieRemaining} kcal restants pour aujourd'hui`
                  : 'Objectif atteint !'}
            </Text>

            {/* Macros */}
            <View style={styles.macroRow}>
              <View style={styles.macroChip}>
                <Text style={styles.macroVal}>{totalProteins.toFixed(0)}g</Text>
                <Text style={styles.macroLbl}>Protéines</Text>
                <View style={[styles.macroBar, { width: `${Math.min(totalProteins / 60 * 100, 100)}%`, backgroundColor: '#22c55e' }]} />
              </View>
              <View style={styles.macroChip}>
                <Text style={styles.macroVal}>{totalFat.toFixed(0)}g</Text>
                <Text style={styles.macroLbl}>Gras</Text>
                <View style={[styles.macroBar, { width: `${Math.min(totalFat / 65 * 100, 100)}%`, backgroundColor: totalFat > 65 ? '#ef4444' : '#f97316' }]} />
              </View>
              <View style={styles.macroChip}>
                <Text style={styles.macroVal}>{totalSugars.toFixed(0)}g</Text>
                <Text style={styles.macroLbl}>Sucres</Text>
                <View style={[styles.macroBar, { width: `${Math.min(totalSugars / 50 * 100, 100)}%`, backgroundColor: totalSugars > 50 ? '#ef4444' : '#eab308' }]} />
              </View>
              <View style={styles.macroChip}>
                <Text style={styles.macroVal}>{totalSalt.toFixed(1)}g</Text>
                <Text style={styles.macroLbl}>Sel</Text>
                <View style={[styles.macroBar, { width: `${Math.min(totalSalt / 5 * 100, 100)}%`, backgroundColor: totalSalt > 5 ? '#ef4444' : '#60a5fa' }]} />
              </View>
            </View>

            {/* Alertes */}
            {calorieOver && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>Tu dépasses ton objectif de {Math.abs(calorieRemaining)} kcal</Text>
              </View>
            )}
            {totalSugars > 50 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>Trop de sucres ({totalSugars.toFixed(0)}g — max recommandé 50g)</Text>
              </View>
            )}
          </View>
        </>
      )}

      {groceryList.length === 0 && (
        <View style={styles.emptySection}>
          <Text style={styles.emptyTitle}>{t('list.empty')}</Text>
          <Text style={styles.emptyText}>{t('list.empty.desc')}</Text>
        </View>
      )}

      {Object.entries(storeGroups).map(([store, items]) => {
        const storeTotal = items.reduce((sum, i) => sum + (i.price || 0), 0);
        return (
          <View key={store} style={styles.storeSection}>
            <View style={styles.storeHeader}>
              <Text style={styles.storeName}>{store}</Text>
              <Text style={styles.storeTotal}>${storeTotal.toFixed(2)}</Text>
            </View>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                {/* Image produit avec checkbox overlay */}
                <TouchableOpacity
                  style={styles.itemImageWrap}
                  onPress={() => toggleGroceryItem(item.id)}
                  activeOpacity={0.8}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.itemImageEmpty}>
                      <Text style={{ fontSize: 22 }}>🛒</Text>
                    </View>
                  )}
                  {item.checked && (
                    <View style={styles.itemImageCheckedOverlay}>
                      <Text style={styles.itemImageCheck}>✓</Text>
                    </View>
                  )}
                  <View style={[styles.checkDot, item.checked && styles.checkDotActive]}>
                    {item.checked && <Text style={styles.checkDotIcon}>✓</Text>}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.itemInfo, item.checked && { opacity: 0.45 }]}
                  onPress={() => {
                    navigation.navigate('Soldes', {
                      dealItem: {
                        id: 0,
                        name: item.name,
                        merchant: item.store,
                        merchantLogo: '',
                        price: item.price,
                        priceText: '',
                        imageUrl: item.imageUrl || '',
                        validFrom: '',
                        validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
                        category: '',
                      },
                      returnTo: 'Liste',
                    });
                  }}
                >
                  <Text style={[styles.itemName, item.checked && styles.itemNameChecked]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.calories > 0 && (
                    <Text style={styles.itemNutri}>{item.calories} kcal | G:{item.fat.toFixed(0)}g S:{item.sugars.toFixed(0)}g P:{item.proteins.toFixed(0)}g</Text>
                  )}
                  <Text style={styles.proofHint}>Voir la circulaire →</Text>
                </TouchableOpacity>
                <View style={styles.itemActions}>
                  {item.price ? (
                    <Text style={[styles.itemPrice, item.checked && styles.itemPriceChecked]}>
                      ${item.price.toFixed(2)}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeGroceryItem(item.id)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
      })}

      <AdBanner />

      {groceryList.length > 0 && (
        <Text style={styles.hint}>Clique pour cocher · ✕ pour supprimer</Text>
      )}

      <View style={{ height: 40 }} />
    </ScrollView></WeatherScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, zIndex: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  clearText: { color: '#ef4444', fontSize: 14 },
  totalCard: { backgroundColor: '#0f2d1f', borderRadius: 14, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#22c55e30', alignItems: 'center' },
  totalLabel: { color: '#ccc', fontSize: 14 },
  totalValue: { color: '#22c55e', fontSize: 36, fontWeight: 'bold', marginTop: 4 },
  totalSub: { color: '#bbb', fontSize: 12, marginTop: 4 },
  calorieCard: { backgroundColor: '#0f1f0f', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#22c55e22' },
  calorieHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  calorieTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  goalEditTxt: { color: '#888', fontSize: 12 },
  goalEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalInput: { backgroundColor: '#222', color: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, fontSize: 14, width: 80, borderWidth: 1, borderColor: '#22c55e' },
  goalSaveBtn: { backgroundColor: '#22c55e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  goalSaveTxt: { color: '#000', fontWeight: '700', fontSize: 13 },
  calorieCountRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  calorieCount: { fontSize: 42, fontWeight: '900', lineHeight: 46 },
  calorieSlash: { color: '#888', fontSize: 16, marginBottom: 6 },
  progressTrack: { height: 10, backgroundColor: '#1e1e1e', borderRadius: 6, overflow: 'hidden', marginBottom: 6, position: 'relative' },
  progressBar: { height: '100%', borderRadius: 6 },
  progressMark100: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, backgroundColor: '#333' },
  calorieRemaining: { fontSize: 12, marginBottom: 14, fontWeight: '600' },
  macroRow: { flexDirection: 'row', gap: 8 },
  macroChip: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 8, alignItems: 'center', gap: 2 },
  macroVal: { color: '#fff', fontSize: 15, fontWeight: '800' },
  macroLbl: { color: '#888', fontSize: 9, marginBottom: 4 },
  macroBar: { height: 3, borderRadius: 2, alignSelf: 'flex-start' as const, minWidth: 4 },
  warningBanner: { backgroundColor: '#7f1d1d', borderRadius: 8, padding: 10, marginTop: 10 },
  warningText: { color: '#fca5a5', fontSize: 12, textAlign: 'center' },
  emptySection: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: '#bbb', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: '#aaa', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  storeSection: { marginBottom: 16 },
  storeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  storeName: { color: '#22c55e', fontSize: 16, fontWeight: 'bold' },
  storeTotal: { color: '#22c55e', fontSize: 14, fontWeight: '600' },
  itemCard: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemImageWrap: { position: 'relative' as const },
  itemImage: { width: 62, height: 62, borderRadius: 10, backgroundColor: '#222' },
  itemImageEmpty: { width: 62, height: 62, borderRadius: 10, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  itemImageCheckedOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.45)', justifyContent: 'center', alignItems: 'center' },
  itemImageCheck: { color: '#fff', fontSize: 28, fontWeight: '900' },
  checkDot: { position: 'absolute' as const, top: -4, right: -4, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#22c55e', backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  checkDotActive: { backgroundColor: '#22c55e' },
  checkDotIcon: { color: '#fff', fontSize: 12, fontWeight: '900' },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3a1010', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  deleteBtnText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold' },
  itemInfo: { flex: 1 },
  itemName: { color: '#fff', fontSize: 14 },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#bbb' },
  itemNutri: { color: '#ccc', fontSize: 10, marginTop: 2 },
  itemActions: { alignItems: 'flex-end', gap: 4, marginLeft: 8 },
  itemPrice: { color: '#22c55e', fontSize: 16, fontWeight: 'bold' },
  itemPriceChecked: { color: '#bbb' },
  proofHint: { color: '#60a5fa', fontSize: 11, fontWeight: '700', marginTop: 4 },
  hint: { color: '#aaa', fontSize: 11, textAlign: 'center', marginTop: 12 },
});
