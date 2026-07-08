import React, { useState, useRef } from 'react';
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
  { id: 'nutrition', label: 'Nutrition', emoji: '🥦', color: '#22c55e', description: 'Aliments, additifs, macronutriments, santé', questions: Q_NUTRITION },
  { id: 'nature',    label: 'Nature',    emoji: '🌿', color: '#3b82f6', description: 'Animaux, plantes, écosystèmes, environnement', questions: Q_NATURE },
  { id: 'histoire',  label: 'Histoire',  emoji: '🏛️', color: '#f59e0b', description: 'Canada, Québec, monde, grandes dates', questions: Q_HISTOIRE },
  { id: 'lieux',     label: 'Lieux & Architecture', emoji: '🏙️', color: '#a855f7', description: 'Commerces, bâtiments, villes, Montréal', questions: Q_LIEUX },
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

export function QuizScreen() {
  const user = useStore(s => s.user);
  const isPremium = user?.plan === 'PREMIUM';
  const updateQuizStats = useStore(s => s.updateQuizStats);
  const bestScore = useStore(s => s.quizBestScore);
  const quizTotal = useStore(s => s.quizTotal);
  const quizCorrect = useStore(s => s.quizCorrect);
  const token = useStore(s => s.token);
  const navigation = useNavigation<any>();

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

          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={[s.catCard, { borderColor: cat.color + '55' }]} onPress={() => startQuiz(cat)} activeOpacity={0.8}>
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
              {dealRewards.map((deal, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.dealCard}
                  onPress={() => isPremium
                    ? navigation.navigate('Soldes', { dealItem: deal, returnTo: 'Quiz' })
                    : openCheckout()
                  }
                >
                  {deal.imageUrl
                    ? <Image source={{ uri: deal.imageUrl }} style={s.dealImg} resizeMode="contain" />
                    : <View style={[s.dealImg, s.dealImgFallback]}><Text>🛒</Text></View>
                  }
                  <View style={{ flex: 1 }}>
                    <Text style={s.dealName} numberOfLines={2}>{deal.name}</Text>
                    <Text style={s.dealMerchant}>{isPremium ? deal.merchant : '🔒 Premium'}</Text>
                    {deal.saleStory && <View style={s.salePill}><Text style={s.salePillTxt}>{deal.saleStory}</Text></View>}
                  </View>
                  <Text style={[s.dealPrice, { color: col }]}>{isPremium && deal.price ? `$${deal.price.toFixed(2)}` : '$ ?.??'}</Text>
                </TouchableOpacity>
              ))}
              {!isPremium && (
                <TouchableOpacity style={s.upgradeBtn} onPress={() => openCheckout()}>
                  <Text style={s.upgradeTxt}>Premium — Voir prix & magasins</Text>
                  <Text style={s.upgradeSub}>$3.99/mois</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity style={[s.startBtn, { backgroundColor: col }]} onPress={() => startQuiz(category!)}>
            <Text style={s.startBtnTxt}>Rejouer — {category?.emoji} {category?.label}</Text>
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

        <Text style={s.question}>{q.q}</Text>

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
  dealCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 10, marginBottom: 8, gap: 10 },
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
  question:        { color: '#fff', fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 24, lineHeight: 28 },

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
