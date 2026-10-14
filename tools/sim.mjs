// Economy pacing simulator: plays a "reasonable engaged player" policy and prints progression over real minutes.
import { freshState } from '../public/js/core/state.js';
import { TUNE, videoOutcome, streamBase, socialOutcome, setupStats, trendFor, totalFans, dealPay } from '../public/js/game/economy.js';
import { CONTENT } from '../public/js/data/content.js';
import { GAMES } from '../public/js/data/games.js';
import { GEAR } from '../public/js/data/gear.js';
import { HOMES, DECOR } from '../public/js/data/decor.js';
import { xpForLevel, MILESTONES } from '../public/js/data/progression.js';
import { THUMBS } from '../public/js/data/content.js';

const RUNS = +(process.argv[2] || 5);
if (process.argv[3]) Object.assign(TUNE, JSON.parse(process.argv[3]));
const checkpoints = [3, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480];
const agg = checkpoints.map(() => []);
const rnd = (a, b) => a + Math.random() * (b - a);
function gauss(m, s) { return Math.max(0, Math.min(1, m + s * (Math.random() + Math.random() + Math.random() - 1.5))); }

for (let run = 0; run < RUNS; run++) {
  const s = freshState();
  s.created_char = true;
  let t = 0; // real seconds
  let ci = 0;
  let tail = []; // {left, conv, rpm}
  let actions = 0;
  const log = [];
  const addXP = (n) => { s.xp += n; while (s.xp >= xpForLevel(s.level)) { s.xp -= xpForLevel(s.level); s.level++; s.money += 60 + s.level * 45; s.sparks += 3; } };
  const advance = (h) => {
    s.clock.min += h * 60;
    while (s.clock.min >= 1440) { s.clock.min -= 1440; s.clock.day++; }
    s.needs.hunger = Math.max(0, s.needs.hunger - h * 2.2);
    s.needs.energy = Math.max(0, s.needs.energy - h * 1.0);
    for (const k of Object.keys(s.gameUse)) s.gameUse[k] = Math.max(0, s.gameUse[k] - h * 0.025);
    for (const v of tail) { const take = v.left * (1 - Math.exp(-h / 14)); v.left -= take; s.fans.vid += take * v.conv; s.money += take * v.rpm; }
  };
  const hour = () => (s.clock.min / 60) % 24;
  const pickGame = () => {
    const tr = trendFor(s.clock.day);
    const owned = s.games.map((id) => GAMES.find((g) => g.id === id));
    owned.sort((a, b) => (b.appeal * (b.tags.includes(tr.hot) ? 1.6 : 1) * (1 - (s.gameUse[b.id] || 0) * 0.45)) - (a.appeal * (a.tags.includes(tr.hot) ? 1.6 : 1) * (1 - (s.gameUse[a.id] || 0) * 0.45)));
    return owned[0];
  };
  let deals = 0;
  while (t < 480 * 60) {
    // needs
    if (s.needs.energy < 25) {
      if (hour() > 21 || hour() < 7 || s.money < 30) { const toMorning = ((24 - hour()) + 8) % 24 || 24; advance(toMorning); s.needs.energy = 100; t += 10; }
      else { s.money -= 9; s.needs.energy += 32; t += 6; }
    }
    if (s.needs.hunger < 30) { const f = s.level >= 6 && s.money > 200 ? 32 : 7; s.money -= f; s.needs.hunger += f > 10 ? 60 : 38; if (f > 10) s.needs.energy += 22; advance(0.5); t += 12; }
    // shopping
    let bought = true;
    while (bought) {
      bought = false;
      const opts = [];
      for (const [cat, def] of Object.entries(GEAR)) { const nx = def.tiers[s.gear[cat] + 1]; if (nx && nx.level <= s.level) opts.push({ kind: 'gear', cat, price: nx.price }); }
      const hm = HOMES[s.home + 1]; if (hm && hm.level <= s.level) opts.push({ kind: 'home', price: hm.price });
      const gm = GAMES.find((g) => !g.exclusive && !s.games.includes(g.id) && g.level <= s.level); if (gm) opts.push({ kind: 'game', id: gm.id, price: gm.price * 1.3 });
      const dc = DECOR.find((d) => d.price && !s.decor.includes(d.id) && d.level <= s.level && d.slot !== 'pet'); if (dc && s.placed.length < 4 + s.home * 4) opts.push({ kind: 'decor', id: dc.id, price: dc.price * 2 });
      opts.sort((a, b) => a.price - b.price);
      const o = opts[0];
      if (o && s.money >= o.price) {
        if (o.kind === 'gear') { s.money -= GEAR[o.cat].tiers[s.gear[o.cat] + 1].price; s.gear[o.cat]++; }
        if (o.kind === 'home') { s.money -= o.price; s.home++; }
        if (o.kind === 'game') { s.money -= GAMES.find((g) => g.id === o.id).price; s.games.push(o.id); }
        if (o.kind === 'decor') { s.money -= o.price / 2; s.decor.push(o.id); s.placed.push(o.id); }
        bought = true; t += 5;
      }
    }
    // action
    const a = ['video', 'video', 'stream', 'post', 'post'][actions % 5];
    actions++;
    const ev = { fx: {} };
    if (a === 'video') {
      const avail = CONTENT.filter((c) => c.level <= s.level && !c.needsPartner);
      const content = avail.sort((x, y) => y.views * y.subs - x.views * x.subs)[0];
      const game = pickGame();
      const tr = trendFor(s.clock.day);
      const out = videoOutcome(s, { game, content, perf: gauss(0.75, 0.15), thumb: THUMBS[1], title: { id: 'honest', ctr: 0.95, trust: 1.25 }, hour: hour(), trend: tr, event: ev, fatigue: s.gameUse[game.id] || 0, partnerMult: s.level >= 3 ? 1.4 : 1 });
      const first = out.views * 0.75;
      s.fans.vid += out.subs * 0.8; s.money += out.money * 0.75; addXP(out.xp);
      tail.push({ left: out.tail + out.views * 0.25, conv: out.subs / out.views, rpm: out.money / out.views });
      if (tail.length > 30) tail.shift();
      s.stats.videos++;
      s.gameUse[game.id] = Math.min(1, (s.gameUse[game.id] || 0) + 0.24);
      s.needs.energy -= content.energy; s.needs.hunger -= content.hunger;
      advance(content.hours); t += 50;
    } else if (a === 'stream') {
      const game = pickGame();
      const b = streamBase(s, { game, hour: hour(), trend: trendFor(s.clock.day), event: ev, fatigue: s.gameUse[game.id] || 0 });
      const avg = b.base * 0.85 * 1.25;
      const followers = avg * 0.0062 * 1.4 * 55 * 0.9;
      const money = avg * 0.5 * (55 / 60) * (s.level >= 3 ? 1.3 : 1) + 5 * (3 + avg * 0.05) * (1 + s.level * 0.12) + avg * 0.0018 * 10 * 55 * 2.5;
      s.fans.pulse += followers; s.fans.vid += followers * 0.15; s.money += money; addXP(Math.round((48 + 12) * (1 + 0.12 * (s.level - 1))));
      s.stats.streams++;
      s.needs.energy -= 22; s.needs.hunger -= 10; advance(3); t += 75;
    } else {
      const out = socialOutcome(s, s.level >= 8 && actions % 2 ? 'setup' : 'selfie', s.socialFatigue || 0);
      s.socialFatigue = (s.socialFatigue || 0) + 0.24;
      s.fans[out.plat] += out.followers; s.fans.vid += out.spill; addXP(out.xp);
      s.needs.energy -= 3; advance(0.25); t += 14;
      s.socialFatigue = Math.max(0, s.socialFatigue - 0.25 * 0.12);
    }
    if (s.level >= 5 && actions % 5 === 0) { s.money += dealPay(s, 0.8); deals++; }
    if (actions === 12 || actions === 40 || actions === 90) { s.money += 3 * (70 + s.level * 40); addXP(3 * (35 + s.level * 14)); }
    for (const m of MILESTONES) if (s.fans.vid >= m.at && !s.milestones.includes(m.id)) { s.milestones.push(m.id); s.money += m.reward.money; }
    while (ci < checkpoints.length && t >= checkpoints[ci] * 60) {
      agg[ci].push({ L: s.level, fans: totalFans(s), vid: s.fans.vid, money: s.money, score: setupStats(s).score, home: s.home, games: s.games.length, day: s.clock.day });
      ci++;
    }
  }
}
const avg = (arr, k) => arr.reduce((a, b) => a + b[k], 0) / arr.length;
const f = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : Math.round(n) + '';
console.log('min  | lvl  | fans    | vid     | money   | setup | home | games | day');
checkpoints.forEach((c, i) => { const a = agg[i]; if (!a.length) return; console.log(`${String(c).padStart(4)} | ${avg(a, 'L').toFixed(1).padStart(4)} | ${f(avg(a, 'fans')).padStart(7)} | ${f(avg(a, 'vid')).padStart(7)} | ${f(avg(a, 'money')).padStart(7)} | ${avg(a, 'score').toFixed(0).padStart(5)} | ${avg(a, 'home').toFixed(1).padStart(4)} | ${avg(a, 'games').toFixed(1).padStart(5)} | ${avg(a, 'day').toFixed(0).padStart(3)}`); });
