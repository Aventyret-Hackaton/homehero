// Home Assistant REST client. Settings are stored in localStorage on the device.
const KEY = 'homehero-ha';
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

export function createHa(settings) {
  const base = (settings.url || '').replace(/\/+$/, '');
  const enabled = Boolean(base && settings.token);
  const last = { light: null, volume: null };
  const lastSent = { light: 0, volume: 0 };

  async function request(path, body) {
    const response = await fetch(base + path, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: 'Bearer ' + settings.token,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error('Home Assistant svarade ' + response.status);
    }
    return response.json();
  }

  const callService = (domain, service, data) =>
    request('/api/services/' + domain + '/' + service, data);

  // Sends at most one call per interval and only when the value changed.
  function throttled(name, value, send) {
    const now = performance.now();
    if (value === last[name] || now - lastSent[name] < SEND_INTERVAL_MS) return;
    last[name] = value;
    lastSent[name] = now;
    send().catch(() => {});
  }

  return {
    hasLight: enabled && Boolean(settings.light),
    hasMedia: enabled && Boolean(settings.media),

    setLight(level) {
      const pct = Math.round(level * 100);
      throttled('light', pct, () =>
        pct === 0
          ? callService('light', 'turn_off', { entity_id: settings.light })
          : callService('light', 'turn_on', {
              entity_id: settings.light,
              brightness_pct: pct,
            }),
      );
    },

    setVolume(level) {
      const pct = Math.round(level * 100);
      throttled('volume', pct, () =>
        callService('media_player', 'volume_set', {
          entity_id: settings.media,
          volume_level: pct / 100,
        }),
      );
    },

    changeTrack(direction) {
      const service = direction < 0 ? 'media_previous_track' : 'media_next_track';
      return callService('media_player', service, { entity_id: settings.media });
    },

    async nowPlaying() {
      const state = await request('/api/states/' + settings.media);
      const attributes = state.attributes || {};
      return {
        title: attributes.media_title || '–',
        artist: attributes.media_artist || '–',
      };
    },
  };
}
