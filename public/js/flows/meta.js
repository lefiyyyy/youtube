// Meta systems: level-ups, milestones, daily rewards, quests, events, analytics, deals, team, settings, profile.
import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { bus } from '../core/bus.js';
import { save, wipe } from '../core/state.js';
import { $, $$, h, bind, ic, esc, modal, toast, fly, countUp, closeAllModals } from '../ui/ui.js';
import { xpForLevel, careerTitle, MILESTONES, TEAM, hasFeature, FEATURES } from '../data/progression.js';
import { QUEST_POOL, QUEST_BONUS } from '../data/quests.js';
import { dailyCalendar, COSMETICS } from '../data/rewards.js';
import { EVENTS, eventForDay } from '../data/events.js';
import { BRANDS, DEAL_TYPES, CREATORS } from '../data/sponsors.js';
import { INBOX, randomUser } from '../data/chat.js';
import { decorById, THEMES } from '../data/decor.js';
import { gameById, GENRES } from '../data/games.js';
import { BUFFS } from '../data/food.js';
import { totalFans, setupStats, dealPay } from '../game/economy.js';
import { npcPortrait } from './thumbs.js';
import { fmt, fmtMoney, clamp, sleep, dayIndex, msToNextDay, fmtDuration, seeded, now, uid, pick } from '../core/util.js';

const center = () => ({ x: innerWidth / 2, y: innerHeight / 2 });
function rewardChips(r) {
  const out = [];
  if (r.money) out.push(`<span class="chip good">${ic('dollar')}${fmtMoney(r.money)}</span>`);
  if (r.xp) out.push(`<span class="chip gold">${ic('star')}${fmt(r.xp)} XP</span>`);
  if (r.sparks) out.push(`<span class="chip info">${ic('spark')}${r.sparks}</span>`);
  if (r.tickets) out.push(`<span class="chip violet">${ic('ticket')}${r.tickets} pts</span>`);
  return out.join('');
}
export function grant(item, from = center()) {
  // item: {kind, amount, item, buff, uses, sparks}
  const s = G.s;
  switch (item.kind) {
    case 'money': G.game.addMoney(item.amount || 300 + s.level * 120, from); break;
    case 'sparks': G.game.addSparks(item.amount, from); break;
    case 'buff': G.game.addBuff(item.buff, item.uses); toast(`${BUFFS[item.buff].name} x${item.uses}`, { icon: BUFFS[item.buff].icon, color: 'var(--lime)', sub: BUFFS[item.buff].desc }); break;
    case 'decor': G.shop.grantDecor(item.item, true); break;
    case 'cosmetic': if (!s.cosmetics.includes(item.item)) s.cosmetics.push(item.item); toast(`Unlocked: <b>${COSMETICS[item.item].name}</b>`, { icon: 'sparkle', color: 'var(--amber)' }); if (COSMETICS[item.item].type === 'overlay' && !s.overlay) s.overlay = item.item; break;
    case 'game': if (!s.games.includes(item.item)) s.games.push(item.item); toast(`New game: <b>${gameById(item.item).name}</b>`, { icon: 'gamepad', color: 'var(--cyan)' }); break;
    case 'theme': if (!s.themes.includes(item.item)) s.themes.push(item.item); toast(`Room style unlocked: <b>${THEMES[item.item].name}</b>`, { icon: 'paint', color: 'var(--pink)', sub: 'Apply it in Shop > Style' }); break;
    case 'mega': G.game.addMoney(item.amount, from); G.game.addSparks(item.sparks, from); grant({ kind: 'cosmetic', item: item.item }, from); break;
  }
  G.audio.sfx('reward');
}
function itemLabel(it) {
  if (it.kind === 'decor') return { icon: 'paint', label: decorById(it.item).name };
  if (it.kind === 'cosmetic') { const c = COSMETICS[it.item]; return { icon: c.type === 'title' ? 'crown' : c.type === 'badge' ? 'trophy' : c.type === 'overlay' ? 'layers' : c.type === 'outfit' ? 'shirt' : 'sparkle', label: c.name }; }
  if (it.kind === 'game') return { icon: 'gamepad', label: gameById(it.item).name };
  if (it.kind === 'theme') return { icon: 'home', label: THEMES[it.item].name + ' Style' };
  if (it.kind === 'sparks') return { icon: 'spark', label: `${it.amount} Sparks` };
  if (it.kind === 'buff') return { icon: BUFFS[it.buff].icon, label: `${BUFFS[it.buff].name} x${it.uses}` };
  if (it.kind === 'money') return { icon: 'dollar', label: it.amount ? fmtMoney(it.amount) : 'Cash bundle' };
  return { icon: 'gift', label: 'Reward' };
}

export const Meta = {
  init() {
    bus.on('q', (e) => this.onProgress(e));
    this.ensureQuests();
  },

  // ---------------------------------------------------------------- LEVEL UP
  levelUp(L) {
    return new Promise((res) => {
      const s = G.s, W = G.world;
      const unlocks = G.game.unlocksFor(L);
      const newTitle = careerTitle(L) !== careerTitle(L - 1) ? careerTitle(L) : null;
      const bonus = { money: 60 + L * 45, sparks: 3 + Math.floor(L / 3) };
      G.audio.sfx('levelup');
      W.vfx.confetti(W.char.root.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 180, 3);
      if (G.flow == null) { W.char.play('celebrate', { restart: true }); W.char.setExpression('happy', 3); }
      G.sdk?.happy();
      const body = h(`<div class="lvlup"><div class="burst"></div><div class="ln">${L}</div><h2>Level up!</h2>${newTitle ? `<div class="chip gold" style="position:relative;font-size:15px;padding:7px 14px">${ic('crown')}New title: ${newTitle}</div>` : `<div class="muted" style="position:relative;font-weight:700">${careerTitle(L)}</div>`}
        ${unlocks.length ? `<div class="unlocks">${unlocks.slice(0, 8).map((u, i) => `<div class="unlock" style="animation-delay:${0.15 + i * 0.08}s"><div class="ui2" style="background:${u.color}">${ic(u.icon)}</div>${esc(u.text)}</div>`).join('')}</div>` : ''}
        <div class="row" style="position:relative;justify-content:center;margin:14px 0 6px">${rewardChips(bonus)}</div>
        <button class="btn primary big shine" data-a="ok" style="position:relative;margin-top:8px">${ic('check')}Awesome</button></div>`);
      const m = modal({ body, size: 'md', noClose: true, onClose: res });
      bind(body, { ok: (b) => { const r = b.getBoundingClientRect(); G.game.addMoney(bonus.money, { x: r.left + r.width / 2, y: r.top }); G.game.addSparks(bonus.sparks, { x: r.left + r.width / 2, y: r.top }); m.close(); setTimeout(() => W.char.clip === 'celebrate' && W.char.play('idle'), 300); } });
    });
  },

  // ---------------------------------------------------------------- MILESTONE
  milestone(m) {
    return new Promise((res) => {
      const W = G.world;
      G.audio.sfx('viral');
      W.vfx.confetti(W.char.root.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 220, 3.2);
      const body = h(`<div class="lvlup"><div class="burst"></div>
        <div class="ln" style="background:radial-gradient(circle at 35% 30%,#fff,${m.plaque || '#ffcf4a'} 55%,#00000055);font-size:44px;color:#1a1830">${ic('vidora')}</div>
        <h2>${fmt(m.at)} subscribers!</h2><div class="chip gold" style="position:relative;font-size:15px;padding:7px 14px">${ic('trophy')}${m.name}${m.plaque ? ' — plaque added to your wall' : ''}</div>
        <div class="row" style="position:relative;justify-content:center;margin:14px 0 6px">${rewardChips(m.reward)}</div>
        <button class="btn amber big shine" data-a="ok" style="position:relative;margin-top:8px">${ic('check')}Claim</button></div>`);
      const md = modal({ body, size: 'md', noClose: true, onClose: res });
      bind(body, { ok: (b) => { const r = b.getBoundingClientRect(), p = { x: r.left + r.width / 2, y: r.top }; G.game.addMoney(m.reward.money, p); G.game.addSparks(m.reward.sparks, p); W.room.buildPlaques(m.id); md.close(); } });
    });
  },

  // ---------------------------------------------------------------- DAILY REWARDS
  dailyAvailable() { return G.s.daily.lastDay !== dayIndex(); },
  daily(auto = false) {
    const s = G.s;
    const st = s.daily.streak, week = Math.floor(st / 7), dayInWeek = st % 7;
    const avail = this.dailyAvailable();
    const cal = dailyCalendar(week, s.level);
    const body = h(`<div><div class="row" style="justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px"><span class="chip gold">${ic('flame')}${st} day streak</span><span class="chip">${ic('clock')}${avail ? 'Ready to claim!' : 'Next gift in ' + fmtDuration(msToNextDay())}</span></div>
      <div class="cal">${cal.map((d, i) => {
        const claimed = i < dayInWeek, today = i === dayInWeek && avail;
        const lb = d.kind === 'decor' ? decorById(d.item).name : d.kind === 'cosmetic' ? COSMETICS[d.item].name : d.kind === 'money' ? fmtMoney(d.amount) : d.kind === 'sparks' ? `${d.amount} Sparks` : d.kind === 'mega' ? `${fmtMoney(d.amount)} + ${d.sparks} Sparks` : d.label;
        return `<div class="day ${claimed ? 'claimed' : ''} ${today ? 'today' : ''} ${d.rare ? 'rare' : ''} ${d.kind === 'mega' ? 'mega' : ''}">${d.kind === 'mega' ? '<div class="rays"></div>' : ''}<div class="dn">Day ${d.day}</div><div class="dic" style="color:${d.kind === 'money' ? 'var(--lime)' : d.kind === 'sparks' ? 'var(--cyan)' : '#fff'}">${ic(d.icon)}</div><div class="dl">${d.kind === 'mega' ? d.label : lb}</div><div class="ds">${d.kind === 'mega' ? esc(COSMETICS[d.item].name) : d.sub || (d.rare ? 'Exclusive' : '')}</div></div>`;
      }).join('')}</div>
      <div class="row" style="justify-content:center;margin-top:16px">${avail ? `<button class="btn amber big shine" data-a="claim">${ic('gift')}Claim Day ${dayInWeek + 1}</button>` : `<div class="muted" style="font-weight:700">${ic('calendar')} Come back tomorrow — Day ${dayInWeek + 1}: <b style="color:#fff">${cal[dayInWeek].label}</b></div>`}</div></div>`);
    const m = modal({ title: 'Daily Rewards', sub: 'Log in every day — Day 7 is huge', icon: 'gift', iconBg: 'linear-gradient(135deg,#ffd577,#ff7a2f)', body, size: 'lg' });
    bind(body, {
      claim: (b) => {
        if (!this.dailyAvailable()) return;
        const d = cal[dayInWeek];
        const card = $$('.day', body)[dayInWeek];
        card.appendChild(h(`<div class="stamp">${ic('check')}</div>`));
        const r = card.getBoundingClientRect();
        grant(d.kind === 'mega' ? { kind: 'mega', amount: d.amount, sparks: d.sparks, item: d.item } : d, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        s.daily.lastDay = dayIndex(); s.daily.streak++;
        save(true);
        b.outerHTML = `<div class="chip good" style="font-size:15px;padding:8px 14px">${ic('check')}Claimed! See you tomorrow</div>`;
        G.ui.hud.refs.daily.querySelector('.dot')?.remove();
        setTimeout(() => m.close(), 1400);
      },
    });
  },

  // ---------------------------------------------------------------- QUESTS
  ensureQuests() {
    const s = G.s, today = dayIndex();
    if (s.quests.day === today && s.quests.list.length) return;
    const r = seeded(today * 31 + 7);
    const pool = QUEST_POOL.filter((q) => !(q.id === 'thanks' && s.stats.streams < 1 && s.level < 3));
    const n = s.level >= 5 ? 4 : 3;
    const picked = [];
    const must = ['upload', 'live', 'post'];
    picked.push(must[Math.floor(r() * 3)]);
    while (picked.length < n) { const q = pool[Math.floor(r() * pool.length)]; if (!picked.includes(q.id)) picked.push(q.id); }
    const tot = { totalFans: totalFans(s), peakViewers: s.stats.peakViewers };
    s.quests = { day: today, bonus: false, list: picked.map((id) => { const q = QUEST_POOL.find((x) => x.id === id); const t = q.target(s.level, tot); return { id, t, p: 0, claimed: false }; }) };
  },
  questReward(q) {
    const def = QUEST_POOL.find((x) => x.id === q.id), L = G.s.level;
    return { money: def.r.money ? Math.round(def.r.money * (70 + L * 40) / 10) * 10 : 0, xp: def.r.xp ? Math.round(def.r.xp * (35 + L * 14)) : 0, sparks: def.r.sparks || 0 };
  },
  nextQuest() {
    const s = G.s;
    const q = s.quests.list.find((x) => x.p < x.t);
    if (!q) return null;
    const def = QUEST_POOL.find((x) => x.id === q.id);
    return { icon: def.icon, text: def.text(q.t), p: q.p, t: q.t };
  },
  onProgress(e) {
    const s = G.s;
    for (const q of s.quests.list) {
      const def = QUEST_POOL.find((x) => x.id === q.id);
      if (def.evt !== e.evt || q.p >= q.t) continue;
      q.p = def.max ? Math.max(q.p, e.n) : q.p + e.n;
      if (q.p >= q.t) { q.p = q.t; toast(`Quest complete: <b>${def.text(q.t)}</b>`, { icon: 'check', color: 'var(--lime)', sub: 'Claim in Quests' }); G.audio.sfx('quest'); }
    }
    // event tasks
    const ev = eventForDay(dayIndex());
    const es = this.evState(ev.key);
    const tasks = EVENTS[ev.id].tasks(s.level);
    for (const t of tasks) {
      if (t.evt !== e.evt || es.tasks[t.id] >= t.target) continue;
      if (t.tag && !(e.tags || []).includes(t.tag)) continue;
      es.tasks[t.id] = t.max ? Math.max(es.tasks[t.id] || 0, e.n) : (es.tasks[t.id] || 0) + e.n;
      if (es.tasks[t.id] >= t.target) { es.tasks[t.id] = t.target; es.points += t.pts; toast(`Event task done: <b>${t.text}</b>`, { icon: 'calendar', color: EVENTS[ev.id].colors[0], sub: `+${t.pts} event points` }); G.audio.sfx('quest'); }
    }
    this.updateBadges();
  },
  updateBadges() {
    const s = G.s, r = G.ui?.hud?.refs;
    if (!r) return;
    if (s.quests.day !== dayIndex()) this.ensureQuests();
    const done = s.quests.list.filter((q) => q.p >= q.t).length, unclaimed = s.quests.list.filter((q) => q.p >= q.t && !q.claimed).length;
    r.qn.textContent = `${done}/${s.quests.list.length}`;
    r.qn.className = 'q-n chip ' + (done === s.quests.list.length ? 'good' : '');
    let dot = r.quests.querySelector('.dot');
    if (unclaimed && !dot) r.quests.appendChild(h(`<span class="dot">${unclaimed}</span>`)); else if (!unclaimed && dot) dot.remove(); else if (dot) dot.textContent = unclaimed;
    const dd = r.daily.querySelector('.dot');
    if (this.dailyAvailable() && !dd) r.daily.appendChild(h(`<span class="dot">1</span>`)); else if (!this.dailyAvailable() && dd) dd.remove();
    // event chip
    const ev = eventForDay(dayIndex()), def = EVENTS[ev.id], es = this.evState(ev.key);
    r.ev.style.setProperty('--e1', def.colors[0]); r.ev.style.setProperty('--e2', def.colors[1]);
    r.ev.querySelector('.et').textContent = def.short;
    const maxP = def.rewards[def.rewards.length - 1].pts;
    r.ev.querySelector('.ep').textContent = `${es.points}/${maxP} pts`;
    r.ev.querySelector('.etm').textContent = fmtDuration((ev.endDay - dayIndex() - 1) * 86400000 + msToNextDay());
    r.ev.querySelector('.bar i').style.width = Math.min(100, (es.points / maxP) * 100) + '%';
    const claimable = def.rewards.some((rw, i) => es.points >= rw.pts && !es.claimed.includes(i));
    let ed = r.ev.querySelector('.dot');
    if (claimable && !ed) r.ev.appendChild(h(`<span class="dot">!</span>`)); else if (!claimable && ed) ed.remove();
    // trend chip
    const tr = G.game.trend();
    r.trend.querySelector('.tr-t').innerHTML = `<b style="color:${GENRES[tr.hot].color}">${GENRES[tr.hot].name}</b> trending`;
  },
  quests() {
    this.ensureQuests();
    const s = G.s;
    const all = s.quests.list.every((q) => q.claimed);
    const body = h(`<div><div class="row tiny muted" style="font-weight:700;margin-bottom:10px">${ic('clock')} New quests in ${fmtDuration(msToNextDay())}</div>
      ${s.quests.list.map((q, i) => { const def = QUEST_POOL.find((x) => x.id === q.id); const done = q.p >= q.t; return `<div class="quest ${done ? 'done' : ''}"><div class="qi">${ic(done ? 'check' : def.icon)}</div><div class="grow"><div class="qt">${def.text(q.t)}</div><div class="bar"><i style="width:${(q.p / q.t) * 100}%"></i></div><div class="qr">${rewardChips(this.questReward(q))}</div></div>${q.claimed ? `<span class="chip good">${ic('check')}Claimed</span>` : done ? `<button class="btn go small shine" data-a="claim" data-i="${i}">Claim</button>` : `<span class="chip">${fmt(q.p)}/${fmt(q.t)}</span>`}</div>`; }).join('')}
      <div class="quest" style="background:linear-gradient(135deg,rgba(255,194,75,.14),rgba(255,79,139,.12));border-color:rgba(255,194,75,.35)"><div class="qi" style="background:linear-gradient(135deg,#ffd577,#ff7a2f);color:#2b1700">${ic('gift')}</div><div class="grow"><div class="qt">Complete all quests</div><div class="qr">${rewardChips({ sparks: QUEST_BONUS.sparks, tickets: QUEST_BONUS.tickets * 5 })}</div></div>${s.quests.bonus ? `<span class="chip good">${ic('check')}Claimed</span>` : all ? `<button class="btn amber small shine" data-a="bonus">Open chest</button>` : `<span class="chip">${ic('lock')}</span>`}</div></div>`);
    const m = modal({ title: 'Daily Quests', sub: 'Quick goals, big rewards', icon: 'target', iconBg: 'linear-gradient(135deg,#6fe7ff,#25c6f2)', body, size: 'md' });
    bind(body, {
      claim: (b) => {
        const q = s.quests.list[+b.dataset.i];
        if (q.claimed || q.p < q.t) return;
        q.claimed = true;
        const r = this.questReward(q), rc = b.getBoundingClientRect(), p = { x: rc.left + rc.width / 2, y: rc.top };
        if (r.money) G.game.addMoney(r.money, p);
        if (r.xp) G.game.addXP(r.xp, p);
        if (r.sparks) G.game.addSparks(r.sparks, p);
        G.audio.sfx('reward');
        m.close(true); this.quests(); this.updateBadges();
      },
      bonus: (b) => {
        s.quests.bonus = true;
        const rc = b.getBoundingClientRect(), p = { x: rc.left + rc.width / 2, y: rc.top };
        G.game.addSparks(QUEST_BONUS.sparks, p);
        const ev = eventForDay(dayIndex()); this.evState(ev.key).points += QUEST_BONUS.tickets * 5;
        G.audio.sfx('reward'); G.world.vfx.confetti(G.world.char.root.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 100, 2.6);
        toast(`+${QUEST_BONUS.tickets * 5} event points`, { icon: 'ticket', color: 'var(--violet)' });
        m.close(true); this.quests(); this.updateBadges();
      },
    });
  },

  // ---------------------------------------------------------------- EVENTS
  evState(key) { const s = G.s; if (!s.events[key]) s.events[key] = { points: 0, claimed: [], tasks: {} }; return s.events[key]; },
  eventCard(ev, locked) {
    const def = EVENTS[ev.id], s = G.s;
    const es = locked ? { points: 0, claimed: [], tasks: {} } : this.evState(ev.key);
    const fxs = [];
    if (def.fx.genre) fxs.push(`${ic(GENRES[def.fx.genre].icon)} ${GENRES[def.fx.genre].name} games x${def.fx.genreMult}`);
    if (def.fx.streamMult) fxs.push(`${ic('live')} Streams x${def.fx.streamMult}`);
    if (def.fx.followMult) fxs.push(`${ic('users')} Followers x${def.fx.followMult}`);
    if (def.fx.dealMult) fxs.push(`${ic('handshake')} Deals pay x${def.fx.dealMult}`);
    if (def.fx.viewMult) fxs.push(`${ic('eye')} Views x${def.fx.viewMult}`);
    if (def.fx.sale) fxs.push(`${ic('cart')} -${def.fx.sale.pct}% ${def.fx.sale.tag} games`);
    if (def.fx.collabMult) fxs.push(`${ic('handshake')} Collabs x${def.fx.collabMult}`);
    const remaining = (ev.endDay - dayIndex() - 1) * 86400000 + msToNextDay();
    return `<div class="ev-hero ${locked ? 'locked' : ''}" style="--e1:${def.colors[0]};--e2:${def.colors[1]}"><svg class="ev-art"><use href="#i-${def.icon}"/></svg>
      ${locked ? `<span class="lockline">${ic('lock')} LOCKED · STARTS ${ev.startDay - dayIndex() <= 1 ? 'TOMORROW' : 'IN ' + (ev.startDay - dayIndex()) + ' DAYS'}</span>` : `<span class="lockline" style="background:rgba(255,255,255,.22)">${ic('live')} LIVE NOW · ends in ${fmtDuration(remaining)}</span>`}
      <h3>${def.name}</h3><div style="font-weight:700;opacity:.9">${def.tagline}</div>
      <div class="row" style="flex-wrap:wrap;margin-top:10px">${fxs.map((f) => `<span class="chip" style="background:rgba(0,0,0,.25);border-color:rgba(255,255,255,.2);color:#fff">${f}</span>`).join('')}</div>
      <div class="track">${def.rewards.map((rw, i) => { const L = itemLabel(rw); const got = es.claimed.includes(i), ready = !locked && es.points >= rw.pts && !got; return `<div class="tr-node ${got ? 'got' : ''} ${ready ? 'ready' : ''} ${i === def.rewards.length - 1 ? 'last' : ''}" ${ready ? `data-a="claimEv" data-i="${i}" style="cursor:pointer"` : ''}><div class="tn-ic">${ic(got ? 'check' : locked ? 'lock' : L.icon)}</div><div class="tn-l">${esc(L.label)}</div><div class="tn-p">${ready ? 'CLAIM!' : rw.pts + ' pts'}</div></div>`; }).join('')}</div>
      ${locked ? '' : `<div class="row" style="margin-top:12px;font:800 14px var(--display)">${ic('ticket')} ${es.points} points</div>`}</div>`;
  },
  events() {
    const s = G.s;
    const today = dayIndex();
    const cur = eventForDay(today);
    const next = eventForDay(cur.endDay);
    const def = EVENTS[cur.id];
    const es = this.evState(cur.key);
    const tasks = def.tasks(s.level);
    const remind = s.reminders.includes(next.key);
    const body = h(`<div class="col" style="gap:14px">${this.eventCard(cur, false)}
      <div><div class="tiny muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Event tasks</div>
      ${tasks.map((t) => { const p = es.tasks[t.id] || 0, done = p >= t.target; return `<div class="quest ${done ? 'done' : ''}" style="margin-bottom:8px"><div class="qi">${ic(done ? 'check' : 'ticket')}</div><div class="grow"><div class="qt">${t.text}</div><div class="bar"><i style="width:${(Math.min(p, t.target) / t.target) * 100}%"></i></div></div><span class="chip violet">+${t.pts} pts</span></div>`; }).join('')}</div>
      <div><div class="tiny muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Up next</div>${this.eventCard(next, true)}
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn ${remind ? 'ghost' : 'violet'} small" data-a="remind">${ic(remind ? 'check' : 'clock')}${remind ? 'Reminder set' : 'Remind me'}</button></div></div></div>`);
    const m = modal({ title: 'Live Events', sub: 'Limited-time rewards', icon: 'calendar', iconBg: `linear-gradient(135deg,${def.colors[0]},${def.colors[1]})`, body, size: 'lg' });
    bind(body, {
      claimEv: (b) => {
        const i = +b.dataset.i, rw = def.rewards[i];
        if (es.claimed.includes(i) || es.points < rw.pts) return;
        es.claimed.push(i);
        const r = b.getBoundingClientRect();
        grant(rw.kind === 'money' && !rw.amount ? { kind: 'money', amount: 400 + s.level * 200 } : rw, { x: r.left + r.width / 2, y: r.top });
        if (i === def.rewards.length - 1) { G.world.vfx.confetti(G.world.char.root.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 200, 3); G.audio.sfx('viral'); }
        m.close(true); this.events(); this.updateBadges();
      },
      remind: () => { if (!s.reminders.includes(next.key)) s.reminders.push(next.key); m.close(true); this.events(); toast('We\'ll remind you tomorrow!', { icon: 'clock', color: 'var(--violet)' }); },
    });
  },
  maybeTeaser(good) {
    const s = G.s;
    this._teaserN = (this._teaserN || 0) + 1;
    if (!good || this._teaserShown || this._teaserN < 2 || G.tutorial?.active) return;
    this._teaserShown = true;
    G.game.queue(() => new Promise((res) => {
      const cur = eventForDay(dayIndex());
      const next = eventForDay(cur.endDay);
      const body = h(`<div class="col" style="gap:12px">${this.eventCard(next, true)}<div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><span class="muted" style="font-weight:700">${ic('sparkle')} Come back tomorrow to unlock these rewards</span><div class="row"><button class="btn ghost" data-a="x">Later</button><button class="btn violet shine" data-a="remind">${ic('clock')}Remind me</button></div></div></div>`);
      const m = modal({ title: 'Coming Soon', sub: 'Your next event is almost here', icon: 'calendar', iconBg: `linear-gradient(135deg,${EVENTS[next.id].colors[0]},${EVENTS[next.id].colors[1]})`, body, size: 'md', onClose: res });
      G.audio.sfx('notify');
      bind(body, { x: () => m.close(), remind: () => { if (!s.reminders.includes(next.key)) s.reminders.push(next.key); toast('Reminder set!', { icon: 'check', color: 'var(--violet)' }); m.close(); } });
    }));
  },

  // ---------------------------------------------------------------- DEALS / INBOX
  refreshDeals(force) {
    const s = G.s, D = s.deals;
    if (!hasFeature(s, 'deals')) return;
    const today = s.clock.day;
    if (!force && D.lastRefresh === today && D.offers.length) return;
    D.lastRefresh = today;
    const ev = G.game.currentEvent();
    while (D.offers.length < 3) {
      const b = pick(BRANDS);
      const types = DEAL_TYPES.filter((t) => !t.level || s.level >= t.level);
      const t = pick(types);
      D.offers.push({ id: uid(), brandId: b.id, brand: b.name, req: t.req, text: t.text, pay: dealPay(s, t.mult, ev.fx.dealMult || 1, !!s.team.manager) });
    }
  },
  completeDeal(d) {
    const s = G.s, D = s.deals;
    D.active = D.active.filter((x) => x.id !== d.id);
    D.done++;
    G.game.addMoney(d.pay, { x: innerWidth / 2, y: innerHeight / 2 });
    toast(`<b>${esc(d.brand)}</b> paid ${fmtMoney(d.pay)}`, { icon: 'handshake', color: '#4fd37b', sub: 'Deal complete' });
    G.audio.sfx('cash');
  },
  genInbox() {
    const s = G.s;
    if (!hasFeature(s, 'inbox')) return;
    if (s.inbox.lastGen === s.clock.day) return;
    s.inbox.lastGen = s.clock.day;
    s.inbox.list = s.inbox.list.filter((m) => !m.done).slice(-4);
    for (let i = 0; i < 2; i++) s.inbox.list.push({ id: uid(), t: Math.floor(Math.random() * INBOX.length), user: randomUser(), done: false });
  },

  // ---------------------------------------------------------------- ANALYTICS
  analytics() {
    const s = G.s;
    const st = setupStats(s);
    const adv = hasFeature(s, 'analytics2');
    const hist = [...s.history.map((x) => x.fans), totalFans(s)];
    const genreViews = {};
    s.videos.forEach((v) => { const g = gameById(v.game); if (g) g.tags.forEach((t) => (genreViews[t] = (genreViews[t] || 0) + v.views)); });
    const gv = Object.entries(genreViews).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const gmax = Math.max(1, ...gv.map((x) => x[1]));
    const plat = [['vidora', 'Vidora subs', s.fans.vid, 'var(--vid)'], ['pulse', 'Pulse followers', s.fans.pulse, 'var(--pulse)'], ['blip', 'Blip followers', s.fans.blip, 'var(--blip)'], ['lumo', 'Lumo followers', s.fans.lumo, 'var(--lumo)']];
    const pmax = Math.max(1, ...plat.map((p) => p[2]));
    const body = h(`<div class="col" style="gap:14px">
      <div class="kpis">
        <div class="kpi"><div class="kh">${ic('heart')}Total fans</div><div class="kv">${fmt(totalFans(s))}</div><div class="kd">${hist.length > 1 ? '+' + fmt(hist[hist.length - 1] - hist[Math.max(0, hist.length - 2)]) + ' today' : 'Growing'}</div></div>
        <div class="kpi"><div class="kh">${ic('eye')}Total views</div><div class="kv">${fmt(s.stats.views)}</div><div class="kd">${s.stats.videos} videos</div></div>
        <div class="kpi"><div class="kh">${ic('dollar')}Earned</div><div class="kv">${fmtMoney(s.stats.earned)}</div><div class="kd">${s.stats.streams} streams</div></div>
        <div class="kpi"><div class="kh">${ic('sparkle')}Setup score</div><div class="kv">${st.score}</div><div class="kd">Vibe ${st.vibeScore}</div></div>
      </div>
      <div class="card" style="padding:14px"><div class="row" style="justify-content:space-between"><b class="display">Fan growth</b><span class="chip">${ic('trend')}last ${hist.length} days</span></div><canvas class="chart" width="900" height="300"></canvas></div>
      <div class="card" style="padding:14px"><b class="display">Platforms</b>${plat.filter((p, i) => i < 3 || hasFeature(s, 'lumo')).map(([icn, n, v, c]) => `<div class="row" style="margin-top:8px">${ic(icn)}<span style="width:130px;font-weight:700;font-size:14px">${n}</span><div class="bar grow" style="--c1:${c};--c2:${c}"><i style="width:${(v / pmax) * 100}%"></i></div><b class="display" style="width:60px;text-align:right">${fmt(v)}</b></div>`).join('')}
        <div class="tiny muted" style="margin-top:10px;font-weight:600">${ic('info')} Platforms feed each other: big Vidora channels draw stream viewers, clips grow Blip, Lumo raises deal pay.</div></div>
      ${adv ? `<div class="card" style="padding:14px"><b class="display">Audience loves</b>${gv.length ? gv.map(([g, v]) => `<div class="row" style="margin-top:8px"><span class="gtag" style="--gc:${GENRES[g].color};width:110px">${ic(GENRES[g].icon)}${GENRES[g].name}</span><div class="bar grow" style="--c1:${GENRES[g].color};--c2:${GENRES[g].color}"><i style="width:${(v / gmax) * 100}%"></i></div><b style="width:60px;text-align:right">${fmt(v)}</b></div>`).join('') : '<div class="muted tiny">Upload videos to see insights.</div>'}
        <div class="row" style="margin-top:10px;flex-wrap:wrap"><span class="chip good">${ic('clock')}Best upload time: 6–11 PM</span><span class="chip info">${ic('heart')}Community mood ${Math.round(s.mood)}</span></div></div>` : `<div class="chip" style="align-self:flex-start">${ic('lock')}Advanced analytics at level 7</div>`}
      <div class="card" style="padding:14px"><b class="display">Recent uploads</b><div style="margin-top:8px">${s.videos.slice(0, 6).map((v) => `<div class="vid-row">${v.thumb ? `<img src="${v.thumb}">` : `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%232a2850'/%3E%3C/svg%3E">`}<div class="grow"><div class="vt">${esc(v.title)}</div><div class="row tiny muted" style="font-weight:700;margin-top:3px">${ic('eye')}${fmt(v.views)} · ${ic('users')}+${fmt(v.subs)} · ${v.perf}%${v.viral ? ` <span class="chip hot" style="padding:1px 6px">${ic('flame')}Viral</span>` : ''}</div></div></div>`).join('') || '<div class="muted tiny">No uploads yet.</div>'}</div></div></div>`);
    modal({ title: 'Creator Studio', sub: `${esc(s.profile.name)} · ${careerTitle(s.level)}`, icon: 'chart', iconBg: 'linear-gradient(135deg,#ff5a5f,#d42459)', body, size: 'lg' });
    // chart
    const c = $('canvas', body), x = c.getContext('2d');
    const W = c.width, H = c.height, pad = 30;
    const data = hist.length > 1 ? hist : [0, hist[0] || 0];
    const mx = Math.max(10, ...data);
    x.strokeStyle = 'rgba(255,255,255,0.07)'; x.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { const y = pad + (H - pad * 2) * (i / 4); x.beginPath(); x.moveTo(pad, y); x.lineTo(W - pad, y); x.stroke(); }
    const pts = data.map((v, i) => [pad + (W - pad * 2) * (i / (data.length - 1)), H - pad - (H - pad * 2) * (v / mx)]);
    const gr = x.createLinearGradient(0, pad, 0, H - pad); gr.addColorStop(0, 'rgba(255,79,139,0.45)'); gr.addColorStop(1, 'rgba(255,79,139,0)');
    x.fillStyle = gr; x.beginPath(); x.moveTo(pts[0][0], H - pad); pts.forEach((p) => x.lineTo(p[0], p[1])); x.lineTo(pts[pts.length - 1][0], H - pad); x.fill();
    x.strokeStyle = '#ff4f8b'; x.lineWidth = 5; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke();
    const lp = pts[pts.length - 1]; x.fillStyle = '#fff'; x.beginPath(); x.arc(lp[0], lp[1], 8, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.6)'; x.font = '600 20px Outfit'; x.fillText(fmt(mx), 4, pad + 6);
  },

  // ---------------------------------------------------------------- COLLABS / TEAM
  collabs() {
    const s = G.s, fans = totalFans(s);
    const body = h(`<div><div class="tiny muted" style="font-weight:700;margin-bottom:10px">${ic('info')} Pick "Collab" as your video type to record with a partner. Bigger partners share bigger audiences.</div>
      <div class="grid">${CREATORS.map((c) => { const ok = fans >= c.fans * 0.25; return `<div class="card ${ok ? '' : 'locked'}"><div class="row"><div class="big-ic" style="background:${c.color};border-radius:50%;overflow:hidden"><img src="${npcPortrait(c)}" style="width:130%;margin-top:10%"></div><div><div class="ttl">${c.name}</div><div class="tiny muted">${fmt(c.fans)} fans · ${c.niche}</div></div></div><div class="foot">${ok ? `<span class="chip good">${ic('check')}Available</span>${s.collabs[c.id] ? `<span class="chip">${s.collabs[c.id]} collabs</span>` : ''}` : `<span class="chip">${ic('lock')}Need ${fmt(c.fans * 0.25)} fans</span>`}</div></div>`; }).join('')}</div>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn violet" data-a="go">${ic('play')}Record a collab</button></div></div>`);
    const m = modal({ title: 'Collabs', icon: 'users', iconBg: 'linear-gradient(135deg,#b48cff,#6236e0)', body, size: 'lg' });
    bind(body, { go: () => { m.close(true); G.game.doCreate(); } });
  },
  team() {
    const s = G.s;
    const body = h(`<div class="grid">${TEAM.map((t) => { const hired = s.team[t.id], locked = s.level < t.level; return `<div class="card"><div class="row"><div class="big-ic" style="color:var(--cyan)">${ic(t.icon)}</div><div><div class="ttl">${t.name}</div><div class="tiny muted" style="font-weight:600">${t.desc}</div></div></div><div class="foot">${hired ? `<span class="chip good">${ic('check')}On your team</span>` : locked ? `<span class="chip">${ic('lock')}Level ${t.level}</span>` : `<button class="btn ${s.money >= t.price ? 'go' : 'ghost'} small" data-a="hire" data-id="${t.id}">Hire <span class="price">${fmtMoney(t.price)}</span></button>`}</div></div>`; }).join('')}</div>`);
    const m = modal({ title: 'Creator Team', sub: 'Hire help, scale up', icon: 'team', iconBg: 'linear-gradient(135deg,#35dcff,#1f7fe0)', body, size: 'md' });
    bind(body, { hire: (b) => { const t = TEAM.find((x) => x.id === b.dataset.id); if (!G.game.spend(t.price)) return; s.team[t.id] = true; G.audio.sfx('buy'); toast(`Hired: <b>${t.name}</b>`, { icon: t.icon, color: 'var(--cyan)', sub: t.desc }); m.close(true); this.team(); } });
  },

  // ---------------------------------------------------------------- PROFILE
  profile() {
    const s = G.s;
    const titles = s.cosmetics.filter((id) => COSMETICS[id]?.type === 'title');
    const badges = s.cosmetics.filter((id) => COSMETICS[id]?.type === 'badge');
    const body = h(`<div class="col" style="gap:14px">
      <div class="row" style="gap:16px"><div class="avatar" style="width:96px;height:96px;--p:${(s.xp / xpForLevel(s.level)) * 100}"><div class="face"><img src="${G.ui.hud.portraitURL || ''}"></div><div class="lvl">${s.level}</div></div>
        <div class="grow"><div class="display" style="font-size:28px">${esc(s.profile.name)}</div><div style="color:var(--amber);font-weight:700">${s.profile.title || careerTitle(s.level)}</div><div class="bar" style="margin-top:8px;--c1:var(--amber);--c2:#ffe39a"><i style="width:${(s.xp / xpForLevel(s.level)) * 100}%"></i></div><div class="tiny muted" style="margin-top:4px;font-weight:700">${fmt(s.xp)} / ${fmt(xpForLevel(s.level))} XP to level ${s.level + 1}</div></div>
        <button class="btn ghost small" data-a="style">${ic('shirt')}Style</button></div>
      <div class="kpis"><div class="kpi"><div class="kh">${ic('film')}Videos</div><div class="kv">${s.stats.videos}</div></div><div class="kpi"><div class="kh">${ic('live')}Streams</div><div class="kv">${s.stats.streams}</div></div><div class="kpi"><div class="kh">${ic('blip')}Posts</div><div class="kv">${s.stats.posts}</div></div><div class="kpi"><div class="kh">${ic('eye')}Peak live</div><div class="kv">${fmt(s.stats.peakViewers)}</div></div></div>
      ${s.stats.best ? `<div class="chip gold" style="align-self:flex-start">${ic('trophy')}Best video: ${esc(s.stats.best.title)} · ${fmt(s.stats.best.views)} views</div>` : ''}
      <div><div class="tiny muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Title</div><div class="opts"><button class="opt ${!s.profile.title ? 'on' : ''}" data-a="title" data-t="">${careerTitle(s.level)}</button>${titles.map((id) => `<button class="opt ${s.profile.title === COSMETICS[id].text ? 'on' : ''}" data-a="title" data-t="${COSMETICS[id].text}">${COSMETICS[id].text}</button>`).join('')}</div></div>
      <div><div class="tiny muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Badges</div><div class="row" style="flex-wrap:wrap">${badges.length ? badges.map((id) => `<span class="chip" style="color:${COSMETICS[id].color};border-color:${COSMETICS[id].color}">${ic('trophy')}${COSMETICS[id].name}</span>`).join('') : '<span class="muted tiny" style="font-weight:600">Win badges from live events.</span>'}</div></div>
      <div><div class="tiny muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Milestones</div><div class="row" style="flex-wrap:wrap">${MILESTONES.map((m) => `<span class="chip ${s.milestones.includes(m.id) ? 'gold' : ''}">${ic(s.milestones.includes(m.id) ? 'trophy' : 'lock')}${m.name} · ${fmt(m.at)}</span>`).join('')}</div></div></div>`);
    const m = modal({ title: 'Profile', icon: 'user', iconBg: 'linear-gradient(135deg,#ffd577,#ffb02e)', body, size: 'md' });
    bind(body, { title: (b) => { s.profile.title = b.dataset.t || null; m.close(true); this.profile(); }, style: () => { m.close(true); G.life.wardrobe(); } });
  },

  // ---------------------------------------------------------------- SETTINGS
  settings() {
    const s = G.s, st = s.settings;
    const q = st.quality;
    const body = h(`<div>
      <div class="set-row"><div class="sl">${ic('music')}Music</div><input type="range" min="0" max="1" step="0.05" value="${st.music}" data-k="music"></div>
      <div class="set-row"><div class="sl">${ic('sound')}Sound effects</div><input type="range" min="0" max="1" step="0.05" value="${st.sfx}" data-k="sfx"></div>
      <div class="set-row"><div class="sl">${ic('monitor')}Graphics</div><div class="seg-ctl">${['auto', 'low', 'medium', 'high'].map((k) => `<button class="${q === k ? 'on' : ''}" data-a="q" data-k="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div></div>
      <div class="set-row"><div class="sl">${ic('zap')}Camera shake</div><div class="seg-ctl"><button class="${st.shake ? 'on' : ''}" data-a="shake" data-v="1">On</button><button class="${!st.shake ? 'on' : ''}" data-a="shake" data-v="0">Off</button></div></div>
      <div class="set-row"><div class="sl">${ic('full')}Fullscreen</div><button class="btn ghost small" data-a="fs">${document.fullscreenElement ? 'Exit' : 'Enter'}</button></div>
      <div class="set-row"><div class="sl">${ic('undo')}Reset progress</div><button class="btn red small" data-a="reset">Reset</button></div>
      <div class="tiny muted" style="margin-top:12px;font-weight:600;line-height:1.5">${ic('info')} Progress saves automatically. Desktop: click objects in the room, drag to look around, scroll to zoom. Mobile: tap, drag, pinch.</div></div>`);
    const m = modal({ title: 'Settings', icon: 'gear', iconBg: 'linear-gradient(135deg,#8d8fb0,#4a4d6e)', body, size: 'sm' });
    $$('input[type=range]', body).forEach((r) => r.addEventListener('input', () => { st[r.dataset.k] = +r.value; G.audio.setVolumes(st.music, st.sfx); }));
    bind(body, {
      q: (b) => { st.quality = b.dataset.k; G.world.setQuality(st.quality); G.world.applyTime(G.game.hour, true); $$('[data-a=q]', body).forEach((x) => x.classList.toggle('on', x === b)); },
      shake: (b) => { st.shake = b.dataset.v === '1'; $$('[data-a=shake]', body).forEach((x) => x.classList.toggle('on', x === b)); },
      fs: () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => {}); m.close(true); },
      reset: (b) => {
        if (b.dataset.confirm) { wipe(); location.reload(); return; }
        b.dataset.confirm = '1'; b.textContent = 'Tap again to confirm';
      },
    });
  },
};
