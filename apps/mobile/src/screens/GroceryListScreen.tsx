import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useStore, GroceryItem } from '../store/useStore';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';

export function GroceryListScreen() {
  const groceryList = useStore((s) => s.groceryList);
  const toggleGroceryItem = useStore((s) => s.toggleGroceryItem);
  const removeGroceryItem = useStore((s) => s.removeGroceryItem);
  const clearGroceryList = useStore((s) => s.clearGroceryList);
  const { t } = useTranslation();

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

  const healthColor = avgHealthScore >= 60 ? '#22c55e' : avgHealthScore >= 40 ? '#eab308' : '#ef4444';
  const healthLabel = avgHealthScore >= 60 ? 'Bon' : avgHealthScore >= 40 ? 'Moyen' : 'Mauvais';

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
    <ScrollView style={styles.container}>
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

          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>{t('list.nutrition')}</Text>
            <Text style={styles.nutritionSub}>{t('list.nutrition.sub')}</Text>

            <View style={styles.healthScoreRow}>
              <Text style={styles.healthScoreLabel}>Score santé moyen</Text>
              <View style={[styles.healthScoreBadge, { borderColor: healthColor }]}>
                <Text style={[styles.healthScoreValue, { color: healthColor }]}>{avgHealthScore}</Text>
                <Text style={[styles.healthScoreText, { color: healthColor }]}>{healthLabel}</Text>
              </View>
            </View>

            <View style={styles.nutriGrid}>
              <View style={styles.nutriCard}>
                <Text style={styles.nutriCardValue}>{totalCalories}</Text>
                <Text style={styles.nutriCardLabel}>Calories</Text>
                <Text style={styles.nutriCardUnit}>kcal</Text>
              </View>
              <View style={styles.nutriCard}>
                <Text style={[styles.nutriCardValue, totalProteins > 30 ? { color: '#22c55e' } : {}]}>{totalProteins.toFixed(1)}</Text>
                <Text style={styles.nutriCardLabel}>Protéines</Text>
                <Text style={styles.nutriCardUnit}>g</Text>
              </View>
              <View style={styles.nutriCard}>
                <Text style={[styles.nutriCardValue, totalFat > 50 ? { color: '#ef4444' } : {}]}>{totalFat.toFixed(1)}</Text>
                <Text style={styles.nutriCardLabel}>Gras</Text>
                <Text style={styles.nutriCardUnit}>g</Text>
              </View>
              <View style={styles.nutriCard}>
                <Text style={[styles.nutriCardValue, totalSugars > 50 ? { color: '#ef4444' } : totalSugars > 25 ? { color: '#f97316' } : {}]}>{totalSugars.toFixed(1)}</Text>
                <Text style={styles.nutriCardLabel}>Sucres</Text>
                <Text style={styles.nutriCardUnit}>g</Text>
              </View>
              <View style={styles.nutriCard}>
                <Text style={[styles.nutriCardValue, totalSalt > 3 ? { color: '#ef4444' } : {}]}>{totalSalt.toFixed(2)}</Text>
                <Text style={styles.nutriCardLabel}>Sel</Text>
                <Text style={styles.nutriCardUnit}>g</Text>
              </View>
            </View>

            {totalSugars > 50 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>Attention : ta commande est très riche en sucres ({totalSugars.toFixed(0)}g)</Text>
              </View>
            )}
            {totalFat > 60 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>Attention : ta commande est très riche en gras ({totalFat.toFixed(0)}g)</Text>
              </View>
            )}
            {avgHealthScore > 0 && avgHealthScore < 30 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>Score santé faible — essaie d'ajouter des produits plus sains</Text>
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
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, item.checked && styles.itemChecked]}
                onPress={() => toggleGroceryItem(item.id)}
                onLongPress={() => handleRemove(item.id, item.name)}
              >
                <View style={styles.checkbox}>
                  {item.checked && <View style={styles.checkboxFill} />}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, item.checked && styles.itemNameChecked]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.calories > 0 && (
                    <Text style={styles.itemNutri}>{item.calories} kcal | G:{item.fat.toFixed(0)}g S:{item.sugars.toFixed(0)}g P:{item.proteins.toFixed(0)}g</Text>
                  )}
                </View>
                {item.price && (
                  <Text style={[styles.itemPrice, item.checked && styles.itemPriceChecked]}>
                    ${item.price.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );
      })}

      {groceryList.length > 0 && (
        <Text style={styles.hint}>Clique pour cocher — Appui long pour supprimer</Text>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, zIndex: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  clearText: { color: '#ef4444', fontSize: 14 },
  totalCard: { backgroundColor: '#0f2d1f', borderRadius: 14, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#22c55e30', alignItems: 'center' },
  totalLabel: { color: '#ccc', fontSize: 14 },
  totalValue: { color: '#22c55e', fontSize: 36, fontWeight: 'bold', marginTop: 4 },
  totalSub: { color: '#bbb', fontSize: 12, marginTop: 4 },
  nutritionCard: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, marginBottom: 16 },
  nutritionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  nutritionSub: { color: '#bbb', fontSize: 11, marginBottom: 12 },
  healthScoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  healthScoreLabel: { color: '#aaa', fontSize: 14 },
  healthScoreBadge: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center' },
  healthScoreValue: { fontSize: 22, fontWeight: 'bold' },
  healthScoreText: { fontSize: 10, fontWeight: '600' },
  nutriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nutriCard: { backgroundColor: '#222', borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 60, flex: 1 },
  nutriCardValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  nutriCardLabel: { color: '#ccc', fontSize: 10, marginTop: 2 },
  nutriCardUnit: { color: '#bbb', fontSize: 9 },
  warningBanner: { backgroundColor: '#7f1d1d', borderRadius: 8, padding: 10, marginTop: 10 },
  warningText: { color: '#fca5a5', fontSize: 12, textAlign: 'center' },
  emptySection: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: '#bbb', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: '#aaa', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  storeSection: { marginBottom: 16 },
  storeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  storeName: { color: '#22c55e', fontSize: 16, fontWeight: 'bold' },
  storeTotal: { color: '#22c55e', fontSize: 14, fontWeight: '600' },
  itemCard: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
  itemChecked: { opacity: 0.5 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#22c55e', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxFill: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e' },
  itemInfo: { flex: 1 },
  itemName: { color: '#fff', fontSize: 14 },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#bbb' },
  itemNutri: { color: '#ccc', fontSize: 10, marginTop: 2 },
  itemPrice: { color: '#22c55e', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  itemPriceChecked: { color: '#bbb' },
  hint: { color: '#aaa', fontSize: 11, textAlign: 'center', marginTop: 12 },
});
