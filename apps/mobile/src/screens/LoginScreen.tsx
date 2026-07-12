import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { login, register, setAuthToken, forgotPassword, resetPassword } from '../services/api';
import { useStore } from '../store/useStore';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const setUser = useStore((s) => s.setUser);
  const setToken = useStore((s) => s.setToken);
  const { t } = useTranslation();

  const showError = (msg: string) => { setErrorMsg(msg); setSuccessMsg(''); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setErrorMsg(''); };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email || !password) { showError(t('login.error.fields')); return; }
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await login(email, password)
        : await register(email, password);
      setToken(data.token);
      setAuthToken(data.token);
      setUser(data.user);
      if (mode === 'register' && data.trial) {
        showSuccess(`Bienvenue ! Tu bénéficies de ${data.trial.days} jours d'essai Premium GRATUIT.`);
      }
    } catch (error: any) {
      showError(error.response?.data?.error || t('login.error.connection'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (!resetEmail) { showError('Entre ton adresse email'); return; }
    setLoading(true);
    try {
      const data = await forgotPassword(resetEmail);
      if (data.code) {
        showSuccess(`Ton code est : ${data.code}`);
        setTimeout(() => setMode('reset'), 2000);
      } else {
        showSuccess(data.message || 'Code envoyé — vérifie ta boîte email.');
        setTimeout(() => setMode('reset'), 2000);
      }
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (!resetEmail) { showError('Entre ton adresse email'); return; }
    if (!resetCode) { showError('Entre le code à 6 chiffres reçu par email'); return; }
    if (!newPassword) { showError('Entre ton nouveau mot de passe'); return; }
    if (newPassword.length < 6) { showError('Le mot de passe doit faire au moins 6 caractères'); return; }
    if (newPassword !== confirmPassword) { showError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      await resetPassword(resetEmail, resetCode, newPassword);
      showSuccess('Mot de passe réinitialisé ! Redirection...');
      setTimeout(() => {
        setMode('login');
        setResetCode(''); setNewPassword(''); setConfirmPassword('');
        setErrorMsg(''); setSuccessMsg('');
      }, 2000);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Code invalide ou expiré — demande un nouveau code');
    } finally {
      setLoading(false);
    }
  };

  const ErrorBox = () => errorMsg ? (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>⚠ {errorMsg}</Text>
    </View>
  ) : null;

  const SuccessBox = () => successMsg ? (
    <View style={styles.successBox}>
      <Text style={styles.successText}>✓ {successMsg}</Text>
    </View>
  ) : null;

  if (mode === 'forgot') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.langRow}><LanguageSelector /></View>
          <Text style={styles.logo}>FoodGoodScan</Text>
          <Text style={styles.subtitle}>Mot de passe oublié</Text>
          <Text style={styles.hint}>Entre ton adresse email — tu vas recevoir un code par email.</Text>

          <ErrorBox />
          <SuccessBox />

          <TextInput
            style={styles.input}
            placeholder="Adresse email"
            placeholderTextColor="#666"
            value={resetEmail}
            onChangeText={setResetEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleForgot}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Envoi en cours...' : 'Envoyer le code'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}>
            <Text style={styles.switchText}>← Retour à la connexion</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.alreadyHaveCode} onPress={() => { setMode('reset'); setErrorMsg(''); setSuccessMsg(''); }}>
            <Text style={styles.alreadyHaveCodeText}>J'ai déjà un code</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (mode === 'reset') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.langRow}><LanguageSelector /></View>
          <Text style={styles.logo}>FoodGoodScan</Text>
          <Text style={styles.subtitle}>Nouveau mot de passe</Text>
          <Text style={styles.hint}>Entre le code reçu par email et ton nouveau mot de passe.</Text>

          <ErrorBox />
          <SuccessBox />

          <TextInput
            style={styles.input}
            placeholder="Adresse email"
            placeholderTextColor="#666"
            value={resetEmail}
            onChangeText={setResetEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Code à 6 chiffres (reçu par email)"
            placeholderTextColor="#666"
            value={resetCode}
            onChangeText={setResetCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TextInput
            style={styles.input}
            placeholder="Nouveau mot de passe (min. 6 caractères)"
            placeholderTextColor="#666"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}>
            <Text style={styles.switchText}>← Renvoyer un code</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.langRow}><LanguageSelector /></View>
        <Text style={styles.logo}>{t('app.name')}</Text>
        <Text style={styles.subtitle}>{mode === 'login' ? t('login.title') : t('login.register')}</Text>

        <ErrorBox />
        <SuccessBox />


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

        {mode === 'login' && (
          <TouchableOpacity onPress={() => { setResetEmail(email); setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Mot de passe oublié?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '...' : mode === 'login' ? t('login.submit') : t('login.register.submit')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrorMsg(''); setSuccessMsg(''); }}>
          <Text style={styles.switchText}>
            {mode === 'login' ? t('login.switch.register') : t('login.switch.login')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 32 },
  langRow: { alignItems: 'flex-end', marginBottom: 20, zIndex: 100 },
  logo: { color: '#22c55e', fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 12 },
  hint: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  errorBox: {
    backgroundColor: '#3b0a0a',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  successBox: {
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successText: { color: '#22c55e', fontSize: 14, textAlign: 'center' },
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
  forgotRow: { alignItems: 'flex-end', marginBottom: 8, marginTop: -4 },
  forgotText: { color: '#22c55e', fontSize: 13 },
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
  alreadyHaveCode: { marginTop: 12 },
  alreadyHaveCodeText: { color: '#888', textAlign: 'center', fontSize: 13 },
  phoneHint: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: -4, marginBottom: 12 },
});
