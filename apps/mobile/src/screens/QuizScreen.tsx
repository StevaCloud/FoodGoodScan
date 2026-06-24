import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Animated } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useStore } from '../store/useStore';
import { AdBannerSmall } from '../components/AdBanner';
import { useWeatherBg } from '../hooks/useWeatherBg';
import { WeatherScreen } from '../components/WeatherBackground';
import { openCheckout } from '../services/checkout';
import { playCorrectSound, playWrongSound } from '../services/sounds';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '../components/Toast';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const DEAL_SEARCHES = ['poulet', 'fromage', 'fruits', 'lait', 'yogourt', 'beurre', 'oeufs', 'saumon', 'pain', 'légumes'];

interface DealReward {
  name: string;
  merchant: string;
  price: number | null;
  imageUrl: string;
  saleStory: string;
}


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

  // Mythes alimentaires
  { q: "Le pain fait-il grossir ?", choices: ['Oui, toujours', 'Non, c\'est les quantités qui comptent', 'Seulement le pain blanc', 'Seulement le soir'], answer: 1, explanation: "Le pain en soi ne fait pas grossir. C'est l'excès calorique global qui cause la prise de poids, pas un aliment en particulier.", image: "Pain" },
  { q: "Les oeufs augmentent-ils le cholestérol ?", choices: ['Oui, il faut les éviter', 'Non, pour la plupart des gens', 'Seulement le jaune', 'Seulement crus'], answer: 1, explanation: "Les études récentes montrent que pour la majorité des gens, manger des oeufs n'augmente pas significativement le cholestérol sanguin.", image: "Œuf (aliment)" },
  { q: "Manger le soir fait-il grossir ?", choices: ['Oui, toujours', 'Non, c\'est le total quotidien qui compte', 'Seulement après 20h', 'Seulement les glucides'], answer: 1, explanation: "Le corps ne stocke pas plus de graisse le soir. C'est le total de calories sur la journée qui détermine la prise de poids.", image: "Repas" },
  { q: "Le jus de fruit est-il aussi sain que le fruit entier ?", choices: ['Oui, c\'est pareil', 'Non, le jus a moins de fibres et plus de sucre rapide', 'Le jus est meilleur', 'Ça dépend du fruit'], answer: 1, explanation: "Le jus perd les fibres du fruit et le sucre est absorbé beaucoup plus rapidement, causant des pics de glycémie.", image: "Jus de fruits" },
  { q: "Le micro-ondes détruit-il les nutriments ?", choices: ['Oui, complètement', 'Non, il les préserve même mieux que d\'autres méthodes', 'Seulement les vitamines', 'Seulement les protéines'], answer: 1, explanation: "Le micro-ondes cuit rapidement et avec peu d'eau, ce qui préserve souvent mieux les nutriments que la cuisson à l'eau.", image: "Four à micro-ondes" },

  // Aliments du Québec/Canada
  { q: "Quel est le sirop le plus produit au Québec ?", choices: ['Sirop de maïs', 'Sirop d\'érable', 'Sirop d\'agave', 'Mélasse'], answer: 1, explanation: "Le Québec produit environ 72% du sirop d'érable mondial. C'est l'or liquide du Québec!", image: "Sirop d'érable" },
  { q: "La poutine est originaire de quelle province ?", choices: ['Ontario', 'Québec', 'Nouveau-Brunswick', 'Manitoba'], answer: 1, explanation: "La poutine est née au Québec dans les années 1950, possiblement à Warwick ou Victoriaville.", image: "Poutine" },
  { q: "Quel poisson est le plus pêché au Canada ?", choices: ['Saumon', 'Morue', 'Crevette', 'Homard'], answer: 2, explanation: "La crevette nordique est l'espèce marine la plus pêchée au Canada en termes de volume.", image: "Crevette" },
  { q: "Le tourtière est traditionnellement fait avec :", choices: ['Du boeuf seulement', 'Un mélange de viandes (porc, veau, boeuf)', 'Du poulet', 'Du poisson'], answer: 1, explanation: "Le tourtière traditionnel du Québec est fait d'un mélange de viandes hachées, souvent porc, veau et boeuf.", image: "Tourtière" },

  // Cuisine et préparation
  { q: "Pourquoi pleure-t-on en coupant des oignons ?", choices: ['L\'odeur forte', 'Un gaz irritant (syn-propanethial-S-oxide)', 'Le jus acide', 'Une réaction allergique'], answer: 1, explanation: "Couper un oignon libère du syn-propanethial-S-oxide, un gaz qui irrite les yeux et provoque les larmes.", image: "Oignon" },
  { q: "Quelle est la meilleure façon de conserver les bananes ?", choices: ['Au frigo', 'À température ambiante', 'Dans un sac plastique', 'Au congélateur'], answer: 1, explanation: "Les bananes se conservent mieux à température ambiante. Le frigo noircit la peau (mais la chair reste bonne).", image: "Banane" },
  { q: "Le miel peut-il se périmer ?", choices: ['Oui, après 1 an', 'Non, le miel ne se périme jamais', 'Après 5 ans', 'Seulement au frigo'], answer: 1, explanation: "Le miel est le seul aliment qui ne se périme jamais grâce à sa faible teneur en eau et son pH acide. On a trouvé du miel comestible dans des tombes égyptiennes!", image: "Miel" },
  { q: "Quel aliment contient le plus d'eau ?", choices: ['Pastèque', 'Concombre', 'Laitue', 'Tomate'], answer: 1, explanation: "Le concombre contient environ 96% d'eau, suivi de la laitue iceberg (96%) et de la pastèque (92%).", image: "Concombre" },

  // Santé et nutrition avancée
  { q: "Qu'est-ce que le métabolisme basal ?", choices: ['Les calories brûlées en faisant du sport', 'Les calories brûlées au repos pour survivre', 'La vitesse de digestion', 'Le rythme cardiaque'], answer: 1, explanation: "Le métabolisme basal représente les calories que ton corps brûle au repos pour fonctionner (respirer, digérer, circulation).", image: "Métabolisme" },
  { q: "Quel organe consomme le plus de glucose ?", choices: ['Le foie', 'Les muscles', 'Le cerveau', 'Le coeur'], answer: 2, explanation: "Le cerveau consomme environ 20% du glucose total du corps, bien qu'il ne représente que 2% du poids corporel.", image: "Cerveau humain" },
  { q: "Combien de temps faut-il pour digérer un repas complet ?", choices: ['1-2 heures', '4-6 heures', '12-24 heures', '24-72 heures'], answer: 3, explanation: "La digestion complète prend 24 à 72 heures. L'estomac se vide en 4-5h, mais le transit intestinal prend beaucoup plus longtemps.", image: "Système digestif humain" },
  { q: "La déshydratation de seulement 2% affecte :", choices: ['Rien du tout', 'Les performances physiques et mentales', 'Seulement la soif', 'Seulement les reins'], answer: 1, explanation: "Une déshydratation de seulement 2% réduit les performances cognitives, la concentration et les performances sportives.", image: "Déshydratation" },

  // Additifs et transformation
  { q: "Que signifie 'ultra-transformé' (NOVA 4) ?", choices: ['Cuit à haute température', 'Contient des additifs industriels et peu d\'aliments entiers', 'Importé de loin', 'Contient du gluten'], answer: 1, explanation: "Les aliments NOVA 4 contiennent des ingrédients industriels (émulsifiants, colorants, arômes) qu'on ne trouve pas dans une cuisine normale.", image: "Aliment ultra-transformé" },
  { q: "E150d (caramel au sulfite d'ammonium) est trouvé dans :", choices: ['Les fruits', 'Le Coca-Cola et les boissons brunes', 'Le pain', 'Le lait'], answer: 1, explanation: "E150d est le colorant qui donne la couleur brune au Coca-Cola, Pepsi et autres boissons gazeuses.", image: "Coca-Cola" },
  { q: "Quel est le conservateur le plus utilisé au monde ?", choices: ['E200 (acide sorbique)', 'E211 (benzoate de sodium)', 'Le sel', 'Le sucre'], answer: 2, explanation: "Le sel est le conservateur le plus ancien et le plus utilisé au monde. Il inhibe la croissance bactérienne par osmose.", image: "Sel alimentaire" },
  { q: "Les nitrites (E250) dans la charcuterie servent à :", choices: ['Donner du goût', 'Empêcher le botulisme et garder la couleur rose', 'Ajouter des protéines', 'Réduire le sel'], answer: 1, explanation: "Les nitrites empêchent la bactérie du botulisme (mortelle) et maintiennent la couleur rose de la viande. Mais en excès, ils peuvent former des composés cancérigènes.", image: "Charcuterie" },

  // Vitamines et minéraux
  { q: "Quelle vitamine est essentielle pour la vue ?", choices: ['Vitamine B12', 'Vitamine A', 'Vitamine C', 'Vitamine K'], answer: 1, explanation: "La vitamine A (rétinol) est essentielle pour la vision, surtout la vision nocturne. On la trouve dans les carottes, le foie et les oeufs.", image: "Vitamine A" },
  { q: "Le magnésium aide principalement à :", choices: ['La vision', 'La relaxation musculaire et le sommeil', 'La digestion', 'La coagulation'], answer: 1, explanation: "Le magnésium est crucial pour la relaxation musculaire, la qualité du sommeil et la gestion du stress. Beaucoup de gens en manquent.", image: "Magnésium" },
  { q: "Quel aliment est la meilleure source de vitamine B12 ?", choices: ['Les épinards', 'Le foie de boeuf', 'Les oranges', 'Le riz'], answer: 1, explanation: "La B12 se trouve presque exclusivement dans les produits animaux. Le foie de boeuf en est la source la plus concentrée.", image: "Foie (aliment)" },
  { q: "Le zinc est important pour :", choices: ['Les os', 'Le système immunitaire', 'La vue', 'La digestion'], answer: 1, explanation: "Le zinc renforce le système immunitaire, aide à la cicatrisation et participe à plus de 300 réactions enzymatiques.", image: "Zinc" },

  // Sport et alimentation
  { q: "Quand faut-il manger après l'entraînement ?", choices: ['Immédiatement', 'Dans les 30 à 60 minutes', 'Après 3 heures', 'Le lendemain'], answer: 1, explanation: "La fenêtre anabolique de 30-60 minutes après l'effort est idéale pour la récupération musculaire avec des protéines et glucides.", image: "Musculation" },
  { q: "Combien de protéines par kg recommande-t-on pour la musculation ?", choices: ['0.5g/kg', '1.6 à 2.2g/kg', '5g/kg', '10g/kg'], answer: 1, explanation: "Les recherches recommandent 1.6 à 2.2g de protéines par kg de poids corporel pour optimiser la croissance musculaire.", image: "Protéine" },
  { q: "La créatine est-elle dangereuse ?", choices: ['Oui, très toxique', 'Non, c\'est l\'un des suppléments les plus étudiés et sécuritaires', 'Seulement pour les femmes', 'Seulement après 40 ans'], answer: 1, explanation: "La créatine est le supplément sportif le plus étudié. Des centaines d'études confirment sa sécurité et son efficacité pour la force et la performance.", image: "Créatine" },
  { q: "Quel est le meilleur moment pour prendre de la caféine avant le sport ?", choices: ['Immédiatement avant', '30 à 60 minutes avant', '3 heures avant', 'Après le sport'], answer: 1, explanation: "La caféine atteint son pic d'effet 30-60 minutes après l'ingestion. Elle améliore l'endurance et la force.", image: "Caféine" },
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
  const [dealRewards, setDealRewards] = useState<DealReward[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const token = useStore(s => s.token);
  const addGroceryItem = useStore(s => s.addGroceryItem);
  const navigation = useNavigation<any>();
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

  const loadDealRewards = async (finalScore: number) => {
    if (!token) return;
    setLoadingDeals(true);
    try {
      const count = finalScore >= 8 ? 5 : finalScore >= 5 ? 3 : 1;
      const picks = [...DEAL_SEARCHES].sort(() => Math.random() - 0.5).slice(0, count);
      const allDeals: DealReward[] = [];
      for (const term of picks) {
        try {
          const { data } = await axios.get(`${API_URL}/deals`, {
            params: { search: term, postal_code: 'J1H1A1' },
            headers: { Authorization: `Bearer ${token}` },
          });
          const withSale = (Array.isArray(data) ? data : [])
            .filter((d: any) => d.imageUrl && d.saleStory)
            .sort((a: any, b: any) => (a.price || 999) - (b.price || 999));
          const best = withSale[0] || (Array.isArray(data) ? data : []).filter((d: any) => d.price && d.imageUrl).sort((a: any, b: any) => a.price - b.price)[0];
          if (best) allDeals.push({ name: best.name, merchant: best.merchant, price: best.price, imageUrl: best.imageUrl, saleStory: best.saleStory || '' });
        } catch {}
      }
      setDealRewards(allDeals);
    } catch {}
    setLoadingDeals(false);
  };

  const nextQuestion = () => {
    if (index < QUIZ_SIZE - 1) {
      setIndex(i => i + 1);
      setSelected(null);
    } else {
      const finalScore = score;
      updateQuizStats(finalScore, correctCount);
      loadDealRewards(finalScore);
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
          <Text style={s.rewardLine}>🎁 Debloque les meilleurs rabais de la semaine</Text>
          <Text style={s.rewardLine}>🏆 Plus ton score est haut, plus tu debloques de deals</Text>
          <Text style={s.rewardLine}>📊 10 questions, 60+ questions differentes</Text>
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
    const dealCount = score >= 8 ? 5 : score >= 5 ? 3 : 1;
    return (
      <WeatherScreen><ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.bigEmoji}>{emoji}</Text>
        <Text style={s.title}>{msg}</Text>
        <Text style={s.resultScore}>{score} / {QUIZ_SIZE}</Text>

        <View style={s.rewardCard}>
          <Text style={s.rewardTitle}>Resultat</Text>
          <Text style={s.rewardLine}>{score} bonnes reponses sur {QUIZ_SIZE}</Text>
          <Text style={s.rewardLine}>🎁 {dealCount} meilleur{dealCount > 1 ? 's' : ''} rabais debloque{dealCount > 1 ? 's' : ''}</Text>
        </View>

        {loadingDeals && (
          <View style={{ marginVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={{ color: '#ccc', marginTop: 8, fontSize: 13 }}>Chargement des meilleurs deals...</Text>
          </View>
        )}

        {dealRewards.length > 0 && (
          <View style={s.dealsSection}>
            <Text style={s.dealsSectionTitle}>Coupons rabais de la semaine</Text>
            <Text style={s.dealsSectionSub}>Vrais coupons des circulaires — mis a jour chaque semaine</Text>
            {dealRewards.map((deal, i) => (
              <TouchableOpacity
                key={i}
                style={s.dealRewardCard}
                onPress={() => {
                  if (isPremium) {
                    navigation.navigate('Soldes', { searchQuery: deal.name.split(/[,|/()]/).shift()?.trim().split(' ').slice(0, 2).join(' ') || deal.name });
                  } else {
                    openCheckout();
                  }
                }}
              >
                {deal.imageUrl ? (
                  <Image source={{ uri: deal.imageUrl }} style={s.dealRewardImage} resizeMode="contain" />
                ) : (
                  <View style={[s.dealRewardImage, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 20 }}>🛒</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.dealRewardName} numberOfLines={2}>{deal.name}</Text>
                  <Text style={s.dealRewardStore}>{isPremium ? deal.merchant : 'Magasin — Premium'}</Text>
                  {deal.saleStory ? (
                    <View style={s.dealRewardCoupon}>
                      <Text style={s.dealRewardCouponText}>{deal.saleStory}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.dealRewardPrice}>{isPremium && deal.price ? `$${deal.price.toFixed(2)}` : '$ ?.??'}</Text>
                  {isPremium ? (
                    <Text style={s.dealRewardHint}>Voir →</Text>
                  ) : (
                    <View style={s.dealRewardLock}>
                      <Text style={s.dealRewardLockText}>Premium</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
            {!isPremium && (
              <TouchableOpacity style={s.dealRewardUpgrade} onPress={() => openCheckout()}>
                <Text style={s.dealRewardUpgradeTitle}>Premium pour voir les magasins et les prix</Text>
                <Text style={s.dealRewardUpgradeSub}>Circulaires + Comparateur + Liste epicerie — $3.99/mois</Text>
              </TouchableOpacity>
            )}
          </View>
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
  explosionContainer: { position: 'absolute', top: '40%', left: '50%', width: 0, height: 0, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  explosionBalloon: { position: 'absolute', fontSize: 36 },
  dealsSection: { width: '100%', marginTop: 16, marginBottom: 8 },
  dealsSectionTitle: { color: '#22c55e', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  dealsSectionSub: { color: '#aaa', fontSize: 12, marginBottom: 12 },
  dealRewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 10, marginBottom: 8, gap: 10 },
  dealRewardImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#222' },
  dealRewardName: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  dealRewardStore: { color: '#22c55e', fontSize: 12, fontWeight: '600', marginTop: 2 },
  dealRewardPrice: { color: '#22c55e', fontSize: 20, fontWeight: '800' },
  dealRewardHint: { color: '#60a5fa', fontSize: 11, fontWeight: '600', marginTop: 2 },
  dealRewardLock: { backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  dealRewardLockText: { color: '#000', fontSize: 10, fontWeight: '800' },
  dealRewardUpgrade: { backgroundColor: '#f59e0b', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  dealRewardUpgradeTitle: { color: '#000', fontSize: 15, fontWeight: '900' },
  dealRewardUpgradeSub: { color: '#000', fontSize: 11, fontWeight: '700', marginTop: 2 },
  dealRewardCoupon: { backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  dealRewardCouponText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
