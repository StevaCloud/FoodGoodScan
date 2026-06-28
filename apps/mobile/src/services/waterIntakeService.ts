export interface WaterPlan {
  dailyMl: number;
  dailyLiters: string;
  glassesCount: number;
  schedule: WaterReminder[];
  reason: string;
}

export interface WaterReminder {
  hour: number;
  minute: number;
  ml: number;
  message: string;
}

const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary: 0.85,
  light: 1.0,
  moderate: 1.15,
  active: 1.35,
};

const DIET_BONUS: Record<string, number> = {
  keto: 300,      // keto nécessite plus d'eau (excrétion de cétones)
  vegan: 100,
  none: 0,
  vegetarian: 0,
  glutenfree: 0,
  lactosefree: 0,
  halal: 0,
  kosher: 0,
};

export function calculateWaterIntake(
  weightLbs: number,
  heightCm: number,
  activityLevel: string,
  diet: string,
  temperatureCelsius: number,
  gender: string
): WaterPlan {
  const weightKg = weightLbs * 0.453592;

  // Base: 35ml par kg
  let ml = weightKg * 35;

  // Ajustement activité
  ml *= ACTIVITY_MULTIPLIER[activityLevel] || 1.0;

  // Ajustement genre
  if (gender === 'female') ml *= 0.9;

  // Ajustement taille (>180cm: +150ml, <160cm: -100ml)
  if (heightCm > 180) ml += 150;
  else if (heightCm < 160) ml -= 100;

  // Ajustement température
  if (temperatureCelsius >= 35) ml += 1000;
  else if (temperatureCelsius >= 30) ml += 600;
  else if (temperatureCelsius >= 25) ml += 300;

  // Ajustement régime
  ml += DIET_BONUS[diet] || 0;

  const dailyMl = Math.round(ml / 50) * 50; // arrondi à 50ml
  const glassesCount = Math.round(dailyMl / 250);

  const reason = buildReason(weightLbs, activityLevel, temperatureCelsius, diet);

  const schedule = buildSchedule(dailyMl, glassesCount);

  return {
    dailyMl,
    dailyLiters: (dailyMl / 1000).toFixed(1),
    glassesCount,
    schedule,
    reason,
  };
}

function buildReason(weight: number, activity: string, temp: number, diet: string): string {
  const parts: string[] = [`${weight} lbs`];
  if (activity === 'active') parts.push('niveau actif');
  if (temp >= 25) parts.push(`${temp}°C`);
  if (diet === 'keto') parts.push('régime keto');
  return parts.join(' · ');
}

function buildSchedule(dailyMl: number, glasses: number): WaterReminder[] {
  const wakeHour = 7;
  const sleepHour = 22;
  const activeHours = sleepHour - wakeHour;
  const intervalHours = Math.floor(activeHours / glasses);
  const mlPerGlass = Math.round(dailyMl / glasses);

  const schedule: WaterReminder[] = [];
  const messages = [
    'Commence ta journée avec un grand verre d\'eau!',
    'Mi-matinée — hydrate-toi pour rester concentré',
    'Avant le repas — un verre d\'eau aide la digestion',
    'Après-midi — l\'eau booste ton énergie',
    'Fin d\'après-midi — reste hydraté!',
    'Soirée — encore quelques gorgées avant de dormir',
  ];

  for (let i = 0; i < glasses; i++) {
    const hour = wakeHour + i * intervalHours;
    if (hour >= sleepHour) break;
    schedule.push({
      hour,
      minute: 0,
      ml: mlPerGlass,
      message: messages[i % messages.length],
    });
  }

  return schedule;
}

export function getDietNotifications(diet: string, goal: string): string[] {
  const msgs: string[] = [];

  const dietAdvice: Record<string, string[]> = {
    keto: ['Évite les glucides cachés dans les sauces', 'Mange plus de gras sains (avocat, noix)', 'Vérifie les étiquettes pour les sucres ajoutés'],
    vegan: ['Pense à ta dose de vitamine B12 aujourd\'hui', 'Les légumineuses sont ta meilleure source de protéines', 'Assure-toi d\'avoir assez de fer et de calcium'],
    vegetarian: ['Combine légumineuses + céréales pour des protéines complètes', 'Les oeufs et le fromage sont d\'excellentes sources de protéines'],
    glutenfree: ['Vérifie toujours les étiquettes pour les traces de gluten', 'L\'avoine peut contenir du gluten — choisis version certifiée'],
    lactosefree: ['Remplace le lait par des boissons végétales enrichies en calcium'],
  };

  const goalAdvice: Record<string, string[]> = {
    lose: ['Mange des protéines à chaque repas pour rester rassasié', 'Une soupe avant le repas réduit l\'apport calorique'],
    gain: ['Ajoute des noix et graines à tes repas pour plus de calories saines'],
    muscle: ['Consomme 1.6-2g de protéines par kg de poids corporel', 'La collation post-entraînement est cruciale pour la récupération'],
    health: ['Vise 5 portions de fruits et légumes aujourd\'hui', 'Limite les aliments ultra-transformés (NOVA 4)'],
  };

  if (dietAdvice[diet]) msgs.push(...dietAdvice[diet]);
  if (goalAdvice[goal]) msgs.push(...goalAdvice[goal]);

  return msgs;
}

export function playWaterDropSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Première goutte
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
    gain1.gain.setValueAtTime(0.4, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Écho de la goutte (rebond)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(900, ctx.currentTime + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.35);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.45);
  } catch {}
}
