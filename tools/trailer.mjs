// Store-page gameplay videos, cut from real gameplay.
// The page runs on a fake clock (Playwright clock) and every frame advances it by exactly 1/30 s, so the footage
// plays at true game speed no matter how slow the renderer is. CSS animations are stepped the same way.
// The game is played through once, each high-energy beat is captured as its own clip, and the clips are then
// cut together (hook first) with punch-in zooms and impact flashes on the cuts. No text cards, logos or speed-up.
// Usage: node tools/trailer.mjs landscape|portrait [outDir]   (needs the dev server on :8080 and ffmpeg)
//        DRY=1 ... captures two frames per second per clip, for checking the choreography quickly.
//        ONLY=<clip> ... re-shoots a single clip (earlier ones are fast-forwarded) and re-cuts the video.
//        CUT=1 ... only re-cuts the video from the clips on disk.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, rmSync, statSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';

const MODE = process.argv[2] === 'portrait' ? 'portrait' : 'landscape';
const P = MODE === 'portrait';
const VW = P ? 864 : 1280, VH = P ? 1296 : 720, DPR = P ? 1.25 : 1.5; // → 1080x1620 (2:3) / 1920x1080
const OW = Math.round(VW * DPR), OH = Math.round(VH * DPR);
const FPS = 30, DT = 1000 / FPS;
const DRY = !!process.env.DRY;
const OUT = process.argv[3] || 'dist/videos';
const FR = `${OUT}/frames_${MODE}`;
const ONLY = process.env.ONLY;
if (!ONLY && !process.env.CUT) rmSync(FR, { recursive: true, force: true });
mkdirSync(FR, { recursive: true });

// The edit: [clip, punch-in zoom, impact flash]. Clips are captured in game order, played back in this order.
const EDIT = [
  ['viral', 0.09, false],   // hook: the premiere goes VIRAL (no flash: the first frame doubles as the poster)
  ['wspam', 0.07, false],   // perfect Big Play -> chat floods with W's
  ['record', 0.06, false],  // catching highlights while recording
  ['levelup', 0.08, true],  // level up
  ['train', 0.08, true],    // HYPE TRAIN
  ['raid', 0.06, false],    // raid + welcome -> W's
  ['upgrade', 0.07, false], // new setup installed
  ['glowup', 0.06, true],   // moving into the penthouse
  ['party', 0.05, false],   // rooftop party
  ['award', 0.08, true],    // Gold Disc unboxing
  ['claim', 0.06, false],   // 100K subscribers
];

if (process.env.CUT) { cut(); process.exit(0); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars'] });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => { errors.push(e.message); console.log('PAGEERROR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.clock.install({ time: new Date('2026-06-12T19:40:00') });
const cdp = await ctx.newCDPSession(page);

// ---- time control
const stepAnims = (dt) => page.evaluate((dt) => {
  for (const a of document.getAnimations()) {
    if (a.__done) continue;
    // new since the last step: it started somewhere inside this step, so give it one step of progress
    // (CSS transitions restarted every frame, like a filling bar, would otherwise never move)
    if (!a.__cap) { a.__cap = 1; a.pause(); a.currentTime = dt; continue; }
    const t = (a.currentTime || 0) + dt, end = a.effect?.getComputedTiming().endTime;
    if (Number.isFinite(end) && t >= end) { a.__done = 1; a.finish(); } else a.currentTime = t; // finish() fires onfinish handlers
  }
}, dt);
const noRender = (v) => page.evaluate((v) => (window.__noRender = v), v);
const tick = async (ms) => { await page.clock.runFor(ms); await stepAnims(ms); };
// fast-forward (3D view not rendered, everything else runs)
const ff = async (ms, step = 100) => { await noRender(true); for (let t = 0; t < ms; t += step) await tick(Math.min(step, ms - t)); await noRender(false); };
const until = async (fn, arg, label, max = 90000, step = 100) => {
  await noRender(true);
  for (let t = 0; t < max; t += step) {
    if (await page.evaluate(fn, arg)) { await noRender(false); return; }
    await tick(step);
  }
  throw new Error('timed out waiting for ' + label);
};
const sel = (s) => until((s) => { const e = document.querySelector(s); return !!e && e.offsetParent !== null && !e.disabled; }, s, s);
const tap = async (s) => { await sel(s); await page.evaluate((s) => document.querySelector(s).click(), s); await tick(DT); };
const js = (fn, arg) => page.evaluate(fn, arg);
const closeModals = async () => {
  for (let i = 0; i < 6; i++) {
    const n = await js(() => { const t = '#modals > .modal-wrap:last-child'; const b = document.querySelector(`${t} [data-a=ok], ${t} [data-a=claim], ${t} [data-x]`); b?.click(); return !!b; });
    await ff(900);
    if (!n) break;
  }
};
const idle = async () => { await until(() => !window.__G.game.busy, null, 'idle'); await closeModals(); await ff(600); await closeModals(); };
const fresh = (hour) => js((hour) => {
  const G = window.__G, s = G.s;
  s.needs.energy = 96; s.needs.hunger = 92;
  if (hour != null) { s.clock.min = hour * 60; G.world.applyTime(hour, true); }
}, hour);

// ---- capture
const clips = {};
let clipName = null, fi = 0;
const frame = async () => {
  // two game-loop steps per video frame, only the second renders the 3D view (halves capture time)
  await noRender(true); await tick(DT / 2);
  await noRender(false); await tick(DT / 2);
  const r = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: VW, height: VH, scale: DPR } });
  writeFileSync(`${FR}/${clipName}/f${String(fi++).padStart(5, '0')}.png`, Buffer.from(r.data, 'base64'));
};
const clip = async (name, sec, during) => {
  if (ONLY && name !== ONLY) { // keep the frames already on disk, just play through
    for (let i = 0, n = Math.round(sec * FPS); i < n; i++) { if (during) await during(i / FPS); await noRender(true); await tick(DT); }
    await noRender(false);
    return;
  }
  clipName = name; fi = 0;
  rmSync(`${FR}/${name}`, { recursive: true, force: true });
  mkdirSync(`${FR}/${name}`, { recursive: true });
  const t0 = Date.now(), n = Math.round(sec * FPS);
  for (let i = 0; i < n; i++) {
    if (during) await during(i / FPS);
    if (DRY && i % 15) { await noRender(true); await tick(DT); await noRender(false); continue; }
    await frame();
  }
  clips[name] = n;
  console.log(`clip ${name}: ${sec}s, ${((Date.now() - t0) / n / 1000).toFixed(2)}s per frame`);
  if (ONLY) throw new Error('STOP');
};
const at = (t, x) => Math.abs(t - x) < 0.5 / FPS;

try {
  console.log(MODE, `${OW}x${OH}`);
  await page.goto('http://localhost:8080/?fresh&q=high', { waitUntil: 'load' });
  // stop the clock: from here on only our ticks move time
  for (let i = 0; ; i++) {
    try { await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1500); break; } catch (e) { if (i > 4) throw e; }
  }
  // ---- character + mid-game progress (off camera)
  await sel('.creator [data-a=done]');
  await tap('.creator [data-a=gender][data-v=f]');
  await tap('.creator [data-a=set][data-k=hair][data-v=ponytail]');
  await tap('.creator [data-a=done]');
  await until(() => !window.__G.game.busy && !document.querySelector('.creator'), null, 'creator closed');
  await js(async () => {
    const G = window.__G, s = G.s;
    window.__autoplay = true;
    s.tutorial.done = true; s.tutorial.step = 99;
    s.profile.name = 'LunaPlays';
    s.level = 18; s.xp = 0; s.money = 64200; s.sparks = 140;
    s.fans = { vid: 96400, pulse: 21800, blip: 30500, lumo: 9200 };
    s.home = 2; s.homes = [0, 1, 2]; s.theme = 'gamer';
    Object.assign(s.gear, { pc: 4, monitor: 4, camera: 4, mic: 4, light: 4, chair: 4, desk: 3, keys: 3, net: 3 });
    s.decor = ['neon_name', 'hex_lights', 'plant_big', 'beanbag', 'rug_round', 'figures', 'lava_lamp', 'cat', 'string_lights', 'poster_game', 'arcade', 'gold_records', 'fishtank', 'disco_ball'];
    s.placed = [...s.decor];
    s.games.push('neondrift', 'galaxyroyale', 'riftarena', 'blocktopia');
    s.stats.videos = 64; s.stats.streams = 31; s.stats.views = 4820000;
    s.milestones = ['m100', 'm1k', 'm10k'];
    s.clock.min = 19 * 60 + 40;
    G.world.setProfile(s.profile);
    G.world.rebuildRoom();
    G.world.applyTime(G.game.hour, true);
    G.tutorial.refresh();
    G.ui.labels.clearMarkers(); G.ui.hud.highlight(null);
    G.ui.hud.setPortrait();
    G.game.refreshObjective();
  });
  await ff(3000);
  await closeModals();
  await fresh(19.7);

  // ---- recording: a highlight pops up and gets caught
  console.log('record');
  await tap('#hud [data-a=create]');
  await tap('.hub-card.video');
  await tap('[data-a=g][data-id=neondrift]');
  await tap('[data-a=c][data-id=gameplay]');
  await sel('.rec-card');
  await ff(900);
  await until(() => !!document.querySelector('.moment:not(.got)'), null, 'highlight', 20000, 33);
  await ff(200);
  await clip('record', 1.4);

  // ---- premiere goes VIRAL (the burst fires 6 s in)
  console.log('viral');
  await sel('.edit-pick');
  await tap('.edit-opt[data-id=clean]');
  await sel('[data-a=pub]');
  await js(() => document.querySelectorAll('.tagb:not(.on)').forEach((b, i) => i < 2 && b.click()));
  // make this upload the lucky one (the viral roll happens right after the upload bar)
  await js(() => { window.__rnd = Math.random; Math.random = () => 0.02; }); // no random loops run in this window
  await tap('[data-a=pub]');
  await until(() => !!document.querySelector('.premiere'), null, 'premiere', 60000, 33);
  await js(() => { Math.random = window.__rnd; });
  await ff(5400, 33);
  await clip('viral', 1.8);

  // ---- level up after the premiere
  console.log('levelup');
  await until(() => !document.querySelector('.premiere [data-a=ok][disabled]'), null, 'continue');
  await js(() => { const s = window.__G.s; s.xp = Math.max(s.xp, 7000); });
  await tap('.premiere [data-a=ok]');
  await until(() => !!document.querySelector('.lvlup'), null, 'level up modal', 60000, 33);
  await clip('levelup', 1.4);
  await idle();

  // ---- live stream: perfect Big Play -> W spam, hype train, raid
  console.log('stream');
  await fresh(20.5);
  await tap('#hud [data-a=create]');
  await tap('.hub-card.stream');
  await tap('[data-a=g][data-id=galaxyroyale]');
  await tap('[data-a=go]');
  await sel('.stream-ui');
  await ff(6500);
  const lvl = await js(() => window.__G.s.level);
  await clip('wspam', 2.0, async (t) => {
    if (at(t, 0)) await js(() => document.querySelector('.stream-ui [data-a=play]')?.click());
    // the ring closes at 160+2*level px/s from 200 to 90: hit it dead on
    if (at(t, 110 / (160 + 2 * lvl))) await js(() => document.querySelector('.qte')?.dispatchEvent(new PointerEvent('pointerdown')));
  });
  await ff(2600);
  await js(() => { window.__G.stream.live.S2.hype = 93; });
  await clip('train', 1.6, async (t) => { if (at(t, 0.1)) await js(() => window.__G.stream.live.addHype(12)); });
  await ff(2400);
  await clip('raid', 1.5, async (t) => {
    if (at(t, 0.05)) await js(() => window.__G.stream.live.raid());
    if (at(t, 0.6)) await js(() => document.querySelector('[data-w]')?.dispatchEvent(new PointerEvent('pointerdown')));
  });
  await js(() => { const e = document.querySelector('[data-a=end]'); if (e) e.style.pointerEvents = 'auto'; });
  await until(() => { const e = document.querySelector('[data-a=end]'); if (e && e.style.opacity === '1') { e.click(); return true; } return false; }, null, 'end stream', 120000);
  await sel('.summary [data-a=ok]');
  await tap('.summary [data-a=ok]');
  await idle();

  // ---- new setup installed
  console.log('upgrade');
  await fresh(20.8);
  await js(() => { void window.__G.shop.buyGear('monitor', 5); });
  await ff(250, 33);
  await clip('upgrade', 1.6);
  await idle();

  // ---- rooftop party
  console.log('party');
  await fresh(21);
  await js(() => { void window.__G.out.party(); });
  await sel('.party-ui [data-a=dance]');
  await ff(1000);
  await tap('.party-ui [data-a=dance]');
  await ff(300);
  await clip('party', 1.4);
  await tap('.party-ui [data-a=leave]');
  await until(() => { document.querySelector('#modals > .modal-wrap:last-child [data-a=ok]')?.click(); return !window.__G.game.busy; }, null, 'party done', 120000);
  await idle();

  // ---- moving into the Skyline Penthouse
  console.log('glowup');
  await fresh(21.5);
  await js(() => { const s = window.__G.s; if (!s.homes.includes(3)) s.homes.push(3); void window.__G.life.moveHome(3, true); });
  await ff(760, 33);
  await clip('glowup', 2.0);
  await idle();

  // ---- the Gold Disc arrives
  console.log('award');
  await fresh(22);
  await js(() => { const G = window.__G; G.s.fans.vid = Math.max(G.s.fans.vid, 100500); G.game.checkMilestones(); });
  await until(() => window.__G.game.busy === 'award' && window.__G.world.shotName === 'char', null, 'award box', 90000, 33);
  await ff(1150, 33); // just before the lid pops
  await clip('award', 2.0);
  await until(() => [...document.querySelectorAll('.modal')].some((e) => /subscribers!/.test(e.textContent)), null, '100K modal', 30000, 33);
  await clip('claim', 1.6);
} catch (e) {
  if (e.message !== 'STOP') {
  console.log('CAPTURE ERROR', e.message);
  const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/error_${MODE}.png`, Buffer.from(r.data, 'base64'));
  }
}
console.log('page errors:', errors.length ? errors.slice(0, 10).join('\n') : 'none');
await browser.close();
if (DRY) process.exit(0);

// ---- edit: cut the clips together, punch-in zoom + impact flash on the cuts
function cut() {
  const frames = (n) => { try { return readdirSync(`${FR}/${n}`).length; } catch { return 0; } };
  const missing = EDIT.filter(([n]) => !frames(n));
  if (missing.length) { console.log('missing clips:', missing.map((m) => m[0]).join(', ')); process.exit(1); }
  const args = ['-y', '-loglevel', 'error'];
  EDIT.forEach(([n]) => args.push('-framerate', String(FPS), '-i', `${FR}/${n}/f%05d.png`));
  const chains = EDIT.map(([, z, flash], i) => {
    // punch-in: starts zoomed by z and eases back to 1x over 9 frames (upscaled 2x first so the zoom doesn't jitter)
    const zoom = `scale=${OW * 2}:${OH * 2}:flags=bicubic,zoompan=z='1+${z}*pow(max(0\\,1-on/9)\\,2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${OW}x${OH}:fps=${FPS}`;
    return `[${i}:v]setpts=PTS-STARTPTS,${zoom},setsar=1${flash ? ',fade=t=in:st=0:d=0.13:color=white' : ''}[v${i}]`;
  });
  const filter = `${chains.join(';')};${EDIT.map((_, i) => `[v${i}]`).join('')}concat=n=${EDIT.length}:v=1:a=0,format=yuv420p[out]`;
  const mp4 = `${OUT}/streamer-rise-${MODE}.mp4`;
  args.push('-filter_complex', filter, '-map', '[out]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-movflags', '+faststart', '-an', mp4);
  execFileSync('ffmpeg', args);
  const total = EDIT.reduce((a, [n]) => a + frames(n), 0) / FPS;
  console.log('wrote', mp4, (statSync(mp4).size / 1e6).toFixed(1) + 'MB', total.toFixed(1) + 's');
}
cut();
