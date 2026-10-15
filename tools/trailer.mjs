// Store-page gameplay videos, captured frame by frame from real gameplay.
// The page runs on a fake clock (Playwright clock) and every frame advances it by exactly 1/30 s, so the
// footage plays at true game speed no matter how slow the renderer is. CSS animations are stepped the same way.
// Usage: node tools/trailer.mjs landscape|portrait [outDir]   (needs the dev server on :8080 and ffmpeg)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, rmSync, statSync } from 'fs';
import { execFileSync } from 'child_process';

const MODE = process.argv[2] === 'portrait' ? 'portrait' : 'landscape';
const P = MODE === 'portrait';
const VW = P ? 864 : 1280, VH = P ? 1296 : 720, DPR = P ? 1.25 : 1.5; // → 1080x1620 (2:3) / 1920x1080
const FPS = 30, DT = 1000 / FPS;
const OUT = process.argv[3] || 'promo';
const FR = `${OUT}/frames_${MODE}`;
rmSync(FR, { recursive: true, force: true });
mkdirSync(FR, { recursive: true });

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
    if (!a.__cap) { a.__cap = 1; a.pause(); a.currentTime = 0; continue; }
    const t = (a.currentTime || 0) + dt, end = a.effect?.getComputedTiming().endTime;
    if (Number.isFinite(end) && t >= end) { a.__done = 1; a.finish(); } else a.currentTime = t; // finish() fires onfinish handlers
  }
}, dt);
const tick = async (ms) => { await page.clock.runFor(ms); await stepAnims(ms); };
// fast-forward (3D view not rendered, everything else runs)
const ff = async (ms) => {
  await page.evaluate(() => (window.__noRender = true));
  for (let t = 0; t < ms; t += 100) await tick(100);
  await page.evaluate(() => (window.__noRender = false));
};
const until = async (fn, arg, label, max = 60000) => {
  await page.evaluate(() => (window.__noRender = true));
  for (let t = 0; t < max; t += 100) {
    if (await page.evaluate(fn, arg)) { await page.evaluate(() => (window.__noRender = false)); return; }
    await tick(100);
  }
  throw new Error('timed out waiting for ' + label);
};
const sel = (s) => until((s) => { const e = document.querySelector(s); return !!e && e.offsetParent !== null && !e.disabled; }, s, s);
const tap = async (s) => { await sel(s); await page.evaluate((s) => document.querySelector(s).click(), s); await tick(DT); };
const js = (fn, arg) => page.evaluate(fn, arg);

// ---- capture
let fi = 0;
const frame = async () => {
  // two game-loop steps per video frame, but only the second one renders the 3D view (halves capture time)
  await page.evaluate(() => (window.__noRender = true)); await tick(DT / 2);
  await page.evaluate(() => (window.__noRender = false)); await tick(DT / 2);
  const r = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: VW, height: VH, scale: DPR } });
  writeFileSync(`${FR}/f${String(fi++).padStart(5, '0')}.png`, Buffer.from(r.data, 'base64'));
};
const DRY = !!process.env.DRY; // DRY=1: one frame per second, to check the choreography quickly
let live = !process.env.FROM; // FROM=<shot>: fast-forward through the earlier shots (for checking)
const shot = (name) => { console.log('shot:', name); if (name === process.env.FROM) live = true; };
const rec = async (sec, during) => {
  if (!live) { await ff(sec * 1000); return; }
  const t0 = Date.now();
  const n = Math.round(sec * FPS);
  for (let i = 0; i < n; i++) {
    if (during) await during(i / FPS);
    if (DRY && i % FPS) { await page.evaluate(() => (window.__noRender = true)); await tick(DT); await page.evaluate(() => (window.__noRender = false)); continue; }
    await frame();
  }
  console.log(`  captured ${sec}s (total ${(fi / FPS).toFixed(1)}s, ${((Date.now() - t0) / n / 1000).toFixed(2)}s per frame)`);
};
const settle = async () => { await page.evaluate(() => (window.__noRender = false)); for (let i = 0; i < 3; i++) await tick(DT); };

try {
  console.log(MODE, `${VW * DPR}x${VH * DPR}`);
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
    const { makeThumb, smallJpeg } = await import('/js/flows/thumbs.js');
    const { gameById } = await import('/js/data/games.js');
    window.__autoplay = true;
    s.tutorial.done = true; s.tutorial.step = 99;
    s.profile.name = 'LunaPlays';
    s.level = 14; s.xp = 0; s.money = 48200; s.sparks = 140;
    s.fans = { vid: 96400, pulse: 21800, blip: 30500, lumo: 9200 };
    s.home = 2; s.theme = 'gamer';
    Object.assign(s.gear, { pc: 4, monitor: 4, camera: 4, mic: 4, light: 4, chair: 4, desk: 3, keys: 3, net: 3 });
    s.decor = ['neon_name', 'hex_lights', 'plant_big', 'beanbag', 'rug_round', 'figures', 'lava_lamp', 'cat', 'string_lights', 'poster_game', 'arcade', 'gold_records', 'fishtank', 'disco_ball'];
    s.placed = [...s.decor];
    s.games.push('neondrift', 'galaxyroyale', 'riftarena', 'blocktopia');
    s.stats.videos = 64; s.stats.streams = 31; s.stats.views = 4820000;
    s.milestones = ['m100', 'm1k', 'm10k'];
    s.needs.energy = 96; s.needs.hunger = 90;
    s.clock.min = 19 * 60 + 40;
    // a recent upload still collecting views (real-time)
    const now = Date.now();
    const title = 'I raced the BEST drivers in Neon Drift';
    s.videos.unshift({ id: 'v_trailer', title, game: 'neondrift', type: 'gameplay', thumb: smallJpeg(makeThumb('neon', gameById('neondrift'), title)), tags: ['racing'], day: s.clock.day, perf: 0.9, grade: 'A', viral: false,
      V: 260000, b: 0, views: 0, subs: 0, likes: 0, dislikes: 0, comments: 0, money: 0, rt0: now - 40000, conv: 0.012, rpm: 0.004, lr: 0.06, dr: 0.002, cr: 0.01, fs: 0, fm: 0, fl: 0, fd: 0, fc: 0, vm: 9 });
    G.world.setProfile(s.profile);
    G.world.rebuildRoom();
    G.world.applyTime(G.game.hour, true);
    G.game.accrueVideos(); G.game.accSubs = 0; G.ui.hud.rateHist = []; // no catch-up spike in subs/min
    G.tutorial.refresh();
    G.ui.labels.clearMarkers(); G.ui.hud.highlight(null);
    G.ui.hud.setPortrait();
    G.game.refreshObjective();
    document.querySelectorAll('.modal-wrap [data-x]').forEach((b) => b.click());
  });
  await ff(4000);
  await js(() => document.querySelectorAll('.modal-wrap [data-x], .modal-wrap [data-a=ok]').forEach((b) => b.click()));
  await ff(1500);

  // 1) the room: HUD alive, the latest upload ticking up in real time
  shot('room');
  await js(() => { const W = window.__G.world; W.shot('room'); W.cam.yaw += 0.18; W.cam.dist *= 1.08; });
  await settle();
  await rec(2.4);

  // 2) recording: catch the highlights
  shot('recording');
  await tap('#hud [data-a=create]');
  await tap('.hub-card.video');
  await tap('[data-a=g][data-id=neondrift]');
  await tap('[data-a=c][data-id=gameplay]');
  await sel('.rec-card');
  await ff(1500);
  await rec(2.8);

  // 3) premiere: live views, then VIRAL
  shot('premiere');
  await sel('.edit-pick');
  await tap('.edit-opt[data-id=clean]');
  await sel('[data-a=pub]');
  await js(() => document.querySelectorAll('.tagb:not(.on)').forEach((b, i) => i < 2 && b.click()));
  // make this upload the lucky one (the viral roll happens right after the upload bar)
  await js(() => { let x = 7; const r = () => ((x = (x * 16807) % 2147483647) / 2147483647); window.__rnd = Math.random; Math.random = () => r() ** 10; });
  await tap('[data-a=pub]');
  await sel('.premiere');
  await js(() => { Math.random = window.__rnd; });
  await ff(3800);
  await rec(3.8);
  await until(() => !document.querySelector('.premiere [data-a=ok][disabled]'), null, 'continue');
  await tap('.premiere [data-a=ok]');
  await until(() => !window.__G.game.busy, null, 'video flow done');
  await js(() => document.querySelectorAll('.modal-wrap [data-x], .modal-wrap [data-a=ok]').forEach((b) => b.click()));
  await ff(1500);
  await js(() => document.querySelectorAll('.modal-wrap [data-x], .modal-wrap [data-a=ok]').forEach((b) => b.click()));
  await ff(600);

  // 4) live stream with a busy chat
  shot('stream');
  await js(() => { const n = window.__G.s.needs; n.energy = 96; n.hunger = 92; });
  await tap('#hud [data-a=create]');
  await tap('.hub-card.stream');
  await tap('[data-a=g][data-id=galaxyroyale]');
  await tap('[data-a=go]');
  await sel('.stream-ui');
  await ff(7000);
  await rec(3.6, async (t) => {
    const at = (x) => Math.abs(t - x) < 0.5 / FPS;
    // Big Play, hit right on the ring (ring closes at 160+2*level px/s from 200 to 90)
    if (at(0.5)) await js(() => document.querySelector('.stream-ui [data-a=play]')?.click());
    if (at(0.5 + 110 / 188)) await js(() => document.querySelector('.qte')?.dispatchEvent(new PointerEvent('pointerdown')));
    if (at(2.4)) await js(() => document.querySelector('.stream-ui [data-a=talk]')?.click());
  });
  await js(() => { const e = document.querySelector('[data-a=end]'); e.style.pointerEvents = 'auto'; });
  await until(() => { const e = document.querySelector('[data-a=end]'); if (e && e.style.opacity === '1') { e.click(); return true; } return false; }, null, 'end stream', 90000);
  await sel('.summary [data-a=ok]');
  await tap('.summary [data-a=ok]');
  await until(() => !window.__G.game.busy, null, 'stream flow done');
  await js(() => document.querySelectorAll('.modal-wrap [data-x], .modal-wrap [data-a=ok]').forEach((b) => b.click()));
  await ff(1500);
  await js(() => document.querySelectorAll('.modal-wrap [data-x], .modal-wrap [data-a=ok]').forEach((b) => b.click()));
  await ff(600);

  // 5) going out: rooftop party with other creators
  shot('party');
  await js(() => { window.__G.s.needs.energy = 95; void window.__G.out.party(); });
  await sel('.party-ui [data-a=dance]');
  await ff(1200);
  await tap('.party-ui [data-a=dance]');
  await ff(400);
  await rec(2.6);
  await tap('.party-ui [data-a=leave]');
  await until(() => { document.querySelector('.modal-wrap [data-a=ok]')?.click(); return !window.__G.game.busy; }, null, 'party done', 90000);
  await js(() => document.querySelectorAll('.modal-wrap [data-x], .modal-wrap [data-a=ok]').forEach((b) => b.click()));
  await ff(1500);
  await js(() => document.querySelectorAll('.modal-wrap [data-x], .modal-wrap [data-a=ok]').forEach((b) => b.click()));
  await ff(800);

  // 6) the Gold Disc arrives
  shot('award');
  await js(() => { const G = window.__G; G.s.needs.energy = 95; G.s.fans.vid = Math.max(G.s.fans.vid, 100500); G.game.checkMilestones(); });
  await until(() => window.__G.game.busy === 'award' && window.__G.world.shotName === 'char', null, 'award box');
  await ff(1150); // just before the lid pops
  await rec(3.6);
} catch (e) {
  console.log('CAPTURE ERROR', e.message);
  const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/error_${MODE}.png`, Buffer.from(r.data, 'base64'));
}
console.log('page errors:', errors.length ? errors.slice(0, 10).join('\n') : 'none');
await browser.close();

// ---- encode
if (DRY) process.exit(0);
const mp4 = `${OUT}/streamer-rise-${MODE}.mp4`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${FR}/f%05d.png`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
console.log('wrote', mp4, (statSync(mp4).size / 1e6).toFixed(1) + 'MB', (fi / FPS).toFixed(1) + 's');
