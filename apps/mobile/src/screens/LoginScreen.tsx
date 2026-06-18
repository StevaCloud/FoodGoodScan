import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { login, register, setAuthToken } from '../services/api';
import { useStore } from '../store/useStore';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';

export function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const setUser = useStore((s) => s.setUser);
  const setToken = useStore((s) => s.setToken);
  const { t } = useTranslation();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('login.error.fields'));
      return;
    }

    setLoading(true);
    try {
      const data = isLogin
        ? await login(email, password)
        : await register(email, password, name);

      setToken(data.token);
      setAuthToken(data.token);
      setUser(data.user);
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.error || t('login.error.connection'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.langRow}><LanguageSelector /></View>
      <Text style={styles.logo}>{t('app.name')}</Text>
      <Text style={styles.subtitle}>{isLogin ? t('login.title') : t('login.register')}</Text>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder={t('login.name')}
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder={t('login.email')}
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={t('login.password')}
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '...' : isLogin ? t('login.submit') : t('login.register.submit')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? t('login.switch.register') : t('login.switch.login')}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    padding: 32,
  },
  langRow: { alignItems: 'flex-end', marginBottom: 20, zIndex: 100 },
  logo: { color: '#22c55e', fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  switchText: { color: '#22c55e', textAlign: 'center', marginTop: 20, fontSize: 14 },
});
