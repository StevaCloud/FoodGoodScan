import { useStore } from '../store/useStore';

function isSunsetNow(): boolean {
  const d = new Date();
  const total = d.getHours() * 60 + d.getMinutes();
  return total >= 18 * 60 + 30 && total < 21 * 60;
}

export function useWeatherBg(): string {
  const weatherData = useStore((s) => s.weatherData);
  const code = weatherData?.weatherCode ?? 0;
  if (code <= 3 && isSunsetNow()) return '#7b1f5a';
  if (code <= 3) return '#3b95ed';
  if (code <= 49) return '#1a1f2e';
  if (code <= 69) return '#0d1a30';
  if (code <= 79) return '#101929';
  return '#080d1f';
}

export function useWeatherText(): { title: string; body: string } {
  const weatherData = useStore((s) => s.weatherData);
  const code = weatherData?.weatherCode ?? 0;
  const isLight = code <= 3;
  return {
    title: isLight ? '#000' : '#fff',
    body: isLight ? '#222' : '#aaa',
  };
}
