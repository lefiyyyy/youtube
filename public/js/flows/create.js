// Create hub, game/content pickers and the full video production flow.
import { G } from '../game/ctx.js';
import { bus } from '../core/bus.js';
import { $, $$, h, bind, ic, esc, modal, toast, fly, countUp, floatText, flash } from '../ui/ui.js';
import { GAMES, GENRES, gameById } from '../data/games.js';
import { CONTENT, THUMBS, makeTitles, contentById } from '../data/content.js';
import { CREATORS } from '../data/sponsors.js';
import { gameCover, drawGame } from '../world/screens.js';
import { videoOutcome, setupStats, totalFans } from '../game/economy.js';
import { hasFeature } from '../data/progression.js';
import { makeThumb, smallJpeg } from './thumbs.js';
import { fmt, fmtMoney, clamp, sleep, pick, uid, isTouch } from '../core/util.js';

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
        <div class="foot"><span class="row tiny muted">${ic('star')}Hype ${Math.round(g.appeal * 50)}</span>${fat > 0.35 ? `<span class="chip bad" style="padding:2px 8px">${ic('zzz')}Played out</span>` : ''}</div></button>`;
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
      const ok = fans >= c.fans * 0.25;
      return `<button class="card click ${ok ? '' : 'locked'}" data-a="${ok ? 'p' : 'n'}" data-id="${c.id}"><div class="row"><div class="big-ic" style="background:${c.color};color:#111;border-radius:50%">${ic('user')}</div><div><div class="ttl">${c.name}</div><div class="tiny muted">${fmt(c.fans)} fans · ${c.niche}</div></div></div>
        <div class="foot">${ok ? `<span class="chip good">x${(1.3 + Math.min(1.5, c.fans / Math.max(1, fans)) * 0.4).toFixed(1)} reach</span><span class="chip">${c.cost ? fmtMoney(c.cost) : 'Free'}</span>` : `<span class="chip">${ic('lock')}Need ${fmt(c.fans * 0.25)} fans</span>`}</div></button>`;
    }).join('')}</div>`);
    return new Promise((res) => {
      const m = modal({ title: 'Collab partner', icon: 'handshake', iconBg: 'var(--violet)', body, size: 'md', onClose: () => res(null) });
      bind(body, {
        n: () => G.audio.sfx('error'),
        p: (b) => {
          const c = CREATORS.find((x) => x.id === b.dataset.id);
          if (c.cost && !G.game.spend(c.cost)) return;
          s.collabs[c.id] = (s.collabs[c.id] || 0) + 1;
          const mult = 1.3 + Math.min(1.5, c.fans / Math.max(1, fans)) * 0.4;
          res({ ...c, mult: mult * (G.game.currentEvent().fx.collabMult || 1) });
          m.close(true);
        },
      });
    });
  },

  // ---------------------------------------------------------------- VIDEO FLOW
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
    // costs
    s.needs.energy = clamp(s.needs.energy - content.energy * (1 - (setupStats(s).comfort * 0.04)), 0, 100);
    s.needs.hunger = clamp(s.needs.hunger - content.hunger, 0, 100);
    // record
    G.audio.sfx('power');
    W.screens.data.game = game;
    W.screens.setMode('main', 'record');
    W.screens.setMode('laptop', 'record');
    if (W.screens.surfaces.has('side')) W.screens.setMode('side', 'analytics');
    const rec = await this.recordGame(game, content);
    // edit
    const ed = await this.editGame(game, content);
    // publish choices
    const pub = await this.publishStep(game, content, partner);
    // upload
    await this.upload(pub);
    // outcome
    const ev = G.game.currentEvent();
    const tb = s.buffs.trend > 0;
    if (tb) G.game.useBuff('trend');
    const focus = G.game.useBuff('focus');
    const perf = clamp(rec.perf * 0.62 + ed.perf * 0.38, 0, 1);
    const out = videoOutcome(s, {
      game, content, perf, thumb: pub.thumb, title: pub.title, hour: G.game.hour, trend: G.game.trend(), event: ev,
      fatigue: s.gameUse[game.id] || 0, trendBoost: tb, partnerMult: hasFeature(s, 'partner') ? 1.4 : 1, collab: partner?.mult, focus,
    });
    if (partner) out.insights.unshift(['info', 'handshake', `Collab with ${partner.name}`]);
    if (sponsor) out.views = Math.round(out.views * 0.95);
    s.gameUse[game.id] = clamp((s.gameUse[game.id] || 0) + 0.24, 0, 1);
    G.game.advance(content.hours);
    await this.results(out, { game, content, pub, perf, sponsor, partner, rec });
    W.screens.setMode('main', 'desktop'); W.screens.setMode('laptop', 'desktop');
    if (W.screens.surfaces.has('side')) W.screens.setMode('side', 'chat');
  },

  // ---------------------------------------------------------------- RECORD MINIGAME
  recordGame(game, content) {
    const W = G.world, cfg = content.game;
    G.ui.hud.show(false);
    W.shot('desk', { shift: isTouch || innerWidth < 900 ? -0.22 : -0.2 });
    W.char.play('sitGame');
    W.char.setExpression('focus');
    const stopType = G.audio.loop('typing');
    const el = overlay(`<div class="viewfinder glass">
      <div class="vf-screen"><canvas width="640" height="360"></canvas><div class="vf-hud"><div class="rec"><b></b>REC</div><div class="vf-timer">0:00</div><div class="combo"></div></div></div>
      <div class="lane"><canvas></canvas></div>
      <div class="mg-help"><span>${ic('target')} Tap when moments hit the ring</span><span class="row">${isTouch ? '' : '<kbd>SPACE</kbd>'}<span class="score-ring">${ic('star')}<span class="sc">0</span></span></span></div></div>`, 'record');
    const gc = $('.vf-screen canvas', el), gx = gc.getContext('2d');
    const lane = $('.lane', el), lc = $('canvas', lane), lx = lc.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { lc.width = lane.clientWidth * dpr; lc.height = lane.clientHeight * dpr; };
    size();
    // schedule
    const dur = cfg.dur, notes = [];
    let t = 1.4;
    while (t < dur - 0.9) {
      const r = Math.random();
      const kind = r < cfg.gold ? 'gold' : r < cfg.gold + cfg.red ? 'red' : 'norm';
      const hold = cfg.holds && kind === 'norm' && Math.random() < 0.22 ? 0.45 + Math.random() * 0.4 : 0;
      notes.push({ t, kind, hold, state: 0 });
      t += (0.55 + Math.random() * 0.75) / cfg.density + hold;
    }
    const speed = 300 * cfg.speed; // px per sec (css px)
    const zoneX = () => lane.clientWidth * 0.16;
    let clock = -0.6, combo = 0, best = 0, score = 0, maxScore = 0, perfects = 0, hits = 0, misses = 0, holding = null, fails = 0;
    for (const n of notes) maxScore += n.kind === 'gold' ? 2 : n.kind === 'red' ? (cfg.blooper ? 0.8 : 0.3) : 1 + (n.hold ? 0.5 : 0);
    const judgeEl = (txt, col) => { const j = h(`<div class="judge" style="color:${col}">${txt}</div>`); lane.appendChild(j); setTimeout(() => j.remove(), 700); };
    const comboEl = $('.combo', el), scEl = $('.sc', el), timerEl = $('.vf-timer', el);
    const react = (good) => {
      if (good) { W.screens.data.fx.hit = 1; if (Math.random() < 0.35) { W.char.play('sitWin', { restart: true }); W.char.setExpression('happy', 1.2); setTimeout(() => W.char.clip === 'sitWin' && W.char.play('sitGame'), 700); } }
      else { W.screens.data.fx.fail = 1; W.char.play('sitFail', { restart: true }); W.char.setExpression('sad', 1); setTimeout(() => W.char.clip === 'sitFail' && W.char.play('sitGame'), 700); }
    };
    const press = () => {
      if (clock < 0) return;
      let target = null, bestD = 1e9;
      for (const n of notes) { if (n.state) continue; const d = Math.abs(n.t - clock); if (d < bestD) { bestD = d; target = n; } }
      if (!target || bestD > 0.22) { combo = 0; G.audio.sfx('mouse'); return; }
      const pts = target.kind === 'gold' ? 2 : 1;
      if (target.kind === 'red') {
        target.state = 2;
        if (cfg.blooper) { score += 0.8; hits++; combo++; judgeEl('BLOOPER!', '#c3b2ff'); G.audio.sfx('blooper'); W.char.play('sitLaugh', { restart: true }); W.char.setExpression('laugh', 1); setTimeout(() => W.char.play('sitGame'), 800); }
        else { score -= 0.6; fails++; combo = 0; judgeEl('OOPS', '#ff8f99'); G.audio.sfx('miss'); react(false); G.world.addShake(0.4); }
        return;
      }
      if (bestD < 0.075) { target.state = 1; score += pts; perfects++; hits++; combo++; judgeEl(target.kind === 'gold' ? 'CLUTCH!' : 'PERFECT', target.kind === 'gold' ? '#ffd54a' : '#b6ff5c'); G.audio.sfx('perfect'); react(true); bus.emit('q', { evt: 'perfect', n: 1 }); }
      else if (bestD < 0.16) { target.state = 1; score += pts * 0.6; hits++; combo++; judgeEl('GOOD', '#7ad7ff'); G.audio.sfx('good'); if (target.kind === 'gold') react(true); }
      else { target.state = 3; misses++; combo = 0; judgeEl('MISS', '#ff8f99'); G.audio.sfx('miss'); return; }
      if (target.hold) holding = target;
      best = Math.max(best, combo);
    };
    const release = () => {
      if (!holding) return;
      const end = holding.t + holding.hold;
      if (Math.abs(clock - end) < 0.2 || clock > end) { score += 0.5; judgeEl('HELD!', '#b6ff5c'); G.audio.sfx('good'); }
      else { judgeEl('EARLY', '#ffb547'); combo = 0; }
      holding = null;
    };
    const onKey = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) press(); } };
    const onKeyUp = (e) => { if (e.code === 'Space' || e.code === 'Enter') release(); };
    const onDown = (e) => { e.preventDefault(); press(); };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', release);
    addEventListener('keydown', onKey); addEventListener('keyup', onKeyUp);
    addEventListener('resize', size);
    G.tutorial?.onRecord?.(el);
    return new Promise((res) => {
      let last = performance.now();
      const frame = (now) => {
        const dt = Math.min(0.6, (now - last) / 1000); last = now;
        clock += dt;
        // game view
        if (window.__autoplay) for (const n of notes) { if (!n.state && n.kind !== 'red' && n.t <= clock + 0.02 && n.t > clock - 0.07) { press(); if (n.hold) setTimeout(release, n.hold * 1000); } }
        drawGame(gx, 640, 360, W.screens.t, game, W.screens.data.fx);
        // lane
        const Wd = lane.clientWidth, Hd = lane.clientHeight;
        lx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lx.clearRect(0, 0, Wd, Hd);
        const zx = zoneX(), cy = Hd / 2;
        // track
        lx.fillStyle = 'rgba(255,255,255,0.06)'; lx.fillRect(0, cy - 3, Wd, 6);
        // zone
        const pulse = 1 + Math.sin(clock * 10) * 0.04;
        lx.strokeStyle = 'rgba(255,255,255,0.9)'; lx.lineWidth = 4; lx.beginPath(); lx.arc(zx, cy, 26 * pulse, 0, Math.PI * 2); lx.stroke();
        lx.strokeStyle = 'rgba(255,79,139,0.5)'; lx.lineWidth = 10; lx.beginPath(); lx.arc(zx, cy, 32 * pulse, 0, Math.PI * 2); lx.stroke();
        for (const n of notes) {
          const x = zx + (n.t - clock) * speed;
          if (!n.state && clock - n.t > 0.18) {
            n.state = 3;
            if (n.kind === 'red') { score += cfg.blooper ? 0 : 0.3; }
            else { misses++; combo = 0; judgeEl('MISS', '#ff8f99'); G.audio.sfx('miss'); if (n.kind === 'gold') react(false); }
          }
          const tailW = n.hold * speed;
          if (x > Wd + 40 + tailW || (n.state && n.state !== 1) || (n.state === 1 && !n.hold) || (n.state === 1 && n.hold && clock > n.t + n.hold)) continue;
          if (x < -60 - tailW) continue;
          const col = n.kind === 'gold' ? '#ffd54a' : n.kind === 'red' ? (cfg.blooper ? '#b48cff' : '#ff4f5e') : '#7ad7ff';
          if (n.hold) { lx.fillStyle = col + '88'; lx.beginPath(); lx.roundRect(Math.max(x, zx), cy - 12, tailW - Math.max(0, zx - x), 24, 12); lx.fill(); }
          if (n.state === 1) continue;
          const r = n.kind === 'gold' ? 22 : 18;
          const g = lx.createRadialGradient(x, cy, 2, x, cy, r * 1.8);
          g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
          lx.fillStyle = g; lx.beginPath(); lx.arc(x, cy, r * 1.8, 0, Math.PI * 2); lx.fill();
          lx.fillStyle = col; lx.beginPath(); lx.arc(x, cy, r, 0, Math.PI * 2); lx.fill();
          lx.fillStyle = 'rgba(255,255,255,0.9)'; lx.beginPath(); lx.arc(x - r * 0.3, cy - r * 0.3, r * 0.28, 0, Math.PI * 2); lx.fill();
          lx.strokeStyle = '#1a1830'; lx.lineWidth = 3; lx.lineCap = 'round';
          if (n.kind === 'red' && !cfg.blooper) { lx.beginPath(); lx.moveTo(x - 6, cy - 6); lx.lineTo(x + 6, cy + 6); lx.moveTo(x + 6, cy - 6); lx.lineTo(x - 6, cy + 6); lx.stroke(); }
          else if (n.kind === 'gold') { lx.fillStyle = '#7a4b00'; lx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 4 : 9, a = i * Math.PI / 5 - Math.PI / 2; lx.lineTo(x + Math.cos(a) * rr, cy + Math.sin(a) * rr); } lx.fill(); }
          else if (n.kind === 'red') { lx.fillStyle = '#2b1050'; lx.font = 'bold 16px sans-serif'; lx.textAlign = 'center'; lx.fillText('LOL', x, cy + 6); }
        }
        comboEl.textContent = combo >= 3 ? `${combo}x COMBO` : '';
        scEl.textContent = Math.max(0, Math.round((score / maxScore) * 100));
        const left = Math.max(0, dur - Math.max(0, clock));
        timerEl.textContent = `0:${String(Math.ceil(left)).padStart(2, '0')}`;
        if (clock < dur) requestAnimationFrame(frame);
        else finish();
      };
      const finish = () => {
        el.removeEventListener('pointerdown', onDown);
        removeEventListener('keydown', onKey); removeEventListener('keyup', onKeyUp); removeEventListener('resize', size);
        stopType();
        const perf = clamp(score / maxScore, 0, 1);
        const wrapT = h(`<div class="combo" style="top:40%;font-size:44px">${perf > 0.85 ? 'INSANE TAKE!' : perf > 0.6 ? "THAT'S A WRAP!" : 'WRAPPED'}</div>`);
        $('.vf-hud', el).appendChild(wrapT);
        G.audio.sfx(perf > 0.6 ? 'reward' : 'pop');
        W.char.play(perf > 0.6 ? 'sitWin' : 'sit', { restart: true });
        W.char.setExpression(perf > 0.6 ? 'happy' : 'neutral', 2);
        setTimeout(() => { closeOverlay(el); res({ perf, perfects, hits, misses, best }); }, 1100);
      };
      requestAnimationFrame(frame);
    });
  },

  // ---------------------------------------------------------------- EDIT MINIGAME
  editGame(game, content) {
    const W = G.world, s = G.s;
    W.screens.setMode('main', 'edit'); W.screens.setMode('laptop', 'edit');
    W.char.play('sitEdit'); W.char.setExpression('focus');
    W.shot('desk', { shift: innerWidth < 900 ? -0.22 : -0.2 });
    const n = 10;
    const kinds = [];
    for (let i = 0; i < n; i++) kinds.push(Math.random() < 0.45 ? 'good' : Math.random() < 0.7 ? 'meh' : 'bad');
    if (!kinds.includes('good')) kinds[2] = 'good';
    if (!kinds.some((k) => k !== 'good')) kinds[5] = 'meh';
    const segs = kinds.map((k) => ({ kind: k, cut: false, w: 0.7 + Math.random() * 0.8 }));
    W.screens.data.edit = { segments: segs };
    const auto = s.team?.editor ? 0.95 : s.stats.videos >= 3 ? clamp(0.62 + s.gear.pc * 0.05, 0, 0.9) : null;
    const el = overlay(`<div class="viewfinder glass">
      <div class="row"><div class="grow"><div class="display" style="font-size:22px">Edit the cut</div><div class="tiny muted" style="font-weight:600">Tap ${ic('zzz')} boring and ${ic('x')} fail clips before the playhead hits them. Keep ${ic('star')} highlights.</div></div>
      ${auto ? `<button class="btn ${s.team?.editor ? 'go' : 'ghost'} small" data-a="auto">${ic(s.team?.editor ? 'scissors' : 'bolt')}${s.team?.editor ? 'Editor' : 'Auto'} ${Math.round(auto * 100)}%</button>` : ''}</div>
      <div class="vf-screen" style="aspect-ratio:21/9"><canvas width="640" height="274"></canvas><div class="vf-hud"><div class="rec" style="background:rgba(0,0,0,.55)">${ic('scissors')} EDITING</div></div></div>
      <div class="timeline">${segs.map((sg, i) => `<button class="seg ${sg.kind}" data-a="seg" data-i="${i}" data-silent="1" style="flex:${sg.w}">${ic(sg.kind === 'good' ? 'star' : sg.kind === 'bad' ? 'x' : 'zzz')}</button>`).join('')}<div class="playhead"></div></div></div>`, 'edit');
    const gc = $('canvas', el), gx = gc.getContext('2d');
    const tl = $('.timeline', el), ph = $('.playhead', el);
    let done = false, auto_ = false;
    G.tutorial?.onEdit?.(el);
    return new Promise((res) => {
      const finish = () => {
        if (done) return; done = true;
        let sc = 0;
        if (auto_) sc = auto;
        else { segs.forEach((sg) => { if (sg.kind === 'good' ? !sg.cut : sg.cut) sc++; }); sc /= segs.length; }
        G.audio.sfx(sc > 0.7 ? 'reward' : 'pop');
        setTimeout(() => { closeOverlay(el); res({ perf: sc }); }, 500);
      };
      bind(el, {
        seg: (b) => {
          const i = +b.dataset.i, sg = segs[i];
          if (sg.cut || sg.locked) return;
          sg.cut = true; b.classList.add('cut');
          G.audio.sfx('cut');
          if (sg.kind === 'good') { floatText(b.getBoundingClientRect().left + 20, b.getBoundingClientRect().top, 'Highlight lost', '#ff8f99'); G.audio.sfx('error'); }
          W.char.play('sitEdit', { restart: true });
        },
        auto: () => { auto_ = true; segs.forEach((sg, i) => { if (sg.kind !== 'good') { sg.cut = true; $$('.seg', el)[i].classList.add('cut'); } }); G.audio.sfx('cut'); finish(); },
      });
      const dur = 6.2;
      let t = -0.6, last = performance.now();
      const frame = (now) => {
        if (done) return;
        const dt = Math.min(0.6, (now - last) / 1000); last = now; t += dt;
        drawGame(gx, 640, 274, W.screens.t, game, W.screens.data.fx);
        const k = clamp(t / dur, 0, 1);
        const tw = tl.clientWidth - 20;
        ph.style.left = 10 + tw * k + 'px';
        // lock passed segments
        const btns = $$('.seg', el);
        btns.forEach((b, i) => {
          const r = b.offsetLeft + b.offsetWidth;
          if (r < 10 + tw * k && !segs[i].locked) { segs[i].locked = true; if (!segs[i].cut) { b.style.pointerEvents = 'none'; if (segs[i].kind !== 'good') b.classList.add('lost'); else b.style.boxShadow = '0 0 0 2px #b6ff5c'; } }
        });
        if (k >= 1) finish(); else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  },

  // ---------------------------------------------------------------- THUMBNAIL & TITLE
  publishStep(game, content, partner) {
    const s = G.s, W = G.world;
    W.char.play('sitType'); W.char.setExpression('neutral');
    const stopT = G.audio.loop('typing');
    const styles = THUMBS.filter((t) => !t.pack || s.cosmetics.includes('thumb_pack'));
    const n = s.stats.videos + 1;
    const titles = makeTitles(game, content, n);
    if (partner) titles.forEach((t) => (t.text = t.text + ` ft. ${partner.name}`));
    let ti = 0, si = 0;
    const tr = G.game.trend(), trending = game.tags.includes(tr.hot) || s.buffs.trend > 0;
    if (trending) ti = 2;
    const el = overlay(`<div class="picker glass">
      <div class="pick-head">${steps(4, 3)}<h2 class="display grow">Thumbnail &amp; title</h2></div>
      <div class="mb col" style="gap:14px">
        <div class="thumbs"></div>
        <div class="col" style="gap:8px">${titles.map((t, i) => `<button class="title-opt ${i === ti ? 'sel' : ''}" data-a="t" data-i="${i}"><span class="tt">${esc(t.text)}</span>
          <span class="chip ${t.id === 'hype' ? 'hot' : t.id === 'honest' ? 'good' : 'info'}">${ic(t.id === 'hype' ? 'eye' : t.id === 'honest' ? 'heart' : 'flame')}${t.label}</span></button>`).join('')}</div>
      </div>
      <div class="row" style="justify-content:flex-end"><span class="tiny muted grow" style="font-weight:600">${trending ? `${ic('flame')} This game is trending — Trendy titles get a boost!` : `${ic('info')} Clickbait = more clicks, Honest = more subs`}</span><button class="btn primary big shine" data-a="pub">${ic('upload')}Publish</button></div></div>`);
    const box = $('.thumbs', el);
    const canvases = styles.map((st, i) => {
      const card = h(`<button class="card click ${i === si ? 'sel' : ''}" data-a="th" data-i="${i}" style="padding:8px"><div class="row" style="justify-content:space-between"><b class="display" style="font-size:14px">${st.name}</b><span class="chip ${st.ctr > 1.15 ? 'hot' : st.trust > 1.1 ? 'good' : 'info'}" style="padding:2px 8px">${st.ctr > 1.15 ? 'Clicky' : st.trust > 1.1 ? 'Trusty' : 'Balanced'}</span></div></button>`);
      const c = makeThumb(st.id, game, titles[ti].text);
      card.insertBefore(c, card.firstChild);
      box.appendChild(card);
      return c;
    });
    G.tutorial?.onPicker?.('publish', el);
    return new Promise((res) => {
      bind(el, {
        th: (b) => { si = +b.dataset.i; $$('[data-a=th]', el).forEach((x, i) => x.classList.toggle('sel', i === si)); },
        t: (b) => { ti = +b.dataset.i; $$('[data-a=t]', el).forEach((x, i) => x.classList.toggle('sel', i === ti)); },
        pub: () => { stopT(); closeOverlay(el); res({ thumb: styles[si], title: titles[ti], canvas: makeThumb(styles[si].id, game, titles[ti].text) }); },
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

  // ---------------------------------------------------------------- RESULTS
  async results(out, ctx) {
    const s = G.s, W = G.world;
    const { game, content, pub, sponsor, partner } = ctx;
    W.screens.setMode('main', 'results'); W.screens.setMode('laptop', 'results');
    W.screens.data.views = 0;
    W.shot('deskWide');
    const great = ctx.perf > 0.8 || out.viral;
    W.char.play(great ? 'sitWin' : ctx.perf > 0.5 ? 'sitTalk' : 'sitFail', { restart: true });
    W.char.setExpression(great ? 'happy' : ctx.perf > 0.5 ? 'happy' : 'sad', 3);
    if (out.viral) {
      const vb = h('<div class="viral-burst"><div class="vb">VIRAL!</div></div>');
      $('#fx').appendChild(vb); setTimeout(() => vb.remove(), 1900);
      G.audio.sfx('viral'); W.addShake(1); flash();
      G.sdk?.happy();
      W.vfx.confetti(W.room.st.monitor.clone(), 160, 3);
    } else if (great) { G.audio.sfx('reward'); W.vfx.confetti(W.room.st.monitor.clone(), 70, 2.2); }
    const first = Math.round(out.views * 0.75), firstSubs = Math.round(out.subs * 0.8);
    const spPay = sponsor ? sponsor.pay : 0;
    const el = overlay(`<div class="results glass">
      <div class="res-thumb"></div>
      <div class="col" style="gap:4px">
        <div class="res-head">${ic('vidora')} Vidora · first hour</div>
        <div class="res-big">0</div>
        <div class="row tiny muted" style="font-weight:700;margin-top:-6px">${ic('eye')} views · <span style="color:var(--lime)">${ic('trend')} still climbing</span></div>
        <div class="insights"></div>
        <div class="res-stats">
          <div class="stat subs"><div class="sl">${ic('users')}Subscribers</div><div class="sv" data-k="subs">+0</div></div>
          <div class="stat money"><div class="sl">${ic('dollar')}Revenue</div><div class="sv" data-k="money">$0</div></div>
          <div class="stat xp"><div class="sl">${ic('star')}XP</div><div class="sv" data-k="xp">+0</div></div>
          <div class="stat"><div class="sl">${ic('thumb')}Likes</div><div class="sv" data-k="likes">0</div></div>
          <div class="stat"><div class="sl">${ic('message')}Comments</div><div class="sv" data-k="comments">0</div></div>
          <div class="stat"><div class="sl">${ic('eye')}Retention</div><div class="sv" data-k="ret">0%</div></div>
        </div>
        ${spPay ? `<div class="chip good" style="margin-top:10px;align-self:flex-start">${ic('handshake')} ${esc(sponsor.brand)} deal complete +${fmtMoney(spPay)}</div>` : ''}
        <div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn go big shine" data-a="ok" disabled>${ic('check')}Collect</button></div>
      </div></div>`);
    const tc = pub.canvas; tc.style.width = '100%';
    $('.res-thumb', el).appendChild(tc);
    $('.res-thumb', el).appendChild(h(`<div class="res-title">${esc(pub.title.text)}</div>`));
    $('.res-thumb', el).appendChild(h(`<div class="row" style="margin-top:8px;flex-wrap:wrap">${genreTags(game, 2)}<span class="chip">${ic(content.icon)}${content.name}</span></div>`));
    G.audio.sfx('whoosh');
    const big = $('.res-big', el);
    // counters
    const views = first;
    const tick = setInterval(() => { W.screens.data.views = +big.dataset.v || 0; }, 100);
    await Promise.all([
      countUp(big, 0, views, 1800, (v) => { big.dataset.v = v; if (Math.random() < 0.3) G.audio.sfx('chat', 2); return fmt(v); }),
      countUp($('[data-k=subs]', el), 0, firstSubs, 1600, (v) => '+' + fmt(v)),
      countUp($('[data-k=money]', el), 0, out.money * 0.75 + spPay, 1600, fmtMoney),
      countUp($('[data-k=xp]', el), 0, out.xp, 1400, (v) => '+' + fmt(v)),
      countUp($('[data-k=likes]', el), 0, out.likes * 0.75, 1500, fmt),
      countUp($('[data-k=comments]', el), 0, out.comments * 0.75, 1500, fmt),
      countUp($('[data-k=ret]', el), 0, out.retention * 100, 1500, (v) => Math.round(v) + '%'),
      (async () => { const box = $('.insights', el); for (const [k, i2, txt] of out.insights) { await sleep(320); box.appendChild(h(`<span class="chip ${k}">${ic(i2)}${txt}</span>`)); G.audio.sfx('pop'); } })(),
    ]);
    clearInterval(tick);
    const okBtn = $('[data-a=ok]', el);
    okBtn.disabled = false;
    G.tutorial?.onResults?.(el);
    await new Promise((r) => bind(el, { ok: r }));
    // apply rewards
    const from = okBtn.getBoundingClientRect();
    const fp = { x: from.left + from.width / 2, y: from.top };
    const subsNow = firstSubs, moneyNow = Math.round(out.money * 0.75) + spPay;
    G.game.addFans('vid', subsNow, fp);
    G.game.addMoney(moneyNow, fp);
    const xpGot = G.game.addXP(out.xp, fp);
    G.game.useBuff('xp2'); G.game.useBuff('wellfed');
    // cross-platform spill
    if (s.fans.blip > 0 || out.viral) G.game.addFans('blip', Math.round(subsNow * 0.12), null, true);
    s.stats.videos++; s.stats.views += views; s.stats.likes += out.likes;
    if (!s.stats.best || views > s.stats.best.views) s.stats.best = { views, title: pub.title.text };
    s.videos.unshift({ id: uid(), title: pub.title.text, game: game.id, type: content.id, views, subs: subsNow, money: moneyNow, likes: out.likes, day: s.clock.day, perf: Math.round(ctx.perf * 100), viral: out.viral, thumb: smallJpeg(pub.canvas),
      tailLeft: out.tail + (out.views - views), conv: out.subs / Math.max(1, out.views), rpm: out.money / Math.max(1, out.views) });
    if (s.videos.length > 40) s.videos.length = 40;
    s.videos.forEach((v, i) => { if (i > 10) v.thumb = null; });
    if (sponsor) G.meta.completeDeal(sponsor);
    if (out.viral) s.clips++;
    bus.emit('q', { evt: 'video', n: 1, tags: game.tags });
    if (game.tags.includes(G.game.trend().hot) || out.insights.some((i) => i[2] === 'Trending topic')) bus.emit('q', { evt: 'trendvid', n: 1 });
    if (ctx.perf >= 0.9 || out.viral) bus.emit('q', { evt: 'great', n: 1 });
    bus.emit('video:done', { out, viral: out.viral });
    G.audio.sfx('cash');
    closeOverlay(el);
    W.char.play('sit'); W.char.setExpression('happy', 1.5);
    await sleep(500);
    W.standUp(); W.shot('room');
    G.meta.maybeTeaser(out.viral || great);
  },
};
