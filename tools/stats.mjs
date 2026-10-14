import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:8080/' + (process.argv[2] || ''), { waitUntil: 'load' });
await page.waitForTimeout(4000);
const info = await page.evaluate(() => {
  const w = window.__G.world; const r = w.renderer;
  r.info.autoReset = false; r.info.reset();
  r.render(w.scene, w.camera);
  const out = { calls: r.info.render.calls, tris: r.info.render.triangles };
  let meshes = 0; w.scene.traverse((o) => { if (o.isMesh) meshes++; });
  let charMeshes = 0; w.char.root.traverse((o) => { if (o.isMesh) charMeshes++; });
  out.meshes = meshes; out.char = charMeshes;
  const t0 = performance.now(); for (let i = 0; i < 5; i++) r.render(w.scene, w.camera); out.msPerRender = ((performance.now() - t0) / 5).toFixed(1);
  r.info.autoReset = true;
  return out;
});
console.log(JSON.stringify(info));
await browser.close();
