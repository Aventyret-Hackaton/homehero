// Philips Hue Bridge client (local API v1). Settings are stored in localStorage on the device.
const KEY = 'homehero-hue';
const SEND_INTERVAL_MS = 250;

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (_) {
    return {};
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch (_) {
    // Storage unavailable; settings last for this session only.
  }
}

// Creates an application key. The link button on the bridge must be pressed first.
export async function pair(bridge) {
  const response = await fetch('https://' + bridge + '/api', {
    method: 'POST',
    body: JSON.stringify({ devicetype: 'homehero#browser' }),
  });
  const [result] = await response.json();
  if (result.error) {
    throw new Error(result.error.description);
  }
  return result.success.username;
}

// Uses API v1: the bridge rejects the custom header that v2 needs in browser (CORS) requests.
export function createHue(settings) {
  const base = 'https://' + (settings.bridge || '') + '/api/' + (settings.key || '');
  const enabled = Boolean(settings.bridge && settings.key);
  let lastPct = null;
  let lastSent = 0;

  return {
    hasLight: enabled && Boolean(settings.light),

    async listLights() {
      const response = await fetch(base + '/lights');
      const lights = await response.json();
      if (Array.isArray(lights)) {
        throw new Error(lights[0]?.error?.description || 'Okänt fel från bryggan');
      }
      return Object.entries(lights).map(([id, light]) => ({ id, name: light.name }));
    },

    // Sends at most one call per interval and only when the value changed.
    setLight(level) {
      const pct = Math.round(level * 100);
      const now = performance.now();
      if (pct === lastPct || now - lastSent < SEND_INTERVAL_MS) return;
      lastPct = pct;
      lastSent = now;
      const state = pct === 0 ? { on: false } : { on: true, bri: Math.max(1, Math.round(pct * 2.54)) };
      fetch(base + '/lights/' + settings.light + '/state', {
        method: 'PUT',
        body: JSON.stringify(state),
      }).catch(() => {});
    },
  };
}
