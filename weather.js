// Current weather from Open-Meteo (free, no API key), plus an outline icon for it.
const API = 'https://api.open-meteo.com/v1/forecast';
const CACHE_MS = 10 * 60 * 1000;
let cache = null;

function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Platstjänst saknas'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      reject,
      { maximumAge: CACHE_MS, timeout: 15000, enableHighAccuracy: false },
    );
  });
}

export async function fetchWeather() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  const { lat, lon } = await locate();
  // Rounded to about 1 km: plenty for weather, and less precise than the phone knows.
  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    current: 'temperature_2m,weather_code,is_day',
  });
  const response = await fetch(API + '?' + params);
  if (!response.ok) throw new Error('Open-Meteo svarade ' + response.status);
  const c = (await response.json()).current;
  const [kind, label] = CODES[c.weather_code] || ['clouds', 'Okänt väder'];
  const data = { kind, label, temp: c.temperature_2m, isDay: c.is_day === 1 };
  cache = { at: Date.now(), data };
  return data;
}

// WMO weather codes → icon and Swedish description.
const CODES = {
  0: ['clear', 'Klart'],
  1: ['partly', 'Mestadels klart'],
  2: ['partly', 'Halvklart'],
  3: ['clouds', 'Mulet'],
  45: ['fog', 'Dimma'],
  48: ['fog', 'Rimfrost och dimma'],
  51: ['rain', 'Lätt duggregn'],
  53: ['rain', 'Duggregn'],
  55: ['rain', 'Tätt duggregn'],
  56: ['rain', 'Underkylt duggregn'],
  57: ['rain', 'Underkylt duggregn'],
  61: ['rain', 'Lätt regn'],
  63: ['rain', 'Regn'],
  65: ['rain', 'Kraftigt regn'],
  66: ['rain', 'Underkylt regn'],
  67: ['rain', 'Kraftigt underkylt regn'],
  71: ['snow', 'Lätt snöfall'],
  73: ['snow', 'Snöfall'],
  75: ['snow', 'Kraftigt snöfall'],
  77: ['snow', 'Snökorn'],
  80: ['rain', 'Regnskurar'],
  81: ['rain', 'Kraftiga regnskurar'],
  82: ['rain', 'Skyfall'],
  85: ['snow', 'Snöbyar'],
  86: ['snow', 'Kraftiga snöbyar'],
  95: ['thunder', 'Åska'],
  96: ['thunder', 'Åska med hagel'],
  99: ['thunder', 'Kraftig åska med hagel'],
};

// Outline icons on a 24×24 grid, drawn with round strokes (shapes after Lucide, ISC licence).
const CLOUD_TOP = '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.24"/>';
const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  cloudSun: '<path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.95 12.65a4 4 0 0 0-5.93-4.13"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
  cloudMoon: '<path d="M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z"/><path d="M10.1 9A6 6 0 0 1 16 4a4 4 0 0 0 6 6 6 6 0 0 1-3 5.2"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  fog: CLOUD_TOP + '<path d="M16 17H7M17 21H9"/>',
  rain: CLOUD_TOP + '<path d="M16 14v6M8 14v6M12 16v6"/>',
  snow: CLOUD_TOP + '<path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01"/>',
  thunder: '<path d="M6 16.33A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 .5 8.97"/><path d="m13 12-3 5h4l-3 5"/>',
};

export function weatherIcon(data) {
  if (data.kind === 'clear') return data.isDay ? ICONS.sun : ICONS.moon;
  if (data.kind === 'partly') return data.isDay ? ICONS.cloudSun : ICONS.cloudMoon;
  return ICONS[data.kind] || ICONS.cloud;
}

export function weatherText(data) {
  return `${data.label}, ${Math.round(data.temp)}°`;
}

// When the weather could not be fetched: a sad cloud.
export const SAD_ICON = '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M10 12.5h.01M14.5 12.5h.01"/><path d="M14.8 16.6s-1-1.4-2.6-1.4-2.6 1.4-2.6 1.4"/>';

// The button's own icon: a sun behind a cloud.
export const BUTTON_ICON = ICONS.cloudSun;
