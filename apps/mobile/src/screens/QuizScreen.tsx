import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Animated,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useStore } from '../store/useStore';
import { AdBannerSmall } from '../components/AdBanner';
import { WeatherScreen } from '../components/WeatherBackground';
import { openCheckout } from '../services/checkout';
import { playCorrectSound, playWrongSound } from '../services/sounds';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const DEAL_SEARCHES = ['poulet', 'fromage', 'fruits', 'lait', 'yogourt', 'beurre', 'oeufs', 'saumon'];
const QUIZ_SIZE = 10;

interface Question {
  q: string;
  choices: string[];
  answer: number;
  explanation: string;
}

// ── Banques de questions ────────────────────────────────────────────────────

const Q_NUTRITION: Question[] = [
  { q: "Quel nutriment fournit le plus d'énergie par gramme ?", choices: ['Protéines', 'Glucides', 'Lipides', 'Fibres'], answer: 2, explanation: "Les lipides fournissent 9 kcal/g contre 4 kcal/g pour protéines et glucides." },
  { q: "Combien de litres d'eau par jour pour un adulte ?", choices: ['0.5 L', '1 L', '1.5 à 2 L', '4 L'], answer: 2, explanation: "L'OMS recommande 1.5 à 2 litres d'eau par jour pour un adulte." },
  { q: "Quel fruit contient le plus de vitamine C ?", choices: ['Orange', 'Kiwi', 'Goyave', 'Pomme'], answer: 2, explanation: "La goyave contient ~228 mg de vitamine C/100 g, bien plus que l'orange (53 mg)." },
  { q: "Que signifie le Nutri-Score A ?", choices: ['Produit bio', 'Excellente qualité nutritionnelle', 'Sans allergènes', 'Faible en calories'], answer: 1, explanation: "Le Nutri-Score A indique une excellente qualité nutritionnelle globale." },
  { q: "Quel additif est un colorant rouge controversé ?", choices: ['E100', 'E120', 'E300', 'E440'], answer: 1, explanation: "E120 (carmin) est extrait d'insectes, souvent controversé mais autorisé." },
  { q: "Quel est le sucre naturel du lait ?", choices: ['Glucose', 'Fructose', 'Lactose', 'Saccharose'], answer: 2, explanation: "Le lactose est le sucre naturellement présent dans le lait des mammifères." },
  { q: "Le gluten se trouve dans :", choices: ['Le riz', 'Le blé', 'Le maïs', 'La pomme de terre'], answer: 1, explanation: "Le gluten est une protéine du blé, de l'orge, du seigle et de l'épeautre." },
  { q: "Quel aliment contient le plus de sucre caché ?", choices: ['Ketchup', 'Steak haché', 'Brocoli', 'Œuf dur'], answer: 0, explanation: "Le ketchup peut contenir jusqu'à 25 % de sucre !" },
  { q: "Les probiotiques se trouvent naturellement dans :", choices: ['Le yaourt', "Le jus d'orange", 'Le pain', 'Le riz'], answer: 0, explanation: "Le yaourt contient des bactéries vivantes bénéfiques pour la flore intestinale." },
  { q: "Quel est le danger principal du sel en excès ?", choices: ['Diabète', 'Hypertension', 'Allergie', 'Anémie'], answer: 1, explanation: "Le sodium en excès augmente la pression artérielle et le risque cardiovasculaire." },
  { q: "Quel aliment est la meilleure source de fer ?", choices: ['Lait', 'Lentilles', 'Pain blanc', 'Banane'], answer: 1, explanation: "Les lentilles sont riches en fer (3.3 mg/100 g), une excellente source végétale." },
  { q: "La vitamine D est produite par le corps grâce à :", choices: ["L'eau", 'Le soleil', 'Le sommeil', "L'exercice"], answer: 1, explanation: "Le corps synthétise la vitamine D quand la peau est exposée aux rayons UVB." },
  { q: "Les acides gras oméga-3 se trouvent surtout dans :", choices: ['Le beurre', 'Le poisson gras', 'Le poulet', 'Le fromage'], answer: 1, explanation: "Saumon, maquereau et sardines sont très riches en oméga-3." },
  { q: "Combien de calories contient 1 g d'alcool ?", choices: ['0 kcal', '4 kcal', '7 kcal', '9 kcal'], answer: 2, explanation: "L'alcool fournit 7 kcal/g — presque autant que les lipides, sans valeur nutritive." },
  { q: "Le magnésium aide principalement à :", choices: ['La vision', 'La relaxation musculaire et le sommeil', 'La digestion', 'La coagulation'], answer: 1, explanation: "Le magnésium est crucial pour la relaxation musculaire et le sommeil." },
  { q: "Quel macronutriment doit-on consommer le plus ?", choices: ['Protéines', 'Lipides', 'Glucides', 'En parts égales'], answer: 2, explanation: "Les glucides devraient représenter 45-65 % de l'apport calorique total." },
  { q: "Le miel peut-il se périmer ?", choices: ['Oui, après 1 an', 'Non, jamais', 'Après 5 ans', 'Seulement au frigo'], answer: 1, explanation: "Grâce à sa faible teneur en eau et son pH acide, le miel ne se périme jamais." },
  { q: "Quel sirop est la fierté du Québec ?", choices: ["Sirop de maïs", "Sirop d'érable", "Sirop d'agave", 'Mélasse'], answer: 1, explanation: "Le Québec produit environ 72 % du sirop d'érable mondial — l'or liquide québécois !" },
  { q: "La poutine est originaire de quelle province ?", choices: ['Ontario', 'Québec', 'Nouveau-Brunswick', 'Manitoba'], answer: 1, explanation: "La poutine est née au Québec dans les années 1950, probablement à Warwick." },
  { q: "Quel nutriment aide à prévenir l'anémie ?", choices: ['Vitamine C', 'Fer', 'Vitamine D', 'Calcium'], answer: 1, explanation: "Le fer est essentiel à la production d'hémoglobine. Sa carence cause l'anémie." },
  { q: "Quelle huile est la plus riche en acides gras saturés ?", choices: ["Huile d'olive", 'Huile de colza', 'Huile de coco', 'Huile de tournesol'], answer: 2, explanation: "L'huile de coco contient ~82 % d'acides gras saturés." },
  { q: "Qu'est-ce que le métabolisme basal ?", choices: ['Calories au sport', 'Calories au repos', 'Vitesse de digestion', 'Rythme cardiaque'], answer: 1, explanation: "C'est les calories que le corps brûle au repos pour fonctionner (respirer, digérer…)." },
  { q: "Le score NOVA classe les aliments selon :", choices: ['Leur goût', 'Leur degré de transformation', 'Leur prix', 'Leur origine'], answer: 1, explanation: "NOVA classifie de 1 (non transformé) à 4 (ultra-transformé)." },
  { q: "E621 (glutamate monosodique) est utilisé comme :", choices: ['Colorant', 'Conservateur', "Exhausteur de goût", 'Édulcorant'], answer: 2, explanation: "Le glutamate (E621) renforce le goût umami. Controversé mais autorisé." },
  { q: "Quel aliment a le plus de potassium ?", choices: ['Banane', 'Poulet', 'Pain', 'Lait'], answer: 0, explanation: "La banane est riche en potassium (~358 mg/100 g), essentiel pour les muscles." },

  // Sport & performance
  { q: "Quand faut-il manger après l'entraînement ?", choices: ['Immédiatement', 'Dans les 30 à 60 minutes', 'Après 3 heures', 'Le lendemain'], answer: 1, explanation: "La fenêtre anabolique de 30-60 min après l'effort est idéale pour la récupération avec protéines et glucides." },
  { q: "Combien de protéines par kg pour la musculation ?", choices: ['0.5 g/kg', '1.6 à 2.2 g/kg', '5 g/kg', '10 g/kg'], answer: 1, explanation: "Les recherches recommandent 1.6 à 2.2 g de protéines/kg pour optimiser la croissance musculaire." },
  { q: "La créatine est-elle dangereuse pour la santé ?", choices: ['Oui, très toxique', "Non, c'est l'un des suppléments les plus étudiés", 'Seulement pour les femmes', 'Seulement après 40 ans'], answer: 1, explanation: "La créatine est le supplément sportif le plus étudié — des centaines d'études confirment sa sécurité." },
  { q: "Quel est le meilleur moment pour la caféine avant le sport ?", choices: ['Immédiatement avant', '30 à 60 minutes avant', '3 heures avant', 'Après le sport'], answer: 1, explanation: "La caféine atteint son pic d'effet 30-60 min après ingestion. Elle améliore endurance et force." },
  { q: "Quel sucre le corps utilise-t-il le plus rapidement pour l'énergie ?", choices: ['Fructose', 'Lactose', 'Glucose', 'Saccharose'], answer: 2, explanation: "Le glucose est le carburant direct des cellules — il passe immédiatement dans le sang sans transformation hépatique." },

  // Régimes & alimentation
  { q: "Un régime cétogène (keto) est riche en :", choices: ['Glucides', 'Lipides', 'Protéines', 'Fibres'], answer: 1, explanation: "Le régime keto réduit les glucides à moins de 50 g/jour et remplace l'énergie par les graisses (cétose)." },
  { q: "Le régime méditerranéen est surtout associé à :", choices: ['Viande rouge', "Huile d'olive, poisson et légumes", 'Produits laitiers en masse', 'Aliments frits'], answer: 1, explanation: "Le régime méditerranéen est reconnu comme l'un des plus sains : huile d'olive, poisson, légumes, légumineuses." },
  { q: "Le jeûne intermittent 16:8 signifie :", choices: ['16 jours de jeûne, 8 de repas', 'Manger 16h, jeûner 8h', 'Jeûner 16h, manger dans une fenêtre de 8h', '16 repas par semaine'], answer: 2, explanation: "Le 16:8 consiste à jeûner 16 heures (ex : de 20h à 12h) et manger dans une fenêtre de 8 heures." },
  { q: "Quel aliment est interdit dans un régime vegan ?", choices: ['Tofu', 'Miel', 'Noix', 'Lentilles'], answer: 1, explanation: "Le miel est produit par des abeilles — il est exclu du régime vegan qui évite tout produit d'origine animale." },
  { q: "Le jeûne complet de 24h affecte principalement :", choices: ['Les os', 'Les réserves de glycogène musculaire et hépatique', 'Les reins', 'La peau'], answer: 1, explanation: "Après 24h, les réserves de glycogène (sucre stocké) sont épuisées et le corps passe à la lipolyse (brûlage des graisses)." },

  // Aliments et composition
  { q: "Quel légume contient le plus de protéines ?", choices: ['Brocoli', 'Carotte', 'Lentilles', 'Épinard'], answer: 2, explanation: "Les lentilles contiennent ~9 g de protéines/100 g cuit — un record pour un légume/légumineuse." },
  { q: "L'avocat est principalement riche en :", choices: ['Protéines', 'Glucides', 'Lipides mono-insaturés', 'Fibres'], answer: 2, explanation: "L'avocat est à 77 % de lipides (surtout acide oléique), les mêmes graisses saines que dans l'huile d'olive." },
  { q: "Quel aliment fermenté est riche en vitamine K2 ?", choices: ['Fromage', 'Natto (soja fermenté)', 'Pain au levain', 'Yaourt'], answer: 1, explanation: "Le natto japonais (soja fermenté) est la source la plus concentrée de vitamine K2, essentielle pour les os." },
  { q: "Combien de calories contient 1 g de protéine ?", choices: ['2 kcal', '4 kcal', '7 kcal', '9 kcal'], answer: 1, explanation: "Les protéines apportent 4 kcal/g, comme les glucides. Les lipides en apportent 9 kcal/g." },
  { q: "Quel est l'aliment le plus calorique au monde ?", choices: ["Huile d'olive", 'Beurre de cacahuète', 'Huile de palme', 'Graisse animale pure'], answer: 3, explanation: "La graisse pure (beurre clarifié, saindoux) atteint 900 kcal/100 g — le maximum calorique possible." },
  { q: "Les noix de cajou sont-elles vraiment des noix ?", choices: ['Oui, ce sont des noix', "Non, ce sont des graines", 'Oui, mais sans coque', 'Non, ce sont des légumineuses'], answer: 1, explanation: "Les noix de cajou sont botaniquement des graines — le fruit (cajou) est comestible mais c'est la graine qu'on consomme." },
  { q: "La cannelle peut aider à :", choices: ['Construire les muscles', 'Réguler la glycémie', 'Augmenter le cholestérol', 'Brûler les graisses rapidement'], answer: 1, explanation: "Des études montrent que la cannelle améliore la sensibilité à l'insuline et aide à réguler la glycémie." },

  // Digestion & intestins
  { q: "Le microbiome intestinal contient environ combien de bactéries ?", choices: ['1 million', '100 millions', '38 000 milliards', '1 billion'], answer: 2, explanation: "Le microbiome humain contient ~38 000 milliards de bactéries — plus que le nombre de cellules humaines !" },
  { q: "Quel type de fibres nourrit les bonnes bactéries intestinales ?", choices: ['Fibres solubles (prébiotiques)', 'Fibres insolubles', 'Fibres synthétiques', 'Toutes les fibres pareil'], answer: 0, explanation: "Les fibres solubles (prébiotiques) comme l'inuline et le FOS nourrissent les bifidobactéries et lactobacilles." },
  { q: "Qu'est-ce que le syndrome de l'intestin irritable (SII) ?", choices: ['Une infection bactérienne', "Un trouble fonctionnel du côlon sans lésion visible", 'Une allergie alimentaire', "Une inflammation de l'estomac"], answer: 1, explanation: "Le SII est un trouble fonctionnel (douleurs, ballonnements, transit irrégulier) sans cause organique décelable — touche 10-15 % de la population." },
  { q: "Quel aliment est le meilleur prébiotique naturel ?", choices: ['Yaourt', 'Ail et poireau (fructo-oligosaccharides)', 'Pain blanc', 'Viande rouge'], answer: 1, explanation: "L'ail, le poireau, l'oignon et les asperges sont riches en FOS — des fibres prébiotiques qui nourrissent le microbiome." },

  // Étiquettes & industrie alimentaire
  { q: "\"Sans sucre ajouté\" signifie :", choices: ["Zéro sucre dans le produit", "Aucun sucre n'a été rajouté, mais il peut y en avoir naturellement", 'Moins de 1 g de sucre', 'Approuvé pour les diabétiques'], answer: 1, explanation: "\"Sans sucre ajouté\" = pas de sucre industriel rajouté. Mais un jus de fruit peut contenir 10 g de sucre naturel !" },
  { q: "Quel colorant artificiel est suspecté de causer l'hyperactivité chez les enfants ?", choices: ['E100 (curcumine)', "E102 (tartrazine) et autres colorants azoïques", 'E300 (vitamine C)', 'E500 (bicarbonate)'], answer: 1, explanation: "Les colorants azoïques (E102, E110, E122, E124, E129, E211) doivent afficher un avertissement en Europe : \"peut altérer l'activité des enfants\"." },
  { q: "\"Light\" sur un produit signifie obligatoirement :", choices: ['Moins de 100 kcal', 'Au moins 30 % moins de calories ou de gras que le produit original', 'Sans gras', 'Bio et allégé'], answer: 1, explanation: "Pour être étiqueté \"light\", un produit doit avoir au moins 30 % de moins de calories ou de gras que la version normale." },
  { q: "Les nitrates (E250-252) dans la charcuterie viennent aussi naturellement de :", choices: ['La viande elle-même', 'Les légumes (épinards, betteraves)', 'Le sel de mer', 'Les conserves'], answer: 1, explanation: "Les épinards, betteraves, céleri et laitue contiennent naturellement des nitrates — même concentration que certaines charcuteries." },
  { q: "Qu'est-ce que le Nutri-Score ?", choices: ['Un label bio européen', 'Un score nutritionnel de A (meilleur) à E (pire)', 'Un compteur de calories', 'Une certification OMS'], answer: 1, explanation: "Le Nutri-Score est un système d'étiquetage nutritionnel coloré (A vert à E rouge) basé sur les nutriments pour 100 g de produit." },

  // Vitamines et minéraux
  { q: "Quelle vitamine est synthétisée par la peau sous l'effet du soleil ?", choices: ['Vitamine A', 'Vitamine B12', 'Vitamine C', 'Vitamine D'], answer: 3, explanation: "La vitamine D (calciférol) est produite par la peau en réponse aux rayons UVB. Au Canada, la carence est courante en hiver car le soleil est trop faible de novembre à mars." },
  { q: "Quel aliment contient le plus de vitamine C ?", choices: ['Orange', 'Poivron rouge', 'Kiwi', 'Citron'], answer: 1, explanation: "Le poivron rouge contient ~190 mg de vitamine C pour 100 g — bien plus que l'orange (~50 mg). Le kiwi en contient ~90 mg." },
  { q: "La vitamine B12 se trouve principalement dans :", choices: ['Les légumes verts', 'Les produits animaux (viande, oeufs, lait)', 'Les céréales', 'Les fruits'], answer: 1, explanation: "La vitamine B12 est presque exclusivement d'origine animale. Les végétaliens doivent absolument la supplémenter pour éviter l'anémie et les troubles neurologiques." },
  { q: "Quel minéral est essentiel au bon fonctionnement de la glande thyroïde ?", choices: ['Calcium', 'Magnésium', 'Iode', 'Zinc'], answer: 2, explanation: "L'iode est indispensable à la synthèse des hormones thyroïdiennes T3 et T4. La carence en iode est la première cause de goitre dans le monde — d'où le sel iodé." },
  { q: "Quel aliment est la meilleure source naturelle de magnésium ?", choices: ['Épinards cuits', 'Cacao pur', 'Amandes', 'Graines de citrouille'], answer: 3, explanation: "Les graines de citrouille (pepitas) contiennent ~530 mg de magnésium pour 100 g — record absolu. Le magnésium aide à la relaxation musculaire et au sommeil." },
  { q: "Le fer héminique (mieux absorbé) se trouve dans :", choices: ['Les lentilles', 'Les épinards', 'La viande rouge et les abats', 'Les céréales enrichies'], answer: 2, explanation: "Le fer héminique (lié à l'hémoglobine) dans la viande est absorbé à 15-35 %, contre 2-8 % pour le fer non héminique des végétaux. La vitamine C améliore l'absorption du fer végétal." },

  // Régimes et alimentation
  { q: "Quelle est la différence entre végétarien et végétalien ?", choices: ['Aucune', 'Le végétalien exclut tous les produits animaux (y compris œufs et lait)', 'Le végétarien mange du poisson', 'Le végétalien mange des œufs'], answer: 1, explanation: "Le végétarien exclut la chair animale mais peut consommer œufs, lait et miel. Le végétalien (vegan) exclut TOUS les produits d'origine animale — y compris le miel et la gélatine." },
  { q: "Qu'est-ce que le régime méditerranéen ?", choices: ["Un régime sans gluten", "Un régime riche en légumes, huile d'olive, poissons et légumineuses", 'Un régime cétogène', 'Un régime sans graisses'], answer: 1, explanation: "Le régime méditerranéen est reconnu par l'OMS comme l'un des plus sains au monde. Il est associé à une réduction des maladies cardiovasculaires, du diabète et de certains cancers." },
  { q: "Le jeûne intermittent 16/8 signifie :", choices: ['16 jours de jeûne puis 8 jours normal', 'Manger pendant 8h et jeûner 16h par jour', 'Jeûner 16h une fois par semaine', 'Manger 16 repas légers et 8 repas normaux'], answer: 1, explanation: "Le 16/8 consiste à ne manger que dans une fenêtre de 8h (ex : 12h-20h) et jeûner les 16h restantes. Ce protocole améliore la sensibilité à l'insuline et favorise l'autophagie cellulaire." },
  { q: "Quel sucre naturel est présent dans le lait ?", choices: ['Fructose', 'Saccharose', 'Lactose', 'Maltose'], answer: 2, explanation: "Le lactose est le sucre naturel du lait. L'intolérance au lactose survient quand l'intestin manque de lactase (enzyme) pour le digérer — touchant 65 % des adultes dans le monde." },

  // Superaliments
  { q: "Le curcuma contient quel composé aux propriétés anti-inflammatoires ?", choices: ['Capsaïcine', 'Curcumine', 'Quercétine', 'Resvératrol'], answer: 1, explanation: "La curcumine est le pigment actif du curcuma. Elle a des propriétés anti-inflammatoires et antioxydantes, mais sa biodisponibilité est faible sans poivre noir (pipérine) pour l'activer." },
  { q: "Quel aliment fermenté est une source naturelle de probiotiques ?", choices: ['Pain blanc', 'Yaourt nature non pasteurisé', 'Fromage fondu', 'Jus de légumes'], answer: 1, explanation: "Le yaourt nature contient des bactéries lactiques vivantes (Lactobacillus, Streptococcus thermophilus). Le kéfir, la choucroute, le kimchi et le miso sont aussi d'excellentes sources de probiotiques." },
  { q: "Quel acide gras oméga-3 se trouve uniquement dans les poissons gras ?", choices: ['ALA (acide alpha-linolénique)', 'EPA et DHA', 'Acide linoléique', 'Oméga-6'], answer: 1, explanation: "L'EPA et le DHA sont les oméga-3 à longue chaîne — présents dans le saumon, le maquereau, les sardines. L'ALA végétal (lin, noix) doit être converti en EPA/DHA par l'organisme, avec un rendement très faible." },
  { q: "Combien de calories contient 1 gramme d'alcool ?", choices: ['4 kcal', '7 kcal', '9 kcal', '11 kcal'], answer: 1, explanation: "L'alcool fournit 7 kcal/g — entre les glucides (4 kcal/g) et les lipides (9 kcal/g). Ces calories sont dites 'vides' car sans valeur nutritive, et l'alcool perturbe le métabolisme des graisses." },
];

const Q_NATURE: Question[] = [
  { q: "Quel est le plus grand arbre par volume au monde ?", choices: ['Séquoia géant', 'Baobab', 'Chêne', 'Eucalyptus'], answer: 0, explanation: "Le séquoia géant 'General Sherman' en Californie est le plus grand arbre par volume (~1 487 m³)." },
  { q: "Quel oiseau peut voler à reculons ?", choices: ['Mouette', 'Colibri', 'Hirondelle', 'Faucon'], answer: 1, explanation: "Le colibri est le seul oiseau capable de voler à reculons grâce à ses ailes très mobiles." },
  { q: "Combien de cœurs a un poulpe ?", choices: ['1', '2', '3', '4'], answer: 2, explanation: "Le poulpe possède 3 cœurs : 1 systémique + 2 branchiaux qui pompent vers les branchies." },
  { q: "Quel pourcentage de l'oxygène de la Terre vient des océans ?", choices: ['10 %', '30 %', '50-80 %', '90 %'], answer: 2, explanation: "Le phytoplancton océanique produit entre 50 et 80 % de l'oxygène terrestre." },
  { q: "Quel est l'animal le plus rapide sur terre ?", choices: ['Lion', 'Guépard', 'Antilope', 'Cheval'], answer: 1, explanation: "Le guépard atteint 110-120 km/h en sprint, le plus rapide des animaux terrestres." },
  { q: "Quelle plante carnivore est la plus connue ?", choices: ['Cactus', 'Dionée attrape-mouches', 'Ortie', 'Fougère'], answer: 1, explanation: "La dionée (Venus flytrap) est la plante carnivore la plus célèbre — ses feuilles se referment sur les insectes." },
  { q: "Quel mammifère est le plus grand du monde ?", choices: ['Éléphant', 'Baleine bleue', 'Requin baleine', 'Hippopotame'], answer: 1, explanation: "La baleine bleue (30 m, 180 tonnes) est le plus grand animal ayant jamais existé sur Terre." },
  { q: "La photosynthèse utilise :", choices: ['CO₂ + H₂O → O₂', 'O₂ + H₂O → CO₂', 'N₂ + CO₂ → O₂', 'H₂O + O₂ → N₂'], answer: 0, explanation: "Les plantes absorbent CO₂ et H₂O grâce à la lumière, et rejettent de l'O₂ en produisant du glucose." },
  { q: "Quel animal dort debout ?", choices: ['Chat', 'Cheval', 'Dauphin', 'Ours'], answer: 1, explanation: "Les chevaux peuvent dormir debout grâce à leur système de verrouillage articulaire (stay apparatus)." },
  { q: "Combien d'années peut vivre une tortue géante ?", choices: ['20 ans', '50 ans', '100 ans', 'Plus de 150 ans'], answer: 3, explanation: "Les tortues des Galápagos vivent plus de 150 ans. Jonathan la tortue avait plus de 190 ans en 2022 !" },
  { q: "Quelle araignée tisse la plus solide toile ?", choices: ['Tarentule', 'Araignée dorée (Nephila)', 'Veuve noire', 'Épeire'], answer: 1, explanation: "La soie de l'araignée dorée est plus résistante que le Kevlar à masse égale." },
  { q: "Quel oiseau est le plus grand du monde ?", choices: ['Aigle royal', 'Autruche', 'Condor', 'Pélican'], answer: 1, explanation: "L'autruche est le plus grand oiseau (jusqu'à 2.7 m, 130 kg). Elle ne vole pas mais court à 70 km/h." },
  { q: "De quelle couleur est le sang d'un poulpe ?", choices: ['Rouge', 'Bleu', 'Vert', 'Transparent'], answer: 1, explanation: "Le sang des pieuvres est bleu car il contient de l'hémocyanine (cuivre) au lieu de l'hémoglobine (fer)." },
  { q: "Quel écosystème est le plus riche en biodiversité ?", choices: ['Prairie', 'Toundra', 'Forêt tropicale', 'Désert'], answer: 2, explanation: "La forêt tropicale couvre 6 % de la surface terrestre mais abrite plus de 50 % des espèces vivantes." },
  { q: "Les abeilles font leur danse pour :", choices: ['Se reproduire', 'Trouver la reine', 'Indiquer où est la nourriture', 'Défendre la ruche'], answer: 2, explanation: "La danse des abeilles (von Frisch) indique la direction et la distance des sources de nourriture." },
  { q: "Quel animal peut se régénérer entièrement depuis un fragment ?", choices: ['Étoile de mer', 'Méduse', 'Planaire (ver plat)', 'Crabe'], answer: 2, explanation: "La planaire peut se régénérer entièrement depuis 1/279e de son corps — un cas unique en biologie." },
  { q: "Quel est le son le plus fort produit par un animal ?", choices: ['Lion', 'Cachalot', 'Baleine bleue', 'Éléphant'], answer: 1, explanation: "Le cachalot produit des clics à 230 dB — le son biologique le plus fort, utilisé pour l'écholocation." },
  { q: "Un ours polaire a la peau de quelle couleur ?", choices: ['Blanche', 'Jaune', 'Noire', 'Transparente'], answer: 2, explanation: "La peau de l'ours polaire est noire pour absorber la chaleur. Ses poils sont transparents et creux." },
  { q: "Quel insecte produit le miel ?", choices: ['Guêpe', 'Abeille', 'Bourdon', 'Frelon'], answer: 1, explanation: "Les abeilles mellifères (Apis mellifera) sont les productrices de miel." },
  { q: "Quel arbre est l'emblème du Canada ?", choices: ['Chêne', 'Érable', 'Bouleau', 'Pin'], answer: 1, explanation: "L'érable à sucre est l'arbre national du Canada, représenté sur le drapeau depuis 1965." },
  { q: "Les manchots vivent naturellement dans :", choices: ["L'Arctique", "L'Antarctique", "L'Arctique et l'Antarctique", 'Les tropiques'], answer: 1, explanation: "Les manchots vivent en hémisphère Sud (Antarctique, Patagonie, Galápagos). L'ours polaire vit en Arctique." },
  { q: "Quelle planète pourrait tenir une vie microbienne ?", choices: ['Mercure', 'Mars', 'Jupiter', 'Saturne'], answer: 1, explanation: "Mars est la candidate principale grâce à ses traces d'eau ancienne et sa température relative." },
  { q: "Qu'est-ce que la bioluminescence ?", choices: ["Production de lumière par des êtres vivants", "Photosynthèse nocturne", "Reflet de la lune", "Réaction au froid"], answer: 0, explanation: "La bioluminescence est la capacité de certains organismes (lucioles, méduses, poissons des abysses) à produire leur propre lumière." },
  { q: "Quel mammifère est le seul à pouvoir voler ?", choices: ['Écureuil volant', 'Chauve-souris', 'Poisson volant', 'Calamar géant'], answer: 1, explanation: "La chauve-souris est le seul mammifère avec un vol actif (ailes membraneuses). L'écureuil volant ne fait que planer." },
  { q: "Combien d'espèces d'oiseaux existent environ ?", choices: ['1 000', '5 000', '10 000', '50 000'], answer: 2, explanation: "Il existe environ 10 000 espèces d'oiseaux répertoriées sur la planète." },

  // Océans & vie marine
  { q: "Quelle est la profondeur maximale de l'océan ?", choices: ['4 000 m', '8 849 m', '11 034 m', '15 000 m'], answer: 2, explanation: "La Fosse des Mariannes atteint 11 034 m (Challenger Deep) — le point le plus profond de la Terre." },
  { q: "Quel poisson peut vivre jusqu'à 400 ans ?", choices: ['Requin baleine', 'Brochet', 'Requin du Groenland', 'Thon rouge'], answer: 2, explanation: "Le requin du Groenland peut vivre jusqu'à 400 ans — le vertébré le plus long vivant connu." },
  { q: "Les coraux sont-ils des animaux, des plantes ou des minéraux ?", choices: ['Plantes', 'Minéraux', 'Animaux', 'Champignons'], answer: 2, explanation: "Les coraux sont des animaux (cnidaires) qui vivent en colonies. Leur squelette calcaire forme les récifs." },
  { q: "Quelle méduse est considérée comme biologiquement immortelle ?", choices: ['Méduse-lune', 'Turritopsis dohrnii', 'Physalie', 'Méduse-boîte'], answer: 1, explanation: "Turritopsis dohrnii peut revenir à son stade juvénile après maturité — la seule espèce biologiquement immortelle connue." },
  { q: "Quel animal produit le venin le plus mortel au monde ?", choices: ['Cobra royal', 'Méduse-boîte', 'Mamba noir', 'Pieuvre à anneaux bleus'], answer: 1, explanation: "La méduse-boîte (Chironex fleckeri) possède le venin le plus puissant parmi les animaux — elle peut tuer en 3 minutes." },
  { q: "Les dauphins utilisent quelle technique pour chasser ?", choices: ['Vue nocturne', 'Écholocation', 'Odorat sous-marin', 'Électrosensibilité'], answer: 1, explanation: "Les dauphins émettent des clics ultrasoniques et analysent l'écho pour localiser proies et obstacles avec une précision millimétrique." },
  { q: "Combien de temps peut survivre un requin baleine ?", choices: ['20 ans', '50 ans', '70 ans', 'Plus de 100 ans'], answer: 3, explanation: "Le requin baleine peut vivre plus de 100 ans. C'est le plus grand poisson du monde (jusqu'à 18 m)." },

  // Forêts & plantes
  { q: "Quel pourcentage de la surface terrestre est recouvert de forêts ?", choices: ['10 %', '20 %', '31 %', '50 %'], answer: 2, explanation: "Les forêts couvrent environ 31 % de la surface terrestre, soit 4 milliards d'hectares." },
  { q: "Les bambous sont des :", choices: ['Arbres', 'Graminées (herbes géantes)', 'Arbustes', 'Fougères'], answer: 1, explanation: "Le bambou est une graminée, pas un arbre — il n'a pas de bois. Certaines espèces poussent de 90 cm par jour." },
  { q: "Quelle plante pousse le plus vite au monde ?", choices: ['Bambou', 'Algue géante (kelp)', 'Saule pleureur', 'Eucalyptus'], answer: 1, explanation: "L'algue géante (kelp) peut croître jusqu'à 60 cm par jour, formant des forêts sous-marines de 40 m de hauteur." },
  { q: "Les champignons sont plus proches des animaux ou des plantes ?", choices: ['Des plantes', 'Des animaux', 'Ni des plantes ni des animaux', 'Des bactéries'], answer: 1, explanation: "Les champignons sont génétiquement plus proches des animaux que des plantes — ils constituent leur propre règne (Fungi)." },
  { q: "Quel arbre canadien perd ses aiguilles en hiver ?", choices: ['Pin blanc', 'Épinette noire', 'Mélèze (épinette rouge)', 'Sapin baumier'], answer: 2, explanation: "Le mélèze est le seul conifère canadien à perdre ses aiguilles en automne — un comportement unique parmi les résineux." },
  { q: "La plus grande fleur du monde mesure environ :", choices: ['30 cm', '60 cm', '1 m', 'Plus d\'1 m'], answer: 3, explanation: "La Rafflesia arnoldii de Bornéo peut atteindre 107 cm de diamètre et peser 10 kg. Elle sent la chair en décomposition pour attirer les mouches." },
  { q: "Les arbres communiquent entre eux via :", choices: ['Sons ultrasoniques', 'Réseau de champignons souterrain (Wood Wide Web)', 'Signaux électriques aériens', 'Phéromones liquides'], answer: 1, explanation: "Les arbres s'échangent eau, sucres et signaux d'alarme via le réseau mycorrhizien souterrain — surnommé le Wood Wide Web." },

  // Insectes & invertébrés
  { q: "Quel insecte est le plus fort proportionnellement à sa taille ?", choices: ['Fourmi coupe-feuille', 'Scarabée rhinocéros', 'Termite', 'Araignée'], answer: 1, explanation: "Le scarabée rhinocéros peut porter 850 fois son poids — l'équivalent d'un humain soulevant 65 tonnes." },
  { q: "Combien d'espèces d'insectes existent estimativement ?", choices: ['100 000', '500 000', '1 million', 'Plus de 5 millions'], answer: 3, explanation: "On estime entre 5 et 10 millions d'espèces d'insectes, dont seulement ~1 million sont décrites scientifiquement." },
  { q: "Les abeilles voient quelles couleurs que les humains ne voient pas ?", choices: ['Rouge et orange', 'Ultraviolet', 'Infrarouge', 'Magenta'], answer: 1, explanation: "Les abeilles voient l'ultraviolet, ce qui leur permet de repérer les motifs fluorescents des fleurs invisibles pour nous." },
  { q: "Une colonie de fourmis peut contenir jusqu'à combien d'individus ?", choices: ['1 000', '100 000', '700 000', 'Jusqu\'à 700 millions'], answer: 3, explanation: "Les colonies de fourmis légionnaires (Eciton burchellii) peuvent atteindre 700 000 individus. Les super-colonies de fourmi d'Argentine comptent des milliards." },
  { q: "Quel insecte fait le plus long voyage migratoire ?", choices: ['Monarque', 'Libellule verte-migrante', 'Criquet', 'Papillon Vulcain'], answer: 1, explanation: "La libellule globe-trotter (Pantala flavescens) migre jusqu'à 18 000 km en traversant les océans — plus loin que le papillon monarque." },

  // Climat & environnement
  { q: "Quelle est la principale cause du réchauffement climatique actuel ?", choices: ["Éruptions volcaniques", "Variations solaires", "Émissions de CO₂ d'origine humaine", "Déforestation seule"], answer: 2, explanation: "Le consensus scientifique (GIEC) indique que les émissions humaines de CO₂ (combustibles fossiles) sont la cause principale du réchauffement depuis 1950." },
  { q: "La déforestation de l'Amazonie libère du CO₂ parce que :", choices: ["Les arbres brûlent", "Les arbres décomposés libèrent le carbone stocké", "Les deux", "La déforestation ne libère pas de CO₂"], answer: 2, explanation: "La déforestation libère du CO₂ à la fois par la combustion et par la décomposition des arbres, et élimine la capacité d'absorption future." },
  { q: "Quel gaz contribue le plus à l'effet de serre en volume ?", choices: ['CO₂', 'Méthane', 'Vapeur d\'eau', 'Ozone'], answer: 2, explanation: "La vapeur d'eau représente 50 % de l'effet de serre naturel, mais elle est un effet amplificateur, non une cause directe du changement climatique." },
  { q: "Combien de temps met un sac plastique pour se dégrader ?", choices: ['2 ans', '20 ans', '100 ans', '400 à 1 000 ans'], answer: 3, explanation: "Un sac plastique standard peut prendre de 400 à 1 000 ans pour se dégrader complètement en landfill." },
  { q: "Le Canada abrite quel pourcentage des lacs d'eau douce du monde ?", choices: ['5 %', '10 %', '20 %', 'Plus de 60 %'], answer: 3, explanation: "Le Canada possède plus de 60 % des lacs d'eau douce du monde — plus de 2 millions de lacs." },

  // Animaux du Canada & Québec
  { q: "Quel est l'animal national du Canada ?", choices: ['Orignal', 'Castor', 'Ours polaire', 'Aigle'], answer: 1, explanation: "Le castor est l'animal national du Canada depuis 1975 — symbole de l'industrie de la fourrure qui a fondé l'économie coloniale." },
  { q: "Le cri du loup gris peut s'entendre jusqu'à quelle distance ?", choices: ['1 km', '5 km', '10 km', '16 km'], answer: 3, explanation: "Le hurlement du loup gris peut s'entendre jusqu'à 16 km dans un environnement ouvert — un record parmi les canidés." },
  { q: "Quelle espèce de baleine fréquente le Saint-Laurent ?", choices: ['Rorqual bleu', 'Orque', 'Baleine à bosse', 'Les trois à la fois'], answer: 3, explanation: "Le Saint-Laurent accueille plusieurs espèces : rorqual bleu, rorqual commun, baleine à bosse, béluga et marsouin." },
  { q: "Combien de caribous vivent au Canada ?", choices: ['10 000', '100 000', 'Plus de 2 millions', 'Moins de 5 000'], answer: 2, explanation: "Le Canada abrite plus de 2 millions de caribous répartis en dizaines de troupeaux — bien que plusieurs populations soient en déclin." },
  { q: "L'orignal est le plus grand cervidé. Combien peut-il peser ?", choices: ['200 kg', '400 kg', '700 kg', 'Plus de 700 kg'], answer: 2, explanation: "Un orignal adulte mâle peut peser jusqu'à 700 kg et mesurer 2,3 m au garrot — le plus grand cervidé vivant." },

  // Plantes et végétaux
  { q: "Quelle est la plante à fleurs la plus haute au monde ?", choices: ['Bambou géant', 'Séquoia', 'Eucalyptus', 'Titan arum'], answer: 1, explanation: "Le séquoia géant (Sequoiadendron giganteum) est la plante la plus haute au monde — l'arbre 'Hyperion' en Californie mesure 115,9 m." },
  { q: "Quelle plante carnivore attrape les insectes avec une trappe à mâchoires ?", choices: ['Sarracénie', 'Drosera', 'Dionée attrape-mouche', 'Népenthès'], answer: 2, explanation: "La dionée (Venus flytrap) referme ses feuilles en 0,1 seconde quand un insecte touche ses poils sensitifs — une des rares plantes à mouvement rapide." },
  { q: "Quel arbre canadien produit le sirop d'érable ?", choices: ["L'érable rouge uniquement", "L'érable à sucre principalement", "Tous les érables", "L'érable de Norvège"], answer: 1, explanation: "L'érable à sucre (Acer saccharum) est l'espèce principale pour la production de sirop. Il faut 40 litres de sève pour produire 1 litre de sirop d'érable." },
  { q: "Combien d'espèces de plantes environ ont été identifiées sur Terre ?", choices: ['50 000', '150 000', '391 000', 'Plus d\'un million'], answer: 2, explanation: "Environ 391 000 espèces de plantes vasculaires ont été identifiées — dont ~28 000 espèces comestibles, mais seulement ~150 sont cultivées à grande échelle." },
  { q: "Quelle mousse couvre d'immenses surfaces en forêt boréale canadienne ?", choices: ['Lichen des rennes', 'Sphaigne (mousse de tourbière)', 'Polypode', 'Prêle'], answer: 1, explanation: "La sphaigne couvre des millions de km² de tourbières boréales. Elle peut absorber 20 fois son poids en eau et joue un rôle crucial dans le stockage de carbone." },

  // Océans et eau
  { q: "Quelle est la profondeur maximale des océans ?", choices: ['6 000 m', '8 500 m', '11 034 m', '14 000 m'], answer: 2, explanation: "La fosse des Mariannes (Pacifique) atteint 11 034 m au point Challenger Deep — plus profond que le mont Everest est haut (8 849 m)." },
  { q: "Quel pourcentage de l'eau sur Terre est de l'eau douce ?", choices: ['3 %', '10 %', '25 %', '50 %'], answer: 0, explanation: "Seulement 3 % de l'eau terrestre est douce, et les 2/3 sont gelés dans les glaciers et calottes polaires. Moins de 1 % est accessible directement pour la consommation humaine." },
  { q: "Le Grand Récif de corail australien est menacé principalement par :", choices: ["La surpêche", "Le blanchissement causé par le réchauffement climatique", "La pollution plastique", "Les tempêtes cycloniques"], answer: 1, explanation: "Le blanchissement des coraux se produit quand la mer est trop chaude — les coraux expulsent leurs algues symbiotiques et meurent. Le Grand Récif a perdu 50 % de ses coraux depuis 1995." },

  // Climat et environnement
  { q: "En quelle année le trou dans la couche d'ozone a-t-il été découvert ?", choices: ['1974', '1985', '1995', '2001'], answer: 1, explanation: "Le trou dans la couche d'ozone au-dessus de l'Antarctique a été découvert en 1985 par des scientifiques britanniques. Le Protocole de Montréal (1987) a interdit les CFC et la couche se reconstitue lentement." },
  { q: "Quel gaz est principalement produit par les élevages bovins et contribue à l'effet de serre ?", choices: ['CO₂', 'Méthane (CH₄)', 'Protoxyde d\'azote (N₂O)', 'CFC'], answer: 1, explanation: "Les éructations et flatulences des bovins émettent du méthane (CH₄) — un gaz à effet de serre 80 fois plus puissant que le CO₂ sur 20 ans. L'élevage représente ~14 % des émissions mondiales." },
  { q: "Combien de temps met un verre en verre pour se décomposer naturellement ?", choices: ['100 ans', '500 ans', '1 000 ans', 'Pratiquement jamais'], answer: 3, explanation: "Le verre ne se biodégrade pas — il peut persister plus d'un million d'années dans l'environnement. Recyclé, il peut l'être à l'infini sans perte de qualité." },

  // Animaux exotiques et records
  { q: "Quel animal terrestre est le plus rapide au monde ?", choices: ['Lion', 'Guépard', 'Antilope pronghorn', 'Cheval pur-sang'], answer: 1, explanation: "Le guépard peut atteindre 112 km/h en sprint sur de courtes distances. L'antilope pronghorn d'Amérique du Nord est le deuxième mammifère terrestre le plus rapide (~88 km/h) et le plus endurant." },
  { q: "Quel mammifère a la gestation la plus longue ?", choices: ['Baleine bleue', 'Éléphant d\'Afrique', 'Rhinocéros', 'Girafe'], answer: 1, explanation: "L'éléphante d'Afrique a une gestation de 22 mois — la plus longue de tous les mammifères. Elle ne donne naissance qu'à un seul éléphanteau à la fois, pesant ~120 kg." },
  { q: "Quel oiseau ne peut pas voler mais est le plus rapide coureur parmi les oiseaux ?", choices: ['Pingouin', 'Émeu', 'Autruche', 'Nandou'], answer: 2, explanation: "L'autruche court jusqu'à 70 km/h et maintient 50 km/h sur de longues distances — le coureur le plus rapide du règne animal à deux pattes. Elle pond aussi le plus grand oeuf (1,4 kg)." },
  { q: "Quelle est la durée de vie du perroquet gris du Gabon en captivité ?", choices: ['20 ans', '40 ans', '60 ans', 'Plus de 80 ans'], answer: 2, explanation: "Le perroquet gris du Gabon (Alex) peut vivre 60-80 ans en captivité. Il est capable d'apprendre plus de 100 mots, de compter et de reconnaître des couleurs et des formes." },
];

const Q_HISTOIRE: Question[] = [
  { q: "En quelle année le Canada a-t-il formé sa Confédération ?", choices: ['1776', '1867', '1905', '1931'], answer: 1, explanation: "Le Canada s'est formé le 1er juillet 1867 avec la Confédération des provinces de l'Amérique du Nord britannique." },
  { q: "Qui a fondé Québec en 1608 ?", choices: ['Jacques Cartier', 'Samuel de Champlain', 'Louis XIV', 'Frontenac'], answer: 1, explanation: "Samuel de Champlain a fondé la ville de Québec le 3 juillet 1608 sur les rives du Saint-Laurent." },
  { q: "Quelle année les femmes du Québec ont-elles obtenu le droit de vote ?", choices: ['1920', '1929', '1940', '1960'], answer: 2, explanation: "Les femmes du Québec ont obtenu le droit de vote provincial en 1940, les dernières au Canada." },
  { q: "Quand Montréal a-t-il accueilli les Jeux olympiques ?", choices: ['1960', '1972', '1976', '1984'], answer: 2, explanation: "Montréal a accueilli les XXIe Jeux olympiques d'été le 17 juillet 1976." },
  { q: "La bataille des Plaines d'Abraham a eu lieu en :", choices: ['1713', '1759', '1812', '1867'], answer: 1, explanation: "Le 13 septembre 1759, les Britanniques (Wolfe) ont battu les Français (Montcalm), changeant l'histoire du Canada." },
  { q: "Quelle est la plus ancienne ville d'Amérique du Nord ?", choices: ['Mexico', 'Boston', 'Québec', 'Saint-Augustin (Floride)'], answer: 3, explanation: "Saint-Augustin en Floride, fondée en 1565 par les Espagnols, est la plus ancienne ville européenne d'Amérique du Nord." },
  { q: "Quel empire était le plus grand de l'histoire ?", choices: ['Empire romain', 'Empire mongol', 'Empire britannique', 'Empire ottoman'], answer: 2, explanation: "L'Empire britannique a couvert jusqu'à 24 % des terres émergées au début du XXe siècle." },
  { q: "Qui a peint la Joconde ?", choices: ['Michel-Ange', 'Raphaël', 'Léonard de Vinci', 'Botticelli'], answer: 2, explanation: "La Joconde (Mona Lisa) a été peinte par Léonard de Vinci entre 1503 et 1519." },
  { q: "En quelle année a eu lieu la Révolution française ?", choices: ['1776', '1789', '1804', '1815'], answer: 1, explanation: "La Révolution française a commencé en 1789 avec la prise de la Bastille le 14 juillet." },
  { q: "Qui était le premier Premier ministre du Canada ?", choices: ['Wilfrid Laurier', 'John A. Macdonald', 'Alexander Mackenzie', 'Louis-Hippolyte LaFontaine'], answer: 1, explanation: "Sir John A. Macdonald a été le premier Premier ministre du Canada de 1867 à 1873." },
  { q: "La Grande Muraille de Chine a été construite principalement sous quelle dynastie ?", choices: ['Han', 'Tang', 'Ming', 'Qing'], answer: 2, explanation: "La majorité de la muraille visible aujourd'hui a été construite sous la dynastique Ming (1368-1644)." },
  { q: "Quel événement a déclenché la Première Guerre mondiale ?", choices: ["Invasion de la Pologne", "Assassinat de l'archiduc François-Ferdinand", "Révolution russe", "Crise de la Bosnie"], answer: 1, explanation: "L'assassinat de l'archiduc François-Ferdinand à Sarajevo le 28 juin 1914 a déclenché la Première Guerre mondiale." },
  { q: "Quel pays a inventé la démocratie ?", choices: ['Rome', 'Grèce (Athènes)', 'Égypte', 'Perse'], answer: 1, explanation: "La démocratie directe est née à Athènes au Ve siècle av. J.-C. sous Clisthène et Périclès." },
  { q: "En quelle année l'homme a-t-il marché sur la Lune ?", choices: ['1965', '1969', '1972', '1975'], answer: 1, explanation: "Neil Armstrong et Buzz Aldrin ont marché sur la Lune le 20 juillet 1969, lors de la mission Apollo 11." },
  { q: "Qui a inventé l'imprimerie en Europe ?", choices: ['Leonardo da Vinci', 'Gutenberg', 'Galilée', 'Newton'], answer: 1, explanation: "Johannes Gutenberg a inventé la presse à caractères mobiles vers 1450, révolutionnant la diffusion du savoir." },
  { q: "Quelle ville a été la première capitale du Canada ?", choices: ['Toronto', 'Montréal', 'Kingston', 'Ottawa'], answer: 2, explanation: "Kingston (Ontario) a été la première capitale du Canada-Uni de 1841 à 1844." },
  { q: "L'Expo 67 a eu lieu dans quelle ville ?", choices: ['Toronto', 'Montréal', 'Vancouver', 'Ottawa'], answer: 1, explanation: "L'Exposition universelle de 1967 à Montréal a attiré 50 millions de visiteurs — un succès mondial." },
  { q: "Quel empire a construit le Colisée de Rome ?", choices: ['Empire grec', 'Empire romain', 'Empire byzantin', 'Empire ottoman'], answer: 1, explanation: "Le Colisée a été construit par les empereurs flaviens entre 70 et 80 apr. J.-C." },
  { q: "Napoléon Bonaparte était originaire de :", choices: ['France', 'Corse', 'Italie', 'Espagne'], answer: 1, explanation: "Napoléon est né à Ajaccio, en Corse, le 15 août 1769 — un an après que la France l'ait acquise de Gênes." },
  { q: "Quel traité a mis fin à la Première Guerre mondiale ?", choices: ['Traité de Paris', 'Traité de Versailles', 'Traité de Westphalie', 'Traité de Vienne'], answer: 1, explanation: "Le Traité de Versailles, signé le 28 juin 1919, a officiellement mis fin à la Première Guerre mondiale." },
  { q: "Quel peuple autochtone habitait le territoire de Montréal à l'arrivée des Européens ?", choices: ['Inuit', 'Mohawks', 'Huron-Wendat', 'Algonquins'], answer: 2, explanation: "Les Iroquois/Haudenosaunee et notamment les Mohawks habitaient Hochelaga (Montréal) à l'arrivée de Cartier en 1534." },
  { q: "Quelle est la date de la fête nationale du Québec ?", choices: ['1er juillet', '24 juin', '15 août', '11 novembre'], answer: 1, explanation: "La Saint-Jean-Baptiste, le 24 juin, est la fête nationale du Québec depuis 1977." },
  { q: "Quand le drapeau canadien avec la feuille d'érable a-t-il été adopté ?", choices: ['1947', '1957', '1965', '1982'], answer: 2, explanation: "Le drapeau canadien actuel (l'Unifolié) a été adopté officiellement le 15 février 1965." },
  { q: "Quel siècle correspond à la Renaissance ?", choices: ['XIIe-XIIIe', 'XIVe-XVIe', 'XVIIe-XVIIIe', 'XIXe'], answer: 1, explanation: "La Renaissance est un mouvement culturel qui a eu lieu principalement du XIVe au XVIe siècle, né en Italie." },

  // Guerres & conflits
  { q: "Quelle guerre a duré le plus longtemps dans l'histoire ?", choices: ['Guerre de Cent Ans', 'Guerre de Trente Ans', 'Guerre du Vietnam', 'Croisades'], answer: 0, explanation: "La guerre de Cent Ans (1337-1453) entre France et Angleterre a duré 116 ans. Jeanne d'Arc y a joué un rôle décisif." },
  { q: "Quel pays a perdu le plus de soldats durant la Seconde Guerre mondiale ?", choices: ['Allemagne', 'États-Unis', "Chine", "Union soviétique"], answer: 3, explanation: "L'Union soviétique a perdu environ 27 millions de personnes (militaires et civils) durant la Seconde Guerre mondiale — le bilan le plus lourd." },
  { q: "Le débarquement de Normandie a eu lieu le :", choices: ['6 juin 1942', '6 juin 1944', '8 mai 1945', '11 novembre 1918'], answer: 1, explanation: "Le D-Day, le 6 juin 1944, est la plus grande opération amphibie de l'histoire — 150 000 soldats alliés débarquèrent en Normandie." },
  { q: "Qu'est-ce que la guerre froide ?", choices: ['Une guerre en Antarctique', 'Un conflit armé entre USA et URSS', 'Une rivalité géopolitique sans affrontement direct', 'Une guerre économique mondiale'], answer: 2, explanation: "La guerre froide (1947-1991) fut une rivalité idéologique, militaire et spatiale entre USA et URSS sans affrontement direct entre les deux superpuissances." },
  { q: "La bataille de Vimy Ridge en 1917 est considérée comme un moment fondateur de :", choices: ["L'identité américaine", "L'identité canadienne", "L'identité australienne", "L'identité britannique"], answer: 1, explanation: "La prise de la crête de Vimy (avril 1917) par le Corps canadien est souvent citée comme le moment où le Canada a affirmé son identité nationale propre." },
  { q: "Quel empire ottoman a assiégé Constantinople en 1453 ?", choices: ['Soliman le Magnifique', 'Mehmed II', 'Bajazet Ier', 'Selim Ier'], answer: 1, explanation: "Mehmed II (le Conquérant) a pris Constantinople le 29 mai 1453, mettant fin à l'Empire byzantin et ouvrant la voie ottomane vers l'Europe." },

  // Grandes découvertes & explorations
  { q: "Qui a prouvé que la Terre était ronde en la circumnavigant ?", choices: ['Christophe Colomb', 'Vasco de Gama', 'Fernand de Magellan / Juan Sebastián Elcano', 'Amerigo Vespucci'], answer: 2, explanation: "L'expédition de Magellan (1519-1522), complétée par Elcano après la mort de Magellan, fut le premier tour du monde en bateau." },
  { q: "Qui a été le premier Européen à atteindre l'Amérique du Nord (vers 1000 apr. J.-C.) ?", choices: ['Christophe Colomb', 'John Cabot', 'Leif Erikson', 'Jacques Cartier'], answer: 2, explanation: "Le Viking Leif Erikson a atteint le Vinland (Terre-Neuve actuelle) vers l'an 1000, 500 ans avant Colomb." },
  { q: "Jacques Cartier a remonté quel fleuve lors de ses explorations ?", choices: ['Mississippi', 'Saint-Laurent', 'Mackenzie', 'Nelson'], answer: 1, explanation: "Jacques Cartier a exploré le fleuve Saint-Laurent lors de ses trois voyages (1534, 1535, 1541) et a revendiqué le Canada pour la France." },
  { q: "Quelle civilisation a construit le Machu Picchu ?", choices: ['Aztèques', 'Mayas', 'Incas', 'Olmèques'], answer: 2, explanation: "Le Machu Picchu a été construit par les Incas au XVe siècle au Pérou — à 2 430 m d'altitude." },

  // Sciences & inventions
  { q: "Qui a découvert la pénicilline ?", choices: ['Louis Pasteur', 'Marie Curie', 'Alexander Fleming', 'Robert Koch'], answer: 2, explanation: "Alexander Fleming a découvert la pénicilline en 1928 en observant qu'une moisissure (Penicillium) tuait les bactéries dans sa boîte de Pétri." },
  { q: "Quand a eu lieu la première révolution industrielle ?", choices: ['1650-1700', '1760-1840', '1880-1920', '1920-1950'], answer: 1, explanation: "La première révolution industrielle (1760-1840) a commencé en Angleterre avec la machine à vapeur, le textile mécanisé et le chemin de fer." },
  { q: "Qui a inventé le téléphone ?", choices: ['Thomas Edison', 'Nikola Tesla', 'Alexander Graham Bell', 'Guglielmo Marconi'], answer: 2, explanation: "Alexander Graham Bell (né en Écosse, établi au Canada puis aux États-Unis) a breveté le téléphone en 1876." },
  { q: "Quelle année Internet a-t-il été ouvert au grand public ?", choices: ['1983', '1989', '1991', '1995'], answer: 2, explanation: "Le World Wide Web (WWW) a été inventé par Tim Berners-Lee en 1989 et ouvert au public en 1991. La commercialisation massive a suivi en 1995." },
  { q: "Marie Curie a reçu deux Prix Nobel dans quelles disciplines ?", choices: ['Physique et Chimie', 'Chimie et Médecine', 'Physique et Médecine', 'Chimie et Paix'], answer: 0, explanation: "Marie Curie est la seule personne à avoir reçu deux Prix Nobel dans deux sciences différentes : Physique (1903) et Chimie (1911)." },

  // Histoire du Québec & Canada approfondis
  { q: "Quel événement marque la Révolution tranquille au Québec ?", choices: ["L'indépendance du Québec", "La modernisation rapide de la société québécoise sous Lesage (1960)", "La création du Parti québécois", "Le référendum de 1980"], answer: 1, explanation: "La Révolution tranquille (1960-1966) sous Jean Lesage a transformé le Québec : nationalisation de l'électricité (Hydro-Québec), laïcisation de l'éducation, essor de l'État." },
  { q: "En quelle année a eu lieu le premier référendum sur la souveraineté du Québec ?", choices: ['1976', '1980', '1985', '1995'], answer: 1, explanation: "Le référendum du 20 mai 1980 a vu le Non l'emporter avec 59,56 % des voix. René Lévesque a dit : \"Si je vous ai bien compris, vous êtes en train de dire à la prochaine fois\"." },
  { q: "Qui a fondé la ville de Montréal en 1642 ?", choices: ['Samuel de Champlain', 'Paul Chomedey de Maisonneuve', 'Louis XIV', 'Louis Hébert'], answer: 1, explanation: "Paul Chomedey de Maisonneuve a fondé Ville-Marie (Montréal) le 17 mai 1642 sur l'île que les Autochtones appelaient Tiohtiá:ke." },
  { q: "Quel événement a précipité la création de la Gendarmerie royale du Canada (GRC) ?", choices: ['La Confédération', 'La ruée vers l\'or du Klondike', 'La création des Prairies', 'La Rébellion des Métis'], answer: 3, explanation: "La Police à cheval du Nord-Ouest (ancêtre de la GRC) a été créée en 1873 notamment pour gérer la résistance des Métis et des Premières Nations dans les Prairies." },
  { q: "Quelle est la plus ancienne ville francophone d'Amérique du Nord ?", choices: ['Montréal', 'Québec', 'Louisiane', 'Acadie'], answer: 1, explanation: "Québec, fondée en 1608 par Samuel de Champlain, est la plus ancienne ville francophone d'Amérique du Nord encore habitée." },

  // Civilisations antiques
  { q: "Quelle est la plus longue durée d'une civilisation dans l'histoire ?", choices: ['Rome (1 000 ans)', "Égypte ancienne (3 000 ans)", 'Chine impériale (2 000 ans)', 'Mésopotamie (500 ans)'], answer: 1, explanation: "La civilisation égyptienne ancienne a duré environ 3 000 ans (3100 av. J.-C. - 30 av. J.-C.) — la plus longue de l'histoire humaine." },
  { q: "Qui a construit les pyramides de Gizeh ?", choices: ['Les esclaves hébreux', "Des ouvriers salariés et nourris par l'État", 'Les Nubiens', 'Des armées de soldats'], answer: 1, explanation: "Les recherches archéologiques modernes montrent que les pyramides ont été construites par des ouvriers égyptiens libres, bien nourris et soignés — pas des esclaves." },
  { q: "Quelle langue était la plus utilisée dans l'Empire romain en Orient ?", choices: ['Latin', 'Grec', 'Araméen', 'Hébreu'], answer: 1, explanation: "Dans la partie orientale de l'Empire romain, le grec était la langue commune. C'est pourquoi le Nouveau Testament a été écrit en grec." },
  { q: "La bibliothèque d'Alexandrie a brûlé sous :", choices: ['Jules César', 'Néron', 'Un seul incendie', 'Plusieurs destructions successives'], answer: 3, explanation: "La bibliothèque d'Alexandrie n'a pas brûlé en une seule fois — elle a subi plusieurs destructions partielles sur des siècles (César, guerres civiles, conquête arabe)." },
  { q: "Quel Empire a inventé le premier code de lois écrites de l'histoire ?", choices: ['Égypte', 'Perse', 'Babylone (Code de Hammurabi)', 'Rome'], answer: 2, explanation: "Le Code de Hammurabi (~1754 av. J.-C.) est l'un des plus anciens et complets codes de lois écrits — 282 lois gravées sur une stèle en basalte." },

  // Canada et Québec — approfondissement
  { q: "Quel est le premier ministre qui a rapatrié la Constitution canadienne en 1982 ?", choices: ['Lester B. Pearson', 'Pierre Elliott Trudeau', 'Brian Mulroney', 'Jean Chrétien'], answer: 1, explanation: "Pierre Elliott Trudeau a rapatrié la Constitution canadienne du Royaume-Uni en 1982, y ajoutant la Charte canadienne des droits et libertés. Le Québec n'a jamais signé cet accord." },
  { q: "En quelle année la Loi 101 (Charte de la langue française) a-t-elle été adoptée au Québec ?", choices: ['1969', '1974', '1977', '1982'], answer: 2, explanation: "La Loi 101 a été adoptée en 1977 sous le gouvernement de René Lévesque. Elle fait du français la seule langue officielle du Québec et encadre l'affichage commercial, l'éducation et le travail." },
  { q: "Qui était le chef des Patriotes lors de la rébellion de 1837-1838 au Bas-Canada ?", choices: ['Louis-Joseph Papineau', 'Georges-Étienne Cartier', 'Louis-Hippolyte LaFontaine', 'Wolfred Nelson'], answer: 0, explanation: "Louis-Joseph Papineau a dirigé les Patriotes contre le régime colonial britannique. La rébellion a été écrasée mais a mené aux Actes d'Union de 1840 et éventuellement à la Confédération." },
  { q: "Quel événement a déclenché la Première Guerre mondiale en 1914 ?", choices: ["L'invasion de la Belgique par l'Allemagne", "L'assassinat de l'archiduc François-Ferdinand à Sarajevo", "La déclaration de guerre de la France à l'Allemagne", "L'attaque de la Russie par l'Autriche-Hongrie"], answer: 1, explanation: "L'assassinat de l'archiduc François-Ferdinand d'Autriche à Sarajevo le 28 juin 1914 a déclenché une série d'alliances qui ont embrasé l'Europe. La guerre a fait ~17 millions de morts." },
  { q: "Quel pays a subi le plus de pertes humaines lors de la Seconde Guerre mondiale ?", choices: ['Allemagne', 'États-Unis', 'France', 'URSS (Russie soviétique)'], answer: 3, explanation: "L'URSS a perdu environ 27 millions de personnes (militaires et civils) pendant la Seconde Guerre mondiale — le plus grand sacrifice de l'histoire. La Chine suit avec ~15-20 millions de morts." },
  { q: "Quelle révolution a renversé le tsar Nicolas II de Russie en 1917 ?", choices: ['La Révolution française', 'La Révolution bolchévique', 'La Révolution de Février puis celle d\'Octobre', 'La Révolution industrielle'], answer: 2, explanation: "Il y a eu deux révolutions en 1917 : la Révolution de Février (renverse le tsar) et la Révolution d'Octobre (les bolchéviques de Lénine prennent le pouvoir), menant à la création de l'URSS en 1922." },

  // Histoire mondiale — approfondissement
  { q: "Sur quel continent se trouve le plus grand empire de l'histoire (en superficie) ?", choices: ['Asie (Empire mongol)', 'Europe (Empire britannique)', 'Amérique (Empire aztèque)', 'Afrique (Empire du Mali)'], answer: 1, explanation: "L'Empire britannique est le plus grand empire de l'histoire avec 35,5 millions de km² à son apogée (1920) — 25 % des terres émergées. L'Empire mongol (24 M km²) le précède en superficie contiguë." },
  { q: "La chute du Mur de Berlin s'est produite en quelle année ?", choices: ['1985', '1989', '1991', '1993'], answer: 1, explanation: "Le Mur de Berlin est tombé le 9 novembre 1989 — symbole de la fin de la Guerre froide. L'Allemagne a été réunifiée le 3 octobre 1990 et l'URSS dissoute en décembre 1991." },
  { q: "Nelson Mandela a été emprisonné pendant combien d'années en Afrique du Sud ?", choices: ['10 ans', '18 ans', '27 ans', '35 ans'], answer: 2, explanation: "Nelson Mandela a été emprisonné de 1964 à 1990 (27 ans) principalement sur l'île de Robben. Il est devenu le premier président noir d'Afrique du Sud en 1994 après la fin de l'apartheid." },
  { q: "Quel scientifique a proposé la théorie de l'évolution par sélection naturelle ?", choices: ['Gregor Mendel', 'Charles Darwin', 'Louis Pasteur', 'Alfred Russel Wallace'], answer: 1, explanation: "Charles Darwin a publié 'L'Origine des espèces' en 1859. Alfred Russel Wallace a développé la même théorie indépendamment — Darwin a publié en premier après 20 ans de recherches." },
  { q: "La Révolution française a commencé en quelle année ?", choices: ['1776', '1789', '1799', '1804'], answer: 1, explanation: "La Révolution française a commencé le 14 juillet 1789 avec la prise de la Bastille. Elle a conduit à la Déclaration des droits de l'homme, la Première République et finalement l'avènement de Napoléon Bonaparte." },
  { q: "Quel est le plus vieux traité de paix encore en vigueur dans l'histoire ?", choices: ['Traité de Westphalie (1648)', 'Traité de Paris (1783)', 'Traité Anglo-Portugais (1373)', 'Traité de Versailles (1919)'], answer: 2, explanation: "Le Traité d'alliance Anglo-Portugais signé en 1373 entre l'Angleterre et le Portugal est le plus vieux traité de paix encore en vigueur — plus de 650 ans sans rupture." },
  { q: "Qui a été le premier homme à marcher sur la Lune ?", choices: ['Buzz Aldrin', 'Youri Gagarine', 'Neil Armstrong', 'Michael Collins'], answer: 2, explanation: "Neil Armstrong a posé le pied sur la Lune le 21 juillet 1969 (mission Apollo 11) avec la phrase : 'Un petit pas pour l'homme, un bond de géant pour l'humanité'. Buzz Aldrin l'a suivi 19 minutes plus tard." },
  { q: "La Charte des droits et libertés de la personne du Québec date de quelle année ?", choices: ['1960', '1968', '1975', '1982'], answer: 2, explanation: "La Charte québécoise des droits et libertés de la personne a été adoptée en 1975 sous Robert Bourassa — avant la Charte canadienne (1982). Elle s'applique aux relations privées, ce que la Charte canadienne ne fait pas." },
];

const Q_LIEUX: Question[] = [
  { q: "Quel style architectural caractérise le Château Frontenac à Québec ?", choices: ['Baroque', 'Style château (néo-médiéval)', 'Brutalism', 'Art déco'], answer: 1, explanation: "Le Château Frontenac (1893) est le chef-d'œuvre du 'style château' de la compagnie ferroviaire CPR, inspiré des châteaux de la Loire." },
  { q: "Comment s'appelle le réseau souterrain piéton de Montréal ?", choices: ['Le Tunnel', 'La Ville intérieure (RÉSO)', 'Le Métroparc', 'Le Passage'], answer: 1, explanation: "Le RÉSO de Montréal est le plus grand réseau piéton souterrain du monde — 33 km de couloirs reliant 120 bâtiments." },
  { q: "Quel commerçant est reconnu par sa enseigne rouge et blanche avec un triangle ?", choices: ['Walmart', 'Canadian Tire', 'IGA', 'Couche-Tard'], answer: 1, explanation: "Canadian Tire est reconnaissable partout au Canada avec son triangle rouge sur fond blanc. Fondée en 1922 à Toronto." },
  { q: "Quelle chaîne possède les bannières Provigo et Maxi au Québec ?", choices: ['Metro', 'Sobeys', 'Loblaws', 'Walmart'], answer: 2, explanation: "Loblaws est propriétaire de Provigo, Maxi, IGA (via Sobeys en Ontario), No Frills et plusieurs autres bannières canadiennes." },
  { q: "Le nom IKEA vient de :", choices: ['Une ville suédoise', 'Initiales de son fondateur et sa ferme', 'Mot suédois pour maison', 'Acronyme en latin'], answer: 1, explanation: "IKEA = Ingvar Kamprad (fondateur) + Elmtaryd (ferme familiale) + Agunnaryd (village natal)." },
  { q: "Quel quartier de Montréal est célèbre pour ses escaliers extérieurs colorés ?", choices: ['Outremont', 'Plateau-Mont-Royal', 'Griffintown', 'Rosemont'], answer: 1, explanation: "Le Plateau-Mont-Royal est iconique avec ses balcons et escaliers extérieurs en fer forgé — une caractéristique unique de l'architecture montréalaise." },
  { q: "La Tour CN à Toronto était le plus haut du monde jusqu'à quelle année ?", choices: ['1999', '2004', '2007', '2010'], answer: 2, explanation: "La Tour CN a été la structure autoportante la plus haute du monde de 1976 à 2007, date à laquelle Burj Khalifa l'a dépassée." },
  { q: "Quel marché public est le plus grand à Montréal ?", choices: ['Marché Atwater', 'Marché Jean-Talon', 'Marché Maisonneuve', 'Marché Bonsecours'], answer: 1, explanation: "Le Marché Jean-Talon dans la Petite-Italie est le plus grand marché public en Amérique du Nord avec plus de 300 marchands." },
  { q: "La Sagrada Família est dans quelle ville ?", choices: ['Madrid', 'Barcelone', 'Rome', 'Lisbonne'], answer: 1, explanation: "La Sagrada Família est l'œuvre d'Antoni Gaudí à Barcelone. Sa construction a commencé en 1882 et n'est pas encore terminée." },
  { q: "Quel style architectural est caractérisé par l'utilisation massive de béton brut ?", choices: ['Art déco', 'Brutalisme', 'Néoclassicisme', 'Modernisme'], answer: 1, explanation: "Le brutalisme (1950-1970) utilise le béton brut apparent (béton brut de décoffrage). UQAM à Montréal en est un exemple." },
  { q: "La province qui compte le plus de Tim Hortons par habitant ?", choices: ['Québec', 'Ontario', 'Nouveau-Brunswick', 'Alberta'], answer: 1, explanation: "L'Ontario concentre le plus grand nombre de Tim Hortons, bien que la chaîne soit présente dans toutes les provinces." },
  { q: "Quelle ville est surnommée 'La Belle Province' ?", choices: ['Ottawa', 'Montréal', 'Québec (province)', 'Saguenay'], answer: 2, explanation: "Le Québec est surnommé 'La Belle Province', devise qui apparaissait sur les plaques d'immatriculation jusqu'en 1978." },
  { q: "Le Vieux-Port de Montréal se trouve sur quel fleuve ?", choices: ["Rivière des Outaouais", 'Fleuve Saint-Laurent', 'Rivière Richelieu', 'Rivière des Prairies'], answer: 1, explanation: "Le Vieux-Port de Montréal est situé sur la rive nord du fleuve Saint-Laurent, le plus grand fleuve du Canada." },
  { q: "Quelle chaîne de pharmacie est identifiée par la couleur bleue au Québec ?", choices: ['Pharmaprix', 'Jean Coutu', 'Uniprix', 'Brunet'], answer: 1, explanation: "Jean Coutu est la grande pharmacie bleue du Québec, fondée en 1969. Acquise par Metro en 2018." },
  { q: "Quel est le plus grand centre commercial au Canada ?", choices: ['Place Montréal Trust', 'West Edmonton Mall', 'Rideau Centre', 'Carrefour Laval'], answer: 1, explanation: "Le West Edmonton Mall en Alberta est le plus grand centre commercial au Canada (492 000 m²) avec une patinoire, un parc aquatique et un hôtel." },
  { q: "L'architecture gothique se reconnaît à :", choices: ['Arcs ronds', 'Colonnes grecques', 'Arcs-boutants et arcs brisés', 'Toits plats'], answer: 2, explanation: "L'architecture gothique (XIIe-XVe s.) est caractérisée par les arcs brisés, arcs-boutants et grandes fenêtres à vitraux." },
  { q: "Dans quel quartier de Montréal est situé le Mile-Ex, zone tech et créative ?", choices: ['Rosemont', 'Ahuntsic', 'Parc-Extension / Outremont', 'Ville-Émard'], answer: 2, explanation: "Le Mile-Ex est à cheval entre Outremont et Parc-Extension — devenu le quartier des startups, studios et l'Université de Montréal (nouveau campus)." },
  { q: "Couche-Tard est une entreprise de :", choices: ['Épiceries', 'Dépanneurs (convenience stores)', 'Pharmacies', 'Restaurants'], answer: 1, explanation: "Alimentation Couche-Tard est une chaîne de dépanneurs fondée à Laval en 1980. C'est aujourd'hui l'une des plus grandes au monde (Circle K)." },
  { q: "La Place Ville-Marie à Montréal a quelle forme particulière ?", choices: ['Triangle', 'Croix', 'Cercle', 'Étoile'], answer: 1, explanation: "La Place Ville-Marie (1962) a une forme de croix, une référence symbolique à la croix fondatrice de Montréal." },
  { q: "Quelle ville canadienne est connue pour ses pentes de ski les plus proches d'un centre-ville ?", choices: ['Vancouver', 'Calgary', 'Montréal', 'Québec'], answer: 0, explanation: "Vancouver est à 30 min des pistes de ski de Whistler/Blackcomb (et la montagne est visible depuis la ville). Les Laurentides sont aussi proches de Montréal." },
  { q: "Quel marché alimentaire de Montréal est situé dans un bâtiment néoclassique (dôme vert) ?", choices: ['Jean-Talon', 'Bonsecours', 'Atwater', 'Maisonneuve'], answer: 1, explanation: "Le Marché Bonsecours (1847) avec son dôme argenté est une icône du Vieux-Montréal — il servait aussi de Parlement." },
  { q: "Quelle ville est la capitale de la province de Québec ?", choices: ['Montréal', 'Gatineau', 'Québec', 'Sherbrooke'], answer: 2, explanation: "Québec est la capitale provinciale depuis la Confédération de 1867. Montréal est la plus grande ville, mais non la capitale." },
  { q: "Dollarama a été fondée en quelle province ?", choices: ['Ontario', 'Québec', 'Alberta', 'Colombie-Britannique'], answer: 1, explanation: "Dollarama a été fondée en 1992 à Montréal, Québec, par Larry Rossy. C'est aujourd'hui le plus grand détaillant à un prix fixe au Canada." },
  { q: "L'Habitat 67 à Montréal est connu pour être :", choices: ['Un centre commercial', 'Un complexe résidentiel modulaire révolutionnaire', 'Un parc thématique', 'Un musée'], answer: 1, explanation: "Habitat 67 (architecte Moshe Safdie, Expo 67) est un complexe résidentiel de 354 modules en béton empilés — un manifeste de l'architecture moderne." },
  { q: "Quelle avenue est le cœur commercial de Montréal ?", choices: ['Rue Sherbrooke', 'Avenue du Mont-Royal', 'Rue Sainte-Catherine', 'Boulevard René-Lévesque'], answer: 2, explanation: "La rue Sainte-Catherine (11 km) est la plus grande artère commerciale de Montréal avec des milliers de commerces." },

  // Grandes villes du monde
  { q: "Quelle ville a le plus grand nombre de gratte-ciels au monde ?", choices: ['New York', 'Dubaï', 'Hong Kong', 'Chicago'], answer: 2, explanation: "Hong Kong possède plus de 480 gratte-ciels (immeubles de plus de 150 m) — plus que toute autre ville au monde." },
  { q: "Quel bâtiment est le plus haut du monde en 2024 ?", choices: ['Tour CN', 'Empire State Building', 'Burj Khalifa', 'Merdeka 118'], answer: 2, explanation: "Le Burj Khalifa à Dubaï (828 m, 163 étages) est le bâtiment le plus haut du monde depuis 2010." },
  { q: "Paris est surnommée :", choices: ["La Cité de l'Or", 'La Ville Lumière', 'La Cité Éternelle', 'La Grande Pomme'], answer: 1, explanation: "Paris est surnommée la Ville Lumière — d'abord parce qu'elle fut l'une des premières villes européennes à adopter l'éclairage public en 1667." },
  { q: "Quelle ville est construite sur plus de 100 îles reliées par 400 ponts ?", choices: ['Venise', 'Amsterdam', 'Stockholm', 'Helsinki'], answer: 2, explanation: "Stockholm est construite sur 14 îles reliées par des ponts, mais c'est Venise avec ses 118 îles et 400+ ponts qui est la plus iconique. Stockholm remporte sur 14 îles." },
  { q: "La Tour Eiffel a été construite pour :", choices: ["Défendre Paris", "L'Exposition universelle de 1889", "Loger les touristes", "Servir de phare"], answer: 1, explanation: "Gustave Eiffel a construit la tour pour l'Exposition universelle de 1889 — initialement prévue pour être démontée après 20 ans." },
  { q: "Quel pont est le plus long du monde ?", choices: ['Golden Gate (USA)', 'Pont de Danyang-Kunshan (Chine)', 'Viaduc de Millau (France)', 'Pont du Bosphore (Turquie)'], answer: 1, explanation: "Le viaduc ferroviaire de Danyang-Kunshan en Chine mesure 164 km — le pont le plus long du monde." },
  { q: "Dans quelle ville se trouve le Colisée ?", choices: ['Athènes', 'Rome', 'Istanbul', 'Carthage'], answer: 1, explanation: "Le Colisée (Flavius Amphitheatre) est à Rome, Italie. Construit entre 70 et 80 apr. J.-C., il pouvait accueillir 50 000 à 80 000 spectateurs." },
  { q: "Le pont Golden Gate est dans quelle ville ?", choices: ['Los Angeles', 'Seattle', 'San Francisco', 'Portland'], answer: 2, explanation: "Le Golden Gate Bridge à San Francisco (inauguré en 1937) était le plus long pont suspendu du monde pendant 27 ans." },

  // Architecture mondiale emblématique
  { q: "Quel architecte a conçu le musée Guggenheim de Bilbao ?", choices: ['Zaha Hadid', 'Frank Gehry', 'Renzo Piano', 'Norman Foster'], answer: 1, explanation: "Frank Gehry a conçu le Guggenheim de Bilbao (1997) en titane ondulé — un symbole de l'architecture déconstructiviste et de la revitalisation urbaine." },
  { q: "La Cité interdite est dans quelle ville ?", choices: ['Shanghai', 'Tokyo', 'Pékin', 'Séoul'], answer: 2, explanation: "La Cité interdite (Gugong) est à Pékin — construite de 1406 à 1420 sous l'empereur Yongle, elle fut le palais impérial de 24 empereurs." },
  { q: "Quel matériau moderne domine l'architecture durable (green architecture) ?", choices: ['Béton préfabriqué', 'Verre recyclé', 'Bois lamellé-croisé (CLT)', 'Aluminium'], answer: 2, explanation: "Le CLT (Cross-Laminated Timber) est le matériau phare de l'architecture durable — résistant comme le béton, mais renouvelable et capteur de carbone." },
  { q: "L'Opéra de Sydney ressemble à :", choices: ['Des voiles de bateau', 'Des écailles de poisson', 'Des triangles empilés', 'Des coupoles ottomanes'], answer: 0, explanation: "L'Opéra de Sydney (Jørn Utzon, 1973) est recouvert de 1 056 000 tuiles en céramique formant des coquilles évoquant des voiles — un chef-d'œuvre du XXe siècle." },
  { q: "Qu'est-ce que le style \"Art déco\" ?", choices: ['Architecture médiévale en pierre', 'Style géométrique et luxueux des années 1920-1930', 'Architecture en béton brut des années 1960', 'Style japonais minimaliste'], answer: 1, explanation: "L'Art déco (1920-1940) se caractérise par des formes géométriques, des lignes droites et des matériaux luxueux. L'Empire State Building et le Chrysler Building en sont des exemples parfaits." },
  { q: "Quel architecte québécois est mondialement célèbre pour Habitat 67 ?", choices: ['Arthur Erickson', 'Moshe Safdie', 'Douglas Cardinal', 'Dan Hanganu'], answer: 1, explanation: "Moshe Safdie (né à Haïfa, établi à Montréal) a conçu Habitat 67 alors qu'il était encore étudiant à l'Université McGill — un projet de thèse devenu icône mondiale." },

  // Commerces & enseignes canadiennes
  { q: "Tim Hortons a été fondé en quelle année et par qui ?", choices: ["1954 par Ron Joyce", "1964 par Tim Horton (hockeyeur)", "1972 par une famille ontarienne", "1980 par Wendy's"], answer: 1, explanation: "Tim Hortons a été fondé en 1964 par le hockeyeur Tim Horton à Hamilton, Ontario. Aujourd'hui ~4 800 restaurants au Canada." },
  { q: "Quelle enseigne québécoise est connue par son dépanneur ouvert la nuit ?", choices: ["IGA Express", "Couche-Tard", "Maxi", "Super C"], answer: 1, explanation: "Couche-Tard (qui signifie \"qui se couche tard\") est fondée à Laval en 1980. Elle possède aujourd'hui 14 000+ dépanneurs sous l'enseigne Circle K dans le monde." },
  { q: "Quelle chaîne de restauration rapide est née au Québec ?", choices: ["Harvey's", "La Belle Province", "St-Hubert", "Mike's"], answer: 2, explanation: "La chaîne St-Hubert BBQ a été fondée en 1951 à Montréal par Hector Dion — la première rôtisserie de poulet au Canada." },
  { q: "Quelle entreprise québécoise est le plus grand cirque au monde ?", choices: ['Les 7 doigts de la main', 'Cirque du Soleil', 'La Piste Rouge', 'Grand Cirque de Montréal'], answer: 1, explanation: "Le Cirque du Soleil, fondé à Baie-Saint-Paul en 1984 par Guy Laliberté, est le plus grand cirque contemporain au monde avec 4 000 employés." },
  { q: "Où se situe le siège mondial de Bombardier ?", choices: ['Toronto', 'Ottawa', 'Montréal', 'Québec'], answer: 2, explanation: "Bombardier, fondée à Valcourt, Québec (motoneige Ski-Doo) est aujourd'hui un géant de l'aéronautique dont le siège est à Montréal." },

  // Géographie canadienne
  { q: "Quelle province canadienne est la plus grande ?", choices: ['Ontario', 'Colombie-Britannique', 'Québec', 'Nunavut'], answer: 3, explanation: "Le Nunavut est le territoire le plus grand (2,09 millions km²) mais le Québec est la plus grande province (1,5 millions km²)." },
  { q: "Quelle montagne est la plus haute au Canada ?", choices: ['Mont Robson', 'Mont Logan', 'Mont Saint-Élie', 'Mont Columbia'], answer: 1, explanation: "Le mont Logan au Yukon (5 959 m) est le plus haut sommet du Canada et le deuxième d'Amérique du Nord après le Denali." },
  { q: "La Voie maritime du Saint-Laurent relie :", choices: ["Montréal à New York", "Les Grands Lacs à l'Atlantique", "Ottawa à Québec", "Le lac Supérieur au lac Érié"], answer: 1, explanation: "La Voie maritime du Saint-Laurent (inaugurée en 1959) permet aux navires de traverser les 3 700 km des Grands Lacs jusqu'à l'océan Atlantique." },
  { q: "Quel quartier de Québec est classé au patrimoine mondial de l'UNESCO ?", choices: ['Saint-Roch', 'Limoilou', 'Vieux-Québec (intra-muros)', 'Montcalm'], answer: 2, explanation: "Le Vieux-Québec est le seul quartier fortifié au nord du Mexique en Amérique — classé au patrimoine mondial de l'UNESCO depuis 1985." },
  { q: "Quel musée est le plus visité au Canada ?", choices: ["Musée des beaux-arts de Montréal", "Musée canadien de l'histoire (Gatineau)", "Musée royal de l'Ontario (Toronto)", "Musée des beaux-arts du Canada (Ottawa)"], answer: 2, explanation: "Le Musée royal de l'Ontario (ROM) à Toronto accueille environ 1,2 million de visiteurs par année — le plus visité au Canada." },
  { q: "Quel est le plus vieux quartier commercial d'Amérique du Nord toujours en activité ?", choices: ['French Quarter (Nouvelle-Orléans)', 'Vieux-Montréal', 'Old Town Alexandria', 'Market Street (Philadelphie)'], answer: 1, explanation: "Le Vieux-Montréal, avec ses rues pavées et bâtiments du XVIIe siècle, est considéré comme le plus ancien quartier commercial encore actif d'Amérique du Nord." },

  // Transports & infrastructures
  { q: "Le métro de Montréal est unique car ses voitures roulent sur :", choices: ["Rails en acier comme ailleurs", "Pneus en caoutchouc", "Coussins d'air (maglev)", "Rails magnétiques"], answer: 1, explanation: "Le métro de Montréal (ouvert en 1966 pour Expo 67) roule sur pneus en caoutchouc comme celui de Paris (ligne 1) — plus silencieux mais plus énergivore." },
  { q: "Quel aéroport est le plus achalandé au Canada ?", choices: ["Montréal-Trudeau (YUL)", "Vancouver (YVR)", "Toronto Pearson (YYZ)", "Calgary (YYC)"], answer: 2, explanation: "Toronto Pearson (YYZ) est le plus grand et achalandé aéroport du Canada avec ~50 millions de passagers par année." },
  { q: "La route Transcanadienne mesure environ :", choices: ['3 000 km', '5 000 km', '8 000 km', 'Plus de 7 800 km'], answer: 3, explanation: "La route Transcanadienne (inaugurée en 1962) mesure 7 821 km de Victoria (C.-B.) à St. John's (Terre-Neuve) — la plus longue autoroute nationale au monde." },

  // Montréal — quartiers et culture
  { q: "Le quartier du Plateau-Mont-Royal est surtout connu pour :", choices: ["Ses gratte-ciels et bureaux", "Ses duplex colorés, cafés et culture bohème", "Ses usines et entrepôts", "Son casino"], answer: 1, explanation: "Le Plateau est le quartier bohème de Montréal — duplex avec escaliers extérieurs, galeries d'art, cafés indépendants et scène culturelle active. C'est le quartier le plus densément peuplé du Canada." },
  { q: "Quel festival montréalais est le plus grand festival de jazz au monde ?", choices: ["Osheaga", "Festival de Jazz de Montréal", "Piknic Électronik", "FrancoFolies"], answer: 1, explanation: "Le Festival International de Jazz de Montréal (fondé en 1980) est le plus grand festival de jazz au monde selon le Livre Guinness — il accueille ~3 000 concerts et 2 millions de visiteurs." },
  { q: "Qu'est-ce que le Biodôme de Montréal ?", choices: ["Un aquarium marin", "Un musée d'histoire naturelle avec 5 écosystèmes vivants", "Un jardin botanique intérieur", "Un zoo conventionnel"], answer: 1, explanation: "Le Biodôme (anciennement le vélodrome olympique de 1976) présente 5 écosystèmes des Amériques : forêt tropicale, forêt laurentienne, Saint-Laurent marin, Labrador et Antarctique." },
  { q: "Quelle rue de Montréal est surnommée 'La Main' ?", choices: ["Rue Sainte-Catherine", "Boulevard Saint-Laurent", "Rue Saint-Denis", "Avenue du Parc"], answer: 1, explanation: "Le boulevard Saint-Laurent (La Main) divise Montréal entre Est (adresses paires) et Ouest (adresses impaires). C'est le corridor multiculturel historique où ont afflué les immigrants depuis le XIXe siècle." },
  { q: "Combien de kilomètres de tunnels et passages souterrains forme le réseau piétonnier de Montréal (RÉSO) ?", choices: ["12 km", "22 km", "33 km", "50 km"], answer: 2, explanation: "La ville souterraine de Montréal (RÉSO) s'étend sur 33 km de tunnels reliant 80 complexes, 10 stations de métro et des milliers de commerces — la plus grande au monde." },

  // Villes du monde
  { q: "Quelle est la ville la plus peuplée au monde ?", choices: ["Mexico", "Mumbai", "Tokyo", "Shanghai"], answer: 2, explanation: "Tokyo (aire urbaine) est la ville la plus peuplée au monde avec ~37 millions d'habitants dans la région métropolitaine — devant Delhi (~32 M) et Shanghai (~29 M)." },
  { q: "La tour Eiffel a été construite pour quel événement ?", choices: ["Le couronnement de Napoléon III", "L'Exposition universelle de 1889", "L'armistice de 1918", "Le bicentenaire de Paris"], answer: 1, explanation: "Gustave Eiffel a conçu la tour pour l'Exposition universelle de 1889 (centenaire de la Révolution française). Elle devait être démontée après l'exposition mais a été conservée comme antenne radio." },
  { q: "Quel monument est situé à Agra, en Inde ?", choices: ["Le Parthénon", "Le Taj Mahal", "La Grande Muraille", "Les temples d'Angkor"], answer: 1, explanation: "Le Taj Mahal a été construit entre 1632 et 1653 par l'empereur moghol Shah Jahan en mémoire de son épouse Mumtaz Mahal. Ce mausolée de marbre blanc est classé patrimoine mondial UNESCO." },
  { q: "Quelle ville est considérée comme la capitale mondiale de la gastronomie ?", choices: ["New York", "Lyon", "Tokyo", "Paris"], answer: 2, explanation: "Tokyo possède le plus grand nombre d'étoiles Michelin au monde (~230 restaurants étoilés) — devant Paris (~120). Lyon est surnommée 'capitale gastronomique de France' par Paul Bocuse." },

  // Nature canadienne — lieux
  { q: "Les chutes Niagara se trouvent entre quels deux pays ?", choices: ["Canada et États-Unis", "Canada et Mexique", "États-Unis et Mexique", "Canada et Québec"], answer: 0, explanation: "Les chutes Niagara sont partagées entre l'Ontario (Canada) et New York (États-Unis). Le côté canadien (fer à cheval) est le plus spectaculaire avec une largeur de 792 m." },
  { q: "Quel parc national du Québec est connu pour ses fjords ?", choices: ["Parc de la Gaspésie", "Parc national du Bic", "Parc national du Fjord-du-Saguenay", "Parc des Hautes-Gorges"], answer: 2, explanation: "Le Parc national du Fjord-du-Saguenay protège le seul fjord navigable au monde situé aussi loin au sud. Le Saguenay coule 60-100 m sous la surface du Saint-Laurent — deux eaux qui ne se mélangent pas." },
  { q: "La ville de Québec est entourée de remparts. Quelle longueur font-ils ?", choices: ["2 km", "4,6 km", "7 km", "12 km"], answer: 1, explanation: "Les remparts de Québec mesurent 4,6 km de long, construits entre 1608 et le XIXe siècle. Ce sont les seuls remparts fortifiés au nord du Mexique en Amérique du Nord encore intacts." },
  { q: "Où se trouve le plus grand glacier d'Amérique du Nord accessible en voiture ?", choices: ["Alaska", "Yukon", "Colombie-Britannique", "Alberta (Champ de glace Columbia)"], answer: 3, explanation: "Le champ de glace Columbia sur la route des Glaciers (Alberta) est le plus grand glacier accessible par route en Amérique du Nord. Il est la source de 6 glaciers majeurs, dont le glacier Athabasca." },
  { q: "Quelle province canadienne est surnommée 'La Belle Province' ?", choices: ["Ontario", "Colombie-Britannique", "Québec", "Nouveau-Brunswick"], answer: 2, explanation: "Le Québec est surnommé 'La Belle Province' — devise inscrite sur les plaques d'immatriculation depuis 1963. L'Ontario est 'Loyal elle commença, loyale elle demeure' et l'Alberta 'Wild Rose Country'." },
];

const Q_SPORT: Question[] = [
  // Hockey
  { q: "Quel joueur détient le record de buts en carrière dans la LNH ?", choices: ["Mario Lemieux", "Gordie Howe", "Wayne Gretzky", "Brett Hull"], answer: 2, explanation: "Wayne Gretzky a marqué 894 buts en carrière LNH — un record intouchable. Il détient aussi le record de points (2 857)." },
  { q: "Combien de fois les Canadiens de Montréal ont-ils remporté la Coupe Stanley ?", choices: ["16 fois", "24 fois", "31 fois", "11 fois"], answer: 1, explanation: "Le Canadien de Montréal a remporté la Coupe Stanley 24 fois — plus que tout autre club de la LNH. Leur dernière conquête date de 1993." },
  { q: "Quel pays a inventé le hockey sur glace ?", choices: ["États-Unis", "Russie", "Canada", "Suède"], answer: 2, explanation: "Le hockey sur glace a été codifié au Canada à Montréal en 1875. La première partie organisée a eu lieu au Victoria Skating Rink." },
  { q: "Quel gardien de but québécois a remporté le plus de trophées Vézina ?", choices: ["Patrick Roy", "Martin Brodeur", "Ken Dryden", "Jacques Plante"], answer: 0, explanation: "Patrick Roy a remporté 4 trophées Vézina (1986, 1989, 1990, 1992) — un record. Il a aussi gagné 4 Coupes Stanley." },
  { q: "Le match des étoiles de la LNH 2026 a lieu dans quelle ville ?", choices: ["Montréal", "Toronto", "Las Vegas", "Los Angeles"], answer: 2, explanation: "Las Vegas est devenue une ville NHL majeure depuis l'expansion des Golden Knights en 2017, qui ont remporté la Coupe Stanley en 2023." },
  { q: "Quelle équipe de hockey a le plus de victoires consécutives en séries dans l'histoire LNH ?", choices: ["Canadiens de Montréal", "Oilers d'Edmonton", "Red Wings de Détroit", "Islanders de New York"], answer: 3, explanation: "Les Islanders de New York ont gagné 4 Coupes Stanley consécutives de 1980 à 1983 — une série de 19 victoires consécutives en séries." },

  // Football / Soccer
  { q: "Qui est le meilleur buteur de l'histoire de la Coupe du monde de soccer ?", choices: ["Ronaldo", "Pelé", "Miroslav Klose", "Gerd Müller"], answer: 2, explanation: "Miroslav Klose (Allemagne) détient le record avec 16 buts en Coupe du monde (1998-2014) — devant Ronaldo (15) et Pelé (12)." },
  { q: "Quel pays a remporté le plus de Coupes du monde FIFA ?", choices: ["Allemagne", "Brésil", "Argentine", "France"], answer: 1, explanation: "Le Brésil est la seule nation à avoir remporté 5 Coupes du monde (1958, 1962, 1970, 1994, 2002) et la seule à avoir participé à toutes les éditions." },
  { q: "Quel joueur a remporté le plus de Ballons d'Or ?", choices: ["Cristiano Ronaldo", "Zinédine Zidane", "Lionel Messi", "Ronaldo Nazário"], answer: 2, explanation: "Lionel Messi a remporté 8 Ballons d'Or (2009-2012, 2015, 2019, 2021, 2023) — un record absolu, suivi de Cristiano Ronaldo avec 5." },
  { q: "La LCF (Ligue canadienne de football) utilise combien de joueurs par équipe sur le terrain ?", choices: ["11", "12", "13", "10"], answer: 1, explanation: "Au football canadien, chaque équipe aligne 12 joueurs par côté (contre 11 au football américain NFL). Le terrain est aussi plus grand." },
  { q: "En quelle année le Canada a-t-il participé pour la première fois à une Coupe du monde FIFA ?", choices: ["1986", "1994", "2022", "2026"], answer: 0, explanation: "Le Canada a participé à sa seule Coupe du monde en 1986 au Mexique. Il est qualifié pour 2026 qui se joue en Amérique du Nord (Canada, USA, Mexique)." },

  // Basketball
  { q: "Quelle équipe NBA canadienne existe depuis 1995 ?", choices: ["Vancouver Grizzlies", "Toronto Raptors", "Montréal Canadians", "Ottawa Senators"], answer: 1, explanation: "Les Toronto Raptors, fondés en 1995, sont la seule franchise NBA hors États-Unis. Ils ont remporté leur unique titre en 2019 face aux Warriors." },
  { q: "Qui a inventé le basketball ?", choices: ["Michael Jordan", "James Naismith", "Larry Bird", "Magic Johnson"], answer: 1, explanation: "James Naismith, né à Almonte (Ontario), a inventé le basketball en 1891 à Springfield (Massachusetts) en accrochant un panier de pêches à un balcon." },
  { q: "Qui détient le record de points en carrière NBA ?", choices: ["Michael Jordan", "Kareem Abdul-Jabbar", "LeBron James", "Kobe Bryant"], answer: 2, explanation: "LeBron James a dépassé Kareem Abdul-Jabbar en 2023 avec plus de 38 387 points — le record absolu de points en carrière NBA." },
  { q: "Quel joueur canadien a été 1er choix au repêchage NBA 2019 ?", choices: ["Andrew Wiggins", "Jamal Murray", "Shai Gilgeous-Alexander", "Zion Williamson"], answer: 3, explanation: "Zion Williamson (né en Caroline du Sud) était le 1er choix en 2019. Le 1er Canadien 1er choix au repêchage était Andrew Wiggins en 2014 par Cleveland." },

  // Tennis
  { q: "Qui détient le record de titres en Grand Chelem (hommes) ?", choices: ["Roger Federer", "Rafael Nadal", "Novak Djokovic", "Pete Sampras"], answer: 2, explanation: "Novak Djokovic détient le record avec 24 titres du Grand Chelem (2024), devant Rafael Nadal (22) et Roger Federer (20)." },
  { q: "Quelle joueuse de tennis a remporté le plus de Grand Chelems (femmes) ?", choices: ["Steffi Graf", "Serena Williams", "Martina Navratilova", "Margaret Court"], answer: 3, explanation: "Margaret Court (Australie) détient le record avec 24 titres du Grand Chelem — suivie de Serena Williams (23) et Steffi Graf (22)." },
  { q: "Bianca Andreescu est originaire de quelle ville canadienne ?", choices: ["Toronto", "Mississauga", "Vancouver", "Ottawa"], answer: 1, explanation: "Bianca Andreescu est née à Mississauga, Ontario. En 2019, elle est devenue la première Canadienne à remporter un titre du Grand Chelem (US Open)." },

  // Olympiques
  { q: "Quel pays a gagné le plus de médailles d'or aux Jeux olympiques d'été de tous les temps ?", choices: ["URSS", "Chine", "États-Unis", "Grande-Bretagne"], answer: 2, explanation: "Les États-Unis dominent le tableau des médailles d'or olympiques avec plus de 1 000 médailles d'or depuis 1896." },
  { q: "Qui est l'athlète canadien avec le plus de médailles olympiques ?", choices: ["Clara Hughes", "Penny Oleksiak", "Donovan Bailey", "Alexandre Bilodeau"], answer: 1, explanation: "Penny Oleksiak (natation) est la Canadienne la plus médaillée de l'histoire olympique avec 7 médailles (6 olympiques)." },
  { q: "Quel sprinter canadien a remporté le 100m aux Jeux de Séoul 1988 ?", choices: ["Donovan Bailey", "Bruny Surin", "Ben Johnson", "Atlee Mahorn"], answer: 2, explanation: "Ben Johnson a franchi le 100m en 9,79 s à Séoul — mais a été disqualifié pour dopage. Sa médaille a été retirée, revenant à Carl Lewis." },
  { q: "Le Canada n'a jamais remporté de médaille d'or olympique sur son sol lors des Jeux d'été de 1976 (Montréal). Lors des Jeux d'hiver 2010 à Vancouver, combien de médailles d'or a-t-il remportées ?", choices: ["7", "14", "10", "3"], answer: 1, explanation: "En 2010 à Vancouver, le Canada a remporté 14 médailles d'or — un record pour un pays hôte aux Jeux d'hiver, dont l'or en hockey masculin et féminin." },

  // Sports extrêmes et divers
  { q: "Qu'est-ce que le Ironman Triathlon comprend ?", choices: ["Natation 2,4 km + vélo 90 km + course 21 km", "Natation 3,8 km + vélo 180 km + marathon 42 km", "Natation 1 km + vélo 40 km + course 10 km", "Natation 5 km + vélo 200 km + course 50 km"], answer: 1, explanation: "L'Ironman complet comprend 3,86 km de natation, 180 km de vélo et 42,2 km de course à pied (marathon) — à compléter en moins de 17 heures." },
  { q: "Dans quel sport utilise-t-on une raquette et un volant ?", choices: ["Squash", "Padel", "Badminton", "Racquetball"], answer: 2, explanation: "Le badminton utilise un volant (plumes ou plastique). C'est le sport de raquette le plus rapide — le volant peut dépasser 400 km/h en smash." },
  { q: "Quel pays a dominé le curling aux Jeux olympiques ?", choices: ["Suède", "Norvège", "Canada", "Écosse"], answer: 2, explanation: "Le Canada est la nation dominante du curling olympique avec 10 médailles d'or depuis 1998. Le curling a été fondé en Écosse au XVIe siècle." },
  { q: "Combien de joueurs composent une équipe de volleyball sur le terrain ?", choices: ["5", "6", "7", "8"], answer: 1, explanation: "Une équipe de volleyball compte 6 joueurs sur le terrain. Le libéro (défenseur spécialisé) porte un maillot différent et ne peut pas effectuer de smash." },
  { q: "Quel est le sport d'équipe le plus pratiqué au monde ?", choices: ["Basketball", "Cricket", "Football (soccer)", "Volleyball"], answer: 2, explanation: "Le football (soccer) est le sport le plus pratiqué au monde avec ~270 millions de joueurs et 4 milliards de fans — suivi du cricket et du basketball." },
  { q: "En boxe, quelle est la différence entre un KO et un KO technique ?", choices: ["Il n'y en a pas", "KO = l'adversaire tombe / TKO = l'arbitre arrête le combat", "KO = 10 secondes / TKO = 8 secondes", "KO = blessure / TKO = décision"], answer: 1, explanation: "Un KO survient quand l'adversaire tombe et ne se relève pas en 10 secondes. Un TKO (Technical Knockout) est décidé par l'arbitre quand un boxeur ne peut plus se défendre, même debout." },
  { q: "Qui a été surnommé 'La Grosse Punchline' ou 'The Greatest' en boxe ?", choices: ["Joe Frazier", "Mike Tyson", "Muhammad Ali", "Sugar Ray Leonard"], answer: 2, explanation: "Muhammad Ali (Cassius Clay) est considéré comme le plus grand boxeur de tous les temps — triple champion du monde poids lourd, connu pour son agilité et son charisme." },
  { q: "Le Super Bowl est la finale de quel sport ?", choices: ["Football canadien", "Football américain (NFL)", "Rugby", "Baseball"], answer: 1, explanation: "Le Super Bowl est la finale de la NFL (National Football League). C'est l'événement télévisé le plus regardé aux États-Unis, avec 100+ millions de téléspectateurs." },
  { q: "Quel athlète québécois est champion du monde en MMA ?", choices: ["Georges St-Pierre", "Rory MacDonald", "David Loiseau", "Alexis Davis"], answer: 0, explanation: "Georges St-Pierre (GSP), originaire de Saint-Isidore, Québec, est considéré comme l'un des meilleurs combattants MMA de tous les temps — double champion UFC (poids welter et moyen)." },

  // Hockey — approfondissement
  { q: "Quel numéro portait Maurice 'Rocket' Richard avec le Canadien de Montréal ?", choices: ["7", "9", "4", "12"], answer: 1, explanation: "Maurice Richard portait le numéro 9. Il a été le premier joueur à marquer 50 buts en 50 matchs (1944-45). Son numéro a été retiré par le Canadien en 1960." },
  { q: "Quelle ville accueille les Maple Leafs de Toronto ?", choices: ["Ottawa", "Hamilton", "Toronto", "Mississauga"], answer: 2, explanation: "Les Maple Leafs jouent au Scotiabank Arena à Toronto depuis 1999. Ils n'ont pas remporté la Coupe Stanley depuis 1967 — une disette qui dure depuis plus de 55 ans." },
  { q: "Combien de périodes y a-t-il dans un match de hockey régulier ?", choices: ["2", "3", "4", "5"], answer: 1, explanation: "Un match de hockey LNH comprend 3 périodes de 20 minutes chacune. En cas d'égalité après 60 minutes, on joue une prolongation de 5 minutes (3 contre 3), puis des tirs de barrage." },
  { q: "Quel gardien a réalisé le plus de blanchissages (shutouts) dans l'histoire LNH ?", choices: ["Patrick Roy", "Martin Brodeur", "Terry Sawchuk", "Ken Dryden"], answer: 1, explanation: "Martin Brodeur des Devils du New Jersey détient le record avec 125 blanchissages en carrière. Il a aussi le record de victoires (691) et de matchs joués (1 266) pour un gardien." },
  { q: "Le trophée Hart est remis au joueur le plus utile de la LNH. Qui l'a remporté le plus souvent ?", choices: ["Gordie Howe", "Mario Lemieux", "Sidney Crosby", "Wayne Gretzky"], answer: 3, explanation: "Wayne Gretzky a remporté le trophée Hart 9 fois (record absolu). Il domine presque tous les records offensifs de la LNH avec ses 2 857 points en carrière." },
  { q: "La rivalité Canadiens-Nordiques a pris fin en quelle année ?", choices: ["1992", "1995", "1998", "2000"], answer: 1, explanation: "Les Nordiques de Québec ont déménagé au Colorado en 1995, devenant les Avalanche. Ils ont remporté la Coupe Stanley dès 1996 avec Patrick Roy — ancienne vedette du Canadien." },

  // Soccer — approfondissement
  { q: "Dans quelle ville se trouve le stade Camp Nou, antre du FC Barcelone ?", choices: ["Madrid", "Séville", "Barcelone", "Bilbao"], answer: 2, explanation: "Le Camp Nou à Barcelone (Espagne) est le plus grand stade d'Europe avec 99 354 places. Le FC Barcelone y joue depuis 1957." },
  { q: "Quel pays a remporté la première Coupe du monde FIFA en 1930 ?", choices: ["Brésil", "Argentine", "Uruguay", "Italie"], answer: 2, explanation: "L'Uruguay a remporté la première Coupe du monde en 1930 chez lui à Montevideo. La finale opposait l'Uruguay à l'Argentine (4-2)." },
  { q: "Quel club de soccer a remporté le plus de titres de Ligue des Champions UEFA ?", choices: ["FC Barcelone", "Bayern Munich", "AC Milan", "Real Madrid"], answer: 3, explanation: "Le Real Madrid a remporté 15 Ligue des Champions / Coupes d'Europe (record absolu). Ils ont dominé les années 1950-60 (5 titres consécutifs) et les années 2016-2018 (3 titres)." },
  { q: "Pelé a remporté combien de Coupes du monde avec le Brésil ?", choices: ["1", "2", "3", "4"], answer: 2, explanation: "Pelé a remporté 3 Coupes du monde avec le Brésil : 1958 (à 17 ans, le plus jeune vainqueur), 1962 et 1970. Il est le seul joueur à avoir réalisé cet exploit." },

  // Baseball
  { q: "Quelle équipe canadienne de baseball a remporté la Série mondiale de la MLB ?", choices: ["Montréal Expos", "Toronto Blue Jays", "Vancouver Giants", "Calgary Stampeders"], answer: 1, explanation: "Les Toronto Blue Jays ont remporté la Série mondiale en 1992 et 1993 — les deux seules fois qu'une équipe non américaine a remporté ce titre. Les Expos de Montréal ont été dissous en 2004." },
  { q: "Combien de balles sont nécessaires pour un 'quatre buts sur balles' au baseball ?", choices: ["3", "4", "5", "6"], answer: 1, explanation: "Il faut 4 balles (lancers hors zone de frappe) pour obtenir un but sur balles (walk). Il faut 3 prises pour un retrait sur des prises (strikeout)." },
  { q: "Quel joueur de baseball détient le record de circuits (home runs) en carrière MLB ?", choices: ["Babe Ruth", "Barry Bonds", "Hank Aaron", "Willie Mays"], answer: 1, explanation: "Barry Bonds détient le record avec 762 circuits en carrière. Hank Aaron (755) et Babe Ruth (714) le suivent. Les records de Bonds sont toutefois entachés par des soupçons de dopage." },

  // Golf
  { q: "Quel golfeur canadien a remporté le plus de tournois du Grand Chelem ?", choices: ["Mike Weir", "Graham DeLaet", "Adam Hadwin", "Brooke Henderson"], answer: 0, explanation: "Mike Weir a remporté le Masters d'Augusta en 2003 — le seul Canadien masculin à avoir gagné un tournoi Majeur. Brooke Henderson est la meilleure golfeuse canadienne féminine avec 13 victoires LPGA." },
  { q: "Tiger Woods a remporté combien de tournois Majeurs au golf ?", choices: ["12", "15", "18", "21"], answer: 1, explanation: "Tiger Woods a remporté 15 Majeurs (record en activité) : 5 Masters, 3 US Open, 3 British Open, 4 PGA Championship. Le record absolu est de 18 (Jack Nicklaus)." },

  // Formule 1 et sports mécaniques
  { q: "Quel pilote canadien de F1 a remporté plusieurs Grands Prix dans les années 1970-80 ?", choices: ["Gilles Villeneuve", "Jacques Villeneuve", "Patrick Tambay", "Érik Comas"], answer: 0, explanation: "Gilles Villeneuve (père de Jacques), originaire de Berthierville, Québec, a remporté 6 Grands Prix F1 avant sa mort tragique en 1982. Son style flamboyant en a fait une légende." },
  { q: "Quel pilote détient le record du plus grand nombre de titres mondiaux en F1 ?", choices: ["Michael Schumacher", "Ayrton Senna", "Lewis Hamilton", "Sebastian Vettel"], answer: 2, explanation: "Lewis Hamilton détient le record avec 7 titres mondiaux de F1 (2008, 2014-2015, 2017-2020) — à égalité avec Michael Schumacher. Hamilton détient aussi le record de victoires (103+)." },

  // Ski et sports d'hiver
  { q: "Quel athlète canadien a remporté plusieurs médailles d'or en ski acrobatique aux Jeux olympiques ?", choices: ["Alexandre Bilodeau", "Jennifer Heil", "Jean-Luc Brassard", "Mikael Kingsbury"], answer: 0, explanation: "Alexandre Bilodeau a remporté l'or en bosses en 2010 (Vancouver) et 2014 (Sotchi) — premier Canadien à défendre son titre olympique. Mikael Kingsbury est le roi des bosses actuel (7 Coupes du monde)." },
  { q: "La descente de ski alpin la plus rapide au monde est la course de Kitzbühel. Quel surnom porte-t-elle ?", choices: ["Le Mur de Glace", "La Streif", "La Killer", "L'Inferno"], answer: 1, explanation: "La Streif de Kitzbühel (Autriche) est la descente la plus redoutée du circuit alpin — les skieurs atteignent 140 km/h sur des pentes à 85%. Elle se court depuis 1931." },

  // Natation et athlétisme
  { q: "Quel nageur a remporté le plus de médailles olympiques de l'histoire ?", choices: ["Ian Thorpe", "Mark Spitz", "Michael Phelps", "Ryan Lochte"], answer: 2, explanation: "Michael Phelps (USA) détient le record absolu avec 28 médailles olympiques (23 or, 3 argent, 2 bronze) entre 2000 et 2016 — le plus grand olympien de tous les temps." },
  { q: "Usain Bolt détient le record du monde du 100m. Quel est son temps ?", choices: ["9,58 s", "9,63 s", "9,69 s", "9,72 s"], answer: 0, explanation: "Usain Bolt (Jamaïque) a couru le 100m en 9,58 secondes aux Mondiaux de Berlin en 2009 — un record du monde qui tient depuis 15 ans. Il détient aussi le record du 200m (19,19 s)." },
  { q: "Quel marathon est le plus ancien et le plus prestigieux au monde ?", choices: ["New York", "Chicago", "Boston", "Tokyo"], answer: 2, explanation: "Le Marathon de Boston, couru depuis 1897, est le plus ancien marathon annuel au monde. Il fait partie des 6 Majeurs mondiaux avec New York, Chicago, Tokyo, Berlin et Londres." },

  // Sports québécois et canadiens
  { q: "Quel sport traditionnel des Premières Nations est l'ancêtre de la crosse moderne ?", choices: ["Le tewaaraton", "Le lacrosse birman", "Le baggataway", "Le shinny"], answer: 2, explanation: "Le baggataway (ou tewaaraton) était pratiqué par les peuples Haudenosaunee et Anishinaabe. Les Français l'ont renommé 'la crosse' au XVIIe siècle. C'est le sport national d'été du Canada." },
  { q: "Quel est le sport national d'été du Canada ?", choices: ["Le hockey", "La crosse", "Le baseball", "Le basketball"], answer: 1, explanation: "La crosse est le sport national d'été du Canada depuis 1994 (le hockey sur glace est le sport national d'hiver). Elle a été inventée par les peuples autochtones bien avant la colonisation." },
  { q: "Combien d'équipes composent la Ligue canadienne de football (LCF) ?", choices: ["8", "9", "10", "12"], answer: 1, explanation: "La LCF compte 9 équipes réparties en divisions Est (5) et Ouest (4). La grande finale s'appelle la Coupe Grey, nommée en l'honneur de Lord Albert Grey, gouverneur général du Canada." },

  // Hockey — encore plus
  { q: "Quel trophée est remis au meilleur buteur de la LNH chaque saison ?", choices: ["Trophée Art Ross", "Trophée Maurice Richard", "Trophée Hart", "Trophée Calder"], answer: 1, explanation: "Le trophée Maurice Richard honore le joueur ayant marqué le plus de buts en saison régulière. Auston Matthews (Maple Leafs) l'a remporté 4 fois consécutives (2020-2024)." },
  { q: "Quelle équipe LNH a été fondée en 1917 et est la plus ancienne en activité ?", choices: ["Toronto Maple Leafs", "Canadiens de Montréal", "Boston Bruins", "Detroit Red Wings"], answer: 1, explanation: "Les Canadiens de Montréal ont été fondés en 1909 (avant la LNH) et sont membres fondateurs de la LNH en 1917. Ils sont la plus ancienne franchise professionnelle de hockey encore en activité." },
  { q: "Combien de joueurs composent une équipe sur la glace en hockey (excluant le gardien) ?", choices: ["4", "5", "6", "7"], answer: 1, explanation: "En hockey LNH, 5 patineurs (2 défenseurs + 3 attaquants) plus 1 gardien = 6 joueurs par équipe sur la glace. En infériorité numérique, on peut jouer à 3 contre 5." },

  // Soccer — encore plus
  { q: "En quelle année le Canada a-t-il remporté l'or olympique en soccer féminin ?", choices: ["2012", "2016", "2020 (Tokyo)", "2024"], answer: 2, explanation: "L'équipe féminine canadienne a remporté l'or aux Jeux de Tokyo (2021) en battant la Suède aux tirs de barrage. Christine Sinclair est la capitaine et meilleure buteuse internationale de l'histoire (190 buts)." },
  { q: "Quel pays a accueilli la Coupe du monde 2022 ?", choices: ["Arabie Saoudite", "Émirats arabes unis", "Qatar", "Bahreïn"], answer: 2, explanation: "La Coupe du monde 2022 s'est tenue au Qatar — premier pays arabe à l'accueillir. L'Argentine de Messi a remporté le titre face à la France (3-3, 4-2 aux tirs de barrage)." },

  // Basketball — encore plus
  { q: "Combien de points vaut un panier à 3 points au basketball NBA ?", choices: ["2", "3", "4", "Dépend de la distance"], answer: 1, explanation: "Un tir derrière la ligne des 3 points (à 7,24 m en NBA) vaut 3 points. Un lancer franc vaut 1 point. La règle des 3 points a été introduite en NBA en 1979." },
  { q: "Quel joueur NBA est surnommé 'The Chef' pour sa précision au tir ?", choices: ["LeBron James", "Kevin Durant", "Stephen Curry", "James Harden"], answer: 2, explanation: "Stephen Curry des Golden State Warriors est surnommé 'Chef Curry' pour sa façon de 'cuisiner' ses adversaires. Il détient le record du plus grand nombre de tirs à 3 points en carrière NBA (3 700+)." },

  // Tennis — encore plus
  { q: "Quel est le seul Grand Chelem joué sur gazon ?", choices: ["Roland-Garros", "Wimbledon", "US Open", "Open d'Australie"], answer: 1, explanation: "Wimbledon (Londres) est le seul Grand Chelem disputé sur gazon naturel. Roland-Garros est sur terre battue. L'US Open et l'Open d'Australie sont sur surface dure." },
  { q: "Quel est le surnom de la surface sur laquelle Roland-Garros est joué ?", choices: ["L'argile", "La brique pilée (ocre)", "La terre rouge", "Le sable parisien"], answer: 1, explanation: "Roland-Garros est joué sur 'ocre' — de la brique pilée mélangée à du calcaire. Cette surface lente favorise les échanges longs et avantage les joueurs de fond de court comme Rafael Nadal (14 titres à Roland)." },

  // Cyclisme et endurance
  { q: "Quel événement sportif annuel traverse la France en juillet ?", choices: ["Le Giro d'Italia", "La Vuelta a España", "Le Tour de France", "Paris-Roubaix"], answer: 2, explanation: "Le Tour de France (fondé en 1903) est la plus grande course cycliste et l'un des plus grands événements sportifs annuels. Lance Armstrong a été dépossédé de ses 7 victoires (1999-2005) pour dopage." },
  { q: "Quel pays a remporté le plus de Tours de France ?", choices: ["Belgique", "Espagne", "France", "Italie"], answer: 0, explanation: "La Belgique a remporté le plus de Tours de France avec 18 victoires (Eddy Merckx seul en compte 5). La France suit avec 10 victoires. Tadej Pogačar (Slovénie) est le champion actuel." },

  // Natation
  { q: "Penny Oleksiak est la nageuse canadienne la plus médaillée. À quel âge a-t-elle remporté sa première médaille d'or olympique ?", choices: ["14 ans", "16 ans", "18 ans", "20 ans"], answer: 1, explanation: "Penny Oleksiak avait 16 ans aux Jeux de Rio 2016 quand elle a remporté l'or au 100m papillon ex aequo avec Simone Manuel — la plus jeune athlète canadienne à décrocher l'or olympique." },
];

const Q_ARTISTE: Question[] = [
  // Artistes québécois
  { q: "Quel chanteur québécois est connu pour 'Je reviendrai à Montréal' ?", choices: ["Robert Charlebois", "Félix Leclerc", "Gilles Vigneault", "Claude Dubois"], answer: 0, explanation: "Robert Charlebois a composé 'Je reviendrai à Montréal' en 1976 depuis Paris. Il est pionnier du rock québécois et de la fusion folk-rock." },
  { q: "Céline Dion est originaire de quelle ville ?", choices: ["Montréal", "Québec", "Charlemagne", "Laval"], answer: 2, explanation: "Céline Dion est née le 30 mars 1968 à Charlemagne, Québec — la dernière de 14 enfants. Elle a fait ses débuts à 12 ans avec 'Ce n'était qu'un rêve'." },
  { q: "Quel artiste québécois a composé 'Gens du pays' ?", choices: ["Claude Léveillée", "Félix Leclerc", "Gilles Vigneault", "Plume Latraverse"], answer: 2, explanation: "'Gens du pays' (1975) de Gilles Vigneault est considérée comme l'hymne national non officiel du Québec. Elle est chantée à chaque anniversaire." },
  { q: "Quel groupe québécois a popularisé le style 'Cowpunk' et 'Québécois excentrique' dans les années 2000 ?", choices: ["Les Cowboys Fringants", "Mes Aïeux", "La Patère Rose", "Malajube"], answer: 0, explanation: "Les Cowboys Fringants, originaires de Repentigny, ont révolutionné la musique québécoise avec leur mélange de punk-folk et leurs textes sociaux engagés." },
  { q: "Quel musicien québécois a fondé le Cirque du Soleil ?", choices: ["Robert Lepage", "Guy Laliberté", "Michel Rivard", "Daniel Bélanger"], answer: 1, explanation: "Guy Laliberté, accordéoniste et cracheur de feu de Baie-Saint-Paul, a co-fondé le Cirque du Soleil en 1984 — devenu le plus grand cirque contemporain au monde." },
  { q: "Ariane Moffatt est connue pour quel style musical ?", choices: ["Country", "Métal", "Pop électro", "Jazz classique"], answer: 2, explanation: "Ariane Moffatt mélange pop, électronique et soul. Son album 'Aquanaute' (2002) l'a révélée au grand public québécois. Elle chante en français et en anglais." },
  { q: "Quel groupe rock québécois a chanté 'Tellement j'ai d'amour' et 'Toune d'automne' ?", choices: ["Harmonium", "Offenbach", "Beau Dommage", "Octobre"], answer: 2, explanation: "Beau Dommage, formé en 1972 à Montréal, a marqué la chanson québécoise avec 'Le blues de la métropole', ' Tonys', 'Tellement j'ai d'amour' et leurs textes poétiques urbains." },

  // Artistes francophones internationaux
  { q: "Quel artiste français a chanté 'La Vie en rose' ?", choices: ["Jacques Brel", "Charles Aznavour", "Édith Piaf", "Georges Brassens"], answer: 2, explanation: "Édith Piaf a enregistré 'La Vie en rose' en 1946. Surnommée 'La Môme Piaf', elle est la chanteuse française la plus connue au monde." },
  { q: "Jacques Brel était originaire de quel pays ?", choices: ["France", "Suisse", "Canada", "Belgique"], answer: 3, explanation: "Jacques Brel (1929-1978) était Belge, né à Jette (Bruxelles). Mais c'est à Paris qu'il a fait carrière avec des chansons comme 'Ne me quitte pas', 'Amsterdam', 'La Quête'." },
  { q: "Quel artiste est connu pour 'Formidable', 'Papaoutai' et 'Alors on danse' ?", choices: ["Stromae", "Orelsan", "Jul", "Bigflo & Oli"], answer: 0, explanation: "Stromae (Paul Van Haver), artiste belge né en 1985, a révolutionné la chanson francophone avec son mélange de musique électronique et de textes profonds en français." },
  { q: "Quel groupe français est connu pour 'Daft Punk' ?", choices: ["C'est un groupe, pas un artiste solo", "Thomas Bangalter et Guy-Manuel de Homem-Christo", "Kavinsky et SebastiAn", "Justice et Mr. Oizo"], answer: 1, explanation: "Daft Punk était le duo Thomas Bangalter et Guy-Manuel de Homem-Christo, formé à Paris en 1993. Ils ont séparé en 2021 après 28 ans de carrière et 4 Grammys." },

  // Artistes internationaux
  { q: "Quel artiste est surnommé 'Le Roi du Pop' ?", choices: ["Elvis Presley", "Prince", "Michael Jackson", "David Bowie"], answer: 2, explanation: "Michael Jackson (1958-2009) est 'Le Roi du Pop' — Thriller (1982) reste l'album le plus vendu de l'histoire avec 66+ millions d'exemplaires." },
  { q: "Quel groupe britannique a vendu le plus d'albums dans l'histoire ?", choices: ["The Rolling Stones", "Led Zeppelin", "The Beatles", "Pink Floyd"], answer: 2, explanation: "The Beatles ont vendu entre 600 millions et 1 milliard d'albums depuis 1963 — le groupe le plus vendu de l'histoire, devant Elvis Presley." },
  { q: "Madonna est originaire de quel État américain ?", choices: ["New York", "Californie", "Michigan", "Texas"], answer: 2, explanation: "Madonna Louise Ciccone est née le 16 août 1958 à Bay City, Michigan. Elle est la femme artiste solo ayant vendu le plus d'albums dans l'histoire (300 millions+)." },
  { q: "Quel artiste a sorti l'album 'Thriller' en 1982 ?", choices: ["Prince", "Michael Jackson", "Lionel Richie", "Stevie Wonder"], answer: 1, explanation: "Thriller de Michael Jackson est sorti en novembre 1982. Avec 8 singles classés top 10 et le clip 'Thriller' de 14 minutes, il révolutionna la musique pop et le clip vidéo." },
  { q: "De quel pays est originaire BTS ?", choices: ["Japon", "Chine", "Corée du Sud", "Thaïlande"], answer: 2, explanation: "BTS (Bangtan Sonyeondan) est un groupe de K-pop sud-coréen formé en 2013 à Séoul par Big Hit Entertainment. Premier groupe asiatique à atteindre #1 aux Billboard 200." },
  { q: "Quel artiste a composé 'Bohemian Rhapsody' ?", choices: ["David Bowie", "Freddie Mercury", "Elton John", "Rod Stewart"], answer: 1, explanation: "Freddie Mercury, chanteur de Queen, a composé 'Bohemian Rhapsody' en 1975. Ce mélange de rock, opéra et ballad dure 5m55s — révolutionnaire pour l'époque." },
  { q: "Taylor Swift a vendu son catalogue musical à Scooter Braun. Qu'a-t-elle fait pour récupérer ses chansons ?", choices: ["Elle a fait un procès", "Elle a racheté les droits", "Elle a réenregistré tous ses anciens albums", "Elle a renoncé à ses chansons"], answer: 2, explanation: "Taylor Swift a commencé à réenregistrer ses 6 premiers albums sous le nom 'Taylor's Version' en 2021 pour reprendre le contrôle de son œuvre — une démarche sans précédent dans l'industrie musicale." },
  { q: "Qui est la première artiste à avoir plus d'1 milliard de streams Spotify en un mois ?", choices: ["Beyoncé", "Rihanna", "Taylor Swift", "Adele"], answer: 2, explanation: "Taylor Swift a atteint 1,2 milliard de streams sur Spotify en octobre 2023, après la sortie de '1989 (Taylor's Version)' — un record absolu." },
  { q: "Quel artiste canadien est connu pour 'Blinding Lights' et 'Save Your Tears' ?", choices: ["Drake", "Justin Bieber", "The Weeknd", "Shawn Mendes"], answer: 2, explanation: "The Weeknd (Abel Tesfaye), né à Toronto d'origine éthiopienne, est l'un des artistes les plus streamés de l'histoire. 'Blinding Lights' est la chanson la plus streamée Spotify de tous les temps." },
  { q: "Drake est originaire de quelle ville ?", choices: ["Ottawa", "Mississauga", "Toronto", "Brampton"], answer: 2, explanation: "Aubrey Drake Graham est né le 24 octobre 1986 à Toronto, Ontario. Il est l'artiste le plus streamé de l'histoire Spotify et a transformé Toronto en capitale mondiale du rap." },
  { q: "Quel duo canadien a popularisé le terme 'Indie rock' avec l'album 'Funeral' en 2004 ?", choices: ["Arcade Fire", "Wolf Parade", "Broken Social Scene", "The National"], answer: 0, explanation: "Arcade Fire, formé à Montréal (Win Butler, Régine Chassagne et collaborateurs), a révolutionné l'indie rock avec 'Funeral' (2004) — premier groupe indie à gagner le Grammy Album de l'Année (2011)." },
  { q: "Quel artiste québécois est connu pour ses chansons 'Quand le soleil dit bonjour aux montagnes' et pour avoir fondé la chanson québécoise moderne ?", choices: ["Gilles Vigneault", "Félix Leclerc", "Raymond Lévesque", "Claude Gauthier"], answer: 1, explanation: "Félix Leclerc (1914-1988) est le père de la chanson québécoise. 'Moi, mes souliers', 'Le P'tit Bonheur' et 'Bozo' ont ouvert la voie à toute la chanson francophone d'Amérique." },
  { q: "Eminem est originaire de quelle ville américaine ?", choices: ["Chicago", "Detroit", "New York", "Los Angeles"], answer: 1, explanation: "Marshall Mathers (Eminem) est né à Saint-Joseph, Missouri, mais a grandi dans les quartiers défavorisés de Detroit. Il est le rappeur solo ayant vendu le plus d'albums au monde." },
  { q: "Quel artiste a été surnommé 'The Voice' par Frank Sinatra ?", choices: ["Tony Bennett", "Dean Martin", "Elvis Presley", "Frank Sinatra lui-même"], answer: 0, explanation: "Frank Sinatra a surnommé Tony Bennett 'The Voice' — le vrai. Tony Bennett (1926-2023) a vendu plus de 50 millions d'albums et a sorti un album avec Lady Gaga à 90 ans." },

  // Musique québécoise — encore plus
  { q: "Quel groupe québécois est connu pour 'La Chambre' et un style rock alternatif très apprécié ?", choices: ["Simple Plan", "The Stills", "Malajube", "Dear Criminals"], answer: 0, explanation: "Simple Plan est un groupe de pop-punk montréalais formé en 1999 ('I'm Just a Kid', 'Welcome to My Life'). Malajube est un groupe de rock alternatif québécois indie très influent." },
  { q: "Quelle émission de télé-réalité musicale québécoise a lancé des dizaines d'artistes depuis 2003 ?", choices: ["Popstars", "Star Académie", "Occupation Double", "La Voix"], answer: 1, explanation: "Star Académie (TVA, depuis 2003) a lancé des artistes comme Marie-Mai, Wilfred LeBouthillier, Corneille et des dizaines d'autres. La Voix (TVA, depuis 2013) est la version québécoise de The Voice." },
  { q: "Charlotte Cardin est connue pour quel style musical ?", choices: ["Country pop", "Jazz traditionnel", "Pop alternative et soul", "Électro hardcore"], answer: 2, explanation: "Charlotte Cardin, originaire de Montréal, mélange pop alternative, soul et électronique. Son album 'Phoenix' (2021) a balayé le Gala de l'ADISQ avec 7 prix — un record." },
  { q: "Quel label québécois a lancé des artistes comme Hubert Lenoir et Safia Nolin ?", choices: ["Audiogramme", "Grosse Boîte", "Secret City Records", "Indica"], answer: 1, explanation: "Grosse Boîte (fondée en 2010) est un label indépendant québécois qui a signé Hubert Lenoir, Safia Nolin et d'autres artistes de la nouvelle scène indie québécoise." },
  { q: "Quel artiste québécois a representé le Canada à Eurovision 2023 ?", choices: ["Le Canada ne participe pas à l'Eurovision", "Cœur de pirate", "Klô Pelgag", "Patrick Watson"], answer: 0, explanation: "Le Canada ne participe pas à l'Eurovision Song Contest, réservé aux pays membres de l'Union européenne de radio-télévision (UER). Cœur de pirate représente parfois la scène québécoise en Europe." },

  // Artistes internationaux — encore plus
  { q: "Quel groupe de rock britannique est connu pour 'Stairway to Heaven' et 'Whole Lotta Love' ?", choices: ["The Who", "Deep Purple", "Black Sabbath", "Led Zeppelin"], answer: 3, explanation: "Led Zeppelin (Page, Plant, Jones, Bonham) est formé à Londres en 1968. 'Stairway to Heaven' (1971) est souvent citée comme la plus grande chanson rock de l'histoire. Ils ont vendu 300M+ d'albums." },
  { q: "Quel rappeur canadien est connu pour 'God's Plan' et est l'artiste le plus streamé de l'histoire Spotify ?", choices: ["The Weeknd", "Drake", "Tory Lanez", "NAV"], answer: 1, explanation: "Drake (Aubrey Graham, Toronto) a été l'artiste le plus streamé sur Spotify plusieurs années. 'God's Plan' (2018) a été #1 dans plus de 10 pays. Il a aussi un album avec 'Certified Lover Boy' et 'Honestly, Nevermind'." },
  { q: "Quel artiste a sorti 'Despacito' — la chanson la plus vue de l'histoire YouTube pendant plusieurs années ?", choices: ["Maluma", "J Balvin", "Luis Fonsi ft. Daddy Yankee", "Bad Bunny"], answer: 2, explanation: "'Despacito' de Luis Fonsi et Daddy Yankee (2017) a été la première chanson à dépasser 4, puis 5, puis 7 milliards de vues sur YouTube. La version remix avec Justin Bieber a amplifié son succès mondial." },
  { q: "De quel pays est originaire la chanteuse Shakira ?", choices: ["Venezuela", "Mexique", "Colombie", "Espagne"], answer: 2, explanation: "Shakira Isabel Mebarak Ripoll est née le 2 février 1977 à Barranquilla, Colombie. Elle chante en espagnol, anglais, portugais et arabe et a vendu plus de 80 millions d'albums dans le monde." },
  { q: "Quel artiste est connu pour 'Shape of You', 'Perfect' et 'Bad Habits' ?", choices: ["Sam Smith", "Charlie Puth", "Ed Sheeran", "Shawn Mendes"], answer: 2, explanation: "Ed Sheeran (Suffolk, Angleterre) est l'un des artistes solos les plus vendus de l'histoire avec 150M+ albums. 'Shape of You' a été la chanson la plus streamée sur Spotify pendant plusieurs années." },
  { q: "Quel artiste a vendu le plus d'albums de tous les temps toutes catégories confondues ?", choices: ["The Beatles", "Michael Jackson", "Elvis Presley", "Madonna"], answer: 1, explanation: "Michael Jackson est généralement cité comme l'artiste solo ayant le plus vendu (400M+ albums). Les Beatles restent le groupe le plus vendu. Les estimations varient selon les sources et les années." },

  // Artistes francophones — encore plus
  { q: "Quel artiste français a chanté 'Mistral Gagnant' et 'Peur de rien' ?", choices: ["Francis Cabrel", "Renaud", "Jean-Jacques Goldman", "Alain Bashung"], answer: 1, explanation: "Renaud Séchan ('Renaud') est une figure majeure du rock et de la chanson française engagée — 'Mistral Gagnant' (1985), 'Laisse béton', 'Manhattan Kaboul'. Il est aussi connu pour ses textes politiques." },
  { q: "Jean-Jacques Goldman est l'auteur-compositeur de dizaines de chansons pour :", choices: ["Patricia Kaas", "Céline Dion", "Mireille Mathieu", "Nolwenn Leroy"], answer: 1, explanation: "Jean-Jacques Goldman a écrit et composé des dizaines de succès pour Céline Dion ('Je dance dans ma tête', 'Pour que tu m'aimes encore', 'S'il suffisait d'aimer'). Il a aussi fondé Les Enfoirés en 1989." },

  // Artistes québécois — approfondissement
  { q: "Quel groupe québécois est connu pour 'Ordinaire', 'Lindberg' et le show rock des années 70 ?", choices: ["Offenbach", "Harmonium", "Corbeau", "Maneige"], answer: 0, explanation: "Offenbach, formé à Montréal en 1969, est le groupe de rock québécois le plus iconique des années 70. 'Câline de blues', 'Faudrait pas lâcher' et 'Ayoye' restent des classiques." },
  { q: "Quel artiste québécois a chanté 'Le monde est stone' et représenté le Québec à l'Eurovision ?", choices: ["Marie Carmen", "Diane Tell", "Fabienne Thibeault", "Ginette Reno"], answer: 2, explanation: "Fabienne Thibeault a chanté 'Le monde est stone' dans la comédie musicale Starmania (1978) d'Luc Plamondon et Michel Berger. Elle a représenté la Suisse à l'Eurovision 1988." },
  { q: "Qui a écrit les paroles de la comédie musicale Starmania ?", choices: ["Michel Berger", "Luc Plamondon", "Robert Charlebois", "Gilles Vigneault"], answer: 1, explanation: "Luc Plamondon (parolier québécois) a écrit les textes de Starmania (1978) et de Notre-Dame de Paris (1998). Michel Berger a composé la musique. C'est le show québécois le plus joué dans le monde francophone." },
  { q: "Quel chanteur québécois est connu pour 'Tout simplement jaloux' et 'Reste' ?", choices: ["Mario Pelchat", "Marc Dupré", "Bruno Pelletier", "Garou"], answer: 1, explanation: "Marc Dupré, originaire de Québec, est connu pour ses ballades romantiques populaires au Québec. Il est aussi juge à l'émission La Voix (version québécoise de The Voice)." },
  { q: "Quel artiste québécois a joué Quasimodo dans Notre-Dame de Paris ?", choices: ["Garou", "Bruno Pelletier", "Patrick Fiori", "Luc Plamondon"], answer: 0, explanation: "Garou (Pierre Garand), chanteur québécois né à Sherbrooke, a incarné Quasimodo dans la première de Notre-Dame de Paris à Paris en 1998. Sa chanson 'Belle' est devenue un classique." },
  { q: "Quel groupe québécois a popularisé le rap francophone avec des albums comme 'La force de comprendre' ?", choices: ["Muzion", "Sans Pression", "Loco Locass", "Alaclair Ensemble"], answer: 2, explanation: "Loco Locass, formé à Montréal en 1995, a révolutionné le rap québécois avec des textes engagés sur la langue française, l'identité et la politique. Leur chanson 'Libérez-nous des libéraux' est culte." },
  { q: "Klô Pelgag est connue pour quel style particulier ?", choices: ["Métal progressif", "Pop baroque et surréaliste", "Country folk", "Électro techno"], answer: 1, explanation: "Klô Pelgag (Chloé Pelletier-Gagnon) crée une pop baroque, poétique et surréaliste, souvent avec orchestre. Son album 'Notre-Dame-des-Sept-Douleurs' (2019) a remporté le Félix de l'Album de l'année au Québec." },
  { q: "Quel duo québécois compose la paire derrière les chansons 'Grandir' et 'La nature des choses' ?", choices: ["Cœur de pirate et Peter Peter", "Hubert Lenoir et Charlotte Cardin", "Les Sœurs Boulay", "Tire le coyote et Fanny Bloom"], answer: 2, explanation: "Les Sœurs Boulay (Mélanie et Stéphanie Boulay) sont un duo folk-pop de Rimouski. Leur album 'Le poids des confettis' (2013) a été un immense succès au Québec." },
  { q: "Cœur de pirate est le nom de scène de quelle artiste québécoise ?", choices: ["Ariane Moffatt", "Charlotte Cardin", "Béatrice Martin", "Marie-Mai"], answer: 2, explanation: "Béatrice Martin, alias Cœur de pirate, est une pianiste-compositrice-interprète de Montréal. Son premier album éponyme (2008) l'a révélée au Québec et en France avec 'Comme des enfants'." },
  { q: "Quel artiste québécois chante en français et en créole et est originaire d'Haïti ?", choices: ["Luck Mervil", "Corneille", "Dany Laferrière", "Kaïn"], answer: 0, explanation: "Luck Mervil, né en Haïti et établi au Québec, mélange r&b, soul et créole. Il est aussi acteur et personnage culte de la téléréalité musicale québécoise." },

  // Artistes francophones — approfondissement
  { q: "Quel chanteur français est surnommé 'Le Grand Jacques' ?", choices: ["Jacques Dutronc", "Jacques Higelin", "Jacques Brel", "Jacques Becker"], answer: 2, explanation: "Jacques Brel est surnommé 'Le Grand Jacques' pour sa stature artistique et sa voix puissante. Né à Bruxelles, il est l'un des plus grands paroliers de la chanson française." },
  { q: "Quel artiste français est connu pour 'Je veux' et 'Reste' et a explosé en popularité vers 2011 ?", choices: ["Zaz", "Vianney", "Christophe Maé", "Julien Clerc"], answer: 0, explanation: "Zaz (Isabelle Geffroy) a explosé avec 'Je veux' en 2010. Son style jazz-manouche et sa voix puissante lui ont valu un succès mondial, notamment au Japon et en Allemagne." },
  { q: "Quel groupe franco-britannique a popularisé le titre 'Around the World' et 'Get Lucky' ?", choices: ["Justice", "Phoenix", "Daft Punk", "Modjo"], answer: 2, explanation: "Daft Punk a sorti 'Around the World' en 1997 et 'Get Lucky' (avec Pharrell Williams) en 2013. Leur casques de robots sont l'un des looks les plus iconiques de la musique électronique mondiale." },
  { q: "Quel artiste africain francophone est connu pour 'Kumba' et 'Africa' et mélange afropop et rap ?", choices: ["Aya Nakamura", "Fally Ipupa", "Youssou N'Dour", "Burna Boy"], answer: 1, explanation: "Fally Ipupa, originaire de la RD Congo, est l'un des artistes africains francophones les plus écoutés dans le monde. Son style rumba congolaise-pop est unique." },
  { q: "Aya Nakamura est l'artiste francophone la plus écoutée dans le monde. De quel pays ses parents sont-ils originaires ?", choices: ["Maroc", "Mali", "Sénégal", "Côte d'Ivoire"], answer: 1, explanation: "Aya Nakamura (née Aya Danioko) est d'origine malienne, née à Bamako et élevée à Aulnay-sous-Bois (France). 'Djadja' (2018) est le clip francophone le plus vu sur YouTube avec 800M+ vues." },

  // Artistes internationaux — approfondissement
  { q: "Elvis Presley est surnommé 'Le Roi'. De quel État américain est-il originaire ?", choices: ["Tennessee", "Mississippi", "Texas", "Alabama"], answer: 1, explanation: "Elvis Aaron Presley est né le 8 janvier 1935 à Tupelo, Mississippi. Il a grandi à Memphis, Tennessee, où il a enregistré ses premiers disques chez Sun Records en 1954." },
  { q: "Quel groupe irlandais est connu pour 'With or Without You', 'One' et 'Beautiful Day' ?", choices: ["Coldplay", "The Cure", "U2", "Radiohead"], answer: 2, explanation: "U2 (Bono, The Edge, Adam Clayton, Larry Mullen Jr.) est formé à Dublin en 1976. Ils sont l'un des groupes ayant vendu le plus d'albums au monde (170M+) avec 22 Grammy Awards." },
  { q: "Quel artiste a sorti l'album 'Purple Rain' en 1984 ?", choices: ["Michael Jackson", "David Bowie", "Prince", "Stevie Wonder"], answer: 2, explanation: "Prince Rogers Nelson a sorti 'Purple Rain' en 1984 — bande originale de son film du même nom. L'album a remporté 2 Oscars et est considéré comme l'un des meilleurs albums de l'histoire." },
  { q: "Adele est connue pour ses ruptures amoureuses en chansons. De quel pays est-elle originaire ?", choices: ["Australie", "Canada", "États-Unis", "Grande-Bretagne"], answer: 3, explanation: "Adele Laurie Blue Adkins est née en 1988 à Tottenham, Londres. Ses albums '21', '25' et '30' ont battu des records de ventes mondiaux. '21' reste l'album le plus vendu de la décennie 2010." },
  { q: "Quel groupe américain a chanté 'Smells Like Teen Spirit' et symbolise le mouvement grunge ?", choices: ["Pearl Jam", "Soundgarden", "Nirvana", "Alice in Chains"], answer: 2, explanation: "Nirvana (Kurt Cobain, Krist Novoselic, Dave Grohl) a sorti 'Nevermind' en 1991 avec 'Smells Like Teen Spirit'. Le mouvement grunge de Seattle a mis fin à la domination du hair metal dans les années 90." },
  { q: "Quel artiste brésilien est connu comme le père de la Bossa Nova ?", choices: ["Caetano Veloso", "Gilberto Gil", "João Gilberto", "Tom Jobim"], answer: 3, explanation: "Antônio Carlos Jobim (Tom Jobim) est le compositeur emblématique de la Bossa Nova avec 'The Girl from Ipanema' et 'Garota de Ipanema' (1962). João Gilberto en est le chanteur fondateur." },
  { q: "Quel rappeur américain est connu pour 'HUMBLE.', 'DNA' et l'album 'DAMN.' ?", choices: ["J. Cole", "Kendrick Lamar", "Travis Scott", "Lil Wayne"], answer: 1, explanation: "Kendrick Lamar est le premier rappeur à remporter le Prix Pulitzer de musique (2018) pour 'DAMN.'. Il est aussi connu pour sa rivalité avec Drake en 2024 et sa chanson 'Not Like Us'." },
  { q: "Quel chanteur islandais est connu pour son style unique et ses vidéoclips surréalistes (ex: 'Army of Me') ?", choices: ["Of Monsters and Men", "Sigur Rós", "Björk", "Ásgeir"], answer: 2, explanation: "Björk (Björk Guðmundsdóttir) est une artiste islandaise inclassable, mêlant électronique, opéra, pop et sons naturels. Elle a joué dans le film 'Dancer in the Dark' de Lars von Trier (Palme d'Or Cannes 2000)." },
  { q: "Quel artiste est derrière le pseudonyme 'Gainsbourg' et la chanson scandaleuse 'Je t'aime... moi non plus' ?", choices: ["Jacques Dutronc", "Michel Polnareff", "Serge Gainsbourg", "Alain Bashung"], answer: 2, explanation: "Serge Gainsbourg (Lucien Ginsburg, 1928-1991) a chanté 'Je t'aime... moi non plus' avec Jane Birkin en 1969 — chanson bannie par le Vatican et de nombreuses radios pour son caractère érotique." },
];

const Q_ACTEUR: Question[] = [
  // Acteurs québécois et canadiens
  { q: "Quel acteur québécois joue dans les films 'Mommy' et 'J.C. an Américain' ?", choices: ["Roy Dupuis", "Antoine Bertrand", "Patrick Huard", "Antoine-Olivier Pilon"], answer: 3, explanation: "Antoine-Olivier Pilon est révélé dans 'Mommy' de Xavier Dolan (2014). Xavier Dolan lui-même est un réalisateur et acteur québécois primé à Cannes dès l'âge de 19 ans." },
  { q: "Ryan Gosling est originaire de quelle province canadienne ?", choices: ["Ontario", "Colombie-Britannique", "Alberta", "Québec"], answer: 0, explanation: "Ryan Gosling est né le 12 novembre 1980 à London, Ontario. Il est connu pour 'La La Land', 'Drive', 'Barbie' (Ken) et 'The Notebook'." },
  { q: "Quel acteur canadien a joué Wolverine dans les films X-Men ?", choices: ["Ryan Reynolds", "Hugh Jackman", "Keanu Reeves", "Jim Carrey"], answer: 1, explanation: "Hugh Jackman est Australien, pas Canadien — mais il a joué Wolverine (originaire du Canada dans les comics) dans 9 films X-Men depuis 2000." },
  { q: "Jim Carrey est né dans quelle ville canadienne ?", choices: ["Toronto", "Vancouver", "Newmarket (Ontario)", "Hamilton"], answer: 2, explanation: "Jim Carrey est né le 17 janvier 1962 à Newmarket, Ontario. Il a grandi dans une famille ouvrière et a commencé comme imitateur avant de percer à Hollywood." },
  { q: "Ryan Reynolds est connu pour jouer quel super-héros ?", choices: ["Green Lantern et Deadpool", "Deadpool uniquement", "Captain America", "Iron Fist"], answer: 0, explanation: "Ryan Reynolds a joué Green Lantern (2011) — un flop — et Deadpool depuis 2016, qu'il a co-produit et qui est devenu un succès massif. Il a aussi fondé Aviation Gin et Mint Mobile." },
  { q: "Keanu Reeves est né à Beyrouth mais a grandi dans quelle ville canadienne ?", choices: ["Vancouver", "Toronto", "Ottawa", "Calgary"], answer: 1, explanation: "Keanu Reeves a grandi à Toronto, Ontario. Connu pour 'Matrix', 'Speed', 'John Wick' et son image de gentillesse légendaire sur les réseaux sociaux." },

  // Acteurs hollywoodiens — classiques
  { q: "Quel acteur a joué dans 'Schindler's List', 'Forrest Gump' et 'Cast Away' ?", choices: ["Tom Hanks", "Tom Cruise", "Kevin Costner", "Dustin Hoffman"], answer: 0, explanation: "Tom Hanks a remporté 2 Oscars consécutifs pour 'Philadelphia' (1994) et 'Forrest Gump' (1995) — le seul acteur avec Spencer Tracy à avoir réussi cet exploit." },
  { q: "Quel acteur a joué 'The Joker' et a reçu un Oscar posthume ?", choices: ["Jared Leto", "Joaquin Phoenix", "Heath Ledger", "Jack Nicholson"], answer: 2, explanation: "Heath Ledger a reçu l'Oscar du meilleur second rôle posthumément en 2009 pour son Joker dans 'The Dark Knight'. Il est décédé en janvier 2008 d'une overdose accidentelle de médicaments." },
  { q: "Quelle actrice est connue pour 'Meryl Streep' et a remporté le plus d'Oscars ?", choices: ["Cate Blanchett", "Meryl Streep", "Katharine Hepburn", "Frances McDormand"], answer: 2, explanation: "Katharine Hepburn détient le record avec 4 Oscars de la meilleure actrice (1933, 1967, 1968, 1981). Meryl Streep en a 3 et reste la plus nominée avec 21 nominations." },
  { q: "Quel acteur a joué Tony Stark (Iron Man) dans le MCU ?", choices: ["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"], answer: 2, explanation: "Robert Downey Jr. a joué Tony Stark/Iron Man dans 10 films MCU (2008-2019). Son retour dans 'Avengers: Endgame' est l'une des performances les plus acclamées du MCU." },
  { q: "Dans quel film Leonardo DiCaprio a-t-il enfin remporté son premier Oscar ?", choices: ["Titanic", "The Aviator", "Inception", "The Revenant"], answer: 3, explanation: "Leonardo DiCaprio a remporté son premier Oscar (acteur principal) pour 'The Revenant' (2016) — après 4 nominations infructueuses depuis 1994. Sa quête de l'Oscar est devenue un mème culturel." },
  { q: "Quel acteur a joué dans 'Avatar', 'Terminator 2' et 'Aliens' ?", choices: ["Arnold Schwarzenegger", "Sylvester Stallone", "Bruce Willis", "Steven Seagal"], answer: 0, explanation: "Arnold Schwarzenegger a joué dans 'Terminator' (1984), 'Predator' (1987), 'Total Recall' (1990) et est devenu gouverneur de Californie (2003-2011)." },
  { q: "Natalie Portman est née dans quel pays ?", choices: ["États-Unis", "Israël", "France", "Grande-Bretagne"], answer: 1, explanation: "Natalie Portman (née Neta-Lee Hershlag) est née à Jérusalem, Israël, en 1981. Elle a déménagé aux États-Unis à 3 ans. Elle a remporté l'Oscar pour 'Black Swan' (2011)." },
  { q: "Quel acteur joue 'John Wick' ?", choices: ["Tom Hardy", "Jason Statham", "Keanu Reeves", "Vin Diesel"], answer: 2, explanation: "Keanu Reeves joue John Wick depuis 2014. La franchise est devenue un phénomène mondial pour ses chorégraphies d'action spectaculaires (technique 'Gun-Fu')." },

  // Actrices
  { q: "Quelle actrice a joué Katniss Everdeen dans 'Hunger Games' ?", choices: ["Shailene Woodley", "Emma Watson", "Jennifer Lawrence", "Chloe Grace Moretz"], answer: 2, explanation: "Jennifer Lawrence a joué Katniss dans les 4 films Hunger Games (2012-2015). Elle est la plus jeune actrice à remporter l'Oscar pour 'Silver Linings Playbook' (2013) à 22 ans." },
  { q: "Quelle actrice québécoise a joué dans 'Incendies' de Denis Villeneuve ?", choices: ["Guylaine Tremblay", "Lubna Azabal", "Sophie Lorain", "Anne Dorval"], answer: 1, explanation: "Lubna Azabal (actrice belge d'origine marocaine) a joué Nawal Marwan dans 'Incendies' (2010) de Denis Villeneuve — nominé aux Oscars pour le meilleur film en langue étrangère." },
  { q: "Quel rôle Cate Blanchett a-t-elle joué dans 'Le Seigneur des anneaux' ?", choices: ["Arwen", "Galadriel", "Éowyn", "Rosie"], answer: 1, explanation: "Cate Blanchett incarne Galadriel, la dame elfe de Lothlórien. Elle a joué ce rôle dans les 3 films du Seigneur des anneaux ET dans la trilogie Hobbit — 6 films en tout." },
  { q: "Quelle actrice a joué Hermione Granger dans Harry Potter ?", choices: ["Keira Knightley", "Emma Watson", "Natalie Portman", "Amanda Seyfried"], answer: 1, explanation: "Emma Watson a joué Hermione Granger dans les 8 films Harry Potter (2001-2011), de ses 9 à ses 21 ans. Elle est aussi militante féministe et ambassadrice ONU-Femmes." },

  // Réalisateurs et cinéma
  { q: "Denis Villeneuve est un réalisateur originaire de quelle ville québécoise ?", choices: ["Montréal", "Québec", "Gentilly", "Sherbrooke"], answer: 2, explanation: "Denis Villeneuve est né en 1967 à Gentilly, Québec. Il a réalisé 'Incendies', 'Prisoners', 'Arrival', 'Blade Runner 2049' et 'Dune' (2021-2024) — l'un des plus grands réalisateurs actuels." },
  { q: "Xavier Dolan a présenté son premier film à Cannes à quel âge ?", choices: ["19 ans", "21 ans", "24 ans", "17 ans"], answer: 0, explanation: "Xavier Dolan a réalisé et joué dans 'J'ai tué ma mère' en 2009 à seulement 19 ans, présenté à la Quinzaine des cinéastes à Cannes. Il en est aussi le coscénariste et producteur." },
  { q: "Quel film canadien a remporté la Palme d'Or à Cannes ?", choices: ["Incendies", "Atanarjuat", "Mon oncle Antoine", "Les invasions barbares"], answer: 3, explanation: "'Les invasions barbares' de Denys Arcand a remporté l'Oscar du meilleur film étranger en 2004 (pas la Palme d'Or). La Palme canadienne la plus récente est 'Mommy' de Xavier Dolan (Prix du Jury, 2014)." },
  { q: "Qui a réalisé la trilogie 'The Dark Knight' avec Christian Bale ?", choices: ["Zack Snyder", "Tim Burton", "Christopher Nolan", "Joel Schumacher"], answer: 2, explanation: "Christopher Nolan a réalisé 'Batman Begins' (2005), 'The Dark Knight' (2008) et 'The Dark Knight Rises' (2012). 'The Dark Knight' est considéré comme le meilleur film de super-héros de l'histoire." },
  { q: "Quel acteur a joué Forrest Gump ?", choices: ["Tom Hanks", "Kevin Costner", "Mel Gibson", "John Travolta"], answer: 0, explanation: "Tom Hanks a joué Forrest Gump en 1994, réalisé par Robert Zemeckis. Le film a remporté 6 Oscars dont Meilleur film, Meilleur réalisateur et Meilleur acteur pour Hanks." },
  { q: "Quelle actrice a joué dans 'Monster' et a remporté l'Oscar en se transformant physiquement ?", choices: ["Charlize Theron", "Nicole Kidman", "Hilary Swank", "Cate Blanchett"], answer: 0, explanation: "Charlize Theron a pris 15 kg et s'est transformée méconnaissablement pour jouer la tueuse en série Aileen Wuornos dans 'Monster' (2003) — Oscar de la meilleure actrice." },
  { q: "Quel acteur est connu pour jouer James Bond le plus longtemps ?", choices: ["Sean Connery", "Roger Moore", "Daniel Craig", "Pierce Brosnan"], answer: 1, explanation: "Roger Moore a joué James Bond dans 7 films de 1973 à 1985 (12 ans) — le plus longtemps. Sean Connery a joué Bond dans 6 films (1962-1967 + 1971)." },
  { q: "Dans quel film Joaquin Phoenix joue-t-il un musicien en déclin ?", choices: ["Walk the Line", "Her", "The Master", "Joker"], answer: 0, explanation: "Joaquin Phoenix joue Johnny Cash dans 'Walk the Line' (2005), apprenant à jouer et à chanter en 1 an. Il a été nominé à l'Oscar mais ne l'a pas remporté — le prix est allé à Philip Seymour Hoffman." },

  // Acteurs québécois — approfondissement
  { q: "Quel acteur québécois est connu pour son rôle dans la série 'Les Boys' ?", choices: ["Marc Messier", "Patrick Huard", "Rémy Girard", "Michel Côté"], answer: 2, explanation: "Rémy Girard joue Stan, le gérant de l'équipe de hockey dans 'Les Boys' (1997). La franchise de films Les Boys est l'une des plus populaires de l'histoire du cinéma québécois." },
  { q: "Quel acteur québécois a joué dans les films 'C.R.A.Z.Y.' et 'Les Invasions barbares' ?", choices: ["Alexis Martin", "Marc-André Grondin", "Pierre Curzi", "Yves Jacques"], answer: 1, explanation: "Marc-André Grondin joue Zac dans 'C.R.A.Z.Y.' (2005) de Jean-Marc Vallée — l'un des films québécois les plus acclamés. Il a aussi joué dans des productions hollywoodiennes." },
  { q: "Quel réalisateur québécois a dirigé 'Dallas Buyers Club' et 'Wild' à Hollywood ?", choices: ["Philippe Falardeau", "Jean-Marc Vallée", "Xavier Dolan", "Denis Villeneuve"], answer: 1, explanation: "Jean-Marc Vallée a réalisé 'C.R.A.Z.Y.' au Québec, puis 'Dallas Buyers Club' (2013), 'Wild' (2014) et les séries 'Big Little Lies' et 'Sharp Objects' à Hollywood avant sa mort en 2021." },
  { q: "Roy Dupuis est connu pour quel grand rôle dans la télésérie québécoise ?", choices: ["Félix Leclerc dans 'Félix'", "Maurice Richard dans 'Le Rocket'", "Louis Riel dans 'Riel'", "Ovide Plouffe dans 'Les Plouffe'"], answer: 1, explanation: "Roy Dupuis a incarné Maurice 'Rocket' Richard dans le film 'Maurice Richard' (2005) — un rôle considéré comme l'un des plus grands de l'histoire du cinéma québécois." },
  { q: "Quel acteur québécois est connu pour son humour et ses one-man-show autant que pour la TV ?", choices: ["Martin Matte", "Louis-José Houde", "François Morency", "Maxim Martin"], answer: 1, explanation: "Louis-José Houde est l'humoriste québécois le plus populaire des années 2010. Ses spectacles 'Suivre la parade' et 'Transatlantique' ont battu des records de billetterie au Québec." },
  { q: "Anne Dorval est connue pour quel film de Xavier Dolan ?", choices: ["Tom à la ferme", "Laurence Anyways", "Mommy", "J'ai tué ma mère"], answer: 2, explanation: "Anne Dorval joue Diane 'Die' Després dans 'Mommy' (2014) de Xavier Dolan — un rôle qui lui a valu des prix internationaux. Elle jouait aussi dans 'J'ai tué ma mère' et 'Les amours imaginaires'." },

  // Acteurs hollywoodiens — approfondissement
  { q: "Quel acteur a joué le rôle du colonel Hans Landa dans 'Inglourious Basterds' de Tarantino ?", choices: ["Christoph Waltz", "Michael Fassbender", "Tom Hardy", "Daniel Brühl"], answer: 0, explanation: "Christoph Waltz a remporté l'Oscar du meilleur second rôle pour son colonel Landa dans 'Inglourious Basterds' (2009). C'était son premier rôle en anglais — il parle aussi français, allemand et anglais dans le film." },
  { q: "Dans quelle franchise joue Will Smith en tant qu'agent secret combattant des extraterrestres ?", choices: ["Independence Day", "Bad Boys", "Men in Black", "Suicide Squad"], answer: 2, explanation: "Will Smith joue l'agent J dans 'Men in Black' (1997, 2002, 2012) aux côtés de Tommy Lee Jones. La franchise a rapporté plus d'1,6 milliard de dollars au box-office mondial." },
  { q: "Quel acteur américain est connu pour avoir joué dans 'Cast Away', 'The Terminal' et 'Captain Phillips' ?", choices: ["Tom Hanks", "Matt Damon", "Tom Cruise", "Harrison Ford"], answer: 0, explanation: "Tom Hanks est l'un des acteurs les plus appréciés d'Hollywood. 'Cast Away' (2000), 'The Terminal' (2004) et 'Captain Phillips' (2013) illustrent sa capacité à porter un film presque seul à l'écran." },
  { q: "Quel acteur a joué Gandalf dans 'Le Seigneur des anneaux' ?", choices: ["Anthony Hopkins", "Ian McKellen", "Patrick Stewart", "Christopher Lee"], answer: 1, explanation: "Ian McKellen joue Gandalf le Gris puis Gandalf le Blanc dans les 3 films du Seigneur des anneaux ET dans la trilogie Hobbit. Il joue aussi Magneto dans les films X-Men." },
  { q: "Quel acteur français a remporté l'Oscar du meilleur acteur pour 'The Artist' (2012) ?", choices: ["Vincent Cassel", "Jean Dujardin", "Omar Sy", "Guillaume Canet"], answer: 1, explanation: "Jean Dujardin est le premier acteur français à remporter l'Oscar du meilleur acteur pour son rôle dans 'The Artist' (2012) — un film muet en noir et blanc réalisé par Michel Hazanavicius." },

  // Acteurs — encore plus
  { q: "Quel acteur a joué Jack Dawson dans 'Titanic' (1997) ?", choices: ["Brad Pitt", "Matt Damon", "Leonardo DiCaprio", "Johnny Depp"], answer: 2, explanation: "Leonardo DiCaprio joue Jack Dawson dans 'Titanic' de James Cameron (1997) — le film le plus rentable de l'histoire à l'époque (1,84 milliard $). Kate Winslet joue Rose. DiCaprio avait 22 ans." },
  { q: "Quel acteur est connu pour ses rôles dans 'Gladiator', 'A Beautiful Mind' et 'Les Misérables' ?", choices: ["Tom Hanks", "Russell Crowe", "Hugh Jackman", "Christian Bale"], answer: 1, explanation: "Russell Crowe (né en Nouvelle-Zélande) a remporté l'Oscar pour 'Gladiator' (2001). Il a aussi joué John Nash dans 'A Beautiful Mind' (2002) et Javert dans 'Les Misérables' (2012)." },
  { q: "Quel acteur a joué dans plus de 280 films, dont Dracula et Saruman ?", choices: ["Christopher Lee", "Peter Cushing", "Vincent Price", "Boris Karloff"], answer: 0, explanation: "Sir Christopher Lee (1922-2015) a joué dans plus de 280 films — notamment Dracula (18 fois), Saruman dans Le Seigneur des anneaux et le comte Dooku dans Star Wars. Il était aussi chanteur métal à 90 ans." },
  { q: "Quel acteur joue Tony Montana dans 'Scarface' (1983) ?", choices: ["Robert De Niro", "Al Pacino", "James Caan", "Harvey Keitel"], answer: 1, explanation: "Al Pacino incarne Tony Montana dans 'Scarface' de Brian De Palma (1983). Le film est culte pour ses répliques ('Say hello to my little friend!') et a influencé la culture hip-hop mondiale." },
  { q: "Dans quel film Brad Pitt joue-t-il un détective enquêtant sur des meurtres bibliques ?", choices: ["Fight Club", "Seven", "Zodiac", "True Detective"], answer: 1, explanation: "Brad Pitt joue le détective Mills dans 'Seven' (1995) de David Fincher — un film noir avec Morgan Freeman. La fin ('What's in the box?') est l'une des plus choquantes de l'histoire du cinéma." },
  { q: "Quel acteur joue Iron Man dans 'Avengers: Endgame' et prononce la réplique culte 'I am Iron Man' ?", choices: ["Chris Evans", "Robert Downey Jr.", "Paul Rudd", "Jeremy Renner"], answer: 1, explanation: "Robert Downey Jr. prononce 'I am Iron Man' avant de claquer des doigts et de sauver l'univers dans 'Avengers: Endgame' (2019) — la réplique la plus mémorable du MCU, 11 ans après ses débuts dans Iron Man." },
  { q: "Quel acteur a joué le Joker dans le film solo 'Joker' (2019) et a remporté l'Oscar ?", choices: ["Heath Ledger", "Jared Leto", "Joaquin Phoenix", "Jack Nicholson"], answer: 2, explanation: "Joaquin Phoenix a remporté l'Oscar du meilleur acteur pour 'Joker' (2019) de Todd Phillips. Il a perdu 24 kg pour le rôle et a créé une performance considérée comme l'une des meilleures de la décennie." },

  // Actrices — approfondissement
  { q: "Quelle actrice joue Clarice Starling face à Hannibal Lecter dans 'The Silence of the Lambs' ?", choices: ["Meryl Streep", "Jodie Foster", "Sigourney Weaver", "Susan Sarandon"], answer: 1, explanation: "Jodie Foster joue Clarice Starling dans 'Le Silence des agneaux' (1991) face à Anthony Hopkins. Elle remporte l'Oscar de la meilleure actrice — son deuxième après 'The Accused' (1988)." },
  { q: "Quel rôle Sigourney Weaver joue-t-elle dans la franchise 'Alien' ?", choices: ["Amanda Ripley", "Ellen Ripley", "Grace Augustine", "Dana Barrett"], answer: 1, explanation: "Sigourney Weaver joue Ellen Ripley dans les 4 films Alien (1979-1997) — l'une des premières héroïnes d'action fortes du cinéma. Elle est aussi Grace Augustine dans 'Avatar' de James Cameron." },
  { q: "Quelle actrice a joué Lara Croft dans les films 'Tomb Raider' (2001-2003) ?", choices: ["Charlize Theron", "Halle Berry", "Angelina Jolie", "Milla Jovovich"], answer: 2, explanation: "Angelina Jolie a incarné Lara Croft dans 'Lara Croft: Tomb Raider' (2001) et sa suite (2003). Elle est aussi ambassadrice du HCR (réfugiés ONU) et a adopté 3 enfants de pays en développement." },
  { q: "Quelle actrice québécoise a joué dans 'Incendies' et dans la série américaine 'Homeland' ?", choices: ["Mélissa Désormeaux-Poulin", "Céline Bonnier", "Karine Vanasse", "Évelyne Brochu"], answer: 3, explanation: "Évelyne Brochu a joué dans 'Incendies' (2010) de Denis Villeneuve puis dans les séries américaines 'Orphan Black' et 'Tom Clancy's Jack Ryan'. Elle représente la percée des actrices québécoises aux États-Unis." },
  { q: "Quelle actrice joue Katniss mais aussi Mystique dans X-Men ?", choices: ["Shailene Woodley", "Jennifer Lawrence", "Emma Stone", "Brie Larson"], answer: 1, explanation: "Jennifer Lawrence joue Katniss dans Hunger Games ET Mystique dans X-Men: First Class (2011) et ses suites — deux franchises simultanément. Elle est la deuxième actrice la mieux payée au monde en 2015." },
  { q: "Quelle actrice française est connue pour 'Amélie Poulain' (2001) ?", choices: ["Sophie Marceau", "Juliette Binoche", "Audrey Tautou", "Marion Cotillard"], answer: 2, explanation: "Audrey Tautou joue Amélie Poulain dans 'Le Fabuleux Destin d'Amélie Poulain' de Jean-Pierre Jeunet (2001) — l'un des films français les plus vus dans le monde avec 33 millions de spectateurs." },
  { q: "Quelle actrice française a remporté l'Oscar pour son rôle dans 'La Vie en rose' (2007) ?", choices: ["Isabelle Huppert", "Catherine Deneuve", "Sophie Marceau", "Marion Cotillard"], answer: 3, explanation: "Marion Cotillard a remporté l'Oscar de la meilleure actrice pour son interprétation d'Édith Piaf dans 'La Môme' (2007). Elle est la première actrice française à remporter cet Oscar pour un rôle en français." },

  // Cinéma — culture générale
  { q: "Quel film de Spielberg a remporté l'Oscar du meilleur film en 1994 ?", choices: ["E.T.", "Indiana Jones", "Schindler's List", "Jurassic Park"], answer: 2, explanation: "'La Liste de Schindler' (Schindler's List, 1993) a remporté 7 Oscars dont Meilleur film et Meilleur réalisateur. Spielberg avait refusé tout cachet pour ce film sur l'Holocauste." },
  { q: "Quel est le film de super-héros ayant rapporté le plus d'argent au box-office mondial ?", choices: ["The Dark Knight", "Avengers: Endgame", "Spider-Man: No Way Home", "Black Panther"], answer: 1, explanation: "'Avengers: Endgame' (2019) a rapporté 2,799 milliards de dollars au box-office mondial — le 2e film le plus rentable de l'histoire derrière 'Avatar' (2009) de James Cameron." },
  { q: "Quel acteur a joué dans la trilogie 'Le Parrain' de Francis Ford Coppola ?", choices: ["Robert De Niro et Al Pacino", "Al Pacino et Marlon Brando", "Dustin Hoffman et Jack Nicholson", "Gene Hackman et Robert Duvall"], answer: 1, explanation: "Marlon Brando joue Vito Corleone (père) et Al Pacino joue Michael Corleone (fils) dans 'The Godfather' (1972). Robert De Niro joue le jeune Vito dans 'The Godfather Part II' (1974)." },

  // Acteurs et actrices — culture cinéma
  { q: "Quel acteur a joué Spider-Man dans les films MCU depuis 2016 ?", choices: ["Andrew Garfield", "Tobey Maguire", "Tom Holland", "Jake Gyllenhaal"], answer: 2, explanation: "Tom Holland incarne Peter Parker/Spider-Man dans le MCU depuis 'Captain America: Civil War' (2016). Tobey Maguire (2002-2007) et Andrew Garfield (2012-2014) ont joué les versions précédentes." },
  { q: "Quelle actrice joue Harley Quinn dans 'Suicide Squad' (2016) ?", choices: ["Scarlett Johansson", "Cara Delevingne", "Margot Robbie", "Gal Gadot"], answer: 2, explanation: "Margot Robbie (Australie) joue Harley Quinn dans 'Suicide Squad' (2016) et 'Birds of Prey' (2020). Elle a aussi joué Barbie dans le film de Greta Gerwig (2023) — record de box-office féminin." },
  { q: "Quel acteur joue le personnage de Thanos dans l'univers MCU ?", choices: ["Dwayne Johnson", "Jason Momoa", "Josh Brolin", "Vin Diesel"], answer: 2, explanation: "Josh Brolin prête sa voix et sa performance (capture de mouvement) au personnage de Thanos dans le MCU, notamment dans 'Avengers: Infinity War' (2018) et 'Avengers: Endgame' (2019)." },
  { q: "Dans quel film Johnny Depp joue-t-il le capitaine Jack Sparrow ?", choices: ["Edward aux mains d'argent", "Blow", "Pirates des Caraïbes", "Fear and Loathing in Las Vegas"], answer: 2, explanation: "Johnny Depp joue Jack Sparrow dans la franchise 'Pirates des Caraïbes' (2003-2017). Son interprétation excentrique lui a valu une nomination à l'Oscar et est devenue l'une des plus iconiques du cinéma." },
  { q: "Quelle actrice joue Wonder Woman dans les films DC ?", choices: ["Scarlett Johansson", "Gal Gadot", "Brie Larson", "Lupita Nyong'o"], answer: 1, explanation: "Gal Gadot (Israël) joue Diana Prince/Wonder Woman depuis 'Batman v Superman' (2016) et le film solo 'Wonder Woman' (2017). Elle a servi dans l'armée israélienne avant de devenir actrice et mannequin." },
  { q: "Quel acteur québécois est devenu une star internationale grâce à des séries Netflix ?", choices: ["François Arnaud", "Éric Bruneau", "Antoine Bertrand", "Marc-André Grondin"], answer: 0, explanation: "François Arnaud (Montréal) a joué Cesare Borgia dans la série 'Les Borgia' (Showtime, 2011-2013) et est apparu dans de nombreuses productions américaines — l'un des acteurs québécois les plus reconnus à Hollywood." },
  { q: "Quel film animé de Disney a rapporté le plus d'argent au box-office ?", choices: ["Le Roi Lion (2019)", "La Reine des neiges", "Incredibles 2", "Zootopie"], answer: 0, explanation: "Le Roi Lion (2019, version live action de Jon Favreau) a rapporté 1,657 milliard $ — le film d'animation (ou quasi-animation) le plus rentable de l'histoire à l'époque." },
  { q: "Quel acteur joue Vito Corleone dans la version originale du Parrain (1972) ?", choices: ["Al Pacino", "Robert De Niro", "Marlon Brando", "Gene Hackman"], answer: 2, explanation: "Marlon Brando remporte l'Oscar du meilleur acteur pour Vito Corleone — mais il l'a refusé en signe de protestation contre le traitement des Amérindiens à Hollywood. Robert De Niro joue le jeune Vito dans la suite." },
  { q: "Quelle actrice a joué dans 'Titanic', 'Eternal Sunshine of the Spotless Mind' et 'Les Heures' ?", choices: ["Cate Blanchett", "Nicole Kidman", "Kate Winslet", "Rachel McAdams"], answer: 2, explanation: "Kate Winslet (Angleterre) joue Rose dans Titanic (1997), Clementine dans 'Eternal Sunshine' (2004) et a remporté l'Oscar pour 'The Reader' (2009). Elle a refusé de nombreux grands rôles par choix de vie." },
  { q: "Dans 'Harry Potter', qui joue le professeur Dumbledore dans les premiers films ?", choices: ["Michael Gambon", "Richard Harris", "Ian McKellen", "Patrick Stewart"], answer: 1, explanation: "Richard Harris joue Dumbledore dans les deux premiers films (2001-2002). À sa mort en 2002, Michael Gambon a repris le rôle pour les 6 films suivants (2004-2011)." },
  { q: "Quel acteur a joué Batman dans la trilogie de Christopher Nolan ?", choices: ["Ben Affleck", "Val Kilmer", "Christian Bale", "Michael Keaton"], answer: 2, explanation: "Christian Bale joue Bruce Wayne/Batman dans 'Batman Begins' (2005), 'The Dark Knight' (2008) et 'The Dark Knight Rises' (2012). Il s'est mis en forme de façon spectaculaire après le film 'The Machinist' où il pesait 55 kg." },
];

interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
  questions: Question[];
}

const CATEGORIES: Category[] = [
  { id: 'nutrition', label: 'Nutrition',   emoji: '🥦', color: '#22c55e', description: 'Aliments, additifs, macronutriments, santé', questions: Q_NUTRITION },
  { id: 'nature',    label: 'Nature',      emoji: '🌿', color: '#3b82f6', description: 'Animaux, plantes, écosystèmes, environnement', questions: Q_NATURE },
  { id: 'histoire',  label: 'Histoire',    emoji: '🏛️', color: '#f59e0b', description: 'Canada, Québec, monde, grandes dates', questions: Q_HISTOIRE },
  { id: 'lieux',     label: 'Lieux & Archi', emoji: '🏙️', color: '#a855f7', description: 'Commerces, bâtiments, villes, Montréal', questions: Q_LIEUX },
  { id: 'sport',     label: 'Sport',       emoji: '🏒', color: '#ef4444', description: 'Hockey, soccer, tennis, olympiques, MMA', questions: Q_SPORT },
  { id: 'artiste',   label: 'Artistes',    emoji: '🎵', color: '#ec4899', description: 'Musique québécoise, francophone, internationale', questions: Q_ARTISTE },
  { id: 'acteur',    label: 'Acteurs & Cinéma', emoji: '🎬', color: '#f97316', description: 'Hollywood, Québec, réalisateurs, films cultes', questions: Q_ACTEUR },
];

type QuizPhase = 'home' | 'playing' | 'result';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QUIZ_COOLDOWN_MS = 4 * 60 * 60 * 1000;

function useCooldown(lastQuizAt: number | null, isPremium: boolean) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (isPremium || !lastQuizAt) { setRemaining(0); return; }
    const tick = () => {
      const diff = QUIZ_COOLDOWN_MS - (Date.now() - lastQuizAt);
      setRemaining(Math.max(0, diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastQuizAt, isPremium]);
  return remaining;
}

function formatCountdown(ms: number) {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export function QuizScreen() {
  const user = useStore(s => s.user);
  const isPremium = user?.plan === 'PREMIUM';
  const updateQuizStats = useStore(s => s.updateQuizStats);
  const bestScore = useStore(s => s.quizBestScore);
  const quizTotal = useStore(s => s.quizTotal);
  const quizCorrect = useStore(s => s.quizCorrect);
  const lastQuizAt = useStore(s => s.lastQuizAt);
  const token = useStore(s => s.token);
  const navigation = useNavigation<any>();
  const cooldownMs = useCooldown(lastQuizAt, isPremium);

  const [phase,      setPhase]      = useState<QuizPhase>('home');
  const [category,   setCategory]   = useState<Category | null>(null);
  const [questions,  setQuestions]  = useState<Question[]>([]);
  const [index,      setIndex]      = useState(0);
  const [selected,   setSelected]   = useState<number | null>(null);
  const [score,      setScore]      = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [dealRewards, setDealRewards] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

  const explosionBalloons = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    }))
  ).current;

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

  const startQuiz = (cat: Category) => {
    setCategory(cat);
    setQuestions(shuffle(cat.questions).slice(0, QUIZ_SIZE));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setCorrectCount(0);
    setDealRewards([]);
    setPhase('playing');
  };

  const selectAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === questions[index].answer) {
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
      const allDeals: any[] = [];
      for (const term of picks) {
        try {
          const { data } = await axios.get(`${API_URL}/deals`, {
            params: { search: term, postal_code: 'J1H1A1' },
            headers: { Authorization: `Bearer ${token}` },
          });
          const withSale = (Array.isArray(data) ? data : []).filter((d: any) => d.imageUrl && d.saleStory).sort((a: any, b: any) => (a.price || 999) - (b.price || 999));
          const best = withSale[0] || (Array.isArray(data) ? data : []).filter((d: any) => d.price && d.imageUrl)[0];
          if (best) allDeals.push(best);
        } catch {}
      }
      setDealRewards(allDeals);
    } catch {}
    setLoadingDeals(false);
  };

  const earnQuizPoints = async (finalScore: number) => {
    if (!token || finalScore === 0) return;
    try {
      await axios.post(`${API_URL}/coupons/earn`, { action: 'quiz', amount: finalScore * 3 }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  };

  const nextQuestion = () => {
    if (index < QUIZ_SIZE - 1) {
      setIndex(i => i + 1);
      setSelected(null);
    } else {
      updateQuizStats(score, correctCount);
      earnQuizPoints(score);
      loadDealRewards(score);
      setPhase('result');
    }
  };

  // ── Écran d'accueil — sélection de catégorie ────────────────────────────
  if (phase === 'home') {
    const accuracy = quizTotal > 0 ? Math.round((quizCorrect / (quizTotal * QUIZ_SIZE)) * 100) : 0;
    return (
      <WeatherScreen>
        <ScrollView style={s.root} contentContainerStyle={s.content}>
          <Text style={s.screenTitle}>🧠 Quiz</Text>
          <Text style={s.screenSub}>Choisis une catégorie pour commencer</Text>

          {cooldownMs > 0 && (
            <View style={s.cooldownBanner}>
              <Text style={s.cooldownTitle}>⏳ Prochain quiz disponible dans</Text>
              <Text style={s.cooldownTimer}>{formatCountdown(cooldownMs)}</Text>
              <Text style={s.cooldownSub}>Premium supprime l'attente</Text>
            </View>
          )}

          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={[s.catCard, { borderColor: cat.color + '55' }, cooldownMs > 0 && s.catCardDisabled]} onPress={() => cooldownMs > 0 ? null : startQuiz(cat)} activeOpacity={cooldownMs > 0 ? 1 : 0.8}>
              <View style={[s.catIconWrap, { backgroundColor: cat.color + '22' }]}>
                <Text style={s.catIcon}>{cat.emoji}</Text>
              </View>
              <View style={s.catTextWrap}>
                <Text style={s.catLabel}>{cat.label}</Text>
                <Text style={s.catDesc}>{cat.description}</Text>
                <Text style={s.catCount}>{cat.questions.length} questions</Text>
              </View>
              <View style={[s.catArrow, { backgroundColor: cat.color }]}>
                <Text style={s.catArrowTxt}>›</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={s.statsCard}>
            <Text style={s.statsTitle}>Mes statistiques</Text>
            <View style={s.statsRow}>
              <View style={s.statItem}><Text style={s.statVal}>{bestScore}/{QUIZ_SIZE}</Text><Text style={s.statLbl}>Meilleur</Text></View>
              <View style={s.statItem}><Text style={s.statVal}>{quizTotal}</Text><Text style={s.statLbl}>Quiz</Text></View>
              <View style={s.statItem}><Text style={s.statVal}>{accuracy}%</Text><Text style={s.statLbl}>Précision</Text></View>
            </View>
          </View>

          <AdBannerSmall />
          <View style={{ height: 40 }} />
        </ScrollView>
      </WeatherScreen>
    );
  }

  // ── Résultats ──────────────────────────────────────────────────────────
  if (phase === 'result') {
    const emoji = score >= 8 ? '🏆' : score >= 5 ? '👍' : '💪';
    const msg   = score >= 8 ? 'Excellent !' : score >= 5 ? 'Pas mal !' : 'Continue à apprendre !';
    const col   = category?.color || '#22c55e';
    return (
      <WeatherScreen>
        <ScrollView style={s.root} contentContainerStyle={s.content}>
          <Text style={s.bigEmoji}>{emoji}</Text>
          <Text style={[s.catBadge, { backgroundColor: col + '22', borderColor: col + '55', color: col }]}>{category?.emoji} {category?.label}</Text>
          <Text style={s.title}>{msg}</Text>
          <Text style={[s.resultScore, { color: col }]}>{score} / {QUIZ_SIZE}</Text>

          <View style={[s.rewardCard, { borderColor: col + '44' }]}>
            <Text style={[s.rewardTitle, { color: col }]}>Résultat</Text>
            <Text style={s.rewardLine}>{score} bonnes réponses sur {QUIZ_SIZE}</Text>
            <Text style={s.rewardLine}>+{score * 3} points gagnés ⭐</Text>
          </View>

          {loadingDeals && (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={s.loadingTxt}>Chargement des deals...</Text>
            </View>
          )}

          {dealRewards.length > 0 && (
            <View style={s.dealsSection}>
              <Text style={s.dealsSectionTitle}>Rabais débloqués</Text>
              <Text style={s.dealsSectionSub}>Vrais circulaires de votre région</Text>
              {dealRewards.map((deal, i) => {
                const isFreeUnlock = !isPremium && i === 0;
                const canSee = isPremium || isFreeUnlock;
                return (
                  <TouchableOpacity
                    key={i}
                    style={s.dealCard}
                    onPress={() => canSee
                      ? navigation.navigate('Soldes', { dealItem: deal, returnTo: 'Quiz' })
                      : openCheckout()
                    }
                  >
                    {isFreeUnlock && (
                      <View style={s.freeBadge}><Text style={s.freeBadgeTxt}>🎁 Débloqué</Text></View>
                    )}
                    {deal.imageUrl
                      ? <Image source={{ uri: deal.imageUrl }} style={s.dealImg} resizeMode="contain" />
                      : <View style={[s.dealImg, s.dealImgFallback]}><Text>🛒</Text></View>
                    }
                    <View style={{ flex: 1 }}>
                      <Text style={s.dealName} numberOfLines={2}>{deal.name}</Text>
                      <Text style={s.dealMerchant}>{canSee ? deal.merchant : '🔒 Premium'}</Text>
                      {deal.saleStory && <View style={s.salePill}><Text style={s.salePillTxt}>{deal.saleStory}</Text></View>}
                    </View>
                    <Text style={[s.dealPrice, { color: col }]}>{canSee && deal.price ? `$${deal.price.toFixed(2)}` : '$ ?.??'}</Text>
                  </TouchableOpacity>
                );
              })}
              {!isPremium && (
                <TouchableOpacity style={s.upgradeBtn} onPress={() => openCheckout()}>
                  <Text style={s.upgradeTxt}>Premium — Voir tous les prix & magasins</Text>
                  <Text style={s.upgradeSub}>$3.99/mois</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[s.startBtn, { backgroundColor: cooldownMs > 0 ? '#333' : col }]}
            onPress={() => cooldownMs > 0 ? null : startQuiz(category!)}
            activeOpacity={cooldownMs > 0 ? 1 : 0.8}
          >
            <Text style={s.startBtnTxt}>
              {cooldownMs > 0 ? `⏳ ${formatCountdown(cooldownMs)}` : `Rejouer — ${category?.emoji} ${category?.label}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => setPhase('home')}>
            <Text style={s.secondaryBtnTxt}>Changer de catégorie</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </WeatherScreen>
    );
  }

  // ── Quiz en cours ──────────────────────────────────────────────────────
  const q   = questions[index];
  const col = category?.color || '#22c55e';
  return (
    <WeatherScreen>
      <ScrollView style={s.root} contentContainerStyle={s.content}>
        <View style={s.progressRow}>
          <Text style={[s.catBadge, { backgroundColor: col + '22', borderColor: col + '44', color: col }]}>{category?.emoji} {category?.label}</Text>
          <Text style={[s.scoreTxt, { color: col }]}>{score} pts</Text>
        </View>

        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${((index + 1) / QUIZ_SIZE) * 100}%` as any, backgroundColor: col }]} />
        </View>
        <Text style={s.progressCounter}>Question {index + 1} / {QUIZ_SIZE}</Text>

        <View style={s.questionCard}>
          <Text style={s.question}>{q.q}</Text>
        </View>

        {q.choices.map((choice, i) => {
          let bg = '#1a1a1a', border = '#2a2a2a';
          if (selected !== null) {
            if (i === q.answer)                      { bg = '#052e16'; border = '#22c55e'; }
            else if (i === selected && i !== q.answer){ bg = '#3b0a0a'; border = '#ef4444'; }
          }
          return (
            <TouchableOpacity
              key={i}
              style={[s.choiceBtn, { backgroundColor: bg, borderColor: border }]}
              onPress={() => selectAnswer(i)}
              disabled={selected !== null}
            >
              <View style={[s.choiceLetter, { backgroundColor: selected === null ? col + '22' : (i === q.answer ? '#22c55e' : i === selected ? '#ef4444' : '#1a1a1a') }]}>
                <Text style={[s.choiceLetterTxt, { color: selected === null ? col : '#fff' }]}>{String.fromCharCode(65 + i)}</Text>
              </View>
              <Text style={s.choiceTxt}>{choice}</Text>
              {selected !== null && i === q.answer  && <Text style={s.checkMark}>✓</Text>}
              {selected !== null && i === selected && i !== q.answer && <Text style={s.crossMark}>✗</Text>}
            </TouchableOpacity>
          );
        })}

        {selected !== null && (
          <View style={[s.explainBox, selected === q.answer ? s.explainCorrect : s.explainWrong]}>
            <Text style={s.explainTitle}>{selected === q.answer ? '✓ Correct !' : '✗ Incorrect'}</Text>
            <Text style={s.explainTxt}>{q.explanation}</Text>
          </View>
        )}

        {selected !== null && (
          <TouchableOpacity style={[s.nextBtn, { backgroundColor: col }]} onPress={nextQuestion}>
            <Text style={s.nextBtnTxt}>{index < QUIZ_SIZE - 1 ? 'Suivant →' : 'Voir le résultat'}</Text>
          </TouchableOpacity>
        )}

        {showConfetti && (
          <ConfettiCannon count={80} origin={{ x: 200, y: -20 }} fadeOut autoStart explosionSpeed={400} fallSpeed={2500} />
        )}
        {showExplosion && (
          <View style={s.explosionWrap} pointerEvents="none">
            {explosionBalloons.map((b, i) => (
              <Animated.Text key={i} style={[s.explosionBalloon, { transform: [{ translateX: b.x }, { translateY: b.y }, { scale: b.scale }], opacity: b.opacity }]}>
                {['💥', '💣', '❌', '🔴', '⭕', '💢', '🚫', '😵'][i]}
              </Animated.Text>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </WeatherScreen>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  content: { padding: 20, paddingTop: 16 },

  screenTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  screenSub:   { color: '#666', fontSize: 14, marginBottom: 24 },

  catCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1 },
  catCardDisabled: { opacity: 0.4 },
  cooldownBanner: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f59e0b55' },
  cooldownTitle:  { color: '#f59e0b', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  cooldownTimer:  { color: 'white', fontWeight: '800', fontSize: 28, fontVariant: ['tabular-nums'] },
  cooldownSub:    { color: '#666', fontSize: 12, marginTop: 6 },
  catIconWrap:{ width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  catIcon:    { fontSize: 28 },
  catTextWrap:{ flex: 1 },
  catLabel:   { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  catDesc:    { color: '#666', fontSize: 12, marginBottom: 4, lineHeight: 16 },
  catCount:   { color: '#444', fontSize: 11 },
  catArrow:   { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  catArrowTxt:{ color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 28 },

  statsCard:  { backgroundColor: '#141414', borderRadius: 16, padding: 18, marginTop: 16, marginBottom: 16 },
  statsTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 14 },
  statsRow:   { flexDirection: 'row', justifyContent: 'space-around' },
  statItem:   { alignItems: 'center' },
  statVal:    { color: '#22c55e', fontSize: 20, fontWeight: '900' },
  statLbl:    { color: '#666', fontSize: 11, marginTop: 2 },

  bigEmoji:    { fontSize: 64, textAlign: 'center', marginBottom: 12 },
  catBadge:    { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  title:       { color: '#fff', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  resultScore: { fontSize: 52, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  rewardCard:  { backgroundColor: '#0f1a0f', borderRadius: 16, padding: 16, width: '100%', marginBottom: 20, borderWidth: 1 },
  rewardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  rewardLine:  { color: '#ccc', fontSize: 13, marginBottom: 5 },
  loadingBox:  { marginVertical: 20, alignItems: 'center', gap: 10 },
  loadingTxt:  { color: '#ccc', fontSize: 13 },
  startBtn:    { borderRadius: 14, padding: 18, width: '100%', alignItems: 'center', marginTop: 10 },
  startBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn:{ borderRadius: 14, padding: 14, width: '100%', alignItems: 'center', marginTop: 10, backgroundColor: '#1a1a1a' },
  secondaryBtnTxt: { color: '#888', fontSize: 14, fontWeight: '600' },

  dealsSection:      { width: '100%', marginTop: 16, marginBottom: 8 },
  dealsSectionTitle: { color: '#22c55e', fontSize: 17, fontWeight: '800', marginBottom: 2 },
  dealsSectionSub:   { color: '#aaa', fontSize: 12, marginBottom: 12 },
  dealCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 10, marginBottom: 8, gap: 10, position: 'relative' },
  freeBadge:         { position: 'absolute', top: -8, right: 8, backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 1 },
  freeBadgeTxt:      { color: '#fff', fontSize: 11, fontWeight: '800' },
  dealImg:           { width: 60, height: 60, borderRadius: 10, backgroundColor: '#222' },
  dealImgFallback:   { justifyContent: 'center', alignItems: 'center' },
  dealName:          { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 17 },
  dealMerchant:      { color: '#22c55e', fontSize: 12, fontWeight: '600', marginTop: 2 },
  dealPrice:         { fontSize: 18, fontWeight: '800' },
  salePill:          { backgroundColor: '#dc2626', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, alignSelf: 'flex-start', marginTop: 4 },
  salePillTxt:       { color: '#fff', fontSize: 10, fontWeight: '800' },
  upgradeBtn:        { backgroundColor: '#f59e0b', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  upgradeTxt:        { color: '#000', fontSize: 14, fontWeight: '900' },
  upgradeSub:        { color: '#000', fontSize: 11, fontWeight: '700', marginTop: 2 },

  progressRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 },
  scoreTxt:        { fontSize: 14, fontWeight: '800' },
  progressBar:     { width: '100%', height: 6, backgroundColor: '#252525', borderRadius: 3, marginBottom: 6 },
  progressFill:    { height: 6, borderRadius: 3 },
  progressCounter: { color: '#555', fontSize: 11, marginBottom: 20 },
  questionCard:    { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16, padding: 16, marginBottom: 24, width: '100%' },
  question:        { color: '#fff', fontSize: 20, fontWeight: '600', textAlign: 'center', lineHeight: 28 },

  choiceBtn:     { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1.5, gap: 12 },
  choiceLetter:  { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  choiceLetterTxt:{ fontSize: 15, fontWeight: '800' },
  choiceTxt:     { color: '#fff', fontSize: 15, flex: 1 },
  checkMark:     { color: '#22c55e', fontSize: 20, fontWeight: '800' },
  crossMark:     { color: '#ef4444', fontSize: 20, fontWeight: '800' },

  explainBox:    { width: '100%', borderRadius: 14, padding: 16, marginTop: 8, marginBottom: 12, borderWidth: 1 },
  explainCorrect:{ backgroundColor: '#052e16', borderColor: '#22c55e' },
  explainWrong:  { backgroundColor: '#3b0a0a', borderColor: '#ef4444' },
  explainTitle:  { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  explainTxt:    { color: '#ccc', fontSize: 13, lineHeight: 19 },

  nextBtn:       { borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', marginTop: 8 },
  nextBtnTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },

  explosionWrap:   { position: 'absolute', top: '40%', left: '50%', width: 0, height: 0, zIndex: 100 },
  explosionBalloon:{ position: 'absolute', fontSize: 36 },
});
