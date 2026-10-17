// Live streaming: pre-live, stinger, real-time chat/viewers/hype with interactions, summary.
import { G } from '../game/ctx.js';
import { resolveLook } from '../data/clothes.js';
import { bus } from '../core/bus.js';
import { $, $$, h, bind, ic, esc, toast, countUp, floatText, flash } from '../ui/ui.js';
import { emotify } from '../ui/icons.js';
import { overlay, closeOverlay, genreTags } from './create.js';
import { LINES, randomUser, USER_COLORS, STREAM_QUESTIONS, POLLS } from '../data/chat.js';
import { COSMETICS } from '../data/rewards.js';
import { streamBase, setupStats } from '../game/economy.js';
import { hasFeature } from '../data/progression.js';
import { drawGame } from '../world/screens.js';
import { clamp, pick, chance, rand, randi, fmt, fmtMoney, sleep, isTouch } from '../core/util.js';

const DUR = 55;

export const Stream = {
  async run() {
    const s = G.s, W = G.world;
    let game;
    while (true) {
      game = await G.create.pickGame({ title: 'What are we streaming?', step: [2, 0], mode: 'stream' });
      if (game === 'shop') { await G.shop.open('games', null, true); continue; }
      break;
    }
    if (!game) { await G.create.sitting; W.standUp(); W.shot('room'); return; }
    const announced = s.buffs.announce > 0;
    const ev = G.game.currentEvent();
    const base = streamBase(s, { game, hour: G.game.hour, trend: G.game.trend(), event: ev, fatigue: s.gameUse[game.id] || 0, announced, trendBoost: s.buffs.trend > 0 });
    // pre-live
    const pre = overlay(`<div class="picker glass" style="width:min(560px,calc(100% - 28px))">
      <div class="pick-head"><div class="step-dots"><i class="done"></i><i class="on"></i></div><h2 class="display grow">Ready to go live?</h2><button class="xbtn" data-a="x">${ic('close')}</button></div>
      <div class="row" style="gap:12px"><div class="big-ic" style="width:64px;height:64px;border-radius:18px;display:grid;place-items:center;background:var(--pulse)">${ic('live')}</div>
        <div class="grow"><div class="display" style="font-size:20px">${esc(game.name)}</div><div class="row" style="margin-top:4px;flex-wrap:wrap">${genreTags(game, 2)}</div></div></div>
      <div class="row" style="flex-wrap:wrap">
        <span class="chip info">${ic('eye')}~${fmt(Math.max(3, base.base * 0.8))} expected viewers</span>
        ${announced ? `<span class="chip good">${ic('megaphone')}Announced +35%</span>` : `<span class="chip">${ic('megaphone')}Tip: announce on Blip first</span>`}
        ${base.boost > 1 ? `<span class="chip good">${ic('rocket')}New streamer boost</span>` : ''}
        ${base.gm.tags.includes('trending') ? `<span class="chip hot">${ic('flame')}Trending game</span>` : ''}
        ${ev.fx.streamMult ? `<span class="chip gold">${ic('calendar')}${ev.def.short} x${ev.fx.streamMult}</span>` : ''}
        ${base.nm.tags.length ? `<span class="chip bad">${ic('bolt')}${base.nm.tags.join(' & ')}</span>` : ''}
      </div>
      <button class="btn red big shine" data-a="go" style="align-self:stretch">${ic('live')}GO LIVE</button></div>`);
    const go = await new Promise((r) => bind(pre, { x: () => r(false), go: () => r(true) }));
    closeOverlay(pre);
    if (!go) { await G.create.sitting; W.standUp(); W.shot('room'); return; }
    await G.create.sitting;
    if (announced) G.game.useBuff('announce');
    s.needs.energy = clamp(s.needs.energy - 22 * (1 - setupStats(s).comfort * 0.04), 0, 100);
    s.needs.hunger = clamp(s.needs.hunger - 10, 0, 100);
    await this.live(game, base, ev);
  },

  async live(game, base, ev) {
    const s = G.s, W = G.world, A = G.audio;
    // stinger
    const st = h(`<div class="stinger"><div class="band"></div><div class="band b2"></div><div class="word"><b></b>LIVE</div></div>`);
    $('#fx').appendChild(st);
    A.sfx('stinger');
    setTimeout(() => st.remove(), 1300);
    await sleep(700);
    A.setMusic('live');
    W.room.setLive(true);
    W.screens.data.game = game;
    W.screens.setMode('main', 'stream'); W.screens.setMode('laptop', 'stream');
    if (W.screens.surfaces.has('side')) W.screens.setMode('side', 'chat');
    W.shot('stream');
    W.char.play('sitGame');
    const overlayC = (s.overlay && COSMETICS[s.overlay]?.colors) || [s.profile.accent, '#2fd6ff'];
    W.screens.data.overlay = overlayC;
    W.screens.data.skin = s.profile.skin; W.screens.data.top = resolveLook(s.profile).top.color;
    const stt = setupStats(s);
    const L = s.level;
    const acts = [
      { id: 'talk', icon: 'mic', label: 'Talk', cd: 4.5, k: 'k1' },
      { id: 'play', icon: 'zap', label: 'Big Play', cd: 7, k: 'k2' },
      { id: 'clip', icon: 'scissors', label: 'Clip It', cd: 1, k: 'k3', ctx: true },
      ...(hasFeature(s, 'polls') ? [{ id: 'poll', icon: 'poll', label: 'Poll', cd: 18, k: 'k4' }] : []),
      ...(hasFeature(s, 'giveaway') ? [{ id: 'give', icon: 'gift', label: 'Giveaway', cd: 99, k: 'k5' }] : []),
    ];
    const el = overlay(`<div class="stream-ui" style="--ov1:${overlayC[0]}">
      <div class="s-top"><div class="live-badge"><b></b>LIVE</div><div class="s-stat glass">${ic('eye')}<span class="vw">0</span></div><div class="s-stat glass">${ic('heart')}<span class="fl">+0</span></div><div class="s-stat glass">${ic('clock')}<span class="tm">0:00</span></div></div>
      <div class="s-capture"><canvas width="384" height="216"></canvas><span class="cap-lbl">${ic('gamepad')} ${esc(game.name)}</span></div>
      <div class="chat glass"><div class="chat-h">${ic('pulse')} Stream chat <span class="rate">0 msg/min</span></div><div class="chat-list"></div></div>
      <button class="btn ghost small end-btn" data-a="end" style="opacity:.0;pointer-events:none">${ic('close')}End stream</button>
      <div class="s-bottom">
        <div class="hype glass"><span class="hl">${ic('flame')} HYPE</span><div class="bar"><i style="width:0%"></i></div><span class="hl hv">0%</span></div>
        <div class="s-actions">${acts.map((a) => `<button class="s-act glass ${a.k} ${a.ctx ? 'ctx' : ''}" data-a="${a.id}" data-silent="1">${ic(a.icon)}<span>${a.label}</span><div class="cd" style="transform:scaleX(0)"></div></button>`).join('')}</div>
      </div></div>`, 'live');
    const R = { vw: $('.vw', el), fl: $('.fl', el), tm: $('.tm', el), chat: $('.chat-list', el), rate: $('.rate', el), hype: $('.hype', el), hbar: $('.hype .bar i', el), hv: $('.hv', el), cap: $('.s-capture canvas', el), end: $('[data-a=end]', el) };
    const capx = R.cap.getContext('2d');
    const cds = {}; acts.forEach((a) => (cds[a.id] = 0));
    const S2 = {
      t: 0, viewers: Math.max(1, base.base * 0.25), peak: 0, sumV: 0, followers: 0, subs: 0, donations: 0, chatN: 0, clips: 0,
      hype: 10, eng: 1, mood: 0.75, raid: 0, clipWindow: 0, ended: false, nextEvt: 4, lag: 0, train: 0, thanks: 0, bigWins: 0, events: [], msgTimes: [],
      pending: null, poll: null, q: null, lastAlert: null,
    };
    const followMult = ev.fx.followMult || 1;
    const ctxLines = this.contextLines(game, stt);
    // ---- chat: a persistent crowd of regulars — small streams have a few people who talk now and then,
    // big streams have many fast chatters. Active chatters ~ viewers^0.75, ~2 messages per chatter per minute.
    const crowd = [];
    const chatters = () => Math.max(1, Math.pow(S2.viewers, 0.75) * 0.75);
    const crowdUser = () => {
      const want = Math.max(1, Math.round(chatters()));
      while (crowd.length < Math.min(want, 60)) crowd.push(randomUser());
      return crowd[Math.floor(Math.pow(Math.random(), 1.3) * Math.min(crowd.length, want))];
    };
    const fem = s.profile.gender === 'f';
    const addMsg = (text, opt = {}) => {
      text = text.replace('{pr}', fem ? 'she' : 'he').replace('{king}', fem ? 'queen' : 'king'); // chat talks about your creator
      const user = opt.user || crowdUser();
      const col = opt.color || USER_COLORS[(user.length * 7 + user.charCodeAt(0)) % USER_COLORS.length];
      const badge = opt.badge === 'sub' ? `<span class="bdg" style="background:var(--violet)">${ic('star')}</span>` : opt.badge === 'mod' ? `<span class="bdg" style="background:var(--lime);color:#123">${ic('hammer')}</span>` : opt.badge === 'vip' ? `<span class="bdg" style="background:var(--pink)">${ic('spark')}</span>` : '';
      const m = h(`<div class="msg ${opt.cls || ''}">${badge}<span class="u" style="color:${col}">${esc(user)}</span>${emotify(esc(text))}${opt.extra || ''}</div>`);
      R.chat.appendChild(m);
      while (R.chat.children.length > 32) R.chat.firstElementChild.remove();
      S2.chatN++; S2.msgTimes.push(S2.t);
      W.screens.data.chat.push({ user, color: col, plain: text.replace(/:([a-z]+):/g, '') });
      if (W.screens.data.chat.length > 30) W.screens.data.chat.shift();
      if (Math.random() < 0.35) A.sfx('chat');
      return m;
    };
    const sys = (text) => { const m = h(`<div class="msg sys">${text}</div>`); R.chat.appendChild(m); };
    W.screens.data.chat = [];
    sys(`${ic('live')} Stream started — say hi!`);
    // ---- alerts
    const alertPop = (html, cls, dur = 4) => {
      S2.lastAlert?.remove();
      const a = h(`<div class="alert-pop ${cls}">${html}</div>`);
      el.appendChild(a);
      S2.lastAlert = a;
      W.screens.data.alert = { text: a.textContent.trim(), t: dur };
      setTimeout(() => { if (a.isConnected) { a.style.transition = 'opacity .3s'; a.style.opacity = 0; setTimeout(() => a.remove(), 300); } }, dur * 1000);
      return a;
    };
    const react = (kind) => {
      if (kind === 'win') { W.char.play('sitWin', { restart: true }); W.char.setExpression('happy', 1.4); setTimeout(() => W.char.clip === 'sitWin' && W.char.play('sitGame'), 1100); }
      if (kind === 'fail') { W.char.play('sitFail', { restart: true }); W.char.setExpression('sad', 1.2); setTimeout(() => W.char.clip === 'sitFail' && W.char.play('sitGame'), 1100); }
      if (kind === 'laugh') { W.char.play('sitLaugh', { restart: true }); W.char.setExpression('laugh', 1.2); setTimeout(() => W.char.clip === 'sitLaugh' && W.char.play('sitGame'), 1000); }
      if (kind === 'wave') { W.char.play('sitWave', { restart: true }); W.char.setExpression('happy', 1.5); W.char.talking = true; setTimeout(() => { W.char.talking = false; if (W.char.clip === 'sitWave') W.char.play('sitGame'); }, 1500); }
      if (kind === 'talk') { W.char.play('sitTalk', { restart: true }); W.char.talking = true; W.char.setExpression('happy', 2.4); setTimeout(() => { W.char.talking = false; if (W.char.clip === 'sitTalk') W.char.play('sitGame'); }, 2400); }
    };
    // reaction bursts scale with the audience: 5 viewers -> maybe one reply, thousands -> a flood
    const spam = (pool, n, delay = 90) => {
      const k = clamp(chatters() / 14, 0.12, 1);
      let m = Math.floor(n * k + Math.random());
      if (m < 1 && Math.random() < 0.6) m = 1;
      const d = delay * (1 + (1 - k) * 4);
      for (let i = 0; i < m; i++) setTimeout(() => !S2.ended && addMsg(pick(pool)), 300 + i * d + Math.random() * d);
    };
    // W spam: on big moments the whole chat floods the stream with W's. A 5-viewer stream gets a W or two,
    // a big one gets a wall of them and a running W counter.
    const W_LINES = ['W', 'W', 'W', 'W', 'WWWW', 'W W W', 'WWWWWWWW', 'W STREAMER', 'HUGE W', 'W :fire:', 'massive W', 'W W', 'W CHAT', 'BIG W :pog:', 'WWW :fire:'];
    const wCombo = h(`<div class="w-combo"><b>W</b><span>×0</span></div>`);
    $('.chat', el).appendChild(wCombo);
    let wN = 0, wT = 0;
    const bumpW = () => {
      wN++; wT = S2.t;
      if (wN < 3) return;
      wCombo.lastChild.textContent = '×' + wN;
      wCombo.classList.add('on'); wCombo.classList.remove('bump'); void wCombo.offsetWidth; wCombo.classList.add('bump');
    };
    const wWall = (n) => {
      const k = clamp(chatters() / 14, 0.12, 1);
      let m = Math.round(n * k);
      if (m < 1) m = Math.random() < 0.7 ? 1 : 0;
      const d = 40 + (1 - k) * 220;
      for (let i = 0; i < m; i++) setTimeout(() => { if (S2.ended) return; addMsg(pick(W_LINES), { cls: 'w' }); bumpW(); }, 120 + i * d + Math.random() * d * 0.7);
    };
    const wTick = () => { if (wN && S2.t - wT > 2.2) { wN = 0; wCombo.classList.remove('on'); } };
    const addHype = (v) => { S2.hype = clamp(S2.hype + v, 0, 100); if (S2.hype >= 100 && S2.train <= 0) startTrain(); };
    const startTrain = () => {
      S2.train = 8; S2.events.push('train');
      R.hype.classList.add('train');
      alertPop(`${ic('rocket')} HYPE TRAIN!`, 'raid', 3);
      A.sfx('crowd', 1.4); A.sfx('reward');
      W.addShake(0.6);
      W.vfx.confetti(W.headWorld().add({ x: 0, y: 0.4, z: 0.3 }), 90, 2.4);
      wWall(16);
      spam(LINES.hypeTrain, 6, 90);
    };
    // ---- donations
    const donation = () => {
      const user = randomUser();
      const amt = pick([1, 1, 2, 2, 3, 5, 5, 5, 10, 10, 20, Math.random() < 0.25 ? 50 : 5]) * Math.max(1, Math.round(1 + L * 0.08 + S2.viewers * 0.002));
      const msg = pick(LINES.donation);
      S2.donations += amt;
      A.sfx('donation');
      addMsg(`donated ${fmtMoney(amt)}: ${msg}`, { user, cls: 'don', badge: 'vip' });
      if (amt >= 50) wWall(8);
      const a = alertPop(`${ic('dollar')} <span>${esc(user)} donated ${fmtMoney(amt)}</span> <button class="btn small" data-thank style="--b:#fff;--b2:#e9ffe0;--bd:#5a9a12;color:#142300">${ic('heart')}Thank</button>`, 'don', 4.5);
      W.screens.data.alert = { text: `${user} donated ${fmtMoney(amt)}`, t: 3 };
      S2.pending = { kind: 'don', user };
      $('[data-thank]', a).addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (S2.pending?.user !== user) return;
        S2.pending = null; S2.thanks++; a.remove();
        A.sfx('pop'); react('wave'); addHype(10); S2.eng += 0.35;
        addMsg(`thanks so much ${user}!! :heart:`, { user: s.profile.name, color: s.profile.accent, cls: 'me' });
        spam(['W streamer', ':heart: :heart:', 'so wholesome', 'GG :gg:'], 3, 150);
        bus.emit('q', { evt: 'thank', n: 1 });
      });
    };
    const subAlert = () => {
      const user = randomUser();
      S2.subs++;
      A.sfx('sub');
      addMsg(pick(LINES.subs), { user, cls: 'sub', badge: 'sub' });
      alertPop(`${ic('star')} ${esc(user)} subscribed!`, 'sub', 2.5);
      addHype(6);
    };
    // ---- events
    const troll = () => {
      if (s.team?.mod) { addMsg(pick(LINES.troll), { cls: 'troll' }); setTimeout(() => sys(`${ic('hammer')} Mod removed a troll`), 600); return; }
      const user = randomUser();
      const m = addMsg(pick(LINES.troll), { user, cls: 'troll', extra: `<button class="ban" data-ban>${ic('hammer')} BAN</button>` });
      const t0 = S2.t;
      S2.trolls = (S2.trolls || 0) + 1;
      $('[data-ban]', m).addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        m.innerHTML = `<i class="muted">message deleted by streamer</i>`; m.className = 'msg sys';
        A.sfx('cut'); S2.mood = clamp(S2.mood + 0.08, 0, 1); S2.trolls--;
        spam(['W mod', 'get out lol', 'BANNED :skull:', 'clean chat :cool:'], 3, 160);
      }, { once: true });
      setTimeout(() => { if (m.querySelector('[data-ban]')) { S2.mood = clamp(S2.mood - 0.12, 0, 1); spam(['ugh trolls', 'ban them', 'mods??'], 2); } }, 6000);
    };
    const question = () => {
      if (S2.q) return;
      const q = pick(STREAM_QUESTIONS);
      const user = randomUser();
      addMsg(q.q, { user, cls: 'q' });
      const box = h(`<div class="qa-box glass"><div class="tiny muted" style="font-weight:700">${ic('message')} ${esc(user)} asks</div><div class="display" style="font-size:18px;margin:4px 0 10px">${esc(q.q)}</div><div class="row">${q.a.map((a, i) => `<button class="btn cyan small grow" data-i="${i}">${esc(a)}</button>`).join('')}</div></div>`);
      el.appendChild(box); S2.q = box;
      const done = (ok) => { if (!S2.q) return; box.remove(); S2.q = null; if (ok) { react('talk'); S2.eng += 0.6; addHype(12); spam(['real', 'love that', 'W answer', ':heart:', 'noted!'], 4, 200); } else { S2.mood = clamp(S2.mood - 0.05, 0, 1); } };
      $$('button', box).forEach((b) => b.addEventListener('pointerdown', (e) => { e.stopPropagation(); A.sfx('click'); addMsg(q.a[+b.dataset.i].toLowerCase() + '!', { user: s.profile.name, color: s.profile.accent, cls: 'me' }); done(true); }));
      setTimeout(() => done(false), 8000);
    };
    const raid = () => {
      const n = Math.round(Math.max(15, S2.viewers * rand(0.6, 1.4) + L * 4));
      const from = randomUser();
      const a = alertPop(`${ic('rocket')} RAID! ${esc(from)} +${fmt(n)} viewers <button class="btn small amber" data-w>${ic('wave')}Welcome!</button>`, 'raid', 5);
      A.sfx('crowd', 1.2);
      S2.events.push('raid');
      S2.raid += n * 0.6;
      spam(LINES.raid, 8, 90);
      $('[data-w]', a).addEventListener('pointerdown', (e) => { e.stopPropagation(); a.remove(); react('wave'); wWall(10); S2.raid += n * 0.5; S2.followers += n * 0.12; addHype(25); A.sfx('reward'); spam(['hiii :heart:', 'nice welcome', 'staying!'], 4); }, { once: true });
    };
    const lag = () => {
      S2.lag = 3.5;
      const a = alertPop(`${ic('wifi')} Stream lagging! <button class="btn small red" data-fix>${ic('bolt')}Fix</button>`, 'raid', 3.5);
      spam(LINES.lowNet, 3, 200);
      $('[data-fix]', a).addEventListener('pointerdown', (e) => { e.stopPropagation(); a.remove(); S2.lag = 0; A.sfx('good'); sys(`${ic('wifi')} Connection restored`); }, { once: true });
    };
    const clipMoment = () => {
      S2.clipWindow = 4;
      const b = $('[data-a=clip]', el); b?.classList.add('clipready');
      addMsg('CLIP THAT :pog:', {});
      spam(['CLIP IT', 'clip clip clip', ':pog: :pog:'], 3, 150);
    };
    const catCameo = () => {
      spam(LINES.cat, 4, 200); addHype(14); S2.eng += 0.4;
      floatText(innerWidth * 0.4, innerHeight * 0.4, 'CAT CAMEO!', '#ffb26b');
    };
    // ---- actions
    const qte = () => new Promise((res) => {
      const box = h(`<div class="qte"><canvas width="440" height="440"></canvas></div>`);
      el.appendChild(box);
      const c = $('canvas', box), x = c.getContext('2d');
      let r = 200, done = false;
      const target = 90;
      const speed = 160 + L * 2;
      A.sfx('qte');
      const end = (ok, label, col) => {
        if (done) return; done = true;
        removeEventListener('keydown', keyH);
        floatText(innerWidth / 2, innerHeight * 0.4, label, col);
        setTimeout(() => box.remove(), 120);
        res(ok);
      };
      box.addEventListener('pointerdown', (e) => { e.stopPropagation(); const d = Math.abs(r - target); if (d < 14) end(2, 'PERFECT PLAY!', '#ffd54a'); else if (d < 30) end(1, 'NICE!', '#b6ff5c'); else end(0, 'WHIFFED', '#ff8f99'); });
      function keyH(e) { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); box.dispatchEvent(new PointerEvent('pointerdown')); } }
      addEventListener('keydown', keyH);
      let last = performance.now();
      const f = (t) => {
        if (done) return;
        if (G.halted()) { last = t; requestAnimationFrame(safe); return; }
        const dt = Math.min(0.05, (t - last) / 1000); last = t;
        r -= speed * dt;
        x.clearRect(0, 0, 440, 440);
        x.lineWidth = 16; x.strokeStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.arc(220, 220, target, 0, 7); x.stroke();
        x.lineWidth = 6; x.strokeStyle = '#ffd54a'; x.beginPath(); x.arc(220, 220, target, 0, 7); x.stroke();
        x.lineWidth = 8; x.strokeStyle = Math.abs(r - target) < 14 ? '#b6ff5c' : '#fff'; x.beginPath(); x.arc(220, 220, Math.max(2, r), 0, 7); x.stroke();
        x.fillStyle = '#fff'; x.font = '800 30px Bricolage, sans-serif'; x.textAlign = 'center'; x.fillText(isTouch ? 'TAP!' : 'CLICK!', 220, 232);
        if (r < target - 40) end(0, 'TOO LATE', '#ff8f99');
        else requestAnimationFrame(safe);
      };
      const safe = (t) => { try { f(t); } catch (e) { console.error('[recovered]', e); end(0, 'TOO LATE', '#ff8f99'); } };
      requestAnimationFrame(safe);
    });
    this.live = { S2, raid, startTrain, addHype }; // handle for dev tools (store-video capture)
    const doAct = async (id) => {
      if (S2.ended || cds[id] > 0) return;
      const a = acts.find((x) => x.id === id);
      if (!a) return; // not unlocked yet (hotkeys 4/5)
      if (id === 'clip') {
        if (S2.clipWindow <= 0) { A.sfx('error'); floatText(innerWidth * 0.3, innerHeight * 0.75, 'Wait for a highlight', '#ff8f99'); return; }
        S2.clipWindow = 0; S2.clips++; s.clips++; $('[data-a=clip]', el)?.classList.remove('clipready');
        A.sfx('shutter'); flash(); addHype(8);
        sys(`${ic('scissors')} Clip saved for Blip!`);
        bus.emit('q', { evt: 'clip', n: 1 });
        cds[id] = a.cd; return;
      }
      cds[id] = a.cd;
      A.sfx('click');
      if (id === 'talk') {
        react('talk'); S2.eng += 0.45; addHype(9);
        const lines = ['lmao true', 'hahaha', 'storytime :pog:', 'so real', 'W take', ':lul:', 'facts', 'lol yes'];
        spam(lines, 4, 260);
      } else if (id === 'play') {
        W.char.play('sitIntense', { restart: true }); W.char.setExpression('focus');
        addMsg('big play incoming??', {});
        const res = await qte();
        if (res > 0) {
          W.screens.data.fx.hit = 1; react('win'); addHype(res === 2 ? 30 : 18); S2.eng += res === 2 ? 0.8 : 0.5; S2.bigWins++;
          A.sfx(res === 2 ? 'perfect' : 'good'); A.sfx('crowd', res === 2 ? 1.2 : 0.7);
          wWall(res === 2 ? 24 : 9);
          spam(LINES.hype, res === 2 ? 5 : 3, 110);
          W.addShake(res === 2 ? 0.7 : 0.35);
          if (res === 2 || chance(0.5)) clipMoment();
          W.vfx.emit('star', W.room.st.monitor.clone(), { count: 8, size: 0.12, life: 1.2 });
        } else {
          W.screens.data.fx.fail = 1; react('fail'); addHype(5); S2.eng += 0.15;
          A.sfx('boo'); spam(LINES.fail, 6, 100);
          if (chance(0.35)) clipMoment();
        }
      } else if (id === 'poll') {
        const p = pick(POLLS);
        const box = h(`<div class="poll-box glass"><div class="display" style="font-size:17px">${ic('poll')} ${esc(p[0])}</div><div class="poll-opt"><i style="width:0%"></i><span>${esc(p[1])}</span></div><div class="poll-opt"><i style="width:0%"></i><span>${esc(p[2])}</span></div></div>`);
        el.appendChild(box);
        const bars = $$('.poll-opt i', box);
        let v1 = 0, v2 = 0;
        const votes = Math.max(1, Math.round(Math.min(S2.viewers * 0.6, 4000)));
        const shown = Math.min(Math.round(chatters() * 1.2), 22);
        let cast = 0;
        const iv = setInterval(() => {
          const step = Math.max(1, Math.round(votes / 24)); cast += step;
          for (let j = 0; j < step; j++) { if (Math.random() < 0.55) v1++; else v2++; }
          if (shown > 0 && Math.random() < shown / 24) addMsg(String(Math.random() < 0.55 ? 1 : 2), {});
          const tv = Math.max(1, v1 + v2);
          bars[0].style.width = (v1 / tv) * 100 + '%'; bars[1].style.width = (v2 / tv) * 100 + '%';
        }, 220);
        setTimeout(() => { clearInterval(iv); box.remove(); sys(`${ic('poll')} Poll: "${esc(v1 >= v2 ? p[1] : p[2])}" wins (${fmt(v1 + v2)} votes)`); }, 5500);
        S2.eng += 1.0; addHype(14);
      } else if (id === 'give') {
        const cost = Math.max(50, Math.round(Math.min(s.money * 0.04, 1500 + s.level * 350) / 10) * 10);
        if (!G.game.spend(cost)) { cds[id] = 0; return; }
        alertPop(`${ic('gift')} GIVEAWAY! ${fmtMoney(cost)} prize`, 'raid', 3);
        S2.raid += S2.viewers * 0.6 + 20; S2.followers += S2.viewers * 0.25 + 8; addHype(35);
        spam(['GIVEAWAY :pog:', 'pick me!!', 'enter enter', 'W streamer'], 10, 90);
        A.sfx('reward');
      }
    };
    bind(el, { talk: () => doAct('talk'), play: () => doAct('play'), clip: () => doAct('clip'), poll: () => doAct('poll'), give: () => doAct('give'), end: () => { if (S2.t > 15) S2.ended = 'early'; } });
    const keyMap = (e) => { if (e.repeat) return; const k = { Digit1: 'talk', Digit2: 'play', Digit3: 'clip', Digit4: 'poll', Digit5: 'give' }[e.code]; if (k) doAct(k); };
    addEventListener('keydown', keyMap);
    G.tutorial?.onStream?.(el);
    // ---- main loop
    let chatAcc = 0, last = performance.now();
    const hasCat = s.placed.includes('cat');
    await new Promise((resolve) => {
      const frame = (now) => {
        if (G.halted()) { last = now; requestAnimationFrame(safe); return; }
        const dt = Math.min(0.6, (now - last) / 1000); last = now;
        S2.t += dt;
        const t = S2.t;
        for (const k of Object.keys(cds)) cds[k] = Math.max(0, cds[k] - dt);
        acts.forEach((a) => { const b = $(`[data-a=${a.id}]`, el); if (!b) return; const k = cds[a.id] / a.cd; b.querySelector('.cd').style.transform = `scaleX(${k})`; b.classList.toggle('ready', k <= 0); });
        // viewers
        const ramp = clamp(t / 12, 0, 1);
        S2.hype = Math.max(0, S2.hype - dt * (S2.train > 0 ? 0 : 2.4));
        if (S2.train > 0) { S2.train -= dt; if (S2.train <= 0) { R.hype.classList.remove('train'); S2.hype = 45; } }
        S2.eng = Math.max(0.5, S2.eng - dt * 0.05);
        S2.raid = Math.max(0, S2.raid - dt * S2.raid * 0.04);
        S2.clipWindow = Math.max(0, S2.clipWindow - dt);
        if (S2.clipWindow <= 0) $('[data-a=clip]', el)?.classList.remove('clipready');
        if (S2.lag > 0) { S2.lag -= dt; if (S2.lag <= 0) { S2.viewers *= 0.8; S2.mood -= 0.1; sys(`${ic('wifi')} Viewers left due to lag`); } }
        const target = base.base * (0.35 + 0.65 * ramp) * (1 + S2.hype / 100 * 0.9) * (0.7 + S2.mood * 0.4) * (S2.train > 0 ? 1.3 : 1) + S2.raid;
        S2.viewers += (target - S2.viewers) * (1 - Math.exp(-dt * 0.8)) + (Math.random() - 0.5) * Math.sqrt(target) * dt * 3;
        S2.viewers = Math.max(1, S2.viewers);
        S2.peak = Math.max(S2.peak, S2.viewers);
        S2.sumV += S2.viewers * dt;
        S2.followers += S2.viewers * 0.0062 * (0.55 + S2.eng * 0.6) * dt * followMult;
        W.screens.data.viewers = S2.viewers;
        if (W.screens.data.alert) W.screens.data.alert.t -= dt;
        // chat
        const rate = Math.min(8, (chatters() * 2.1 / 60) * (0.55 + S2.hype / 100 * 0.9) * (S2.train > 0 ? 1.8 : 1) * (t < 8 ? 1.6 : 1));
        chatAcc += rate * dt;
        while (chatAcc >= 1) {
          chatAcc -= 1;
          const r = Math.random();
          let pool;
          if (t < 6 && r < 0.6) pool = LINES.hello;
          else if (S2.train > 0 && r < 0.5) pool = LINES.hypeTrain;
          else if (r < 0.3 && ctxLines.length) pool = pick(ctxLines);
          else if (r < 0.48) pool = LINES.genre[pick(game.tags)] || LINES.generic;
          else if (r < 0.55) pool = LINES.question;
          else pool = LINES.generic;
          addMsg(pick(pool).replace('{name}', s.profile.name), { badge: Math.random() < 0.12 ? 'sub' : Math.random() < 0.03 ? 'mod' : null });
        }
        S2.msgTimes = S2.msgTimes.filter((x) => t - x < 10);
        // random events
        S2.nextEvt -= dt;
        if (S2.nextEvt <= 0 && t < DUR - 4) {
          S2.nextEvt = rand(4.5, 7.5) * (S2.viewers < 25 ? 1.5 : 1);
          const roll = Math.random();
          const dChance = clamp(0.05 + S2.viewers * 0.004, 0.05, 0.45);
          if (roll < dChance) donation();
          else if (roll < dChance + 0.12) question();
          else if (roll < dChance + 0.12 + clamp(S2.viewers * 0.002, 0.02, 0.1)) troll();
          else if (roll < dChance + 0.3 && hasFeature(s, 'raids') && !S2.events.includes('raid') && t > 15) raid();
          else if (roll < dChance + 0.36 && s.gear.net <= 1 && !S2.events.includes('lag')) { S2.events.push('lag'); lag(); }
          else if (roll < dChance + 0.42 && hasCat) catCameo();
          else if (S2.viewers > 8 || Math.random() < 0.4) clipMoment();
        }
        // new followers show up in chat as they happen (one by one on small streams)
        if (Math.floor(S2.followers) > (S2.fShown || 0) && t - (S2.fT || 0) > (S2.viewers < 40 ? 3 : 8)) {
          const nf = Math.floor(S2.followers) - (S2.fShown || 0);
          S2.fShown = Math.floor(S2.followers); S2.fT = t;
          sys(nf > 1 ? `${ic('heart')} ${fmt(nf)} new followers` : `${ic('heart')} ${esc(randomUser())} followed`);
        }
        if (Math.random() < Math.min(0.2, S2.viewers * 0.0015) * dt * (S2.train > 0 ? 2.5 : 1)) subAlert();
        S2.subs += S2.viewers * 0.0004 * dt; // quiet memberships on bigger streams
        if (S2.train > 0 && Math.random() < dt * clamp(S2.viewers * 0.01, 0.15, 1.2)) donation();
        // UI
        R.vw.textContent = fmt(S2.viewers);
        R.fl.textContent = '+' + fmt(S2.followers);
        R.tm.textContent = `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
        R.rate.textContent = `${Math.round(S2.msgTimes.length * 6)} msg/min`;
        wTick();
        R.hbar.style.width = S2.hype + '%'; R.hv.textContent = Math.round(S2.hype) + '%';
        if (t > 15) { R.end.style.opacity = 1; R.end.style.pointerEvents = 'auto'; }
        drawGame(capx, 384, 216, W.screens.t, game, W.screens.data.fx);
        // occasional character reactions to chat
        if (Math.random() < dt * 0.06 && W.char.clip === 'sitGame') react('laugh');
        if (t >= DUR || S2.ended) { resolve(); return; }
        requestAnimationFrame(safe);
      };
      // an unexpected error ends the stream normally instead of freezing it
      const safe = (t) => { try { frame(t); } catch (e) { console.error('[recovered]', e); resolve(); } };
      requestAnimationFrame(safe);
    });
    removeEventListener('keydown', keyMap);
    S2.ended = true; this.live = null;
    W.room.setLive(false);
    addMsg('GG! thanks for watching :heart:', { user: s.profile.name, color: s.profile.accent, cls: 'me' });
    react('wave');
    await sleep(900);
    closeOverlay(el);
    A.setMusic(G.game.hour >= 21 || G.game.hour < 6 ? 'night' : 'chill');
    await this.summary(game, S2, base);
  },

  contextLines(game, st) {
    const s = G.s, out = [];
    if (s.gear.mic === 0) out.push(LINES.lowMic);
    if (s.gear.camera <= 1) out.push(LINES.lowCam);
    if (s.gear.net === 0) out.push(LINES.lowNet);
    if (s.gear.light === 0 && (G.game.hour > 19 || G.game.hour < 6)) out.push(LINES.dark);
    if (st.score > 55) out.push(LINES.goodGear);
    if (s.lastGear && s.lastGear.streams === s.stats.streams) out.push(LINES.newGear);
    if (s.needs.energy < 30) out.push(LINES.tired);
    if (s.needs.hunger < 30) out.push(LINES.hungry);
    if (s.videos[0]?.viral) out.push(LINES.viral);
    const tr = G.game.trend();
    if (game.tags.includes(tr.hot)) out.push(LINES.trend);
    const ev = G.game.currentEvent();
    if (ev.fx.genre ? game.tags.includes(ev.fx.genre) : true) out.push(LINES.event);
    return out;
  },

  async summary(game, S2, base) {
    const s = G.s, W = G.world;
    const avg = S2.sumV / Math.max(1, S2.t);
    const followers = Math.round(S2.followers);
    const subsMoney = Math.round(S2.subs * 2.5);
    const ads = Math.round(avg * 0.5 * (S2.t / 60) * (hasFeature(s, 'partner') ? 1.3 : 1));
    const money = Math.round(S2.donations + subsMoney + ads);
    const xp = Math.round((48 + S2.bigWins * 6 + S2.clips * 5) * (1 + 0.12 * (s.level - 1)));
    const vidSpill = Math.round(followers * 0.15);
    const ins = [];
    if (base.boost > 1) ins.push(['good', 'rocket', 'New streamer boost']);
    if (S2.events.includes('train')) ins.push(['hot', 'flame', 'Hype train!']);
    if (S2.events.includes('raid')) ins.push(['gold', 'rocket', 'Got raided']);
    if (S2.eng > 1.3) ins.push(['good', 'message', 'Chat loved this']);
    if (S2.mood < 0.55) ins.push(['bad', 'hammer', 'Trolls hurt the vibe']);
    if (S2.thanks >= 2) ins.push(['good', 'heart', 'Wholesome streamer']);
    if (base.gm.tags.includes('trending')) ins.push(['hot', 'trend', 'Trending game']);
    if (S2.events.includes('lag')) ins.push(['bad', 'wifi', 'Lag hurt retention']);
    if (base.nm.tags.length) ins.push(['bad', 'bolt', 'Low energy showed']);
    if (S2.clips) ins.push(['info', 'scissors', `${S2.clips} clip-worthy moment${S2.clips > 1 ? 's' : ''}`]);
    W.shot('deskWide');
    W.char.play('sitTalk'); W.char.setExpression('happy', 3);
    const el = overlay(`<div class="summary glass">
      <div class="row"><div class="live-badge" style="background:#3a3860;box-shadow:none">${ic('live')}STREAM ENDED</div><div class="grow"></div><span class="chip">${ic('gamepad')}${esc(game.name)}</span></div>
      <div class="res-head" style="margin-top:14px">${ic('pulse')} Peak viewers</div>
      <div class="res-big pk">0</div>
      <div class="insights"></div>
      <div class="res-stats">
        <div class="stat subs"><div class="sl">${ic('users')}New followers</div><div class="sv" data-k="f">+0</div></div>
        <div class="stat money"><div class="sl">${ic('dollar')}Donations &amp; subs</div><div class="sv" data-k="m">$0</div></div>
        <div class="stat xp"><div class="sl">${ic('star')}XP</div><div class="sv" data-k="x">+0</div></div>
        <div class="stat minor"><div class="sl">${ic('eye')}Avg viewers</div><div class="sv" data-k="a">0</div></div>
        <div class="stat minor"><div class="sl">${ic('message')}Chat messages</div><div class="sv" data-k="c">0</div></div>
        <div class="stat minor"><div class="sl">${ic('scissors')}Clips saved</div><div class="sv" data-k="cl">0</div></div>
      </div>
      <div class="row collect-row" style="margin-top:16px;justify-content:flex-end"><button class="btn go big shine" data-a="ok" disabled>${ic('check')}Collect</button></div></div>`);
    G.audio.sfx('whoosh');
    await Promise.all([
      countUp($('.pk', el), 0, S2.peak, 1500),
      countUp($('[data-k=f]', el), 0, followers, 1500, (v) => '+' + fmt(v)),
      countUp($('[data-k=m]', el), 0, money, 1500, fmtMoney),
      countUp($('[data-k=x]', el), 0, xp, 1300, (v) => '+' + fmt(v)),
      countUp($('[data-k=a]', el), 0, avg, 1300),
      countUp($('[data-k=c]', el), 0, S2.chatN, 1300),
      countUp($('[data-k=cl]', el), 0, S2.clips, 800),
      (async () => { const box = $('.insights', el); for (const [k, i2, txt] of ins.slice(0, 5)) { await sleep(300); box.appendChild(h(`<span class="chip ${k}">${ic(i2)}${txt}</span>`)); G.audio.sfx('pop'); } })(),
    ]);
    const ok = $('[data-a=ok]', el); ok.disabled = false;
    G.tutorial?.onResults?.(el);
    await new Promise((r) => bind(el, { ok: r }));
    const r = ok.getBoundingClientRect(), fp = { x: r.left + r.width / 2, y: r.top };
    G.game.addFans('pulse', followers, fp);
    G.game.addFans('vid', vidSpill, null, true);
    G.game.addMoney(money, fp);
    G.game.addXP(xp, fp);
    G.game.useBuff('xp2'); G.game.useBuff('wellfed');
    s.stats.streams++;
    const deal = (s.deals?.active || []).find((d) => d.req === 'stream');
    if (deal) G.meta.completeDeal(deal);
    s.stats.peakViewers = Math.max(s.stats.peakViewers, Math.round(S2.peak));
    s.stats.donations += S2.donations;
    s.gameUse[game.id] = clamp((s.gameUse[game.id] || 0) + 0.18, 0, 1);
    bus.emit('q', { evt: 'stream', n: 1, tags: game.tags });
    bus.emit('q', { evt: 'peak', n: Math.round(S2.peak), max: true });
    G.game.advance(3);
    G.audio.sfx('cash');
    closeOverlay(el);
    W.screens.setMode('main', 'desktop'); W.screens.setMode('laptop', 'desktop');
    await sleep(300);
    W.standUp(); W.shot('room');
    bus.emit('stream:done', { peak: S2.peak });
    G.meta.maybeTeaser(S2.events.includes('train') || S2.peak > 20);
  },
};
