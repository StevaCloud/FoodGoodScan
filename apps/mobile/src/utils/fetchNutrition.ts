export interface NutritionData {
  calories: number;
  fat: number;
  sugars: number;
  proteins: number;
  salt: number;
  healthScore: number;
}

function computeHealthScore(n: NutritionData): number {
  let score = 50;
  if (n.proteins > 10) score += 10;
  if (n.sugars > 20) score -= 15;
  if (n.sugars > 40) score -= 10;
  if (n.fat > 20) score -= 10;
  if (n.salt > 1.5) score -= 10;
  if (n.calories > 400) score -= 5;
  if (n.calories < 150) score += 5;
  return Math.max(0, Math.min(100, score));
}

function parseNutriments(nv: any): NutritionData | null {
  if (!nv) return null;

  // Open Food Facts stores values per 100g with various key formats
  const cal =
    nv['energy-kcal_100g'] ??
    nv['energy-kcal'] ??
    Math.round((nv['energy_100g'] ?? nv['energy'] ?? 0) / 4.184);

  const fat      = nv['fat_100g']      ?? nv['fat']      ?? 0;
  const sugars   = nv['sugars_100g']   ?? nv['sugars']   ?? 0;
  const proteins = nv['proteins_100g'] ?? nv['proteins'] ?? 0;
  const salt     = nv['salt_100g']     ?? nv['salt']     ?? 0;

  if (cal === 0 && fat === 0 && proteins === 0) return null;

  const result: NutritionData = {
    calories: Math.round(cal),
    fat:      Number(fat),
    sugars:   Number(sugars),
    proteins: Number(proteins),
    salt:     Number(salt),
    healthScore: 0,
  };
  result.healthScore = computeHealthScore(result);
  return result;
}

export async function fetchNutritionByName(name: string): Promise<NutritionData | null> {
  try {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
    const url = `${API_URL}/nutrition/search?name=${encodeURIComponent(name)}`;
    console.log('[nutrition] fetch', url);
    const res = await fetch(url);
    console.log('[nutrition] status', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('[nutrition] data', JSON.stringify(data));
      if (data?.calories !== undefined) return data as NutritionData;
    }
  } catch (e) {
    console.error('[nutrition] error', e);
  }
  return null;
}
