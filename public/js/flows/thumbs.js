// Procedural video thumbnails (game art + 3D portrait + bold type).
import { drawGame } from '../world/screens.js';
import { G } from '../game/ctx.js';

const portraits = new Map();
export function portrait(expr) {
  const key = expr + JSON.stringify(G.s.profile);
  if (!portraits.has(key)) { portraits.clear(); }
  if (!portraits.has(key)) portraits.set(key, G.world.portrait(expr, 256));
  return portraits.get(key);
}
function wrap(ctx, text, x, y, maxW, lh, maxLines = 3) {
  const words = text.split(' ');
  let line = '', lines = [];
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  lines.push(line);
  lines = lines.slice(0, maxLines);
  lines.forEach((l, i) => { ctx.strokeText?.(l, x, y + i * lh); ctx.fillText(l, x, y + i * lh); });
  return lines.length;
}
export function makeThumb(style, game, title, W = 480, H = 270) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  drawGame(ctx, W, H, 4.2 + (title?.length || 0) * 0.13, game, { hit: style === 'shock' ? 0.8 : 0.4, fail: 0 });
  const accent = G.s.profile.accent;
  const short = shortText(title, game);
  if (style === 'shock') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
    const p = portrait('shocked');
    ctx.drawImage(p, W * 0.48, H * 0.02, H * 1.0, H * 1.0);
    ctx.save(); ctx.translate(W * 0.36, H * 0.55); ctx.rotate(-0.5);
    ctx.fillStyle = '#ff2b3c'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-60, -14); ctx.lineTo(20, -14); ctx.lineTo(20, -34); ctx.lineTo(70, 0); ctx.lineTo(20, 34); ctx.lineTo(20, 14); ctx.lineTo(-60, 14); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
    ctx.font = `900 ${H * 0.2}px Bricolage, Impact, sans-serif`; ctx.fillStyle = '#ffe14a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 10; ctx.lineJoin = 'round';
    ctx.textAlign = 'left';
    wrap(ctx, short.toUpperCase(), 18, H * 0.27, W * 0.55, H * 0.2, 2);
  } else if (style === 'clean') {
    const g = ctx.createLinearGradient(0, H * 0.35, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,6,20,0.9)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const p = portrait('happy');
    ctx.drawImage(p, W * 0.62, H * 0.22, H * 0.8, H * 0.8);
    ctx.font = `800 ${H * 0.12}px Bricolage, sans-serif`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(0,0,0,0)'; ctx.lineWidth = 0;
    wrap(ctx, title || game.name, 20, H * 0.66, W * 0.6, H * 0.13, 2);
    ctx.fillStyle = accent; ctx.fillRect(20, H * 0.55, 54, 7);
  } else if (style === 'meme') {
    const p = portrait('cool');
    ctx.drawImage(p, W * 0.3, H * 0.12, H * 0.95, H * 0.95);
    ctx.font = `900 ${H * 0.15}px Impact, Bricolage, sans-serif`; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.textAlign = 'center';
    ctx.strokeText('WHEN THE', W / 2, H * 0.17); ctx.fillText('WHEN THE', W / 2, H * 0.17);
    const t2 = (game.name + ' HITS').toUpperCase();
    ctx.strokeText(t2, W / 2, H * 0.94); ctx.fillText(t2, W / 2, H * 0.94);
  } else { // neon pro
    ctx.fillStyle = 'rgba(10,0,30,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = accent; ctx.lineWidth = 8; ctx.shadowColor = accent; ctx.shadowBlur = 24; ctx.strokeRect(10, 10, W - 20, H - 20); ctx.shadowBlur = 0;
    const p = portrait('happy');
    ctx.drawImage(p, W * 0.56, H * 0.12, H * 0.9, H * 0.9);
    ctx.font = `900 ${H * 0.16}px Bricolage, sans-serif`; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.shadowColor = accent; ctx.shadowBlur = 18;
    wrap(ctx, short.toUpperCase(), 26, H * 0.32, W * 0.55, H * 0.17, 3);
    ctx.shadowBlur = 0;
  }
  // duration badge
  ctx.font = `800 ${H * 0.07}px Outfit, sans-serif`; ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; const dur = `${8 + Math.floor(Math.random() * 20)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
  const tw = ctx.measureText(dur).width + 12; ctx.fillRect(W - tw - 8, H - H * 0.12 - 6, tw, H * 0.1);
  ctx.fillStyle = '#fff'; ctx.fillText(dur, W - 14, H - H * 0.05 - 4);
  ctx.textAlign = 'left';
  return c;
}
function shortText(title, game) {
  if (!title) return game.name;
  const t = title.replace(/[—–-].*$/, '').replace(/\(.*\)/, '').trim();
  const words = t.split(' ');
  return words.slice(0, 4).join(' ');
}
export function smallJpeg(canvas, w = 192, h = 108) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(canvas, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.7);
}
