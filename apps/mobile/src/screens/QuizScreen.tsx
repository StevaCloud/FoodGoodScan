import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Animated } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useStore } from '../store/useStore';
import { AdBannerSmall } from '../components/AdBanner';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { WeatherScreen } from '../components/WeatherBackground';
import { openCheckout } from '../services/checkout';
import { playCorrectSound, playWrongSound } from '../services/sounds';

const COUPONS = [
  { brand: 'Subway', icon: '🥪', deal: 'Achetez un sous-marin 6 pouces, obtenez le 2e a 50%', minScore: 8 },
  { brand: 'Tim Hortons', icon: '☕', deal: 'Cafe medium gratuit avec achat d\'un muffin', minScore: 8 },
  { brand: 'McDonald\'s', icon: '🍔', deal: 'McDouble a $3.49 (valeur de $5.29)', minScore: 7 },
  { brand: 'Couche-Tard', icon: '🥤', deal: 'Slush ou cafe glacé medium a $1', minScore: 6 },
  { brand: 'St-Hubert', icon: '🍗', deal: '15% de rabais sur les commandes en ligne', minScore: 7 },
  { brand: 'A&W', icon: '🍟', deal: 'Combo Teen Burger a $8.99 (valeur $11.49)', minScore: 5 },
  { brand: 'Pizza Pizza', icon: '🍕', deal: 'Grande pizza 1 topping a $9.99', minScore: 5 },
  { brand: 'Starbucks', icon: '☕', deal: 'Grande boisson a $4.99 avant 10h', minScore: 6 },
  { brand: 'Popeyes', icon: '🍗', deal: 'Combo 3 morceaux a $8.99', minScore: 5 },
  { brand: 'Domino\'s', icon: '🍕', deal: '50% sur les pizzas a prix regulier en ligne', minScore: 7 },
];

interface Question {
  q: string;
  choices: string[];
  answer: number;
  explanation: string;
  image: string;
}

async function fetchWikiImage(term: string): Promise<string | null> {
  try {
    const res = await fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

const QUESTIONS: Question[] = [
  { q: "Quel nutriment fournit le plus d'énergie par gramme ?", choices: ['Protéines', 'Glucides', 'Lipides', 'Fibres'], answer: 2, explanation: "Les lipides fournissent 9 kcal/g contre 4 kcal/g pour les protéines et glucides.", image: "Lipide" },
  { q: "Quel additif alimentaire est un colorant rouge controversé ?", choices: ['E100', 'E120', 'E300', 'E440'], answer: 1, explanation: "E120 (carmin/cochenille) est un colorant rouge extrait d'insectes, souvent controversé.", image: "Carmin" },
  { q: "Combien de litres d'eau par jour recommande-t-on pour un adulte ?", choices: ['0.5L', '1L', '1.5 à 2L', '4L'], answer: 2, explanation: "L'OMS recommande 1.5 à 2 litres d'eau par jour pour un adulte.", image: "Eau potable" },
  { q: "Quel fruit contient le plus de vitamine C ?", choices: ['Orange', 'Kiwi', 'Goyave', 'Pomme'], answer: 2, explanation: "La goyave contient environ 228mg de vitamine C pour 100g, bien plus que l'orange (53mg).", image: "Goyave" },
  { q: "Que signifie le Nutri-Score A ?", choices: ['Produit bio', 'Excellente qualité nutritionnelle', 'Sans allergènes', 'Faible en calories'], answer: 1, explanation: "Le Nutri-Score A indique une excellente qualité nutritionnelle globale du produit.", image: "Nutri-Score" },
  { q: "Quel est le rôle principal des protéines ?", choices: ['Fournir de l\'énergie rapide', 'Construire et réparer les tissus', 'Stocker les graisses', 'Réguler la température'], answer: 1, explanation: "Les protéines servent principalement à construire et réparer les muscles et tissus du corps.", image: "Protéine" },
  { q: "Quel aliment est la meilleure source de fer ?", choices: ['Lait', 'Lentilles', 'Pain blanc', 'Banane'], answer: 1, explanation: "Les lentilles sont riches en fer (3.3mg/100g) et sont une excellente source végétale.", image: "Lentille cultivée" },
  { q: "E330 (acide citrique) est-il dangereux ?", choices: ['Oui, très toxique', 'Non, c\'est naturel et inoffensif', 'Oui, c\'est cancérigène', 'Seulement pour les enfants'], answer: 1, explanation: "E330 est de l'acide citrique, naturellement présent dans les agrumes. Totalement inoffensif.", image: "Citron" },
  { q: "Quel macronutriment doit-on consommer le plus ?", choices: ['Protéines', 'Lipides', 'Glucides', 'En parts égales'], answer: 2, explanation: "Les glucides devraient représenter 45-65% de l'apport calorique total selon les recommandations.", image: "Glucide" },
  { q: "Combien de calories contient 1g d'alcool ?", choices: ['0 kcal', '4 kcal', '7 kcal', '9 kcal'], answer: 2, explanation: "L'alcool fournit 7 kcal/g — presque autant que les lipides, sans aucune valeur nutritive.", image: "Éthanol" },
  { q: "Quel label garantit un produit issu de l'agriculture biologique en Europe ?", choices: ['Label Rouge', 'Eurofeuille (AB)', 'AOC', 'Éco-Score'], answer: 1, explanation: "Le label Eurofeuille (AB) certifie que le produit respecte les normes bio européennes.", image: "Agriculture biologique" },
  { q: "Les fibres alimentaires se trouvent principalement dans :", choices: ['La viande', 'Les fruits et légumes', 'Les produits laitiers', 'Les oeufs'], answer: 1, explanation: "Les fibres sont exclusivement d'origine végétale : fruits, légumes, céréales complètes, légumineuses.", image: "Fibre alimentaire" },
  { q: "Quel minéral est essentiel pour la santé des os ?", choices: ['Fer', 'Zinc', 'Calcium', 'Potassium'], answer: 2, explanation: "Le calcium est le principal minéral constituant des os et des dents.", image: "Calcium" },
  { q: "Quel aliment contient le plus de sucre caché ?", choices: ['Ketchup', 'Steak haché', 'Brocoli', 'Oeuf dur'], answer: 0, explanation: "Le ketchup peut contenir jusqu'à 25% de sucre — plus qu'une glace à la vanille !", image: "Ketchup" },
  { q: "La vitamine D est produite par le corps grâce à :", choices: ['L\'eau', 'Le soleil', 'Le sommeil', 'L\'exercice'], answer: 1, explanation: "Le corps synthétise la vitamine D lorsque la peau est exposée aux rayons UVB du soleil.", image: "Vitamine D" },
  { q: "Quel est l'index glycémique (IG) d'un aliment qui élève peu la glycémie ?", choices: ['IG élevé (>70)', 'IG moyen (56-69)', 'IG bas (<55)', 'IG nul (0)'], answer: 2, explanation: "Un IG bas (<55) signifie que l'aliment élève lentement la glycémie — idéal pour la satiété.", image: "Index glycémique" },
  { q: "Les acides gras oméga-3 se trouvent surtout dans :", choices: ['Le beurre', 'Le poisson gras', 'Le poulet', 'Le fromage'], answer: 1, explanation: "Le saumon, le maquereau et les sardines sont très riches en oméga-3 bons pour le coeur.", image: "Saumon atlantique" },
  { q: "Quel aliment est considéré comme un super-aliment ?", choices: ['Chips', 'Myrtilles', 'Pain blanc', 'Soda'], answer: 1, explanation: "Les myrtilles sont riches en antioxydants, vitamines C et K, et en fibres.", image: "Myrtille" },
  { q: "Combien de portions de fruits et légumes par jour recommande-t-on ?", choices: ['2', '3', '5', '10'], answer: 2, explanation: "Le Programme National Nutrition Santé recommande au moins 5 portions par jour.", image: "Fruit (alimentation humaine)" },
  { q: "Le gluten se trouve dans :", choices: ['Le riz', 'Le blé', 'Le maïs', 'La pomme de terre'], answer: 1, explanation: "Le gluten est une protéine présente dans le blé, l'orge, le seigle et l'épeautre.", image: "Blé tendre" },
  { q: "Quel est l'apport calorique quotidien moyen recommandé pour un adulte ?", choices: ['1000 kcal', '1500 kcal', '2000 kcal', '3000 kcal'], answer: 2, explanation: "Environ 2000 kcal/jour pour une femme et 2500 kcal/jour pour un homme, en moyenne.", image: "Calorie" },
  { q: "E621 (glutamate monosodique) est utilisé comme :", choices: ['Colorant', 'Conservateur', 'Exhausteur de goût', 'Édulcorant'], answer: 2, explanation: "Le glutamate (E621) renforce le goût umami des aliments. Controversé mais autorisé.", image: "Glutamate monosodique" },
  { q: "Quel nutriment aide à prévenir l'anémie ?", choices: ['Vitamine C', 'Fer', 'Vitamine D', 'Calcium'], answer: 1, explanation: "Le fer est essentiel à la production d'hémoglobine. Sa carence cause l'anémie.", image: "Épinard" },
  { q: "Les probiotiques se trouvent naturellement dans :", choices: ['Le yaourt', 'Le jus d\'orange', 'Le pain', 'Le riz'], answer: 0, explanation: "Le yaourt contient des bactéries vivantes bénéfiques pour la flore intestinale.", image: "Yaourt" },
  { q: "Quel est le danger principal du sel en excès ?", choices: ['Diabète', 'Hypertension', 'Allergie', 'Anémie'], answer: 1, explanation: "L'excès de sel (sodium) augmente la pression artérielle et le risque cardiovasculaire.", image: "Sel alimentaire" },
  { q: "Quelle huile est la plus riche en acides gras saturés ?", choices: ['Huile d\'olive', 'Huile de colza', 'Huile de coco', 'Huile de tournesol'], answer: 2, explanation: "L'huile de coco contient ~82% d'acides gras saturés, bien plus que les autres huiles.", image: "Huile de coco" },
  { q: "Les édulcorants artificiels contiennent :", choices: ['Beaucoup de calories', 'Peu ou pas de calories', 'Plus de sucre que le sucre', 'Des protéines'], answer: 1, explanation: "Les édulcorants comme l'aspartame apportent un goût sucré avec très peu de calories.", image: "Aspartame" },
  { q: "Quel aliment a le plus de potassium ?", choices: ['Banane', 'Poulet', 'Pain', 'Lait'], answer: 0, explanation: "La banane est riche en potassium (~358mg/100g), essentiel pour les muscles et le coeur.", image: "Banane" },
  { q: "Le cholestérol alimentaire se trouve dans :", choices: ['Les légumes', 'Les fruits', 'Les produits animaux', 'Les céréales'], answer: 2, explanation: "Le cholestérol est exclusivement d'origine animale : oeufs, viande, produits laitiers.", image: "Œuf (aliment)" },
  { q: "Quelle vitamine est un antioxydant puissant ?", choices: ['Vitamine A', 'Vitamine B12', 'Vitamine E', 'Vitamine K'], answer: 2, explanation: "La vitamine E protège les cellules contre le stress oxydatif et le vieillissement.", image: "Vitamine E" },
  { q: "Le score NOVA classe les aliments selon :", choices: ['Leur goût', 'Leur degré de transformation', 'Leur prix', 'Leur origine'], answer: 1, explanation: "NOVA classe de 1 (non transformé) à 4 (ultra-transformé). Plus c'est bas, mieux c'est.", image: "Aliment ultra-transformé" },
  { q: "Quel est le sucre naturel du lait ?", choices: ['Glucose', 'Fructose', 'Lactose', 'Saccharose'], answer: 2, explanation: "Le lactose est le sucre naturellement présent dans le lait des mammifères.", image: "Lait" },
];

const QUIZ_SIZE = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type QuizPhase = 'home' | 'playing' | 'result';

function QuizImage({ term }: { term: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setImageUrl(null);
    fetchWikiImage(term).then((url) => {
      setImageUrl(url);
      setLoading(false);
    });
  }, [term]);

  if (loading) {
    return (
      <View style={imgStyles.container}>
        <ActivityIndicator color="#22c55e" size="small" />
      </View>
    );
  }

  if (!imageUrl) return null;

  return (
    <View style={imgStyles.container}>
      <Image source={{ uri: imageUrl }} style={imgStyles.image} resizeMode="cover" />
      <Text style={imgStyles.caption}>{term}</Text>
    </View>
  );
}

const imgStyles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', marginTop: 12, marginBottom: 4 },
  image: { width: '100%', height: 180, borderRadius: 12 },
  caption: { color: '#888', fontSize: 11, marginTop: 6, fontStyle: 'italic' },
});

export function QuizScreen() {
  const weatherBg = useWeatherBg();
  const user = useStore(s => s.user);
  const isPremium = user?.plan === 'PREMIUM';
  const updateQuizStats = useStore(s => s.updateQuizStats);
  const bestScore = useStore(s => s.quizBestScore);
  const quizTotal = useStore(s => s.quizTotal);
  const quizCorrect = useStore(s => s.quizCorrect);

  const [phase, setPhase] = useState<QuizPhase>('home');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const explosionBalloons = useRef(Array.from({ length: 8 }, () => ({ x: new Animated.Value(0), y: new Animated.Value(0), scale: new Animated.Value(1), opacity: new Animated.Value(1) }))).current;

  const triggerExplosion = () => {
    setShowExplosion(true);
    explosionBalloons.forEach((b) => {
      b.x.setValue(0); b.y.setValue(0); b.scale.setValue(1); b.opacity.setValue(1);
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 120;
      Animated.parallel([
        Animated.timing(b.x, { toValue: Math.cos(angle) * dist, duration: 600, useNativeDriver: true }),
        Animated.timing(b.y, { toValue: Math.sin(angle) * dist, duration: 600, useNativeDriver: true }),
        Animated.timing(b.scale, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(b.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    });
    setTimeout(() => setShowExplosion(false), 700);
  };

  const startQuiz = () => {
    setQuestions(shuffle(QUESTIONS).slice(0, QUIZ_SIZE));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setCorrectCount(0);
    setPhase('playing');
  };

  const selectAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === questions[index].answer;
    if (correct) {
      setScore(s => s + 1);
      setCorrectCount(c => c + 1);
      setShowConfetti(true);
      playCorrectSound();
      setTimeout(() => setShowConfetti(false), 2500);
    } else {
      triggerExplosion();
      playWrongSound();
    }
  };

  const nextQuestion = () => {
    if (index < QUIZ_SIZE - 1) {
      setIndex(i => i + 1);
      setSelected(null);
    } else {
      const finalScore = score;
      updateQuizStats(finalScore, correctCount);
      setPhase('result');
    }
  };

  if (phase === 'home') {
    const accuracy = quizTotal > 0 ? Math.round((quizCorrect / (quizTotal * QUIZ_SIZE)) * 100) : 0;
    return (
      <WeatherScreen><ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.bigEmoji}>🧠</Text>
        <Text style={s.title}>Quiz Nutrition</Text>
        <Text style={s.subtitle}>Teste tes connaissances en nutrition !</Text>

        <View style={s.statsCard}>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Meilleur score</Text>
            <Text style={s.statValue}>{bestScore}/{QUIZ_SIZE}</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Quiz complétés</Text>
            <Text style={s.statValue}>{quizTotal}</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Précision</Text>
            <Text style={s.statValue}>{accuracy}%</Text>
          </View>
        </View>

        <View style={s.rewardCard}>
          <Text style={s.rewardTitle}>Recompenses</Text>
          <Text style={s.rewardLine}>🎫 Debloque des coupons rabais (Subway, McDo, Tim Hortons...)</Text>
          <Text style={s.rewardLine}>📊 10 questions par quiz</Text>
          <Text style={s.rewardLine}>🏆 Plus ton score est haut, plus tu debloques de coupons</Text>
        </View>

        <AdBannerSmall />

        <TouchableOpacity style={s.startBtn} onPress={startQuiz}>
          <Text style={s.startBtnText}>Commencer le Quiz</Text>
        </TouchableOpacity>
      </ScrollView></WeatherScreen>
    );
  }

  if (phase === 'result') {
    const emoji = score >= 8 ? '🏆' : score >= 5 ? '👍' : '💪';
    const msg = score >= 8 ? 'Excellent !' : score >= 5 ? 'Pas mal !' : 'Continue à apprendre !';
    const unlockedCoupons = COUPONS.filter(c => score >= c.minScore);
    const lockedCoupons = COUPONS.filter(c => score < c.minScore);
    return (
      <WeatherScreen><ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.bigEmoji}>{emoji}</Text>
        <Text style={s.title}>{msg}</Text>
        <Text style={s.resultScore}>{score} / {QUIZ_SIZE}</Text>

        {unlockedCoupons.length > 0 && (
          <View style={s.couponSection}>
            <Text style={s.couponSectionTitle}>Coupons debloques!</Text>
            {unlockedCoupons.map((c, i) => (
              <View key={i} style={s.couponCard}>
                <Text style={s.couponIcon}>{c.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.couponBrand}>{c.brand}</Text>
                  <Text style={s.couponDeal}>{c.deal}</Text>
                </View>
                {isPremium ? (
                  <View style={s.couponUnlocked}>
                    <Text style={s.couponUnlockedText}>Actif</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={s.couponLocked} onPress={() => openCheckout()}>
                    <Text style={s.couponLockedText}>Premium</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {lockedCoupons.length > 0 && (
          <View style={s.couponSection}>
            <Text style={[s.couponSectionTitle, { color: '#888' }]}>Ameliore ton score pour debloquer</Text>
            {lockedCoupons.slice(0, 3).map((c, i) => (
              <View key={i} style={[s.couponCard, { opacity: 0.4 }]}>
                <Text style={s.couponIcon}>{c.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.couponBrand}>{c.brand}</Text>
                  <Text style={s.couponDeal}>Score {c.minScore}+ requis</Text>
                </View>
                <Text style={{ color: '#555', fontSize: 20 }}>🔒</Text>
              </View>
            ))}
          </View>
        )}

        {!isPremium && unlockedCoupons.length > 0 && (
          <TouchableOpacity style={s.couponUpgradeBtn} onPress={() => openCheckout()}>
            <Text style={s.couponUpgradeBtnTitle}>Premium pour utiliser tes coupons</Text>
            <Text style={s.couponUpgradeBtnSub}>Circulaires + Comparateur + Coupons + Sans pub — $3.99/mois</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={s.startBtn} onPress={startQuiz}>
          <Text style={s.startBtnText}>Rejouer</Text>
        </TouchableOpacity>
      </ScrollView></WeatherScreen>
    );
  }

  // Playing
  const q = questions[index];
  return (
    <WeatherScreen><ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.progressRow}>
        <Text style={s.progressText}>Question {index + 1}/{QUIZ_SIZE}</Text>
        <Text style={s.scoreText}>Score : {score}</Text>
      </View>

      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${((index + 1) / QUIZ_SIZE) * 100}%` as any }]} />
      </View>

      <Text style={s.question}>{q.q}</Text>

      {q.choices.map((choice, i) => {
        let bg = '#1a1a1a';
        let border = '#2a2a2a';
        if (selected !== null) {
          if (i === q.answer) { bg = '#052e16'; border = '#22c55e'; }
          else if (i === selected) { bg = '#3b0a0a'; border = '#ef4444'; }
        }
        return (
          <TouchableOpacity
            key={i}
            style={[s.choiceBtn, { backgroundColor: bg, borderColor: border }]}
            onPress={() => selectAnswer(i)}
            disabled={selected !== null}
          >
            <Text style={s.choiceLetter}>{String.fromCharCode(65 + i)}</Text>
            <Text style={s.choiceText}>{choice}</Text>
            {selected !== null && i === q.answer && <Text style={s.checkMark}>✓</Text>}
            {selected !== null && i === selected && i !== q.answer && <Text style={s.crossMark}>✗</Text>}
          </TouchableOpacity>
        );
      })}

      {selected !== null && (
        <View style={[s.explanationBox, selected === q.answer ? s.explanationCorrect : s.explanationWrong]}>
          <Text style={s.explanationTitle}>{selected === q.answer ? '✓ Correct !' : '✗ Incorrect'}</Text>
          <Text style={s.explanationText}>{q.explanation}</Text>
          <QuizImage term={q.image} />
        </View>
      )}

      {selected !== null && (
        <TouchableOpacity style={s.nextBtn} onPress={nextQuestion}>
          <Text style={s.nextBtnText}>{index < QUIZ_SIZE - 1 ? 'Suivant →' : 'Voir le résultat'}</Text>
        </TouchableOpacity>
      )}

      {showConfetti && (
        <ConfettiCannon count={80} origin={{ x: 200, y: -20 }} fadeOut autoStart explosionSpeed={400} fallSpeed={2500} />
      )}

      {showExplosion && (
        <View style={s.explosionContainer} pointerEvents="none">
          {explosionBalloons.map((b, i) => (
            <Animated.Text
              key={i}
              style={[s.explosionBalloon, {
                transform: [{ translateX: b.x }, { translateY: b.y }, { scale: b.scale }],
                opacity: b.opacity,
              }]}
            >
              {['💥', '💣', '❌', '🔴', '⭕', '💢', '🚫', '😵'][i]}
            </Animated.Text>
          ))}
        </View>
      )}
    </ScrollView></WeatherScreen>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 16, alignItems: 'center' },
  bigEmoji: { fontSize: 64, marginBottom: 12 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  statsCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 18, width: '100%', marginBottom: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statLabel: { color: '#888', fontSize: 14 },
  statValue: { color: '#22c55e', fontSize: 14, fontWeight: 'bold' },
  rewardCard: { backgroundColor: '#0f2d1f', borderRadius: 16, padding: 18, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: '#22c55e33' },
  rewardTitle: { color: '#22c55e', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  rewardLine: { color: '#ccc', fontSize: 13, marginBottom: 5 },
  startBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 18, width: '100%', alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resultScore: { color: '#22c55e', fontSize: 48, fontWeight: 'bold', marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  progressText: { color: '#888', fontSize: 13 },
  scoreText: { color: '#22c55e', fontSize: 13, fontWeight: 'bold' },
  progressBar: { width: '100%', height: 6, backgroundColor: '#252525', borderRadius: 3, marginBottom: 24 },
  progressFill: { height: 6, backgroundColor: '#22c55e', borderRadius: 3 },
  question: { color: '#fff', fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 24, lineHeight: 28 },
  choiceBtn: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1.5, gap: 12 },
  choiceLetter: { color: '#22c55e', fontSize: 16, fontWeight: 'bold', width: 24 },
  choiceText: { color: '#fff', fontSize: 15, flex: 1 },
  checkMark: { color: '#22c55e', fontSize: 20, fontWeight: 'bold' },
  crossMark: { color: '#ef4444', fontSize: 20, fontWeight: 'bold' },
  explanationBox: { width: '100%', borderRadius: 14, padding: 16, marginTop: 8, marginBottom: 12, borderWidth: 1 },
  explanationCorrect: { backgroundColor: '#052e16', borderColor: '#22c55e' },
  explanationWrong: { backgroundColor: '#3b0a0a', borderColor: '#ef4444' },
  explanationTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  explanationText: { color: '#ccc', fontSize: 13, lineHeight: 19 },
  nextBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', marginTop: 8 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  couponSection: { width: '100%', marginTop: 16 },
  couponSectionTitle: { color: '#22c55e', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  couponCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  couponIcon: { fontSize: 28 },
  couponBrand: { color: '#fff', fontSize: 15, fontWeight: '700' },
  couponDeal: { color: '#aaa', fontSize: 12, marginTop: 2, lineHeight: 16 },
  couponUnlocked: { backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  couponUnlockedText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  couponLocked: { backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  couponLockedText: { color: '#000', fontSize: 12, fontWeight: '800' },
  couponUpgradeBtn: { backgroundColor: '#f59e0b', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', marginTop: 16 },
  couponUpgradeBtnTitle: { color: '#000', fontSize: 16, fontWeight: '900' },
  couponUpgradeBtnSub: { color: '#000', fontSize: 11, fontWeight: '700', marginTop: 3 },
  explosionContainer: { position: 'absolute', top: '40%', left: '50%', width: 0, height: 0, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  explosionBalloon: { position: 'absolute', fontSize: 36 },
});
