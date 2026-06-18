import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const WATERS = [
  { name: 'Evian', ph: 7.2, rating: 'Excellente', color: '#22c55e', tds: 309, source: 'Alpes françaises, Évian-les-Bains',
    minerals: { Calcium: 80, Magnésium: 26, Sodium: 6.5, Potassium: 1, Bicarbonate: 360, Silice: 15 },
    details: ['Eau neutre idéale pour consommation quotidienne', 'Riche en calcium (os, dents)', 'Bon apport en magnésium', 'Très faible en sodium (bon pour hypertension)'] },
  { name: 'Eska', ph: 7.8, rating: 'Excellente', color: '#22c55e', tds: 98, source: 'Esker de Saint-Mathieu-d\'Harricana, Abitibi, Québec',
    minerals: { Calcium: 20, Magnésium: 4, Sodium: 2.3, Potassium: 0.5, Bicarbonate: 74 },
    details: ['Eau naturellement alcaline du Québec', 'Filtrée par un esker de 10 000 ans', 'Très faible en sodium', 'Légère et pure, idéale au quotidien'] },
  { name: 'Naya', ph: 7.2, rating: 'Très bonne', color: '#22c55e', tds: 145, source: 'Mirabel, Québec',
    minerals: { Calcium: 31, Magnésium: 7, Sodium: 4, Potassium: 1, Bicarbonate: 115 },
    details: ['Eau de source québécoise populaire', 'pH neutre idéal', 'Bonne teneur en calcium', 'Très faible en sodium'] },
  { name: 'Flow', ph: 8.1, rating: 'Très bonne', color: '#84cc16', tds: 285, source: 'Bruce Peninsula, Ontario, Canada',
    minerals: { Calcium: 59, Magnésium: 21, Sodium: 4, Potassium: 0.5, Bicarbonate: 270 },
    details: ['Eau naturellement alcaline canadienne', 'Excellente minéralisation', 'Riche en calcium et magnésium', 'Emballage éco-responsable'] },
  { name: 'Volvic', ph: 7.0, rating: 'Très bonne', color: '#22c55e', tds: 130, source: 'Volcans d\'Auvergne, France',
    minerals: { Calcium: 12, Magnésium: 8, Sodium: 12, Potassium: 6, Silice: 32 },
    details: ['pH parfaitement neutre', 'Eau légère faible en minéraux', 'Riche en silice (peau, cheveux)', 'Idéale pour les nourrissons'] },
  { name: 'Cristaline', ph: 7.5, rating: 'Bonne', color: '#84cc16', tds: 200, source: 'Sources multiples, France',
    minerals: { Calcium: 40, Magnésium: 10, Sodium: 8 },
    details: ['Eau de source abordable', 'Légèrement alcaline', 'Minéralisation correcte', 'Bon rapport qualité-prix'] },
  { name: 'Fiji', ph: 7.7, rating: 'Très bonne', color: '#84cc16', tds: 224, source: 'Aquifère de Yaqara, Îles Fidji',
    minerals: { Calcium: 18, Magnésium: 15, Sodium: 18, Potassium: 5, Silice: 93 },
    details: ['pH alcalin doux', 'Exceptionnellement riche en silice (93mg)', 'La silice est bonne pour la peau et les cheveux', 'Eau douce et légère'] },
  { name: 'San Pellegrino', ph: 7.7, rating: 'Bonne', color: '#84cc16', tds: 1109, source: 'San Pellegrino Terme, Italie',
    minerals: { Calcium: 174, Magnésium: 51.4, Sodium: 33.3, Potassium: 2.2, Bicarbonate: 243 },
    details: ['Légèrement alcaline, bon pour la digestion', 'Bonne teneur en calcium et magnésium', 'Sodium un peu élevé', 'Gazeuse — érosion dentaire possible en excès'] },
  { name: 'Montclair', ph: 7.1, rating: 'Bonne', color: '#84cc16', tds: 140, source: 'Sainte-Marie-de-Beauce, Québec',
    minerals: { Calcium: 28, Magnésium: 8, Sodium: 3.5, Bicarbonate: 105 },
    details: ['Eau de source québécoise abordable', 'pH neutre', 'Minéralisation correcte', 'Bon rapport qualité-prix'] },
  { name: 'Perrier', ph: 5.5, rating: 'Acide', color: '#f97316', tds: 475, source: 'Vergèze, Gard, France',
    minerals: { Calcium: 155, Magnésium: 6.8, Sodium: 11.5, Potassium: 0.7, Bicarbonate: 430 },
    details: ['pH acide — peut éroder l\'émail dentaire à long terme', 'L\'eau gazeuse est plus acide naturellement', 'Riche en calcium', 'À consommer avec modération'] },
  { name: 'Aquafina', ph: 5.8, rating: 'Médiocre', color: '#f97316', tds: 4, source: 'Eau du robinet purifiée par PepsiCo',
    minerals: { Sodium: 0 },
    details: ['pH acide', 'Eau du robinet purifiée par osmose inverse', 'Presque aucun minéral (TDS de 4!)', 'Eau "morte" — aucune valeur nutritive', 'Éviter comme eau principale'] },
  { name: 'Dasani', ph: 5.6, rating: 'Médiocre', color: '#ef4444', tds: 30, source: 'Eau du robinet purifiée par Coca-Cola',
    minerals: { Magnésium: 5, Potassium: 5, Sodium: 5 },
    details: ['pH acide — mauvais pour l\'émail dentaire', 'Eau du robinet purifiée, pas de source', 'Contient du sulfate de magnésium (laxatif)', 'Une des pires eaux embouteillées'] },
  { name: 'Smartwater', ph: 7.0, rating: 'Marketing > Qualité', color: '#f59e0b', tds: 20, source: 'Eau purifiée par distillation vapeur, Coca-Cola',
    minerals: { Calcium: 2, Magnésium: 1, Potassium: 1 },
    details: ['Eau distillée avec minéraux ajoutés', 'Très peu de minéraux malgré le nom "Smart"', 'Cher pour ce que c\'est', 'Le marketing vaut plus que l\'eau'] },
  { name: 'Liquid Death', ph: 8.2, rating: 'Très bonne', color: '#84cc16', tds: 230, source: 'Alpes autrichiennes',
    minerals: { Calcium: 47, Magnésium: 19, Sodium: 5, Bicarbonate: 210 },
    details: ['Marketing punk mais eau de qualité légitime', 'Eau de source autrichienne naturellement alcaline', 'Bonne minéralisation', 'Canette aluminium recyclable'] },
  { name: 'Essentia', ph: 9.5, rating: 'Marketing > Science', color: '#f59e0b', tds: 70, source: 'Eau purifiée ionisée, USA',
    minerals: { Sodium: 13, Potassium: 1.5, Magnésium: 1, Calcium: 1 },
    details: ['pH 9.5 artificiellement élevé par ionisation', 'Aucune preuve scientifique des bienfaits de l\'eau alcaline', 'Très faible en minéraux essentiels', 'Le corps régule son pH naturellement'] },
  { name: 'Nestlé Pure Life', ph: 7.0, rating: 'Correcte', color: '#eab308', tds: 180, source: 'Sources multiples, purifiée',
    minerals: { Calcium: 36, Magnésium: 6, Sodium: 9 },
    details: ['pH neutre', 'Minéraux moyens', 'Eau purifiée, pas de source naturelle', 'Correcte mais pas exceptionnelle'] },
  { name: 'Voss', ph: 6.0, rating: 'Surcotée', color: '#f59e0b', tds: 44, source: 'Iveland, Norvège',
    minerals: { Calcium: 6, Magnésium: 1, Sodium: 7 },
    details: ['Eau artésienne norvégienne', 'pH légèrement acide', 'Très peu de minéraux', 'Vous payez pour la bouteille design'] },
  { name: 'Kirkland (Costco)', ph: 7.0, rating: 'Correcte', color: '#eab308', tds: 30, source: 'Eau purifiée par osmose inverse',
    minerals: { Calcium: 3, Magnésium: 1, Sodium: 3 },
    details: ['Eau purifiée très abordable', 'pH neutre', 'Très peu de minéraux (eau vide)', 'Manque de minéraux essentiels'] },
  { name: 'Icelandic Glacial', ph: 8.4, rating: 'Bonne', color: '#84cc16', tds: 62, source: 'Source Ölfus, Islande',
    minerals: { Calcium: 5, Magnésium: 1.3, Sodium: 5.5, Silice: 15 },
    details: ['Eau de source islandaise', 'Naturellement alcaline', 'Très pure (source protégée)', 'Certifiée CarbonNeutral'] },
  { name: 'Gerolsteiner', ph: 6.5, rating: 'Bonne (modération)', color: '#84cc16', tds: 2527, source: 'Eifel volcanique, Allemagne',
    minerals: { Calcium: 348, Magnésium: 108, Sodium: 118, Potassium: 10.8, Bicarbonate: 1816 },
    details: ['Très riche en minéraux', 'Excellent apport calcium + magnésium', 'Sodium élevé — attention hypertension', 'Usage en alternance avec eau légère'] },
  { name: 'Great Value (Walmart)', ph: 6.8, rating: 'Passable', color: '#eab308', tds: 20, source: 'Eau purifiée, marque maison Walmart',
    minerals: { Calcium: 2, Magnésium: 1, Sodium: 2 },
    details: ['Eau purifiée marque maison', 'pH quasi-neutre', 'Presque aucun minéral', 'Option la moins chère'] },
];

interface WaterData {
  name: string;
  ph: number;
  rating: string;
  color: string;
  tds: number;
  source: string;
  minerals: Record<string, number>;
  details: string[];
}

export function WaterScreen() {
  const [selected, setSelected] = useState<WaterData | null>(null);

  if (selected) {
    const phPosition = Math.min(Math.max((selected.ph - 4) / 7 * 100, 0), 100);
    const tdsLabel = selected.tds < 300 ? 'Eau légère' : selected.tds < 600 ? 'Eau moyenne' : 'Eau très minéralisée';

    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => setSelected(null)} style={styles.backButton}>
          <Text style={styles.backText}>{'<'} Retour aux marques</Text>
        </TouchableOpacity>

        <Text style={styles.detailName}>{selected.name}</Text>
        <Text style={[styles.detailRating, { color: selected.color }]}>{selected.rating}</Text>

        <View style={styles.phSection}>
          <View style={styles.phBig}>
            <Text style={styles.phBigLabel}>pH</Text>
            <Text style={[styles.phBigValue, { color: selected.color }]}>{selected.ph}</Text>
          </View>
          <View style={styles.phBarContainer}>
            <View style={styles.phBarBg}>
              <View style={[styles.phBarFill, { left: `${phPosition}%` }]} />
            </View>
            <View style={styles.phLabels}>
              <Text style={styles.phLabelText}>4 Acide</Text>
              <Text style={styles.phLabelText}>7 Neutre</Text>
              <Text style={styles.phLabelText}>11 Alcalin</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Minéraux (mg/L)</Text>
          {Object.entries(selected.minerals).map(([key, val]) => (
            <View key={key} style={styles.mineralRow}>
              <Text style={styles.mineralName}>{key}</Text>
              <View style={styles.mineralBarContainer}>
                <View style={[styles.mineralBar, { width: `${Math.min((val / 100) * 100, 100)}%`, backgroundColor: selected.color }]} />
              </View>
              <Text style={styles.mineralValue}>{val}</Text>
            </View>
          ))}
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>TDS (Total des solides dissous)</Text>
          <Text style={styles.tdsValue}>{selected.tds} mg/L</Text>
          <Text style={styles.tdsLabel}>{tdsLabel}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Source</Text>
          <Text style={styles.sourceText}>{selected.source}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Verdict</Text>
          {selected.details.map((d, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={[styles.detailBullet, { color: selected.color }]}>{'•'}</Text>
              <Text style={styles.detailText}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sourceNote}>
          <Text style={styles.sourceNoteText}>Données basées sur les étiquettes officielles du fabricant et les rapports qualité eau publics.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Analyse pH de l'eau</Text>
      <Text style={styles.subtitle}>21 marques — Clique pour voir les détails</Text>
      <View style={styles.certBanner}>
        <Text style={styles.certText}>Données basées sur les étiquettes officielles des fabricants et les rapports qualité eau publics</Text>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} /><Text style={styles.legendText}>Excellente</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#84cc16' }]} /><Text style={styles.legendText}>Bonne</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#eab308' }]} /><Text style={styles.legendText}>Correcte</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f97316' }]} /><Text style={styles.legendText}>Médiocre</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} /><Text style={styles.legendText}>Mauvaise</Text></View>
      </View>

      {WATERS.map((w, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.waterCard, { borderLeftColor: w.color }]}
          onPress={() => setSelected(w)}
        >
          <View style={styles.waterInfo}>
            <Text style={styles.waterName}>{w.name}</Text>
            <Text style={[styles.waterRating, { color: w.color }]}>{w.rating}</Text>
          </View>
          <View style={styles.waterRight}>
            <Text style={styles.phSmallLabel}>pH</Text>
            <Text style={[styles.phSmallValue, { color: w.color }]}>{w.ph}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  subtitle: { color: '#ccc', fontSize: 13, marginTop: 4, marginBottom: 16 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#1a1a1a', borderRadius: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#aaa', fontSize: 11 },
  waterCard: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4 },
  waterInfo: { flex: 1 },
  waterName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  waterRating: { fontSize: 12, marginTop: 2 },
  waterRight: { alignItems: 'center', minWidth: 50 },
  phSmallLabel: { color: '#ccc', fontSize: 10 },
  phSmallValue: { fontSize: 22, fontWeight: 'bold' },
  backButton: { paddingVertical: 10, marginTop: 10 },
  backText: { color: '#3b82f6', fontSize: 15 },
  detailName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 10 },
  detailRating: { fontSize: 16, fontWeight: '600', marginTop: 4, marginBottom: 20 },
  phSection: { backgroundColor: '#0c2d48', borderRadius: 14, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1e6091' },
  phBig: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16 },
  phBigLabel: { color: '#60a5fa', fontSize: 18, fontWeight: '600' },
  phBigValue: { fontSize: 48, fontWeight: 'bold' },
  phBarContainer: { marginTop: 8 },
  phBarBg: { height: 10, backgroundColor: '#1a3a5c', borderRadius: 5, position: 'relative' },
  phBarFill: { position: 'absolute', top: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#60a5fa', borderWidth: 2, borderColor: '#fff' },
  phLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  phLabelText: { color: '#6b9ec0', fontSize: 10 },
  detailSection: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 },
  detailSectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  mineralRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mineralName: { color: '#ccc', fontSize: 13, width: 100 },
  mineralBarContainer: { flex: 1, height: 8, backgroundColor: '#2a2a2a', borderRadius: 4, marginHorizontal: 8 },
  mineralBar: { height: 8, borderRadius: 4 },
  mineralValue: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'right' },
  tdsValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  tdsLabel: { color: '#ccc', fontSize: 13, marginTop: 4 },
  sourceText: { color: '#93c5fd', fontSize: 14, fontStyle: 'italic' },
  detailRow: { flexDirection: 'row', marginBottom: 6, paddingRight: 8 },
  detailBullet: { fontSize: 16, marginRight: 8, marginTop: -2 },
  detailText: { color: '#ccc', fontSize: 13, flex: 1, lineHeight: 20 },
  certBanner: { backgroundColor: '#1a2a1a', borderRadius: 8, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: '#22c55e30' },
  certText: { color: '#ccc', fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
  sourceNote: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginTop: 8 },
  sourceNoteText: { color: '#ccc', fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
});
