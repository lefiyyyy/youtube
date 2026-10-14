// Small shared helpers.
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
export const smooth = (t) => t * t * (3 - 2 * t);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const uid = () => Math.random().toString(36).slice(2, 9);

export function weighted(items, wfn) {
  let total = 0;
  for (const it of items) total += Math.max(0, wfn(it));
  let r = Math.random() * total;
  for (const it of items) { r -= Math.max(0, wfn(it)); if (r <= 0) return it; }
  return items[items.length - 1];
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Seeded RNG (mulberry32) for deterministic daily content.
export function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// Compact number formatting: 1.2K, 3.4M
export function fmt(n, digits = 1) {
  n = Math.round(n);
  const a = Math.abs(n);
  if (a < 1000) return String(n);
  const units = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [v, s] of units) {
    if (a >= v) {
      const x = n / v;
      const d = Math.abs(x) >= 100 ? 0 : digits;
      return x.toFixed(d).replace(/\.0+$/, '') + s;
    }
  }
  return String(n);
}
export const fmtMoney = (n) => '$' + (Math.abs(n) < 10000 ? Math.round(n).toLocaleString('en-US') : fmt(n));
export const fmtInt = (n) => Math.round(n).toLocaleString('en-US');

export function fmtDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

// Real-world day key; supports ?dayOffset=N for testing.
const DAY_OFFSET = (() => {
  try { return Number(new URLSearchParams(location.search).get('dayOffset') || 0); } catch { return 0; }
})();
export function now() { return Date.now() + DAY_OFFSET * 86400000; }
export function dayIndex(t = now()) {
  const d = new Date(t);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
}
export function msToNextDay(t = now()) {
  const d = new Date(t);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return next.getTime() - d.getTime();
}

export function colorHex(c) { return typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c; }

export const isTouch = (() => {
  try { return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; } catch { return false; }
})();
