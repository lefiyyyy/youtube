import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 576 } });
await page.goto('http://localhost:8080/?fresh&q=low', { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.click('.creator [data-a=done]', { force: true }); await page.waitForTimeout(2500);
await page.evaluate(() => { const G = window.__G; G.s.tutorial.done = true; G.ui.labels.clearMarkers(); G.s.decor = ['plant_big','beanbag','rug_round','string_lights']; G.s.money = 5000; });
for (let i = 0; i < 3; i++) { const x = await page.$('.modal-wrap [data-x], .modal-wrap [data-a=ok]'); if (x) await x.click({ force: true }); await page.waitForTimeout(500); }
await page.evaluate(() => window.__G.shop.open('decor'));
await page.waitForTimeout(1500);
await page.screenshot({ path: 'tools/shots/p_shop1.png' });
await page.addStyleTag({ content: '.glass{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' });
await page.waitForTimeout(800);
await page.screenshot({ path: 'tools/shots/p_shop2.png' });
await browser.close();
