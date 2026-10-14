// Returning player: save -> reload -> next day.
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 576 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('[error] ' + m.text()); });
const wait = (ms) => page.waitForTimeout(ms);
await page.goto('http://localhost:8080/?fresh&q=low', { waitUntil: 'load' });
await page.waitForSelector('.creator [data-a=done]', { timeout: 60000 }); await wait(1000);
await page.click('.creator [data-a=done]', { force: true });
await page.waitForFunction(() => window.__G && !window.__G.game.busy, null, { timeout: 90000 });
await page.evaluate(() => {
  const G = window.__G, s = G.s;
  s.tutorial.done = true; s.tutorial.step = 4;
  s.videos.push({ id: 'x', title: 'Test video', game: 'blocktopia', type: 'gameplay', views: 500, subs: 20, money: 50, likes: 30, day: 1, perf: 80, tailLeft: 3000, conv: 0.05, rpm: 0.15 });
  s.reminders.push('PLACEHOLDER');
});
// set a reminder for tomorrow's event via the events modal
await page.evaluate(() => { window.__G.meta.events(); });
await wait(1500);
await page.click('.modal [data-a=remind]', { force: true }); await wait(800);
await page.evaluate(() => { const s = window.__G.s; s.lastPlayed = Date.now() - 5 * 3600000; localStorage.setItem('streamer-rise-save-v1', JSON.stringify(s)); });
// reload (returning)
await page.goto('http://localhost:8080/?q=low', { waitUntil: 'load' });
await wait(9000);
await page.screenshot({ path: 'tools/shots/r_01_return.png' });
const t1 = await page.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' || ') + ' ## modal: ' + (document.querySelector('.modal .mh h2')?.textContent || 'none'));
console.log('return:', t1);
// claim daily
const c = await page.$('.modal [data-a=claim]'); if (c) { await c.click({ force: true }); await wait(2000); }
// next day
await page.evaluate(() => { const s = window.__G.s; localStorage.setItem('streamer-rise-save-v1', JSON.stringify(s)); });
await page.goto('http://localhost:8080/?q=low&dayOffset=1', { waitUntil: 'load' });
await wait(9000);
await page.screenshot({ path: 'tools/shots/r_02_nextday.png' });
const t2 = await page.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' || ') + ' ## modal: ' + (document.querySelector('.modal .mh h2')?.textContent || 'none') + ' ## streak ' + window.__G.s.daily.streak + ' quests ' + window.__G.s.quests.list.map((q) => q.id).join(','));
console.log('nextday:', t2);
console.log(errors.join('\n') || 'no console errors');
await browser.close();
