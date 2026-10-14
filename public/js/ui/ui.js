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
export function bind(root, handlers) {
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || !root.contains(el)) return;
    const fn = handlers[el.dataset.a];
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
  const target = kind === 'xp' ? $('.avatar') : $(`.cur.${kind}`);
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

// ------------------------------------------------------------------ HUD
export class HUD {
  constructor() {
    this.el = $('#hud');
    this.disp = { money: 0, sparks: 0, fans: 0 };
    this.render();
  }
  render() {
    this.el.innerHTML = `
      <div class="hud-tl">
        <div class="profile glass" data-a="profile"><div class="avatar"><div class="face"></div><div class="lvl">1</div></div>
          <div><div class="nm"></div><div class="career"></div></div></div>
      </div>
      <div class="hud-tc"><div class="objective glass hidden"><div class="oi">${ic('target')}</div><div class="ot"></div><div class="op"></div></div></div>
      <div class="hud-tr">
        <div class="cur fans glass" data-a="analytics"><div class="ci">${ic('heart')}</div><span class="v">0</span></div>
        <div class="cur money glass" data-a="shop"><div class="ci">${ic('dollar')}</div><span class="v">$0</span></div>
        <div class="cur sparks glass" data-a="shopSparks"><div class="ci">${ic('spark')}</div><span class="v">0</span></div>
        <button class="icon-btn glass" data-a="settings">${ic('gear')}</button>
      </div>
      <div class="hud-l">
        <div class="need glass" data-a="kitchen" data-k="hunger" style="--nc:#ffb547"><div class="ring"></div>${ic('burger', 'ni')}<div class="nv">80</div></div>
        <div class="need glass" data-a="rest" data-k="energy" style="--nc:#35dcff"><div class="ring"></div>${ic('bolt', 'ni')}<div class="nv">90</div></div>
        <div class="clock glass">${ic('sun')}<span class="tm">10:00</span><span class="dy">Day 1</span></div>
      </div>
      <div class="hud-r">
        <button class="side-btn event-chip" data-a="events"><div class="et"></div><div class="em"><span class="ep"></span><span class="etm"></span></div><div class="bar"><i style="width:0%"></i></div></button>
        <button class="side-btn glass trend-chip" data-a="library"><div class="si">${ic('flame')}</div><span class="lbl tr-t">Trending</span></button>
        <button class="side-btn glass" data-a="quests"><div class="si" style="background:rgba(53,220,255,.15);color:var(--cyan)">${ic('target')}</div><span class="lbl">Quests</span><span class="q-n chip" style="padding:2px 8px">0/3</span></button>
        <button class="side-btn glass" data-a="daily"><div class="si" style="background:rgba(255,194,75,.16);color:var(--amber)">${ic('gift')}</div><span class="lbl">Daily</span></button>
      </div>
      <div class="goal glass" data-a="goal"><div class="gi">${ic('cart')}</div><div class="grow" style="min-width:0"><div class="gl">Next upgrade</div><div class="gn">—</div><div class="bar"><i style="width:0%"></i></div></div></div>
      <div class="dock glass">
        <button class="dock-btn" data-a="phone">${ic('phone')}<span>Phone</span></button>
        <button class="dock-btn" data-a="shop">${ic('cart')}<span>Shop</span></button>
        <button class="dock-btn main" data-a="create">${ic('play')}<span>CREATE</span></button>
        <button class="dock-btn" data-a="kitchen">${ic('food')}<span>Kitchen</span></button>
        <button class="dock-btn" data-a="rest">${ic('bed')}<span>Rest</span></button>
      </div>`;
    bind(this.el, {
      profile: () => G.game.openProfile(), analytics: () => G.game.openAnalytics(), shop: () => G.game.openShop(), shopSparks: () => G.game.openShop('decor'),
      settings: () => G.game.openSettings(), kitchen: () => G.game.doKitchen(), rest: () => G.game.doRest(), events: () => G.game.openEvents(),
      library: () => G.game.openLibrary(), quests: () => G.game.openQuests(), daily: () => G.game.openDaily(), goal: () => G.game.openGoal(),
      phone: () => G.game.openPhone(), create: () => G.game.doCreate(),
    });
    this.refs = {
      face: $('.avatar .face', this.el), lvl: $('.avatar .lvl', this.el), avatar: $('.avatar', this.el), nm: $('.profile .nm', this.el), career: $('.profile .career', this.el),
      obj: $('.objective', this.el), objT: $('.objective .ot', this.el), objP: $('.objective .op', this.el), objI: $('.objective .oi', this.el),
      money: $('.cur.money .v', this.el), sparks: $('.cur.sparks .v', this.el), fans: $('.cur.fans .v', this.el),
      hunger: $('.need[data-k=hunger]', this.el), energy: $('.need[data-k=energy]', this.el),
      clockI: $('.clock', this.el), tm: $('.clock .tm', this.el), day: $('.clock .dy', this.el),
      ev: $('.event-chip', this.el), trend: $('.trend-chip', this.el), qn: $('.q-n', this.el), daily: $('[data-a=daily]', this.el), quests: $('[data-a=quests]', this.el),
      goal: $('.goal', this.el),
    };
    const s = G.s;
    this.disp = { money: s.money, sparks: s.sparks, fans: totalFans(s) };
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
    const el = $(`.cur.${kind}`, this.el);
    if (!el || !amount) return;
    const d = h(`<div class="delta" style="color:${amount < 0 ? '#ff8f99' : kind === 'fans' ? 'var(--pink2)' : kind === 'sparks' ? 'var(--cyan)' : 'var(--lime)'}">${amount > 0 ? '+' : ''}${kind === 'money' ? fmtMoney(amount) : fmt(amount)}</div>`);
    el.appendChild(d);
    setTimeout(() => d.remove(), 1400);
  }
  highlight(sel, on = true) { $$('.hl', this.el).forEach((e) => e.classList.remove('hl')); if (on && sel) $(sel, this.el)?.classList.add('hl'); }
  update(dt) {
    const s = G.s, r = this.refs;
    const k = 1 - Math.exp(-8 * dt);
    const tf = totalFans(s);
    for (const [key, val] of [['money', s.money], ['sparks', s.sparks], ['fans', tf]]) {
      const d = this.disp[key];
      this.disp[key] = Math.abs(val - d) < 0.5 ? val : d + (val - d) * k;
    }
    r.money.textContent = fmtMoney(this.disp.money);
    r.sparks.textContent = fmt(this.disp.sparks);
    r.fans.textContent = fmt(this.disp.fans);
    const need = (el, v) => { el.style.setProperty('--v', Math.round(v)); el.querySelector('.nv').textContent = Math.round(v); el.classList.toggle('low', v < 25); };
    need(r.hunger, s.needs.hunger); need(r.energy, s.needs.energy);
    const lvl = s.level, need2 = xpForLevel(lvl);
    r.avatar.style.setProperty('--p', Math.round((s.xp / need2) * 100));
    r.lvl.textContent = lvl;
    r.nm.textContent = s.profile.name;
    r.career.textContent = s.profile.title || careerTitle(lvl);
    const m = Math.floor(s.clock.min), hh = Math.floor(m / 60) % 24, mm = m % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM', h12 = ((hh + 11) % 12) + 1;
    r.tm.textContent = `${h12}:${String(mm - (mm % 5)).padStart(2, '0')}`;
    r.day.textContent = `Day ${s.clock.day} ${ampm}`;
    const night = hh >= 19 || hh < 6;
    if (this._night !== night) { this._night = night; r.clockI.firstElementChild.outerHTML = ic(night ? 'moon' : 'sun'); }
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
    const e = h(`<div class="wbubble glass ${cls}" style="left:${p.x}px;top:${p.y}px">${html}</div>`);
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
    for (const { e, obj } of this.markers.values()) {
      const p = w.toScreen(obj.userData.labelPoint ? obj.userData.labelPoint : w.objTop(obj, 0.25));
      e.style.left = p.x + 'px'; e.style.top = p.y + 'px';
      e.style.display = p.visible ? '' : 'none';
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
