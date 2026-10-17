// Live video performance: every upload keeps collecting views, likes, comments, subscribers and revenue in
// real time (wall clock) — a fast first wave from subscribers' notifications, then a long discovery tail.
// Skipping game hours (sleeping, long activities) never dumps views in one lump; closing the game doesn't stop them.
export const SPLIT = 0.45;  // share of lifetime views that arrive in the first wave
export const TAU1 = 45;     // first wave time constant (seconds)
export const TAU2 = 900;    // discovery tail time constant (seconds)

export const realNow = () => Date.now();
export function curve(dtSec) {
  if (dtSec <= 0) return 0;
  return SPLIT * (1 - Math.exp(-dtSec / TAU1)) + (1 - SPLIT) * (1 - Math.exp(-dtSec / TAU2));
}

// Create the persistent record for a new upload from an economy outcome.
export function makeVideo(s, o) {
  const V = Math.max(1, o.out.views + o.out.tail);
  return {
    id: o.id, title: o.title, game: o.game, type: o.type, thumb: o.thumb, tags: o.tags || [],
    day: s.clock.day, perf: o.perf, grade: o.grade, viral: o.out.viral,
    V, b: 0, views: 0, subs: 0, likes: 0, dislikes: 0, comments: 0, money: 0,
    rt0: realNow(),
    conv: o.out.subs / Math.max(1, o.out.views),
    rpm: o.out.money / Math.max(1, o.out.views),
    lr: o.out.likes / Math.max(1, o.out.views),
    dr: o.out.dislikes / Math.max(1, o.out.views),
    cr: o.out.comments / Math.max(1, o.out.views),
    fs: 0, fm: 0, fl: 0, fd: 0, fc: 0,
  };
}

// Views a video should have at wall-clock time t (ms)
export const targetViews = (v, t) => Math.floor(v.b + (v.V - v.b) * curve((t - v.rt0) / 1000));

// Advance one video to time t. Returns whole-number deltas (or null when nothing changed).
export function step(v, t) {
  const tv = Math.min(v.V, targetViews(v, t));
  if (tv <= v.views) return null;
  const d = tv - v.views;
  v.views = tv;
  v.fs += d * v.conv; v.fm += d * v.rpm; v.fl += d * v.lr; v.fd += d * v.dr; v.fc += d * v.cr;
  const subs = Math.floor(v.fs), money = Math.floor(v.fm), likes = Math.floor(v.fl), dislikes = Math.floor(v.fd), comments = Math.floor(v.fc);
  v.fs -= subs; v.fm -= money; v.fl -= likes; v.fd -= dislikes; v.fc -= comments;
  v.subs += subs; v.money += money; v.likes += likes; v.dislikes += dislikes; v.comments += comments;
  return { views: d, subs, money, likes, dislikes, comments };
}
// Views per minute right now (for "+N/min" indicators)
export function viewRate(v, t = realNow()) {
  if (v.views >= v.V) return 0;
  const x = (t - v.rt0) / 1000;
  return (v.V - v.b) * (SPLIT / TAU1 * Math.exp(-x / TAU1) + (1 - SPLIT) / TAU2 * Math.exp(-x / TAU2)) * 60;
}

// Older saves stored either a "tail" of remaining views or game-time based live records.
export function migrateVideo(v, s) {
  if (v.rt0 !== undefined) return v;
  if (v.V === undefined) {
    v.V = v.views + Math.max(0, Math.round(v.tailLeft || 0));
    v.dislikes = v.dislikes || Math.round((v.likes || 0) * 0.04);
    v.comments = v.comments || Math.round(v.views * 0.01);
    v.lr = (v.likes || 0) / Math.max(1, v.views); v.dr = v.lr * 0.05; v.cr = 0.012;
    v.fs = v.fm = v.fl = v.fd = v.fc = 0;
    v.grade = v.grade || (v.perf >= 90 ? 'A' : v.perf >= 75 ? 'B' : 'C');
    delete v.tailLeft;
  }
  // continue the remaining views on a fresh real-time curve
  v.b = v.views; v.rt0 = realNow();
  delete v.t0;
  return v;
}

export function gradeOf(q) { return q >= 0.93 ? 'S' : q >= 0.82 ? 'A' : q >= 0.68 ? 'B' : q >= 0.52 ? 'C' : 'D'; }
