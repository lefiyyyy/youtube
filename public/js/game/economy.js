// Pure economy formulas: setup stats, video/stream/social outcomes, XP. No DOM access.
import { GEAR } from '../data/gear.js';
import { decorById, THEMES, HOMES } from '../data/decor.js';
import { GENRE_IDS } from '../data/games.js';
import { clamp, seeded } from '../core/util.js';

// Reach coefficients (tuned with tools/sim.mjs)
export const TUNE = { RV: 2.0, EV: 0.6, RS: 0.7, ES: 0.62, RB: 0.4, EB: 0.64, RL: 0.45, MP: 0.7, CONV: 0.05, RPM: 0.17, RPMK: 8000, RPMP: 0.45 };

export function setupStats(s) {
  const st = { vq: 0, aq: 0, sq: 0, cq: 0, comfort: 0, vibe: 0 };
  for (const [cat, tier] of Object.entries(s.gear)) {
    const t = GEAR[cat]?.tiers[tier];
    if (!t) continue;
    for (const k of Object.keys(st)) st[k] += t[k] || 0;
  }
  for (const id of s.placed) { const d = decorById(id); if (d) { st.vibe += d.vibe || 0; st.aq += d.aq || 0; } }
  st.vibe += [0, 3, 6, 10][s.home] || 0;
  if (s.theme !== 'cozy' && s.theme !== 'gamer') st.vibe += 4;
  const score = (st.vq / 17) * 30 + (Math.min(st.aq, 8) / 8) * 15 + (st.sq / 18) * 15 + (st.cq / 14) * 25 + (st.comfort / 7) * 5 + Math.min(10, st.vibe / 6);
  st.score = clamp(Math.round(score), 1, 100);
  st.stream = clamp((st.sq / 18) * 0.35 + (Math.min(st.aq, 8) / 8) * 0.3 + (st.cq / 14) * 0.35, 0, 1);
  st.vibeScore = clamp(Math.round(st.vibe * 2.2), 0, 100);
  return st;
}
export const qualityMult = (score) => 0.6 + (score / 100) * 0.95;

export function totalFans(s) { return s.fans.vid + s.fans.pulse + s.fans.blip + s.fans.lumo; }

// Trending genres for an in-game day (deterministic)
export function trendFor(day) {
  const r = seeded(day * 7919 + 13);
  const a = GENRE_IDS[Math.floor(r() * GENRE_IDS.length)];
  let b = GENRE_IDS[Math.floor(r() * GENRE_IDS.length)];
  if (b === a) b = GENRE_IDS[(GENRE_IDS.indexOf(a) + 3) % GENRE_IDS.length];
  return { hot: a, rising: b };
}

export function hourMult(hour) {
  if (hour >= 18 && hour < 23) return { m: 1.18, tag: 'good-time' };
  if (hour >= 0 && hour < 6) return { m: 0.85, tag: 'late' };
  return { m: 1, tag: null };
}
export function needsMult(s) {
  let m = 1; const tags = [];
  if (s.needs.hunger < 25) { m *= 0.8; tags.push('hungry'); }
  if (s.needs.energy < 25) { m *= 0.75; tags.push('tired'); }
  return { m, tags };
}

export function gameMult(game, ctx) {
  let m = game.appeal;
  const tags = [];
  if (game.tags.includes(ctx.trend.hot) || ctx.trendBoost) { m *= 1.6; tags.push('trending'); }
  else if (game.tags.includes(ctx.trend.rising)) { m *= 1.25; tags.push('rising'); }
  if (ctx.event?.fx?.genre && game.tags.includes(ctx.event.fx.genre)) { m *= ctx.event.fx.genreMult; tags.push('event'); }
  const fat = ctx.fatigue || 0;
  if (fat > 0.35) tags.push('bored');
  m *= 1 - fat * 0.45;
  return { m, tags };
}

// ---------------------------------------------------------------- VIDEO
export function videoOutcome(s, p) {
  // p: {game, content, perf(0..1), thumb, title, hour, trend, event, fatigue, trendBoost, partnerMult, collab}
  const st = setupStats(s);
  const Q = qualityMult(st.score);
  const lvl = s.level;
  const P = Math.pow;
  const T = TUNE;
  const reach = 70 + 22 * lvl + T.RV * P(s.fans.vid, T.EV) + 0.5 * P(s.fans.blip, 0.6) + 0.45 * P(s.fans.pulse, 0.6) + 0.4 * P(s.fans.lumo, 0.6);
  const gm = gameMult(p.game, p);
  const hm = hourMult(p.hour);
  const nm = needsMult(s);
  const perf = 0.45 + p.perf * 1.05;
  const ctr = p.thumb.ctr * p.title.ctr * (p.title.id === 'trend' && gm.tags.includes('trending') ? 1.15 : 1);
  const trust = p.thumb.trust * p.title.trust;
  const n = s.stats.videos;
  const boost = n === 0 ? 2.4 : n === 1 ? 1.7 : n === 2 ? 1.35 : 1;
  const ev = p.event?.fx || {};
  const home = HOMES[s.home].viewMult;
  const collab = p.collab ? p.collab : 1;
  let M = p.content.views * gm.m * Q * perf * hm.m * nm.m * ctr * home * (ev.viewMult || 1) * collab;
  if (p.content.trendy && gm.tags.includes('trending')) M *= p.content.trendy;
  if (p.focus) M *= 1.15;
  if (p.affinity) M *= 1 + 0.25 * p.affinity.k;
  let views = reach * Math.pow(M, T.MP) * (0.88 + Math.random() * 0.3) * boost;
  let viral = false;
  const vChance = 0.035 + (p.perf > 0.85 ? 0.05 : 0) + (gm.tags.includes('trending') ? 0.05 : 0) + (p.title.id === 'trend' ? 0.02 : 0) + (p.thumb.id === 'neon' ? 0.02 : 0);
  if (n >= 2 && Math.random() < vChance) { viral = true; views *= 3 + Math.random() * 3; }
  views = Math.round(views);
  const retention = clamp(0.35 + p.perf * 0.4 + (trust - 1) * 0.5 + (Q - 1) * 0.15, 0.15, 0.95);
  const conv = TUNE.CONV * p.content.subs * Math.pow(trust, 1.2) * (0.7 + 0.3 * Q) * (0.75 + retention * 0.5) * (ev.followMult || 1);
  const subs = Math.round(views * conv);
  const likes = Math.round(views * (0.05 + retention * 0.06));
  const comments = Math.round(views * 0.012 * (0.6 + p.perf));
  const rpm = T.RPM * Math.pow(1 + views / T.RPMK, -T.RPMP) * (p.partnerMult || 1) * p.content.money * (ev.moneyMult || 1);
  const money = Math.round(views * rpm);
  const xp = Math.round(p.content.xp * (1 + 0.12 * (lvl - 1)) * (0.7 + p.perf * 0.6) * (viral ? 1.5 : 1));
  const tail = Math.round(views * 0.4 * (p.content.tail || 1));
  // insights (short, visual)
  const ins = [];
  if (boost > 1) ins.push(['good', 'rocket', 'New creator boost']);
  if (p.affinity && p.affinity.k > 0.4) ins.push(['good', 'heart', `Your audience loves ${p.affinity.name}`]);
  if (viral) ins.push(['hot', 'flame', 'Went VIRAL']);
  if (gm.tags.includes('trending')) ins.push(['hot', 'trend', 'Trending topic']);
  if (gm.tags.includes('rising')) ins.push(['info', 'trend', 'Rising genre']);
  if (gm.tags.includes('event')) ins.push(['gold', 'calendar', 'Event bonus']);
  if (retention > 0.72) ins.push(['good', 'eye', 'Great retention']);
  else if (retention < 0.4) ins.push(['bad', 'eye', 'Viewers clicked away']);
  if (hm.tag === 'good-time') ins.push(['good', 'clock', 'Good upload time']);
  if (hm.tag === 'late') ins.push(['bad', 'moon', 'Late-night upload']);
  if (gm.tags.includes('bored')) ins.push(['bad', 'zzz', 'Audience got bored']);
  if (nm.tags.includes('hungry')) ins.push(['bad', 'food', 'Hungry: low focus']);
  if (nm.tags.includes('tired')) ins.push(['bad', 'bolt', 'Tired: sloppy edit']);
  if (p.thumb.id === 'shock' && p.title.id === 'hype') ins.push(['info', 'zap', 'Clickbait: more clicks, less trust']);
  if (Q > 1.2) ins.push(['good', 'camera', 'Crisp production']);
  else if (Q < 0.68 && n > 2) ins.push(['bad', 'camera', 'Upgrade your setup']);
  if (subs > views * 0.07) ins.push(['good', 'users', 'Followers spike']);
  return { views, subs, likes, comments, money, xp, tail, retention, viral, insights: ins.slice(0, 5), quality: Q, score: st.score };
}

// ---------------------------------------------------------------- STREAM
export function streamBase(s, p) {
  const st = setupStats(s);
  const Qs = 0.6 + st.stream * 0.95 + Math.min(0.15, st.vibe / 200);
  const gm = gameMult(p.game, p);
  const hm = hourMult(p.hour);
  const nm = needsMult(s);
  const ev = p.event?.fx || {};
  const n = s.stats.streams;
  const boost = n === 0 ? 2.0 : n === 1 ? 1.4 : 1;
  const P = Math.pow;
  const T = TUNE;
  const base = (5 + 2.5 * s.level + T.RS * P(s.fans.pulse, T.ES) + 0.12 * P(s.fans.vid, 0.62) + 0.1 * P(s.fans.blip, 0.6) + 0.08 * P(s.fans.lumo, 0.6))
    * Math.pow(gm.m * Qs * hm.m * nm.m * HOMES[s.home].viewMult * (ev.streamMult || 1), T.MP) * (p.announced ? 1.35 : 1) * boost;
  return { base, Qs, st, gm, hm, nm, boost };
}

// ---------------------------------------------------------------- SOCIAL
export const POST_TYPES = {
  update:   { name: 'Quick Update',  icon: 'message',   color: '#3cc8ff', mult: 0.85, desc: 'Say hi to your fans' },
  selfie:   { name: 'Selfie',        icon: 'camera',    color: '#ff9f43', mult: 1.25, desc: 'Lighting matters', needs: null },
  announce: { name: 'Announce Stream', icon: 'megaphone', color: '#9b6bff', mult: 0.7, desc: '+35% next stream' },
  clip:     { name: 'Post a Clip',   icon: 'scissors',  color: '#ff4f8b', mult: 2.3, desc: 'Uses a saved clip', needs: 'clip' },
  hottake:  { name: 'Hot Take',      icon: 'flame',     color: '#ff7a2f', mult: 1.7, desc: 'Risky but loud', level: 3 },
  sponsored:{ name: 'Sponsored Post',icon: 'handshake', color: '#4fd37b', mult: 0.6, desc: 'Complete a deal', needs: 'deal' },
  // Lumo
  setup:    { name: 'Setup Tour',    icon: 'monitor',   color: '#ff9f43', mult: 1.4, lumo: true, desc: 'Room vibe matters' },
  food:     { name: 'Food Pic',      icon: 'food',      color: '#ffb547', mult: 0.9, lumo: true, desc: 'After a great meal' },
  outfit:   { name: 'Fit Check',     icon: 'shirt',     color: '#ff4f8b', mult: 1.1, lumo: true, desc: 'Show your style' },
  bts:      { name: 'Behind the Scenes', icon: 'film', color: '#9b6bff', mult: 1.2, lumo: true, desc: 'Creator life' },
};
export function socialOutcome(s, type, fatigue) {
  const t = POST_TYPES[type];
  const st = setupStats(s);
  const fresh = clamp(1 - fatigue * 0.55, 0.3, 1);
  let gain, plat;
  if (t.lumo) {
    plat = 'lumo';
    const vibeK = type === 'setup' ? 0.6 + st.vibeScore / 100 : 0.8 + st.cq / 30;
    gain = (10 + 2 * s.level + TUNE.RL * Math.pow(s.fans.lumo, TUNE.EB) + 0.12 * Math.pow(s.fans.blip, 0.62) + 0.06 * Math.pow(s.fans.vid, 0.62)) * t.mult * vibeK * fresh;
  } else {
    plat = 'blip';
    const k = type === 'selfie' ? 0.75 + st.cq / 20 : 1;
    gain = (12 + s.level * 3 + TUNE.RB * Math.pow(s.fans.blip, TUNE.EB) + 0.1 * Math.pow(s.fans.vid, 0.62) + 0.08 * Math.pow(s.fans.pulse, 0.62)) * t.mult * k * fresh;
  }
  let viral = false;
  if ((type === 'clip' || type === 'hottake') && Math.random() < 0.12) { viral = true; gain *= 3.5; }
  gain *= 0.85 + Math.random() * 0.3;
  let backlash = type === 'hottake' && Math.random() < 0.3;
  if (backlash) gain *= 0.4;
  const followers = Math.max(1, Math.round(gain));
  const likes = Math.round(followers * (4 + Math.random() * 4) + Math.pow(s.fans[plat] || 0, 0.9) * 0.15 * fresh);
  const reposts = Math.round(likes * (0.05 + Math.random() * 0.08));
  const spill = Math.round(followers * (type === 'clip' ? 0.4 : 0.15)); // cross-platform spillover to Vidora
  const xp = Math.round(8 * (1 + 0.1 * (s.level - 1)) * (viral ? 2 : 1));
  return { followers, likes, reposts, spill, plat, viral, backlash, xp, fresh };
}

export function dealPay(s, mult, dealMult = 1, manager = false) {
  const power = totalFans(s);
  return Math.round(((60 + 1.2 * Math.pow(power, 0.75) + s.level * 30) * mult * dealMult * (manager ? 1.35 : 1)) / 5) * 5;
}
