// City skyline seen through the windows; redrawn per time-of-day phase.
import * as THREE from '../../vendor/three/three.module.min.js';
import { seeded } from '../core/util.js';

const KEYS = [ // hour, top, bottom, building tint, lit fraction, starAlpha
  [0, '#070a1f', '#1d1840', '#141631', 0.65, 1],
  [5, '#0d1236', '#3a2a5a', '#1b1d3d', 0.55, 0.7],
  [6.5, '#3d4b8f', '#ffa47a', '#4a4566', 0.3, 0.1],
  [8.5, '#5c9df0', '#ffd7b0', '#6f7a99', 0.08, 0],
  [12, '#4f9cff', '#cfe8ff', '#7d8bab', 0.04, 0],
  [16.5, '#5a8de0', '#ffe2b8', '#727c9c', 0.06, 0],
  [18.5, '#3b2c78', '#ff7a5c', '#3d3555', 0.35, 0.15],
  [20, '#171845', '#5a2f6b', '#1d1c3b', 0.6, 0.6],
  [24, '#070a1f', '#1d1840', '#141631', 0.65, 1],
];
const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
export function skyParams(hour) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [h0, ...a] = KEYS[i], [h1, ...b] = KEYS[i + 1];
    if (hour >= h0 && hour <= h1) {
      const t = (hour - h0) / (h1 - h0);
      return { top: lerpC(a[0], b[0], t), bottom: lerpC(a[1], b[1], t), bld: lerpC(a[2], b[2], t), lit: a[3] + (b[3] - a[3]) * t, stars: a[4] + (b[4] - a[4]) * t, hour };
    }
  }
  return null;
}

export class Skyline {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024; this.canvas.height = 512;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    const rnd = seeded(1337);
    this.layers = [0, 1, 2].map((L) => {
      const b = [];
      let x = -20;
      while (x < 1044) {
        const w = 30 + rnd() * (L === 2 ? 90 : 60);
        const h = (L === 0 ? 140 : L === 1 ? 190 : 230) * (0.45 + rnd() * 0.75);
        b.push({ x, w, h, seed: rnd() * 1000, antenna: rnd() > 0.8, sign: L === 2 && rnd() > 0.75, signC: ['#ff4f8b', '#2fd6ff', '#9dff5a', '#ffb547'][Math.floor(rnd() * 4)] });
        x += w + (L === 2 ? 6 + rnd() * 30 : 2 + rnd() * 10);
      }
      return b;
    });
    this.stars = Array.from({ length: 90 }, () => [rnd() * 1024, rnd() * 260, rnd()]);
    this.lastKey = '';
  }
  draw(hour) {
    const key = (Math.round(hour * 4) / 4).toFixed(2);
    if (key === this.lastKey) return false;
    this.lastKey = key;
    const p = skyParams(hour % 24);
    const { ctx } = this;
    const W = 1024, H = 512;
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.85);
    g.addColorStop(0, '#' + p.top.getHexString()); g.addColorStop(1, '#' + p.bottom.getHexString());
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // stars
    for (const [x, y, s] of this.stars) { ctx.fillStyle = `rgba(255,255,255,${p.stars * (0.3 + s * 0.7)})`; ctx.fillRect(x, y, s > 0.8 ? 2 : 1, s > 0.8 ? 2 : 1); }
    // sun / moon
    const isDay = hour > 6 && hour < 19;
    if (isDay) {
      const k = (hour - 6) / 13; const sx = 120 + k * 780, sy = 330 - Math.sin(k * Math.PI) * 260;
      const sg = ctx.createRadialGradient(sx, sy, 5, sx, sy, 90); sg.addColorStop(0, 'rgba(255,250,220,1)'); sg.addColorStop(0.25, 'rgba(255,230,170,0.7)'); sg.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 90, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255,248,230,0.95)'; ctx.beginPath(); ctx.arc(780, 90, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#' + p.top.getHexString(); ctx.beginPath(); ctx.arc(792, 82, 24, 0, Math.PI * 2); ctx.fill();
    }
    // clouds (day)
    if (isDay) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 5; i++) { const cx = (i * 230 + 60) % 1024, cy = 70 + (i % 3) * 40; ctx.beginPath(); ctx.ellipse(cx, cy, 70, 16, 0, 0, Math.PI * 2); ctx.ellipse(cx + 30, cy - 10, 40, 14, 0, 0, Math.PI * 2); ctx.fill(); } }
    // haze glow at horizon at night
    if (!isDay) { const hg = ctx.createLinearGradient(0, H * 0.45, 0, H); hg.addColorStop(0, 'rgba(255,90,160,0)'); hg.addColorStop(1, 'rgba(255,120,170,0.25)'); ctx.fillStyle = hg; ctx.fillRect(0, H * 0.45, W, H * 0.55); }
    // buildings
    this.layers.forEach((layer, L) => {
      const base = H;
      const tint = p.bld.clone().lerp(p.bottom, [0.55, 0.3, 0][L]);
      const tintHex = '#' + tint.getHexString();
      for (const b of layer) {
        ctx.fillStyle = tintHex;
        ctx.fillRect(b.x, base - b.h, b.w, b.h);
        if (b.antenna) { ctx.fillRect(b.x + b.w / 2 - 1, base - b.h - 22, 2, 22); ctx.fillStyle = `rgba(255,60,80,${0.5 + p.lit})`; ctx.fillRect(b.x + b.w / 2 - 2, base - b.h - 24, 4, 4); }
        // windows
        const rnd = seeded(Math.floor(b.seed));
        const cw = L === 2 ? 7 : 5, chh = L === 2 ? 9 : 6, gap = L === 2 ? 6 : 4;
        for (let y = base - b.h + 8; y < base - 6; y += chh + gap) for (let x = b.x + 5; x < b.x + b.w - cw - 3; x += cw + gap) {
          const r = rnd();
          if (r < p.lit) {
            const warm = rnd() > 0.35;
            ctx.fillStyle = warm ? `rgba(255,214,140,${0.75 + rnd() * 0.25})` : `rgba(160,220,255,${0.7 + rnd() * 0.3})`;
            ctx.fillRect(x, y, cw, chh);
          } else if (p.lit < 0.2) {
            ctx.fillStyle = `rgba(200,225,255,${0.12 + rnd() * 0.15})`; ctx.fillRect(x, y, cw, chh);
          }
        }
        if (b.sign && p.lit > 0.25) {
          ctx.save(); ctx.shadowColor = b.signC; ctx.shadowBlur = 16; ctx.fillStyle = b.signC;
          ctx.fillRect(b.x + 6, base - b.h + 14, b.w - 12, 10); ctx.restore();
        }
      }
    });
    this.tex.needsUpdate = true;
    return true;
  }
}
