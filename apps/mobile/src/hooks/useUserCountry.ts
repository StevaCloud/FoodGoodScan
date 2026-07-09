import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { detectCountry, getCurrencyInfo, Country, CurrencyInfo } from '../utils/countryDetection';

export interface UserCountry {
  country: Country;
  currency: CurrencyInfo;
}

export function useUserCountry(): UserCountry {
  const phone = useStore((s) => s.user?.phone);
  const postalCode = useStore((s) => s.postalCode);

  return useMemo(() => {
    const country = detectCountry(phone, postalCode || '');
    const currency = getCurrencyInfo(country);
    return { country, currency };
  }, [phone, postalCode]);
}
