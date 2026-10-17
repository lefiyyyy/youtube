// Desktop / phone parity check: walks the main screens at several real device sizes and reports any visible UI
// element that is cut off by the viewport, plus console errors. Screenshots go to tools/shots/parity/.
// Usage: node tools/parity.mjs [deviceName...]   (needs the dev server on :8080)
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const DEVICES = {
  'desktop-1080p': { w: 1920, h: 1080 },
  'laptop-768': { w: 1366, h: 768 },
  'cg-embed': { w: 1024, h: 576 },        // CrazyGames' in-page game frame on a laptop
  'tablet': { w: 1024, h: 768, touch: true },
  'phone': { w: 844, h: 390, touch: true },
  'phone-small': { w: 667, h: 375, touch: true },
};
const pick = process.argv.slice(2);
const OUT = 'tools/shots/parity';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let problems = 0;

// visible elements of the open UI that stick out of the viewport (> 2px), ignoring scroll containers' children
const CLIPPED = () => {
  const out = [];
  const roots = document.querySelectorAll('#hud, #modals > *, #screens > *');
  for (const root of roots) {
    for (const e of root.querySelectorAll('button, .glass, .card, .modal, h2, .chip, .stat, .dock, .pcard, .goal, .latest, .chat, .s-act, .phone, .place, .nca, .pt-b')) {
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0 || e.closest('.hidden, .away')) continue;
      let p = e.parentElement, scrolled = false;
      while (p && p !== root) {
        const cs2 = getComputedStyle(p);
        if ((/auto|scroll/.test(cs2.overflowY) && p.scrollHeight > p.clientHeight) || (/auto|scroll/.test(cs2.overflowX) && p.scrollWidth > p.clientWidth)) { scrolled = true; break; }
        p = p.parentElement;
      }
      if (scrolled) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      if (r.left < -2 || r.top < -2 || r.right > innerWidth + 2 || r.bottom > innerHeight + 2) {
        out.push(`${e.tagName.toLowerCase()}.${[...e.classList].join('.')} "${(e.textContent || '').trim().slice(0, 24)}" @ ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
  }
  return [...new Set(out)].slice(0, 8);
};
// two visible HUD panels overlapping each other
const OVERLAPS = () => {
  const els = [...document.querySelectorAll('#hud .pcard, #hud .clock, #hud .hud-tc > *, #hud .hud-tr > *, #hud .hud-r > *, #hud .dock, #hud .latest')]
    .filter((e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && !e.closest('.hidden') && e.getBoundingClientRect().width > 4; });
  const out = [];
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
    const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
    const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ix > 3 && iy > 3) out.push(`${els[i].className.split(' ')[0]} × ${els[j].className.split(' ')[0]}`);
  }
  return out;
};

for (const [name, d] of Object.entries(DEVICES)) {
  if (pick.length && !pick.includes(name)) continue;
  const ctx = await browser.newContext({ viewport: { width: d.w, height: d.h }, hasTouch: !!d.touch, isMobile: !!d.touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  const wait = (ms) => page.waitForTimeout(ms);
  const js = (fn, a) => page.evaluate(fn, a);
  const click = async (sel) => { await page.waitForSelector(sel, { state: 'visible', timeout: 30000 }); await page.click(sel, { force: true }); await wait(900); };
  const check = async (screen) => {
    // let entrance animations (slide-ins, pops) finish first: the software renderer can be slow to advance them
    await page.waitForFunction(() => !document.getAnimations().some((a) => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming().endTime)), null, { timeout: 8000 }).catch(() => {});
    const clipped = await js(CLIPPED);
    const over = screen === 'room' ? await js(OVERLAPS) : [];
    await page.screenshot({ path: `${OUT}/${name}_${screen}.png` });
    const bad = [...clipped.map((c) => 'cut off: ' + c), ...over.map((o) => 'overlap: ' + o)];
    console.log(`${bad.length ? 'FAIL' : 'ok  '} ${name.padEnd(14)} ${screen}${bad.length ? '\n       ' + bad.join('\n       ') : ''}`);
    problems += bad.length;
  };
  const closeAll = async () => { for (let i = 0; i < 5; i++) { const ok = await js(() => { const t = '#modals > .modal-wrap:last-child'; const b = document.querySelector(`${t} [data-a=ok], ${t} [data-x]`); b?.click(); return !!b; }); if (!ok) break; await wait(700); } };
  try {
    await page.goto('http://localhost:8080/?fresh&q=low', { waitUntil: 'load' });
    await page.waitForSelector('.creator [data-a=done]', { timeout: 60000 });
    await wait(2000);
    await check('creator');
    await click('.creator [data-a=done]');
    await page.waitForFunction(() => window.__G && !window.__G.game.busy, null, { timeout: 60000 });
    await js(() => {
      const G = window.__G, s = G.s;
      s.tutorial.done = true; s.tutorial.step = 99; G.tutorial.refresh();
      s.level = 14; s.money = 48000; s.sparks = 140; s.fans = { vid: 96400, pulse: 21800, blip: 30500, lumo: 9200 };
      s.home = 2; s.homes = [0, 1, 2]; s.games.push('galaxyroyale');
      G.world.rebuildRoom(); G.game.refreshObjective();
    });
    await wait(1500); await closeAll(); await wait(800);
    await check('room');
    await click('#hud .dock [data-a=shop]'); await wait(1500);
    await check('shop');
    await closeAll(); await wait(800);
    await click('#hud .dock [data-a=phone]'); await wait(1200);
    await check('phone');
    await js(() => document.querySelector('.phone-wrap')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    await js(() => window.__G.social.ctx?.close()); await wait(1200);
    await click('#hud .dock [data-a=out]'); await wait(1000);
    await check('goout');
    await closeAll(); await wait(800);
    await click('#hud [data-a=create]'); await wait(1500);
    await check('hub');
    await click('.hub-card.stream'); await wait(1200);
    await check('stream-pick');
    await click('[data-a=g][data-id=galaxyroyale]'); await wait(1000);
    await click('[data-a=go]');
    await page.waitForSelector('.stream-ui', { timeout: 60000 }); await wait(6000);
    await check('stream');
    await js(() => window.__G.game.openSettings()); await wait(700);
    await check('settings');
  } catch (e) { console.log(`ERR  ${name.padEnd(14)} ${e.message.split('\n')[0]}`); problems++; await page.screenshot({ path: `${OUT}/${name}_error.png` }); }
  if (errors.length) { console.log(`ERR  ${name.padEnd(14)} console: ${errors.slice(0, 4).join(' | ')}`); problems += errors.length; }
  await ctx.close();
}
await browser.close();
console.log(problems ? `${problems} problem(s)` : 'all devices clean');
process.exit(problems ? 1 : 0);
