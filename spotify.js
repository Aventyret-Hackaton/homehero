// Spotify Web API client (Authorization Code with PKCE, no server needed).
// Plays the user's Liked Songs on a Spotify Connect device. Requires Spotify Premium.
const SETTINGS_KEY = 'homehero-spotify';
const TOKEN_KEY = 'homehero-spotify-token';
const VERIFIER_KEY = 'homehero-spotify-verifier';
const SCOPES =
  'user-library-read user-read-playback-state user-modify-playback-state streaming user-read-email user-read-private';
export const BROWSER_DEVICE = 'browser';
const PLAYER_NAME = 'Dumb Home';
const SDK_URL = 'https://sdk.scdn.co/spotify-player.js';
const API = 'https://api.spotify.com/v1';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SEND_INTERVAL_MS = 400;
const TRACKS_PER_PAGE = 50;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch (_) {
    return {};
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    // Storage unavailable; the login lasts for this page only.
  }
}

export const loadSettings = () => read(SETTINGS_KEY);
export const saveSettings = (settings) => write(SETTINGS_KEY, settings);
export const isLoggedIn = () => Boolean(read(TOKEN_KEY).refresh);
export const redirectUri = () => location.origin + location.pathname;

export function clearAll() {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (_) {
    // Nothing to clear.
  }
}

const base64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function login(clientId) {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(48)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: base64Url(new Uint8Array(digest)),
  });
  location.assign('https://accounts.spotify.com/authorize?' + params);
}

async function requestToken(params) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: loadSettings().clientId, ...params }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Inloggningen misslyckades');
  }
  write(TOKEN_KEY, {
    access: data.access_token,
    refresh: data.refresh_token || read(TOKEN_KEY).refresh,
    expires: Date.now() + data.expires_in * 1000,
  });
}

// Call on page load. Returns true when the page was opened by Spotify's redirect and login finished.
export async function completeLogin() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const error = params.get('error');
  if (!code && !error) return false;
  history.replaceState({}, '', redirectUri());
  if (error) throw new Error(error);
  await requestToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: sessionStorage.getItem(VERIFIER_KEY) || '',
  });
  return true;
}

async function accessToken() {
  const tokens = read(TOKEN_KEY);
  if (!tokens.refresh) throw new Error('Inte inloggad på Spotify');
  if (Date.now() > (tokens.expires || 0) - 60000) {
    await requestToken({ grant_type: 'refresh_token', refresh_token: tokens.refresh });
  }
  return read(TOKEN_KEY).access;
}

async function api(path, method = 'GET', body) {
  const response = await fetch(API + path, {
    method,
    headers: { Authorization: 'Bearer ' + (await accessToken()) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const reason = detail && detail.error && detail.error.message;
    throw new Error(
      'Spotify ' + response.status + ' ' + path.split('?')[0] + (reason ? ': ' + reason : ''),
    );
  }
  return response.status === 204 ? null : response.json().catch(() => null);
}

export async function listDevices() {
  const data = await api('/me/player/devices');
  return data.devices.map((device) => ({
    id: device.id,
    name: device.name,
    active: device.is_active,
    restricted: device.is_restricted,
    type: device.type,
  }));
}

const shuffle = (list) => {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

let sdkPromise = null;

// Loads Spotify's Web Playback SDK once.
function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      window.onSpotifyWebPlaybackSDKReady = () => resolve(window.Spotify);
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.onerror = () => reject(new Error('Kunde inte ladda Spotifys spelare'));
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

let browserPlayer = null;

// The browser becomes a Spotify device. Resolves with its device id when ready.
function startBrowserPlayer() {
  if (browserPlayer) return browserPlayer;
  const state = { player: null, error: '' };
  state.ready = loadSdk().then(
    (Spotify) =>
      new Promise((resolve, reject) => {
        const player = new Spotify.Player({
          name: PLAYER_NAME,
          getOAuthToken: (callback) => accessToken().then(callback),
          volume: 0.5,
        });
        state.player = player;
        player.addListener('ready', ({ device_id }) => resolve(device_id));
        const fail = (kind) => ({ message }) => {
          state.error = kind + ': ' + message;
          reject(new Error(state.error));
        };
        player.addListener('initialization_error', fail('Spelaren stöds inte här'));
        player.addListener('authentication_error', fail('Logga in igen i Spotify-rutan'));
        player.addListener('account_error', fail('Spotify Premium krävs'));
        player.connect();
      }),
  );
  state.ready.catch(() => {});
  browserPlayer = state;
  return state;
}

export function createSpotify(settings) {
  const inBrowser = settings.deviceId === BROWSER_DEVICE;
  const browser = inBrowser && isLoggedIn() ? startBrowserPlayer() : null;
  let deviceId = settings.deviceId || '';
  const enabled = Boolean(settings.clientId && deviceId && isLoggedIn());
  let lastVolume = null;
  let lastSent = 0;

  // Device ids change when Spotify restarts. On 404, look the device up again by name.
  async function findDevice() {
    const devices = await listDevices();
    const found =
      devices.find((device) => device.id === deviceId) ||
      devices.find((device) => device.name === settings.deviceName) ||
      devices.find((device) => device.active);
    if (!found) {
      throw new Error('Enheten hittades inte. Starta Spotify på enheten och försök igen.');
    }
    deviceId = found.id;
    saveSettings({ ...loadSettings(), deviceId: found.id, deviceName: found.name });
    return found.id;
  }

  // On mobile, audio can only start after a tap. Call this from the tap handler.
  function activate() {
    if (browser && browser.player) browser.player.activateElement();
  }

  async function onDevice(call) {
    if (browser) return call(await browser.ready);
    try {
      return await call(deviceId);
    } catch (error) {
      if (!String(error.message).includes(' 404 ')) throw error;
      return call(await findDevice());
    }
  }

  const player = (action, method) => (id) =>
    api('/me/player/' + action + '?device_id=' + encodeURIComponent(id), method);

  return {
    hasMedia: enabled,
    activate,
    currentDevice: () => (browser ? browser.ready : Promise.resolve(deviceId)),

    // Plays a random stretch of Liked Songs, in random order.
    async start() {
      activate();
      const { total } = await api('/me/tracks?limit=1');
      if (!total) throw new Error('Inga gillade låtar');
      const span = TRACKS_PER_PAGE * 2;
      const first = Math.floor(Math.random() * Math.max(1, total - span + 1));
      const pages = await Promise.all(
        [first, first + TRACKS_PER_PAGE].map((offset) =>
          api('/me/tracks?limit=' + TRACKS_PER_PAGE + '&offset=' + offset),
        ),
      );
      const uris = shuffle(pages.flatMap((page) => page.items.map((item) => item.track.uri)));
      return onDevice((id) =>
        api('/me/player/play?device_id=' + encodeURIComponent(id), 'PUT', { uris }),
      );
    },

    resume: () => {
      activate();
      return onDevice(player('play', 'PUT'));
    },
    pause: () => onDevice(player('pause', 'PUT')),

    changeTrack: (direction) => onDevice(player(direction < 0 ? 'previous' : 'next', 'POST')),

    // Sends at most one call per interval and only when the value changed.
    setVolume(level) {
      const pct = Math.round(level * 100);
      const now = performance.now();
      if (pct === lastVolume || now - lastSent < SEND_INTERVAL_MS) return;
      lastVolume = pct;
      lastSent = now;
      onDevice((id) =>
        api('/me/player/volume?volume_percent=' + pct + '&device_id=' + encodeURIComponent(id), 'PUT'),
      ).catch(() => {});
    },

    async nowPlaying() {
      const data = await api('/me/player/currently-playing');
      const item = data && data.item;
      return {
        title: item ? item.name : '–',
        artist: item && item.artists ? item.artists.map((artist) => artist.name).join(', ') : '–',
      };
    },
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function playerState() {
  const state = await api('/me/player');
  if (!state) return 'ingen aktiv uppspelning hos Spotify';
  const item = state.item ? state.item.name : 'ingen låt';
  return (state.is_playing ? 'spelar' : 'spelar inte') + ', ' + item + ', på ' + (state.device ? state.device.name : '?');
}

// Runs the playback steps one by one and reports each result, to find out why playback fails.
export async function diagnose(settings) {
  const lines = [];
  const spotify = createSpotify(settings);
  spotify.activate(); // before any await, so it counts as part of the tap
  const step = async (label, run) => {
    try {
      lines.push(label + ': ' + (await run()));
    } catch (error) {
      lines.push(label + ' misslyckades: ' + error.message);
    }
  };
  let devices = [];
  await step('Enheter', async () => {
    devices = await listDevices();
    return devices
      .map((d) => d.name + ' [' + d.type + (d.active ? ', aktiv' : '') + (d.restricted ? ', BEGRÄNSAD' : '') + ']')
      .join('; ') || 'inga';
  });
  const chosen = devices.find((d) => d.id === settings.deviceId);
  if (settings.deviceId === BROWSER_DEVICE) {
    await step('Webbläsarspelaren', async () => 'klar, enhets-id ' + (await spotify.currentDevice()).slice(0, 8) + '…');
  } else {
    lines.push(chosen ? 'Vald enhet: ' + chosen.name : 'Vald enhet finns inte i listan.');
  }
  let track = null;
  await step('Första gillade låten', async () => {
    const data = await api('/me/tracks?limit=1');
    track = data.items[0] && data.items[0].track;
    return track ? track.name + ' (' + track.uri + ', spelbar: ' + track.is_playable + ')' : 'inga gillade låtar';
  });
  if (track) {
    await step('Spela en låt', async () => {
      const id = encodeURIComponent(await spotify.currentDevice());
      await api('/me/player/play?device_id=' + id, 'PUT', { uris: [track.uri] });
      await sleep(2500);
      return await playerState();
    });
  }
  await step('Spela urvalet', async () => {
    await spotify.start();
    await sleep(2500);
    return await playerState();
  });
  return lines.join('\n');
}
