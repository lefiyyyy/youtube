// Chaos soak test: plays randomly for MIN minutes (default 6) — taps whatever is on screen (modal buttons, overlay
// actions, minigame targets, the dock, the 3D room) and presses hotkeys — and fails on any page error, on a stuck state
// (same busy flow and nothing to tap for 60 s) and reports JS heap growth. Works with env.mjs (BASE, DEVICE, OLD_APIS).
// Usage: MIN=6 node tools/monkey.mjs [seed]
import { launch, openPage, BASE } from './env.mjs';
import { mkdirSync } from 'fs';

const MIN = +(process.env.MIN || 6), SEED = +(process.argv[2] || 1);
mkdirSync('tools/shots', { recursive: true });
let x = SEED * 7919 + 13; const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
const browser = await launch();
const page = await openPage(browser, { w: 1280, h: 720 });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
const wait = (ms) => page.waitForTimeout(ms);

await page.goto(BASE + '/?fresh&q=low', { waitUntil: 'load' });
await page.waitForSelector('.creator [data-a=done]', { timeout: 90000 });
await page.click('.creator [data-a=done]', { force: true });
await page.waitForFunction(() => window.__G && !window.__G.game.busy && !document.querySelector('.creator'), null, { timeout: 90000 });
await page.evaluate(() => {
  const G = window.__G, s = G.s;
  s.tutorial.done = true; s.tutorial.step = 99; G.tutorial.refresh();
  s.level = 24; s.money = 900000; s.sparks = 400; s.fans = { vid: 140000, pulse: 40000, blip: 52000, lumo: 18000 };
  s.games.push('galaxyroyale', 'neondrift', 'riftarena'); s.clips = 3;
  G.game.refreshObjective();
});

// one random interaction; returns what it did
const act = (r) => page.evaluate((r) => {
  const vis = (e) => { if (!e || e.disabled) return false; const b = e.getBoundingClientRect(); if (b.width < 2 || b.height < 2 || b.bottom < 0 || b.top > innerHeight || b.right < 0 || b.left > innerWidth) return false; const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.pointerEvents !== 'none' && !e.closest('.hidden, .away, [inert]'); };
  const pick = (list) => list[Math.floor(r[0] * list.length)];
  const tap = (e, how) => { if (how === 'down') e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); else e.click(); };
  // 1) minigame targets first (highlights, Big Play ring, ban/thank/welcome buttons): they are time-limited
  const hot = [...document.querySelectorAll('.moment:not(.got), .qte, [data-thank], [data-ban], [data-w], [data-fix]')].filter(vis);
  if (hot.length && r[1] < 0.7) { const e = pick(hot); tap(e, 'down'); return 'hot:' + (e.className || e.dataset && Object.keys(e.dataset)[0]); }
  // 2) the top modal
  const modal = [...document.querySelectorAll('#modals > .modal-wrap')].pop();
  if (modal) {
    const btns = [...modal.querySelectorAll('[data-a], [data-x], button')].filter(vis).filter((b) => !/wipe|reset/i.test(b.dataset.a || '') );
    if (btns.length) { const b = r[2] < 0.25 && modal.querySelector('[data-x]') ? modal.querySelector('[data-x]') : pick(btns); tap(b); return 'modal:' + (b.dataset.a || b.textContent.trim().slice(0, 14)); }
  }
  // 3) overlays: phone, flows (stream, picker, party, job...)
  const layers = [...document.querySelectorAll('#screens > *')].filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed');
  const top = layers.pop();
  if (top) {
    const btns = [...top.querySelectorAll('[data-a], button, .app, .post-type, .card.click')].filter(vis).filter((b) => !/wipe|reset/i.test(b.dataset.a || ''));
    if (btns.length) { const b = pick(btns); tap(b); return 'overlay:' + (b.dataset.a || b.className.split(' ')[0]); }
  }
  // 4) the room: dock / HUD buttons or a spot in the 3D view
  const G = window.__G;
  if (!G.game.busy) {
    const hud = [...document.querySelectorAll('#hud [data-a]')].filter(vis).filter((b) => b.dataset.a !== 'settings' || r[3] < 0.1);
    if (hud.length && r[4] < 0.75) { const b = pick(hud); tap(b); return 'hud:' + b.dataset.a; }
    const c = document.querySelector('#world canvas');
    const px = innerWidth * (0.15 + r[5] * 0.7), py = innerHeight * (0.25 + r[6] * 0.6);
    for (const t of ['pointerdown', 'pointerup']) c.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: px, clientY: py, pointerId: 1, isPrimary: true }));
    c.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: px, clientY: py }));
    return 'world';
  }
  return 'wait';
}, Array.from({ length: 8 }, rnd));

const state = () => page.evaluate(() => {
  const G = window.__G;
  const ov = [...document.querySelectorAll('#screens > *')].map((e) => e.className).join('|');
  const md = [...document.querySelectorAll('#modals > .modal-wrap')].length;
  return { busy: G.game.busy || '', sig: `${G.game.busy}|${ov}|${md}|${document.querySelectorAll('.msg').length}|${Math.round(G.s.clock.min)}`, heap: performance.memory ? performance.memory.usedJSHeapSize : 0 };
});

const t0 = Date.now(), counts = {}, stuck = [];
let lastSig = '', sigT = Date.now(), heap0 = 0, n = 0;
while (Date.now() - t0 < MIN * 60000) {
  let what;
  try { what = await act(Array.from({ length: 8 }, rnd)); } catch (e) { what = 'err'; errors.push('ACT ' + e.message.split('\n')[0]); }
  const k = what.split(':')[0]; counts[k] = (counts[k] || 0) + 1; n++;
  if (rnd() < 0.08) await page.keyboard.press(['Digit1', 'Digit2', 'Digit3', 'Space', 'Escape'][Math.floor(rnd() * 5)]);
  await wait(350 + rnd() * 700);
  const st = await state();
  if (!heap0 && st.heap) heap0 = st.heap;
  if (st.sig !== lastSig) { lastSig = st.sig; sigT = Date.now(); }
  else if (Date.now() - sigT > 60000) {
    stuck.push(`${st.busy || 'idle'} after ${((Date.now() - t0) / 60000).toFixed(1)} min`);
    await page.screenshot({ path: `tools/shots/monkey_stuck_${stuck.length}.png`, timeout: 120000 }).catch(() => {});
    await page.keyboard.press('Escape'); sigT = Date.now();
  }
  if (n % 60 === 0) console.log(`${((Date.now() - t0) / 60000).toFixed(1)} min, ${n} actions, busy=${st.busy || '-'}, heap ${(st.heap / 1e6).toFixed(0)} MB, errors ${errors.length}`);
}
const end = await state();
console.log('actions', JSON.stringify(counts));
console.log(`heap ${(heap0 / 1e6).toFixed(0)} MB -> ${(end.heap / 1e6).toFixed(0)} MB`);
console.log('stuck:', stuck.length ? stuck.join(', ') : 'none');
console.log('errors:', errors.length ? [...new Set(errors)].slice(0, 15).join('\n') : 'none');
await browser.close();
process.exit(errors.length || stuck.length ? 1 : 0);
