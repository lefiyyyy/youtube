// Shop: setup gear (visible installs), decor, games, room styles & cosmetics, homes.
import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { bus } from '../core/bus.js';
import { $, $$, h, bind, ic, esc, modal, toast } from '../ui/ui.js';
import { GEAR } from '../data/gear.js';
import { DECOR, THEMES, HOMES, ACCENTS, decorById } from '../data/decor.js';
import { GAMES, GENRES, gameById } from '../data/games.js';
import { COSMETICS } from '../data/rewards.js';
import { gameCover } from '../world/screens.js';
import { genreTags, trendRibbon } from './create.js';
import { setupStats } from '../game/economy.js';
import { fmt, fmtMoney, sleep, clamp } from '../core/util.js';

const STAT_N = { vq: 'Video', aq: 'Audio', sq: 'Stream', cq: 'Camera', comfort: 'Comfort', vibe: 'Vibe' };
const TABS = [['gear', 'cpu', 'Setup'], ['decor', 'paint', 'Decor'], ['games', 'gamepad', 'Games'], ['style', 'layers', 'Style'], ['homes', 'home', 'Homes']];

export const Shop = {
  open(tab = 'gear', focus = null, inline = false) {
    if (G.game.busy && !inline) return Promise.resolve();
    this.tab = inline ? 'games' : tab;
    this.focus = focus;
    this.inline = inline;
    return new Promise((res) => {
      const body = h(`<div><div class="tabs">${TABS.filter((t) => !inline || t[0] === 'games').map(([k, i, n]) => `<button class="tab ${k === this.tab ? 'on' : ''}" data-a="tab" data-k="${k}">${ic(i)}${n}</button>`).join('')}</div><div class="shop-c"></div></div>`);
      const st = setupStats(G.s);
      this.m = modal({ title: 'Shop', sub: `${ic('sparkle')} Setup score <b style="color:var(--cyan)">${st.score}</b> · Vibe <b style="color:var(--pink2)">${st.vibeScore}</b>`, icon: 'cart', iconBg: 'linear-gradient(135deg,#6fe7ff,#25c6f2)', body, size: 'lg', onClose: () => res() });
      bind(body, {
        tab: (b) => { this.tab = b.dataset.k; $$('.tab', body).forEach((t) => t.classList.toggle('on', t === b)); G.audio.sfx('tab'); this.render(); },
        buyGear: (b) => this.buyGear(b.dataset.k),
        buyDecor: (b) => this.buyDecor(b.dataset.id),
        place: (b) => this.togglePlace(b.dataset.id),
        buyGame: (b) => this.buyGame(b.dataset.id),
        buyTheme: (b) => this.buyTheme(b.dataset.id),
        useTheme: (b) => this.useTheme(b.dataset.id),
        equip: (b) => this.equip(b.dataset.id),
        accent: (b) => this.setAccent(b.dataset.c),
        homes: () => { this.m.close(true); G.social.open('homes'); },
        lock: () => G.audio.sfx('error'),
      });
      this.body = body;
      this.render();
      G.tutorial?.onShop?.(body);
    });
  },
  render() {
    const c = $('.shop-c', this.body);
    c.innerHTML = this[this.tab]();
    if (this.focus) { const f = $(`[data-focus="${this.focus}"]`, c); if (f) { f.classList.add('hl'); f.scrollIntoView({ block: 'center' }); } this.focus = null; }
  },
  priceBtn(price, can, act, data, label = 'Buy', spark = false) {
    return `<button class="btn ${can ? (spark ? 'cyan' : 'go') : 'ghost'} small" data-a="${can ? act : 'lock'}" ${data}>${label} <span class="price">${spark ? ic('spark') + price : fmtMoney(price)}</span></button>`;
  },
  gear() {
    const s = G.s;
    return `<div class="grid">${Object.entries(GEAR).map(([k, def]) => {
      const cur = s.gear[k], next = def.tiers[cur + 1], curT = def.tiers[cur];
      const pips = `<div class="stat-pips">${def.tiers.map((t, i) => `<i class="${i <= cur ? 'on' : ''}"></i>`).join('')}</div>`;
      let foot;
      if (!next) foot = `<span class="chip good">${ic('crown')}Maxed out</span>`;
      else if (next.level > s.level) foot = `<span class="chip">${ic('lock')}Level ${next.level}</span><span class="tiny muted">${fmtMoney(next.price)}</span>`;
      else foot = this.priceBtn(next.price, s.money >= next.price, 'buyGear', `data-k="${k}"`, 'Upgrade');
      const gains = next ? Object.keys(STAT_N).filter((x) => (next[x] || 0) > (curT[x] || 0)).map((x) => `<span class="chip info" style="padding:2px 8px">+${(next[x] || 0) - (curT[x] || 0)} ${STAT_N[x]}</span>`).join('') : '';
      return `<div class="card" data-focus="${k}"><div class="row"><div class="big-ic" style="color:var(--cyan)">${ic(def.icon)}</div><div class="grow"><div class="tiny muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em">${def.name}</div><div class="ttl">${curT.name}</div>${pips}</div></div>
        ${next ? `<div class="row tiny" style="font-weight:700;color:var(--muted)">${ic('up')} Next: <span style="color:#fff">${next.name}</span></div><div class="meta">${gains}</div>` : ''}<div class="foot">${foot}</div></div>`;
    }).join('')}</div>`;
  },
  decor() {
    const s = G.s;
    const caps = HOMES[s.home].slots;
    const items = [...DECOR].sort((a, b) => (s.decor.includes(b.id) - s.decor.includes(a.id)) || ((a.exclusive ? 1 : 0) - (b.exclusive ? 1 : 0)) || ((a.price || a.spark * 100 || 0) - (b.price || b.spark * 100 || 0)));
    return `<div class="row tiny muted" style="margin-bottom:10px;font-weight:700;flex-wrap:wrap">${ic('info')} Decor boosts your Room Vibe: more stream charisma and better Lumo posts. Slots: ${Object.entries(caps).filter(([k]) => ['wall', 'floor', 'shelf'].includes(k)).map(([k, v]) => `${k} ${s.placed.filter((id) => { const d = decorById(id); return d && (d.slot === k || (k === 'shelf' && d.slot === 'desk')); }).length}/${v}`).join(' · ')}</div>
      <div class="grid">${items.map((d) => {
        const owned = s.decor.includes(d.id), placed = s.placed.includes(d.id), locked = (d.level || 1) > s.level;
        let foot;
        if (owned) foot = `<button class="btn ${placed ? 'ghost' : 'cyan'} small" data-a="place" data-id="${d.id}">${placed ? `${ic('x')}Store` : `${ic('check')}Place`}</button>`;
        else if (d.exclusive) foot = `<span class="chip gold">${ic('lock')}${d.exclusive}</span>`;
        else if (locked) foot = `<span class="chip">${ic('lock')}Level ${d.level}</span>`;
        else if (d.spark) foot = this.priceBtn(d.spark, s.sparks >= d.spark, 'buyDecor', `data-id="${d.id}"`, 'Get', true);
        else foot = this.priceBtn(d.price, s.money >= d.price, 'buyDecor', `data-id="${d.id}"`);
        return `<div class="card ${owned ? 'owned' : ''}"><div class="row"><div class="big-ic" style="color:${d.exclusive ? 'var(--amber)' : d.glow ? 'var(--pink2)' : '#fff'};${d.exclusive ? 'background:linear-gradient(135deg,rgba(255,194,75,.25),rgba(255,79,139,.2))' : ''}">${ic(d.slot === 'pet' ? 'heart' : d.glow ? 'sparkle' : d.slot === 'floor' ? 'cube' : d.slot === 'wall' ? 'image' : 'star')}</div><div class="grow"><div class="ttl">${d.name}</div><div class="meta"><span class="chip violet" style="padding:2px 8px">${ic('vibe')}+${d.vibe} vibe</span><span class="tag">${d.slot === 'desk' ? 'shelf' : d.slot}</span>${d.aq ? `<span class="chip info" style="padding:2px 8px">+1 Audio</span>` : ''}</div></div></div><div class="foot">${owned ? `<span class="own tiny" style="font-weight:800">${ic('check')}Owned</span>` : ''}${foot}</div></div>`;
      }).join('')}</div>`;
  },
  games() {
    const s = G.s, ev = G.game.currentEvent();
    const list = GAMES.filter((g) => !g.exclusive || s.games.includes(g.id));
    return `<div class="grid">${list.map((g) => {
      const owned = s.games.includes(g.id), locked = g.level > s.level;
      const sale = ev.fx.sale && g.tags.includes(ev.fx.sale.tag) ? ev.fx.sale.pct : 0;
      const price = Math.round(g.price * (1 - sale / 100));
      let foot;
      if (owned) foot = `<span class="chip good">${ic('check')}Owned</span>`;
      else if (locked) foot = `<span class="chip">${ic('lock')}Level ${g.level}</span><span class="tiny muted">${fmtMoney(price)}</span>`;
      else foot = `${sale ? `<span class="chip gold">-${sale}%</span>` : ''}${this.priceBtn(price, s.money >= price, 'buyGame', `data-id="${g.id}"`)}`;
      return `<div class="card ${locked ? 'locked' : ''}"><div class="thumb"><img src="${gameCover(g)}" alt="">${trendRibbon(g)}</div><div class="ttl">${esc(g.name)}</div><div class="meta">${genreTags(g)}</div><div class="foot"><span class="row tiny muted" style="font-weight:700">${ic('star')}${Math.round(g.appeal * 50)}</span>${foot}</div></div>`;
    }).join('')}</div>`;
  },
  style() {
    const s = G.s;
    const themes = Object.entries(THEMES).filter(([k, t]) => !t.exclusive || s.themes.includes(k));
    const cos = s.cosmetics.map((id) => [id, COSMETICS[id]]).filter(([, c]) => c && ['overlay', 'skin'].includes(c.type));
    return `<div class="tiny muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Room style</div>
      <div class="grid">${themes.map(([k, t]) => {
        const owned = s.themes.includes(k), on = s.theme === k, locked = t.level > s.level;
        const sw = `<div class="row" style="gap:4px">${[t.wall, t.floorTint, t.fabric, t.trim].map((c) => `<i style="width:22px;height:22px;border-radius:7px;background:${c};display:block;box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)"></i>`).join('')}</div>`;
        const foot = on ? `<span class="chip good">${ic('check')}Active</span>` : owned ? `<button class="btn cyan small" data-a="useTheme" data-id="${k}">Apply</button>` : locked ? `<span class="chip">${ic('lock')}Level ${t.level}</span>` : this.priceBtn(t.price, s.money >= t.price, 'buyTheme', `data-id="${k}"`);
        return `<div class="card"><div class="ttl">${t.name}</div>${sw}<div class="foot">${foot}</div></div>`;
      }).join('')}</div>
      <div class="tiny muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin:16px 0 8px">Accent glow</div>
      <div class="row" style="gap:10px">${ACCENTS.map((c) => `<button class="sw ${s.profile.accent === c ? 'on' : ''}" style="background:${c}" data-a="accent" data-c="${c}"></button>`).join('')}</div>
      <div class="tiny muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin:16px 0 8px">Cosmetics</div>
      ${cos.length ? `<div class="grid">${cos.map(([id, c]) => { const on = s.overlay === id || s.micSkin === id || s.camSkin === id; return `<div class="card"><div class="row"><div class="big-ic" style="color:var(--amber)">${ic(c.type === 'overlay' ? 'layers' : c.type === 'skin' ? 'sparkle' : 'star')}</div><div class="ttl grow">${c.name}</div></div><div class="foot"><button class="btn ${on ? 'ghost' : 'cyan'} small" data-a="equip" data-id="${id}">${on ? 'Unequip' : 'Equip'}</button></div></div>`; }).join('')}</div>` : `<div class="muted tiny" style="font-weight:600">Earn overlays and skins from Daily Rewards and Events.</div>`}`;
  },
  homes() {
    const s = G.s;
    return `<div class="grid">${HOMES.map((hm) => `<div class="card"><div class="row"><div class="big-ic" style="color:var(--amber)">${ic('home')}</div><div class="grow"><div class="ttl">${hm.name}</div><div class="tiny muted" style="font-weight:600">${hm.size[0]}x${hm.size[1]}m · x${hm.viewMult} reach</div></div></div><div class="foot">${s.home === hm.id ? `<span class="chip good">${ic('check')}Home</span>` : s.homes.includes(hm.id) ? `<span class="chip">Owned</span>` : hm.level > s.level ? `<span class="chip">${ic('lock')}Level ${hm.level}</span>` : `<span class="chip gold">${fmtMoney(hm.price)}</span>`}<button class="btn amber small" data-a="homes">${ic('chevron')}</button></div></div>`).join('')}</div>`;
  },

  // ---------------------------------------------------------------- purchases
  async buyGear(cat) {
    const s = G.s, def = GEAR[cat], next = def.tiers[s.gear[cat] + 1];
    if (!next || next.level > s.level || !G.game.spend(next.price)) return;
    this.m.close(true);
    await G.game.run('install', async () => {
      const W = G.world, A = G.audio;
      G.ui.hud.show(false);
      s.gear[cat]++;
      s.lastGear = { cat, streams: s.stats.streams };
      A.sfx('buy');
      W.shot('deskWide');
      await sleep(350);
      W.rebuildDesk(cat);
      W.applyTime(G.game.hour, true);
      A.sfx('place');
      const p = W.room.st.monitor.clone();
      W.vfx.emit('spark', p, { count: 14, spread: 1.2, spreadY: 0.6, size: 0.12, life: 1.2, vel: new THREE.Vector3(0, 0.4, 0) });
      W.vfx.confetti(p.clone().add(new THREE.Vector3(0, 0.3, 0.5)), 50, 1.8);
      await W.goTo('desk');
      W.char.play('fistPump', { restart: true }); W.char.setExpression('happy', 2);
      toast(`New gear: <b>${next.name}</b>`, { icon: def.icon, color: 'var(--cyan)', sub: `Setup score ${setupStats(s).score}` });
      bus.emit('q', { evt: 'buy', n: 1 });
      await sleep(1300);
      W.char.play('idle');
      W.shot('room');
    });
  },
  buyDecor(id) {
    const s = G.s, d = decorById(id);
    if (d.spark) { if (s.sparks < d.spark) { G.audio.sfx('error'); return; } G.game.addSparks(-d.spark); }
    else if (!G.game.spend(d.price)) return;
    this.grantDecor(id, true);
    bus.emit('q', { evt: 'buy', n: 1 });
    this.render();
  },
  grantDecor(id, place = true) {
    const s = G.s;
    if (!s.decor.includes(id)) s.decor.push(id);
    if (place && !s.placed.includes(id)) s.placed.push(id);
    G.world.rebuildDecor(id);
    const over = G.world.room.slotOverflow || [];
    if (over.includes(id)) { s.placed = s.placed.filter((x) => x !== id); toast('No free slot — stored in inventory', { icon: 'home', color: 'var(--amber)', sub: 'Bigger homes have more space' }); G.world.rebuildDecor(); }
    else { G.audio.sfx('place'); toast(`Placed: <b>${decorById(id).name}</b>`, { icon: 'paint', color: 'var(--pink)', sub: `+${decorById(id).vibe} vibe` }); }
  },
  togglePlace(id) {
    const s = G.s;
    if (s.placed.includes(id)) { s.placed = s.placed.filter((x) => x !== id); G.world.rebuildDecor(); G.audio.sfx('pop'); }
    else { this.grantDecor(id, true); }
    this.render();
  },
  buyGame(id) {
    const s = G.s, g = gameById(id), ev = G.game.currentEvent();
    const sale = ev.fx.sale && g.tags.includes(ev.fx.sale.tag) ? ev.fx.sale.pct : 0;
    if (!G.game.spend(Math.round(g.price * (1 - sale / 100)))) return;
    s.games.push(id);
    G.audio.sfx('buy');
    toast(`New game: <b>${g.name}</b>`, { icon: 'gamepad', color: 'var(--cyan)', sub: 'Ready to record or stream' });
    bus.emit('q', { evt: 'buy', n: 1 });
    this.render();
    if (this.inline) setTimeout(() => this.m.close(true), 500);
  },
  buyTheme(id) {
    const t = THEMES[id];
    if (!G.game.spend(t.price)) return;
    G.s.themes.push(id);
    G.audio.sfx('buy');
    this.useTheme(id);
  },
  useTheme(id) {
    G.s.theme = id;
    this.m.close(true);
    G.game.run('restyle', async () => {
      G.ui.hud.show(false);
      const fade = h(`<div style="position:absolute;inset:0;background:#0d0d1c;opacity:0;transition:opacity .4s;pointer-events:none"></div>`);
      $('#fx').appendChild(fade);
      requestAnimationFrame(() => (fade.style.opacity = 1));
      await sleep(420);
      const p = G.world.char.root.position.clone();
      G.world.rebuildRoom();
      G.world.char.root.position.copy(p);
      fade.style.opacity = 0; setTimeout(() => fade.remove(), 450);
      G.audio.sfx('place');
      G.world.vfx.confetti(new THREE.Vector3(0, 1.4, 0), 100, 2.4);
      toast(`Room style: <b>${THEMES[id].name}</b>`, { icon: 'paint', color: 'var(--pink)' });
      await sleep(600);
    });
  },
  setAccent(c) {
    G.s.profile.accent = c;
    G.world.setProfile(G.s.profile);
    const p = G.world.char.root.position.clone();
    G.world.rebuildRoom();
    G.world.char.root.position.copy(p);
    G.ui.hud.setPortrait();
    G.audio.sfx('pop');
    this.render();
  },
  equip(id) {
    const s = G.s, c = COSMETICS[id];
    if (c.type === 'overlay') s.overlay = s.overlay === id ? null : id;
    if (id === 'golden_mic') { s.micSkin = s.micSkin === id ? null : id; G.world.rebuildDesk('mic'); }
    if (id === 'crt_cam') { s.camSkin = s.camSkin === id ? null : id; G.world.rebuildDesk('camera'); }
    G.audio.sfx('pop');
    this.render();
  },
};
