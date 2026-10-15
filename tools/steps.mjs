// Scripted screenshot runner: node tools/steps.mjs steps.json [w] [h] [outDir]
// steps: [{ "url": "/?fresh" } | { "click": "selector" } | { "eval": "js" } | { "wait": ms } | { "waitFor": "js predicate" } | { "shot": "name" }]
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
const steps = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const W = +(process.argv[3] || 1280), H = +(process.argv[4] || 720);
const out = process.argv[5] || 'tools/shots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, isMobile: W < 900, hasTouch: W < 900 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
for (const st of steps) {
  try {
    if (st.url) await page.goto('http://localhost:8080' + st.url, { waitUntil: 'load' });
    if (st.click) await page.click(st.click, { force: true, timeout: st.timeout || 20000 });
    if (st.eval) { const r = await page.evaluate(st.eval); if (r !== undefined) console.log('eval:', JSON.stringify(r).slice(0, 400)); }
    if (st.waitFor) await page.waitForFunction(st.waitFor, null, { timeout: st.timeout || 60000 });
    if (st.wait) await page.waitForTimeout(st.wait);
    if (st.shot) {
      await page.evaluate(() => (window.__pauseRender = true)); await page.waitForTimeout(250);
      await page.screenshot({ path: `${out}/${st.shot}.png` });
      await page.evaluate(() => (window.__pauseRender = false));
      console.log('shot', st.shot);
    }
  } catch (e) { console.log('STEP FAILED', JSON.stringify(st).slice(0, 120), e.message.split('\n')[0]); }
}
console.log('errors:', errs.length ? errs.slice(0, 12).join('\n') : 'none');
await browser.close();
