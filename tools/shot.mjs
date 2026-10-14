// Usage: node tools/shot.mjs <url> <out.png> [width] [height] [waitMs] [actionsJs]
import { chromium } from 'playwright';
const [,, url, out, w = '1280', h = '720', wait = '1500', js] = process.argv;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(+wait);
if (js) { await page.evaluate(js); await page.waitForTimeout(800); }
await page.screenshot({ path: out });
console.log(errors.slice(0, 20).join('\n') || 'no console errors');
await browser.close();
