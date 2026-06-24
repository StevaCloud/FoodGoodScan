import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Modal, Pressable, Dimensions } from 'react-native';
import { useStore } from '../store/useStore';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';
import { usePostalCode } from '../hooks/usePostalCode';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '../components/Toast';
import { useWeatherBg, useWeatherText } from '../hooks/useWeatherBg';
import { WeatherScreen } from '../components/WeatherBackground';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const MEAL_PLANS = {
  lose: {
    title: 'Plan Perte de poids',
    calories: 1500,
    macros: { proteins: 30, carbs: 40, fat: 30 },
    weeklyMeals: [
      // Lundi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['2 oeufs brouillés', 'Toast blé entier', 'Fruits frais', 'Thé vert'], calories: 350 },
        { time: '10:00', name: 'Collation', items: ['Yogourt grec nature', 'Amandes (15g)'], calories: 150 },
        { time: '12:30', name: 'Dîner', items: ['Poitrine de poulet grillée', 'Salade verte', 'Quinoa (100g)', "Huile d'olive"], calories: 450 },
        { time: '15:30', name: 'Collation', items: ['Pomme', "Beurre d'amande (1 c.s.)"], calories: 150 },
        { time: '18:30', name: 'Souper', items: ['Saumon grillé', 'Légumes vapeur', 'Riz brun (80g)'], calories: 400 },
      ],
      // Mardi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Gruau avoine (50g)', 'Bleuets frais', 'Lait écrémé', 'Cannelle'], calories: 320 },
        { time: '10:00', name: 'Collation', items: ['Fromage cottage (100g)', 'Concombre tranché'], calories: 120 },
        { time: '12:30', name: 'Dîner', items: ['Dinde grillée (150g)', 'Wrap blé entier', 'Épinards', 'Moutarde'], calories: 450 },
        { time: '15:30', name: 'Collation', items: ['Orange', 'Noix de cajou (15g)'], calories: 160 },
        { time: '18:30', name: 'Souper', items: ['Morue au four', 'Brocoli vapeur', 'Patate douce (100g)'], calories: 420 },
      ],
      // Mercredi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Smoothie épinards-banane-protéine', 'Graines de chia (10g)'], calories: 340 },
        { time: '10:00', name: 'Collation', items: ['Céleri + hummus (2 c.s.)', 'Poivron rouge'], calories: 100 },
        { time: '12:30', name: 'Dîner', items: ['Thon en conserve (eau)', 'Pain de seigle', 'Salade de légumes', 'Citron'], calories: 380 },
        { time: '15:30', name: 'Collation', items: ['Yogourt grec (150g)', 'Fraises fraîches'], calories: 130 },
        { time: '18:30', name: 'Souper', items: ['Filet de porc maigre grillé', 'Courgette sautée', 'Lentilles (80g)'], calories: 420 },
      ],
      // Jeudi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Omelette 2 oeufs + épinards', 'Toast de seigle', 'Café noir'], calories: 330 },
        { time: '10:00', name: 'Collation', items: ['Edamame (100g)', 'Eau citronnée'], calories: 120 },
        { time: '12:30', name: 'Dîner', items: ['Soupe de lentilles maison', 'Pain blé entier (1 tranche)', 'Salade verte'], calories: 420 },
        { time: '15:30', name: 'Collation', items: ['Poire', 'Amandes (12g)'], calories: 150 },
        { time: '18:30', name: 'Souper', items: ['Poulet sauté aux légumes', 'Riz de chou-fleur', 'Sauce soya légère'], calories: 380 },
      ],
      // Vendredi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Toast avocat + oeuf poché', 'Tomates cerises', 'Thé vert'], calories: 370 },
        { time: '10:00', name: 'Collation', items: ['Fromage cottage + ananas', 'Graines de lin'], calories: 140 },
        { time: '12:30', name: 'Dîner', items: ['Crevettes grillées (150g)', 'Quinoa (90g)', 'Salade de concombre'], calories: 440 },
        { time: '15:30', name: 'Collation', items: ['Framboises (1 tasse)', 'Yogourt nature'], calories: 130 },
        { time: '18:30', name: 'Souper', items: ['Boulettes de dinde', 'Courgettes spaghetti', 'Sauce tomate maison'], calories: 400 },
      ],
      // Samedi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Crêpes protéinées (farine avoine)', "Sirop d'érable (1 c.s.)", 'Bleuets'], calories: 380 },
        { time: '10:00', name: 'Collation', items: ['Kéfir (200ml)', 'Nectarine'], calories: 130 },
        { time: '12:30', name: 'Dîner', items: ['Salade de poulet grillé', 'Vinaigrette citron-herbes', 'Croûtons blé entier'], calories: 430 },
        { time: '15:30', name: 'Collation', items: ['Concombre + tzatziki léger', 'Poivron'], calories: 110 },
        { time: '18:30', name: 'Souper', items: ['Tilapia au four', 'Asperges grillées', 'Riz brun (80g)'], calories: 400 },
      ],
      // Dimanche
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Omelette légumes (poivron, oignon, épinards)', 'Toast blé entier'], calories: 350 },
        { time: '10:00', name: 'Collation', items: ['Noix mélangées (20g)', 'Raisins frais (100g)'], calories: 160 },
        { time: '12:30', name: 'Dîner', items: ['Bowl de boeuf maigre', 'Riz brun (80g)', 'Légumes grillés', 'Salsa'], calories: 480 },
        { time: '15:30', name: 'Collation', items: ['Céleri + beurre arachide naturel (1 c.s.)'], calories: 120 },
        { time: '18:30', name: 'Souper', items: ['Poulet grillé (150g)', 'Patate douce rôtie (120g)', 'Épinards sautés'], calories: 410 },
      ],
    ],
  },
  maintain: {
    title: 'Plan Maintien',
    calories: 2000,
    macros: { proteins: 25, carbs: 50, fat: 25 },
    weeklyMeals: [
      // Lundi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Gruau avoine', 'Banane', 'Lait', 'Miel'], calories: 450 },
        { time: '10:00', name: 'Collation', items: ["Barre de granola", "Jus d'orange"], calories: 200 },
        { time: '12:30', name: 'Dîner', items: ['Sandwich poulet', 'Soupe légumes', 'Fruits'], calories: 550 },
        { time: '15:30', name: 'Collation', items: ['Fromage', 'Craquelins blé entier'], calories: 200 },
        { time: '18:30', name: 'Souper', items: ['Pâtes sauce tomate', 'Salade César', 'Pain ail'], calories: 600 },
      ],
      // Mardi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['2 oeufs + 2 tranches bacon dinde', 'Toast blé entier', 'Jus orange'], calories: 480 },
        { time: '10:00', name: 'Collation', items: ['Banane', "Beurre d'arachide (1 c.s.)"], calories: 200 },
        { time: '12:30', name: 'Dîner', items: ['Bowl boeuf + riz brun', 'Légumes grillés', 'Guacamole'], calories: 580 },
        { time: '15:30', name: 'Collation', items: ['Trail mix (noix + fruits secs)'], calories: 220 },
        { time: '18:30', name: 'Souper', items: ['Saumon grillé (180g)', 'Patates pilées légères', 'Asperges'], calories: 580 },
      ],
      // Mercredi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Pain doré blé entier', 'Sirop érable', 'Fruits frais', 'Café'], calories: 460 },
        { time: '10:00', name: 'Collation', items: ['Yogourt grec + granola', 'Pomme'], calories: 220 },
        { time: '12:30', name: 'Dîner', items: ['Wrap poulet grillé + légumes', 'Salade verte', 'Vinaigrette légère'], calories: 540 },
        { time: '15:30', name: 'Collation', items: ['Barre protéinée', 'Lait'], calories: 200 },
        { time: '18:30', name: 'Souper', items: ['Poulet sauté + légumes colorés', 'Riz jasmin (150g)', 'Sauce teriyaki légère'], calories: 560 },
      ],
      // Jeudi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Smoothie bowl (banane, fruits, granola)', 'Noix de coco râpée'], calories: 470 },
        { time: '10:00', name: 'Collation', items: ['Edamame (150g)', 'Thé vert'], calories: 170 },
        { time: '12:30', name: 'Dîner', items: ['Poke bowl (thon, riz, avocat, concombre)', 'Sauce ponzu'], calories: 560 },
        { time: '15:30', name: 'Collation', items: ['Pomme + fromage cheddar léger'], calories: 200 },
        { time: '18:30', name: 'Souper', items: ['Tacos boeuf maigre (2)', 'Tortillas blé entier', 'Salsa, guac, laitue'], calories: 580 },
      ],
      // Vendredi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Pancakes blé entier (3)', 'Fruits frais', 'Sirop érable (1 c.s.)'], calories: 490 },
        { time: '10:00', name: 'Collation', items: ['Bâton de fromage', 'Raisins (150g)'], calories: 190 },
        { time: '12:30', name: 'Dîner', items: ['Wrap César au poulet', 'Soupe du jour', 'Jus légumes'], calories: 550 },
        { time: '15:30', name: 'Collation', items: ['Granola + lait amande'], calories: 210 },
        { time: '18:30', name: 'Souper', items: ['Crevettes + linguini', 'Sauce ail-beurre légère', 'Parmesan', 'Salade'], calories: 600 },
      ],
      // Samedi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Bagel blé entier', 'Fromage à la crème léger', 'Saumon fumé', 'Câpres'], calories: 500 },
        { time: '10:00', name: 'Collation', items: ['Salade de fruits frais', 'Noix (20g)'], calories: 200 },
        { time: '12:30', name: 'Dîner', items: ['Burger dinde maison', 'Pain blé entier', 'Salade de chou légère'], calories: 580 },
        { time: '15:30', name: 'Collation', items: ['Yogourt parfait (yogourt, granola, fruits)'], calories: 220 },
        { time: '18:30', name: 'Souper', items: ['Steak de flanc grillé (150g)', 'Légumes rôtis', 'Pain baguette (1 tranche)'], calories: 580 },
      ],
      // Dimanche
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Déjeuner complet : 2 oeufs, bacon dinde, toast, tomates'], calories: 510 },
        { time: '10:00', name: 'Collation', items: ["Jus d'orange pressé", 'Muffin son avoine'], calories: 210 },
        { time: '12:30', name: 'Dîner', items: ['Pâtes macaroni + légumes + fromage léger', 'Salade verte'], calories: 560 },
        { time: '15:30', name: 'Collation', items: ['Craquelins blé entier + fromage cottage', 'Concombre'], calories: 200 },
        { time: '18:30', name: 'Souper', items: ['Rôti de poulet aux herbes', 'Pommes de terre rôties', 'Carottes glacées'], calories: 590 },
      ],
    ],
  },
  gain: {
    title: 'Plan Prise de poids',
    calories: 2800,
    macros: { proteins: 30, carbs: 45, fat: 25 },
    weeklyMeals: [
      // Lundi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ["4 oeufs brouillés", '2 toasts beurre', 'Avocat', "Jus d'orange"], calories: 650 },
        { time: '10:00', name: 'Collation', items: ['Shake protéiné', 'Banane', "Beurre d'arachide"], calories: 400 },
        { time: '12:30', name: 'Dîner', items: ['Poitrine de poulet (200g)', 'Riz (200g)', 'Légumes', "Huile d'olive"], calories: 700 },
        { time: '15:30', name: 'Collation', items: ['Yogourt grec', 'Granola', 'Fruits secs'], calories: 350 },
        { time: '18:30', name: 'Souper', items: ['Steak (200g)', 'Patates douces', 'Brocoli', 'Beurre'], calories: 700 },
      ],
      // Mardi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Gruau avoine (100g)', '4 oeufs', 'Lait entier', 'Banane', 'Miel'], calories: 680 },
        { time: '10:00', name: 'Collation', items: ['Shake banane-PB-lait entier', 'Noix mélangées (40g)'], calories: 420 },
        { time: '12:30', name: 'Dîner', items: ['Bol de thon (180g)', 'Riz brun (200g)', 'Avocat', 'Sauce soya'], calories: 720 },
        { time: '15:30', name: 'Collation', items: ['Granola bar maison', 'Yogourt grec (200g)'], calories: 360 },
        { time: '18:30', name: 'Souper', items: ['Pâtes (200g)', 'Sauce bolognaise maison', "Pain à l'ail", 'Parmesan'], calories: 750 },
      ],
      // Mercredi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Toast x3 + avocat + 4 oeufs', 'Jus orange', 'Fromage cheddar'], calories: 700 },
        { time: '10:00', name: 'Collation', items: ['Smoothie PB-banane-lait-avoine', 'Dattes (5)'], calories: 440 },
        { time: '12:30', name: 'Dîner', items: ['Burger maison (boeuf 200g)', 'Pain brioche', 'Fromage', 'Frites four'], calories: 750 },
        { time: '15:30', name: 'Collation', items: ['Shake protéiné', 'Banane', 'Amandes (30g)'], calories: 380 },
        { time: '18:30', name: 'Souper', items: ['Poulet (200g)', 'Riz blanc (200g)', 'Légumes beurre', 'Huile olive'], calories: 720 },
      ],
      // Jeudi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Gruau protéiné + fruits secs + noix', 'Lait entier (300ml)', 'Oeufs (3)'], calories: 660 },
        { time: '10:00', name: 'Collation', items: ['Kéfir (300ml)', 'Granola (60g)', 'Miel'], calories: 400 },
        { time: '12:30', name: 'Dîner', items: ['Wrap poulet-fromage-avocat-légumes (2)', 'Soupe poulet maison'], calories: 730 },
        { time: '15:30', name: 'Collation', items: ['Shake whey', 'Banane', 'Beurre arachide (2 c.s.)'], calories: 420 },
        { time: '18:30', name: 'Souper', items: ['Steak de surlonge (200g)', 'Patates douces rôties (200g)', 'Brocoli beurre'], calories: 750 },
      ],
      // Vendredi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Crêpes protéinées (4)', 'Sirop érable', 'Fruits frais', 'Lait'], calories: 680 },
        { time: '10:00', name: 'Collation', items: ['Amandes + noix de cajou (50g)', 'Fromage (50g)'], calories: 410 },
        { time: '12:30', name: 'Dîner', items: ['Bowl saumon-quinoa-avocat-légumes', 'Vinaigrette tahini'], calories: 720 },
        { time: '15:30', name: 'Collation', items: ['Yogourt grec (200g)', 'Granola (50g)', 'Fraises'], calories: 370 },
        { time: '18:30', name: 'Souper', items: ['Lasagne maison (viande maigre)', 'Salade César', 'Pain grillé'], calories: 760 },
      ],
      // Samedi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['4 oeufs + saucisses dinde', '3 toasts beurre', 'Haricots cuits'], calories: 720 },
        { time: '10:00', name: 'Collation', items: ['Smoothie tropicaux (mangue, ananas, lait coco)', 'Protéine en poudre'], calories: 430 },
        { time: '12:30', name: 'Dîner', items: ['Sous-marin maison (poulet, fromage, légumes, mayo légère)', 'Chips cuites four'], calories: 740 },
        { time: '15:30', name: 'Collation', items: ['Beurre PB + crackers blé entier (8)', 'Lait (250ml)'], calories: 400 },
        { time: '18:30', name: 'Souper', items: ['Côtelettes de porc (200g)', 'Riz (180g)', 'Légumes sautés beurre'], calories: 730 },
      ],
      // Dimanche
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Déjeuner complet : 4 oeufs, bacon dinde, 3 rôties, haricots, jus'], calories: 750 },
        { time: '10:00', name: 'Collation', items: ['Granola bar + lait entier (300ml)', 'Banane'], calories: 420 },
        { time: '12:30', name: 'Dîner', items: ['Mac + fromage maison + poulet grillé', 'Salade verte'], calories: 730 },
        { time: '15:30', name: 'Collation', items: ['Granola (60g)', 'Yogourt grec (200g)', 'Noix (20g)'], calories: 410 },
        { time: '18:30', name: 'Souper', items: ['Spaghetti bolognaise maison (200g pâtes)', 'Parmesan', 'Pain ail'], calories: 760 },
      ],
    ],
  },
  muscle: {
    title: 'Plan Prise de muscle',
    calories: 2500,
    macros: { proteins: 40, carbs: 35, fat: 25 },
    weeklyMeals: [
      // Lundi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Omelette 4 oeufs + épinards', 'Toast blé entier', 'Avocat'], calories: 550 },
        { time: '10:00', name: 'Post-entraînement', items: ['Shake whey protéine', 'Banane', "Flocons d'avoine"], calories: 400 },
        { time: '12:30', name: 'Dîner', items: ['Poulet grillé (200g)', 'Riz brun (150g)', 'Légumes verts'], calories: 600 },
        { time: '15:30', name: 'Collation', items: ['Thon en conserve', 'Craquelins', 'Fromage cottage'], calories: 350 },
        { time: '18:30', name: 'Souper', items: ['Saumon (200g)', 'Patates douces', 'Asperges', "Huile d'olive"], calories: 600 },
      ],
      // Mardi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Gruau avoine (80g)', '3 blancs oeufs + 1 entier', 'Protéine', 'Bleuets'], calories: 520 },
        { time: '10:00', name: 'Post-entraînement', items: ['Shake whey + lait écrémé', 'Pomme', 'Amandes (20g)'], calories: 420 },
        { time: '12:30', name: 'Dîner', items: ['Steak de flanc (180g)', 'Riz brun (150g)', 'Épinards sautés ail'], calories: 620 },
        { time: '15:30', name: 'Collation', items: ['Fromage cottage (200g)', 'Ananas (100g)', 'Graines de lin'], calories: 340 },
        { time: '18:30', name: 'Souper', items: ['Tilapia grillé (220g)', 'Quinoa (130g)', 'Brocoli vapeur', 'Citron'], calories: 580 },
      ],
      // Mercredi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['4 oeufs brouillés', 'Dinde fumée (60g)', '2 toasts blé', 'Avocat (½)'], calories: 580 },
        { time: '10:00', name: 'Post-entraînement', items: ['Smoothie protéiné (whey, banane, lait, PB)', 'Kiwi'], calories: 450 },
        { time: '12:30', name: 'Dîner', items: ['Poitrine de poulet (220g)', 'Patate douce (150g)', 'Salade épinards'], calories: 610 },
        { time: '15:30', name: 'Collation', items: ['Yogourt grec (200g)', 'Granola (30g)', 'Framboises'], calories: 350 },
        { time: '18:30', name: 'Souper', items: ['Saumon (200g)', 'Riz sauvage (130g)', 'Légumes vapeur', 'Beurre léger'], calories: 590 },
      ],
      // Jeudi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Pancakes protéinés (whey, avoine, oeufs)', 'Beurre PB', 'Banane'], calories: 570 },
        { time: '10:00', name: 'Post-entraînement', items: ['Shake whey + créatine', 'Banane', 'Riz soufflé (30g)'], calories: 410 },
        { time: '12:30', name: 'Dîner', items: ['Boeuf haché maigre (200g)', 'Riz brun (150g)', 'Légumes sautés'], calories: 630 },
        { time: '15:30', name: 'Collation', items: ['Edamame (150g)', 'Thon en conserve (1 boîte)', 'Citron'], calories: 330 },
        { time: '18:30', name: 'Souper', items: ['Poitrine de poulet (220g)', 'Pâtes blé entier (100g sec)', 'Sauce tomate'], calories: 600 },
      ],
      // Vendredi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Omelette protéinée (4 oeufs, fromage cottage, épinards)', '2 toasts'], calories: 560 },
        { time: '10:00', name: 'Post-entraînement', items: ['Shake whey', 'Dattes (4)', 'Noix mélangées (25g)'], calories: 430 },
        { time: '12:30', name: 'Dîner', items: ['Crevettes grillées (200g)', 'Quinoa (150g)', 'Avocat', 'Salade'], calories: 590 },
        { time: '15:30', name: 'Collation', items: ['Fromage cottage (200g)', 'Pomme', 'Cannelle'], calories: 320 },
        { time: '18:30', name: 'Souper', items: ['Steak surlonge (200g)', 'Patates douces (150g)', 'Asperges grillées'], calories: 640 },
      ],
      // Samedi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Smoothie bowl protéiné', 'Granola (40g)', 'Fruits frais', 'Graines chia'], calories: 540 },
        { time: '10:00', name: 'Post-entraînement', items: ['Shake whey + lait entier', 'Banane', 'Beurre amande (1 c.s.)'], calories: 450 },
        { time: '12:30', name: 'Dîner', items: ['Poulet rôti (220g)', 'Riz brun (150g)', 'Salade verte', 'Vinaigrette légère'], calories: 620 },
        { time: '15:30', name: 'Collation', items: ['Yogourt grec (200g)', 'Noix (25g)', 'Miel (1 c.t.)'], calories: 360 },
        { time: '18:30', name: 'Souper', items: ['Saumon (200g)', 'Lentilles (120g)', 'Brocoli vapeur', 'Citron-ail'], calories: 600 },
      ],
      // Dimanche
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['4 oeufs + bacon dinde (4 tranches)', '2 toasts blé', 'Avocat', 'Tomates'], calories: 580 },
        { time: '10:00', name: 'Collation (repos)', items: ['Fromage cottage (200g)', 'Bleuets (150g)', 'Graines de lin'], calories: 340 },
        { time: '12:30', name: 'Dîner', items: ['Bowl de thon-avocat-riz brun-légumes', 'Sauce ponzu légère'], calories: 610 },
        { time: '15:30', name: 'Collation', items: ['Shake protéiné', 'Pomme', 'Amandes (20g)'], calories: 380 },
        { time: '18:30', name: 'Souper', items: ['Poulet (220g)', 'Patates douces (150g)', 'Légumes rôtis', 'Herbes'], calories: 610 },
      ],
    ],
  },
  health: {
    title: 'Plan Alimentation saine',
    calories: 1800,
    macros: { proteins: 25, carbs: 45, fat: 30 },
    weeklyMeals: [
      // Lundi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Smoothie vert (épinards, banane, lait amande)', 'Noix mélangées'], calories: 350 },
        { time: '10:00', name: 'Collation', items: ['Fruits frais de saison', 'Amandes'], calories: 150 },
        { time: '12:30', name: 'Dîner', items: ['Bowl de quinoa', 'Légumes grillés', 'Pois chiches', 'Tahini'], calories: 500 },
        { time: '15:30', name: 'Collation', items: ['Hummus', 'Crudités'], calories: 150 },
        { time: '18:30', name: 'Souper', items: ['Poisson blanc grillé', 'Légumes rôtis', 'Riz basmati'], calories: 450 },
      ],
      // Mardi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Gruau avoine + graines chia', 'Bleuets', 'Lait amande', 'Cannelle'], calories: 360 },
        { time: '10:00', name: 'Collation', items: ['Yogourt grec + miel + noix (15g)'], calories: 170 },
        { time: '12:30', name: 'Dîner', items: ['Salade repas (épinards, poulet, avocat, noix, vinaigrette citron)'], calories: 480 },
        { time: '15:30', name: 'Collation', items: ['Pomme + beurre amande (1 c.s.)'], calories: 160 },
        { time: '18:30', name: 'Souper', items: ['Saumon au four (160g)', 'Légumes vapeur', 'Quinoa (100g)'], calories: 480 },
      ],
      // Mercredi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Toast avocat + oeuf poché', 'Tomates cerises', 'Thé vert'], calories: 370 },
        { time: '10:00', name: 'Collation', items: ['Orange', 'Poignée de noix mélangées (20g)'], calories: 160 },
        { time: '12:30', name: 'Dîner', items: ['Soupe de lentilles + pain de seigle', 'Salade de légumes colorés'], calories: 470 },
        { time: '15:30', name: 'Collation', items: ['Céleri + hummus', 'Poivron tranché'], calories: 130 },
        { time: '18:30', name: 'Souper', items: ['Poulet grillé aux herbes', 'Légumes rôtis colorés', 'Patate douce'], calories: 470 },
      ],
      // Jeudi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Parfait yogourt (yogourt grec, granola maison, fruits rouges)'], calories: 380 },
        { time: '10:00', name: 'Collation', items: ['Edamame (100g)', 'Concombre + citron'], calories: 140 },
        { time: '12:30', name: 'Dîner', items: ['Bowl de falafel maison', 'Riz brun', 'Tzatziki', 'Salade'], calories: 510 },
        { time: '15:30', name: 'Collation', items: ['Kéfir (200ml)', 'Pêche fraîche'], calories: 150 },
        { time: '18:30', name: 'Souper', items: ['Morue au citron-aneth', 'Asperges grillées', 'Riz sauvage (90g)'], calories: 440 },
      ],
      // Vendredi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Crêpes avoine-banane (sans sucre ajouté)', 'Fruits frais', 'Sirop érable (1 c.t.)'], calories: 390 },
        { time: '10:00', name: 'Collation', items: ['Framboises + fromage cottage (100g)'], calories: 150 },
        { time: '12:30', name: 'Dîner', items: ['Wrap de dinde + légumes + avocat + moutarde', 'Soupe aux légumes'], calories: 490 },
        { time: '15:30', name: 'Collation', items: ['Noix du Brésil (4)', 'Raisins (100g)'], calories: 160 },
        { time: '18:30', name: 'Souper', items: ['Crevettes sautées ail-citron', 'Légumes vapeur', 'Riz basmati (90g)'], calories: 450 },
      ],
      // Samedi
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Bol de smoothie (açaï, banane, framboises)', 'Granola', 'Graines de chanvre'], calories: 380 },
        { time: '10:00', name: 'Collation', items: ['Tranches de pomme + beurre amande', 'Thé vert'], calories: 170 },
        { time: '12:30', name: 'Dîner', items: ['Salade de quinoa + légumes grillés + feta + olives', 'Vinaigrette méditerranéenne'], calories: 500 },
        { time: '15:30', name: 'Collation', items: ['Yogourt nature + graines chia + miel'], calories: 160 },
        { time: '18:30', name: 'Souper', items: ['Poulet rôti aux herbes', 'Légumes printaniers', 'Riz sauvage'], calories: 470 },
      ],
      // Dimanche
      [
        { time: '07:00', name: 'Petit-déjeuner', items: ['Omelette légumes (courgette, poivron, tomate, basilic)', '1 toast'], calories: 360 },
        { time: '10:00', name: 'Collation', items: ['Jus vert maison (concombre, pomme, gingembre, citron)'], calories: 120 },
        { time: '12:30', name: 'Dîner', items: ['Soupe minestrone maison', 'Pain de blé entier grillé', 'Fromage'], calories: 480 },
        { time: '15:30', name: 'Collation', items: ['Banane + amandes (15g)', 'Eau infusée concombre-menthe'], calories: 160 },
        { time: '18:30', name: 'Souper', items: ['Tilapia citron-câpres', 'Couscous aux légumes', 'Salade verte'], calories: 460 },
      ],
    ],
  },
};

const KETO_PLAN = {
  title: 'Plan Keto',
  calories: 1800,
  macros: { proteins: 25, carbs: 5, fat: 70 },
  weeklyMeals: [
    // Lundi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['3 oeufs au beurre', 'Bacon', 'Avocat'], calories: 500 },
      { time: '12:30', name: 'Dîner', items: ['Salade César sans croûtons', 'Poulet grillé', 'Parmesan'], calories: 450 },
      { time: '15:30', name: 'Collation', items: ['Fromage', 'Noix de macadamia'], calories: 250 },
      { time: '18:30', name: 'Souper', items: ['Saumon beurre citron', 'Asperges au beurre', 'Salade verte'], calories: 600 },
    ],
    // Mardi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Omelette 3 oeufs + fromage brie + champignons', 'Bacon (3 tranches)'], calories: 520 },
      { time: '12:30', name: 'Dîner', items: ['Wrap de laitue + poulet + bacon + fromage + mayo'], calories: 440 },
      { time: '15:30', name: 'Collation', items: ['Pepperoni (30g)', 'Fromage cheddar (40g)'], calories: 240 },
      { time: '18:30', name: 'Souper', items: ['Porc au four (200g)', 'Haricots verts au beurre', 'Salade avocat'], calories: 590 },
    ],
    // Mercredi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Omelette épinards + fromage + crème sure', 'Bacon', 'Café au beurre'], calories: 530 },
      { time: '12:30', name: 'Dîner', items: ['Boeuf haché (180g) + fromage fondu', 'Laitue', 'Tomates', 'Mayo'], calories: 460 },
      { time: '15:30', name: 'Collation', items: ['Oeufs durs (2)', 'Noix de macadamia (20g)'], calories: 230 },
      { time: '18:30', name: 'Souper', items: ['Poulet rôti (200g)', 'Brocoli beurre-ail', 'Salade verte huile olive'], calories: 580 },
    ],
    // Jeudi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Pancakes keto (amandes, oeufs, fromage à la crème)', 'Beurre', 'Peu de fraises'], calories: 510 },
      { time: '12:30', name: 'Dîner', items: ['Salade de thon + mayo + céleri + avocat', 'Feuilles de laitue'], calories: 440 },
      { time: '15:30', name: 'Collation', items: ['Beurre arachide naturel (2 c.s.)', 'Céleri'], calories: 220 },
      { time: '18:30', name: 'Souper', items: ["Saumon + crème à l'aneth", 'Asperges rôties', 'Brocoli vapeur'], calories: 610 },
    ],
    // Vendredi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Bacon (4 tranches)', '3 oeufs', 'Avocat', 'Fromage cottage'], calories: 540 },
      { time: '12:30', name: 'Dîner', items: ['Burger sans pain (boeuf 180g, bacon, fromage, laitue, tomate)'], calories: 450 },
      { time: '15:30', name: 'Collation', items: ['Pepitas (30g)', 'Fromage gouda (40g)'], calories: 240 },
      { time: '18:30', name: 'Souper', items: ['Côtes levées (200g)', 'Chou vapeur', 'Salade coleslaw (mayo)'], calories: 570 },
    ],
    // Samedi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Gaufres keto (farine amande)', 'Crème fraîche', 'Fraises (50g)'], calories: 500 },
      { time: '12:30', name: 'Dîner', items: ['Salade de chef (jambon, fromage, oeufs, vinaigrette huile)'], calories: 460 },
      { time: '15:30', name: 'Collation', items: ['Noix de Grenoble (30g)', 'Fromage brie (40g)'], calories: 260 },
      { time: '18:30', name: 'Souper', items: ['Poulet rôti (200g)', 'Brocoli beurre', 'Champignons sautés beurre'], calories: 580 },
    ],
    // Dimanche
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Oeufs brouillés + saumon fumé (60g)', 'Crème fraîche', 'Câpres'], calories: 510 },
      { time: '12:30', name: 'Dîner', items: ['Soupe à la crème de champignons maison (crème entière)', 'Pain keto (amandes)'], calories: 440 },
      { time: '15:30', name: 'Collation', items: ['Olives (60g)', 'Fromage feta (40g)'], calories: 230 },
      { time: '18:30', name: 'Souper', items: ['Steak (200g)', 'Légumes sautés beurre ail', 'Salade avocat-tomates'], calories: 610 },
    ],
  ],
};

const VEGETARIAN_PLAN = {
  title: 'Plan Végétarien',
  calories: 1800,
  macros: { proteins: 20, carbs: 50, fat: 30 },
  weeklyMeals: [
    // Lundi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ["Gruau avoine + fruits", "Lait d'amande", 'Graines de chia'], calories: 400 },
      { time: '10:00', name: 'Collation', items: ['Yogourt grec', 'Granola maison'], calories: 200 },
      { time: '12:30', name: 'Dîner', items: ['Buddha bowl (tofu, quinoa, légumes)', 'Vinaigrette tahini'], calories: 500 },
      { time: '15:30', name: 'Collation', items: ['Hummus + crudités'], calories: 150 },
      { time: '18:30', name: 'Souper', items: ['Curry de lentilles', 'Riz basmati', 'Naan'], calories: 550 },
    ],
    // Mardi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Yogourt grec + granola + framboises + miel', 'Thé vert'], calories: 390 },
      { time: '10:00', name: 'Collation', items: ['Toast avocat + oeuf poché', 'Tomates cerises'], calories: 220 },
      { time: '12:30', name: 'Dîner', items: ['Dhal de lentilles rouges', 'Riz brun (100g)', 'Naan blé entier'], calories: 510 },
      { time: '15:30', name: 'Collation', items: ['Fromage + pomme', 'Noix (15g)'], calories: 180 },
      { time: '18:30', name: 'Souper', items: ['Bowl de tempeh sauté + légumes + riz brun', 'Sauce teriyaki'], calories: 490 },
    ],
    // Mercredi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Smoothie vert protéiné (épinards, protéine végé, banane, lait amande)'], calories: 380 },
      { time: '10:00', name: 'Collation', items: ['Edamame (120g)', 'Citron', 'Fleur de sel'], calories: 160 },
      { time: '12:30', name: 'Dîner', items: ['Pizza végé (pâte blé entier, légumes grillés, fromage, sauce tomate)'], calories: 520 },
      { time: '15:30', name: 'Collation', items: ['Noix mélangées (25g)', 'Raisins secs (20g)'], calories: 190 },
      { time: '18:30', name: 'Souper', items: ['Pâtes + pesto maison + légumes grillés + parmesan'], calories: 520 },
    ],
    // Jeudi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Crêpes avoine-banane', 'Fruits frais', 'Sirop érable (1 c.t.)', 'Yogourt'], calories: 410 },
      { time: '10:00', name: 'Collation', items: ['Hummus (60g)', 'Poivrons colorés', 'Concombre'], calories: 150 },
      { time: '12:30', name: 'Dîner', items: ['Soupe miso + tofu + champignons', 'Riz blanc (100g)', 'Edamame'], calories: 480 },
      { time: '15:30', name: 'Collation', items: ['Yogourt nature + graines de chanvre + bleuets'], calories: 170 },
      { time: '18:30', name: 'Souper', items: ['Sauté tofu + légumes colorés + sauce soya-gingembre', 'Riz brun (100g)'], calories: 510 },
    ],
    // Vendredi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Toast blé entier + beurre amande + banane tranchée + graines chia'], calories: 400 },
      { time: '10:00', name: 'Collation', items: ['Fromage cottage (150g)', 'Bleuets frais', 'Cannelle'], calories: 170 },
      { time: '12:30', name: 'Dîner', items: ['Tacos végé (haricots noirs, fromage, salsa, guac, laitue)', 'Tortillas maïs (2)'], calories: 500 },
      { time: '15:30', name: 'Collation', items: ['Noix cajou (25g)', 'Abricots secs (4)'], calories: 190 },
      { time: '18:30', name: 'Souper', items: ['Chili végétarien (haricots, tomates, maïs)', 'Pain de maïs', 'Crème sure'], calories: 530 },
    ],
    // Samedi
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Granola maison + lait amande + mangue + kiwi + graines de lin'], calories: 420 },
      { time: '10:00', name: 'Collation', items: ['Muffin son avoine maison', 'Kéfir (200ml)'], calories: 200 },
      { time: '12:30', name: 'Dîner', items: ['Salade quinoa + pois chiches + légumes + feta + tahini'], calories: 510 },
      { time: '15:30', name: 'Collation', items: ['Edamame (120g)', 'Pomme'], calories: 170 },
      { time: '18:30', name: 'Souper', items: ['Quiche légumes sans croûte (oeufs, légumes, fromage)', 'Salade verte'], calories: 490 },
    ],
    // Dimanche
    [
      { time: '07:00', name: 'Petit-déjeuner', items: ['Brunch végé : omelette légumes + toast blé + fromage + jus légumes'], calories: 430 },
      { time: '10:00', name: 'Collation', items: ['Jus de légumes maison', 'Noix (20g)'], calories: 160 },
      { time: '12:30', name: 'Dîner', items: ['Soupe tomate-basilic maison', 'Grilled cheese blé entier (fromage végé)'], calories: 490 },
      { time: '15:30', name: 'Collation', items: ['Pomme + beurre amande (1 c.s.)'], calories: 170 },
      { time: '18:30', name: 'Souper', items: ['Dal makhani (lentilles, crème, tomates, épices)', 'Naan', 'Riz basmati'], calories: 560 },
    ],
  ],
};

// ─── Icônes repas ─────────────────────────────────────────────────────────────
function getMealTypeIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('petit-déjeuner') || n.includes('déjeuner')) return '🌅';
  if (n.includes('post-entraînement') || n.includes('post entraînement')) return '💪';
  if (n.includes('collation')) return '🍏';
  if (n.includes('dîner')) return '🍽️';
  if (n.includes('souper')) return '🌙';
  return '🕐';
}

const FOOD_ICONS: [RegExp, string][] = [
  [/oeuf|oeufs|blanc.*oeuf|omelette/i, '🥚'],
  [/poulet|poitrine.*poulet/i, '🍗'],
  [/dinde|dindon/i, '🦃'],
  [/saumon/i, '🐟'],
  [/thon|morue|tilapia|poisson/i, '🐠'],
  [/crevette/i, '🦐'],
  [/boeuf|steak|surlonge|flanc|bolognaise|boulette/i, '🥩'],
  [/porc|bacon|côtelette|côtes levées|saucisse|pepperoni|jambon/i, '🥓'],
  [/avocat/i, '🥑'],
  [/banane/i, '🍌'],
  [/bleuet|bleuets/i, '🫐'],
  [/fraise|framboises?/i, '🍓'],
  [/pomme(?! de terre)/i, '🍎'],
  [/orange|jus.*orange/i, '🍊'],
  [/raisin/i, '🍇'],
  [/mangue|ananas|kiwi|pêche|nectarine|datte|abricot/i, '🍑'],
  [/citron/i, '🍋'],
  [/brocoli/i, '🥦'],
  [/épinard/i, '🥬'],
  [/carotte/i, '🥕'],
  [/céleri/i, '🥬'],
  [/concombre/i, '🥒'],
  [/poivron/i, '🫑'],
  [/tomate/i, '🍅'],
  [/courgette/i, '🥗'],
  [/asperge/i, '🌿'],
  [/champignon/i, '🍄'],
  [/patate douce|patates douces/i, '🍠'],
  [/pomme de terre|patate[^s]/i, '🥔'],
  [/riz/i, '🍚'],
  [/quinoa|lentille|pois chiche|haricot|edamame/i, '🫘'],
  [/avoine|gruau|granola|céréale/i, '🌾'],
  [/pâtes|pasta|spaghetti|linguini|macaroni|lasagne|couscous/i, '🍝'],
  [/pain|toast|bagel|naan|wrap|tortilla|craquelin|croûton|baguette|rôtie/i, '🍞'],
  [/crêpe|pancake|gaufre|pain doré/i, '🥞'],
  [/yogourt|fromage|lait|cottage|kéfir|parmesan|cheddar|brie|feta|crème.*sure/i, '🧀'],
  [/lait(?!.*amande)/i, '🥛'],
  [/amande|noix|cajou|arachide|beurre.*amande|beurre.*arachide/i, '🥜'],
  [/graines|chia|lin|chanvre/i, '🌱'],
  [/smoothie|shake|whey|protéine.*poudre/i, '🥤'],
  [/thé/i, '🍵'],
  [/café/i, '☕'],
  [/eau/i, '💧'],
  [/jus/i, '🧃'],
  [/huile|beurre(?!.*arachide|.*amande)/i, '🫒'],
  [/sauce|vinaigrette|mayo|guacamole|salsa|hummus|tahini|pesto/i, '🫙'],
  [/miel|sirop/i, '🍯'],
  [/cannelle|herbes|basilic|aneth|gingembre/i, '🌿'],
  [/tofu|tempeh/i, '🟫'],
  [/olive/i, '🫒'],
  [/salade(?!.*poulet|.*quinoa|.*boeuf)/i, '🥗'],
  [/soupe/i, '🍲'],
  [/curry|dhal|dal/i, '🍛'],
  [/burger|sous-marin/i, '🍔'],
  [/tacos?|fajita/i, '🌮'],
  [/pizza/i, '🍕'],
  [/créatine|vitamine/i, '💊'],
];

function getMealIcon(item: string): string {
  for (const [pattern, icon] of FOOD_ICONS) {
    if (pattern.test(item)) return icon;
  }
  return '•';
}

function extractSearchTerm(item: string): string {
  let cleaned = item
    .replace(/\(.*?\)/g, '')
    .replace(/\d+\s*(g|mg|ml|c\.s\.|c\.t\.|kcal|%|lbs?|kg|cm|tranches?|tasses?|verres?)\b/gi, '')
    .replace(/\d+/g, '')
    .trim();
  const words = cleaned.split(/[\s,+]+/).filter(w => w.length > 2);
  return words.slice(0, 2).join(' ');
}

// Associe un article de repas à une catégorie de deals pour trouver son image
const INGREDIENT_CATEGORY: [RegExp, string][] = [
  [/poulet|poitrine.*poulet/i,              'Viandes fraîches'],
  [/dinde|dindon/i,                          'Viandes fraîches'],
  [/boeuf|steak|surlonge|flanc|boulette/i,  'Viandes fraîches'],
  [/porc|bacon|côtelette|saucisse/i,         'Viandes fraîches'],
  [/saumon/i,                                'Poissons frais'],
  [/thon|morue|tilapia|crevette|poisson/i,   'Poissons frais'],
  [/oeuf|oeufs|omelette/i,                   'Oeufs'],
  [/pomme(?! de terre)|raisin|fraise|framboises?|bleuet|kiwi|mangue|orange|ananas|pêche|nectarine/i, 'Fruits frais'],
  [/banane/i,                                'Fruits frais'],
  [/brocoli|épinard|concombre|poivron|tomate|carotte|courgette|asperge|laitue|salade verte|avocat/i, 'Légumes frais'],
  [/céleri|chou|ail|oignon|navet|panais|betterave/i, 'Légumes frais'],
  [/yogourt|fromage|kéfir|cottage|parmesan|cheddar|brie|feta/i, 'Produits laitiers sains'],
  [/amande|noix|cajou|arachide|beurre.*amande|beurre.*arachide|graines|pistache/i, 'Noix & Graines'],
  [/quinoa|riz brun|avoine|gruau/i,          'Grains entiers'],
  [/huile.*olive|huile d'olive/i,            'Bons gras'],
];

function getIngredientImage(item: string, deals: Record<string, DealItem[]>): string | null {
  for (const [pattern, category] of INGREDIENT_CATEGORY) {
    if (!pattern.test(item)) continue;
    const catItems = deals[category];
    if (!catItems?.length) continue;
    // Cherche d'abord un article dont le nom contient le mot-clé principal
    const keyword = item.toLowerCase().split(/[\s,(]+/)[0];
    const exact = catItems.find(d => d.imageUrl && d.name?.toLowerCase().includes(keyword));
    const fallback = catItems.find(d => d.imageUrl);
    return (exact ?? fallback)?.imageUrl ?? null;
  }
  return null;
}

interface DealItem {
  name: string;
  merchant: string;
  price: number | null;
  imageUrl: string;
  merchantLogo?: string;
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
  const weatherBg = useWeatherBg();
  const weatherText = useWeatherText();
  const user = useStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';
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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
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

  const dayMeals = plan.weeklyMeals[activeDay] ?? plan.weeklyMeals[0];

  const weightLbs = parseFloat(healthProfile?.weight || '160');
  const heightCm = parseFloat(healthProfile?.height || '170');
  const weightKg = weightLbs * 0.453592;
  const waterLiters = Math.round((weightKg * 0.033 + (heightCm > 180 ? 0.3 : 0)) * 10) / 10;
  const waterMl = Math.round(waterLiters * 1000);
  const waterGoal = Math.round(waterLiters / 0.25);

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const totalMealCalories = dayMeals.reduce((sum: number, m: any) => sum + m.calories, 0);

  if (selectedDeal) {
    return (
      <WeatherScreen>
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
              <View key={i} style={[styles.storeRow, i === 0 && styles.storeRowBest]}>
                {/* Image + info → ouvre le circulaire du magasin */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
                  onPress={() => navigation.navigate('Soldes', {
                    dealItem: {
                      id: i,
                      name: store.name,
                      merchant: store.merchant,
                      merchantLogo: store.merchantLogo || '',
                      price: store.price,
                      priceText: '',
                      imageUrl: store.imageUrl || '',
                      validFrom: '',
                      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
                      category: '',
                    }
                  })}
                >
                  {store.imageUrl ? (
                    <Image source={{ uri: store.imageUrl }} style={styles.storeProductImg} resizeMode="contain" />
                  ) : (
                    <View style={[styles.storeProductImg, { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 20 }}>🛒</Text>
                    </View>
                  )}
                  <View style={styles.storeInfo}>
                    <View style={styles.storeNameRow}>
                      {store.merchantLogo ? (
                        <Image source={{ uri: store.merchantLogo }} style={styles.storeMerchantLogo} resizeMode="contain" />
                      ) : null}
                      <Text style={styles.storeName}>{store.merchant}</Text>
                      {i === 0 && <View style={styles.bestPriceBadge}><Text style={styles.bestPriceText}>MEILLEUR PRIX</Text></View>}
                    </View>
                    <Text style={styles.storeProduct} numberOfLines={2}>{store.name}</Text>
                    <Text style={styles.storeTapHint}>Voir le produit →</Text>
                  </View>
                </TouchableOpacity>

                {/* Prix + bouton ajouter */}
                <View style={styles.storePriceCol}>
                  {store.price && <Text style={[styles.storePrice, i === 0 && { color: '#22c55e' }]}>${store.price.toFixed(2)}</Text>}
                  <TouchableOpacity
                    style={[styles.storeAddBtn, !isPremium && { backgroundColor: '#f59e0b' }]}
                    onPress={() => {
                      if (isPremium) {
                        addGroceryItem(store.name, store.merchant, store.price, undefined, store.imageUrl || selectedDeal?.imageUrl || '');
                        showToast(`${store.name} ajouté à ta liste`);
                      } else {
                        navigation.navigate('Profil');
                      }
                    }}
                  >
                    <Text style={[styles.storeAddBtnText, !isPremium && { color: '#000' }]}>
                      {isPremium ? 'Ajouter' : 'Premium'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          {!loadingStores && otherStores.length === 0 && (
            <Text style={{ color: '#bbb', fontSize: 13, textAlign: 'center', marginVertical: 12 }}>Aucun autre magasin trouvé cette semaine</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addListBtn, !isPremium && { backgroundColor: '#f59e0b' }]}
          onPress={() => {
            if (isPremium) {
              addGroceryItem(selectedDeal.name, selectedDeal.merchant, selectedDeal.price, undefined, selectedDeal.imageUrl);
              showToast(`${selectedDeal.name} ajouté à ta liste`);
              setSelectedDeal(null);
            } else {
              navigation.navigate('Profil');
            }
          }}
        >
          <Text style={[styles.addListBtnText, !isPremium && { color: '#000' }]}>
            {isPremium ? 'Ajouter à ma liste d\'épicerie' : 'Passe à Premium pour ajouter à ta liste'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.scanTip}>Pour voir les ingrédients et la valeur nutritive, scanne le code-barres du produit en magasin.</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
      </WeatherScreen>
    );
  }

  const screenW = Dimensions.get('window').width;
  const screenH = Dimensions.get('window').height;

  return (
    <>
    <Modal visible={!!zoomedImage} transparent animationType="fade" onRequestClose={() => setZoomedImage(null)}>
      <Pressable style={styles.zoomOverlay} onPress={() => setZoomedImage(null)}>
        <Image
          source={{ uri: zoomedImage! }}
          style={{ width: screenW - 32, height: screenH * 0.6, borderRadius: 12 }}
          resizeMode="contain"
        />
        <Text style={styles.zoomClose}>Appuyer pour fermer</Text>
      </Pressable>
    </Modal>
    <WeatherScreen>
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

      <Text style={styles.sectionTitle}>Plan de repas — {days[activeDay]}</Text>
      <Text style={styles.totalCal}>{totalMealCalories} calories totales</Text>

      {dayMeals.map((meal: any, i: number) => (
        <View key={i} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.mealTypeIcon}>{getMealTypeIcon(meal.name)}</Text>
              <View>
                <Text style={styles.mealTime}>{meal.time}</Text>
                <Text style={styles.mealName}>{meal.name}</Text>
              </View>
            </View>
            <Text style={styles.mealCalories}>{meal.calories} cal</Text>
          </View>
          <View style={styles.mealItemsGrid}>
            {meal.items.map((item: string, j: number) => {
              const icon = getMealIcon(item);
              const imgUrl = getIngredientImage(item, weeklyDeals);
              return (
                <TouchableOpacity
                  key={j}
                  style={styles.mealItemRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    const term = extractSearchTerm(item);
                    if (term) navigation.navigate('Soldes', { searchQuery: term, returnTo: 'Régime' });
                  }}
                >
                  {imgUrl ? (
                    <Image
                      source={{ uri: imgUrl }}
                      style={styles.mealItemThumb}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.mealItemThumbEmpty}>
                      <Text style={styles.mealItemIcon}>{icon === '•' ? '🍴' : icon}</Text>
                    </View>
                  )}
                  <Text style={styles.mealItemText}>{item}</Text>
                  <Text style={styles.mealItemArrow}>{'>'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
                  <View key={i} style={styles.dealCard}>
                    <TouchableOpacity onPress={() => isPremium ? handleDealClick(item) : navigation.navigate('Profil')}>
                      <View style={{ position: 'relative' }}>
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.dealImage}
                            onError={(e) => { (e.target as any).setNativeProps({ src: [] }); }}
                          />
                        ) : (
                          <View style={[styles.dealImage, { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ color: '#555', fontSize: 28 }}>🛒</Text>
                          </View>
                        )}
                        {isPremium ? (
                          item.merchantLogo ? (
                            <Image source={{ uri: item.merchantLogo }} style={styles.dealMerchantLogo} />
                          ) : (
                            <View style={styles.dealMerchantTag}>
                              <Text style={styles.dealMerchantTagText} numberOfLines={1}>{item.merchant}</Text>
                            </View>
                          )
                        ) : (
                          <View style={styles.dealMerchantTag}>
                            <Text style={styles.dealMerchantTagText}>Premium</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.dealName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.dealStore}>{isPremium ? item.merchant : 'Magasin — Premium'}</Text>
                      {item.price && <Text style={styles.dealPrice}>{isPremium ? `$${item.price.toFixed(2)}` : '$ ?.??'}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dealAddBtn, !isPremium && { backgroundColor: '#f59e0b' }]}
                      onPress={() => {
                        if (isPremium) {
                          addGroceryItem(item.name, item.merchant, item.price, undefined, item.imageUrl);
                          showToast(`${item.name} ajouté à ta liste`);
                        } else {
                          navigation.navigate('Profil');
                        }
                      }}
                    >
                      <Text style={[styles.dealAddBtnText, !isPremium && { color: '#000' }]}>
                        {isPremium ? '+ Liste d\'épicerie' : 'Premium pour ajouter'}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
        <Text style={[styles.sectionTitle, { color: weatherText.title }]}>Conseils</Text>
        {goal === 'lose' && (
          <>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Bois un verre d'eau avant chaque repas</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Mange lentement — 20 min minimum par repas</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Évite les aliments ultra-transformés (NOVA 4)</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Privilégie les protéines pour la satiété</Text>
          </>
        )}
        {goal === 'gain' && (
          <>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Mange toutes les 3 heures</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Ajoute des calories saines (avocat, noix, huiles)</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Shake protéiné après l'entraînement</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Ne saute jamais le petit-déjeuner</Text>
          </>
        )}
        {goal === 'muscle' && (
          <>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• 1.6-2.2g de protéines par kg de poids</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Mange dans les 30 min après l'entraînement</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Dors 7-9 heures par nuit</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Créatine 3-5g par jour</Text>
          </>
        )}
        {(goal === 'health' || goal === 'maintain') && (
          <>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Mange 5 portions de fruits/légumes par jour</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Limite le sucre ajouté à 25g par jour</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Choisis des grains entiers</Text>
            <Text style={[styles.tipItem, { color: weatherText.body }]}>• Varie tes sources de protéines</Text>
          </>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
    </WeatherScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
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
  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  totalCal: { color: '#22c55e', fontSize: 13, marginBottom: 12 },
  mealCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 8 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  mealTypeIcon: { fontSize: 28 },
  mealTime: { color: '#22c55e', fontSize: 12, fontWeight: 'bold' },
  mealName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  mealCalories: { color: '#f59e0b', fontSize: 16, fontWeight: 'bold' },
  mealItemsGrid: { gap: 8 },
  mealItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealItemThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#222' },
  mealItemThumbEmpty: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#1f1f1f', justifyContent: 'center', alignItems: 'center' },
  mealItemIcon: { fontSize: 22 },
  mealItemText: { color: '#bbb', fontSize: 13, flex: 1, lineHeight: 18 },
  mealItemArrow: { color: '#22c55e', fontSize: 16, fontWeight: 'bold', marginLeft: 4 },
  allergyWarning: { backgroundColor: '#7f1d1d', borderRadius: 12, padding: 14, marginTop: 12 },
  allergyWarningTitle: { color: '#fca5a5', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  allergyWarningText: { color: '#fca5a5', fontSize: 12, lineHeight: 18 },
  tipsSection: { marginTop: 16 },
  tipItem: { color: '#aaa', fontSize: 16, fontWeight: '600', marginVertical: 4, lineHeight: 24 },
  dealsSection: { marginTop: 20 },
  dealsSubtitle: { color: '#22c55e', fontSize: 12, marginBottom: 12 },
  dealCategory: { marginBottom: 16 },
  dealCategoryTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  dealRow: { flexDirection: 'row', gap: 10 },
  dealCard: { backgroundColor: '#1a1a1a', borderRadius: 10, width: 130, overflow: 'hidden' },
  dealImage: { width: 130, height: 90, backgroundColor: '#222' },
  dealMerchantLogo: { position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: 6, backgroundColor: '#fff' },
  dealMerchantTag: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.65)', paddingVertical: 3, paddingHorizontal: 5 },
  dealMerchantTagText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  dealName: { color: '#ddd', fontSize: 11, padding: 6, paddingBottom: 2 },
  dealStore: { color: '#22c55e', fontSize: 10, paddingHorizontal: 6 },
  dealPrice: { color: '#22c55e', fontSize: 16, fontWeight: 'bold', padding: 6, paddingTop: 2 },
  dealAddBtn: { backgroundColor: '#22c55e', margin: 6, marginTop: 2, borderRadius: 6, paddingVertical: 7, alignItems: 'center' },
  dealAddBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginTop: 14, alignSelf: 'flex-start' },
  backBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  storeRowBest: { backgroundColor: '#0f2d1f', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 8 },
  storeRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  storeProductImg: { width: 62, height: 62, borderRadius: 8, backgroundColor: '#222' },
  storeMerchantLogo: { width: 22, height: 22, borderRadius: 4, backgroundColor: '#fff' },
  storeInfo: { flex: 1 },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  storeName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  bestPriceBadge: { backgroundColor: '#22c55e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bestPriceText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  storeProduct: { color: '#ccc', fontSize: 11, marginTop: 3, lineHeight: 15 },
  storeTapHint: { color: '#22c55e', fontSize: 10, marginTop: 4 },
  storePriceCol: { alignItems: 'flex-end', gap: 6 },
  storePrice: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  storeAddHint: { color: '#3b82f6', fontSize: 10, marginTop: 2 },
  storeAddBtn: { backgroundColor: '#22c55e', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignItems: 'center' },
  storeAddBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  zoomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  zoomClose: { color: '#888', fontSize: 13, marginTop: 16 },
});
