import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Text } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { ProductScreen } from '../screens/ProductScreen';
import { DealsScreen } from '../screens/DealsScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WaterScreen } from '../screens/WaterScreen';
import { GroceryListScreen } from '../screens/GroceryListScreen';
import { DietScreen } from '../screens/DietScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Accueil: 'H',
    Scanner: 'S',
    Explorer: 'E',
    Soldes: '$',
    Régime: 'R',
    Liste: 'L',
    Profil: 'P',
  };
  return (
    <Text style={{ color: focused ? '#22c55e' : '#666', fontSize: 18, fontWeight: 'bold' }}>
      {icons[label] || label[0]}
    </Text>
  );
}

function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#333', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#666',
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Régime" component={DietScreen} options={{ tabBarLabel: 'Régime' }} />
      <Tab.Screen name="Accueil" component={HomeScreen} options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen name="Scanner" component={ScannerScreen} options={{ tabBarLabel: t('nav.scanner') }} />
      <Tab.Screen name="Explorer" component={ExploreScreen} options={{ tabBarLabel: t('nav.explore') }} />
      <Tab.Screen name="Soldes" component={DealsScreen} options={{ tabBarLabel: t('nav.deals') }} />
      <Tab.Screen name="Liste" component={GroceryListScreen} options={{ tabBarLabel: t('nav.list') }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const onboarded = useStore((s) => s.onboarded);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !onboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Water"
              component={WaterScreen}
              options={{
                headerShown: true,
                headerTitle: 'Analyse pH',
                headerStyle: { backgroundColor: '#111' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="Product"
              component={ProductScreen}
              options={{
                headerShown: true,
                headerTitle: 'Détails du produit',
                headerStyle: { backgroundColor: '#111' },
                headerTintColor: '#fff',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
