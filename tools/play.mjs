// Scripted playthrough of the tutorial + core loop. Usage: node tools/play.mjs [w] [h] [mobile]
import { launch, openPage, BASE } from './env.mjs';
const [,, w = '1280', h = '720', mobile] = process.argv;
const OUT = 'tools/shots/';
const browser = await launch();
const page = await openPage(browser, { w: +w, h: +h, mobile });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message + '\n' + e.stack));
const tag = mobile ? 'm_' : '';
let n = 0;
const shot = async (name) => { await page.screenshot({ path: `${OUT}${tag}${String(++n).padStart(2, '0')}_${name}.png`, timeout: 120000 }); console.log('shot', name); };
const click = async (sel, opts = {}) => { await page.waitForSelector(sel, { timeout: opts.timeout || 15000, state: 'visible' }); await page.click(sel, { force: true }); await page.waitForTimeout(opts.wait ?? 600); };
const wait = (ms) => page.waitForTimeout(ms);
const idle = async (modalOk = false) => { await page.waitForFunction((m) => window.__G && !window.__G.game.busy && (m || (!document.querySelector('.modal-wrap') && !window.__G.game.queueList.length && !window.__G.game._qRunning)), modalOk, { timeout: 90000 }); await wait(400); };
try {
  await page.goto(BASE + '/?fresh' + (process.env.Q ? '&q=' + process.env.Q : ''), { waitUntil: 'load' });
  await page.evaluate(() => (window.__autoplay = true));
  await wait(3500);
  await shot('creator');
  await click('.creator [data-a=gender][data-v=f]', { wait: 1200 });
  await click('.creator [data-a=set][data-k=hair][data-v=ponytail]');
  await click('.creator [data-a=tab][data-v=outfit]');
  await click('.creator [data-a=wear][data-slot=bottom][data-v=skirt]');
  await shot('creator_outfit');
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
  await page.waitForSelector('.rec-card', { timeout: 30000 });
  await wait(2500);
  await shot('recording');
  await page.waitForSelector('.edit-pick', { timeout: 60000 });
  await wait(800);
  await shot('edit_choice');
  await click('.edit-opt[data-id=clean]', { wait: 1800 });
  await shot('editing');
  await page.waitForSelector('[data-a=pub]', { timeout: 60000 });
  await wait(800);
  await shot('publish');
  await click('.tagb:not(.on)', { wait: 300 });
  await click('[data-a=pub]', { wait: 3500 });
  await page.waitForSelector('.premiere', { timeout: 30000 });
  await wait(3000);
  await shot('premiere');
  await click('.premiere [data-a=ok]:not([disabled])', { wait: 2500, timeout: 40000 });
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
  await page.waitForSelector('.shop .item[data-focus=mic]', { timeout: 15000 });
  await wait(2500);
  await shot('shop_mic');
  await click('.shop .item[data-focus=mic]', { wait: 800 });
  await click('.sh-info [data-a=buy]', { wait: 2000 });
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
  { const q = await page.$('.qte'); if (q) await q.dispatchEvent('pointerdown'); } await wait(2000);
  for (let i = 0; i < 6; i++) { const t = await page.$('[data-thank]'); if (t) await t.dispatchEvent('pointerdown'); const b = await page.$('[data-ban]'); if (b) await b.dispatchEvent('pointerdown'); await page.keyboard.press('Digit3'); await page.keyboard.press('Digit1'); await wait(2500); }
  await shot('live2');
  await wait(20000);
  await shot('live3');
  await page.waitForSelector('.summary', { timeout: 300000 });
  await wait(2500);
  await shot('summary');
  await click('.summary [data-a=ok]:not([disabled])', { wait: 2500, timeout: 120000 });
  for (let i = 0; i < 8; i++) { const top = '#modals > .modal-wrap:last-child'; const b = await page.$(`${top} [data-a=ok], ${top} [data-a=claim], ${top} [data-a=later], ${top} [data-x]`); if (b) { await shot('end_modal_' + i); await b.click({ force: true }); await wait(1800); } else await wait(800); }
  await shot('end');
  await idle();
  // phone
  await click('#hud .dock [data-a=phone]', { wait: 1500 });
  await shot('phone');
  await click('.app[data-id=blip]', { wait: 1000 });
  await click('.post-type[data-k=selfie]', { wait: 4000 });
  await shot('blip_post');
  await page.keyboard.press('Escape'); // closes the phone (a tap beside it would hit the room, e.g. the mirror)
  await idle();
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
