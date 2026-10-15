// CrazyGames SDK integration check against a local mock of the v3 SDK (the real one only runs on CrazyGames).
// Verifies: init/loading events, balanced gameplayStart/Stop, settings pause, midgame ad at a natural break
// (game frozen + muted during the ad), platform mute, data module saves. Usage: node tools/sdktest.mjs
import { chromium } from 'playwright';
const MOCK = `(() => {
  const log = (m) => { (window.__cglog = window.__cglog || []).push(m); };
  const store = {};
  const listeners = [];
  window.CrazyGames = { SDK: {
    environment: 'local',
    init: async () => log('init'),
    game: {
      settings: { muteAudio: false, disableChat: false },
      addSettingsChangeListener: (fn) => listeners.push(fn),
      __setMute(v) { this.settings.muteAudio = v; listeners.forEach((f) => f(this.settings)); },
      loadingStart: async () => log('loadingStart'), loadingStop: async () => log('loadingStop'),
      gameplayStart: async () => log('gameplayStart'), gameplayStop: async () => log('gameplayStop'),
      happytime: async () => log('happytime'),
    },
    ad: { requestAd(type, cb) { log('requestAd:' + type); setTimeout(() => { log('adStarted'); cb.adStarted(); setTimeout(() => { const G = window.__G; window.__during = { busy: !!G.game.busy, music: G.audio.vol.music, sfx: G.audio.vol.sfx, input: G.world.inputEnabled, inAd: G.sdk.inAd }; }, 200); setTimeout(() => { log('adFinished'); cb.adFinished(); }, 1500); }, 300); } },
    data: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; log('data.setItem'); }, removeItem: (k) => { delete store[k]; log('data.removeItem'); }, clear() {} },
  } };
})();`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 576 } });
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.route('https://sdk.crazygames.com/**', (r) => r.fulfill({ contentType: 'application/javascript', body: MOCK }));
const wait = (ms) => page.waitForTimeout(ms);
const log = () => page.evaluate(() => window.__cglog.slice());
let fails = 0;
const expect = (ok, what) => { console.log((ok ? 'PASS ' : 'FAIL ') + what); if (!ok) fails++; };
try {
  await page.goto('http://localhost:8080/?cgsdk&fresh&q=low', { waitUntil: 'load' });
  await page.waitForSelector('.creator [data-a=done]', { timeout: 30000 });
  let L = await log();
  expect(L[0] === 'init' && L.includes('loadingStart') && L.includes('loadingStop'), 'init → loadingStart → loadingStop: ' + L.join(', '));
  expect(L.indexOf('loadingStop') > L.indexOf('loadingStart'), 'loadingStop after loadingStart');
  expect(L.includes('gameplayStart'), 'gameplayStart after the intro');
  await page.click('.creator [data-a=done]', { force: true });
  await wait(2500);
  await page.evaluate(() => { const G = window.__G; G.s.tutorial.done = true; G.s.tutorial.step = 4; G.tutorial.active = false; G.ui.labels.clearMarkers(); G.sdk.t0 = 0; G.sdk.lastAd = 0; window.__cglog.length = 0; });
  for (let i = 0; i < 4; i++) { const x = await page.$('.modal-wrap [data-x], .modal-wrap [data-a=ok]'); if (!x) break; await x.click({ force: true }); await wait(600); }
  // settings = pause menu
  await page.evaluate(() => window.__cglog.length = 0);
  await page.evaluate(() => window.__G.game.openSettings());
  await wait(500);
  await page.click('.modal-wrap [data-x]', { force: true });
  await wait(500);
  L = await log();
  expect(L.join() === 'gameplayStop,gameplayStart', 'settings pause → resume: ' + L.join(', '));
  // tab hidden / visible
  await page.evaluate(() => { window.__cglog.length = 0; Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange', { bubbles: true })); });
  await wait(200);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange', { bubbles: true })); });
  await wait(200);
  L = await log();
  expect(L.join() === 'data.setItem,gameplayStop,gameplayStart', 'hidden saves + stops, visible resumes: ' + L.join(', '));
  // natural break: sleep → midgame ad, frozen + muted while it plays
  await page.evaluate(() => { window.__cglog.length = 0; window.__G.s.clock.min = 23 * 60; void window.__G.life.sleep(); });
  await page.waitForFunction(() => window.__during, null, { timeout: 120000 });
  const during = await page.evaluate(() => window.__during);
  expect(during.inAd && during.busy && during.music === 0 && during.sfx === 0 && !during.input, 'during ad: game held, audio muted ' + JSON.stringify(during));
  await page.waitForFunction(() => !window.__G.game.busy, null, { timeout: 120000 });
  const after = await page.evaluate(() => ({ inAd: window.__G.sdk.inAd, music: window.__G.audio.vol.music, input: window.__G.world.inputEnabled }));
  L = await log();
  expect(L.includes('requestAd:midgame') && L.indexOf('gameplayStop') > L.indexOf('adStarted') && L.lastIndexOf('gameplayStart') > L.indexOf('adFinished'), 'ad sequence: ' + L.join(', '));
  expect(!after.inAd && after.music > 0 && after.input, 'after ad: audio restored, input back ' + JSON.stringify(after));
  // cooldown: a second break right away shows no ad
  await page.evaluate(() => { window.__cglog.length = 0; window.__G.s.clock.min = 23 * 60; void window.__G.life.sleep(); });
  await page.waitForFunction(() => !window.__G.game.busy, null, { timeout: 120000 });
  L = await log();
  expect(!L.includes('requestAd:midgame'), 'ad cooldown respected');
  // platform mute
  await page.evaluate(() => window.CrazyGames.SDK.game.__setMute(true));
  let v = await page.evaluate(() => window.__G.audio.vol);
  expect(v.music === 0 && v.sfx === 0, 'platform mute applied');
  await page.evaluate(() => window.CrazyGames.SDK.game.__setMute(false));
  v = await page.evaluate(() => window.__G.audio.vol);
  expect(v.music > 0 && v.sfx > 0, 'platform unmute restores volume');
  // data module holds the save
  const has = await page.evaluate(() => { window.__G.game && window.__G.sdk.flush(); return !!window.CrazyGames.SDK.data.getItem('streamer-rise-save-v1'); });
  expect(has, 'save mirrored to SDK data');
} catch (e) {
  console.log('ERROR', e.message); fails++;
  console.log('state', JSON.stringify(await page.evaluate(() => ({ busy: window.__G.game.busy, log: window.__cglog, during: window.__during, inAd: window.__G.sdk.inAd, lastAd: window.__G.sdk.lastAd, now: Date.now() }))).slice(0, 600));
}
console.log('errors:', errors.length ? errors.join('\n') : 'none');
console.log(fails ? `${fails} check(s) failed` : 'all SDK checks passed');
await browser.close();
process.exit(fails ? 1 : 0);
