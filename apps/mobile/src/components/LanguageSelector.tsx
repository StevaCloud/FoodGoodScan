import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useStore } from '../store/useStore';
import { LANGUAGE_NAMES, Language } from '../i18n/translations';

const LANGUAGES: Language[] = ['fr', 'en', 'es', 'ar'];

export function LanguageSelector() {
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setOpen(!open)}>
        <Text style={styles.buttonText}>{LANGUAGE_NAMES[language]}</Text>
        <Text style={styles.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.option, language === lang && styles.optionActive]}
              onPress={() => { setLanguage(lang); setOpen(false); }}
            >
              <Text style={[styles.optionText, language === lang && styles.optionTextActive]}>
                {LANGUAGE_NAMES[lang]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', zIndex: 100 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: { color: '#22c55e', fontSize: 12, fontWeight: '600' },
  arrow: { color: '#22c55e', fontSize: 10 },
  dropdown: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#222',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    minWidth: 130,
  },
  option: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  optionActive: { backgroundColor: '#22c55e20' },
  optionText: { color: '#ccc', fontSize: 13 },
  optionTextActive: { color: '#22c55e', fontWeight: 'bold' },
});
