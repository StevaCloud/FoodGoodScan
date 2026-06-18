import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GRADES = [
  { letter: 'A', color: '#038141' },
  { letter: 'B', color: '#85bb2f' },
  { letter: 'C', color: '#fecb02' },
  { letter: 'D', color: '#ee8100' },
  { letter: 'E', color: '#e63e11' },
];

interface Props {
  grade: string;
}

export function NutriScoreBar({ grade }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutri-Score</Text>
      <View style={styles.bar}>
        {GRADES.map((g) => (
          <View
            key={g.letter}
            style={[
              styles.segment,
              { backgroundColor: g.color },
              grade.toUpperCase() === g.letter && styles.active,
            ]}
          >
            <Text
              style={[
                styles.letter,
                grade.toUpperCase() === g.letter && styles.activeLetter,
              ]}
            >
              {g.letter}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#bbb',
    marginBottom: 4,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    opacity: 0.4,
  },
  active: {
    opacity: 1,
    transform: [{ scaleY: 1.3 }],
  },
  letter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeLetter: {
    fontSize: 18,
  },
});
