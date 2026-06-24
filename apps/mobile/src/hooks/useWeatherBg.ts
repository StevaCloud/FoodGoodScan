import { useStore } from '../store/useStore';

export function useWeatherBg(): string {
  const weatherData = useStore((s) => s.weatherData);
  const code = weatherData?.weatherCode ?? 0;
  if (code <= 3) return '#3b95ed';
  if (code <= 49) return '#1a1f2e';
  if (code <= 69) return '#0d1a30';
  if (code <= 79) return '#101929';
  return '#080d1f';
}

export function useWeatherBgStyle() {
  const bg = useWeatherBg();
  return { flex: 1, backgroundColor: bg, position: 'relative' as const };
}
