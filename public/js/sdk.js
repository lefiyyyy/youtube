// CrazyGames SDK v3 integration. The game runs fully without it (local dev, other hosts).
// Loaded only when the game is served by CrazyGames (or with ?cgsdk / ?crazygames_sandbox=1 for testing).
const CG_HOST = /crazygames|1001juegos/i;
const AD_COOLDOWN = 180000;   // our own floor between midgame ads (the SDK also rate-limits)
const AD_GRACE = 240000;      // no ads in a session's first 4 minutes: new players get hooked first

function onCrazyGames() {
  try {
    if (window.__NO_SDK) return false;
    const q = new URLSearchParams(location.search);
    if (q.has('cgsdk') || q.has('crazygames_sandbox')) return true;
    if (CG_HOST.test(location.hostname)) return true;
    const anc = location.ancestorOrigins;
    if (anc) for (let i = 0; i < anc.length; i++) if (CG_HOST.test(anc[i])) return true;
    if (document.referrer && CG_HOST.test(new URL(document.referrer).hostname)) return true;
  } catch {}
  return false;
}
const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

export const SDK = {
  sdk: null,
  env: 'none',
  t0: Date.now(),
  lastAd: 0,
  inAd: false,
  playing: false,
  holds: new Set(),
  lastHappy: 0,
  onAdStart: null, onAdEnd: null,
  async init() {
    if (!onCrazyGames()) return;
    try {
      if (!window.CrazyGames?.SDK) {
        await timeout(new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        }), 5000);
      }
      const sdk = window.CrazyGames.SDK;
      await timeout(sdk.init(), 6000);
      this.env = sdk.environment || 'crazygames';
      if (this.env === 'disabled') return;
      this.sdk = sdk;
      this.loadingStart();
    } catch (e) { console.info('CrazyGames SDK unavailable, continuing offline.'); }
  },
  get active() { return !!this.sdk; },
  // SDK methods may throw or return a rejecting promise: neither may ever break the game
  call(fn) {
    if (!this.sdk) return;
    try { const r = fn(this.sdk); if (r && typeof r.catch === 'function') r.catch((e) => console.info('SDK:', e?.message || e)); }
    catch (e) { console.info('SDK:', e?.message || e); }
  },
  loadingStart() { this.call((s) => s.game.loadingStart()); },
  loadingStop() { this.call((s) => s.game.loadingStop()); },
  // gameplayStart/Stop are reference counted by "holds" (tab hidden, pause menu, ad) so calls stay balanced.
  gameplayStart() { this.started = true; this.sync(); },
  gameplayStop() { this.started = false; this.sync(); },
  hold(reason) { this.holds.add(reason); this.sync(); },
  release(reason) { this.holds.delete(reason); this.sync(); },
  sync() {
    const want = !!this.started && this.holds.size === 0;
    if (want === this.playing) return;
    this.playing = want;
    this.call((s) => (want ? s.game.gameplayStart() : s.game.gameplayStop()));
  },
  happy() {
    const t = Date.now();
    if (t - this.lastHappy < 30000) return;
    this.lastHappy = t;
    this.call((s) => s.game.happytime());
  },
  // Midgame ad at a natural break (after a premiere, a stream, a night's sleep).
  // Resolves when gameplay may continue. Never throws, never blocks longer than needed.
  midgame() {
    const t = Date.now();
    if (!this.sdk || this.inAd || t - this.t0 < AD_GRACE || t - this.lastAd < AD_COOLDOWN) return Promise.resolve(false);
    if (document.hidden) return Promise.resolve(false);
    this.lastAd = t;
    return new Promise((resolve) => {
      let started = false, done = false;
      const finish = (ok) => {
        if (done) return; done = true;
        if (started) { this.inAd = false; this.release('ad'); try { this.onAdEnd?.(); } catch {} }
        resolve(ok);
      };
      const callbacks = {
        adStarted: () => { if (done) return; started = true; this.inAd = true; this.hold('ad'); try { this.onAdStart?.(); } catch {} },
        adFinished: () => finish(true),
        adError: () => finish(false),
      };
      try {
        const p = this.sdk.ad.requestAd('midgame', callbacks);
        if (p && typeof p.catch === 'function') p.catch(() => finish(false));
      } catch { finish(false); }
      // safety nets: an ad that never starts, or never reports back
      setTimeout(() => { if (!started) finish(false); }, 8000);
      setTimeout(() => finish(false), 120000);
    });
  },
  // Platform-level mute (CrazyGames settings). cb(muted:boolean)
  onMute(cb) {
    this.call((s) => {
      const read = () => cb(!!s.game.settings?.muteAudio);
      read();
      s.game.addSettingsChangeListener?.(read);
    });
  },
  // Cloud-synced storage for logged-in players. Writes are throttled (the platform syncs them to its servers).
  get data() { try { return this.sdk?.data || null; } catch { return null; } },
  getItem(key) { try { return this.sdk?.data?.getItem(key) ?? null; } catch { return null; } },
  setItem(key, value, force) {
    if (!this.sdk) return;
    this.pending = [key, value];
    const t = Date.now();
    if (force || t - (this.lastWrite || 0) > 20000) this.flush();
    else if (!this.wTimer) this.wTimer = setTimeout(() => this.flush(), 20000 - (t - this.lastWrite));
  },
  flush() {
    clearTimeout(this.wTimer); this.wTimer = null;
    if (!this.pending) return;
    const [k, v] = this.pending; this.pending = null;
    this.lastWrite = Date.now();
    this.call((s) => s.data.setItem(k, v));
  },
  removeItem(key) { this.pending = null; this.call((s) => s.data.removeItem(key)); },
};
