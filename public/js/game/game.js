// Core game controller: state mutations, time, needs, rewards, level-ups, interactions and objective.
import { G } from './ctx.js';
import { S, save } from '../core/state.js';
import { bus } from '../core/bus.js';
import { clamp, fmt, fmtMoney, sleep, dayIndex, now, pick } from '../core/util.js';
import { xpForLevel, MAX_LEVEL, careerTitle, FEATURES, MILESTONES, hasFeature } from '../data/progression.js';
import { CONTENT } from '../data/content.js';
import { GAMES } from '../data/games.js';
import { GEAR } from '../data/gear.js';
import { DECOR, HOMES, THEMES } from '../data/decor.js';
import { FOODS } from '../data/food.js';
import { trendFor, totalFans, setupStats } from './economy.js';
import { toast, fly, modal, anyModal, h, bind, ic, $, pointAt } from '../ui/ui.js';
import { eventForDay, EVENTS } from '../data/events.js';

export class Game {
  constructor() {
    this.queueList = [];
    this.saveT = 0;
    this.passive = { views: 0, subs: 0, money: 0, t: 0 };
    this.clockSpeed = 1; // in-game minutes per real second
    this.busy = false;
  }
  get s() { return S.state; }

  // ---------------------------------------------------------------- busy / flows
  async run(name, fn) {
    if (this.busy) return false;
    this.busy = name; G.flow = name;
    G.world.inputEnabled = false;
    pointAt(null);
    G.ui.hud.highlight(null);
    try { await fn(); } catch (e) { console.error(e); }
    this.busy = false; G.flow = null;
    G.world.inputEnabled = true;
    G.ui.hud.show(true);
    this.refreshObjective();
    save();
    return true;
  }
  queue(fn) { this.queueList.push(fn); }

  // ---------------------------------------------------------------- currencies
  addMoney(n, from) {
    if (!n) return;
    const s = this.s;
    s.money = Math.max(0, s.money + n);
    if (n > 0) { s.stats.earned += n; bus.emit('q', { evt: 'earn', n }); }
    G.ui.hud.delta('money', n);
    if (from && n > 0) fly('money', from, Math.min(10, 3 + Math.floor(Math.log10(n + 1) * 2)));
  }
  spend(n) {
    if (this.s.money < n) { toast('Not enough cash', { icon: 'dollar', color: 'var(--red)' }); G.audio.sfx('error'); return false; }
    this.addMoney(-n); return true;
  }
  addSparks(n, from) {
    this.s.sparks += n;
    G.ui.hud.delta('sparks', n);
    if (from && n > 0) fly('sparks', from, 5);
  }
  addFans(plat, n, from, quiet) {
    if (!n) return;
    const s = this.s;
    const ev = this.currentEvent();
    s.fans[plat] = Math.max(0, (s.fans[plat] || 0) + n);
    if (n > 0) bus.emit('q', { evt: 'fans', n });
    if (!quiet) G.ui.hud.delta('fans', n);
    if (from && n > 0) fly('fans', from, Math.min(8, 2 + Math.floor(Math.log10(n + 1) * 2)));
    if (plat === 'vid') this.checkMilestones();
  }
  addXP(n, from) {
    const s = this.s;
    let mult = 1;
    if (s.buffs.xp2 > 0) mult *= 2;
    if (s.buffs.wellfed > 0) mult *= 1.25;
    n = Math.round(n * mult);
    s.xp += n;
    if (from) fly('xp', from, 5);
    while (s.level < MAX_LEVEL && s.xp >= xpForLevel(s.level)) {
      s.xp -= xpForLevel(s.level);
      s.level++;
      const L = s.level;
      this.queue(() => this.levelUp(L));
    }
    return n;
  }
  useBuff(id) { if (this.s.buffs[id] > 0) { this.s.buffs[id]--; return true; } return false; }
  addBuff(id, uses) { this.s.buffs[id] = (this.s.buffs[id] || 0) + uses; }

  // ---------------------------------------------------------------- time & needs
  get hour() { return (this.s.clock.min / 60) % 24; }
  trend() { return trendFor(this.s.clock.day); }
  currentEvent() {
    const e = eventForDay(dayIndex());
    return { ...e, def: EVENTS[e.id], fx: EVENTS[e.id].fx };
  }
  advance(hours, opts = {}) {
    const s = this.s;
    const before = s.clock.min;
    s.clock.min += hours * 60;
    while (s.clock.min >= 1440) { s.clock.min -= 1440; s.clock.day++; this.onNewGameDay(); }
    const lateH = this.lateHours(before, hours);
    if (!opts.noNeeds) {
      s.needs.hunger = clamp(s.needs.hunger - hours * 2.2, 0, 100);
      s.needs.energy = clamp(s.needs.energy - hours * 1.0 - lateH * 2.5, 0, 100);
    }
    // game fatigue recovers, social freshness recovers
    for (const k of Object.keys(s.gameUse)) s.gameUse[k] = Math.max(0, s.gameUse[k] - hours * 0.025);
    s.socialFatigue = Math.max(0, (s.socialFatigue || 0) - hours * 0.12);
    this.tailViews(hours);
    G.world.applyTime(this.hour);
  }
  lateHours(startMin, hours) {
    let n = 0;
    for (let i = 0; i < Math.ceil(hours * 4); i++) { const hh = ((startMin / 60 + i * 0.25) % 24); if (hh >= 23 || hh < 6) n += 0.25; }
    return n;
  }
  onNewGameDay() {
    const s = this.s;
    const tr = trendFor(s.clock.day);
    s.history.push({ d: s.clock.day, fans: totalFans(s), vid: s.fans.vid, money: Math.round(s.money) });
    if (s.history.length > 30) s.history.shift();
    this.queue(() => toast(`New trend: <b>${tr.hot[0].toUpperCase() + tr.hot.slice(1)}</b> games are hot today`, { icon: 'flame', color: '#ff7a2f' }));
    G.meta?.refreshDeals();
    G.meta?.genInbox();
  }
  tailViews(hours) {
    const s = this.s;
    let v = 0, sub = 0, mon = 0;
    for (const vd of s.videos) {
      if (!vd.tailLeft || vd.tailLeft < 1) continue;
      const take = Math.min(vd.tailLeft, Math.max(1, vd.tailLeft * (1 - Math.exp(-hours / 14))));
      vd.tailLeft -= take; vd.views += take;
      v += take; sub += take * vd.conv; mon += take * vd.rpm;
    }
    if (v >= 1) {
      s.stats.views += v;
      this.passive.views += v; this.passive.subs += sub; this.passive.money += mon;
      const ds = Math.floor(this.passive.subs), dm = Math.floor(this.passive.money);
      if (ds >= 1) { this.addFans('vid', ds, null, true); this.passive.subs -= ds; }
      if (dm >= 1) { this.s.money += dm; s.stats.earned += dm; this.passive.money -= dm; bus.emit('q', { evt: 'earn', n: dm }); }
    }
  }
  flushPassive(force) {
    const p = this.passive;
    if (p.views >= 25 && (force || p.views > 200)) {
      toast(`<b>+${fmt(p.views)}</b> views on your uploads`, { icon: 'eye', color: 'var(--vid)', sub: 'Your videos keep earning' });
      G.audio.sfx('notify');
      p.views = 0;
    }
  }

  // ---------------------------------------------------------------- milestones & level
  checkMilestones() {
    const s = this.s;
    for (const m of MILESTONES) {
      if (s.fans.vid >= m.at && !s.milestones.includes(m.id)) {
        s.milestones.push(m.id);
        this.queue(() => G.meta.milestone(m));
      }
    }
  }
  unlocksFor(L) {
    const out = [];
    CONTENT.filter((c) => c.level === L).forEach((c) => out.push({ icon: c.icon, text: `${c.name} videos`, color: 'var(--vid)' }));
    FEATURES.filter((f) => f.level === L).forEach((f) => out.push({ icon: f.icon === 'lumo' ? 'image' : f.icon, text: f.name, color: 'var(--violet)' }));
    GAMES.filter((g) => g.level === L && !g.exclusive && g.price > 0).forEach((g) => out.push({ icon: 'gamepad', text: g.name, color: 'var(--cyan)' }));
    for (const [cat, def] of Object.entries(GEAR)) def.tiers.forEach((t, i) => { if (i > 0 && t.level === L) out.push({ icon: def.icon, text: t.name, color: '#3b8cff' }); });
    HOMES.filter((h) => h.level === L && h.id > 0).forEach((h) => out.push({ icon: 'home', text: h.name, color: 'var(--amber)' }));
    DECOR.filter((d) => d.level === L && !d.exclusive).slice(0, 3).forEach((d) => out.push({ icon: 'paint', text: d.name, color: 'var(--pink)' }));
    FOODS.filter((f) => f.level === L && L > 1).forEach((f) => out.push({ icon: 'food', text: f.name, color: '#ffb547' }));
    Object.entries(THEMES).filter(([k, t]) => t.level === L && L > 1 && !t.exclusive).forEach(([k, t]) => out.push({ icon: 'paint', text: `${t.name} style`, color: 'var(--pink)' }));
    return out;
  }
  levelUp(L) { return G.meta.levelUp(L); }

  // ---------------------------------------------------------------- loop
  update(dt) {
    const s = this.s;
    if (!this.busy && !anyModal() && s.created_char) {
      // ambient clock
      const mins = dt * this.clockSpeed;
      this.advance(mins / 60);
      this.passive.t += dt;
      if (this.passive.t > 6) { this.passive.t = 0; this.flushPassive(); }
      // celebrations queue
      if (this.queueList.length && !this._qRunning) {
        this._qRunning = true;
        const fn = this.queueList.shift();
        Promise.resolve(fn()).finally(() => (this._qRunning = false));
      }
    }
    this.saveT += dt;
    if (this.saveT > 12) { this.saveT = 0; save(); }
    this.objT = (this.objT || 0) + dt;
    if (this.objT > 1) { this.objT = 0; if (!this.busy) this.refreshObjective(); }
  }

  // ---------------------------------------------------------------- interactions
  onPick(id) {
    if (this.busy || anyModal()) return;
    if (G.tutorial?.blockPick?.(id)) return;
    switch (id) {
      case 'desk': return this.doCreate();
      case 'fridge': case 'counter': return this.doKitchen();
      case 'bed': return this.doRest();
      case 'mirror': return G.life.wardrobe();
      case 'door': return G.life.door();
      case 'cat': return G.life.petCat();
      case 'sofa': return G.life.sofa();
      case 'me': return G.life.selfTalk();
    }
  }
  onFloor(p) {
    if (this.busy || anyModal()) return;
    G.world.walkTo(p.x, p.z);
  }
  doCreate() { if (this.busy) return; G.create.hub(); }
  doKitchen() { if (this.busy) return; G.life.kitchen(); }
  doRest() { if (this.busy) return; G.life.rest(); }
  openPhone(app) { if (this.busy) return; G.social.open(app); }
  openShop(tab) { if (this.busy) return; G.shop.open(tab); }
  openSettings() { G.meta.settings(); }
  openEvents() { G.meta.events(); }
  openLibrary() { if (this.busy) return; G.shop.open('games'); }
  openQuests() { G.meta.quests(); }
  openDaily() { G.meta.daily(); }
  openAnalytics() { G.meta.analytics(); }
  openProfile() { G.meta.profile(); }
  openGoal() { const g = this.nextGoal(); if (g) G.shop.open(g.tab, g.focus); else G.shop.open(); }

  // Next upgrade goal for the "one more upgrade" card
  nextGoal() {
    const s = this.s;
    const opts = [];
    for (const [cat, def] of Object.entries(GEAR)) {
      const next = def.tiers[s.gear[cat] + 1];
      if (next && next.level <= s.level) opts.push({ name: next.name, price: next.price, icon: def.icon, tab: 'gear', focus: cat });
    }
    const home = HOMES[s.home + 1];
    if (home && home.level <= s.level) opts.push({ name: home.name, price: home.price, icon: 'home', tab: 'homes' });
    opts.sort((a, b) => a.price - b.price);
    return opts[0] || null;
  }

  // Objective pill (non-tutorial)
  refreshObjective() {
    if (G.tutorial?.active) return;
    const s = this.s;
    const hud = G.ui.hud;
    if (s.needs.energy < 15) return hud.setObjective({ icon: 'bed', text: 'Exhausted — get some rest', color: 'var(--red)' });
    if (s.needs.hunger < 15) return hud.setObjective({ icon: 'food', text: 'Starving — grab some food', color: 'var(--red)' });
    const hh = this.hour;
    if ((hh >= 1 && hh < 6) && s.needs.energy < 60) return hud.setObjective({ icon: 'moon', text: 'It\'s late — sleep to start a new day', color: '#6d6bff' });
    const q = G.meta?.nextQuest?.();
    if (q) return hud.setObjective({ icon: q.icon, text: q.text, progress: `${Math.min(q.p, q.t)}/${q.t}`, color: 'var(--cyan)' });
    const g = this.nextGoal();
    if (g) return hud.setObjective({ icon: 'cart', text: s.money >= g.price ? `Buy: ${g.name}` : `Save up for ${g.name}`, progress: s.money >= g.price ? 'READY' : `${Math.floor((s.money / g.price) * 100)}%`, color: '#3b8cff' });
    hud.setObjective({ icon: 'play', text: 'Create content and grow!' });
  }
  updateGoalCard() {
    const g = this.nextGoal();
    const el = G.ui.hud.refs.goal;
    if (!g) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    $('.gn', el).textContent = g.name;
    $('.gi', el).innerHTML = ic(g.icon);
    const p = clamp(this.s.money / g.price, 0, 1);
    $('.bar i', el).style.width = p * 100 + '%';
    $('.gl', el).textContent = p >= 1 ? 'Ready to buy!' : `Next upgrade · ${fmtMoney(g.price)}`;
    el.classList.toggle('ready', p >= 1);
  }
}
