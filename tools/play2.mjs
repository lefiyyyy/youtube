// Mid-game flows: inject progress then exercise stream facecam, sleep, decor, themes, homes, level-up, milestone, deals.
import { chromium } from 'playwright';
const [,, w = '1024', h = '576'] = process.argv;
const OUT = 'tools/shots/b_';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message + '\n' + e.stack));
let n = 0;
const shot = async (name) => { await page.screenshot({ path: `${OUT}${String(++n).padStart(2, '0')}_${name}.png` }); console.log('shot', name); };
const wait = (ms) => page.waitForTimeout(ms);
const click = async (sel, opts = {}) => { await page.waitForSelector(sel, { timeout: opts.timeout || 20000, state: 'visible' }); await page.click(sel, { force: true }); await wait(opts.wait ?? 600); };
const idle = async (modalOk = false) => { await page.waitForFunction((m) => window.__G && !window.__G.game.busy && (m || !document.querySelector('.modal-wrap')), modalOk, { timeout: 90000 }); await wait(400); };
const closeModals = async () => { for (let i = 0; i < 5; i++) { const x = await page.$('.modal-wrap [data-x]'); const ok = await page.$('.modal-wrap [data-a=ok]'); if (ok) await ok.click({ force: true }); else if (x) await x.click({ force: true }); else break; await wait(700); } };
try {
  await page.goto('http://localhost:8080/?fresh&q=' + (process.env.Q || 'low'), { waitUntil: 'load' });
  await wait(2500);
  await click('.creator [data-a=done]', { wait: 2000 });
  await page.evaluate(() => {
    const G = window.__G, s = G.s;
    s.tutorial.done = true; s.tutorial.step = 4;
    s.level = 9; s.xp = 0; s.money = 30000; s.sparks = 120;
    s.fans = { vid: 4200, pulse: 1500, blip: 2200, lumo: 300 };
    Object.assign(s.gear, { pc: 3, monitor: 3, camera: 3, mic: 3, light: 4, chair: 3, desk: 2, keys: 2, net: 2 });
    s.decor = ['neon_name', 'hex_lights', 'plant_big', 'beanbag', 'rug_round', 'figures', 'lava_lamp', 'cat', 'string_lights', 'poster_game'];
    s.placed = [...s.decor];
    s.games.push('nightshift', 'riftarena', 'neondrift');
    s.stats.videos = 12; s.stats.streams = 5; s.clips = 3;
    s.milestones = ['m100', 'm1k'];
    G.meta.refreshDeals(true);
    G.world.rebuildRoom();
    G.ui.labels.clearMarkers(); G.ui.hud.highlight(null);
    G.game.refreshObjective();
  });
  await closeModals();
  await wait(2500);
  await shot('room_mid');
  // stream facecam
  await click('#hud [data-a=create]', { wait: 1500 });
  await click('.hub-card.stream', { wait: 1500 });
  await click('[data-a=g][data-id=nightshift]', { wait: 1500 });
  await click('[data-a=go]', { wait: 1000 });
  await page.waitForSelector('.stream-ui', { timeout: 60000 });
  await wait(3000);
  await shot('facecam');
  await page.keyboard.press('Digit2'); await wait(700);
  { const q = await page.$('.qte'); if (q) await q.dispatchEvent('pointerdown'); }
  await wait(2500);
  await shot('facecam_reaction');
  await page.waitForFunction(() => document.querySelector('[data-a=end]')?.style.opacity === '1', null, { timeout: 180000 });
  await click('[data-a=end]', { wait: 1500 });
  await page.waitForSelector('.summary [data-a=ok]:not([disabled])', { timeout: 60000 });
  await click('.summary [data-a=ok]', { wait: 1500 });
  await idle(true); await closeModals(); await idle();
  // night + sleep
  await page.evaluate(() => { window.__G.s.clock.min = 22 * 60 + 30; window.__G.world.applyTime(22.5, true); });
  await wait(1500);
  await shot('night_room');
  await click('#hud .dock [data-a=rest]', { wait: 800 });
  await shot('rest_menu');
  await click('.modal [data-a=sleep]', { wait: 3500 });
  await shot('sleeping');
  await idle(true);
  await wait(800);
  await shot('morning');
  await closeModals(); await idle();
  // decor shop
  await click('#hud .dock [data-a=shop]', { wait: 1000 });
  await click('.sh-tabs .tab[data-k=decor]', { wait: 3000 });
  await shot('shop_decor');
  const buy = await page.$('.sh-info [data-a=buy]');
  if (buy) { await buy.click({ force: true }); await wait(1500); }
  await click('.sh-tabs .tab[data-k=fashion]', { wait: 3500 });
  await shot('shop_fashion');
  const buyC = await page.$('.sh-info [data-a=buy]');
  if (buyC) { await buyC.click({ force: true }); await wait(2000); }
  await shot('shop_fashion_bought');
  await click('.sh-tabs .tab[data-k=style]', { wait: 800 });
  await shot('shop_style');
  await click('[data-a=buyTheme][data-id=minimal]', { wait: 2500 });
  await idle(true);
  await wait(1000);
  await shot('theme_minimal');
  // phone deals + homes
  await click('#hud .dock [data-a=phone]', { wait: 1200 });
  await click('.app[data-id=deals]', { wait: 800 });
  await shot('deals');
  await click('[data-a=acc]', { wait: 800 });
  await click('[data-a=back]', { wait: 600 });
  await click('.app[data-id=homes]', { wait: 800 });
  await shot('homes');
  await click('[data-a=buy][data-id="1"]', { wait: 2500 });
  await idle(true);
  await wait(1500);
  await shot('apartment');
  // level up + milestone
  await page.evaluate(() => { window.__G.game.addXP(5000); window.__G.game.addFans('vid', 6000); });
  await wait(2500);
  await shot('levelup');
  await closeModals();
  await wait(2000);
  await shot('milestone');
  await closeModals();
  await idle();
  // wardrobe
  await page.evaluate(() => window.__G.life.wardrobe());
  await wait(4000);
  await shot('wardrobe');
  await click('.creator [data-a=wear][data-slot=top][data-v=jacket]', { wait: 800 });
  await click('.creator [data-a=done]', { wait: 2000 });
  // profile + settings
  await click('#hud [data-a=profile]', { wait: 1000 });
  await shot('profile');
  await closeModals();
  await click('#hud [data-a=settings]', { wait: 800 });
  await shot('settings');
  await closeModals();
  const st = await page.evaluate(() => { const s = window.__G.s; return { level: s.level, money: Math.round(s.money), fans: s.fans, home: s.home, theme: s.theme, deals: s.deals.active.length }; });
  console.log(JSON.stringify(st));
} catch (e) { console.log('SCRIPT ERROR', e.message); await shot('error'); }
console.log(errors.slice(0, 30).join('\n') || 'no console errors');
await browser.close();
