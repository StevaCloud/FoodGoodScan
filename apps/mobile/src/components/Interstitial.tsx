import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { APPLOVIN_SDK_KEY, AD_UNIT_IDS, ADS_TEST_MODE } from '../config/ads';

// AppLovin MAX — natif seulement
let AppLovinMAX: any = null;
if (Platform.OS !== 'web') {
  try {
    const sdk = require('react-native-applovin-max');
    AppLovinMAX = sdk.default || sdk.AppLovinMAX;
  } catch {}
}

let triggerCount = 0;
let showInterstitialFn: (() => void) | null = null;

export function triggerInterstitial() {
  triggerCount++;
  if (triggerCount % 3 === 0) {
    showInterstitialFn?.();
  }
}

export function InterstitialProvider({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);

  // Initialise AppLovin MAX une seule fois
  useEffect(() => {
    if (Platform.OS === 'web' || isPremium || !AppLovinMAX || initialized.current) return;
    initialized.current = true;

    AppLovinMAX.initialize(APPLOVIN_SDK_KEY, (config: any) => {
      if (ADS_TEST_MODE) AppLovinMAX.setIsAgeRestrictedUser(false);

      if (AD_UNIT_IDS.interstitial) {
        AppLovinMAX.setInterstitialListener({
          onInterstitialLoaded: () => setReady(true),
          onInterstitialLoadFailed: () => setReady(false),
          onInterstitialHidden: () => {
            setReady(false);
            // Précharge la prochaine pub
            if (AD_UNIT_IDS.interstitial) AppLovinMAX.loadInterstitial(AD_UNIT_IDS.interstitial);
          },
        });
        AppLovinMAX.loadInterstitial(AD_UNIT_IDS.interstitial);
      }
    });
  }, [isPremium]);

  const show = useCallback(() => {
    if (isPremium || Platform.OS === 'web' || !AppLovinMAX || !AD_UNIT_IDS.interstitial) return;
    AppLovinMAX.isInterstitialReady(AD_UNIT_IDS.interstitial).then((isReady: boolean) => {
      if (isReady) AppLovinMAX.showInterstitial(AD_UNIT_IDS.interstitial);
    });
  }, [isPremium]);

  useEffect(() => {
    showInterstitialFn = show;
    return () => { showInterstitialFn = null; };
  }, [show]);

  return <>{children}</>;
}
