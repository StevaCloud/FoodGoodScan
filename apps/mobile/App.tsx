import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';
import { detectPostalCode } from './src/services/location';

export default function App() {
  const setPostalCode = useStore((s) => s.setPostalCode);
  const postalCode = useStore((s) => s.postalCode);

  useEffect(() => {
    if (!postalCode) {
      detectPostalCode().then((code) => {
        setPostalCode(code);
        console.log('Detected postal code:', code);
      });
    }
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
