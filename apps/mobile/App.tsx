import { useEffect, useState, Component } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ScrollView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';

class ErrorBoundary extends Component<{ children: any }, { error: any }> {
  state = { error: null };
  static getDerivedStateFromError(error: any) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: '#ff4444', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>CRASH DÉTECTÉ</Text>
          <ScrollView>
            <Text style={{ color: '#fff', fontSize: 12 }}>{String((this.state.error as any)?.message)}</Text>
            <Text style={{ color: '#aaa', fontSize: 10, marginTop: 10 }}>{String((this.state.error as any)?.stack)}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
import { detectPostalCode } from './src/services/location';
import { setAuthToken } from './src/services/api';
import { getCurrentWeather } from './src/services/weatherService';
import { calculateWaterIntake } from './src/services/waterIntakeService';
import { WaterDropNotification } from './src/components/WaterDropNotification';
import { ToastProvider } from './src/components/Toast';

interface ActiveReminder {
  message: string;
  ml: number;
  temperature?: number;
  weatherIcon?: string;
}

const shownWaterNotifs = new Set<string>();

export default function App() {
  const setPostalCode = useStore((s) => s.setPostalCode);
  const postalCode = useStore((s) => s.postalCode);
  const token = useStore((s) => s.token);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const healthProfile = useStore((s) => s.healthProfile);
  const setWeatherData = useStore((s) => s.setWeatherData);
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);
  const [weather, setWeather] = useState<{ temperature: number; icon: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Cacher le splash screen une fois que le store AsyncStorage est hydraté
  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
      SplashScreen.hideAsync();
      return;
    }
    const unsub = useStore.persist.onFinishHydration(() => {
      setHydrated(true);
      SplashScreen.hideAsync();
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  useEffect(() => {
    if (!postalCode) {
      detectPostalCode().then((code) => setPostalCode(code));
    }
  }, []);

  // Charger la météo quand l'utilisateur est connecté
  useEffect(() => {
    if (!isLoggedIn) return;
    getCurrentWeather(postalCode || undefined).then((w) => {
      if (w) {
        setWeather({ temperature: w.temperature, icon: w.icon });
        setWeatherData({ temperature: w.temperature, weatherCode: w.weatherCode, icon: w.icon, description: w.description, city: w.city || '' });
      }
    });
  }, [isLoggedIn, postalCode]);

  // Démarrer le planificateur de rappels eau
  useEffect(() => {
    if (!isLoggedIn || !healthProfile) return;

    const weight = parseFloat(healthProfile.weight) || 154;
    const height = parseFloat(healthProfile.height) || 170;
    const temp = weather?.temperature ?? 20;

    const plan = calculateWaterIntake(
      weight,
      height,
      healthProfile.activityLevel || 'moderate',
      healthProfile.diet || 'none',
      temp,
      healthProfile.gender || 'male'
    );

    const checkReminders = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();

      const match = plan.schedule.find(
        (r) => r.hour === h && r.minute === m
      );

      if (match) {
        const key = `${now.toDateString()}_${h}`;
        if (shownWaterNotifs.has(key)) return;
        shownWaterNotifs.add(key);
        setActiveReminder({
          message: match.message,
          ml: match.ml,
          temperature: weather?.temperature,
          weatherIcon: weather?.icon,
        });
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, healthProfile, weather]);

  if (!hydrated) return null;

  return (
    <ErrorBoundary>
      <ToastProvider>
        <StatusBar style="light" />
        <AppNavigator />
        {activeReminder && (
          <WaterDropNotification
            message={activeReminder.message}
            ml={activeReminder.ml}
            temperature={activeReminder.temperature}
            weatherIcon={activeReminder.weatherIcon}
            onDismiss={() => setActiveReminder(null)}
          />
        )}
      </ToastProvider>
    </ErrorBoundary>
  );
}
