// Late-game flows: collab video, Lumo, inbox, delivery, team, poll/giveaway, penthouse.
import { launch, openPage, BASE } from './env.mjs';
const OUT = 'tools/shots/c_';
const browser = await launch();
const page = await openPage(browser, { w: 1024, h: 576 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message + '\n' + e.stack));
let n = 0;
const shot = async (name) => { await page.screenshot({ path: `${OUT}${String(++n).padStart(2, '0')}_${name}.png` }); console.log('shot', name); };
const wait = (ms) => page.waitForTimeout(ms);
const click = async (sel, opts = {}) => { await page.waitForSelector(sel, { timeout: opts.timeout || 30000, state: 'visible' }); await page.click(sel, { force: true }); await wait(opts.wait ?? 600); };
const idle = async (modalOk = false) => { await page.waitForFunction((m) => window.__G && !window.__G.game.busy && (m || (!document.querySelector('.modal-wrap') && !window.__G.game.queueList.length && !window.__G.game._qRunning)), modalOk, { timeout: 120000 }); await wait(400); };
const closeModals = async () => { for (let i = 0; i < 6; i++) { const ok = await page.$('.modal-wrap [data-a=ok]'); const x = await page.$('.modal-wrap [data-x]'); if (ok) await ok.click({ force: true }); else if (x) await x.click({ force: true }); else break; await wait(800); } };
try {
  await page.goto(BASE + '/?fresh&q=low', { waitUntil: 'load' });
  await page.evaluate(() => (window.__autoplay = true));
  await page.waitForSelector('.creator [data-a=done]', { timeout: 60000 }); await wait(800);
  await click('.creator [data-a=done]', { wait: 1500 });
  await idle(true);
  await page.evaluate(() => {
    const G = window.__G, s = G.s;
    s.tutorial.done = true; s.tutorial.step = 4;
    s.level = 21; s.xp = 0; s.money = 900000; s.sparks = 300;
    s.fans = { vid: 320000, pulse: 90000, blip: 120000, lumo: 40000 };
    Object.assign(s.gear, { pc: 5, monitor: 5, camera: 4, mic: 4, light: 5, chair: 4, desk: 4, keys: 3, net: 3 });
    s.decor = ['neon_name', 'hex_lights', 'plant_big', 'beanbag', 'rug_round', 'figures', 'lava_lamp', 'cat', 'arcade', 'fishtank', 'sculpture', 'gold_records', 'art_canvas', 'telescope', 'disco_ball', 'holo_plant', 'coffee', 'guitar', 'bookshelf'];
    s.placed = [...s.decor];
    s.games = ['blocktopia', 'pixelkart', 'hollowmanor', 'galaxyroyale', 'starfall', 'abyss', 'projectzero'];
    s.theme = 'tech'; s.themes.push('tech');
    s.home = 3; s.homes = [0, 1, 2, 3];
    s.stats.videos = 80; s.stats.streams = 30; s.clips = 4;
    s.milestones = ['m100', 'm1k', 'm10k', 'm100k'];
    s.lastMeal = { id: 'sushi', day: s.clock.day, premium: true };
    for (let i = 0; i < 6; i++) s.videos.push({ id: 'v' + i, title: 'Video ' + i, game: s.games[i % 7], type: 'gameplay', views: 50000 + i * 1000, subs: 900, money: 400, likes: 3000, day: 1, perf: 80 });
    G.meta.refreshDeals(true); G.meta.genInbox();
    G.world.rebuildRoom();
    G.ui.labels.clearMarkers(); G.ui.hud.highlight(null);
  });
  await closeModals();
  await page.evaluate(() => { window.__G.s.clock.min = 21 * 60; window.__G.world.applyTime(21, true); });
  await wait(3000);
  await shot('penthouse_night');
  // collab video
  await click('#hud [data-a=create]', { wait: 1500 });
  await click('.hub-card.video', { wait: 1500 });
  await click('[data-a=g][data-id=galaxyroyale]', { wait: 1200 });
  await click('[data-a=c][data-id=collab]', { wait: 1500 });
  await shot('collab_partners');
  await click('.modal [data-a=p]', { wait: 2500 });
  await page.waitForSelector('.edit-pick', { timeout: 90000 });
  await click('.edit-opt[data-a=pick]:last-child', { wait: 1000 });
  await page.waitForSelector('[data-a=pub]', { timeout: 60000 }); await wait(500);
  await shot('collab_publish');
  await click('[data-a=pub]', { wait: 3000 });
  await page.waitForSelector('.premiere [data-a=ok]:not([disabled])', { timeout: 60000 });
  await shot('collab_results');
  await click('.premiere [data-a=ok]', { wait: 2000 });
  await idle(true); await closeModals(); await idle();
  // stream with poll + giveaway
  await click('#hud [data-a=create]', { wait: 1500 });
  await click('.hub-card.stream', { wait: 1500 });
  await click('[data-a=g][data-id=abyss]', { wait: 1500 });
  await click('[data-a=go]', { wait: 1000 });
  await page.waitForSelector('.stream-ui', { timeout: 60000 });
  await wait(2500);
  await page.keyboard.press('Digit4'); await wait(1500);
  await shot('stream_poll');
  await page.keyboard.press('Digit5'); await wait(1500);
  await shot('stream_giveaway');
  await page.waitForFunction(() => document.querySelector('[data-a=end]')?.style.opacity === '1', null, { timeout: 180000 });
  await click('[data-a=end]', { wait: 1500 });
  await page.waitForSelector('.summary [data-a=ok]:not([disabled])', { timeout: 60000 });
  await shot('stream_summary_big');
  await click('.summary [data-a=ok]', { wait: 1500 });
  await idle(true); await closeModals(); await idle();
  // phone: lumo, inbox, team, delivery
  // a queued celebration (level up, milestone unboxing) can start right after the stream: retry until the phone opens
  for (let i = 0; i < 6 && !(await page.$('.phone-wrap')); i++) { await idle(true); await closeModals(); await idle(); await click('#hud .dock [data-a=phone]', { wait: 1500 }); }
  await click('.app[data-id=lumo]', { wait: 800 });
  await click('.post-type[data-k=setup]', { wait: 5000 });
  await shot('lumo_setup');
  await click('[data-a=back]', { wait: 600 });
  await click('.app[data-id=inbox]', { wait: 800 });
  await shot('inbox');
  await click('[data-a=rep]', { wait: 800 });
  await click('[data-a=back]', { wait: 600 });
  await click('.app[data-id=team]', { wait: 1500 });
  await shot('team');
  await click('.modal [data-a=hire]', { wait: 1000 });
  await closeModals(); await idle();
  await click('#hud .dock [data-a=phone]', { wait: 1200 });
  await click('.app[data-id=delivery]', { wait: 800 });
  await click('[data-a=order][data-id=sushi]', { wait: 3000 });
  await shot('delivery_door');
  await idle();
  await shot('after_delivery');
  // analytics late game
  await click('#hud [data-a=analytics]', { wait: 1200 });
  await shot('analytics_late');
  await closeModals();
  const st = await page.evaluate(() => { const s = window.__G.s; return { level: s.level, fans: s.fans, team: s.team, mood: s.mood }; });
  console.log(JSON.stringify(st));
} catch (e) { console.log('SCRIPT ERROR', e.message); await shot('error'); }
console.log(errors.slice(0, 30).join('\n') || 'no console errors');
await browser.close();
