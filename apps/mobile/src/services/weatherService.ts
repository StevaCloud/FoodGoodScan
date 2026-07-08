interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  city: string;
  weatherCode: number;
}

export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const [weatherRes, geoRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`),
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, { headers: { 'User-Agent': 'FoodGoodScan/1.0' } }),
    ]);
    const data = await weatherRes.json();
    const geoData = await geoRes.json();
    const temp = Math.round(data.current?.temperature_2m ?? 20);
    const code = data.current?.weathercode ?? 0;
    const addr = geoData.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
    return {
      temperature: temp,
      weatherCode: code,
      description: weatherCodeToDesc(code),
      icon: weatherCodeToIcon(code),
      city,
    };
  } catch {
    return null;
  }
}

export async function getWeatherByPostalCode(postalCode: string): Promise<WeatherData | null> {
  try {
    // Géocode le code postal via nominatim
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postalCode)}&country=CA&format=json&limit=1`,
      { headers: { 'User-Agent': 'FoodGoodScan/1.0' } }
    );
    const geoData = await geoRes.json();
    if (!geoData.length) return null;
    const { lat, lon } = geoData[0];
    const weather = await getWeatherByCoords(parseFloat(lat), parseFloat(lon));
    if (weather) weather.city = geoData[0].display_name?.split(',')[0] || '';
    return weather;
  } catch {
    return null;
  }
}

export async function getCurrentWeather(postalCode?: string): Promise<WeatherData | null> {
  // Essaie d'abord la géolocalisation du navigateur
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const w = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          resolve(w);
        },
        async () => {
          // Fallback sur le code postal
          if (postalCode) {
            const w = await getWeatherByPostalCode(postalCode);
            resolve(w);
          } else {
            resolve(null);
          }
        },
        { timeout: 5000 }
      );
    });
  }
  if (postalCode) return getWeatherByPostalCode(postalCode);
  return null;
}

function weatherCodeToDesc(code: number): string {
  if (code === 0) return 'Ensoleillé';
  if (code <= 3) return 'Partiellement nuageux';
  if (code <= 49) return 'Brouillard';
  if (code <= 69) return 'Pluie';
  if (code <= 79) return 'Neige';
  if (code <= 99) return 'Orageux';
  return 'Variable';
}

function weatherCodeToIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 49) return '🌫️';
  if (code <= 69) return '🌧️';
  if (code <= 79) return '❄️';
  if (code <= 99) return '⛈️';
  return '🌤️';
}
