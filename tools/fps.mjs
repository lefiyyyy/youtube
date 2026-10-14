import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:8080/' + (process.argv[2] || ''), { waitUntil: 'load' });
await page.waitForTimeout(4000);
const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r(n / 3); }; requestAnimationFrame(f); }));
const info = await page.evaluate(() => { const w = window.__G?.world; if (!w) return null; const i = w.renderer.info; return { calls: i.render.calls, tris: i.render.triangles, geos: i.memory.geometries, tex: i.memory.textures, q: w.quality }; });
console.log('fps', fps.toFixed(1), JSON.stringify(info));
await browser.close();
