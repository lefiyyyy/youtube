// UI framework: DOM helpers, modals, toasts, HUD, reward fly-ins, world labels.
import { ic, esc } from './icons.js';
import { G } from '../game/ctx.js';
import { bus } from '../core/bus.js';
import { fmt, fmtMoney, clamp, sleep, isTouch } from '../core/util.js';
import { careerTitle, xpForLevel } from '../data/progression.js';
import { totalFans } from '../game/economy.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
// Delegated click handling: elements with data-a="name" call handlers[name](el, event)
// Re-binding the same root replaces its handler map (screens like the phone re-render in place).
export function bind(root, handlers) {
  const first = !root._bindH;
  root._bindH = handlers;
  if (!first) return root;
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || !root.contains(el)) return;
    const fn = root._bindH[el.dataset.a];
    if (fn) { e.stopPropagation(); if (!el.dataset.silent) G.audio?.sfx('click'); fn(el, e); }
  });
  return root;
}

const modalStack = [];
export function modal({ title, sub, icon = 'star', iconBg, body, size = '', foot, onClose, clear = false, noClose = false, cls = '' }) {
  const wrap = h(`<div class="modal-wrap ${clear ? 'clear' : ''}"><div class="modal glass ${size} ${cls} ${title ? '' : 'bare'}">
    ${title ? `<div class="mh"><div class="mi" style="${iconBg ? `background:${iconBg}` : ''}">${ic(icon)}</div><div class="grow"><h2>${title}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${noClose ? '' : `<button class="xbtn" data-x>${ic('close')}</button>`}</div>` : ''}
    <div class="mb"></div>${foot ? `<div class="mf"></div>` : ''}</div></div>`);
  const mb = $('.mb', wrap);
  if (typeof body === 'string') mb.innerHTML = body; else if (body) mb.appendChild(body);
  if (foot) { const mf = $('.mf', wrap); if (typeof foot === 'string') mf.innerHTML = foot; else mf.appendChild(foot); }
  const m = {
    el: wrap, body: mb, closed: false,
    close(silent) {
      if (m.closed) return; m.closed = true;
      wrap.classList.add('out');
      setTimeout(() => wrap.remove(), 200);
      const i = modalStack.indexOf(m); if (i >= 0) modalStack.splice(i, 1);
      if (!silent) G.audio?.sfx('close');
      onClose && onClose();
      bus.emit('ui:modalClosed');
    },
  };
  if (!noClose) {
    $('[data-x]', wrap)?.addEventListener('click', () => m.close());
    wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap && !clear) m.close(); });
  }
  $('#modals').appendChild(wrap);
  modalStack.push(m);
  G.audio?.sfx('open');
  return m;
}
export const anyModal = () => modalStack.length > 0;
export function closeAllModals() { [...modalStack].forEach((m) => m.close(true)); }
export function topModal() { return modalStack[modalStack.length - 1]; }

export function toast(text, { icon = 'info', color = 'var(--pink)', sub = '', dur = 2600 } = {}) {
  const t = h(`<div class="toast glass"><div class="ti" style="--tc:${color}">${ic(icon)}</div><div>${text}${sub ? `<small>${sub}</small>` : ''}</div></div>`);
  const box = $('#toasts');
  box.appendChild(t);
  while (box.children.length > 4) box.firstElementChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, dur);
}

// Floating text at screen pos
export function floatText(x, y, text, color = '#fff') {
  const e = h(`<div class="float-txt" style="left:${x}px;top:${y}px;color:${color}">${text}</div>`);
  $('#fx').appendChild(e);
  setTimeout(() => e.remove(), 1400);
}
export function flash() { const f = h('<div class="flash"></div>'); $('#fx').appendChild(f); setTimeout(() => f.remove(), 600); }

// Reward fly-in from a point to a HUD counter
const ICON_FOR = { money: 'dollar', xp: 'star', fans: 'heart', sparks: 'spark' };
export function fly(kind, from, n = 8) {
  const target = kind === 'xp' ? $('.avatar') : kind === 'fans' ? $('#hud .subs') : $(`.cur.${kind}`);
  if (!target) return Promise.resolve();
  const tr = target.getBoundingClientRect();
  const tx = tr.left + tr.width / 2, ty = tr.top + tr.height / 2;
  const fx = $('#fx');
  const fr = from || { x: innerWidth / 2, y: innerHeight / 2 };
  const ps = [];
  for (let i = 0; i < n; i++) {
    const el = h(`<div class="fly ${kind}">${ic(ICON_FOR[kind])}</div>`);
    fx.appendChild(el);
    const sx = fr.x + (Math.random() - 0.5) * 120, sy = fr.y + (Math.random() - 0.5) * 80;
    const mx = (sx + tx) / 2 + (Math.random() - 0.5) * 200, my = Math.min(sy, ty) - 60 - Math.random() * 120;
    const anim = el.animate([
      { transform: `translate(${fr.x - 15}px, ${fr.y - 15}px) scale(0.2)`, opacity: 0 },
      { transform: `translate(${sx - 15}px, ${sy - 15}px) scale(1.1)`, opacity: 1, offset: 0.25 },
      { transform: `translate(${mx - 15}px, ${my - 15}px) scale(1)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${tx - 15}px, ${ty - 15}px) scale(0.6)`, opacity: 0.9 },
    ], { duration: 900 + i * 45, easing: 'cubic-bezier(.5,0,.4,1)', fill: 'forwards' });
    ps.push(anim.finished.then(() => { el.remove(); if (i % 2 === 0) G.audio?.sfx(kind === 'money' ? 'coin' : 'pop'); target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump'); }));
  }
  return Promise.all(ps);
}

export function countUp(el, from, to, dur = 1200, f = fmt) {
  return new Promise((res) => {
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp((t - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = f(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}

// ------------------------------------------------------------------ ODOMETER
// Rolling-digit counter (each digit is a vertical strip that slides to its value).
export class Odometer {
  constructor(el) { this.el = el; this.v = null; this.str = ''; }
  set(v) {
    v = Math.max(0, Math.floor(v));
    if (v === this.v) return;
    this.v = v;
    const str = v.toLocaleString('en-US');
    if (str.length !== this.str.length) {
      this.el.innerHTML = [...str].map((ch) => (ch === ',' ? '<span class="od-sep">,</span>' : `<span class="od-d"><span class="od-s">${'0123456789'.split('').map((d) => `<i>${d}</i>`).join('')}</span></span>`)).join('');
      this.strips = [...this.el.querySelectorAll('.od-s')];
    }
    this.str = str;
    const digits = str.replace(/,/g, '');
    this.strips.forEach((s, i) => { s.style.transform = `translateY(${-+digits[i] * 10}%)`; });
  }
}

// ------------------------------------------------------------------ HUD
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export class HUD {
  constructor() {
    this.el = $('#hud');
    this.disp = { money: 0, sparks: 0, fans: 0 };
    this.render();
  }
  render() {
    this.el.innerHTML = `
      <div class="hud-tl">
        <div class="pcard glass" data-a="profile">
          <div class="avatar"><div class="face"></div><div class="lvl">1</div></div>
          <div class="pc-t"><div class="nm"></div><div class="career"></div><div class="xpb"><i></i></div></div>
        </div>
        <div class="status glass">
          <div class="clock"><span class="ck-i">${ic('sun')}</span><b class="tm">10:00</b><span class="dy">Mon · Day 1</span></div>
          <button class="need" data-a="kitchen" data-k="hunger" style="--nc:#ffb547">${ic('burger', 'ni')}<span class="nl">Hunger</span><span class="nb"><i></i></span><b class="nv">80</b></button>
          <button class="need" data-a="rest" data-k="energy" style="--nc:#3cc8ff">${ic('bolt', 'ni')}<span class="nl">Energy</span><span class="nb"><i></i></span><b class="nv">90</b></button>
        </div>
      </div>
      <div class="hud-tc">
        <button class="subs" data-a="analytics">
          <span class="sb-l">${ic('vidora')}<span>Subscribers</span></span>
          <span class="odo"></span>
          <span class="sb-sub"><span class="sb-v">${ic('eye')}<b>0</b> views</span><span class="sb-r"></span></span>
        </button>
        <div class="objective glass hidden"><div class="oi">${ic('target')}</div><div class="ot"></div><div class="op"></div></div>
      </div>
      <div class="hud-tr">
        <div class="cur money glass" data-a="shop"><div class="ci">${ic('dollar')}</div><span class="v">$0</span></div>
        <div class="cur sparks glass" data-a="shopSparks"><div class="ci">${ic('spark')}</div><span class="v">0</span></div>
        <button class="icon-btn glass" data-a="settings">${ic('gear')}</button>
      </div>
      <div class="hud-r">
        <button class="side-btn event-chip" data-a="events"><div class="et"></div><div class="em"><span class="ep"></span><span class="etm"></span></div><div class="bar"><i style="width:0%"></i></div></button>
        <button class="tile glass trend-chip" data-a="library"><span class="ti2">${ic('flame')}</span><span class="lbl tr-t">Trending</span></button>
        <button class="tile glass" data-a="quests"><span class="ti2" style="color:var(--cyan)">${ic('target')}</span><span class="lbl">Quests</span><span class="q-n chip">0/3</span></button>
        <button class="tile glass" data-a="daily"><span class="ti2" style="color:var(--amber)">${ic('gift')}</span><span class="lbl">Daily</span></button>
        <button class="tile glass goal" data-a="goal"><span class="ti2 gi">${ic('cart')}</span><span class="g-t"><span class="gl">Next upgrade</span><span class="gn">—</span><span class="bar"><i style="width:0%"></i></span></span></button>
      </div>
      <button class="latest glass hidden" data-a="analytics">
        <span class="lt-th"><img alt=""><span class="lt-live">LIVE</span></span>
        <span class="lt-b"><span class="lt-h">Latest upload</span><span class="lt-t"></span>
          <span class="lt-s"><span>${ic('eye')}<b class="lt-v">0</b></span><span>${ic('thumb')}<b class="lt-l">0</b></span><span class="lt-up"></span></span></span>
      </button>
      <div class="dock glass">
        <button class="dock-btn" data-a="phone">${ic('phone')}<span>Phone</span></button>
        <button class="dock-btn" data-a="shop">${ic('cart')}<span>Shop</span></button>
        <button class="dock-btn main" data-a="create">${ic('play')}<span>Create</span></button>
        <button class="dock-btn" data-a="out">${ic('map')}<span>Go Out</span></button>
        <button class="dock-btn" data-a="kitchen">${ic('food')}<span>Kitchen</span></button>
        <button class="dock-btn" data-a="rest">${ic('bed')}<span>Rest</span></button>
      </div>`;
    bind(this.el, {
      profile: () => G.game.openProfile(), analytics: () => G.game.openAnalytics(), shop: () => G.game.openShop(), shopSparks: () => G.game.openShop('decor'),
      settings: () => G.game.openSettings(), kitchen: () => G.game.doKitchen(), rest: () => G.game.doRest(), events: () => G.game.openEvents(),
      library: () => G.game.openLibrary(), quests: () => G.game.openQuests(), daily: () => G.game.openDaily(), goal: () => G.game.openGoal(),
      phone: () => G.game.openPhone(), create: () => G.game.doCreate(), out: () => G.game.goOut(),
    });
    this.refs = {
      face: $('.avatar .face', this.el), lvl: $('.avatar .lvl', this.el), avatar: $('.avatar', this.el), nm: $('.pcard .nm', this.el), career: $('.pcard .career', this.el), xpb: $('.pcard .xpb i', this.el),
      obj: $('.objective', this.el), objT: $('.objective .ot', this.el), objP: $('.objective .op', this.el), objI: $('.objective .oi', this.el),
      money: $('.cur.money .v', this.el), sparks: $('.cur.sparks .v', this.el),
      hunger: $('.need[data-k=hunger]', this.el), energy: $('.need[data-k=energy]', this.el),
      clockI: $('.clock .ck-i', this.el), tm: $('.clock .tm', this.el), day: $('.clock .dy', this.el),
      ev: $('.event-chip', this.el), trend: $('.trend-chip', this.el), qn: $('.q-n', this.el), daily: $('[data-a=daily]', this.el), quests: $('[data-a=quests]', this.el),
      goal: $('.goal', this.el), views: $('.sb-v b', this.el), rate: $('.sb-r', this.el),
      latest: $('.latest', this.el), ltImg: $('.latest img', this.el), ltT: $('.lt-t', this.el), ltV: $('.lt-v', this.el), ltL: $('.lt-l', this.el), ltUp: $('.lt-up', this.el), ltLive: $('.lt-live', this.el),
    };
    this.odo = new Odometer($('.odo', this.el));
    const s = G.s;
    this.disp = { money: s.money, sparks: s.sparks, fans: s.fans.vid, views: s.stats.views };
    this.odo.set(s.fans.vid);
    this.rateHist = [];
    this.setPortrait();
  }
  setPortrait() {
    try {
      const c = G.world.portrait('happy', 160);
      this.refs.face.innerHTML = '';
      this.refs.face.appendChild(c);
      this.portraitURL = c.toDataURL();
    } catch (e) { console.warn(e); }
  }
  show(v) { this.el.classList.toggle('away', !v); }
  setObjective(o) {
    const r = this.refs;
    if (!o) { r.obj.classList.add('hidden'); return; }
    const changed = r.objT.textContent !== o.text;
    r.obj.classList.remove('hidden');
    r.obj.classList.toggle('tut', !!o.tut);
    r.objT.textContent = o.text;
    r.objP.textContent = o.progress || '';
    r.objI.innerHTML = ic(o.icon || 'target');
    r.objI.style.background = o.color || '';
    if (changed) { r.obj.classList.remove('pop'); void r.obj.offsetWidth; r.obj.classList.add('pop'); }
  }
  delta(kind, amount) {
    const el = kind === 'fans' ? $('.subs', this.el) : $(`.cur.${kind}`, this.el);
    if (!el || !amount) return;
    const d = h(`<div class="delta" style="color:${amount < 0 ? '#ff8f99' : kind === 'fans' ? 'var(--pink2)' : kind === 'sparks' ? 'var(--cyan)' : 'var(--lime)'}">${amount > 0 ? '+' : ''}${kind === 'money' ? fmtMoney(amount) : fmt(amount)}</div>`);
    el.appendChild(d);
    setTimeout(() => d.remove(), 1400);
  }
  highlight(sel, on = true) { $$('.hl', this.el).forEach((e) => e.classList.remove('hl')); if (on && sel) $(sel, this.el)?.classList.add('hl'); }
  update(dt) {
    const s = G.s, r = this.refs;
    const k = 1 - Math.exp(-6 * dt);
    for (const [key, val] of [['money', s.money], ['sparks', s.sparks], ['fans', s.fans.vid], ['views', s.stats.views]]) {
      const d = this.disp[key];
      this.disp[key] = Math.abs(val - d) < 0.5 ? val : d + (val - d) * k;
    }
    r.money.textContent = fmtMoney(this.disp.money);
    r.sparks.textContent = fmt(this.disp.sparks);
    this.odo.set(this.disp.fans);
    r.views.textContent = fmt(this.disp.views);
    // subscriber rate over the last ~10 real seconds (shown as per in-game hour)
    this.rateT = (this.rateT || 0) + dt;
    if (this.rateT > 1) {
      this.rateT = 0;
      this.rateHist.push([s.clock.day * 1440 + s.clock.min, s.fans.vid]);
      if (this.rateHist.length > 12) this.rateHist.shift();
      const a = this.rateHist[0], b = this.rateHist[this.rateHist.length - 1];
      const per = b[0] > a[0] ? ((b[1] - a[1]) / (b[0] - a[0])) * 60 : 0;
      r.rate.innerHTML = per >= 1 ? `<span class="up">${ic('trend')}+${fmt(per)}/h</span>` : '';
      this.updateLatest();
    }
    const need = (el, v) => { el.style.setProperty('--v', Math.round(v) + '%'); el.querySelector('.nv').textContent = Math.round(v); el.classList.toggle('low', v < 25); };
    need(r.hunger, s.needs.hunger); need(r.energy, s.needs.energy);
    const lvl = s.level, need2 = xpForLevel(lvl);
    r.avatar.style.setProperty('--p', Math.round((s.xp / need2) * 100));
    r.xpb.style.width = Math.round((s.xp / need2) * 100) + '%';
    r.lvl.textContent = lvl;
    r.nm.textContent = s.profile.name;
    r.career.textContent = s.profile.title || careerTitle(lvl);
    const m = Math.floor(s.clock.min), hh = Math.floor(m / 60) % 24, mm = m % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM', h12 = ((hh + 11) % 12) + 1;
    const tmS = `${h12}:${String(mm - (mm % 5)).padStart(2, '0')}<small>${ampm}</small>`;
    if (this._tm !== tmS) { this._tm = tmS; r.tm.innerHTML = tmS; r.day.textContent = `${DAYS[(s.clock.day - 1) % 7]} · Day ${s.clock.day}`; }
    const night = hh >= 19 || hh < 6;
    if (this._night !== night) { this._night = night; r.clockI.innerHTML = ic(night ? 'moon' : 'sun'); r.clockI.classList.toggle('night', night); }
  }
  updateLatest() {
    const s = G.s, r = this.refs, v = s.videos[0];
    if (!v) { r.latest.classList.add('hidden'); return; }
    r.latest.classList.remove('hidden');
    if (r.ltImg.dataset.id !== v.id) { r.ltImg.dataset.id = v.id; if (v.thumb) r.ltImg.src = v.thumb; r.ltT.textContent = v.title; }
    r.ltV.textContent = fmt(v.views);
    r.ltL.textContent = fmt(v.likes);
    const growing = v.V !== undefined && v.views < v.V * 0.995;
    r.ltLive.style.display = growing ? '' : 'none';
    const prev = this._ltPrev || 0;
    this._ltPrev = v.views;
    r.ltUp.innerHTML = growing && v.views > prev && prev ? `<span class="up">${ic('trend')}+${fmt(v.views - prev)}</span>` : '';
  }
}

// ------------------------------------------------------------------ WORLD LABELS
export class Labels {
  constructor() {
    this.el = $('#labels');
    this.hoverEl = h(`<div class="wlabel glass"><div class="li"></div><span></span></div>`);
    this.el.appendChild(this.hoverEl);
    this.markers = new Map();
    this.hover = null;
    bus.on('world:hover', (it) => { this.hover = it; this.hoverEl.classList.toggle('on', !!it); if (it) { $('span', this.hoverEl).textContent = it.label; $('.li', this.hoverEl).innerHTML = ic(it.icon); } });
  }
  marker(id, obj, icon = 'down') {
    if (this.markers.has(id)) return;
    const e = h(`<div class="wmarker">${ic(icon)}</div>`);
    this.el.appendChild(e);
    this.markers.set(id, { e, obj });
  }
  clearMarker(id) { const m = this.markers.get(id); if (m) { m.e.remove(); this.markers.delete(id); } }
  clearMarkers() { for (const id of [...this.markers.keys()]) this.clearMarker(id); }
  bubble(obj, html, cls = '') {
    const w = G.world;
    const p = w.toScreen(w.objTop(obj, 0.15));
    const x = clamp(p.x, 110, innerWidth - 110), y = clamp(p.y, 70, innerHeight - 40);
    const e = h(`<div class="wbubble glass ${cls}" style="left:${x}px;top:${y}px">${html}</div>`);
    this.el.appendChild(e);
    setTimeout(() => e.remove(), 2500);
  }
  update() {
    const w = G.world;
    if (this.hover) {
      const o = this.hover.obj;
      const p = w.toScreen(o.userData.labelPoint ? o.userData.labelPoint : w.objTop(o, 0.1));
      this.hoverEl.style.left = p.x + 'px'; this.hoverEl.style.top = p.y + 'px';
    }
    const busy = !!G.game?.busy;
    for (const { e, obj } of this.markers.values()) {
      const p = w.toScreen(obj.userData.labelPoint ? obj.userData.labelPoint : w.objTop(obj, 0.25));
      e.style.left = p.x + 'px'; e.style.top = p.y + 'px';
      e.style.display = p.visible && !busy ? '' : 'none';
    }
  }
}

// Tutorial pointer hand over an element
let handEl = null;
export function pointAt(target) {
  if (handEl) { handEl.remove(); handEl = null; }
  if (!target) return;
  const r = target.getBoundingClientRect();
  handEl = h(`<svg class="pointer-hand" viewBox="0 0 24 24" fill="#fff" stroke="#1a1830" stroke-width="1.4" stroke-linejoin="round"><path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l.2-1.2a1.5 1.5 0 0 1 3 .2V11l.2-.7a1.5 1.5 0 0 1 2.9.7v4a7 7 0 0 1-7 7h-.6a6 6 0 0 1-4.9-2.6L3.6 15.2a1.6 1.6 0 0 1 2.5-2L9 15z"/></svg>`);
  handEl.style.left = r.left + r.width * 0.55 + 'px';
  handEl.style.top = r.top + r.height * 0.55 + 'px';
  $('#fx').appendChild(handEl);
}
export { ic, esc };
