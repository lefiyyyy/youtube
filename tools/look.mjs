// High-quality room screenshots at given hours: node tools/look.mjs [hours...]
import { chromium } from 'playwright';
const hours = process.argv.slice(2).map(Number);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:8080/?fresh&q=high', { waitUntil: 'load' });
await page.waitForSelector('.creator [data-a=done]', { timeout: 60000 });
await page.waitForTimeout(1200);
await page.click('.creator [data-a=done]', { force: true });
await page.waitForFunction(() => window.__G && !window.__G.game.busy, null, { timeout: 90000 });
await page.evaluate(() => { const G = window.__G; G.s.tutorial.done = true; G.ui.labels.clearMarkers(); G.ui.hud.highlight(null); document.querySelectorAll('.pointer-hand').forEach((e) => e.remove()); });
for (let i = 0; i < 3; i++) { const x = await page.$('.modal-wrap [data-x]'); if (x) await x.click({ force: true }); await page.waitForTimeout(500); }
for (const hr of hours.length ? hours : [13, 21]) {
  await page.evaluate((hr) => { const G = window.__G; G.s.clock.min = hr * 60; G.world.applyTime(hr, true); }, hr);
  await page.waitForTimeout(3000);
  await page.evaluate(() => (window.__pauseRender = true));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `tools/shots/look_${hr}.png` });
  await page.evaluate(() => (window.__pauseRender = false));
}
await browser.close();
console.log('done');
