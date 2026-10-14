import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 576 } });
await page.goto('http://localhost:8080/?q=low', { waitUntil: 'load' });
await page.waitForTimeout(4000);
console.log(await page.evaluate(process.argv[2]));
await browser.close();
