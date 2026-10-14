import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 576 } });
await page.goto('http://localhost:8080/?fresh&q=low', { waitUntil: 'load' });
await page.waitForSelector('.creator [data-a=done]', { timeout: 60000 });
await page.waitForTimeout(1500);
await page.click('.creator [data-a=done]', { force: true });
await page.waitForFunction(() => window.__G && !window.__G.game.busy, null, { timeout: 60000 });
await page.evaluate(() => { const G = window.__G; G.s.tutorial.done = true; G.ui.labels.clearMarkers(); G.s.money = 5000; });
await page.waitForTimeout(1500);
for (let i = 0; i < 3; i++) { const x = await page.$('.modal-wrap [data-x]'); if (x) await x.click({ force: true }); await page.waitForTimeout(600); }
await page.evaluate(() => { window.__G.shop.open('gear'); });
await page.waitForTimeout(5000);
await page.screenshot({ path: 'tools/shots/p_shop1.png' });
await page.addStyleTag({ content: '.glass{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'tools/shots/p_shop2.png' });
await page.evaluate(() => (window.__pauseRender = true));
await page.waitForTimeout(2500);
await page.screenshot({ path: 'tools/shots/p_shop3.png' });
console.log(await page.evaluate(() => {
  const out = [];
  for (const [x, y] of [[120, 420], [120, 290], [120, 200], [700, 300]]) {
    const els = document.elementsFromPoint(x, y).slice(0, 6).map((e) => e.tagName + '.' + (e.className?.baseVal ?? e.className) + ' bg=' + getComputedStyle(e).backgroundColor + ' op=' + getComputedStyle(e).opacity);
    out.push(x + ',' + y + ': ' + els.join(' | '));
  }
  return out.join('\n');
}));
await browser.close();
console.log('done');
