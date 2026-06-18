import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  score: number;
  size?: 'small' | 'large';
}

function getColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

function getLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  if (score >= 20) return 'Mauvais';
  return 'Terrible';
}

export function HealthScoreBadge({ score, size = 'large' }: Props) {
  const color = getColor(score);
  const label = getLabel(score);
  const isLarge = size === 'large';

  return (
    <View style={[styles.container, { borderColor: color }, isLarge && styles.large]}>
      <Text style={[styles.score, { color }, isLarge && styles.scoreLarge]}>{score}</Text>
      <Text style={[styles.label, { color }, isLarge && styles.labelLarge]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
  },
  large: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    padding: 12,
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLarge: {
    fontSize: 32,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  labelLarge: {
    fontSize: 12,
  },
});
