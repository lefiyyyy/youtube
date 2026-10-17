// Canvas-drawn animated monitor content: game renderers + OS / stream / editor screens.
import * as THREE from '../../vendor/three/three.module.min.js';

const TAU = Math.PI * 2;
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

// ------------------------------------------------------------------ GAME RENDERERS
// Each: (ctx, w, h, t, pal, fx) ; fx = {hit:0..1 decaying, fail:0..1, intensity}
export const RENDERERS = {
  sandbox(ctx, w, h, t, p, fx) {
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, p[1]); sky.addColorStop(1, '#cfefff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff6c4'; ctx.fillRect(w * 0.78, h * 0.1, h * 0.12, h * 0.12);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 4; i++) { const x = ((i * 170 + t * 12) % (w + 120)) - 60; ctx.fillRect(x, h * (0.12 + i * 0.05), 70, 16); ctx.fillRect(x + 14, h * (0.12 + i * 0.05) - 10, 40, 12); }
    const bs = Math.round(h / 12);
    const scroll = t * 18;
    for (let i = -1; i < w / bs + 2; i++) {
      const wx = i + Math.floor(scroll / bs);
      const height = 3 + Math.floor((Math.sin(wx * 0.35) + Math.sin(wx * 0.11) * 1.5 + 2.5) * 1.2);
      const x = i * bs - (scroll % bs);
      for (let j = 0; j < height; j++) {
        const y = h - (j + 1) * bs;
        ctx.fillStyle = j === height - 1 ? p[0] : j > height - 3 ? p[2] : '#7c7f8c';
        ctx.fillRect(x, y, bs - 1, bs - 1);
        if (j === height - 1) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, y + bs * 0.6, bs - 1, bs * 0.4); }
      }
      if (hash(wx) > 0.85) { // tree
        const th = height;
        ctx.fillStyle = '#7a5230'; ctx.fillRect(x + bs * 0.35, h - (th + 3) * bs, bs * 0.3, bs * 3);
        ctx.fillStyle = '#3fa34d'; ctx.fillRect(x - bs * 0.6, h - (th + 5) * bs, bs * 2.2, bs * 2.2);
      }
    }
    // player
    const px = w * 0.35, py = h - bs * 8.2 + Math.abs(Math.sin(t * 6)) * -6;
    ctx.fillStyle = '#2fd6ff'; ctx.fillRect(px, py, bs * 0.8, bs * 1.1);
    ctx.fillStyle = '#f2c7a5'; ctx.fillRect(px + bs * 0.05, py - bs * 0.7, bs * 0.7, bs * 0.7);
    ctx.fillStyle = '#222'; ctx.fillRect(px + bs * 0.45, py - bs * 0.5, 4, 4);
    // build tower on hit
    if (fx.hit > 0) {
      const n = Math.floor(fx.hit * 8);
      for (let k = 0; k < n; k++) { ctx.fillStyle = k % 2 ? '#ffd166' : '#ff6b6b'; ctx.fillRect(w * 0.6, h - bs * (6 + k), bs, bs - 1); }
      ctx.fillStyle = `rgba(255,255,255,${fx.hit * 0.4})`; ctx.fillRect(0, 0, w, h);
    }
    // hotbar
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, w * 0.3, h - 26, w * 0.4, 20, 4); ctx.fill();
    for (let i = 0; i < 8; i++) { ctx.fillStyle = ['#7fd858', '#9b6a3c', '#7c7f8c', '#ffd166', '#ff6b6b', '#57b3ff', '#fff', '#3fa34d'][i]; ctx.fillRect(w * 0.3 + 6 + i * (w * 0.4 - 8) / 8, h - 22, (w * 0.4) / 8 - 8, 12); }
  },
  racing(ctx, w, h, t, p, fx) {
    const neon = p[1] === '#120a2e';
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    sky.addColorStop(0, neon ? '#120a2e' : '#5ab0ff'); sky.addColorStop(1, neon ? '#ff2fd1' : '#bfe6ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.5);
    if (neon) { ctx.fillStyle = '#fff36b'; ctx.beginPath(); ctx.arc(w / 2, h * 0.5, h * 0.18, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#120a2e'; for (let i = 0; i < 6; i++) ctx.fillRect(w / 2 - h * 0.2, h * 0.36 + i * 9, h * 0.4, 3 + i * 0.6); }
    else { ctx.fillStyle = '#6fbf73'; ctx.beginPath(); ctx.moveTo(0, h * 0.5); for (let x = 0; x <= w; x += 40) ctx.lineTo(x, h * 0.42 + Math.sin(x * 0.02) * 12); ctx.lineTo(w, h * 0.5); ctx.fill(); }
    ctx.fillStyle = neon ? '#1a0f3a' : '#57a85b'; ctx.fillRect(0, h * 0.5, w, h * 0.5);
    const speed = 1 + fx.hit * 1.5;
    const curve = Math.sin(t * 0.6) * 0.6;
    for (let i = 0; i < 60; i++) {
      const z = i / 60;
      const y = h * 0.5 + z * z * h * 0.5;
      const rw = w * (0.04 + z * z * 0.95);
      const cx = w / 2 + curve * (1 - z) * (1 - z) * w * 0.4;
      const stripe = Math.floor((1 / (z + 0.08)) * 3 + t * 12 * speed) % 2;
      ctx.fillStyle = neon ? (stripe ? '#ff2fd1' : '#2ff3ff') : (stripe ? '#ff4f4f' : '#fff');
      ctx.fillRect(cx - rw / 2 - rw * 0.08, y, rw * 1.16, h * 0.5 / 60 + 1);
      ctx.fillStyle = neon ? '#22124a' : (stripe ? '#5c5f6b' : '#646775');
      ctx.fillRect(cx - rw / 2, y, rw, h * 0.5 / 60 + 1);
      if (stripe) { ctx.fillStyle = neon ? '#fff36b' : '#fff'; ctx.fillRect(cx - rw * 0.01, y, rw * 0.02, h * 0.5 / 60 + 1); }
    }
    // rival car
    const rz = (Math.sin(t * 0.7) * 0.5 + 0.5) * 0.5 + 0.2;
    const ry = h * 0.5 + rz * rz * h * 0.5, rs = 10 + rz * rz * 70;
    ctx.fillStyle = p[3]; rr(ctx, w / 2 + Math.sin(t) * 40 * rz - rs / 2, ry - rs * 0.5, rs, rs * 0.5, 4); ctx.fill();
    // player car
    const cx = w / 2 + Math.sin(t * 1.3) * 20, cy = h * 0.82;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, cy + 26, 60, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = p[0]; rr(ctx, cx - 55, cy - 10, 110, 36, 10); ctx.fill();
    ctx.fillStyle = '#1b1c24'; rr(ctx, cx - 36, cy - 30, 72, 26, 8); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(cx - 50, cy + 4, 14, 7); ctx.fillRect(cx + 36, cy + 4, 14, 7);
    if (fx.hit > 0) { ctx.fillStyle = `rgba(255,${150 + Math.random() * 100},0,${fx.hit})`; ctx.beginPath(); ctx.moveTo(cx - 25, cy + 26); ctx.lineTo(cx, cy + 26 + 50 * fx.hit + Math.random() * 15); ctx.lineTo(cx + 25, cy + 26); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${fx.hit * 0.6})`; ctx.lineWidth = 2; for (let i = 0; i < 14; i++) { const a = hash(i) * TAU; ctx.beginPath(); ctx.moveTo(w / 2 + Math.cos(a) * 60, h / 2 + Math.sin(a) * 40); ctx.lineTo(w / 2 + Math.cos(a) * 400, h / 2 + Math.sin(a) * 300); ctx.stroke(); } }
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; rr(ctx, 10, 10, 90, 28, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(`${Math.round(180 + fx.hit * 90 + Math.sin(t) * 8)} km/h`, 18, 30);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; rr(ctx, w - 70, 10, 60, 28, 6); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.fillText('P' + (1 + Math.floor((Math.sin(t * 0.2) * 0.5 + 0.5) * 3)), w - 55, 30);
  },
  cozy(ctx, w, h, t, p, fx) {
    ctx.fillStyle = p[0]; ctx.fillRect(0, 0, w, h);
    const ts = h / 7;
    for (let y = 0; y < 8; y++) for (let x = 0; x < w / ts + 1; x++) {
      const v = hash(x * 13 + y * 7);
      ctx.fillStyle = v > 0.5 ? '#86c862' : '#8fd26b'; ctx.fillRect(x * ts, y * ts, ts, ts);
    }
    // field
    for (let y = 2; y < 5; y++) for (let x = 2; x < 8; x++) {
      ctx.fillStyle = '#a0704a'; ctx.fillRect(x * ts + 2, y * ts + 2, ts - 4, ts - 4);
      const g = (Math.sin(t * 0.8 + x + y * 2) * 0.5 + 0.5);
      ctx.fillStyle = '#4caf50'; ctx.fillRect(x * ts + ts * 0.45, y * ts + ts * (0.7 - g * 0.4), ts * 0.1, ts * g * 0.4);
      if (g > 0.75) { ctx.fillStyle = p[2]; ctx.beginPath(); ctx.arc(x * ts + ts / 2, y * ts + ts * 0.3, ts * 0.13, 0, TAU); ctx.fill(); }
    }
    // house
    ctx.fillStyle = p[1]; ctx.fillRect(w * 0.72, h * 0.15, w * 0.2, h * 0.3);
    ctx.fillStyle = p[2]; ctx.beginPath(); ctx.moveTo(w * 0.7, h * 0.16); ctx.lineTo(w * 0.82, h * 0.02); ctx.lineTo(w * 0.94, h * 0.16); ctx.fill();
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(w * 0.8, h * 0.3, w * 0.04, h * 0.15);
    // character
    const cx = w * 0.25 + Math.sin(t * 0.7) * w * 0.25, cy = h * 0.72;
    ctx.fillStyle = p[3]; ctx.beginPath(); ctx.arc(cx, cy - 18, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e86f6f'; rr(ctx, cx - 10, cy - 8, 20, 22, 6); ctx.fill();
    ctx.fillStyle = '#333'; ctx.fillRect(cx - 5, cy - 20, 3, 3); ctx.fillRect(cx + 3, cy - 20, 3, 3);
    // cow
    const cowX = w * 0.15 + Math.sin(t * 0.3) * 30;
    ctx.fillStyle = '#fff'; rr(ctx, cowX, h * 0.88, 44, 22, 8); ctx.fill(); ctx.fillStyle = '#333'; ctx.fillRect(cowX + 8, h * 0.88 + 4, 10, 8);
    if (fx.hit > 0) { for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(255,105,150,${fx.hit})`; const hx = cx + Math.cos(i) * 30 * (1 - fx.hit) * 2, hy = cy - 40 - (1 - fx.hit) * 40 - i * 6; heart(ctx, hx, hy, 8); } }
  },
  horror(ctx, w, h, t, p, fx) {
    ctx.fillStyle = p[0]; ctx.fillRect(0, 0, w, h);
    const flick = Math.random() > 0.97 ? 0.4 : 1;
    // corridor perspective
    const vx = w / 2 + Math.sin(t * 0.5) * 30, vy = h * 0.45;
    ctx.strokeStyle = 'rgba(160,170,190,0.15)'; ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const z = ((i + (t * 0.6) % 1) / 10);
      const s = 1 - z;
      ctx.strokeRect(vx - w * s * 0.6, vy - h * s * 0.55, w * s * 1.2, h * s * 1.1);
    }
    // door at end
    ctx.fillStyle = p[2]; ctx.fillRect(vx - 14, vy - 30, 28, 50);
    // flashlight
    const fl = ctx.createRadialGradient(vx, vy + 10, 5, vx, vy + 10, h * 0.6);
    fl.addColorStop(0, `rgba(255,236,170,${0.55 * flick})`); fl.addColorStop(0.5, `rgba(255,226,138,${0.15 * flick})`); fl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fl; ctx.fillRect(0, 0, w, h);
    // hands/flashlight
    ctx.fillStyle = '#2a2b33'; rr(ctx, w * 0.6, h * 0.8, 50, 80, 10); ctx.fill();
    ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(w * 0.6 + 25, h * 0.82, 14, 0, TAU); ctx.fill();
    // ghost on hit
    if (fx.hit > 0) {
      const s = 0.5 + (1 - fx.hit) * 1.5;
      ctx.save(); ctx.translate(vx, vy); ctx.scale(s, s);
      ctx.fillStyle = `rgba(230,236,255,${fx.hit})`; ctx.beginPath(); ctx.arc(0, -10, 40, Math.PI, 0); ctx.lineTo(40, 40); for (let i = 0; i < 4; i++) ctx.lineTo(40 - i * 20 - 10, 30 + (i % 2) * 10); ctx.lineTo(-40, 40); ctx.fill();
      ctx.fillStyle = `rgba(20,0,10,${fx.hit})`; ctx.beginPath(); ctx.arc(-14, -12, 8, 0, TAU); ctx.arc(14, -12, 8, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 12, 10, 16, 0, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.fillStyle = `rgba(255,0,40,${fx.hit * 0.25})`; ctx.fillRect(0, 0, w, h);
    }
    // vignette + noise
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    ctx.fillStyle = 'rgba(255,40,60,0.85)'; ctx.font = 'bold 13px monospace'; ctx.fillText('BATTERY ' + Math.max(5, Math.round(80 - (t * 2) % 75)) + '%', 12, 22);
  },
  climb(ctx, w, h, t, p, fx) {
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, p[0]); sky.addColorStop(1, '#e8f6ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const sc = (t * 40) % 80;
    for (let i = -1; i < 8; i++) {
      const y = i * 80 + sc;
      const lvl = Math.floor((t * 40) / 80) - i;
      const x = (hash(lvl) * 0.7 + 0.1) * w;
      ctx.fillStyle = p[3]; rr(ctx, x, y, 90, 14, 6); ctx.fill();
      ctx.fillStyle = p[2]; ctx.fillRect(x + 4, y, 82, 4);
      if (hash(lvl + 3) > 0.7) { ctx.fillStyle = p[1]; for (let s = 0; s < 4; s++) { ctx.beginPath(); ctx.moveTo(x + 10 + s * 18, y); ctx.lineTo(x + 19 + s * 18, y - 12); ctx.lineTo(x + 28 + s * 18, y); ctx.fill(); } }
    }
    const jx = w / 2 + Math.sin(t * 2.2) * w * 0.25, jy = h * 0.6 - Math.abs(Math.sin(t * 3)) * 60 + (fx.fail > 0 ? (1 - fx.fail) * -100 + 160 * fx.fail : 0);
    ctx.fillStyle = p[1]; rr(ctx, jx - 12, jy - 24, 24, 24, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(jx - 6, jy - 18, 5, 5); ctx.fillRect(jx + 2, jy - 18, 5, 5);
    if (fx.hit > 0) { ctx.strokeStyle = `rgba(255,224,102,${fx.hit})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(jx, jy - 12, 20 + (1 - fx.hit) * 50, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, 10, 10, 110, 26, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(`HEIGHT ${Math.floor(t * 12)}m`, 18, 28);
  },
  shooter(ctx, w, h, t, p, fx) {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55); sky.addColorStop(0, p[0]); sky.addColorStop(1, p[2]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.55);
    ctx.fillStyle = shadeHex(p[0], 1.4); ctx.fillRect(0, h * 0.55, w, h * 0.45);
    const look = Math.sin(t * 0.5) * 80;
    // buildings / cover
    for (let i = 0; i < 9; i++) {
      const x = ((i * 130 - look) % (w + 260)) - 130, bh = 60 + hash(i) * 90;
      ctx.fillStyle = shadeHex(p[0], 0.8 + hash(i + 3) * 0.5); ctx.fillRect(x, h * 0.55 - bh, 100, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 10 + k * 22, h * 0.55 - bh + 12, 12, 10);
    }
    // enemies
    for (let i = 0; i < 3; i++) {
      const ex = ((i * 210 + 120 - look * 1.2 + Math.sin(t * 1.5 + i) * 30) % w + w) % w;
      const ey = h * 0.55 - 4;
      ctx.fillStyle = p[1]; rr(ctx, ex - 8, ey - 34, 16, 34, 5); ctx.fill(); ctx.beginPath(); ctx.arc(ex, ey - 40, 8, 0, TAU); ctx.fill();
    }
    // crosshair
    ctx.strokeStyle = fx.hit > 0 ? '#ff4f4f' : '#ffffff'; ctx.lineWidth = 2;
    const cs = 10 + fx.hit * 8;
    ctx.beginPath(); ctx.moveTo(w / 2 - cs, h / 2); ctx.lineTo(w / 2 - 4, h / 2); ctx.moveTo(w / 2 + 4, h / 2); ctx.lineTo(w / 2 + cs, h / 2); ctx.moveTo(w / 2, h / 2 - cs); ctx.lineTo(w / 2, h / 2 - 4); ctx.moveTo(w / 2, h / 2 + 4); ctx.lineTo(w / 2, h / 2 + cs); ctx.stroke();
    if (fx.hit > 0) { ctx.strokeStyle = `rgba(255,255,255,${fx.hit})`; ctx.beginPath(); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.moveTo(w / 2 + a * 8, h / 2 + b * 8); ctx.lineTo(w / 2 + a * 16, h / 2 + b * 16); } ctx.stroke(); }
    // gun
    const recoil = fx.hit * 18 + Math.max(0, Math.sin(t * 9)) * 3;
    ctx.fillStyle = '#20222c'; ctx.beginPath(); ctx.moveTo(w * 0.62, h + 10); ctx.lineTo(w * 0.7 + recoil * 0.3, h * 0.7 + recoil); ctx.lineTo(w * 0.78 + recoil * 0.3, h * 0.7 + recoil); ctx.lineTo(w * 0.86, h + 10); ctx.fill();
    ctx.fillStyle = p[1]; ctx.fillRect(w * 0.72 + recoil * 0.3, h * 0.73 + recoil, 30, 6);
    if (fx.hit > 0.6) { ctx.fillStyle = `rgba(255,220,120,${fx.hit})`; ctx.beginPath(); ctx.arc(w * 0.74, h * 0.68, 20 * fx.hit, 0, TAU); ctx.fill(); }
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, 10, h - 36, 120, 26, 6); ctx.fill();
    ctx.fillStyle = '#9dff5a'; ctx.fillRect(16, h - 28, 100 * (0.6 + Math.sin(t * 0.3) * 0.3), 10);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(`${Math.floor(24 - (t * 2) % 24)}/120`, w - 80, h - 18);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, w / 2 - 50, 8, 100, 22, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`ALIVE ${Math.max(2, 60 - Math.floor(t))}`, w / 2, 24); ctx.textAlign = 'left';
  },
  dungeon(ctx, w, h, t, p, fx) {
    ctx.fillStyle = p[0]; ctx.fillRect(0, 0, w, h);
    const ts = 24;
    for (let y = 0; y < h / ts + 1; y++) for (let x = 0; x < w / ts + 1; x++) {
      const wall = x === 0 || y === 0 || x >= Math.floor(w / ts) - 0 || y >= Math.floor(h / ts) || (hash(x * 31 + y * 17) > 0.9);
      ctx.fillStyle = wall ? shadeHex(p[0], 1.8) : ((x + y) % 2 ? shadeHex(p[0], 1.25) : shadeHex(p[0], 1.15));
      ctx.fillRect(x * ts, y * ts, ts - 1, ts - 1);
    }
    // coins
    for (let i = 0; i < 6; i++) { const cx = (hash(i) * 0.8 + 0.1) * w, cy = (hash(i + 9) * 0.7 + 0.15) * h; ctx.fillStyle = p[1]; ctx.beginPath(); ctx.arc(cx, cy + Math.sin(t * 4 + i) * 2, 5, 0, TAU); ctx.fill(); }
    // slimes
    for (let i = 0; i < 3; i++) { const sx = w * 0.3 + Math.sin(t * 0.8 + i * 2) * w * 0.3, sy = h * 0.3 + i * h * 0.2; ctx.fillStyle = p[2]; ctx.beginPath(); ctx.ellipse(sx, sy, 12, 9 + Math.sin(t * 6 + i) * 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillRect(sx - 5, sy - 3, 3, 3); ctx.fillRect(sx + 2, sy - 3, 3, 3); }
    // hero
    const hx = w / 2 + Math.cos(t * 0.9) * w * 0.25, hy = h / 2 + Math.sin(t * 1.3) * h * 0.2;
    ctx.fillStyle = p[3]; ctx.fillRect(hx - 8, hy - 10, 16, 18); ctx.fillStyle = '#f2c7a5'; ctx.fillRect(hx - 6, hy - 18, 12, 9);
    ctx.fillStyle = '#ddd'; ctx.fillRect(hx + 9, hy - 14 + Math.sin(t * 8) * 3, 3, 16);
    if (fx.hit > 0) { ctx.strokeStyle = `rgba(255,255,255,${fx.hit})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 18 + (1 - fx.hit) * 30, -1, 1); ctx.stroke(); }
    ctx.fillStyle = '#ff4f6b'; for (let i = 0; i < 3; i++) heart(ctx, 18 + i * 20, 18, 7);
    ctx.fillStyle = p[1]; ctx.font = 'bold 14px monospace'; ctx.fillText('x' + (12 + Math.floor(t)), w - 52, 22);
  },
  space(ctx, w, h, t, p, fx) {
    ctx.fillStyle = p[0]; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const sx = hash(i) * w, sy = (hash(i + 50) * h + t * (20 + hash(i + 7) * 60)) % h; ctx.fillStyle = `rgba(255,255,255,${0.3 + hash(i + 3) * 0.7})`; ctx.fillRect(sx, sy, 2, 2); }
    const pl = ctx.createRadialGradient(w * 0.8, h * 0.25, 5, w * 0.8, h * 0.25, 60); pl.addColorStop(0, p[2]); pl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pl; ctx.beginPath(); ctx.arc(w * 0.8, h * 0.25, 60, 0, TAU); ctx.fill();
    // enemies
    for (let i = 0; i < 4; i++) { const ex = w * (0.2 + i * 0.2) + Math.sin(t * 1.4 + i) * 30, ey = h * 0.2 + Math.cos(t + i) * 20; ctx.fillStyle = p[2]; ctx.beginPath(); ctx.moveTo(ex, ey + 12); ctx.lineTo(ex - 14, ey - 8); ctx.lineTo(ex + 14, ey - 8); ctx.fill(); }
    // lasers
    ctx.fillStyle = p[3]; for (let i = 0; i < 5; i++) { const ly = (h * 0.8 - ((t * 400 + i * 70) % (h * 0.8))); ctx.fillRect(w / 2 + Math.sin(t * 1.1) * w * 0.3 - 1, ly, 3, 14); }
    const sx = w / 2 + Math.sin(t * 1.1) * w * 0.3, sy = h * 0.85;
    ctx.fillStyle = p[1]; ctx.beginPath(); ctx.moveTo(sx, sy - 22); ctx.lineTo(sx - 18, sy + 12); ctx.lineTo(sx + 18, sy + 12); ctx.fill();
    ctx.fillStyle = p[3]; ctx.fillRect(sx - 4, sy + 12, 8, 6 + Math.random() * 6);
    if (fx.hit > 0) { const ex = w / 2, ey = h * 0.25; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.fillStyle = `rgba(255,${180 + i * 6},80,${fx.hit})`; ctx.fillRect(ex + Math.cos(a) * (1 - fx.hit) * 80, ey + Math.sin(a) * (1 - fx.hit) * 80, 5, 5); } }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; ctx.fillText('SCORE ' + String(Math.floor(t * 130)).padStart(6, '0'), 12, 22);
  },
  // pal: [grass, your kit, rival kit, accent/keeper]
  soccer(ctx, w, h, t, p, fx) {
    ctx.save();
    const u = h / 360, top = h * 0.25, P = 7, ph = (t % P) / P, cyc = Math.floor(t / P);
    // scripted attack: dribble up the pitch, shoot, ball in the net
    const drib = Math.min(1, ph / 0.72), px = 50 + drib * 36, py = 0.5 + Math.sin(ph * 9 + cyc * 2) * 0.17 * (1 - drib * 0.5);
    let bx, by, bz;
    if (ph < 0.72) { bx = px + 1.6; by = py + 0.015; bz = Math.abs(Math.sin(t * 11)) * 0.4; }
    else {
      const k = Math.min(1, (ph - 0.72) / 0.12), gy = 0.5 + (hash(cyc + 0.3) - 0.5) * 0.07;
      bx = px + 1.6 + k * (101.2 - px - 1.6); by = py + (gy - py) * k;
      bz = ph < 0.84 ? Math.sin(k * Math.PI * 0.8) * 2.6 : Math.max(0, 1.4 - (ph - 0.84) * 14);
    }
    const camX = Math.max(28, Math.min(84, bx - 2)), K = w / 44, Y0 = top + 10 * u, YH = h * 1.03 - Y0;
    const sc = (y) => 0.58 + 0.42 * y;
    const pr = (x, y) => [w / 2 + (x - camX) * K * sc(y), Y0 + y * YH];
    // stands, floodlights, grass + distance haze (static layer)
    ctx.drawImage(layer(`soc|${w}|${h}|${p[0]}`, w, h, (c) => {
      const st = c.createLinearGradient(0, 0, 0, top); st.addColorStop(0, '#0b0d18'); st.addColorStop(1, '#2a2e46');
      c.fillStyle = st; c.fillRect(0, 0, w, top + 1);
      for (const fxp of [0.18, 0.82]) { const g = c.createRadialGradient(w * fxp, 8 * u, 0, w * fxp, 8 * u, 70 * u); g.addColorStop(0, 'rgba(255,250,220,0.75)'); g.addColorStop(1, 'rgba(255,250,220,0)'); c.fillStyle = g; c.fillRect(w * fxp - 70 * u, 0, 140 * u, 80 * u); }
      c.fillStyle = p[0]; c.fillRect(0, top, w, h - top);
      const hz = c.createLinearGradient(0, top, 0, top + YH * 0.5); hz.addColorStop(0, 'rgba(0,0,0,0.25)'); hz.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = hz; c.fillRect(0, top, w, YH * 0.5);
    }), 0, 0);
    const shk = fx.fail * 6 * u; if (shk) ctx.translate(Math.sin(t * 93) * shk, Math.cos(t * 71) * shk * 0.6);
    // crowd: cached periodic strip, blitted in chunks that jump (harder after a goal)
    const cs = Math.max(3, Math.round(8 * u)), rs = Math.max(4, Math.round(9 * u)), per = cs * 32;
    const crowd = layer(`socc|${cs}|${rs}|${p.join()}`, per * 2, rs * 5 + cs, (c) => {
      const cols = [p[1], p[2], '#f1f1f6', p[3], '#4a4f6c', '#ffcf5a'];
      for (let r = 0; r < 6; r++) { c.globalAlpha = 0.9 - r * 0.1; for (let i = 0; i < 64; i++) { c.fillStyle = cols[Math.floor(hash((i % 32) * 1.7 + r * 13.1) * 6)]; c.fillRect(i * cs + (r % 2) * cs * 0.4, (5 - r) * rs, Math.ceil(cs * 0.72), Math.ceil(cs * 0.8)); } }
    });
    stripChunks(ctx, crowd, per, cs * 4, -camX * K * 0.3, top - 20 * u - 5 * rs, w, (k) => Math.max(0, Math.sin(t * (6 + fx.hit * 8) + k * 1.3)) * (1.5 + fx.hit * 5) * u);
    if (fx.hit > 0) { ctx.fillStyle = `rgba(255,255,255,${fx.hit})`; for (let i = 0; i < 14; i++) if (hash(i + Math.floor(t * 18) * 0.37) > 0.55) { const fx2 = hash(i * 3.3) * w, fy = top - 20 * u - hash(i * 7.1) * 46 * u; ctx.fillRect(fx2 - 3 * u, fy - 0.8 * u, 6 * u, 1.6 * u); ctx.fillRect(fx2 - 0.8 * u, fy - 3 * u, 1.6 * u, 6 * u); } }
    // ad boards
    const ab = 64 * u, aoff = -camX * K * 0.58;
    for (let i = Math.floor(-aoff / ab) - 1; i < Math.floor(-aoff / ab) + w / ab + 2; i++) {
      const x = i * ab + aoff, c = [p[3], '#f4f4fa', p[1], '#1b1e30'][((i % 4) + 4) % 4];
      ctx.fillStyle = c; ctx.fillRect(x, top - 11 * u, ab - 2 * u, 11 * u);
      ctx.fillStyle = c === '#f4f4fa' ? p[2] : 'rgba(255,255,255,0.75)'; ctx.fillRect(x + 10 * u, top - 7 * u, ab * 0.5, 3 * u);
    }
    // mowing stripes (scroll with the camera)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath();
    for (let i = Math.floor((camX - 42) / 6); i < (camX + 42) / 6; i++) {
      if (i & 1) continue;
      const a = pr(i * 6, 0), b = pr(i * 6 + 6, 0), c = pr(i * 6 + 6, 1.1), d = pr(i * 6, 1.1);
      ctx.moveTo(a[0], top); ctx.lineTo(b[0], top); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
    }
    ctx.fill();
    // markings
    ctx.strokeStyle = 'rgba(255,255,255,0.82)'; ctx.lineWidth = Math.max(1, 2 * u); ctx.lineJoin = 'round'; ctx.beginPath();
    const seg = (pts) => pts.forEach(([x, y], i) => { const q = pr(x, y); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    seg([[0, 0.03], [100, 0.03], [100, 0.97], [0, 0.97], [0, 0.03]]); seg([[50, 0.03], [50, 0.97]]);
    for (const sg of [1, -1]) { const gx = sg > 0 ? 100 : 0; seg([[gx, 0.22], [gx - sg * 16.5, 0.22], [gx - sg * 16.5, 0.78], [gx, 0.78]]); seg([[gx, 0.37], [gx - sg * 5.5, 0.37], [gx - sg * 5.5, 0.63], [gx, 0.63]]); }
    const circ = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU; circ.push([50 + Math.cos(a) * 9.15, 0.5 + Math.sin(a) * 0.13]); } seg(circ);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (const sx of [11, 50, 89]) { const q = pr(sx, 0.5); ctx.beginPath(); ctx.ellipse(q[0], q[1], 2.4 * u, 1.2 * u, 0, 0, TAU); ctx.fill(); }
    // goal (right), net bulges on a hit
    const gz = (x, y, z) => { const q = pr(x, y); return [q[0], q[1] - z * u * sc(y)]; };
    const gd = 2.4 + fx.hit * 1.8, A = gz(100, 0.445, 0), B = gz(100, 0.555, 0), A2 = gz(100, 0.445, 52), B2 = gz(100, 0.555, 52);
    const C = gz(100 + gd, 0.445, 0), D = gz(100 + gd, 0.555, 0), C2 = gz(100 + gd, 0.445, 44), D2 = gz(100 + gd, 0.555, 44);
    const poly = (pts) => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); };
    ctx.fillStyle = 'rgba(235,240,255,0.22)'; poly([A, A2, B2, D2, D, C]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(0.6, u * 0.9); ctx.beginPath();
    for (let i = 0; i <= 6; i++) { const k = i / 6; ctx.moveTo(C[0] + (D[0] - C[0]) * k, C[1] + (D[1] - C[1]) * k); ctx.lineTo(C2[0] + (D2[0] - C2[0]) * k, C2[1] + (D2[1] - C2[1]) * k); ctx.lineTo(A2[0] + (B2[0] - A2[0]) * k, A2[1] + (B2[1] - A2[1]) * k); }
    for (let i = 1; i <= 3; i++) { const k = i / 4; ctx.moveTo(A[0] + (A2[0] - A[0]) * k, A[1] + (A2[1] - A[1]) * k); ctx.lineTo(C[0] + (C2[0] - C[0]) * k, C[1] + (C2[1] - C[1]) * k); ctx.lineTo(D[0] + (D2[0] - D[0]) * k, D[1] + (D2[1] - D[1]) * k); }
    ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, 3.4 * u); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(A2[0], A2[1]); ctx.lineTo(B2[0], B2[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    // players (+ ball) sorted by depth
    const ppl = [{ x: px, y: py, team: 1, me: true, ph: 0 }, { x: bx, y: by, ball: true }];
    for (let i = 0; i < 4; i++) ppl.push({ x: px - 4 - hash(i + 5) * 16 + Math.sin(t * 0.9 + i * 2) * 2, y: 0.12 + i * 0.26 + Math.sin(t * 0.6 + i) * 0.04, team: 1, ph: i * 2.7 });
    for (let i = 0; i < 5; i++) { const hx = 68 + hash(i * 3.1) * 24, hy = 0.12 + i * 0.19; ppl.push({ x: hx + (px - hx) * 0.18 + Math.sin(t * 0.8 + i) * 1.5, y: hy + (py - hy) * 0.35, team: 2, ph: i * 1.9 }); }
    ppl.push({ x: 98.2, y: 0.5 + (by - 0.5) * (fx.fail > 0 ? 1 : 0.5), team: 3, ph: 4, keeper: true });
    ppl.sort((a, b) => a.y - b.y);
    const SK = ['#f2c7a5', '#c98b62', '#8a5a3c', '#e8b48f'], HR = ['#2b1d17', '#5a3a22', '#111018', '#d9b26a'];
    for (let n = 0; n < ppl.length; n++) {
      const q = ppl[n], [sx, sy] = pr(q.x, q.y), s = sc(q.y) * u * 1.32;
      if (sx < -40 * s || sx > w + 40 * s) continue;
      if (q.ball) {
        const z = bz * 9 * s;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(sx, sy, 4.5 * s, 1.8 * s, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx, sy - 4 * s - z, 4 * s, 0, TAU); ctx.fill();
        ctx.fillStyle = '#23263a'; ctx.beginPath(); ctx.arc(sx + Math.sin(t * 9) * 1.4 * s, sy - 4.4 * s - z, 1.5 * s, 0, TAU); ctx.fill();
        continue;
      }
      const kit = q.team === 1 ? p[1] : q.team === 2 ? p[2] : p[3], run = Math.sin(t * 13 + q.ph) * (q.keeper ? 0.35 : 1), id = Math.floor(q.ph * 3 + q.team);
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(sx, sy, 8 * s, 3 * s, 0, 0, TAU); ctx.fill();
      if (q.me) { ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.ellipse(sx, sy, 12 * s, 4.6 * s, 0, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#f2f2f6'; ctx.fillRect(sx - 4.6 * s + run * 2.2 * s, sy - 10 * s, 3.6 * s, 9 * s); ctx.fillRect(sx + 1 * s - run * 2.2 * s, sy - 10 * s, 3.6 * s, 9 * s);
      ctx.fillStyle = '#17192a'; ctx.fillRect(sx - 5.2 * s + run * 2.2 * s, sy - 2 * s, 4.6 * s, 2.4 * s); ctx.fillRect(sx + 0.6 * s - run * 2.2 * s, sy - 2 * s, 4.6 * s, 2.4 * s);
      ctx.fillStyle = mixHex(kit, '#000000', 0.55); ctx.fillRect(sx - 5.6 * s, sy - 15 * s, 11.2 * s, 6 * s);
      ctx.fillStyle = kit; rr(ctx, sx - 6.8 * s, sy - 26.5 * s, 13.6 * s, 12.5 * s, 3 * s); ctx.fill();
      const arm = q.keeper && fx.fail > 0 ? -8 : run * 1.6;
      ctx.fillRect(sx - 9.4 * s, sy - 25 * s - arm * s, 3 * s, 8 * s); ctx.fillRect(sx + 6.4 * s, sy - 25 * s + (q.keeper && fx.fail > 0 ? arm : -arm) * s, 3 * s, 8 * s);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(sx - 1.4 * s, sy - 23.5 * s, 2.8 * s, 5 * s);
      ctx.fillStyle = SK[id % 4]; ctx.beginPath(); ctx.arc(sx, sy - 31 * s, 4.9 * s, 0, TAU); ctx.fill();
      ctx.fillStyle = HR[(id + 1) % 4]; ctx.beginPath(); ctx.arc(sx, sy - 32 * s, 5 * s, Math.PI, TAU); ctx.fill();
      if (q.me) { const ay = sy - 41 * s - Math.abs(Math.sin(t * 5)) * 3 * s; ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.moveTo(sx - 5 * s, ay - 6 * s); ctx.lineTo(sx + 5 * s, ay - 6 * s); ctx.lineTo(sx, ay); ctx.fill(); }
    }
    if (ph < 0.05) { ctx.fillStyle = `rgba(0,0,0,${(1 - ph / 0.05) * 0.55})`; ctx.fillRect(-10, -10, w + 20, h + 20); }
    // HUD: scoreboard + clock + minimap
    const fs = (n) => Math.max(8, Math.round(n * u));
    ctx.fillStyle = 'rgba(8,10,22,0.85)'; rr(ctx, 10 * u, 10 * u, 150 * u, 26 * u, 6 * u); ctx.fill();
    ctx.fillStyle = p[1]; ctx.fillRect(16 * u, 16 * u, 5 * u, 14 * u); ctx.fillStyle = p[2]; ctx.fillRect(149 * u, 16 * u, 5 * u, 14 * u);
    ctx.fillStyle = '#ffffff'; ctx.font = `800 ${fs(13)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`HOM  ${2 + (fx.hit > 0 ? 1 : 0)} - 1  AWY`, 85 * u, 23.5 * u);
    ctx.fillStyle = p[3]; rr(ctx, 164 * u, 10 * u, 44 * u, 26 * u, 6 * u); ctx.fill();
    ctx.fillStyle = '#10121e'; ctx.fillText(`${46 + Math.floor(t * 0.8) % 44}'`, 186 * u, 23.5 * u);
    const mw = 84 * u, mh = 46 * u, mx = w - mw - 10 * u, my = h - mh - 10 * u;
    ctx.fillStyle = 'rgba(8,24,14,0.6)'; rr(ctx, mx, my, mw, mh, 4 * u); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(mx + 3 * u, my + 3 * u, mw - 6 * u, mh - 6 * u); ctx.beginPath(); ctx.moveTo(mx + mw / 2, my + 3 * u); ctx.lineTo(mx + mw / 2, my + mh - 3 * u); ctx.stroke();
    for (const q of ppl) { ctx.fillStyle = q.ball ? '#ffffff' : q.team === 1 ? p[1] : q.team === 2 ? p[2] : p[3]; const d = (q.me || q.ball ? 4 : 3) * u; ctx.fillRect(mx + 3 * u + q.x / 100 * (mw - 6 * u) - d / 2, my + 3 * u + q.y * (mh - 6 * u) - d / 2, d, d); }
    if (fx.hit > 0) {
      for (let i = 0; i < 36; i++) {
        const cx = (hash(i * 1.31) * w + Math.sin(t * 3 + i) * 12 * u), cy = (hash(i * 2.17) * h * 0.4 + (1 - fx.hit) * h * 0.9) % (h + 10);
        ctx.fillStyle = [p[1], p[3], '#ffffff', '#ffe14a'][i % 4]; ctx.globalAlpha = Math.min(1, fx.hit * 2);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 4 + i); ctx.fillRect(-2.5 * u, -4 * u, 5 * u, 8 * u); ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (fx.hit > 0.85) { ctx.fillStyle = `rgba(255,255,255,${(fx.hit - 0.85) * 3})`; ctx.fillRect(-10, -10, w + 20, h + 20); }
      popText(ctx, 'GOAL!', w / 2, h * 0.45, 78 * u * (1 + Math.max(0, fx.hit - 0.8) * 1.6), '#ffffff', mixHex(p[1], '#000000', 0.35), -0.06, Math.min(1, fx.hit * 3));
    }
    if (fx.fail > 0) {
      ctx.fillStyle = `rgba(255,30,60,${fx.fail * 0.22})`; ctx.fillRect(-10, -10, w + 20, h + 20);
      popText(ctx, 'SAVED!', w / 2, h * 0.45, 56 * u, '#ff5a6e', '#2a0610', 0.05, Math.min(1, fx.fail * 3));
    }
    ctx.restore();
  },
  // pal: [sky/arena, your fighter, rival fighter, accent (sun, headband)]
  fighter(ctx, w, h, t, p, fx) {
    ctx.save();
    const u = h / 360, fl = h * 0.74, gy = h * 0.9, cam = Math.sin(t * 0.35) * 26 * u;
    ctx.drawImage(layer(`fgt|${w}|${h}|${p[0]}`, w, h, (c) => { const sky = c.createLinearGradient(0, 0, 0, fl); sky.addColorStop(0, mixHex(p[0], '#000000', 0.6)); sky.addColorStop(1, p[0]); c.fillStyle = sky; c.fillRect(0, 0, w, h); }), 0, 0);
    const shk = (fx.fail * 7 + Math.max(0, fx.hit - 0.55) * 14) * u; if (shk) ctx.translate(Math.sin(t * 93) * shk, Math.cos(t * 71) * shk * 0.6);
    // retro sun
    const sunC = mixHex(p[3], '#ffffff', 0.25), sx = w / 2 - cam * 0.2, sy = fl - h * 0.24, sr = h * 0.2;
    ctx.fillStyle = sunC; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    ctx.fillStyle = mixHex(p[0], '#000000', 0.08); for (let i = 0; i < 5; i++) ctx.fillRect(sx - sr, sy + sr * (0.12 + i * 0.18), sr * 2, (1.5 + i * 1.5) * u);
    // skyline + lit windows
    ctx.fillStyle = mixHex(p[0], '#000000', 0.62); ctx.beginPath();
    for (let i = -1; i < 13; i++) { const bh = (40 + hash(i + 9.5) * 95) * u; ctx.rect(i * w / 11 - cam * 0.4, fl - bh, (34 + hash(i + 0.5) * 36) * u, bh); }
    ctx.fill();
    ctx.fillStyle = hexA(mixHex(p[3], '#ffffff', 0.4), 0.6); ctx.beginPath();
    for (let i = -1; i < 13; i++) { const bh = (40 + hash(i + 9.5) * 95) * u, x = i * w / 11 - cam * 0.4; for (let j = 0; j < 6; j++) if (hash(i * 7 + j) > 0.55) ctx.rect(x + (6 + (j % 2) * 14) * u, fl - bh + (10 + Math.floor(j / 2) * 18) * u, 6 * u, 9 * u); }
    ctx.fill();
    // crowd silhouettes: cached strip, chunks bounce (harder on a big hit)
    const cst = Math.max(4, Math.round(15 * u)), per = cst * 16, sh = Math.round(40 * u);
    const crowd = layer(`fgc|${cst}|${sh}|${p[0]}`, per * 2, sh, (c) => {
      c.fillStyle = mixHex(p[0], '#000000', 0.8); c.beginPath();
      for (let i = 0; i < 33; i++) { const x = i * cst + hash(i % 16) * 4 * u, hh = (16 + hash((i % 16) + 3) * 8) * u, y0 = sh - 12 * u; c.moveTo(x + 6.5 * u, y0 - hh); c.arc(x, y0 - hh, 6.5 * u, 0, TAU); c.rect(x - 8 * u, y0 - hh + 5 * u, 16 * u, hh + 7 * u); }
      c.fill();
    });
    stripChunks(ctx, crowd, per, cst * 2, -cam * 0.7, fl + 12 * u - sh, w, (k) => Math.max(0, Math.sin(t * 7 + k * 1.9)) * (2 + fx.hit * 7) * u);
    // stage floor
    ctx.fillStyle = mixHex(p[0], '#000000', 0.5); ctx.fillRect(-20, fl, w + 40, h - fl + 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = Math.max(1, 1.5 * u); ctx.beginPath();
    const vx = w / 2 - cam, vy = fl - h * 0.5, k0 = (fl - vy) / (h - vy);
    for (let i = -9; i <= 9; i++) { const xb = w / 2 - cam * 1.6 + i * 72 * u; if (xb < -w * 0.6 || xb > w * 1.6) continue; ctx.moveTo(vx + (xb - vx) * k0, fl); ctx.lineTo(xb, h); }
    for (let i = 1; i < 5; i++) { const y = fl + (h - fl) * Math.pow(i / 5, 1.5); ctx.moveTo(-20, y); ctx.lineTo(w + 20, y); }
    ctx.stroke();
    ctx.drawImage(layer(`fgl|${Math.round(sr)}|${h - fl}|${sunC}`, sr * 3.4, h - fl, (c, lw, lh) => { const rf = c.createRadialGradient(lw / 2, 8 * u, 0, lw / 2, 8 * u, sr * 1.7); rf.addColorStop(0, hexA(sunC, 0.32)); rf.addColorStop(1, hexA(sunC, 0)); c.fillStyle = rf; c.fillRect(0, 0, lw, lh); }), sx - sr * 1.7, fl);
    // fight choreography: jab, cross, kick, jab, rival attacks (blocked)
    const at = t * 1.25, stp = Math.floor(at), f = at - stp, mv = stp % 5;
    const ext = f < 0.2 ? f / 0.2 : f < 0.42 ? 1 : Math.max(0, 1 - (f - 0.42) / 0.3), youAtk = mv !== 4, hitNow = f >= 0.2 && f < 0.42;
    const mid = w / 2 - cam * 0.9, gap = (170 + Math.sin(t * 0.8) * 14) * u, s = u * 1.02;
    const yx = mid - gap / 2 + (youAtk ? ext * 16 * u : -ext * 6 * u) - fx.fail * 26 * u;
    const ox = mid + gap / 2 + (youAtk && hitNow ? 8 * u : 0) + fx.hit * 30 * u - (mv === 4 ? ext * 16 * u : 0);
    const you = { body: p[1], pants: mixHex(p[1], '#000000', 0.5), skin: '#f2c7a5', glove: '#f4f4fa', band: p[3], hair: '#2b1d17', shoe: '#1c1c26', belt: '#16161e' };
    const foe = { body: p[2], pants: mixHex(p[2], '#000000', 0.5), skin: '#b97a55', glove: '#ff4f4f', band: '#f4f4fa', hair: '#ece6dc', shoe: '#1c1c26', belt: '#16161e' };
    const drawYou = () => brawler(ctx, yx, gy, s, 1, you, { punch: youAtk && mv !== 2 ? ext : 0, kick: mv === 2 ? ext : 0, block: mv === 4 ? Math.min(1, ext * 1.5) : 0, recoil: fx.fail, ph: 0 }, t);
    const drawFoe = () => brawler(ctx, ox, gy, s, -1, foe, { punch: mv === 4 ? ext : 0, recoil: Math.max(youAtk && hitNow ? 0.35 : 0, fx.hit), flash: fx.hit > 0.72 ? 1 : 0, ph: 2.1 }, t);
    if (mv === 4) { drawYou(); drawFoe(); } else { drawFoe(); drawYou(); }
    if (hitNow) {
      const k = 1 - (f - 0.2) / 0.22;
      if (youAtk) { const cx = ox - 36 * s, cy = gy - (mv === 2 ? 118 : 98) * s; starBurst(ctx, cx, cy, (14 + 16 * k) * u, t * 5, '#ffe14a'); starBurst(ctx, cx, cy, (7 + 8 * k) * u, t * 5 + 0.3, '#ffffff'); }
      else { ctx.strokeStyle = `rgba(140,230,255,${k})`; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(yx + 36 * s, gy - 108 * s, (12 + (1 - k) * 18) * u, -1.3, 1.3); ctx.stroke(); }
    }
    if (fx.hit > 0) {
      const cx = ox - 24 * s, cy = gy - 100 * s, r = (30 + 50 * fx.hit) * u;
      ctx.strokeStyle = `rgba(255,255,255,${fx.hit * 0.8})`; ctx.lineWidth = 2.5 * u; ctx.beginPath();
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.2; ctx.moveTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9); ctx.lineTo(cx + Math.cos(a) * r * 1.8, cy + Math.sin(a) * r * 1.8); }
      ctx.stroke();
      starBurst(ctx, cx, cy, r, t * 2, hexA('#ffcf3a', Math.min(1, fx.hit * 1.5))); starBurst(ctx, cx, cy, r * 0.5, t * 2 + 0.2, hexA('#ffffff', Math.min(1, fx.hit * 1.5)));
    }
    vignette(ctx, w, h, '255,0,40', fx.fail * 0.5);
    // HUD: health bars, timer, names, super meter
    const fs = (n) => Math.max(8, Math.round(n * u));
    const hpY = Math.max(0.1, 0.78 - (t * 0.018) % 0.55 - fx.fail * 0.14), hpF = Math.max(0.06, 0.92 - (t * 0.035) % 0.72 - fx.hit * 0.18);
    const bW = w * 0.37, bH = 15 * u, bY = 16 * u;
    for (const side of [-1, 1]) {
      const v = side < 0 ? hpY : hpF, x0 = side < 0 ? w / 2 - 32 * u - bW : w / 2 + 32 * u;
      ctx.fillStyle = 'rgba(10,10,20,0.85)'; rr(ctx, x0 - 3 * u, bY - 3 * u, bW + 6 * u, bH + 6 * u, 4 * u); ctx.fill();
      const lag = Math.min(1, v + 0.08), fw = bW * v;
      ctx.fillStyle = '#e8283c'; side < 0 ? ctx.fillRect(x0 + bW * (1 - lag), bY, bW * lag, bH) : ctx.fillRect(x0, bY, bW * lag, bH);
      const hg = ctx.createLinearGradient(0, bY, 0, bY + bH); hg.addColorStop(0, '#fff27a'); hg.addColorStop(1, '#ffb11f');
      ctx.fillStyle = hg; side < 0 ? ctx.fillRect(x0 + bW - fw, bY, fw, bH) : ctx.fillRect(x0, bY, fw, bH);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; side < 0 ? ctx.fillRect(x0 + bW - fw, bY + 2 * u, fw, 3 * u) : ctx.fillRect(x0, bY + 2 * u, fw, 3 * u);
      ctx.font = `800 ${fs(11)}px sans-serif`; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffffff'; ctx.textAlign = side < 0 ? 'left' : 'right';
      ctx.fillText(side < 0 ? 'YOU' : 'RIVAL', side < 0 ? x0 : x0 + bW, bY + bH + 6 * u);
      ctx.fillStyle = p[3]; for (let r = 0; r < 2; r++) { const px2 = side < 0 ? x0 + bW - 6 * u - r * 12 * u : x0 + 6 * u + r * 12 * u; ctx.beginPath(); ctx.arc(px2, bY + bH + 12 * u, 4 * u, 0, TAU); r === 0 && side < 0 ? ctx.fill() : (ctx.lineWidth = 1.5 * u, ctx.strokeStyle = p[3], ctx.stroke()); }
    }
    ctx.fillStyle = 'rgba(10,10,20,0.9)'; rr(ctx, w / 2 - 25 * u, 8 * u, 50 * u, 34 * u, 6 * u); ctx.fill();
    ctx.strokeStyle = p[3]; ctx.lineWidth = 2 * u; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `800 ${fs(22)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(Math.max(1, 99 - Math.floor(t) % 99)), w / 2, 26 * u);
    const sup = ((t * 0.12) % 1) * 3 + fx.hit;
    ctx.font = `800 ${fs(10)}px sans-serif`; ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff'; ctx.fillText('SUPER', 14 * u, h - 16 * u);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(10,10,20,0.75)'; ctx.fillRect(56 * u + i * 34 * u, h - 22 * u, 31 * u, 11 * u); const k = Math.max(0, Math.min(1, sup - i)); ctx.fillStyle = k >= 1 ? mixHex(p[3], '#ffffff', 0.3) : p[3]; ctx.fillRect(56 * u + i * 34 * u, h - 22 * u, 31 * u * k, 11 * u); }
    if (fx.hit > 0) {
      const a = Math.min(1, fx.hit * 3), pop = 1 + Math.max(0, fx.hit - 0.8) * 1.5;
      popText(ctx, `${4 + Math.floor(t * 3) % 9} HITS`, w * 0.2, h * 0.32, 34 * u * pop, '#ffe14a', '#3a1600', -0.1, a);
      popText(ctx, 'COMBO!', w * 0.2, h * 0.43, 24 * u * pop, '#ffffff', mixHex(p[1], '#000000', 0.4), -0.1, a);
    }
    if (fx.fail > 0) popText(ctx, 'COUNTERED!', w / 2, h * 0.3, 40 * u, '#ff5a6e', '#2a0610', 0.04, Math.min(1, fx.fail * 3));
    ctx.restore();
  },
  // pal: [background, lane A, lane B, lane C] (lane D is a mix)
  rhythm(ctx, w, h, t, p, fx) {
    ctx.save();
    const u = h / 360, L = [p[1], p[2], p[3], mixHex(p[1], p[3], 0.5)];
    const bpm = 128, spb = 60 / bpm, bt = t / spb, pulse = Math.pow(1 - (bt % 1), 3);
    const glow = (a, base) => layer(`rgl|${w}|${h}|${p[0]}|${L[1]}|${a}`, w, h, (c) => { if (base) { c.fillStyle = p[0]; c.fillRect(0, 0, w, h); } const g = c.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, h * 0.95); g.addColorStop(0, hexA(L[1], a)); g.addColorStop(1, hexA(L[1], 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    ctx.drawImage(glow(0.3, true), 0, 0);
    if (pulse > 0.05) { ctx.globalAlpha = pulse; ctx.drawImage(glow(0.2, false), 0, 0); ctx.globalAlpha = 1; }
    const shk = fx.fail * 6 * u; if (shk) ctx.translate(Math.sin(t * 93) * shk, Math.cos(t * 71) * shk * 0.6);
    // stage beams
    for (let i = 0; i < 4; i++) { const x0 = w * (0.08 + i * 0.28), sw = Math.sin(t * 0.8 + i * 1.9) * w * 0.35; ctx.fillStyle = hexA(mixHex(L[i], '#ffffff', 0.3), 0.06 + pulse * 0.05 + fx.hit * 0.1); ctx.beginPath(); ctx.moveTo(x0 - 3 * u, -2); ctx.lineTo(x0 + 3 * u, -2); ctx.lineTo(x0 + sw + 40 * u, h); ctx.lineTo(x0 + sw - 40 * u, h); ctx.fill(); }
    // equalizer
    const nb = 24, bw = w / nb, sg = 8 * u;
    for (let l = 0; l < 4; l++) {
      ctx.fillStyle = hexA(L[l], 0.5); ctx.beginPath();
      for (let i = l; i < nb; i += 4) { const v = (0.2 + 0.8 * Math.abs(Math.sin(t * (1.7 + hash(i) * 2.6) + i * 0.9))) * (0.55 + pulse * 0.45 + fx.hit * 0.3); const n = Math.floor(v * h * 0.5 / sg); for (let j = 0; j < n; j++) ctx.rect(i * bw + 2 * u, h - (j + 1) * sg, bw - 4 * u, sg - 2 * u); }
      ctx.fill();
    }
    // note highway
    const cx = w / 2, yT = h * 0.03, yH = h * 0.8, wT = w * 0.13, wH = w * 0.44, look = 1.7, half = spb / 2;
    const wAt = (y) => wT + (wH - wT) * (y - yT) / (yH - yT), zY = (z) => yT + (yH - yT) * (z * z * 0.75 + z * 0.25), wB = wAt(h);
    // static highway (lanes, dividers, rails) cached; beat lines + hit/fail tints drawn live
    const hwy = (c, rails) => {
      c.fillStyle = 'rgba(4,5,12,0.8)'; c.beginPath(); c.moveTo(cx - wT / 2, yT); c.lineTo(cx + wT / 2, yT); c.lineTo(cx + wB / 2, h); c.lineTo(cx - wB / 2, h); c.fill();
      for (let l = 0; l < 4; l++) { c.fillStyle = hexA(L[l], 0.07); c.beginPath(); c.moveTo(cx + wT * (l / 4 - 0.5), yT); c.lineTo(cx + wT * ((l + 1) / 4 - 0.5), yT); c.lineTo(cx + wB * ((l + 1) / 4 - 0.5), h); c.lineTo(cx + wB * (l / 4 - 0.5), h); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = Math.max(1, u); c.beginPath();
      for (let l = 1; l < 4; l++) { const fr = l / 4 - 0.5; c.moveTo(cx + wT * fr, yT); c.lineTo(cx + wB * fr, h); }
      c.stroke(); c.lineWidth = 3 * u; c.lineCap = 'round';
      for (const sd of [-1, 1]) { c.strokeStyle = rails || L[sd < 0 ? 0 : 2]; c.beginPath(); c.moveTo(cx + sd * wT / 2, yT); c.lineTo(cx + sd * wB / 2, h); c.stroke(); }
    };
    const rails = fx.fail > 0 ? '#ff3b4f' : fx.hit > 0.3 ? '#ffffff' : '';
    const hx0 = Math.floor(cx - wB / 2 - 4 * u);
    ctx.drawImage(layer(`rhw|${w}|${h}|${L.join()}|${rails}`, w - hx0 * 2, h, (c) => { c.translate(-hx0, 0); hwy(c, rails); }), hx0, 0);
    if (fx.fail > 0) { ctx.fillStyle = hexA('#ff2040', fx.fail * 0.2); ctx.beginPath(); ctx.moveTo(cx - wT / 2, yT); ctx.lineTo(cx + wT / 2, yT); ctx.lineTo(cx + wB / 2, h); ctx.lineTo(cx - wB / 2, h); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = Math.max(1, u); ctx.beginPath();
    for (let b = Math.ceil(t / spb); b * spb < t + look; b++) { const y = zY(1 - (b * spb - t) / look), hw = wAt(y) / 2; ctx.moveTo(cx - hw, y); ctx.lineTo(cx + hw, y); }
    ctx.stroke();
    // notes (far to near)
    const nFirst = Math.floor((t - 0.2) / half), nLast = Math.floor((t + look) / half);
    for (let n = nLast; n >= nFirst; n--) {
      const dt = n * half - t; if (dt < 0) continue;
      const z = 1 - dt / look, y = zY(z), wy = wAt(y), lw = wy / 4;
      for (let l = 0; l < 4; l++) {
        if (!rNote(n, l)) continue;
        const x = cx - wy / 2 + lw * (l + 0.5);
        if (hash(n * 9.13 + l * 3.7) > 0.86) { const y2 = zY(Math.max(0, 1 - (dt + spb * 1.5) / look)), wy2 = wAt(y2), x2 = cx - wy2 / 2 + wy2 / 4 * (l + 0.5); ctx.fillStyle = hexA(L[l], 0.45); ctx.beginPath(); ctx.moveTo(x - lw * 0.13, y); ctx.lineTo(x + lw * 0.13, y); ctx.lineTo(x2 + wy2 * 0.033, y2); ctx.lineTo(x2 - wy2 * 0.033, y2); ctx.fill(); }
        const nh = (5 + 9 * z) * u, nw = lw * 0.8;
        ctx.fillStyle = L[l]; rr(ctx, x - nw / 2, y - nh / 2, nw, nh, nh / 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - nw * 0.3, y - nh * 0.3, nw * 0.6, Math.max(1, nh * 0.22));
      }
    }
    // hit line + pads (light up as notes land)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(cx - wH / 2, yH - u, wH, 2 * u);
    const nNow = Math.floor(t / half);
    for (let l = 0; l < 4; l++) {
      const lw = wH / 4, x = cx - wH / 2 + lw * (l + 0.5);
      let lit = fx.hit; for (let n = nNow - 1; n <= nNow; n++) if (rNote(n, l)) { const d = t - n * half; if (d >= 0 && d < 0.2) lit = Math.max(lit, 1 - d / 0.2); }
      if (lit > 0) { const fg = ctx.createLinearGradient(0, yH, 0, yH - 90 * u); fg.addColorStop(0, hexA(L[l], 0.6 * lit)); fg.addColorStop(1, hexA(L[l], 0)); ctx.fillStyle = fg; ctx.fillRect(x - lw * 0.4, yH - 90 * u, lw * 0.8, 90 * u); }
      ctx.fillStyle = hexA(L[l], 0.22 + lit * 0.7); ctx.strokeStyle = fx.fail > 0 && l % 2 ? '#ff3b4f' : L[l]; ctx.lineWidth = 3 * u;
      ctx.beginPath(); ctx.ellipse(x, yH, lw * 0.38, 10 * u, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(x, yH - 2 * u, lw * 0.16, 3 * u, 0, 0, TAU); ctx.fill();
      if (lit > 0) { ctx.strokeStyle = hexA('#ffffff', lit * 0.9); ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.ellipse(x, yH, lw * 0.38 + (1 - lit) * 22 * u, 10 * u + (1 - lit) * 12 * u, 0, 0, TAU); ctx.stroke(); }
    }
    // dancer (bottom-left)
    const dx = w * 0.13, dy = h * 0.95, bob = Math.abs(Math.sin(bt * Math.PI)) * 9 * u, arm = Math.sin(bt * Math.PI) > 0 ? 1 : -1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(dx, dy, 26 * u, 6 * u, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1d1b2c'; ctx.lineWidth = 8 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(dx - 7 * u, dy - 4 * u); ctx.lineTo(dx - 6 * u, dy - 26 * u - bob * 0.5); ctx.moveTo(dx + 7 * u, dy - 4 * u); ctx.lineTo(dx + 6 * u, dy - 26 * u - bob * 0.5); ctx.stroke();
    ctx.strokeStyle = '#f2c7a5'; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.moveTo(dx - 12 * u, dy - 52 * u - bob); ctx.lineTo(dx - 24 * u, dy - (arm > 0 ? 78 : 50) * u - bob); ctx.moveTo(dx + 12 * u, dy - 52 * u - bob); ctx.lineTo(dx + 24 * u, dy - (arm > 0 ? 50 : 78) * u - bob); ctx.stroke();
    ctx.fillStyle = L[2]; rr(ctx, dx - 15 * u, dy - 60 * u - bob, 30 * u, 36 * u, 9 * u); ctx.fill();
    ctx.fillStyle = '#f2c7a5'; ctx.beginPath(); ctx.arc(dx, dy - 76 * u - bob, 15 * u, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2b1d17'; ctx.beginPath(); ctx.arc(dx, dy - 79 * u - bob, 15.5 * u, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    ctx.strokeStyle = '#1d1b2c'; ctx.lineWidth = 3.5 * u; ctx.beginPath(); ctx.arc(dx, dy - 78 * u - bob, 18 * u, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    ctx.fillStyle = L[0]; rr(ctx, dx - 21 * u, dy - 82 * u - bob, 8 * u, 14 * u, 3 * u); ctx.fill(); rr(ctx, dx + 13 * u, dy - 82 * u - bob, 8 * u, 14 * u, 3 * u); ctx.fill();
    ctx.strokeStyle = '#1d1b2c'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(dx - 5 * u, dy - 76 * u - bob, 3 * u, Math.PI * 1.1, Math.PI * 1.9); ctx.moveTo(dx + 8 * u, dy - 76 * u - bob); ctx.arc(dx + 5 * u, dy - 76 * u - bob, 3 * u, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    // HUD
    const fs = (n) => Math.max(8, Math.round(n * u));
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; rr(ctx, 10 * u, 10 * u, 140 * u, 34 * u, 6 * u); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = `800 ${fs(11)}px sans-serif`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillText(`TRACK 0${1 + Math.floor(t / 40) % 9} · ${bpm} BPM`, 18 * u, 25 * u);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(18 * u, 32 * u, 124 * u, 4 * u); ctx.fillStyle = L[1]; ctx.fillRect(18 * u, 32 * u, 124 * u * ((t / 40) % 1), 4 * u);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = `800 ${fs(10)}px sans-serif`; ctx.fillText('SCORE', w - 14 * u, 22 * u);
    ctx.fillStyle = '#ffffff'; ctx.font = `800 ${fs(20)}px monospace`; ctx.fillText(String(Math.floor(t * 917) % 10000000).padStart(7, '0'), w - 14 * u, 44 * u);
    const mxx = w - 40 * u, mxy = 76 * u, mult = 1 + Math.floor((t * 0.25) % 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.arc(mxx, mxy, 20 * u, 0, TAU); ctx.stroke();
    ctx.strokeStyle = L[3]; ctx.beginPath(); ctx.arc(mxx, mxy, 20 * u, -Math.PI / 2, -Math.PI / 2 + ((t * 1.3) % 1) * TAU); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${fs(15)}px sans-serif`; ctx.fillText('x' + mult, mxx, mxy + u);
    const combo = fx.fail > 0 ? 0 : 24 + Math.floor(t * 4) % 400, cxx = (cx - wH / 2) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = `800 ${fs(11)}px sans-serif`; ctx.fillText('COMBO', cxx, h * 0.3);
    ctx.fillStyle = fx.fail > 0 ? '#ff5a6e' : '#ffffff'; ctx.font = `800 ${fs(38 + pulse * 4)}px sans-serif`; ctx.fillText(String(combo), cxx, h * 0.3 + 26 * u);
    if (fx.hit > 0) popText(ctx, 'PERFECT!', cx, yH - 74 * u, 34 * u * (1 + Math.max(0, fx.hit - 0.8) * 1.5), '#ffffff', mixHex(L[1], '#000000', 0.3), -0.04, Math.min(1, fx.hit * 3));
    if (fx.fail > 0) popText(ctx, 'MISS', cx, yH - 74 * u, 38 * u, '#ff5a6e', '#2a0610', 0.05, Math.min(1, fx.fail * 3));
    ctx.restore();
  },
  // pal: [background, block A, block B, block C] (more block colors are mixed from these)
  puzzle(ctx, w, h, t, p, fx) {
    ctx.save();
    const u = h / 360, C = blockColors(p);
    ctx.drawImage(layer(`pzl|${w}|${h}|${p[0]}`, w, h, (c) => { const bg = c.createLinearGradient(0, 0, w, h); bg.addColorStop(0, p[0]); bg.addColorStop(1, mixHex(p[0], '#000000', 0.5)); c.fillStyle = bg; c.fillRect(0, 0, w, h); }), 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath();
    for (let i = 0; i < 7; i++) { const s = 28 * u, x = ((hash(i + 0.4) * w + t * (8 + i * 3) * u) % (w + 160 * u)) - 80 * u, y = hash(i + 7.2) * h - 30 * u; for (const [a, b] of TETROS[i]) ctx.rect(x + a * s, y + b * s, s - 4 * u, s - 4 * u); }
    ctx.fill();
    const shk = fx.fail * 7 * u; if (shk) ctx.translate(Math.sin(t * 93) * shk, Math.cos(t * 71) * shk * 0.6);
    const COLS = 10, ROWS = 20, cs = Math.max(4, Math.floor(h * 0.86 / ROWS)), bw = cs * COLS, bh = cs * ROWS, bx = Math.round(w / 2 - bw / 2), by = Math.round((h - bh) / 2 + 3 * u);
    // board frame
    ctx.fillStyle = 'rgba(6,8,20,0.88)'; rr(ctx, bx - 6 * u, by - 6 * u, bw + 12 * u, bh + 12 * u, 8 * u); ctx.fill();
    ctx.strokeStyle = fx.fail > 0 ? '#ff3b4f' : hexA(p[1], 0.9); ctx.lineWidth = 3 * u; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 1; i < COLS; i++) { ctx.moveTo(bx + i * cs, by); ctx.lineTo(bx + i * cs, by + bh); }
    for (let i = 1; i < ROWS; i++) { ctx.moveTo(bx, by + i * cs); ctx.lineTo(bx + bw, by + i * cs); }
    ctx.stroke();
    // stack: a base pile per round + the pieces already dropped this round
    const P = 2.4, c = Math.floor(t / P), f = (t % P) / P, R = Math.floor(c / 4), well = Math.floor(hash(R * 1.3 + 0.2) * COLS);
    const hgt = [], cells = [];
    for (let x = 0; x < COLS; x++) { hgt.push(x === well ? 0 : 3 + Math.floor(hash(x * 2.7 + R * 0.91) * 4)); for (let y = 0; y < hgt[x]; y++) cells.push([x, y, C[Math.floor(hash(x * 7.1 + y * 3.3 + R) * C.length)]]); }
    let cur = null;
    for (let k = 4 * R; k <= c; k++) {
      const pc = pieceFor(k, COLS), land = pc.cells.reduce((m, [a, b]) => Math.max(m, hgt[pc.col + a] - (pc.hb - b)), 0);
      if (k < c) for (const [a, b] of pc.cells) { const y = land + pc.hb - b; cells.push([pc.col + a, y, C[pc.ci]]); hgt[pc.col + a] = Math.max(hgt[pc.col + a], y + 1); }
      else cur = { ...pc, land };
    }
    const clear = fx.hit > 0 ? 1 + Math.min(3, Math.floor(fx.hit * 4)) : 0, garb = fx.fail > 0 ? Math.ceil(fx.fail * 3) : 0;
    const cellY = (y) => by + bh - (y + 1 + garb) * cs, list = cells.slice();
    for (let r = 0; r < clear; r++) for (let x = 0; x < COLS; x++) if (!cells.some((q) => q[0] === x && q[1] === r)) list.push([x, r, C[(x + r) % C.length]]);
    // falling piece (+ ghost outline where it will land)
    let pc = null;
    if (cur) {
      const start = ROWS - cur.hb - 1, x0 = Math.min(4, COLS - cur.w), col = Math.round(x0 + (cur.col - x0) * Math.min(1, f / 0.35));
      const yb = Math.max(cur.land, Math.round(start + (cur.land - start) * Math.min(1, f / 0.85)));
      ctx.strokeStyle = hexA(C[cur.ci], 0.6); ctx.lineWidth = Math.max(1, 1.5 * u); ctx.beginPath();
      for (const [a, b] of cur.cells) ctx.rect(bx + (cur.col + a) * cs + 1.5, cellY(cur.land + cur.hb - b) + 1.5, cs - 3, cs - 3);
      ctx.stroke();
      pc = { col, yb }; for (const [a, b] of cur.cells) list.push([col + a, yb + cur.hb - b, C[cur.ci]]);
    }
    // blocks: one fill per colour, then a shared highlight pass and shade pass
    const vis = list.filter((q) => q[1] + garb < ROWS), byCol = new Map();
    for (const q of vis) { let arr = byCol.get(q[2]); if (!arr) byCol.set(q[2], (arr = [])); arr.push(q); }
    for (const [col, arr] of byCol) { ctx.fillStyle = col; for (const [x, y] of arr) ctx.fillRect(bx + x * cs + 0.5, cellY(y) + 0.5, cs - 1, cs - 1); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (const [x, y] of vis) ctx.fillRect(bx + x * cs + 0.5, cellY(y) + 0.5, cs - 1, cs * 0.22);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (const [x, y] of vis) ctx.fillRect(bx + x * cs + 0.5, cellY(y) + cs * 0.74, cs - 1, cs * 0.26 - 0.5);
    if (garb) {
      ctx.fillStyle = '#5b5f73'; for (let r = 0; r < garb; r++) for (let x = 0; x < COLS; x++) if (x !== (well + r) % COLS) ctx.fillRect(bx + x * cs + 0.5, by + bh - (r + 1) * cs + 0.5, cs - 1, cs - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let r = 0; r < garb; r++) for (let x = 0; x < COLS; x++) if (x !== (well + r) % COLS) ctx.fillRect(bx + x * cs + 0.5, by + bh - (r + 1) * cs + 0.5, cs - 1, cs * 0.2);
    }
    if (pc && f > 0.85) { ctx.fillStyle = `rgba(255,255,255,${(1 - (f - 0.85) / 0.15) * 0.7})`; for (const [a, b] of cur.cells) ctx.fillRect(bx + (pc.col + a) * cs, cellY(pc.yb + cur.hb - b), cs, cs); }
    // line clear flash + shards
    if (clear) {
      const a = Math.min(1, fx.hit * 1.6);
      ctx.fillStyle = `rgba(255,255,255,${a * 0.85})`; ctx.fillRect(bx, by + bh - clear * cs, bw, clear * cs);
      const sp = (1 - fx.hit) * 150 * u;
      ctx.fillStyle = hexA(mixHex(p[1], '#ffffff', 0.5), a * 0.5); ctx.fillRect(bx - sp, by + bh - clear * cs + cs * 0.3, bw + sp * 2, clear * cs - cs * 0.6);
      for (let i = 0; i < 24; i++) { const r = i % clear, side = i % 2 ? 1 : -1, d = sp * (0.4 + hash(i) * 0.9); ctx.fillStyle = hexA(C[i % C.length], a); ctx.fillRect(w / 2 + side * (bw / 2 + d) - cs * 0.3, by + bh - (r + 0.5) * cs + (hash(i + 5) - 0.5) * cs * 2 - cs * 0.3, cs * 0.6, cs * 0.6); }
    }
    // side panels: hold / stats / next
    const fs = (n) => Math.max(7, Math.round(n * u)), pw = 72 * u, lx = bx - 16 * u - pw, rx = bx + bw + 16 * u;
    const panel = (x, y, ph2, label) => { ctx.fillStyle = 'rgba(6,8,20,0.8)'; rr(ctx, x, y, pw, ph2, 6 * u); ctx.fill(); ctx.strokeStyle = hexA(p[2], 0.7); ctx.lineWidth = 2 * u; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.font = `800 ${fs(10)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(label, x + pw / 2, y + 15 * u); };
    const mini = (k, x, y) => { const pc = pieceFor(k, COLS), m = 11 * u; ctx.fillStyle = C[pc.ci]; ctx.beginPath(); for (const [a, b] of pc.cells) ctx.rect(x + (a - pc.w / 2) * m, y + (b - (pc.hb + 1) / 2) * m, m - 1.5 * u, m - 1.5 * u); ctx.fill(); };
    panel(lx, by, 64 * u, 'HOLD'); mini(R * 7 + 3, lx + pw / 2, by + 40 * u);
    panel(rx, by, 150 * u, 'NEXT'); for (let i = 1; i <= 3; i++) mini(c + i, rx + pw / 2, by + (i * 40 + 2) * u);
    const stats = [['SCORE', String(Math.floor(t * 211) % 1000000).padStart(6, '0')], ['LINES', String(12 + Math.floor(t / 2.4))], ['LEVEL', String(3 + Math.floor(t / 30) % 12)]];
    stats.forEach(([k, v], i) => { const y = by + (84 + i * 46) * u; ctx.fillStyle = 'rgba(6,8,20,0.65)'; rr(ctx, lx, y, pw, 40 * u, 6 * u); ctx.fill(); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = `800 ${fs(9)}px sans-serif`; ctx.fillText(k, lx + pw / 2, y + 13 * u); ctx.fillStyle = i === 0 ? p[3] : '#ffffff'; ctx.font = `800 ${fs(15)}px sans-serif`; ctx.fillText(v, lx + pw / 2, y + 32 * u); });
    if (clear) { popText(ctx, ['', 'SINGLE!', 'DOUBLE!', 'TRIPLE!', 'QUAD!'][clear], w / 2, by + bh * 0.42, 40 * u * (1 + Math.max(0, fx.hit - 0.8) * 1.5), '#ffffff', mixHex(p[1], '#000000', 0.35), -0.06, Math.min(1, fx.hit * 3)); popText(ctx, '+' + clear * 400, w / 2, by + bh * 0.42 + 34 * u - (1 - fx.hit) * 20 * u, 20 * u, p[3], '#10121e', 0, Math.min(1, fx.hit * 3)); }
    if (fx.fail > 0) popText(ctx, 'DANGER!', w / 2, by + bh * 0.2, 34 * u, '#ff5a6e', '#2a0610', 0.04, Math.min(1, fx.fail * 3) * (Math.sin(t * 30) > -0.3 ? 1 : 0.4));
    ctx.restore();
  },
  // pal: [board felt, your side, rival side, gold/highlight]
  cards(ctx, w, h, t, p, fx) {
    ctx.save();
    const u = h / 360, fs = (n) => Math.max(7, Math.round(n * u));
    const youF = mixHex(p[1], '#000000', 0.15), foeF = mixHex(p[2], '#000000', 0.15), handF = mixHex(p[1], '#000000', 0.35);
    // table, board, runes and deck piles never change: one cached layer
    ctx.drawImage(layer(`crd|${w}|${h}|${p.join()}`, w, h, (c) => {
      c.fillStyle = mixHex(p[0], '#000000', 0.6); c.fillRect(0, 0, w, h);
      const bx = w * 0.05, by = h * 0.04, bW = w * 0.9, bH = h * 0.92;
      const g = c.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, w * 0.6); g.addColorStop(0, mixHex(p[0], '#ffffff', 0.12)); g.addColorStop(1, mixHex(p[0], '#000000', 0.35));
      c.fillStyle = g; rr(c, bx, by, bW, bH, 22 * u); c.fill();
      c.strokeStyle = mixHex(p[3], '#000000', 0.45); c.lineWidth = 6 * u; c.stroke();
      c.strokeStyle = hexA(p[3], 0.55); c.lineWidth = 1.5 * u; rr(c, bx + 7 * u, by + 7 * u, bW - 14 * u, bH - 14 * u, 16 * u); c.stroke();
      c.strokeStyle = hexA(p[3], 0.13); c.lineWidth = 2 * u; c.beginPath(); c.arc(w / 2, h / 2, h * 0.2, 0, TAU); c.moveTo(w / 2 + h * 0.15, h / 2); c.arc(w / 2, h / 2, h * 0.15, 0, TAU); c.stroke();
      c.strokeStyle = hexA(p[3], 0.35); c.beginPath(); c.moveTo(w * 0.18, h / 2); c.lineTo(w * 0.82, h / 2); c.stroke();
      for (const [dy, col] of [[h * 0.3, p[2]], [h * 0.68, p[1]]]) for (let i = 0; i < 5; i++) cardBack(c, w * 0.915 + i * 1.5 * u, dy - i * 2 * u, 0.55 * u, col, p[3]);
    }), 0, 0);
    const shk = fx.fail * 7 * u; if (shk) ctx.translate(Math.sin(t * 93) * shk, Math.cos(t * 71) * shk * 0.6);
    // burning turn fuse along the centre line
    const fx0 = w * 0.18, fxN = fx0 + w * 0.64 * (1 - (t * 0.06) % 1);
    ctx.strokeStyle = '#ffb547'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(fx0, h / 2); ctx.lineTo(fxN, h / 2); ctx.stroke();
    starBurst(ctx, fxN, h / 2, (5 + Math.sin(t * 30) * 1.5) * u, t * 6, '#ffe14a');
    ctx.fillStyle = hexA(p[3], 0.35); for (let i = 0; i < 14; i++) { const mx = hash(i) * w, my = h - ((t * 14 * u + hash(i + 3) * h) % h); ctx.fillRect(mx + Math.sin(t + i) * 6 * u, my, 2.5 * u, 2.5 * u); }
    // rival hand peeking from the top
    const bs = 0.62 * u, cb = spr.back(p[2], p[3], bs);
    for (let i = 0; i < 5; i++) blit(ctx, cb, w * 0.2 + i * 26 * u, -2 * u + Math.sin(t * 1.3 + i) * 1.5 * u, 32 * bs, 44 * bs, (i - 2) * -0.1);
    // heroes
    drawHero(ctx, w / 2, h * 0.155, 36 * u, p[2], p[3], 1, 24 - (fx.hit > 0 && fx.hit < 0.45 ? 8 : 0) - Math.floor(t / 9) % 12, fx.hit > 0 && fx.hit < 0.45 ? fx.hit + 0.3 : 0, t, fs);
    drawHero(ctx, w / 2, h * 0.845, 38 * u, p[1], p[3], 0, 30 - (fx.fail > 0 ? 5 : 0) - Math.floor(t / 13) % 9, fx.fail, t, fs);
    // minions; one of yours attacks every few seconds
    const P = 3.2, ac = Math.floor(t / P), af = (t % P) / P, ai = ac % 4, ti = ac % 3, ms = 1.08 * u, gap = 84 * u;
    const foeX = (i) => w / 2 + (i - 1) * gap, youX = (i) => w / 2 + (i - 1.5) * gap, foeY = h * 0.355, youY = h * 0.64;
    const lunge = af < 0.3 ? 0 : af < 0.5 ? (af - 0.3) / 0.2 : af < 0.6 ? 1 : af < 0.8 ? 1 - (af - 0.6) / 0.2 : 0, impact = af >= 0.5 && af < 0.62;
    const mini = (x, y, frame, kind, atk, hp, k = 1, lift = 0) => {
      ctx.fillStyle = `rgba(0,0,0,${0.35 - lift * 0.12})`; ctx.beginPath(); ctx.ellipse(x + lift * 6 * ms, y + (34 + lift * 8) * ms, 26 * ms, 6 * ms, 0, 0, TAU); ctx.fill();
      blit(ctx, spr.minion(frame, p[3], kind, atk, hp, ms), x, y - lift * 4 * ms, 32 * ms, 36 * ms, 0, k);
    };
    for (let i = 0; i < 3; i++) mini(foeX(i) + (impact && i === ti ? Math.sin(t * 80) * 3 * u : 0), foeY + Math.sin(t * 1.6 + i) * 1.5 * u, foeF, i + 3, 2 + (i * 3) % 5, 3 + (i * 2 + ac) % 6);
    for (let i = 0; i < 4; i++) if (i !== ai) mini(youX(i), youY + Math.sin(t * 1.6 + i + 2) * 1.5 * u, youF, i, 1 + (i * 2) % 5, 2 + (i * 3 + 1) % 6);
    const up = Math.sin(Math.min(1, af / 0.3) * Math.PI / 2) * (1 - lunge * 0.5) * (af < 0.8 ? 1 : 1 - (af - 0.8) / 0.2);
    mini(youX(ai) + (foeX(ti) - youX(ai)) * lunge * 0.82, youY + (foeY - youY) * lunge * 0.82 - Math.sin(lunge * Math.PI) * 14 * u, youF, ai, 1 + (ai * 2) % 5, 2 + (ai * 3 + 1) % 6, 1 + up * 0.12, up);
    if (impact) { const k = 1 - (af - 0.5) / 0.12; starBurst(ctx, foeX(ti), foeY + 20 * u, (12 + 14 * k) * u, t * 4, '#ffe14a'); popText(ctx, '-' + (1 + (ai * 2) % 5), foeX(ti), foeY - 14 * u - (1 - k) * 14 * u, 24 * u, '#ff4f5e', '#ffffff', 0, 1); }
    // your hand (bottom-left); one card lifts at a time
    const hov = Math.floor(t * 0.6) % 5, hs = 0.95 * u;
    for (const pass of [0, 1]) for (let i = 0; i < 5; i++) {
      if ((i === hov) !== (pass === 1) || (fx.hit > 0 && i === 2)) continue;
      const lift = i === hov ? 28 * u : 0, x = w * 0.14 + i * 36 * u, y = h * 0.95 - lift + Math.abs(i - 2) * 6 * u;
      blit(ctx, spr.card(handF, p[3], i % 4, 1 + (i * 3) % 8, i % 2 ? null : 2 + i, i % 2 ? null : 3 + i, hs), x, y, 36 * hs, 48 * hs, (i - 2) * 0.12, i === hov ? 1.12 : 1);
    }
    // mana gems
    const mana = 3 + Math.floor(t / 2.2) % 8, gx = w * 0.67, gy = h * 0.935;
    ctx.font = `800 ${fs(13)}px sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#9fd4ff'; ctx.fillText(`${mana}/10`, gx - 10 * u, gy);
    ctx.fillStyle = '#3d9bff'; ctx.strokeStyle = 'rgba(160,200,255,0.45)'; ctx.lineWidth = 1.5 * u;
    for (let i = 0; i < 10; i++) { const x = gx + i * 13 * u, r = 5.5 * u; ctx.beginPath(); ctx.moveTo(x, gy - r * 1.3); ctx.lineTo(x + r, gy); ctx.lineTo(x, gy + r * 1.3); ctx.lineTo(x - r, gy); ctx.closePath(); i < mana ? ctx.fill() : ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < mana; i++) ctx.fillRect(gx + i * 13 * u - 1.6 * u, gy - 3.8 * u, 2.6 * u, 2.6 * u);
    // end turn button
    const ex = w * 0.865, ey = h / 2;
    ctx.fillStyle = hexA(p[3], 0.25 * (0.5 + Math.sin(t * 4) * 0.5)); rr(ctx, ex - 42 * u, ey - 18 * u, 84 * u, 36 * u, 18 * u); ctx.fill();
    ctx.drawImage(layer(`etb|${p[3]}|${u}`, 76 * u, 28 * u, (c, lw, lh) => { const eg = c.createLinearGradient(0, 0, 0, lh); eg.addColorStop(0, mixHex(p[3], '#ffffff', 0.3)); eg.addColorStop(1, mixHex(p[3], '#000000', 0.25)); c.fillStyle = eg; rr(c, 1 * u, 1 * u, 74 * u, 26 * u, 13 * u); c.fill(); c.fillStyle = '#1a1206'; c.font = `800 ${fs(10)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('END TURN', lw / 2, lh / 2 + u); }), Math.round(ex - 38 * u), Math.round(ey - 14 * u));
    // spell card flies at the rival hero on a hit
    if (fx.hit > 0) {
      const q = 1 - fx.hit, e = q < 0.8 ? (1 - Math.cos(Math.min(1, q / 0.75) * Math.PI)) / 2 : 1;
      const x0 = w * 0.14 + 72 * u, y0 = h * 0.86, x2 = w / 2, y2 = h * 0.155, qx = w * 0.18, qy = h * 0.3;
      const pt = (k) => [(1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * qx + k * k * x2, (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * qy + k * k * y2];
      for (let i = 5; i >= 1; i--) { const [tx, ty] = pt(Math.max(0, e - i * 0.05)); ctx.fillStyle = hexA(p[3], (0.5 - i * 0.08) * Math.min(1, fx.hit * 2)); ctx.beginPath(); ctx.arc(tx, ty, (12 - i * 1.6) * u, 0, TAU); ctx.fill(); }
      if (q < 0.85) { const [cx2, cy2] = pt(e), s2 = 1.15 * u; ctx.globalAlpha = q < 0.75 ? 1 : 1 - (q - 0.75) / 0.1; blit(ctx, spr.card(handF, p[3], 0, 6, null, null, s2), cx2, cy2, 36 * s2, 48 * s2, -0.3 + e * 0.5 + Math.sin(e * Math.PI) * 0.6, 1 - e * 0.4); ctx.globalAlpha = 1; }
      if (q > 0.55) { const k = (q - 0.55) / 0.45; starBurst(ctx, x2, y2, (20 + 40 * k) * u, t * 3, hexA('#ffcf3a', 1 - k)); starBurst(ctx, x2, y2, (10 + 20 * k) * u, t * 3 + 0.2, hexA('#ffffff', 1 - k)); popText(ctx, '-8', x2 + 52 * u, y2 + 10 * u - k * 16 * u, 34 * u, '#ff4f5e', '#ffffff', 0, Math.min(1, (1 - k) * 3)); }
    }
    if (fx.fail > 0) {
      vignette(ctx, w, h, '255,0,40', fx.fail * 0.45);
      starBurst(ctx, w / 2, h * 0.845, 34 * u * fx.fail, t * 4, hexA('#ff4f5e', fx.fail)); popText(ctx, '-5', w / 2 + 54 * u, h * 0.8 - (1 - fx.fail) * 16 * u, 32 * u, '#ff4f5e', '#ffffff', 0, Math.min(1, fx.fail * 3));
    }
    ctx.restore();
  },
};
function heart(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.6); ctx.bezierCurveTo(x - s * 1.2, y - s * 0.2, x - s * 0.4, y - s, x, y - s * 0.3); ctx.bezierCurveTo(x + s * 0.4, y - s, x + s * 1.2, y - s * 0.2, x, y + s * 0.6); ctx.fill(); }
function shadeHex(hex, f) { const c = new THREE.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString(); }
// ---- helpers for the newer renderers (soccer / fighter / rhythm / puzzle / cards)
// Static backgrounds, glows and sprites are drawn once into offscreen canvases and blitted (big gradients are the slow part).
const layerCache = new Map();
let layerPx = 0;
function layer(key, w, h, draw) {
  let c = layerCache.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    if (layerCache.size > 200 || layerPx + c.width * c.height > 4e6) { layerCache.clear(); layerPx = 0; } // ~16 MB cap
    draw(c.getContext('2d'), c.width, c.height); layerCache.set(key, c); layerPx += c.width * c.height;
  }
  return c;
}
// Blit a cached periodic strip (2 periods wide) in chunks that bob independently: a cheap animated crowd.
function stripChunks(ctx, img, period, cw, off, y, w, bob) {
  const k0 = Math.floor(-off / cw) - 1;
  for (let k = k0; k < k0 + w / cw + 3; k++) {
    const sx = (((k * cw) % period) + period) % period;
    ctx.drawImage(img, sx, 0, cw, img.height, Math.round(k * cw + off), Math.round(y - bob(k)), cw, img.height);
  }
}
function vignette(ctx, w, h, rgb, a) {
  if (a <= 0.01) return;
  const v = layer(`vig|${w}|${h}|${rgb}`, w, h, (c) => { const g = c.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},1)`); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  ctx.globalAlpha = Math.min(1, a); ctx.drawImage(v, -20, -20, w + 40, h + 40); ctx.globalAlpha = 1;
}
const mixCache = new Map();
function mixHex(a, b, k = 0.5) { const key = a + b + k; let v = mixCache.get(key); if (!v) { v = '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString(); mixCache.set(key, v); } return v; }
function hexA(hex, a) { const n = parseInt(hex.slice(1, 7), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; }
function starBurst(ctx, x, y, r, rot, col) { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = rot + i / 16 * TAU, d = i % 2 ? r * 0.4 : r * (0.75 + hash(i + 0.5) * 0.4); ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } ctx.closePath(); ctx.fill(); }
function popText(ctx, txt, x, y, size, fill, stroke, rot = 0, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); if (rot) ctx.rotate(rot);
  ctx.font = `800 ${Math.max(8, Math.round(size))}px Bricolage, Impact, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, size * 0.18); ctx.strokeStyle = stroke; ctx.strokeText(txt, 0, 0);
  ctx.fillStyle = fill; ctx.fillText(txt, 0, 0); ctx.restore();
}
function limb(ctx, x0, y0, x1, y1, x2, y2, lw, c1, c2 = c1) {
  ctx.lineWidth = lw; ctx.strokeStyle = c1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
  if (c2 === c1) { ctx.lineTo(x2, y2); ctx.stroke(); return; }
  ctx.stroke(); ctx.strokeStyle = c2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
// Chunky side-view fighter, feet at (x, y), facing +x when dir = 1. ps: {punch, kick, block, recoil, flash, ph} 0..1
function brawler(ctx, x, y, s, dir, c, ps, t) {
  const punch = ps.punch || 0, kick = ps.kick || 0, block = ps.block || 0, rec = ps.recoil || 0, W = ps.flash ? '#ffffff' : null;
  const bob = Math.sin(t * 7 + (ps.ph || 0)) * 2.5 * (1 - kick);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 42 * s, 8 * s, 0, 0, TAU); ctx.fill();
  ctx.scale(dir * s, s); ctx.translate(-rec * 16, 0); ctx.rotate(-rec * 0.2);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const body = W || c.body, pants = W || c.pants, skin = W || c.skin, glove = W || c.glove, shoe = W || c.shoe;
  const hy = -58 + bob + kick * 4;
  limb(ctx, -9, hy, -18, -30 + bob * 0.5, -26, -6, 17, pants);
  ctx.fillStyle = shoe; ctx.beginPath(); ctx.ellipse(-28, -5, 12, 6.5, 0, 0, TAU); ctx.fill();
  const kx = 20 + kick * 26, ky = -30 - kick * 42, fx2 = 26 + kick * 56, fy2 = -6 - kick * 64;
  limb(ctx, 9, hy, kx, ky + bob * 0.5 * (1 - kick), fx2, fy2, 17, pants);
  ctx.fillStyle = shoe; ctx.beginPath(); ctx.ellipse(fx2 + 5, fy2, 13, 7, -kick * 0.35, 0, TAU); ctx.fill();
  const sy = -98 + bob, bfx = 16 + block * 12, bfy = -102 + bob - block * 12;
  limb(ctx, -6, sy, 4 + block * 8, -78 + bob - block * 8, bfx, bfy, 13, body, skin);
  ctx.fillStyle = glove; ctx.beginPath(); ctx.arc(bfx, bfy, 10, 0, TAU); ctx.fill();
  ctx.fillStyle = body; rr(ctx, -22, -108 + bob, 44, 56, 13); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-11, -107 + bob); ctx.lineTo(3, -80 + bob); ctx.lineTo(15, -107 + bob); ctx.stroke();
  ctx.fillStyle = W || c.belt; ctx.fillRect(-22, -64 + bob, 44, 8); ctx.fillRect(-14, -58 + bob, 5, 12);
  const hx = 5 + punch * 5, hy2 = -126 + bob;
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy2, 18, 0, TAU); ctx.fill();
  ctx.fillStyle = W || c.hair; ctx.beginPath(); ctx.arc(hx - 1, hy2 - 3, 18.5, Math.PI * 0.92, Math.PI * 2.02); ctx.lineTo(hx - 22, hy2 - 22); ctx.lineTo(hx - 10, hy2 - 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = W || c.band; ctx.fillRect(hx - 18, hy2 - 9, 36, 6);
  const wave = Math.sin(t * 12 + (ps.ph || 0)) * 4; limb(ctx, hx - 17, hy2 - 6, hx - 30, hy2 - 3 + wave, hx - 42, hy2 + 3 - wave, 4, W || c.band);
  ctx.fillStyle = '#16141c'; ctx.fillRect(hx + 7, hy2 - 3, 4, 6); ctx.fillRect(hx + 4, hy2 - 6.5, 9, 2.2);
  if (rec > 0.3) { ctx.beginPath(); ctx.arc(hx + 10, hy2 + 8, 3, 0, TAU); ctx.fill(); }
  const pfx = 32 + punch * 46 - block * 8, pfy = -100 + bob - block * 14 + punch * 2, ex = 24 + punch * 18 - block * 2, ey = -78 + bob - punch * 16 - block * 10;
  limb(ctx, 8, sy + 2, ex, ey, pfx, pfy, 14, body, skin);
  ctx.fillStyle = glove; ctx.beginPath(); ctx.arc(pfx, pfy, 11, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(pfx + 2, pfy - 4, 4, 0, TAU); ctx.fill();
  ctx.restore();
}
// rhythm chart: is there a note in lane l at half-beat n?
function rNote(n, l) { return (n % 2 === 0 && l === Math.floor(hash(n * 0.618 + 0.1) * 4)) || hash(n * 4.17 + l * 1.37) > (n % 2 ? 0.86 : 0.78); }
const TETROS = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 2]], [[1, 0], [1, 1], [1, 2], [0, 2]]];
function pieceFor(k, cols) {
  const si = Math.floor(hash(k * 0.77 + 0.13) * 7), cells = TETROS[si];
  const pw = Math.max(...cells.map((q) => q[0])) + 1, hb = Math.max(...cells.map((q) => q[1]));
  return { cells, w: pw, hb, ci: si, col: Math.floor(hash(k * 1.91 + 0.7) * (cols - pw + 1)) };
}
const blockCache = new Map();
function blockColors(p) {
  const key = p.join(); let v = blockCache.get(key);
  if (!v) { v = [p[1], p[2], p[3], '#9b6bff', '#4fd37b', '#ff9f43', '#3d7bff']; blockCache.set(key, v); }
  return v;
}
// card battler pieces: drawn once into sprites (spr.*), then blitted
function cardBack(ctx, x, y, s, col, trim) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = mixHex(col, '#000000', 0.35); rr(ctx, -30, -42, 60, 84, 7); ctx.fill();
  ctx.strokeStyle = trim; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = hexA(trim, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.moveTo(0, -24); ctx.lineTo(0, 24); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.stroke();
  ctx.restore();
}
function emblem(ctx, kind, x, y, s, col) {
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.beginPath();
  if (kind === 0) { ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x + s * 0.9, y + s * 0.1, x, y + s * 0.8); ctx.quadraticCurveTo(x - s * 0.9, y + s * 0.1, x, y - s); ctx.fill(); }
  else if (kind === 1) { ctx.fillRect(x - s * 0.12, y - s, s * 0.24, s * 1.4); ctx.fillRect(x - s * 0.5, y + s * 0.3, s, s * 0.18); ctx.fillRect(x - s * 0.1, y + s * 0.45, s * 0.2, s * 0.45); }
  else if (kind === 2) { ctx.moveTo(x - s * 0.7, y - s * 0.7); ctx.lineTo(x + s * 0.7, y - s * 0.7); ctx.lineTo(x + s * 0.6, y + s * 0.1); ctx.quadraticCurveTo(x, y + s, x, y + s); ctx.quadraticCurveTo(x, y + s, x - s * 0.6, y + s * 0.1); ctx.closePath(); ctx.fill(); }
  else { ctx.moveTo(x + s * 0.2, y - s); ctx.lineTo(x - s * 0.5, y + s * 0.1); ctx.lineTo(x, y + s * 0.1); ctx.lineTo(x - s * 0.2, y + s); ctx.lineTo(x + s * 0.5, y - s * 0.15); ctx.lineTo(x, y - s * 0.15); ctx.closePath(); ctx.fill(); }
}
const ART = ['#ff7a3d', '#9fb4c7', '#5fa8ff', '#c77dff'];
function statGem(ctx, x, y, r, col, txt) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.font = `800 ${Math.round(r * 1.3)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 0.5); }
function cardFace(ctx, x, y, s, frame, trim, kind, cost, atk, hp) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(ctx, -27, -38, 60, 84, 7); ctx.fill();
  ctx.fillStyle = frame; rr(ctx, -30, -42, 60, 84, 7); ctx.fill(); ctx.strokeStyle = trim; ctx.lineWidth = 2.5; ctx.stroke();
  const ag = ctx.createLinearGradient(0, -34, 0, 2); ag.addColorStop(0, ART[kind]); ag.addColorStop(1, mixHex(ART[kind], '#000000', 0.55));
  ctx.fillStyle = ag; rr(ctx, -24, -34, 48, 36, 5); ctx.fill();
  emblem(ctx, kind, 0, -16, 12, 'rgba(255,255,255,0.9)');
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(ctx, -26, 5, 52, 10, 3); ctx.fill();
  ctx.fillStyle = hexA(trim, 0.8); ctx.fillRect(-16, 9, 32, 2.5);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-20, 20, 40, 2.5); ctx.fillRect(-16, 26, 32, 2.5);
  statGem(ctx, -26, -38, 9, '#2f86ff', String(cost));
  if (atk != null) { statGem(ctx, -24, 38, 9, '#e8a317', String(atk)); statGem(ctx, 24, 38, 9, '#e8283c', String(hp)); }
  ctx.restore();
}
function minionArt(ctx, x, y, s, frame, trim, kind, atk, hp) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = trim; ctx.beginPath(); ctx.ellipse(0, 0, 27, 33, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = frame; ctx.beginPath(); ctx.ellipse(0, 0, 24, 30, 0, 0, TAU); ctx.fill();
  const body = ['#7ad66b', '#ff8a5c', '#6fc3ff', '#c18cff', '#ffcf5a', '#ff6b9a'][kind % 6];
  ctx.fillStyle = mixHex(body, '#000000', 0.25); ctx.beginPath(); ctx.ellipse(0, 12, 17, 14, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, -2, 14, 0, TAU); ctx.fill();
  if (kind % 3 === 0) { ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(-16, -22); ctx.lineTo(-5, -13); ctx.moveTo(12, -8); ctx.lineTo(16, -22); ctx.lineTo(5, -13); ctx.fill(); }
  else if (kind % 3 === 1) { ctx.fillStyle = trim; ctx.fillRect(-10, -18, 20, 5); ctx.fillRect(-10, -23, 4, 6); ctx.fillRect(-2, -25, 4, 8); ctx.fillRect(6, -23, 4, 6); }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-5, -3, 4.2, 0, TAU); ctx.arc(5, -3, 4.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#16141c'; ctx.beginPath(); ctx.arc(-4.2, -2.4, 2, 0, TAU); ctx.arc(5.8, -2.4, 2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a1020'; ctx.fillRect(-4, 5, 8, 2.5);
  statGem(ctx, -21, 24, 9, '#e8a317', String(atk)); statGem(ctx, 21, 24, 9, '#e8283c', String(hp));
  ctx.restore();
}
function heroArt(ctx, x, y, r, col, trim, kind) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x + r * 0.08, y + r * 0.12, r * 1.12, 0, TAU); ctx.fill();
  ctx.fillStyle = trim; ctx.beginPath(); ctx.arc(x, y, r * 1.1, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(x, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, mixHex(col, '#ffffff', 0.25)); g.addColorStop(1, mixHex(col, '#000000', 0.45));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  if (kind === 0) { // knight
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - r * 0.95); ctx.quadraticCurveTo(x + r * 0.5, y - r * 1.05, x + r * 0.55, y - r * 0.55); ctx.lineTo(x, y - r * 0.6); ctx.fill();
    ctx.fillStyle = '#c9d0de'; rr(ctx, x - r * 0.42, y - r * 0.62, r * 0.84, r * 1.0, r * 0.38); ctx.fill();
    ctx.fillStyle = '#8c95a8'; ctx.fillRect(x - r * 0.42, y + r * 0.05, r * 0.84, r * 0.12);
    ctx.fillStyle = '#1b1d2b'; ctx.fillRect(x - r * 0.32, y - r * 0.2, r * 0.64, r * 0.12); ctx.fillRect(x - r * 0.05, y - r * 0.2, r * 0.1, r * 0.42);
    ctx.fillStyle = mixHex(col, '#000000', 0.2); ctx.fillRect(x - r * 0.75, y + r * 0.42, r * 1.5, r * 0.6);
  } else { // horned lich
    ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.moveTo(x - r * 0.3, y - r * 0.4); ctx.quadraticCurveTo(x - r * 0.9, y - r * 0.6, x - r * 0.7, y - r * 1.05); ctx.quadraticCurveTo(x - r * 0.55, y - r * 0.6, x - r * 0.1, y - r * 0.55); ctx.moveTo(x + r * 0.3, y - r * 0.4); ctx.quadraticCurveTo(x + r * 0.9, y - r * 0.6, x + r * 0.7, y - r * 1.05); ctx.quadraticCurveTo(x + r * 0.55, y - r * 0.6, x + r * 0.1, y - r * 0.55); ctx.fill();
    ctx.fillStyle = '#8d7bb0'; ctx.beginPath(); ctx.ellipse(x, y - r * 0.1, r * 0.42, r * 0.52, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = mixHex(col, '#000000', 0.3); ctx.beginPath(); ctx.moveTo(x - r * 0.9, y + r); ctx.lineTo(x - r * 0.45, y + r * 0.25); ctx.lineTo(x, y + r * 0.5); ctx.lineTo(x + r * 0.45, y + r * 0.25); ctx.lineTo(x + r * 0.9, y + r); ctx.fill();
    ctx.fillStyle = '#2a1a3a'; ctx.beginPath(); ctx.ellipse(x - r * 0.17, y - r * 0.15, r * 0.12, r * 0.08, 0.3, 0, TAU); ctx.ellipse(x + r * 0.17, y - r * 0.15, r * 0.12, r * 0.08, -0.3, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
const spr = {
  back: (col, trim, s) => layer(`cb|${col}|${trim}|${s.toFixed(3)}`, 64 * s, 88 * s, (c) => cardBack(c, 32 * s, 44 * s, s, col, trim)),
  card: (frame, trim, kind, cost, atk, hp, s) => layer(`cf|${frame}|${trim}|${kind}|${cost}|${atk}|${hp}|${s.toFixed(3)}`, 72 * s, 96 * s, (c) => cardFace(c, 36 * s, 48 * s, s, frame, trim, kind, cost, atk, hp)),
  minion: (frame, trim, kind, atk, hp, s) => layer(`mn|${frame}|${trim}|${kind}|${atk}|${hp}|${s.toFixed(3)}`, 64 * s, 72 * s, (c) => minionArt(c, 32 * s, 36 * s, s, frame, trim, kind, atk, hp)),
  hero: (col, trim, kind, r) => layer(`hr|${col}|${trim}|${kind}|${r.toFixed(2)}`, r * 2.6, r * 2.6, (c) => heroArt(c, r * 1.3, r * 1.3, r, col, trim, kind)),
};
// draw a sprite with its origin (ox, oy) at (x, y), optionally rotated / scaled
function blit(ctx, img, x, y, ox, oy, rot = 0, k = 1) {
  if (!rot && k === 1) { ctx.drawImage(img, Math.round(x - ox), Math.round(y - oy)); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.drawImage(img, -ox, -oy); ctx.restore();
}
function drawHero(ctx, x, y, r, col, trim, kind, hp, hurt, t, fs) {
  ctx.save(); if (hurt > 0) ctx.translate(Math.sin(t * 70) * 4 * hurt, 0);
  blit(ctx, spr.hero(col, trim, kind, r), x, y, r * 1.3, r * 1.3);
  if (kind === 1) { const e = r * (0.05 + Math.sin(t * 5) * 0.015); ctx.fillStyle = trim; ctx.beginPath(); ctx.arc(x - r * 0.17, y - r * 0.15, e, 0, TAU); ctx.arc(x + r * 0.17, y - r * 0.15, e, 0, TAU); ctx.fill(); }
  if (hurt > 0) { ctx.fillStyle = `rgba(255,40,60,${Math.min(1, hurt) * 0.55})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#e8283c'; ctx.beginPath(); ctx.moveTo(x + r * 0.78, y + r * 0.28); ctx.quadraticCurveTo(x + r * 1.18, y + r * 0.7, x + r * 0.78, y + r * 1.02); ctx.quadraticCurveTo(x + r * 0.38, y + r * 0.7, x + r * 0.78, y + r * 0.28); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = `800 ${fs(13)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(Math.max(1, hp)), x + r * 0.78, y + r * 0.72);
  ctx.restore();
}

export function drawGame(ctx, w, h, t, game, fx = { hit: 0, fail: 0 }) {
  (RENDERERS[game.scene] || RENDERERS.sandbox)(ctx, w, h, t, game.pal, fx);
}

// ------------------------------------------------------------------ SCREEN MANAGER
export class ScreenManager {
  constructor() {
    this.surfaces = new Map(); // key -> {canvas, ctx, tex, meshes[], mode, data}
    this.t = 0;
    this.accent = '#ff4f8b';
    this.data = { subs: 0, name: '', chat: [], viewers: 0, game: null, fx: { hit: 0, fail: 0 }, progress: 0, edit: null, views: 0 };
    this.powered = true;
  }
  surface(key) {
    let s = this.surfaces.get(key);
    if (!s) {
      const canvas = document.createElement('canvas');
      const [w, h] = key === 'side' || key === 'side2' ? [320, 512] : key === 'tv' ? [512, 288] : key === 'laptop' ? [512, 320] : key === 'arcade' ? [256, 208] : [640, 360];
      canvas.width = w; canvas.height = h;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      s = { canvas, ctx: canvas.getContext('2d'), tex, meshes: [], mode: key === 'arcade' ? 'arcade' : key === 'tv' ? 'tv' : 'desktop', last: -1, rate: 6 };
      this.surfaces.set(key, s);
    }
    return s;
  }
  register(mesh) {
    const key = mesh.userData.screenKey || 'main';
    const s = this.surface(key);
    s.meshes.push(mesh);
    mesh.material.map = s.tex;
    mesh.material.needsUpdate = true;
    s.last = -1;
  }
  clearMeshes() { for (const s of this.surfaces.values()) s.meshes = []; }
  setMode(key, mode) { const s = this.surface(key); if (s.mode !== mode) { s.mode = mode; s.last = -1; } }
  // Main screen = laptop when no monitor; caller decides
  update(dt) {
    this.t += dt;
    const fx = this.data.fx;
    fx.hit = Math.max(0, fx.hit - dt * 1.6);
    fx.fail = Math.max(0, fx.fail - dt * 1.2);
    for (const [key, s] of this.surfaces) {
      if (!s.meshes.length) continue;
      const fast = ['game', 'record', 'stream', 'edit', 'upload', 'chat', 'arcade', 'results'].includes(s.mode);
      const rate = fast ? 1 / 24 : 1 / 3;
      if (s.last >= 0 && this.t - s.last < rate) continue;
      s.last = this.t;
      this.draw(key, s);
      s.tex.needsUpdate = true;
      const on = s.mode !== 'off';
      for (const m of s.meshes) m.material.color.setScalar(on ? 1.08 : 1);
    }
  }
  draw(key, s) {
    const { ctx, canvas } = s;
    const w = canvas.width, h = canvas.height, t = this.t, D = this.data;
    ctx.save();
    switch (s.mode) {
      case 'off': {
        const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0b0c12'); g.addColorStop(0.5, '#151722'); g.addColorStop(1, '#090a10');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.beginPath(); ctx.moveTo(w * 0.1, 0); ctx.lineTo(w * 0.35, 0); ctx.lineTo(w * 0.15, h); ctx.lineTo(0, h); ctx.fill();
        break;
      }
      case 'desktop': this.drawDesktop(ctx, w, h, t, D); break;
      case 'game': case 'record': case 'stream': {
        if (D.game) drawGame(ctx, w, h, t, D.game, D.fx);
        if (s.mode === 'record') {
          ctx.fillStyle = 'rgba(0,0,0,0.5)'; rr(ctx, w - 92, 10, 80, 26, 13); ctx.fill();
          ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ff3b4f' : '#7a1a24'; ctx.beginPath(); ctx.arc(w - 76, 23, 6, 0, TAU); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('REC', w - 64, 28);
        }
        if (s.mode === 'stream') this.drawStreamOverlay(ctx, w, h, t, D);
        break;
      }
      case 'edit': this.drawEditor(ctx, w, h, t, D); break;
      case 'upload': this.drawUpload(ctx, w, h, t, D); break;
      case 'results': this.drawResults(ctx, w, h, t, D); break;
      case 'chat': this.drawChat(ctx, w, h, t, D); break;
      case 'analytics': this.drawAnalytics(ctx, w, h, t, D); break;
      case 'arcade': { const g = { scene: 'dungeon', pal: ['#1a1033', '#ffe600', '#3dfcff', '#ff3df2'] }; drawGame(ctx, w, h, t, g, D.fx); break; }
      case 'tv': { const g = D.tvGame || { scene: 'cozy', pal: ['#8fd26b', '#ffd1a6', '#e86f6f', '#fff4d6'] }; drawGame(ctx, w, h, t * 0.8, g, { hit: 0, fail: 0 }); break; }
    }
    ctx.restore();
  }
  drawDesktop(ctx, w, h, t, D) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1b1440'); g.addColorStop(0.6, '#3b1f63'); g.addColorStop(1, this.accent);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // blobs
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#2fd6ff', '#ff4f8b', '#9dff5a'][i]; ctx.beginPath(); ctx.arc(w * (0.2 + i * 0.3) + Math.sin(t * 0.2 + i) * 20, h * (0.3 + (i % 2) * 0.3), h * 0.3, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    // icons
    const icons = ['#ff5a5f', '#9b6bff', '#3cc8ff', '#ff9f43', '#9dff5a'];
    icons.forEach((c, i) => { ctx.fillStyle = c; rr(ctx, 16, 16 + i * (h * 0.15), h * 0.1, h * 0.1, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(20, 16 + i * (h * 0.15) + h * 0.115, h * 0.08, 3); });
    // studio widget
    const ww = w * 0.36, wx = w - ww - 20, wy = 20;
    ctx.fillStyle = 'rgba(10,10,25,0.55)'; rr(ctx, wx, wy, ww, h * 0.42, 14); ctx.fill();
    ctx.fillStyle = '#ff5a5f'; rr(ctx, wx + 14, wy + 14, 30, 22, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(wx + 25, wy + 19); ctx.lineTo(wx + 35, wy + 25); ctx.lineTo(wx + 25, wy + 31); ctx.fill();
    ctx.font = 'bold 15px sans-serif'; ctx.fillText('Studio', wx + 52, wy + 31);
    ctx.font = 'bold 34px sans-serif'; ctx.fillText(fmtShort(D.subs), wx + 14, wy + 80);
    ctx.font = '13px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('subscribers', wx + 14, wy + 100);
    // spark line
    ctx.strokeStyle = '#9dff5a'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i < 12; i++) { const x = wx + 14 + i * (ww - 28) / 11, y = wy + h * 0.38 - (i / 11) * 30 - Math.sin(i * 1.3) * 5; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    // taskbar
    ctx.fillStyle = 'rgba(8,8,20,0.7)'; ctx.fillRect(0, h - 28, w, 28);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(D.clock || '10:00', w - 56, h - 9);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = icons[i]; rr(ctx, w / 2 - 70 + i * 30, h - 22, 18, 16, 4); ctx.fill(); }
  }
  drawStreamOverlay(ctx, w, h, t, D) {
    const ov = D.overlay || [this.accent, '#2fd6ff'];
    // webcam frame bottom-left
    const cw = w * 0.26, ch = cw * 0.62;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(ctx, 10, h - ch - 10, cw, ch, 8); ctx.fill();
    ctx.strokeStyle = ov[0]; ctx.lineWidth = 3; rr(ctx, 10, h - ch - 10, cw, ch, 8); ctx.stroke();
    ctx.fillStyle = D.skin || '#e8b48f'; ctx.beginPath(); ctx.arc(10 + cw / 2, h - ch * 0.55 - 10, ch * 0.24, 0, TAU); ctx.fill();
    ctx.fillStyle = D.top || '#8f6bff'; rr(ctx, 10 + cw / 2 - ch * 0.35, h - ch * 0.28 - 10, ch * 0.7, ch * 0.3, 10); ctx.fill();
    // live badge
    ctx.fillStyle = '#ff3b4f'; rr(ctx, 10, 10, 54, 22, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('LIVE', 21, 26);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(ctx, 70, 10, 74, 22, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(fmtShort(D.viewers), 80, 26);
    // chat column
    const cx = w * 0.72;
    ctx.fillStyle = 'rgba(8,8,20,0.6)'; ctx.fillRect(cx, 0, w - cx, h);
    ctx.font = '12px sans-serif';
    const lines = D.chat.slice(-14);
    lines.forEach((l, i) => { ctx.fillStyle = l.color || '#fff'; ctx.fillText(l.user.slice(0, 10), cx + 8, 20 + i * 24); ctx.fillStyle = '#e8e8f0'; ctx.fillText(l.plain.slice(0, 20), cx + 8, 32 + i * 24); });
    // alert
    if (D.alert && D.alert.t > 0) {
      ctx.fillStyle = ov[0]; rr(ctx, w * 0.2, 40, w * 0.4, 36, 10); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(D.alert.text.slice(0, 30), w * 0.4, 63); ctx.textAlign = 'left';
    }
  }
  drawEditor(ctx, w, h, t, D) {
    ctx.fillStyle = '#14151d'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1d1f2b'; ctx.fillRect(0, 0, w, 24);
    ctx.fillStyle = '#9aa0b5'; ctx.font = '12px sans-serif'; ctx.fillText('CutPro — project.vid', 10, 16);
    // preview
    const pw = w * 0.55, ph = pw * 0.5625;
    ctx.save(); ctx.translate(w * 0.22, 34); ctx.beginPath(); ctx.rect(0, 0, pw, ph); ctx.clip();
    if (D.game) drawGame(ctx, pw, ph, t, D.game, D.fx);
    ctx.restore();
    ctx.strokeStyle = '#2b2d3b'; ctx.strokeRect(w * 0.22, 34, pw, ph);
    // bins
    ctx.fillStyle = '#1b1c26'; ctx.fillRect(6, 34, w * 0.2, ph);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#ff5a5f', '#9b6bff', '#3cc8ff', '#ffb547', '#4fd37b'][i]; ctx.fillRect(12, 42 + i * 26, w * 0.17, 18); }
    // timeline
    const ty = 44 + ph;
    ctx.fillStyle = '#1b1c26'; ctx.fillRect(0, ty, w, h - ty);
    const segs = D.edit?.segments || [];
    const tracks = 3;
    for (let r = 0; r < tracks; r++) {
      let x = 10;
      for (let i = 0; i < 9; i++) {
        const sw = 30 + hash(i * 7 + r) * 60;
        const seg = segs[i];
        ctx.fillStyle = r === 0 && seg ? (seg.cut ? 'rgba(80,80,90,0.3)' : seg.kind === 'good' ? '#4fd37b' : seg.kind === 'bad' ? '#ff5a5f' : '#7a7f96') : ['#5b6cff', '#ffb547', '#9b6bff'][r];
        rr(ctx, x, ty + 10 + r * 26, sw - 3, 20, 4); ctx.fill();
        x += sw;
      }
    }
    const px = 10 + ((t * 60) % (w - 20));
    ctx.fillStyle = '#ff3b4f'; ctx.fillRect(px, ty + 4, 2, h - ty - 8);
  }
  drawUpload(ctx, w, h, t, D) {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1b29'); g.addColorStop(1, '#0f1018');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff5a5f'; rr(ctx, w / 2 - 34, h * 0.22, 68, 48, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(w / 2 - 10, h * 0.22 + 12); ctx.lineTo(w / 2 + 14, h * 0.22 + 24); ctx.lineTo(w / 2 - 10, h * 0.22 + 36); ctx.fill();
    ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Uploading...', w / 2, h * 0.55);
    const p = D.progress || 0;
    ctx.fillStyle = '#2a2c3d'; rr(ctx, w * 0.2, h * 0.65, w * 0.6, 16, 8); ctx.fill();
    ctx.fillStyle = '#ff5a5f'; rr(ctx, w * 0.2, h * 0.65, Math.max(16, w * 0.6 * p), 16, 8); ctx.fill();
    ctx.fillStyle = '#c9cce0'; ctx.font = '15px sans-serif'; ctx.fillText(Math.round(p * 100) + '%', w / 2, h * 0.8); ctx.textAlign = 'left';
  }
  drawResults(ctx, w, h, t, D) {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#16172a'); g.addColorStop(1, '#2a1640');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9dff5a'; ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(fmtShort(D.views), w / 2, h * 0.5);
    ctx.fillStyle = '#c9cce0'; ctx.font = '18px sans-serif'; ctx.fillText('views and counting', w / 2, h * 0.65);
    ctx.strokeStyle = '#9dff5a'; ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i < 20; i++) { const x = w * 0.1 + i * w * 0.04, y = h * 0.9 - Math.pow(i / 19, 2) * h * 0.15; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.textAlign = 'left';
  }
  drawChat(ctx, w, h, t, D) {
    ctx.fillStyle = '#12131c'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9b6bff'; ctx.fillRect(0, 0, w, 34);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('LIVE CHAT', 12, 23);
    const lines = D.chat.slice(-18);
    ctx.font = '14px sans-serif';
    lines.forEach((l, i) => { const y = 54 + i * 26; ctx.fillStyle = l.color || '#fff'; ctx.fillText(l.user.slice(0, 12) + ':', 10, y); ctx.fillStyle = '#d9dbe8'; ctx.fillText(l.plain.slice(0, 14), 10, y + 13); });
    if (!lines.length) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillText('Chat is quiet...', 12, 60); }
  }
  drawAnalytics(ctx, w, h, t, D) {
    ctx.fillStyle = '#12131c'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('ANALYTICS', 12, 26);
    const bars = 8;
    for (let i = 0; i < bars; i++) {
      const bh = (0.3 + 0.6 * ((Math.sin(i * 1.7 + t * 0.3) * 0.5 + 0.5) * 0.4 + i / bars * 0.6)) * h * 0.35;
      ctx.fillStyle = i === bars - 1 ? '#9dff5a' : '#3b3f5c'; rr(ctx, 14 + i * (w - 28) / bars, h * 0.5 - bh, (w - 28) / bars - 6, bh, 4); ctx.fill();
    }
    ctx.fillStyle = '#9dff5a'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('+' + fmtShort(D.subs * 0.04 + 3), 14, h * 0.62);
    ctx.fillStyle = '#9aa0b5'; ctx.font = '13px sans-serif'; ctx.fillText('subs this week', 14, h * 0.67);
    ctx.strokeStyle = '#ff5a5f'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i < 16; i++) { const x = 14 + i * (w - 28) / 15, y = h * 0.92 - (i / 15) * h * 0.15 - Math.sin(i + t) * 4; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
}
function fmtShort(n) { n = Math.round(n || 0); if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; return String(n); }

// Static snapshot of a game (for cards/thumbnails)
const coverCache = new Map();
export function gameCover(game, w = 320, h = 180, t = 3.7) {
  const key = game.id + w + 'x' + h;
  if (coverCache.has(key)) return coverCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  drawGame(ctx, w, h, t, game, { hit: 0.6, fail: 0 });
  const url = c.toDataURL('image/jpeg', 0.82);
  coverCache.set(key, url);
  return url;
}
