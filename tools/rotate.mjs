// Rotation check: a phone turned upright mid-stream shows the rotate prompt and the stream waits; turning it back
// resumes it, and the 3D view is resized to the new screen.  Usage: node tools/rotate.mjs  (env.mjs: BASE, OLD_APIS)
import { launch, openPage, BASE } from './env.mjs';

const browser = await launch();
const page = await openPage(browser, { w: 844, h: 390, mobile: true });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
const wait = (ms) => page.waitForTimeout(ms);
const click = async (sel) => { await page.waitForSelector(sel, { state: 'visible', timeout: 60000 }); await page.click(sel, { force: true }); await wait(900); };
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; };

await page.goto(BASE + '/?fresh&q=low', { waitUntil: 'load' });
await click('.creator [data-a=done]');
await page.waitForFunction(() => window.__G && !window.__G.game.busy && !document.querySelector('.creator'), null, { timeout: 90000 });
await page.evaluate(() => { const G = window.__G; G.s.tutorial.done = true; G.s.tutorial.step = 99; G.tutorial.refresh(); G.s.level = 6; G.game.refreshObjective(); });
await page.evaluate(() => document.querySelectorAll('#modals [data-x], #modals [data-a=ok]').forEach((b) => b.click()));
await wait(800);
await click('#hud [data-a=create]');
await click('.hub-card.stream');
await click('[data-a=g]');
await click('[data-a=go]');
await page.waitForFunction(() => window.__G.stream.live?.S2?.t > 1, null, { timeout: 90000 });

const t = () => page.evaluate(() => window.__G.stream.live?.S2?.t ?? -1);
await page.setViewportSize({ width: 390, height: 844 });
await wait(600);
const a = await t(); await wait(3000); const b = await t();
ok(await page.evaluate(() => getComputedStyle(document.getElementById('rotate')).display !== 'none'), 'rotate prompt shows when upright');
ok(Math.abs(b - a) < 0.05, `stream waits while upright (${a.toFixed(2)}s -> ${b.toFixed(2)}s)`);
await page.setViewportSize({ width: 844, height: 390 });
await wait(800);
const c = await t(); await wait(3000); const d = await t();
ok(d - c > 0.5, `stream resumes after turning back (${c.toFixed(2)}s -> ${d.toFixed(2)}s)`);
const size = await page.evaluate(() => [window.__G.world.W, window.__G.world.H]);
ok(size[0] === 844 && size[1] === 390, `3D view resized to ${size.join('x')}`);
ok(!errors.length, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
await browser.close();
process.exit(fails ? 1 : 0);
