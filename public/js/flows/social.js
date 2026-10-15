// Phone UI: social posting (Blip, Lumo), deals, inbox, delivery, homes and shortcuts.
import { G } from '../game/ctx.js';
import { bus } from '../core/bus.js';
import { $, $$, h, bind, ic, esc, toast, countUp, flash, anyModal } from '../ui/ui.js';
import { emotify } from '../ui/icons.js';
import { POST_TYPES, socialOutcome, totalFans, setupStats, dealPay } from '../game/economy.js';
import { hasFeature, FEATURES } from '../data/progression.js';
import { SOCIAL_REPLIES, INBOX, randomUser, USER_COLORS } from '../data/chat.js';
import { BRANDS, DEAL_TYPES } from '../data/sponsors.js';
import { FOODS, foodById } from '../data/food.js';
import { HOMES } from '../data/decor.js';
import { gameById } from '../data/games.js';
import { drawGame } from '../world/screens.js';
import { portrait } from './thumbs.js';
import { fmt, fmtMoney, clamp, pick, sleep, uid } from '../core/util.js';

const APPS = [
  { id: 'blip', name: 'Blip', icon: 'blip', bg: '#0e2b3d' },
  { id: 'lumo', name: 'Lumo', icon: 'lumo', bg: '#3d2210', feat: 'lumo' },
  { id: 'studio', name: 'Studio', icon: 'chart', bg: 'linear-gradient(135deg,#ff5a5f,#d42459)' },
  { id: 'deals', name: 'Deals', icon: 'handshake', bg: 'linear-gradient(135deg,#4fd37b,#1f9c52)', feat: 'deals' },
  { id: 'inbox', name: 'Inbox', icon: 'mail', bg: 'linear-gradient(135deg,#7aa2ff,#4a5fd6)', feat: 'inbox' },
  { id: 'delivery', name: 'Crumbs', icon: 'bag', bg: 'linear-gradient(135deg,#ff9f43,#e0601f)' },
  { id: 'homes', name: 'Homes', icon: 'home', bg: 'linear-gradient(135deg,#ffd577,#e0920b)' },
  { id: 'events', name: 'Events', icon: 'calendar', bg: 'linear-gradient(135deg,#b39bff,#ff4f8b)' },
  { id: 'collabs', name: 'Collabs', icon: 'users', bg: 'linear-gradient(135deg,#b48cff,#6236e0)', feat: 'collabs' },
  { id: 'team', name: 'Team', icon: 'team', bg: 'linear-gradient(135deg,#35dcff,#1f7fe0)', feat: 'team' },
  { id: 'quests', name: 'Quests', icon: 'target', bg: 'linear-gradient(135deg,#2fd6ff,#0b7fa3)' },
  { id: 'style', name: 'Style', icon: 'shirt', bg: 'linear-gradient(135deg,#ff7aa8,#ff3f7f)' },
];

export const Social = {
  open(app) {
    if (G.game.busy) return;
    G.game.run('phone', () => new Promise((resolve) => {
      const s = G.s, W = G.world;
      G.ui.hud.show(false);
      W.char.showProp('phone');
      if (W.charMode === 'sit') W.char.play('sitPhone'); else { W.char.play('phone'); if (W.charMode === 'idle') W.turnTo(0.5); }
      W.shot('char', { shift: innerWidth > 900 ? -0.17 : -0.2, dist: 3.6, yawAdd: -0.1 });
      G.audio.muffle(true);
      const wrap = h(`<div class="phone-wrap" style="justify-content:${innerWidth > 900 ? 'end' : 'end'};padding-right:${innerWidth > 900 ? '12vw' : '6vw'}"><div class="phone"><div class="notch"></div><div class="screen"></div></div></div>`);
      $('#screens').appendChild(wrap);
      const screen = $('.screen', wrap);
      const self = this;
      this.ctx = { wrap, screen, close };
      let closed = false;
      function close() {
        if (closed) return; closed = true;
        wrap.style.pointerEvents = 'none'; wrap.inert = true;
        wrap.classList.add('out');
        setTimeout(() => wrap.remove(), 200);
        W.char.showProp(null);
        if (W.charMode === 'sit') W.char.play('sit'); else W.char.play('idle');
        G.audio.muffle(false);
        W.shot('room');
        G.audio.sfx('close');
        self.ctx = null;
        resolve();
        if (self.after) { const f = self.after; self.after = null; G.game.queue(f); }
      }
      wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) close(); });
      G.audio.sfx('open');
      if (app) this.app(app); else this.home();
      G.tutorial?.onPhone?.(wrap);
    }));
  },
  status() {
    const m = Math.floor(G.s.clock.min), hh = Math.floor(m / 60) % 24, mm = m % 60;
    return `<div class="status"><span>${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')}</span><span class="row" style="gap:4px">${ic('wifi')}<span style="display:inline-block;width:22px;height:11px;border-radius:3px;border:1.5px solid #fff;position:relative"><i style="position:absolute;inset:1px;width:70%;background:#b6ff5c;border-radius:1px"></i></span></span></div>`;
  },
  home() {
    const s = G.s, sc = this.ctx.screen;
    const dots = { inbox: (s.inbox.list || []).filter((m) => !m.done).length, deals: (s.deals.offers || []).length && hasFeature(s, 'deals') ? s.deals.offers.length : 0 };
    sc.innerHTML = `${this.status()}
      <div class="phone-home-w"><div class="row" style="justify-content:space-between"><b class="display" style="font-size:15px">${esc(s.profile.name)}</b><span class="chip" style="padding:2px 8px">${ic('heart')}${fmt(totalFans(s))}</span></div>
        <div class="row" style="margin-top:10px;justify-content:space-between;font:800 14px var(--display)">
          <span class="row" style="gap:4px">${ic('vidora')}${fmt(s.fans.vid)}</span><span class="row" style="gap:4px">${ic('pulse')}${fmt(s.fans.pulse)}</span><span class="row" style="gap:4px">${ic('blip')}${fmt(s.fans.blip)}</span>${hasFeature(s, 'lumo') ? `<span class="row" style="gap:4px">${ic('lumo')}${fmt(s.fans.lumo)}</span>` : ''}</div></div>
      <div class="apps">${APPS.map((a) => { const locked = a.feat && !hasFeature(s, a.feat); const lvl = a.feat ? FEATURES.find((f) => f.id === a.feat).level : 0; return `<button class="app ${locked ? 'locked' : ''}" data-a="app" data-id="${a.id}"><div class="ai" style="background:${a.bg}">${ic(a.icon)}</div>${locked ? `<span class="lock">${ic('lock')}</span>` : ''}${dots[a.id] ? `<span class="dot" style="top:-4px;right:8px">${dots[a.id]}</span>` : ''}<span>${locked ? 'Lv ' + lvl : a.name}</span></button>`; }).join('')}</div>
      <div style="margin-top:auto;padding:12px;display:flex;justify-content:center"><button class="btn ghost small" data-a="close">${ic('close')}Close</button></div>`;
    bind(sc, {
      app: (b) => this.app(b.dataset.id),
      close: () => this.ctx?.close(),
    });
  },
  app(id) {
    const s = G.s;
    const a = APPS.find((x) => x.id === id);
    if (a?.feat && !hasFeature(s, a.feat)) { G.audio.sfx('error'); toast(`Unlocks at level ${FEATURES.find((f) => f.id === a.feat).level}`, { icon: 'lock', color: 'var(--violet)' }); return; }
    const external = { studio: () => G.meta.analytics(), events: () => G.meta.events(), collabs: () => G.meta.collabs(), team: () => G.meta.team(), quests: () => G.meta.quests(), style: () => G.life.wardrobe() };
    if (external[id]) { this.after = external[id]; this.ctx?.close(); return; }
    this[id]();
  },
  head(title, icon, extra = '') {
    return `${this.status()}<div class="app-head"><button class="xbtn" data-a="back" style="width:34px;height:34px">${ic('back')}</button><h3>${title}</h3>${extra}</div>`;
  },

  // ---------------------------------------------------------------- BLIP / LUMO
  blip() { this.feed('blip'); },
  lumo() { this.feed('lumo'); },
  feed(plat) {
    const s = G.s, sc = this.ctx.screen;
    const types = Object.entries(POST_TYPES).filter(([k, t]) => (plat === 'lumo') === !!t.lumo);
    const fat = s.socialFatigue || 0;
    const hasDeal = (s.deals.active || []).some((d) => d.req === (plat === 'lumo' ? 'lumo' : 'post'));
    sc.innerHTML = `${this.head(plat === 'blip' ? 'Blip' : 'Lumo', plat, `<span class="chip" style="padding:3px 8px">${ic(plat)}${fmt(s.fans[plat])}</span>`)}
      <div class="app-body">
        ${fat > 0.5 ? `<div class="chip bad" style="margin-bottom:8px">${ic('zzz')}Followers need a break — make content first</div>` : ''}
        <div class="tiny muted" style="font-weight:700;margin:4px 2px 8px;text-transform:uppercase;letter-spacing:.08em">New post</div>
        ${types.map(([k, t]) => {
          let locked = '', sub = t.desc;
          if (t.level && s.level < t.level) locked = `Lv ${t.level}`;
          if (k === 'clip' && s.clips <= 0) { locked = 'No clips'; sub = 'Clip moments while streaming'; }
          if (k === 'clip' && s.clips > 0) sub = `${s.clips} clip${s.clips > 1 ? 's' : ''} ready`;
          if (k === 'sponsored' && !hasDeal) { locked = 'No deal'; sub = 'Accept a deal in Deals'; }
          if (k === 'food' && !(s.lastMeal && s.lastMeal.premium && s.clock.day - s.lastMeal.day <= 1)) { locked = 'Eat well first'; sub = 'After a premium meal'; }
          if (plat === 'lumo' && k === 'setup' && hasDeal) sub = 'Also completes your Lumo deal';
          return `<button class="post-type ${locked ? 'locked' : ''}" data-a="${locked ? 'no' : 'post'}" data-k="${k}"><div class="pi" style="background:${t.color}">${ic(t.icon)}</div><div class="grow"><div class="pn">${t.name}</div><div class="pd">${sub}</div></div>${locked ? `<span class="chip" style="padding:2px 8px">${ic('lock')}${locked}</span>` : `<span class="chip" style="padding:2px 8px">${ic('bolt')}-3</span>`}</button>`;
        }).join('')}
        <div class="tiny muted" style="font-weight:700;margin:14px 2px 8px;text-transform:uppercase;letter-spacing:.08em">Your posts</div>
        <div class="myfeed">${(s.posts || []).filter((p) => p.plat === plat).slice(0, 5).map((p) => this.postHTML(p)).join('') || `<div class="muted tiny" style="padding:8px">No posts yet. Say hi!</div>`}</div>
      </div>`;
    bind(sc, {
      back: () => this.home(),
      no: () => G.audio.sfx('error'),
      post: (b) => this.post(plat, b.dataset.k),
    });
  },
  postHTML(p, imgHTML = '') {
    const s = G.s;
    return `<div class="feed-post" data-id="${p.id}"><div class="fp-h"><div class="fp-av">${G.ui.hud.portraitURL ? `<img src="${G.ui.hud.portraitURL}">` : ''}</div><div class="grow"><b style="font-size:14px">${esc(s.profile.name)}</b><div class="tiny muted">@${esc(s.profile.name.toLowerCase())} · ${p.day === s.clock.day ? 'today' : 'day ' + p.day}</div></div>${p.viral ? `<span class="chip hot" style="padding:2px 7px">${ic('flame')}Viral</span>` : ''}</div>
      ${imgHTML || (p.img ? `<div class="fp-img"><img src="${p.img}"></div>` : '')}<div class="fp-t">${emotify(esc(p.text))}</div>
      <div class="fp-s"><span class="hot">${ic('heart')}<b class="lk">${fmt(p.likes)}</b></span><span>${ic('undo')}<b class="rp">${fmt(p.reposts)}</b></span><span style="color:var(--lime)">${ic('users')}+<b class="fw">${fmt(p.followers)}</b></span></div><div class="replies"></div></div>`;
  },
  postText(type, plat) {
    const s = G.s;
    const g = gameById(s.games[s.games.length - 1]);
    const v = s.videos[0];
    const T = {
      update: [`grinding content today, what should I play next? :fire:`, `new setup who dis :cool:`, `thank you for ${fmt(totalFans(s))} fans!! :heart:`, `coffee + ${g?.name || 'games'} = perfect day`, `reading every comment rn :heart:`],
      selfie: [`fit check before the stream :cool:`, `lighting finally hits right`, `creator mode: ON`, `day ${s.clock.day} of building the dream`],
      announce: [`LIVE TONIGHT — ${g?.name || 'games'} marathon :fire:`, `stream at 8PM, be there!! :pog:`, `going live soon, bring snacks`],
      clip: [`this moment was INSANE :pog:`, `chat wanted this clip :lul:`, `I can't believe this happened live :skull:`],
      hottake: [`${g?.name || 'This game'} is overrated. Fight me.`, `controller > keyboard. no debate`, `speedruns are the best content, change my mind`],
      sponsored: [`teaming up with my favorite brand :heart: #ad`, `this changed my setup game #sponsored`],
      setup: [`setup tour! what should I upgrade next?`, `the glow up is real :fire:`, `clean desk, clear mind`],
      food: [`fuel for the stream :heart:`, `chef's kiss`, `post-stream feast`],
      outfit: [`today's fit :cool:`, `new merch idea??`],
      bts: [`behind the scenes of ${v ? '"' + v.title.slice(0, 26) + '…"' : 'my next video'}`, `editing until 3am again :skull:`],
    };
    return pick(T[type] || T.update);
  },
  async post(plat, type) {
    if (this.posting || !this.ctx) return;
    if (G.s.needs.energy < 3) { G.audio.sfx('error'); toast('Too tired to post', { icon: 'bolt', color: 'var(--red)' }); return; }
    const sc = this.ctx.screen;
    this.posting = true; sc.style.pointerEvents = 'none';
    try { await this.doPost(plat, type, sc); } finally { this.posting = false; sc.style.pointerEvents = ''; }
  },
  async doPost(plat, type, sc) {
    const s = G.s, W = G.world;
    const alive = () => this.ctx && this.ctx.screen === sc;
    // image
    let img = null;
    if (type === 'selfie' || type === 'outfit') {
      W.char.showProp(null); W.char.play('selfie', { restart: true }); W.char.setExpression('happy', 2);
      await sleep(600); G.audio.sfx('shutter'); flash();
      const c = document.createElement('canvas'); c.width = 320; c.height = 320;
      const x = c.getContext('2d');
      const gr = x.createLinearGradient(0, 0, 320, 320); gr.addColorStop(0, s.profile.accent); gr.addColorStop(1, '#2a1b5a');
      x.fillStyle = gr; x.fillRect(0, 0, 320, 320);
      x.globalAlpha = 0.25; for (let i = 0; i < 8; i++) { x.fillStyle = '#fff'; x.beginPath(); x.arc(Math.random() * 320, Math.random() * 320, 10 + Math.random() * 40, 0, 7); x.fill(); } x.globalAlpha = 1;
      x.drawImage(portrait(type === 'outfit' ? 'cool' : 'happy'), -10, 10, 340, 340);
      img = c; await sleep(300);
      if (!alive()) return;
      W.char.showProp('phone'); W.char.play(W.charMode === 'sit' ? 'sitPhone' : 'phone');
    } else if (type === 'clip') {
      s.clips = Math.max(0, s.clips - 1);
      const c = document.createElement('canvas'); c.width = 320; c.height = 180;
      const g = gameById(s.games[Math.floor(Math.random() * s.games.length)]);
      drawGame(c.getContext('2d'), 320, 180, Math.random() * 20, g, { hit: 0.9, fail: 0 });
      const x = c.getContext('2d'); x.fillStyle = '#ff4f8b'; x.fillRect(10, 10, 54, 22); x.fillStyle = '#fff'; x.font = 'bold 14px sans-serif'; x.fillText('CLIP', 20, 26);
      img = c;
    } else if (type === 'setup' || type === 'bts') {
      G.audio.sfx('shutter'); flash();
      img = W.snapshot(type === 'setup' ? 'room' : 'desk', 320, 240);
    } else if (type === 'food') {
      const c = document.createElement('canvas'); c.width = 320; c.height = 240;
      const x = c.getContext('2d'); const gr = x.createRadialGradient(160, 120, 10, 160, 120, 200); gr.addColorStop(0, '#ffe7c2'); gr.addColorStop(1, '#ff9f43'); x.fillStyle = gr; x.fillRect(0, 0, 320, 240);
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(160, 130, 110, 70, 0, 0, 7); x.fill(); x.fillStyle = '#f5c46b'; x.beginPath(); x.ellipse(160, 120, 80, 45, 0, 0, 7); x.fill();
      for (let i = 0; i < 9; i++) { x.fillStyle = ['#ff6b6b', '#4caf50', '#ffd166'][i % 3]; x.beginPath(); x.arc(110 + Math.random() * 100, 100 + Math.random() * 40, 9, 0, 7); x.fill(); }
      img = c;
    } else { G.audio.sfx('type'); }
    if (!alive()) return; // phone closed mid-post: nothing is charged
    const out = socialOutcome(s, type, s.socialFatigue || 0);
    const ev = G.game.currentEvent();
    out.followers = Math.round(out.followers * (ev.fx.followMult || 1));
    s.socialFatigue = (s.socialFatigue || 0) + 0.24;
    s.needs.energy = clamp(s.needs.energy - 3, 0, 100);
    const p = { id: uid(), plat, type, text: this.postText(type, plat), likes: 0, reposts: 0, followers: 0, day: s.clock.day, viral: out.viral, img: img ? img.toDataURL('image/jpeg', 0.7) : null };
    s.posts = s.posts || [];
    s.posts.unshift(p);
    if (s.posts.length > 20) s.posts.length = 20;
    s.posts.forEach((x, i) => { if (i > 5) x.img = null; });
    // show feed with animated counters
    G.audio.sfx('notify');
    const feed = $('.myfeed', sc);
    const pe = h(this.postHTML(p));
    feed.prepend(pe);
    pe.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $$('.post-type', sc).forEach((b) => (b.style.pointerEvents = 'none'));
    if (out.viral) { G.audio.sfx('viral'); W.addShake(0.6); }
    const reps = $('.replies', pe);
    const repTimer = setInterval(() => { const u = randomUser(); reps.appendChild(h(`<div class="reply"><b style="color:${pick(USER_COLORS)}">${esc(u)}</b> ${emotify(esc(pick(SOCIAL_REPLIES)))}</div>`)); while (reps.children.length > 3) reps.firstElementChild.remove(); G.audio.sfx('chat', 3); }, 450);
    await Promise.all([countUp($('.lk', pe), 0, out.likes, 1800), countUp($('.rp', pe), 0, out.reposts, 1800), countUp($('.fw', pe), 0, out.followers, 1800)]);
    clearInterval(repTimer);
    p.likes = out.likes; p.reposts = out.reposts; p.followers = out.followers;
    const r = pe.getBoundingClientRect();
    G.game.addFans(plat, out.followers, { x: r.left + r.width / 2, y: r.top + 40 });
    if (out.spill) G.game.addFans('vid', out.spill, null, true);
    G.game.addXP(out.xp);
    if (out.backlash) { s.mood = clamp(s.mood - 10, 0, 100); toast('Your hot take sparked drama', { icon: 'flame', color: '#ff7a2f', sub: 'Community mood dipped' }); }
    if (type === 'announce') { G.game.addBuff('announce', 1); toast('Next stream: +35% viewers', { icon: 'megaphone', color: 'var(--violet)' }); bus.emit('q', { evt: 'announce', n: 1 }); }
    if (type === 'sponsored' || (plat === 'lumo' && (s.deals.active || []).some((d) => d.req === 'lumo'))) {
      const d = s.deals.active.find((x) => x.req === (plat === 'lumo' ? 'lumo' : 'post'));
      if (d) G.meta.completeDeal(d);
    }
    s.stats.posts++;
    bus.emit('q', { evt: 'post', n: 1 });
    G.game.advance(0.25);
    await sleep(500);
    if (!this.ctx) return;
    $$('.post-type', sc).forEach((b) => (b.style.pointerEvents = ''));
    this.feed(plat);
  },

  // ---------------------------------------------------------------- DEALS
  deals() {
    const s = G.s, sc = this.ctx.screen;
    G.meta.refreshDeals();
    const D = s.deals;
    sc.innerHTML = `${this.head('Brand Deals', 'handshake', `<span class="chip good" style="padding:3px 8px">${D.done} done</span>`)}
      <div class="app-body">
        ${D.active.length ? `<div class="tiny muted" style="font-weight:700;margin:4px 2px 8px;text-transform:uppercase;letter-spacing:.08em">Active</div>${D.active.map((d) => this.dealHTML(d, true)).join('')}` : ''}
        <div class="tiny muted" style="font-weight:700;margin:10px 2px 8px;text-transform:uppercase;letter-spacing:.08em">Offers</div>
        ${D.offers.length ? D.offers.map((d) => this.dealHTML(d, false)).join('') : `<div class="muted tiny" style="padding:8px">New offers arrive as you grow. Check back after your next upload!</div>`}
      </div>`;
    bind(sc, {
      back: () => this.home(),
      acc: (b) => {
        const i = D.offers.findIndex((d) => d.id === b.dataset.id);
        if (D.active.length >= 2) { G.audio.sfx('error'); toast('Max 2 active deals', { icon: 'handshake', color: 'var(--red)' }); return; }
        const d = D.offers.splice(i, 1)[0];
        D.active.push(d);
        G.audio.sfx('cash');
        toast(`Deal signed with <b>${esc(d.brand)}</b>`, { icon: 'handshake', color: '#4fd37b', sub: d.text });
        this.deals();
      },
      dec: (b) => { D.offers = D.offers.filter((d) => d.id !== b.dataset.id); this.deals(); },
    });
  },
  dealHTML(d, active) {
    const b = BRANDS.find((x) => x.id === d.brandId);
    return `<div class="feed-post" style="animation:none"><div class="row"><div style="width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:${b.color};color:${b.ink};font:800 16px var(--display)">${b.mark}</div><div class="grow"><b class="display" style="font-size:16px">${esc(b.name)}</b><div class="tiny muted">${b.cat}</div></div><b class="display" style="color:var(--lime);font-size:18px">${fmtMoney(d.pay)}</b></div>
      <div class="row" style="margin-top:8px"><span class="chip">${ic(DEAL_TYPES.find((t) => t.req === d.req).icon)}${d.text}</span></div>
      ${active ? `<div class="tiny" style="margin-top:8px;color:var(--cyan);font-weight:700">${ic('info')} ${d.req === 'video' ? 'Toggle it on your next video' : d.req === 'stream' ? 'Completes on your next stream' : d.req === 'lumo' ? 'Post on Lumo' : 'Use "Sponsored Post" on Blip'}</div>` : `<div class="row" style="margin-top:10px"><button class="btn go small grow" data-a="acc" data-id="${d.id}">${ic('check')}Accept</button><button class="btn ghost small" data-a="dec" data-id="${d.id}">${ic('x')}</button></div>`}</div>`;
  },

  // ---------------------------------------------------------------- INBOX
  inbox() {
    const s = G.s, sc = this.ctx.screen;
    G.meta.genInbox();
    const list = s.inbox.list.filter((m) => !m.done);
    sc.innerHTML = `${this.head('Fan Inbox', 'mail', `<span class="chip" style="padding:3px 8px">${ic('heart')}Mood ${Math.round(s.mood)}</span>`)}
      <div class="app-body">${list.length ? list.map((m) => { const t = INBOX[m.t]; return `<div class="feed-post" style="animation:none"><div class="row"><div style="width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:${t.from === 'hater' ? 'var(--red)' : t.from === 'brand' ? 'var(--lime)' : 'var(--violet)'}">${ic(t.from === 'hater' ? 'flame' : t.from === 'brand' ? 'briefcase' : 'heart')}</div><b>${esc(m.user)}</b></div><div class="fp-t">${esc(t.text)}</div><div class="row" style="margin-top:8px">${t.replies.map((r, i) => `<button class="btn ${i ? 'ghost' : 'cyan'} small grow" data-a="rep" data-id="${m.id}" data-i="${i}">${ic(r[1])}${r[0]}</button>`).join('')}</div></div>`; }).join('') : `<div class="muted tiny" style="padding:8px">All caught up! New messages arrive daily.</div>`}</div>`;
    bind(sc, {
      back: () => this.home(),
      rep: (b) => {
        const m = s.inbox.list.find((x) => x.id === b.dataset.id);
        const t = INBOX[m.t], r = t.replies[+b.dataset.i];
        m.done = true;
        const k = r[2];
        s.mood = clamp(s.mood + (k > 0.8 ? 4 : k > 0.5 ? 1 : -6), 0, 100);
        const f = Math.round((5 + totalFans(s) * 0.004) * k);
        G.game.addFans('blip', f);
        G.game.addXP(6);
        G.audio.sfx(k > 0.6 ? 'reward' : 'pop');
        if (k < 0.5) toast('That reply caused some drama', { icon: 'flame', color: '#ff7a2f' });
        this.inbox();
      },
    });
  },

  // ---------------------------------------------------------------- DELIVERY
  delivery() {
    const s = G.s, sc = this.ctx.screen;
    const foods = FOODS.filter((f) => f.id !== 'espresso');
    sc.innerHTML = `${this.head('Crumbs', 'bag', `<span class="chip" style="padding:3px 8px">+$3 fee</span>`)}
      <div class="app-body">${foods.map((f) => { const locked = s.level < f.level; return `<button class="post-type ${locked ? 'locked' : ''}" data-a="${locked ? 'no' : 'order'}" data-id="${f.id}"><div class="pi" style="background:#ff9f43">${ic(f.icon)}</div><div class="grow"><div class="pn">${f.name}</div><div class="pd">${ic('burger')}+${f.hunger} ${ic('bolt')}+${f.energy}${f.buff ? ' · ' + (f.buff.id === 'focus' ? 'Focus buff' : 'Well Fed buff') : ''}</div></div>${locked ? `<span class="chip">${ic('lock')}Lv ${f.level}</span>` : `<span class="chip good">${fmtMoney(f.price + 3)}</span>`}</button>`; }).join('')}</div>`;
    bind(sc, {
      back: () => this.home(),
      no: () => G.audio.sfx('error'),
      order: (b) => {
        const f = foodById(b.dataset.id);
        if (!G.game.spend(f.price + 3)) return;
        toast(`Order placed: <b>${f.name}</b>`, { icon: 'bag', color: '#ff9f43', sub: 'Arriving soon...' });
        this.after = () => G.life.delivery(f);
        this.ctx?.close();
      },
    });
  },

  // ---------------------------------------------------------------- HOMES
  homes() {
    const s = G.s, sc = this.ctx.screen;
    sc.innerHTML = `${this.head('Homes', 'home')}
      <div class="app-body">${HOMES.map((hm) => { const own = s.home === hm.id, owned = s.homes.includes(hm.id), locked = s.level < hm.level; return `<div class="feed-post" style="animation:none"><div class="row"><div style="width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#ffd577,#e0920b);color:#2b1700">${ic('home')}</div><div class="grow"><b class="display" style="font-size:16px">${hm.name}</b><div class="tiny muted">${hm.size[0]}x${hm.size[1]}m · ${hm.slots.wall + hm.slots.floor} decor slots · x${hm.viewMult} reach</div></div></div>
        <div class="row" style="margin-top:8px">${own ? `<span class="chip good">${ic('check')}You live here</span>` : owned ? `<button class="btn cyan small grow" data-a="move" data-id="${hm.id}">${ic('home')}Move back</button>` : locked ? `<span class="chip">${ic('lock')}Level ${hm.level}</span>` : `<button class="btn amber small grow" data-a="buy" data-id="${hm.id}">${ic('home')}Buy ${fmtMoney(hm.price)}</button>`}</div></div>`; }).join('')}</div>`;
    bind(sc, {
      back: () => this.home(),
      buy: (b) => { const hm = HOMES[+b.dataset.id]; if (!G.game.spend(hm.price)) return; s.homes.push(hm.id); this.after = () => G.life.moveHome(hm.id, true); this.ctx?.close(); },
      move: (b) => { this.after = () => G.life.moveHome(+b.dataset.id, false); this.ctx?.close(); },
    });
  },
};
