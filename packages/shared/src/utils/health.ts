import { HealthRating } from '../types';

export function getHealthRating(score: number): HealthRating {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'bon';
  if (score >= 40) return 'moyen';
  if (score >= 20) return 'mauvais';
  return 'terrible';
}

export function getHealthColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

export function getHealthEmoji(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
}

export function getNutriScoreColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case 'A': return '#038141';
    case 'B': return '#85bb2f';
    case 'C': return '#fecb02';
    case 'D': return '#ee8100';
    case 'E': return '#e63e11';
    default: return '#999999';
  }
}

export function formatDiscount(regular: number, sale: number): string {
  const pct = Math.round(((regular - sale) / regular) * 100);
  return `-${pct}%`;
}
