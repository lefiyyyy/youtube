// Procedural textures (wood, marble, tile, brick, fabric, wall paint).
import * as THREE from '../../vendor/three/three.module.min.js';
import { canvasTex } from './kit.js';

const cache = new Map();
const once = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

function shade(hex, f) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, f);
  return '#' + c.getHexString();
}
function noise(ctx, w, h, amt, alpha = 0.05) {
  const id = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n;
  }
  ctx.putImageData(id, 0, 0);
}

export function woodFloor(tint, kind = 'wood') {
  return once('wood' + tint + kind, () => canvasTex(512, 512, (ctx, w, h) => {
    const rows = kind === 'oak' ? 5 : 8;
    const ph = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -Math.random() * 200;
      while (x < w) {
        const len = 160 + Math.random() * 220;
        const base = shade(tint, (Math.random() - 0.5) * 0.045);
        ctx.fillStyle = base;
        ctx.fillRect(x, r * ph, len, ph);
        // grain
        ctx.globalAlpha = 0.12;
        for (let i = 0; i < 9; i++) {
          ctx.strokeStyle = shade(tint, -0.12 + Math.random() * 0.06);
          ctx.lineWidth = 0.6 + Math.random() * 1.4;
          ctx.beginPath();
          const yy = r * ph + Math.random() * ph;
          ctx.moveTo(x, yy);
          ctx.bezierCurveTo(x + len * 0.3, yy + (Math.random() - 0.5) * 8, x + len * 0.6, yy + (Math.random() - 0.5) * 8, x + len, yy + (Math.random() - 0.5) * 4);
          ctx.stroke();
        }
        if (Math.random() < 0.25) { // knot
          ctx.fillStyle = shade(tint, -0.15);
          ctx.beginPath(); ctx.ellipse(x + Math.random() * len, r * ph + ph / 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x + len - 1.5, r * ph, 1.5, ph);
        x += len;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fillRect(0, r * ph + ph - 1.5, w, 1.5);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, r * ph, w, 1);
    }
    noise(ctx, w, h, 10);
  }, { repeat: [1, 1] }));
}

export function marble(tint) {
  return once('marble' + tint, () => canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      ctx.strokeStyle = `rgba(120,110,100,${0.05 + Math.random() * 0.12})`;
      ctx.lineWidth = 0.5 + Math.random() * 2;
      ctx.beginPath();
      let x = Math.random() * w, y = 0;
      ctx.moveTo(x, y);
      while (y < h) { x += (Math.random() - 0.5) * 60; y += 20 + Math.random() * 40; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, i * h / 2); ctx.lineTo(w, i * h / 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * w / 2, 0); ctx.lineTo(i * w / 2, h); ctx.stroke(); }
    noise(ctx, w, h, 6);
  }, { repeat: [1, 1] }));
}

export function tiles(tint, line = '#1fd2ff') {
  return once('tile' + tint + line, () => canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      ctx.fillStyle = shade(tint, (Math.random() - 0.5) * 0.04);
      ctx.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3;
    for (let i = 0; i <= n; i++) { ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(w, i * s); ctx.stroke(); }
    noise(ctx, w, h, 8);
  }, { repeat: [1, 1] }));
}

export function brick() {
  return once('brick', () => canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#d8cfc4'; ctx.fillRect(0, 0, w, h);
    const bh = 32, bw = 96;
    for (let r = 0; r < h / bh; r++) {
      const off = (r % 2) * bw / 2;
      for (let x = -bw; x < w + bw; x += bw) {
        const c = new THREE.Color('#a4573f'); c.offsetHSL((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.08);
        ctx.fillStyle = '#' + c.getHexString();
        ctx.fillRect(x + off + 3, r * bh + 3, bw - 6, bh - 6);
      }
    }
    noise(ctx, w, h, 18);
  }, { repeat: [1, 1] }));
}

export function paint(tint) {
  return once('paint' + tint, () => canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 7);
  }, { repeat: [3, 2] }));
}

export function fabric(tint) {
  return once('fabric' + tint, () => canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.08;
    for (let y = 0; y < h; y += 2) { ctx.fillStyle = y % 4 ? '#000' : '#fff'; ctx.fillRect(0, y, w, 1); }
    for (let x = 0; x < w; x += 2) { ctx.fillStyle = x % 4 ? '#000' : '#fff'; ctx.fillRect(x, 0, 1, h); }
    ctx.globalAlpha = 1;
    noise(ctx, w, h, 10);
  }, { repeat: [4, 4] }));
}

export function knit(tint) {
  return once('knit' + tint, () => canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      ctx.beginPath(); ctx.ellipse(x + 2, y + 4, 1.6, 3.6, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 6, y + 4, 1.6, 3.6, -0.5, 0, Math.PI * 2); ctx.fill();
    }
  }, { repeat: [3, 3] }));
}

export function rugTex(c1, c2) {
  return once('rug' + c1 + c2, () => canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = c1; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = c2; ctx.lineWidth = 10;
    for (let r = 30; r < 130; r += 28) { ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.stroke(); }
    noise(ctx, w, h, 26);
  }));
}
