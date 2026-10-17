// Shared browser setup for the test scripts.
//   BASE=http://localhost:8092   test another server (e.g. the shipped build: node server.js 8092 dist/game)
//   DEVICE="iPhone 13 landscape"  emulate a Playwright device (viewport, touch, mobile user agent)
//   OLD_APIS=1                    remove APIs older Safari / Firefox lack, so the fallbacks get exercised
import { chromium, devices } from 'playwright';

export const BASE = process.env.BASE || 'http://localhost:8080';
export const LAUNCH = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] };

const OLD_APIS = `(() => {
  delete CanvasRenderingContext2D.prototype.roundRect;          // Safari < 16, Firefox < 112
  delete window.requestIdleCallback; delete window.cancelIdleCallback; // Safari
  delete window.structuredClone;                                  // Safari < 15.4
  delete Array.prototype.at; delete String.prototype.at;          // Safari < 15.4
  delete Array.prototype.findLast; delete Object.hasOwn;          // Safari < 15.4
  delete window.OffscreenCanvas;                                  // Safari < 16.4
  const AC = window.AudioContext; delete window.AudioContext; window.webkitAudioContext = AC; // old WebKit
})();`;

export async function launch() { return chromium.launch(LAUNCH); }

export async function openPage(browser, { w = 1280, h = 720, mobile = false } = {}) {
  let opts = { viewport: { width: w, height: h }, hasTouch: !!mobile, isMobile: !!mobile };
  if (process.env.DEVICE) {
    const d = devices[process.env.DEVICE];
    if (!d) throw new Error('unknown DEVICE ' + process.env.DEVICE);
    opts = { ...d };
  }
  const ctx = await browser.newContext({ ...opts, deviceScaleFactor: 1 }); // DPR 1 keeps the software renderer fast
  if (process.env.OLD_APIS) await ctx.addInitScript(OLD_APIS);
  return ctx.newPage();
}
export const isMobileRun = (mobile) => !!mobile || /iPhone|iPad|Pixel|Galaxy/.test(process.env.DEVICE || '');
