// Scripted playthrough of the tutorial + core loop. Usage: node tools/play.mjs [w] [h] [mobile]
import { chromium } from 'playwright';
const [,, w = '1280', h = '720', mobile] = process.argv;
const OUT = 'tools/shots/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, hasTouch: !!mobile, isMobile: !!mobile, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message + '\n' + e.stack));
const tag = mobile ? 'm_' : '';
let n = 0;
const shot = async (name) => { await page.screenshot({ path: `${OUT}${tag}${String(++n).padStart(2, '0')}_${name}.png` }); console.log('shot', name); };
const click = async (sel, opts = {}) => { await page.waitForSelector(sel, { timeout: opts.timeout || 15000, state: 'visible' }); await page.click(sel, { force: true }); await page.waitForTimeout(opts.wait ?? 600); };
const wait = (ms) => page.waitForTimeout(ms);
const idle = async (modalOk = false) => { await page.waitForFunction((m) => window.__G && !window.__G.game.busy && (m || !document.querySelector('.modal-wrap')), modalOk, { timeout: 90000 }); await wait(400); };
try {
  await page.goto('http://localhost:8080/?fresh' + (process.env.Q ? '&q=' + process.env.Q : ''), { waitUntil: 'load' });
  await page.evaluate(() => (window.__autoplay = true));
  await wait(3500);
  await shot('creator');
  await click('.creator [data-a=set][data-k=hair][data-v=bob]');
  await click('.creator [data-a=set][data-k=top][data-v="#2fd6ff"]');
  await click('.creator [data-a=done]', { wait: 2500 });
  await shot('room_tutorial');
  // create
  await click('#hud [data-a=create]', { wait: 2500 });
  await shot('hub');
  await click('.hub-card.video', { wait: 1500 });
  await shot('game_picker');
  await click('[data-a=g]', { wait: 1200 });
  await shot('content_picker');
  await click('[data-a=c][data-id=gameplay]', { wait: 4000 });
  await shot('recording');
  await wait(9000);
  await shot('recording_late');
  await wait(3500);
  await page.waitForSelector('.timeline', { timeout: 15000 });
  await wait(1200);
  await shot('editing');
  // cut boring/bad
  for (const sel of await page.$$('.seg.meh, .seg.bad')) { try { await sel.click({ force: true, timeout: 500 }); } catch {} }
  await wait(6000);
  await page.waitForSelector('[data-a=pub]', { timeout: 15000 });
  await wait(800);
  await shot('publish');
  await click('[data-a=pub]', { wait: 3500 });
  await page.waitForSelector('.results', { timeout: 15000 });
  await wait(2600);
  await shot('results');
  await click('.results [data-a=ok]:not([disabled])', { wait: 2500, timeout: 20000 });
  await shot('after_video');
  await page.waitForSelector('.modal [data-a=ok]', { timeout: 30000 }).catch(() => {});
  // reward modal(s)
  for (let i = 0; i < 3; i++) { const b = await page.$('.modal [data-a=ok]'); if (b) { await shot('modal_' + i); await b.click({ force: true }); await wait(1500); } }
  await shot('hungry');
  await idle();
  await click('#hud .dock [data-a=kitchen]', { wait: 1000 });
  await shot('kitchen');
  await click('.modal [data-a=eat][data-id=noodles]', { wait: 2500 });
  await shot('cooking');
  await page.waitForFunction(() => window.__G.world.char.clip === 'eat' || window.__G.world.char.clip === 'cook', null, { timeout: 60000 }).catch(() => {});
  await shot('eating');
  await idle();
  await shot('ate');
  await click('#hud .dock [data-a=shop]', { wait: 1200 });
  await shot('shop');
  await click('[data-focus=mic] [data-a=buyGear]', { wait: 2000 });
  await shot('install');
  await idle(true);
  await shot('installed');
  // stream
  await idle();
  await click('#hud [data-a=create]', { wait: 2500 });
  await click('.hub-card.stream', { wait: 1500 });
  await click('[data-a=g]', { wait: 1200 });
  await shot('prelive');
  await click('[data-a=go]', { wait: 3000 });
  await shot('live1');
  await page.keyboard.press('Digit1'); await wait(1500);
  await page.keyboard.press('Digit2'); await wait(900);
  await shot('live_qte');
  await page.mouse.click(+w / 2, +h * 0.46); await wait(2000);
  for (let i = 0; i < 6; i++) { const t = await page.$('[data-thank]'); if (t) await t.dispatchEvent('pointerdown'); const b = await page.$('[data-ban]'); if (b) await b.dispatchEvent('pointerdown'); await page.keyboard.press('Digit3'); await page.keyboard.press('Digit1'); await wait(2500); }
  await shot('live2');
  await wait(20000);
  await shot('live3');
  await page.waitForSelector('.summary', { timeout: 40000 });
  await wait(2500);
  await shot('summary');
  await click('.summary [data-a=ok]:not([disabled])', { wait: 2500, timeout: 20000 });
  for (let i = 0; i < 4; i++) { const b = await page.$('.modal [data-a=ok], .modal [data-a=claim]'); if (b) { await shot('end_modal_' + i); await b.click({ force: true }); await wait(1800); } }
  await shot('end');
  await idle();
  // phone
  await click('#hud .dock [data-a=phone]', { wait: 1500 });
  await shot('phone');
  await click('.app[data-id=blip]', { wait: 1000 });
  await click('.post-type[data-k=selfie]', { wait: 4000 });
  await shot('blip_post');
  await page.keyboard.press('Escape');
  await page.mouse.click(30, +h / 2); await wait(1200);
  await click('#hud [data-a=events]', { wait: 1200 });
  await shot('events');
  await page.click('.modal [data-x]', { force: true }); await wait(600);
  await click('#hud [data-a=quests]', { wait: 1000 });
  await shot('quests');
  await page.click('.modal [data-x]', { force: true }); await wait(600);
  await click('#hud [data-a=analytics]', { wait: 1200 });
  await shot('analytics');
  await page.click('.modal [data-x]', { force: true }); await wait(600);
  const st = await page.evaluate(() => { const s = window.__G.s; return { level: s.level, xp: s.xp, money: s.money, fans: s.fans, tut: s.tutorial, needs: s.needs, clock: s.clock }; });
  console.log(JSON.stringify(st));
} catch (e) {
  console.log('SCRIPT ERROR', e.message);
  await shot('error');
}
console.log(errors.slice(0, 30).join('\n') || 'no console errors');
await browser.close();
