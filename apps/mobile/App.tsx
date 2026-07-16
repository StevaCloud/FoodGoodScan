import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';
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

  return (
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
  );
}
