// Canvas-drawn animated monitor content: game renderers + OS / stream / editor screens.
import * as THREE from 'three';

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
};
function heart(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.6); ctx.bezierCurveTo(x - s * 1.2, y - s * 0.2, x - s * 0.4, y - s, x, y - s * 0.3); ctx.bezierCurveTo(x + s * 0.4, y - s, x + s * 1.2, y - s * 0.2, x, y + s * 0.6); ctx.fill(); }
function shadeHex(hex, f) { const c = new THREE.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString(); }

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
