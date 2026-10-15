// Create hub, game/content pickers and the full video production flow.
import { G } from '../game/ctx.js';
import { bus } from '../core/bus.js';
import { $, $$, h, bind, ic, esc, modal, toast, fly, countUp, floatText, flash } from '../ui/ui.js';
import { GAMES, GENRES, gameById } from '../data/games.js';

// Share of past views your audience gave to this game's best-matching genre
export function affinityFor(game) {
  const s = G.s;
  if (s.videos.length < 3) return null;
  const gv = {}; let tot = 0;
  for (const v of s.videos) { const g = gameById(v.game); if (!g) continue; tot += v.views; for (const t of g.tags) gv[t] = (gv[t] || 0) + v.views; }
  let best = null;
  for (const t of game.tags) { const k = (gv[t] || 0) / Math.max(1, tot); if (!best || k > best.k) best = { k, name: GENRES[t].name }; }
  return best;
}
import { CONTENT, THUMBS, makeTitles, contentById } from '../data/content.js';
import { CREATORS } from '../data/sponsors.js';
import { gameCover, drawGame } from '../world/screens.js';
import { videoOutcome, setupStats, totalFans } from '../game/economy.js';
import { hasFeature } from '../data/progression.js';
import { makeThumb, smallJpeg, npcPortrait } from './thumbs.js';
import { makeVideo, step, gradeOf, PREMIERE_MIN } from '../game/videos.js';
import { makeComment } from '../data/comments.js';
import { USER_COLORS } from '../data/chat.js';
import { emotify } from '../ui/icons.js';
import { fmt, fmtMoney, fmtInt, clamp, sleep, pick, uid, isTouch } from '../core/util.js';

export function overlay(html, cls = '') {
  const el = h(`<div class="flow ${cls}">${html}</div>`);
  $('#screens').appendChild(el);
  return el;
}
export function closeOverlay(el) { if (!el) return; el.style.transition = 'opacity .2s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 200); }
const steps = (n, i) => `<div class="step-dots">${Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</div>`;

export function genreTags(g, max = 3) {
  return g.tags.slice(0, max).map((t) => `<span class="gtag" style="--gc:${GENRES[t].color}">${ic(GENRES[t].icon)}${GENRES[t].name}</span>`).join('');
}
export function trendRibbon(g) {
  const tr = G.game.trend(), ev = G.game.currentEvent();
  if (G.s.buffs.trend > 0) return `<span class="chip hot ribbon">${ic('flame')}Trend boost</span>`;
  if (ev.fx.genre && g.tags.includes(ev.fx.genre)) return `<span class="chip gold ribbon">${ic('calendar')}Event x${ev.fx.genreMult}</span>`;
  if (g.tags.includes(tr.hot)) return `<span class="chip hot ribbon">${ic('flame')}Trending</span>`;
  if (g.tags.includes(tr.rising)) return `<span class="chip info ribbon">${ic('trend')}Rising</span>`;
  return '';
}

export const Create = {
  // ---------------------------------------------------------------- HUB
  async hub() {
    const s = G.s;
    await G.game.run('hub', async () => {
      G.ui.hud.show(false);
      const sitting = G.world.sitAtDesk();
      G.world.shot('deskWide');
      const tired = s.needs.energy < 25, hungry = s.needs.hunger < 25;
      const lumoOn = hasFeature(s, 'lumo');
      const el = overlay(`<div class="picker glass">
        <div class="pick-head"><div class="grow"><h2 class="display">What are we making?</h2>${tired || hungry ? `<div class="row" style="margin-top:6px">${tired ? `<span class="chip bad">${ic('bolt')}Tired: lower quality</span>` : ''}${hungry ? `<span class="chip bad">${ic('food')}Hungry: lower quality</span>` : ''}</div>` : ''}</div><button class="xbtn" data-a="x">${ic('close')}</button></div>
        <div class="hub">
          <button class="hub-card video" data-a="video"><svg class="hi2"><use href="#i-film"/></svg><div class="hc-ic">${ic('film')}</div><h3>Record Video</h3><p>Play, edit &amp; upload to Vidora</p><div class="cost"><span class="chip">${ic('bolt')}-14</span><span class="chip">${ic('clock')}2h</span></div></button>
          <button class="hub-card stream" data-a="stream"><svg class="hi2"><use href="#i-live"/></svg><div class="hc-ic">${ic('live')}</div><h3>Go Live</h3><p>Stream on Pulse with live chat</p><div class="cost"><span class="chip">${ic('bolt')}-22</span><span class="chip">${ic('clock')}3h</span></div></button>
          <button class="hub-card post" data-a="post"><svg class="hi2"><use href="#i-blip"/></svg><div class="hc-ic">${ic('phone')}</div><h3>Post Social</h3><p>Blip${lumoOn ? ' &amp; Lumo' : ''} updates, clips, selfies</p><div class="cost"><span class="chip">${ic('bolt')}-3</span><span class="chip">${ic('clock')}15m</span></div></button>
        </div></div>`);
      G.tutorial?.onHub?.(el);
      const choice = await new Promise((res) => bind(el, { x: () => res(null), video: () => res('video'), stream: () => res('stream'), post: () => res('post') }));
      closeOverlay(el);
      this.sitting = sitting;
      if (choice === 'video') await this.video();
      else if (choice === 'stream') await G.stream.run();
      else if (choice === 'post') { this._post = true; await sitting; }
      else await sitting;
      if (!choice) { G.world.standUp(); G.world.shot('room'); }
    });
    if (this._post) { this._post = false; G.world.standUp(); G.world.shot('room'); G.social.open('blip'); }
  },

  // ---------------------------------------------------------------- GAME PICKER
  pickGame({ title = 'Pick a game', step = [4, 0], mode = 'video' } = {}) {
    const s = G.s;
    const owned = s.games.map(gameById).filter(Boolean);
    const cards = owned.map((g) => {
      const fat = s.gameUse[g.id] || 0;
      return `<button class="card click" data-a="g" data-id="${g.id}">
        <div class="thumb"><img src="${gameCover(g)}" alt="">${trendRibbon(g)}</div>
        <div class="ttl">${esc(g.name)}</div>
        <div class="meta">${genreTags(g)}</div>
        <div class="foot"><span class="row tiny muted">${ic('star')}Hype ${Math.round(g.appeal * 50)}</span>${fat > 0.35 ? `<span class="chip bad" style="padding:2px 8px">${ic('zzz')}Played out</span>` : (affinityFor(g)?.k > 0.4 ? `<span class="chip good" style="padding:2px 8px">${ic('heart')}Fans love</span>` : '')}</div></button>`;
    }).join('');
    const el = overlay(`<div class="picker glass">
      <div class="pick-head">${steps(...step)}<h2 class="display grow">${title}</h2><button class="btn ghost small" data-a="shop">${ic('cart')}More games</button><button class="xbtn" data-a="x">${ic('close')}</button></div>
      <div class="mb"><div class="grid">${cards}</div></div></div>`);
    return new Promise((res) => {
      bind(el, {
        x: () => { closeOverlay(el); res(null); },
        g: (b) => { closeOverlay(el); res(gameById(b.dataset.id)); },
        shop: () => { closeOverlay(el); res('shop'); },
      });
      G.tutorial?.onPicker?.('game', el);
    });
  },

  // ---------------------------------------------------------------- CONTENT PICKER
  pickContent(game) {
    const s = G.s;
    const deals = (s.deals.active || []).filter((d) => d.req === 'video');
    const cards = CONTENT.map((c) => {
      const locked = s.level < c.level;
      const pips = (v) => `<div class="stat-pips">${[0.8, 1.0, 1.2, 1.45, 1.7].map((t) => `<i class="${v >= t ? 'on' : ''}"></i>`).join('')}</div>`;
      return `<button class="card click ${locked ? 'locked' : ''}" data-a="${locked ? 'lock' : 'c'}" data-id="${c.id}">
        <div class="row"><div class="big-ic" style="color:${locked ? 'var(--dim)' : 'var(--pink2)'}">${ic(locked ? 'lock' : c.icon)}</div><div class="grow"><div class="ttl">${c.name}</div><div class="tiny muted" style="font-weight:600">${locked ? `Unlocks at Lv ${c.level}` : c.tip}</div></div></div>
        <div class="col" style="gap:4px;font-size:12px;font-weight:700;color:var(--muted)">
          <div class="row" style="justify-content:space-between">Views ${pips(c.views)}</div>
          <div class="row" style="justify-content:space-between">Subs ${pips(c.subs)}</div>
          <div class="row" style="justify-content:space-between">Pay ${pips(c.money)}</div></div>
        <div class="foot"><span class="chip">${ic('bolt')}-${c.energy}</span><span class="chip">${ic('clock')}${c.hours}h</span><span class="chip gold">+${Math.round(c.xp * (1 + 0.12 * (s.level - 1)))} XP</span></div></button>`;
    }).join('');
    const el = overlay(`<div class="picker glass">
      <div class="pick-head">${steps(4, 1)}<h2 class="display grow">Video type</h2><span class="chip">${ic('gamepad')}${esc(game.name)}</span><button class="xbtn" data-a="x">${ic('close')}</button></div>
      ${deals.length ? `<label class="chip good" style="align-self:flex-start;cursor:pointer;padding:8px 12px"><input type="checkbox" id="spon" checked style="accent-color:#9cf03a"> ${ic('handshake')} Feature sponsor: <b>${esc(deals[0].brand)}</b> (+${fmtMoney(deals[0].pay)})</label>` : ''}
      <div class="mb"><div class="grid">${cards}</div></div></div>`);
    return new Promise((res) => {
      bind(el, {
        x: () => { closeOverlay(el); res(null); },
        lock: (b) => { G.audio.sfx('error'); toast(`Reach level ${contentById(b.dataset.id).level} to unlock`, { icon: 'lock', color: 'var(--violet)' }); },
        c: async (b) => {
          const c = contentById(b.dataset.id);
          const spon = $('#spon', el)?.checked ? deals[0] : null;
          let partner = null;
          if (c.needsPartner) { partner = await this.pickPartner(); if (!partner) return; }
          closeOverlay(el); res({ content: c, sponsor: spon, partner });
        },
      });
      G.tutorial?.onPicker?.('content', el);
    });
  },
  pickPartner() {
    const s = G.s, fans = totalFans(s);
    const body = h(`<div class="grid">${CREATORS.map((c) => {
      const friend = (s.collabsUnlocked || []).includes(c.id);
      const ok = friend || fans >= c.fans * 0.25;
      return `<button class="card click ${ok ? '' : 'locked'}" data-a="${ok ? 'p' : 'n'}" data-id="${c.id}"><div class="row"><div class="big-ic" style="background:${c.color};border-radius:50%;overflow:hidden"><img src="${npcPortrait(c)}" style="width:130%;margin-top:10%"></div><div><div class="ttl">${c.name}</div><div class="tiny muted">${fmt(c.fans)} fans · ${c.niche}</div></div></div>
        <div class="foot">${ok ? `<span class="chip good">x${(1.3 + Math.min(1.5, c.fans / Math.max(1, fans)) * 0.4).toFixed(1)} reach</span><span class="chip ${friend ? 'good' : ''}">${friend ? `${ic('heart')}Friend · Free` : c.cost ? fmtMoney(c.cost) : 'Free'}</span>` : `<span class="chip">${ic('lock')}Need ${fmt(c.fans * 0.25)} fans or meet at a party</span>`}</div></button>`;
    }).join('')}</div>`);
    return new Promise((res) => {
      const m = modal({ title: 'Collab partner', icon: 'handshake', iconBg: 'var(--violet)', body, size: 'md', onClose: () => res(null) });
      bind(body, {
        n: () => G.audio.sfx('error'),
        p: (b) => {
          const c = CREATORS.find((x) => x.id === b.dataset.id);
          const friend = (s.collabsUnlocked || []).includes(c.id);
          if (c.cost && !friend && !G.game.spend(c.cost)) return;
          s.collabs[c.id] = (s.collabs[c.id] || 0) + 1;
          const mult = 1.3 + Math.min(1.5, c.fans / Math.max(1, fans)) * 0.4;
          res({ ...c, mult: mult * (G.game.currentEvent().fx.collabMult || 1) });
          m.close(true);
        },
      });
    });
  },

  // ---------------------------------------------------------------- VIDEO FLOW
  // Pick game & type -> the creator records (catch highlights) -> edits automatically -> thumbnail/title/tags
  // -> upload -> live premiere where views, likes, comments and subs roll in.
  async video() {
    const s = G.s, W = G.world;
    let game;
    while (true) {
      game = await this.pickGame({ title: 'Pick a game to record', step: [4, 0] });
      if (game === 'shop') { await G.shop.open('games', null, true); continue; }
      break;
    }
    if (!game) { await this.sitting; W.standUp(); W.shot('room'); return; }
    const pc = await this.pickContent(game);
    if (!pc) { await this.sitting; W.standUp(); W.shot('room'); return; }
    const { content, sponsor, partner } = pc;
    await this.sitting;
    s.needs.energy = clamp(s.needs.energy - content.energy * (1 - (setupStats(s).comfort * 0.04)), 0, 100);
    s.needs.hunger = clamp(s.needs.hunger - content.hunger, 0, 100);
    G.audio.sfx('power');
    W.screens.data.game = game;
    W.screens.setMode('main', 'record');
    W.screens.setMode('laptop', 'record');
    if (W.screens.surfaces.has('side')) W.screens.setMode('side', 'analytics');
    const rec = await this.record(game, content);
    const ed = await this.edit(game, content, rec);
    const pub = await this.publishStep(game, content, partner, rec, ed);
    await this.upload(pub);
    const ev = G.game.currentEvent();
    const tb = s.buffs.trend > 0;
    if (tb) G.game.useBuff('trend');
    const focus = G.game.useBuff('focus');
    const perf = clamp(rec.perf * 0.58 + ed.q * 0.42, 0, 1);
    const out = videoOutcome(s, {
      game, content, perf, thumb: pub.thumb, title: pub.title, hour: G.game.hour, trend: G.game.trend(), event: ev, tagMult: pub.tagMult,
      fatigue: s.gameUse[game.id] || 0, trendBoost: tb, partnerMult: hasFeature(s, 'partner') ? 1.4 : 1, collab: partner?.mult, focus, affinity: affinityFor(game),
    });
    if (partner) out.insights.unshift(['info', 'handshake', `Collab with ${partner.name}`]);
    if (sponsor) out.views = Math.round(out.views * 0.95);
    s.gameUse[game.id] = clamp((s.gameUse[game.id] || 0) + 0.24, 0, 1);
    G.game.advance(content.hours + ed.hours);
    await this.premiere(out, { game, content, pub, perf, sponsor, partner, rec, ed });
    W.screens.setMode('main', 'desktop'); W.screens.setMode('laptop', 'desktop');
    if (W.screens.surfaces.has('side')) W.screens.setMode('side', 'chat');
  },

  // ---------------------------------------------------------------- RECORDING (catch the highlights)
  record(game, content) {
    const W = G.world, s = G.s;
    G.ui.hud.show(false);
    W.shot('desk', { shift: isTouch || innerWidth < 900 ? -0.22 : -0.2 });
    W.char.play('sitGame');
    W.char.setExpression('focus');
    const stopType = G.audio.loop('typing');
    const dur = clamp(content.game.dur * 0.62, 7, 10);
    const el = overlay(`<div class="rec-card glass">
      <div class="vf-screen"><canvas width="640" height="360"></canvas>
        <div class="vf-hud"><div class="rec"><b></b>REC</div><div class="vf-timer">00:00</div></div>
        <div class="moments"></div></div>
      <div class="rec-foot">
        <div class="grow"><div class="rf-l"><span>${ic('film')} Recording <b>${esc(game.name)}</b></span><span class="rf-p">0%</span></div><div class="bar thin"><i style="width:0%"></i></div></div>
        <div class="grade-pill"><small>Quality</small><b class="qv">C</b></div>
        <button class="btn ghost small" data-a="skip">${ic('chevron')}Skip</button>
      </div>
      <div class="rf-hint">${ic('target')} Tap the highlights as they happen to capture them</div></div>`, 'record');
    const gc = $('canvas', el), gx = gc.getContext('2d');
    const mom = $('.moments', el);
    const barI = $('.bar i', el), pctEl = $('.rf-p', el), qv = $('.qv', el), timerEl = $('.vf-timer', el);
    const genre = game.tags[0];
    const KINDS = [
      { k: 'clutch', icon: 'star', label: 'CLUTCH!', c: '#ffd54a' },
      { k: 'epic', icon: 'flame', label: 'EPIC!', c: '#ff8a4c' },
      { k: 'funny', icon: 'laugh', label: 'LOL', c: '#c3b2ff' },
      ...(genre === 'horror' ? [{ k: 'scare', icon: 'ghost', label: 'JUMPSCARE', c: '#ff5470' }] : []),
      ...(game.tags.includes('challenge') ? [{ k: 'rage', icon: 'zap', label: 'SO CLOSE', c: '#ff5d6c' }] : []),
    ];
    const skillK = (s.skills?.gaming || 0) * 0.025;
    let clock = 0, spawned = 0, caught = 0, nextSpawn = 0.8, done = false;
    const quality = () => clamp(0.5 + skillK + 0.42 * (spawned ? caught / spawned : 0.6) * Math.min(1, spawned / 3 + 0.2), 0.3, 1);
    const react = (good) => {
      if (good) { W.screens.data.fx.hit = 1; W.char.play(Math.random() < 0.5 ? 'sitWin' : 'sitIntense', { restart: true }); W.char.setExpression('happy', 1.2); setTimeout(() => !done && W.char.play('sitGame'), 750); }
    };
    const spawn = () => {
      const K = pick(KINDS);
      spawned++;
      const x = 12 + Math.random() * 64, y = 14 + Math.random() * 56;
      const b = h(`<button class="moment" style="left:${x}%;top:${y}%;--mc:${K.c}" data-silent="1"><i class="ring"></i>${ic(K.icon)}<span>${K.label}</span></button>`);
      mom.appendChild(b);
      let hit = false;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (hit) return; hit = true; caught++;
        b.classList.add('got');
        G.audio.sfx('perfect'); react(true); bus.emit('q', { evt: 'perfect', n: 1 });
        setTimeout(() => b.remove(), 350);
      });
      setTimeout(() => { if (!hit) { b.classList.add('miss'); setTimeout(() => b.remove(), 300); } }, 1700);
      if (window.__autoplay) setTimeout(() => b.dispatchEvent(new Event('pointerdown')), 500);
    };
    G.tutorial?.onRecord?.(el);
    return new Promise((res) => {
      const finish = () => {
        if (done) return; done = true;
        stopType();
        const q = quality();
        const wrapT = h(`<div class="wrap-t">${q > 0.85 ? 'INSANE TAKE!' : q > 0.65 ? "THAT'S A WRAP!" : 'WRAPPED'}</div>`);
        $('.vf-screen', el).appendChild(wrapT);
        G.audio.sfx(q > 0.65 ? 'reward' : 'pop');
        W.char.play(q > 0.65 ? 'sitWin' : 'sit', { restart: true });
        W.char.setExpression(q > 0.65 ? 'happy' : 'neutral', 2);
        if (s.skills) s.skills.gamingXp = (s.skills.gamingXp || 0) + 1;
        setTimeout(() => { closeOverlay(el); res({ perf: q, caught, spawned }); }, 1000);
      };
      bind(el, { skip: () => { while (clock < dur && spawned < Math.ceil(dur / 1.5)) spawned++; clock = dur; } });
      let last = performance.now();
      const frame = (now) => {
        if (done) return;
        const dt = Math.min(0.6, (now - last) / 1000); last = now;
        clock += dt;
        if (clock >= nextSpawn && clock < dur - 1.2) { spawn(); nextSpawn = clock + 1.05 + Math.random() * 0.8; }
        drawGame(gx, 640, 360, W.screens.t, game, W.screens.data.fx);
        const k = clamp(clock / dur, 0, 1);
        barI.style.width = k * 100 + '%'; pctEl.textContent = Math.round(k * 100) + '%';
        const sec = Math.floor(clock * 60 * content.hours / dur * 2);
        timerEl.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
        const g = gradeOf(quality()); if (qv.textContent !== g) { qv.textContent = g; qv.parentElement.dataset.g = g; }
        if (clock >= dur) finish(); else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  },

  // ---------------------------------------------------------------- EDITING (automatic, pick the effort)
  async edit(game, content, rec) {
    const W = G.world, s = G.s;
    const team = !!s.team?.editor;
    const skill = s.skills?.editing || 0;
    const pcK = s.gear.pc * 0.015;
    const OPTS = [
      { id: 'quick', name: 'Quick Cut', icon: 'scissors', hours: 1, energy: 3, q: 0.56, dur: 2.6, desc: 'Trim & export', steps: ['Cutting the best moments', 'Exporting'] },
      { id: 'clean', name: 'Clean Edit', icon: 'film', hours: 2, energy: 7, q: 0.76, dur: 3.6, desc: 'Music, captions, punchy cuts', steps: ['Cutting the best moments', 'Music & sound effects', 'Captions & zooms', 'Exporting'] },
      { id: 'pro', name: 'Pro Edit', icon: 'sparkle', hours: 4, energy: 12, q: 0.92, dur: 4.6, desc: 'Effects, color grade, sound design', steps: ['Cutting the best moments', 'Music & sound design', 'Motion graphics', 'Color grade', 'Exporting 4K'], level: 3 },
    ];
    if (team) OPTS.push({ id: 'team', name: 'Your Editor', icon: 'users', hours: 0, energy: 0, q: 0.95, dur: 2.2, desc: 'Hand it off — pro quality', steps: ['Editor is on it', 'Exporting'] });
    W.shot('deskWide');
    W.char.play('sitEdit'); W.char.setExpression('neutral');
    const el = overlay(`<div class="picker glass edit-pick">
      <div class="pick-head">${steps(4, 2)}<h2 class="display grow">How should we edit it?</h2></div>
      <div class="edit-opts">${OPTS.map((o) => {
        const locked = o.level && s.level < o.level && skill < 1;
        const q = clamp(o.q + skill * 0.03 + pcK, 0, 1);
        return `<button class="card click edit-opt ${locked ? 'locked' : ''}" data-a="${locked ? 'lock' : 'pick'}" data-id="${o.id}">
          <div class="eo-ic">${ic(locked ? 'lock' : o.icon)}</div><div class="ttl">${o.name}</div><div class="tiny muted">${locked ? `Level ${o.level} or Editing skill` : o.desc}</div>
          <div class="eo-q"><span>Quality</span><div class="bar thin"><i style="width:${q * 100}%"></i></div><b>${gradeOf(q)}</b></div>
          <div class="foot"><span class="chip">${ic('clock')}${o.hours ? o.hours + 'h' : 'Instant'}</span>${o.energy ? `<span class="chip">${ic('bolt')}-${o.energy}</span>` : ''}</div></button>`;
      }).join('')}</div></div>`);
    const tutDefault = G.tutorial?.active && s.stats.videos === 0;
    if (tutDefault) $('[data-id=clean]', el)?.classList.add('hl');
    const opt = await new Promise((res) => bind(el, {
      pick: (b) => res(OPTS.find((o) => o.id === b.dataset.id)),
      lock: () => { G.audio.sfx('error'); toast('Reach level 3 or train Editing to unlock Pro edits', { icon: 'lock', color: 'var(--violet)' }); },
    }));
    closeOverlay(el);
    s.needs.energy = clamp(s.needs.energy - opt.energy, 0, 100);
    const q = clamp(opt.q + skill * 0.03 + pcK + (rec.perf - 0.7) * 0.1, 0.3, 1);
    // auto edit: the character works, the timeline cuts itself
    W.screens.setMode('main', 'edit'); W.screens.setMode('laptop', 'edit');
    W.shot('desk', { shift: innerWidth < 900 ? -0.22 : -0.2 });
    W.char.play('sitEdit'); W.char.setExpression('focus');
    const segs = Array.from({ length: 12 }, () => ({ kind: Math.random() < 0.5 ? 'good' : Math.random() < 0.7 ? 'meh' : 'bad', cut: false, w: 0.7 + Math.random() * 0.8 }));
    W.screens.data.edit = { segments: segs };
    const stopT = G.audio.loop('typing');
    const prog = overlay(`<div class="edit-prog glass">
      <div class="row"><div class="ep-ic">${ic(opt.icon)}</div><div class="grow"><div class="display" style="font-size:20px">${opt.name}</div><div class="tiny muted ep-step" style="font-weight:600">${opt.steps[0]}…</div></div><b class="display ep-pct">0%</b></div>
      <div class="ep-tl">${segs.map((sg) => `<i class="${sg.kind}" style="flex:${sg.w}"></i>`).join('')}<b class="ph"></b></div>
      <div class="ep-steps">${opt.steps.map((t, i) => `<span data-i="${i}">${ic('check')}${t}</span>`).join('')}</div></div>`, 'edit');
    const tl = $$('.ep-tl i', prog), ph = $('.ep-tl .ph', prog), pct = $('.ep-pct', prog), stepEl = $('.ep-step', prog);
    const t0 = performance.now(), D = opt.dur * 1000;
    await new Promise((r) => {
      const f = (t) => {
        const k = clamp((t - t0) / D, 0, 1);
        pct.textContent = Math.round(k * 100) + '%';
        ph.style.left = k * 100 + '%';
        const si = Math.min(opt.steps.length - 1, Math.floor(k * opt.steps.length));
        stepEl.textContent = opt.steps[si] + '…';
        $$('.ep-steps span', prog).forEach((x, i) => { x.classList.toggle('done', i < si || k >= 1); x.classList.toggle('on', i === si && k < 1); });
        segs.forEach((sg, i) => { if (!sg.cut && sg.kind !== 'good' && (i + 1) / segs.length < k * 1.15) { sg.cut = true; tl[i].classList.add('cut'); if (Math.random() < 0.5) G.audio.sfx('cut'); } });
        if (Math.random() < 0.02) W.char.play('sitEdit', { restart: true });
        if (k < 1) requestAnimationFrame(f); else r();
      };
      requestAnimationFrame(f);
    });
    stopT();
    G.audio.sfx('reward');
    await sleep(350);
    closeOverlay(prog);
    if (s.skills) s.skills.editingXp = (s.skills.editingXp || 0) + 1;
    return { q, hours: opt.hours, style: opt.id };
  },

  // ---------------------------------------------------------------- THUMBNAIL, TITLE & TAGS
  publishStep(game, content, partner, rec, ed) {
    const s = G.s, W = G.world;
    W.char.play('sitType'); W.char.setExpression('neutral');
    const stopT = G.audio.loop('typing');
    const styles = THUMBS.filter((t) => !t.pack || s.cosmetics.includes('thumb_pack'));
    const n = s.stats.videos + 1;
    const titles = makeTitles(game, content, n);
    if (partner) titles.forEach((t) => (t.text = t.text + ` ft. ${partner.name}`));
    let ti = 1, si = 0;
    const tr = G.game.trend(), trending = game.tags.includes(tr.hot) || s.buffs.trend > 0;
    if (trending) ti = 2;
    const tags = makeTags(game, content, tr);
    const sel = new Set(tags.filter((t) => t.def).map((t) => t.id));
    const grade = gradeOf(clamp(rec.perf * 0.58 + ed.q * 0.42, 0, 1));
    const el = overlay(`<div class="picker glass pub">
      <div class="pick-head">${steps(4, 3)}<h2 class="display grow">Ready to publish</h2><span class="grade-pill" data-g="${grade}"><small>Video</small><b>${grade}</b></span></div>
      <div class="mb pub-grid">
        <div class="col" style="gap:10px"><div class="pl">Thumbnail</div><div class="thumbs"></div></div>
        <div class="col" style="gap:10px">
          <div class="pl">Title</div>
          <div class="col" style="gap:8px">${titles.map((t, i) => `<button class="title-opt ${i === ti ? 'sel' : ''}" data-a="t" data-i="${i}"><span class="tt">${esc(t.text)}</span>
            <span class="chip ${t.id === 'hype' ? 'hot' : t.id === 'honest' ? 'good' : 'info'}">${ic(t.id === 'hype' ? 'eye' : t.id === 'honest' ? 'heart' : 'flame')}${t.label}</span></button>`).join('')}</div>
          <div class="pl">Tags <span class="muted">· pick up to 3</span></div>
          <div class="tags">${tags.map((t) => `<button class="tagb ${sel.has(t.id) ? 'on' : ''} ${t.hot ? 'hot' : ''}" data-a="tag" data-id="${t.id}">${t.hot ? ic('flame') : '#'}${esc(t.label)}</button>`).join('')}</div>
        </div>
      </div>
      <div class="row pub-foot"><span class="tiny muted grow" style="font-weight:600">${trending ? `${ic('flame')} Trending game — Trendy titles and hot tags get a boost` : `${ic('info')} Clickbait = more clicks · Honest = more subs`}</span><button class="btn primary big" data-a="pub">${ic('upload')}Publish</button></div></div>`);
    const box = $('.thumbs', el);
    styles.forEach((st, i) => {
      const card = h(`<button class="card click thumb-card ${i === si ? 'sel' : ''}" data-a="th" data-i="${i}"><div class="row" style="justify-content:space-between"><b style="font-size:13px">${st.name}</b><span class="chip ${st.ctr > 1.15 ? 'hot' : st.trust > 1.1 ? 'good' : 'info'}" style="padding:2px 8px">${st.ctr > 1.15 ? 'Clicky' : st.trust > 1.1 ? 'Trusty' : 'Balanced'}</span></div></button>`);
      card.insertBefore(makeThumb(st.id, game, titles[ti].text), card.firstChild);
      box.appendChild(card);
    });
    G.tutorial?.onPicker?.('publish', el);
    return new Promise((res) => {
      bind(el, {
        th: (b) => { si = +b.dataset.i; $$('[data-a=th]', el).forEach((x, i) => x.classList.toggle('sel', i === si)); },
        t: (b) => { ti = +b.dataset.i; $$('[data-a=t]', el).forEach((x, i) => x.classList.toggle('sel', i === ti)); },
        tag: (b) => {
          const id = b.dataset.id;
          if (sel.has(id)) sel.delete(id); else if (sel.size < 3) sel.add(id); else { G.audio.sfx('error'); return; }
          $$('[data-a=tag]', el).forEach((x) => x.classList.toggle('on', sel.has(x.dataset.id)));
        },
        pub: () => {
          stopT(); closeOverlay(el);
          const chosen = tags.filter((t) => sel.has(t.id));
          const tagMult = 1 + Math.min(0.24, chosen.reduce((a, t) => a + t.v, 0));
          res({ thumb: styles[si], title: titles[ti], canvas: makeThumb(styles[si].id, game, titles[ti].text), tags: chosen.map((t) => t.label), tagMult, grade });
        },
      });
    });
  },

  async upload(pub) {
    const W = G.world, s = G.s;
    W.screens.setMode('main', 'upload'); W.screens.setMode('laptop', 'upload');
    W.char.play('sitEdit');
    W.shot('desk');
    const dur = [2.4, 1.9, 1.3, 0.9][s.gear.net] * 1000;
    const el = overlay(`<div class="glass" style="margin:auto auto 120px;width:min(420px,90vw);border-radius:22px;padding:16px 18px;animation:modalIn .3s">
      <div class="row"><div class="mi" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--vid)">${ic('upload')}</div><div class="grow"><div class="display" style="font-size:18px">Uploading to Vidora</div><div class="tiny muted" style="font-weight:600">${esc(pub.title.text)}</div></div><b class="display pct">0%</b></div>
      <div class="bar" style="margin-top:12px;height:12px;--c1:var(--vid);--c2:#ff9a9d"><i style="width:0%"></i></div></div>`);
    const bar = $('.bar i', el), pct = $('.pct', el);
    const t0 = performance.now();
    await new Promise((r) => {
      const f = (t) => {
        const k = clamp((t - t0) / dur, 0, 1);
        const e = k < 0.8 ? k * 0.9 / 0.8 : 0.9 + (k - 0.8) * 0.5;
        bar.style.width = e * 100 + '%'; pct.textContent = Math.round(e * 100) + '%';
        W.screens.data.progress = e;
        if (k < 1) requestAnimationFrame(f); else r();
      };
      requestAnimationFrame(f);
    });
    bar.style.width = '100%'; pct.textContent = '100%';
    G.audio.sfx('notify');
    await sleep(250);
    closeOverlay(el);
  },


  // ---------------------------------------------------------------- PREMIERE (live results time-lapse)
  async premiere(out, ctx) {
    const s = G.s, W = G.world;
    const { game, content, pub, sponsor, partner, ed } = ctx;
    W.screens.setMode('main', 'results'); W.screens.setMode('laptop', 'results');
    W.screens.data.views = 0;
    W.shot('deskWide');
    W.char.play('sitTalk', { restart: true });
    W.char.setExpression('happy', 3);
    // persistent live record — the premiere shows its first hours, then it keeps growing in the background
    const vid = makeVideo(s, {
      id: uid(), title: pub.title.text, game: game.id, type: content.id, thumb: smallJpeg(pub.canvas), tags: pub.tags,
      perf: Math.round(ctx.perf * 100), grade: pub.grade, out,
    });
    s.videos.unshift(vid);
    if (s.videos.length > 40) s.videos.length = 40;
    s.videos.forEach((v, i) => { if (i > 10) v.thumb = null; });
    const spPay = sponsor ? sponsor.pay : 0;
    const el = overlay(`<div class="premiere glass">
      <div class="pm-left">
        <div class="pm-thumb"></div>
        <div class="pm-title">${esc(pub.title.text)}</div>
        <div class="row pm-meta"><span class="grade-pill" data-g="${pub.grade}"><small>Grade</small><b>${pub.grade}</b></span>${genreTags(game, 2)}<span class="chip">${ic(content.icon)}${content.name}</span></div>
        <div class="pm-tags">${pub.tags.map((t) => `<span>#${esc(t)}</span>`).join('')}</div>
        <div class="insights"></div>
      </div>
      <div class="pm-right">
        <div class="row pm-head"><span class="live-dot"></span><b>PREMIERE</b><span class="muted">· Vidora Studio</span><span class="grow"></span><span class="pm-clock">0:00</span></div>
        <div class="pm-big"><span class="pm-views">0</span><small>views</small></div>
        <canvas class="pm-chart" width="560" height="150"></canvas>
        <div class="pm-stats">
          <div><small>${ic('users')}Subscribers</small><b data-k="subs">+0</b></div>
          <div><small>${ic('dollar')}Revenue</small><b data-k="money">$0</b></div>
          <div><small>${ic('thumb')}Likes</small><b data-k="likes">0</b></div>
          <div><small>${ic('message')}Comments</small><b data-k="comments">0</b></div>
        </div>
        <div class="ld-bar"><i class="l"></i><i class="d"></i></div>
        <div class="pm-comments"></div>
        <div class="row" style="justify-content:flex-end;gap:10px;margin-top:10px">
          ${spPay ? `<span class="chip good grow" style="justify-content:flex-start">${ic('handshake')}${esc(sponsor.brand)} +${fmtMoney(spPay)}</span>` : ''}
          <button class="btn ghost small" data-a="ff">${ic('chevron')}Skip</button><button class="btn go big" data-a="ok" disabled>${ic('check')}Continue</button></div>
      </div></div>`);
    const tc = pub.canvas; tc.style.width = '100%';
    $('.pm-thumb', el).appendChild(tc);
    G.audio.sfx('whoosh');
    const viewsEl = $('.pm-views', el), clockEl = $('.pm-clock', el);
    const statEl = (k) => $(`[data-k=${k}]`, el);
    const chart = $('.pm-chart', el), cx = chart.getContext('2d');
    const comBox = $('.pm-comments', el), ldL = $('.ld-bar .l', el), ldD = $('.ld-bar .d', el);
    const pts = [[0, 0]];
    let ff = false, fanBank = 0;
    const tot = { subs: 0, money: 0, likes: 0, dislikes: 0, comments: 0 };
    const drawChart = () => {
      const w = chart.width, hh = chart.height;
      cx.clearRect(0, 0, w, hh);
      cx.strokeStyle = 'rgba(255,255,255,0.07)'; cx.lineWidth = 1;
      for (let i = 1; i < 4; i++) { cx.beginPath(); cx.moveTo(0, (hh / 4) * i); cx.lineTo(w, (hh / 4) * i); cx.stroke(); }
      if (pts.length < 2) return;
      const mx = Math.max(10, out.views * 0.5, ...pts.map((p) => p[1]));
      const X = (t) => (t / PREMIERE_MIN) * (w - 8) + 4, Y = (v) => hh - 6 - (v / mx) * (hh - 16);
      const g = cx.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, 'rgba(255,90,95,0.42)'); g.addColorStop(1, 'rgba(255,90,95,0)');
      cx.fillStyle = g; cx.beginPath(); cx.moveTo(X(pts[0][0]), hh); pts.forEach((p) => cx.lineTo(X(p[0]), Y(p[1]))); cx.lineTo(X(pts[pts.length - 1][0]), hh); cx.fill();
      cx.strokeStyle = '#ff5a5f'; cx.lineWidth = 3; cx.lineJoin = 'round'; cx.beginPath(); pts.forEach((p, i) => (i ? cx.lineTo(X(p[0]), Y(p[1])) : cx.moveTo(X(p[0]), Y(p[1])))); cx.stroke();
      const lp = pts[pts.length - 1]; cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(X(lp[0]), Y(lp[1]), 4.5, 0, 7); cx.fill();
    };
    const addComment = () => {
      const c = makeComment({ quality: ctx.perf, trust: pub.thumb.trust * pub.title.trust, game: game.name, name: s.profile.name, views: vid.views, type: content.id, edit: ed.style });
      const row = h(`<div class="cm ${c.neg ? 'neg' : ''}"><i style="background:${USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]}">${c.user[0].toUpperCase()}</i><div><b>@${esc(c.user)}</b><span>${emotify(esc(c.text))}</span></div></div>`);
      comBox.prepend(row);
      while (comBox.children.length > 4) comBox.lastElementChild.remove();
    };
    G.tutorial?.onResults?.(el);
    bind(el, { ff: () => { ff = true; }, ok: () => {} });
    // time-lapse: 3 in-game hours over ~7 seconds
    const D = 7000;
    let tLast = 0, comT = 0, wasViral = false;
    await new Promise((r) => {
      const t0 = performance.now();
      const f = (now) => {
        const k = ff ? 1 : clamp((now - t0) / D, 0, 1);
        const tm = k * PREMIERE_MIN;
        const d = step(vid, vid.t0 + tm);
        if (d) {
          for (const key of Object.keys(tot)) tot[key] += d[key];
          fanBank += d.subs;
          if (d.money) G.game.addMoney(d.money);
        }
        if (tm - tLast > 4 || k >= 1) { pts.push([tm, vid.views]); tLast = tm; drawChart(); }
        viewsEl.textContent = fmtInt(vid.views);
        W.screens.data.views = vid.views;
        clockEl.textContent = `${Math.floor(tm / 60)}:${String(Math.floor(tm % 60)).padStart(2, '0')}h`;
        statEl('subs').textContent = '+' + fmt(tot.subs);
        statEl('money').textContent = fmtMoney(tot.money + (spPay && k >= 1 ? spPay : 0));
        statEl('likes').textContent = fmt(tot.likes);
        statEl('comments').textContent = fmt(tot.comments);
        const lt = Math.max(1, tot.likes + tot.dislikes);
        ldL.style.width = (tot.likes / lt) * 100 + '%'; ldD.style.width = (tot.dislikes / lt) * 100 + '%';
        comT -= 1;
        if (comT <= 0 && tot.comments > 0 && !ff) { addComment(); comT = 26 + Math.random() * 30; if (Math.random() < 0.4) G.audio.sfx('chat', 2); }
        if (out.viral && !wasViral && k > 0.45) {
          wasViral = true;
          const vb = h('<div class="viral-burst"><div class="vb">VIRAL!</div></div>');
          $('#fx').appendChild(vb); setTimeout(() => vb.remove(), 1900);
          G.audio.sfx('viral'); W.addShake(1); flash(); G.sdk?.happy();
          W.vfx.confetti(W.room.st.monitor.clone(), 160, 3);
          W.char.play('sitWin', { restart: true });
        }
        if (k < 1) requestAnimationFrame(f); else r();
      };
      requestAnimationFrame(f);
    });
    // close the gap so the background accrual continues seamlessly from here
    vid.t0 -= PREMIERE_MIN;
    if (!comBox.children.length) addComment();
    // insights reveal
    const box = $('.insights', el);
    for (const [k, i2, txt] of out.insights) { box.appendChild(h(`<span class="chip ${k}">${ic(i2)}${txt}</span>`)); }
    G.audio.sfx('pop');
    const great = ctx.perf > 0.8 || out.viral;
    W.char.play(great ? 'sitWin' : ctx.perf > 0.5 ? 'sitTalk' : 'sitFail', { restart: true });
    W.char.setExpression(great ? 'happy' : ctx.perf > 0.5 ? 'happy' : 'sad', 3);
    if (great && !out.viral) { G.audio.sfx('reward'); W.vfx.confetti(W.room.st.monitor.clone(), 70, 2.2); }
    $('.pm-head .live-dot', el).classList.add('off');
    $('.pm-head b', el).textContent = 'LIVE ON VIDORA';
    statEl('money').textContent = fmtMoney(tot.money + spPay);
    const okBtn = $('[data-a=ok]', el);
    okBtn.disabled = false; okBtn.classList.add('shine');
    $('[data-a=ff]', el).remove();
    G.tutorial?.onResults?.(el);
    await new Promise((r) => bind(el, { ok: r }));
    const from = okBtn.getBoundingClientRect();
    const fp = { x: from.left + from.width / 2, y: from.top };
    if (fanBank > 0) G.game.addFans('vid', fanBank, fp);
    if (spPay) G.game.addMoney(spPay, fp);
    G.game.addXP(out.xp, fp);
    G.game.useBuff('xp2'); G.game.useBuff('wellfed');
    if (s.fans.blip > 0 || out.viral) G.game.addFans('blip', Math.round(out.subs * 0.08), null, true);
    s.stats.videos++; s.stats.views += vid.views; s.stats.likes += tot.likes;
    if (!s.stats.best || vid.V > s.stats.best.views) s.stats.best = { views: vid.V, title: pub.title.text };
    if (sponsor) G.meta.completeDeal(sponsor);
    if (out.viral) s.clips++;
    bus.emit('q', { evt: 'video', n: 1, tags: game.tags });
    if (game.tags.includes(G.game.trend().hot) || out.insights.some((i) => i[2] === 'Trending topic')) bus.emit('q', { evt: 'trendvid', n: 1 });
    if (ctx.perf >= 0.9 || out.viral) bus.emit('q', { evt: 'great', n: 1 });
    bus.emit('video:done', { out, viral: out.viral, vid });
    G.audio.sfx('cash');
    closeOverlay(el);
    W.char.play('sit'); W.char.setExpression('happy', 1.5);
    await sleep(500);
    W.standUp(); W.shot('room');
    G.meta.maybeTeaser(out.viral || great);
  },
};

// Tag suggestions for the publish step. Relevant tags help discovery; the trending tag only helps if it fits.
function makeTags(game, content, tr) {
  const out = [{ id: 'game', label: game.name.replace(/[^A-Za-z0-9]/g, ''), v: 0.06, def: true }];
  for (const t of game.tags) out.push({ id: 'g_' + t, label: GENRES[t].name, v: t === tr.hot ? 0.12 : t === tr.rising ? 0.08 : 0.05, hot: t === tr.hot });
  out.push({ id: 'type', label: content.name.replace(/[^A-Za-z0-9]/g, ''), v: 0.04 });
  if (!game.tags.includes(tr.hot)) out.push({ id: 'hot', label: GENRES[tr.hot].name, v: -0.04, hot: true });
  out.push({ id: 'gaming', label: 'Gaming', v: 0.02 });
  out.push({ id: 'viral', label: 'GoViral', v: -0.03 });
  return out;
}
