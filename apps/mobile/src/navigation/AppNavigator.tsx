import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Text, View, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { InterstitialProvider, triggerInterstitial } from '../components/Interstitial';
import { SubscriptionSuccessScreen } from '../screens/SubscriptionSuccessScreen';
import { SubscriptionCancelScreen } from '../screens/SubscriptionCancelScreen';

import { HomeScreen } from '../screens/HomeScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { ProductScreen } from '../screens/ProductScreen';
import { DealsScreen } from '../screens/DealsScreen';

import { ProfileScreen } from '../screens/ProfileScreen';
import { WaterScreen } from '../screens/WaterScreen';
import { GroceryListScreen } from '../screens/GroceryListScreen';
import { DietScreen } from '../screens/DietScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SteamParticle({ delay, x }: { delay: number; x: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.7, 0] });
  const scaleX     = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.4, 0.8] });
  return (
    <Animated.View style={{
      position: 'absolute', bottom: 20, left: x,
      width: 3, height: 5, borderRadius: 2, backgroundColor: '#aaa',
      opacity, transform: [{ translateY }, { scaleX }],
    }} />
  );
}

function DietIcon({ focused }: { focused: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(2000),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: 30, height: 32, alignItems: 'center', justifyContent: 'flex-end' }}>
      <SteamParticle delay={0}   x={5} />
      <SteamParticle delay={350} x={12} />
      <SteamParticle delay={700} x={19} />
      <Animated.Text style={{ fontSize: focused ? 22 : 20, transform: [{ scale }] }}>🍜</Animated.Text>
    </View>
  );
}

function QuestionMark({ delay, x, y }: { delay: number; x: number; y: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(anim, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(1400),
      ])
    ).start();
  }, []);
  const opacity    = anim.interpolate({ inputRange: [0, 0.3, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [4, -4] });
  const scale      = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.6] });
  return (
    <Animated.Text style={{
      position: 'absolute', left: x, top: y,
      fontSize: 9, fontWeight: '900', color: '#a78bfa',
      opacity, transform: [{ translateY }, { scale }],
    }}>?</Animated.Text>
  );
}

function QuizIcon() {
  const scale  = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(scale,  { toValue: 1.2,  duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale,  { toValue: 1,    duration: 160, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        Animated.delay(120),
        Animated.timing(scale,  { toValue: 1.2,  duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale,  { toValue: 1,    duration: 160, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1,  duration: 80, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0,  duration: 80, useNativeDriver: true }),
        Animated.delay(2000),
      ])
    ).start();
  }, []);

  const rotateStr = rotate.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });

  return (
    <View style={{ width: 38, height: 36, alignItems: 'center', justifyContent: 'center' }}>
      <QuestionMark delay={0}    x={0}  y={4}  />
      <QuestionMark delay={800}  x={28} y={2}  />
      <QuestionMark delay={1500} x={14} y={-3} />
      <Animated.Text style={{ fontSize: 20, transform: [{ scale }, { rotate: rotateStr }] }}>🧠</Animated.Text>
    </View>
  );
}

function GiftIcon() {
  const rotation  = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        // Saut
        Animated.timing(translateY, { toValue: -10, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0,   duration: 180, easing: Easing.in(Easing.bounce), useNativeDriver: true }),
        Animated.delay(80),
        // Balancement
        Animated.timing(rotation,  { toValue: 1,  duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(rotation,  { toValue: -1, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(rotation,  { toValue: 1,  duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(rotation,  { toValue: 0,  duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(1600),
      ])
    ).start();
  }, []);

  const rotate = rotation.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] });

  return (
    <Animated.Text style={{ fontSize: 20, transform: [{ translateY }, { rotate }] }}>🎁</Animated.Text>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#22c55e' : '#666';
  return <Ionicons name="person-circle-outline" size={24} color={color} />;
}

function ListeIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#22c55e' : '#666';
  const checkAnim = useRef(new Animated.Value(0)).current;
  const checkIdx  = useRef(new Animated.Value(0)).current;
  const [checkedRow, setCheckedRow] = React.useState(-1);

  useEffect(() => {
    const sequence = [0, 1, 2].flatMap((i) => [
      Animated.delay(i === 0 ? 1200 : 400),
      Animated.timing(checkAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.timing(checkIdx,  { toValue: i, duration: 0, useNativeDriver: true }),
      Animated.timing(checkAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
    ]);
    Animated.loop(Animated.sequence([...sequence, Animated.delay(1400)])).start();
  }, []);

  useEffect(() => {
    const id = checkIdx.addListener(({ value }) => setCheckedRow(Math.round(value)));
    return () => checkIdx.removeListener(id);
  }, []);

  const checkScale = checkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <View style={{ width: 22, height: 24, justifyContent: 'center', gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          {/* Checkbox */}
          <View style={{ width: 7, height: 7, borderRadius: 2, borderWidth: 1.2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
            {checkedRow >= i && (
              <Animated.View style={{
                width: 4, height: 4, borderRadius: 1,
                backgroundColor: '#22c55e',
                transform: [{ scale: checkedRow === i ? checkScale : 1 }],
              }} />
            )}
          </View>
          {/* Ligne de texte */}
          <View style={{ height: 1.5, borderRadius: 1, backgroundColor: color, opacity: 0.7, width: checkedRow >= i ? 10 : 13 }} />
        </View>
      ))}
    </View>
  );
}

function HomeIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#22c55e' : '#666';
  return (
    <View style={{ alignItems: 'center', width: 22, height: 20 }}>
      {/* Toit */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 9,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
        marginBottom: 0,
      }} />
      {/* Corps */}
      <View style={{ width: 16, height: 11, backgroundColor: color, borderRadius: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* Porte */}
        <View style={{ width: 5, height: 6, backgroundColor: focused ? '#111' : '#1a1a1a', borderRadius: 1, marginBottom: 0 }} />
      </View>
    </View>
  );
}

function BarcodeIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#22c55e' : '#666';
  const bars = [2, 1, 3, 1, 2, 1, 3, 1, 2, 1, 3, 1, 2];
  const scanY   = useRef(new Animated.Value(0)).current;
  const scanOp  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        // Apparaît en haut
        Animated.timing(scanOp, { toValue: 1, duration: 0, useNativeDriver: true }),
        // Descend vers le bas
        Animated.timing(scanY,  { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }),
        // Remonte vers le haut
        Animated.timing(scanY,  { toValue: 0, duration: 700, easing: Easing.linear, useNativeDriver: true }),
        // Disparaît
        Animated.timing(scanOp, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.delay(500),
      ])
    ).start();
  }, []);

  const laserY = scanY.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });

  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'stretch', height: 16, gap: 1, position: 'relative' }}>
        {bars.map((w, i) => (
          <View key={i} style={{ width: w, backgroundColor: color, borderRadius: 0.5 }} />
        ))}
        {/* Trait laser qui balaie */}
        <Animated.View style={{
          position: 'absolute', left: -1, right: -1, height: 1.5, borderRadius: 1,
          backgroundColor: '#ef4444',
          shadowColor: '#ef4444', shadowOpacity: 1, shadowRadius: 3,
          opacity: scanOp,
          transform: [{ translateY: laserY }],
        }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        <View style={{ width: 6, height: 2, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: 8, height: 2, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: 6, height: 2, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function SoldesIcon({ focused }: { focused: boolean }) {
  const flip    = useRef(new Animated.Value(1)).current;
  const pageCol = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(flip, { toValue: 0, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(pageCol, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(flip, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(1000),
        Animated.timing(flip, { toValue: 0, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(pageCol, { toValue: 2, duration: 0, useNativeDriver: true }),
        Animated.timing(flip, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(1000),
        Animated.timing(flip, { toValue: 0, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(pageCol, { toValue: 3, duration: 0, useNativeDriver: true }),
        Animated.timing(flip, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(1000),
        Animated.timing(flip, { toValue: 0, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(pageCol, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(flip, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(1200),
      ])
    ).start();
  }, []);

  const scaleX = flip.interpolate({ inputRange: [0, 1], outputRange: [0.05, 1] });
  const accent = focused ? '#22c55e' : '#666';

  const stores = [
    { color: '#16a34a', label: 'Loblaws', line1: 'L',     line2: 'LOBLAWS', s1: 11, s2: 4  },
    { color: '#ea580c', label: 'Super C', line1: 'SUPER', line2: 'C',       s1: 5,  s2: 10 },
    { color: '#1d4ed8', label: 'Maxi',   line1: 'MAXI',  line2: '‰',       s1: 8,  s2: 7  },
    { color: '#dc2626', label: 'IGA',    line1: 'IGA',   line2: '★',       s1: 10, s2: 6  },
  ];
  const [colIdx, setColIdx] = React.useState(0);
  useEffect(() => {
    const id = pageCol.addListener(({ value }) => setColIdx(Math.round(value)));
    return () => pageCol.removeListener(id);
  }, []);
  const store = stores[colIdx % stores.length];

  return (
    <View style={{ width: 24, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      {/* Pages derrière */}
      <View style={{ position: 'absolute', width: 16, height: 20, backgroundColor: '#2a2a2a', borderRadius: 3, top: 2, left: 5 }} />
      <View style={{ position: 'absolute', width: 16, height: 20, backgroundColor: '#333', borderRadius: 3, top: 1, left: 3 }} />

      {/* Page du dessus qui flip */}
      <Animated.View style={{
        width: 18, height: 22, backgroundColor: store.color,
        borderRadius: 3, alignItems: 'center', justifyContent: 'center',
        transform: [{ scaleX }], overflow: 'hidden', gap: 1,
      }}>
        <Text style={{ color: '#fff', fontSize: store.s1, fontWeight: '900', letterSpacing: 0.5, lineHeight: store.s1 + 2 }}>{store.line1}</Text>
        <View style={{ width: 12, height: 0.8, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
        <Text style={{ color: '#fff', fontSize: store.s2, fontWeight: '900', letterSpacing: 0.3, lineHeight: store.s2 + 2, opacity: 0.9 }}>{store.line2}</Text>
      </Animated.View>
    </View>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Accueil: 'H',
    Soldes: '$',
    Régime: 'R',
    Liste: 'L',
    Profil: 'P',
    Récompenses: '🎁',
    Quiz: '🧠',
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
    <InterstitialProvider>
    <View style={{ flex: 1, backgroundColor: '#111' }}>
      <Tab.Navigator
        screenListeners={{ tabPress: () => triggerInterstitial() }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: 'rgba(12,12,12,0.96)', borderTopColor: '#1f1f1f', height: 48, paddingBottom: 4 },
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#555',
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen name="Accueil"      component={HomeScreen}        options={{ tabBarLabel: t('nav.home'), tabBarIcon: ({ focused }) => <HomeIcon focused={focused} /> }} />
        <Tab.Screen name="Scanner"      component={ScannerScreen}     options={{ tabBarLabel: t('nav.scanner'), tabBarIcon: ({ focused }) => <BarcodeIcon focused={focused} /> }} />
        <Tab.Screen name="Récompenses"  component={RewardsScreen}     options={{ tabBarLabel: 'Coupon', tabBarIcon: () => <GiftIcon /> }} />
        <Tab.Screen name="Soldes"       component={DealsScreen}       options={{ tabBarLabel: t('nav.deals'), tabBarIcon: ({ focused }) => <SoldesIcon focused={focused} /> }} />
        <Tab.Screen name="Liste"        component={GroceryListScreen} options={{ tabBarLabel: 'Liste', tabBarIcon: ({ focused }) => <ListeIcon focused={focused} /> }} />
        <Tab.Screen name="Régime"       component={DietScreen}        options={{ tabBarLabel: 'Régime', tabBarIcon: ({ focused }) => <DietIcon focused={focused} /> }} />
        <Tab.Screen name="Quiz"         component={QuizScreen}        options={{ tabBarLabel: 'Quiz', tabBarIcon: () => <QuizIcon /> }} />
        <Tab.Screen name="Profil"       component={ProfileScreen}     options={{ tabBarLabel: t('nav.profile'), tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} /> }} />
      </Tab.Navigator>
    </View>
    </InterstitialProvider>
  );
}

export function AppNavigator() {
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const onboarded = useStore((s) => s.onboarded);

  const linking = {
    prefixes: ['http://localhost:8081', 'http://localhost:8082', 'http://localhost:19006'],
    config: {
      screens: {
        SubscriptionSuccess: 'subscription-success',
        SubscriptionCancel: 'subscription-cancel',
        Main: '',
        Login: 'login',
        Onboarding: 'onboarding',
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <View style={{ flex: 1, backgroundColor: '#111' }}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#111' } }}>
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
            <Stack.Screen name="SubscriptionSuccess" component={SubscriptionSuccessScreen} />
            <Stack.Screen name="SubscriptionCancel" component={SubscriptionCancelScreen} />
          </>
        )}
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}
