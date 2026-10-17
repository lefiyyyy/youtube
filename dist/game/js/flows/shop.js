// Shop: every item is shown as a 3D preview before you buy it — setup gear (any unlocked tier), decor,
// brand fashion (tried on your own character), games, room styles and homes.
import * as THREE from '../../vendor/three/three.module.min.js';
import { G } from '../game/ctx.js';
import { bus } from '../core/bus.js';
import { $, $$, h, bind, ic, esc, modal, toast } from '../ui/ui.js';
import { GEAR } from '../data/gear.js';
import { DECOR, THEMES, HOMES, ACCENTS, decorById } from '../data/decor.js';
import { GAMES, GENRES, gameById } from '../data/games.js';
import { COSMETICS } from '../data/rewards.js';
import { CLOTHES, SLOTS, SLOT_NAMES, SLOT_ICONS, clothById, dripOf } from '../data/clothes.js';
import { gameCover } from '../world/screens.js';
import { ItemPreview } from '../world/preview.js';
import { genreTags, trendRibbon } from './create.js';
import { setupStats } from '../game/economy.js';
import { fmt, fmtMoney, sleep, clamp } from '../core/util.js';

const STAT_N = { vq: 'Video quality', aq: 'Audio quality', sq: 'Stream stability', cq: 'Camera & look', comfort: 'Comfort', vibe: 'Room vibe' };
const STAT_MAX = { vq: 10, aq: 7, sq: 9, cq: 7, comfort: 4, vibe: 9 };
const TABS = [['gear', 'cpu', 'Setup'], ['decor', 'paint', 'Decor'], ['fashion', 'shirt', 'Fashion'], ['games', 'gamepad', 'Games'], ['style', 'layers', 'Room'], ['homes', 'home', 'Homes']];
const DECOR_SUBS = [['all', 'All'], ['wall', 'Wall'], ['floor', 'Floor'], ['shelf', 'Shelf & desk'], ['other', 'Rugs & more']];
const GEAR_DESC = {
  pc: 'Renders and records your content. Faster PCs mean sharper videos and smoother streams.',
  monitor: 'More screen space for editing and chat. Shows up on your desk.',
  camera: 'Your facecam. Better cameras make thumbnails, selfies and streams look pro.',
  mic: 'Viewers notice bad audio first. A real mic is the best early upgrade.',
  light: 'Good lighting makes you look great on camera and adds room vibe.',
  chair: 'Comfort means less energy drained while creating.',
  desk: 'A bigger desk fits bigger setups and adds vibe.',
  keys: 'Snappier inputs for gameplay recordings.',
  net: 'Faster uploads and lag-free streams.',
};

export const Shop = {
  open(tab = 'gear', focus = null, inline = false) {
    if (G.game.busy && !inline) return Promise.resolve();
    const s = G.s;
    if (!this.pv) this.pv = new ItemPreview();
    if (G.tutorial?.active && G.tutorial.step?.id === 'buy' && !inline) { tab = 'gear'; focus = 'mic'; }
    this.tab = inline ? 'games' : tab;
    this.sub = null;
    this.sel = null;
    this.focus = focus;
    this.inline = inline;
    if (this.tab === 'gear' && focus && GEAR[focus]) this.sub = focus;
    return new Promise((res) => {
      const body = h(`<div class="shop">
        <div class="sh-top"><div class="sh-ttl">${ic('cart')}<span>Shop</span></div>
          <div class="tabs sh-tabs">${TABS.filter((t) => !inline || t[0] === 'games').map(([k, i, n]) => `<button class="tab ${k === this.tab ? 'on' : ''}" data-a="tab" data-k="${k}">${ic(i)}<span>${n}</span></button>`).join('')}</div>
          <div class="grow"></div>
          <div class="cur money glass"><div class="ci">${ic('dollar')}</div><span class="v"></span></div>
          <div class="cur sparks glass"><div class="ci">${ic('spark')}</div><span class="v"></span></div>
          <button class="xbtn" data-x>${ic('close')}</button></div>
        <div class="sh-subs"></div>
        <div class="sh-main"><div class="sh-grid"></div>
          <div class="sh-detail"><div class="sh-view"><img class="sh-cover" alt=""><div class="sh-hint">${ic('undo')} Drag to rotate</div></div><div class="sh-info"></div></div></div>
      </div>`);
      this.body = body;
      this.m = modal({ body, size: 'full', cls: 'shopm', onClose: () => { this.pv.detach(); this.pv.cancelQueue(); G.world.paused = false; this.m = null; res(); } });
      G.world.paused = true;
      this.pv.attach($('.sh-view', body));
      bind(body, {
        tab: (b) => { this.tab = b.dataset.k; this.sub = null; this.sel = null; $$('.sh-tabs .tab', body).forEach((t) => t.classList.toggle('on', t === b)); G.audio.sfx('tab'); this.render(); },
        sub: (b) => { this.sub = b.dataset.k; this.sel = null; G.audio.sfx('tab'); this.render(); },
        pick: (b) => { this.select(b.dataset.key); },
        buy: () => this.buy(this.cur),
        equip: () => this.equip(this.cur),
        unequip: () => this.unequip(this.cur),
        place: () => this.togglePlace(this.cur.id),
        buyTheme: (b) => this.buyTheme(b.dataset.id),
        useTheme: (b) => this.useTheme(b.dataset.id),
        equipCos: (b) => this.equipCos(b.dataset.id),
        accent: (b) => this.setAccent(b.dataset.c),
        homes: () => { this.close(); G.social.open('homes'); },
        lock: () => G.audio.sfx('error'),
      });
      this.render();
      G.tutorial?.onShop?.(body);
    });
  },
  close() { if (this.m) this.m.close(true); },
  ctx() { const s = G.s; return { theme: { ...(THEMES[s.theme] || THEMES.gamer), accent: s.profile.accent }, accent: s.profile.accent, profile: s.profile }; },
  money() {
    const s = G.s;
    $('.cur.money .v', this.body).textContent = fmtMoney(s.money);
    $('.cur.sparks .v', this.body).textContent = fmt(s.sparks);
  },

  // ---------------------------------------------------------------- item lists
  subs() {
    if (this.tab === 'gear') return Object.entries(GEAR).map(([k, d]) => [k, d.name, d.icon]);
    if (this.tab === 'decor') return DECOR_SUBS.map(([k, n]) => [k, n]);
    if (this.tab === 'fashion') return SLOTS.map((k) => [k, SLOT_NAMES[k], SLOT_ICONS[k]]);
    if (this.tab === 'games') { const gs = Object.keys(GENRES).filter((g) => GAMES.some((x) => x.tags.includes(g))); return [['all', 'All'], ...gs.map((g) => [g, GENRES[g].name, GENRES[g].icon])]; }
    return [];
  },
  items() {
    const s = G.s, sub = this.sub;
    if (this.tab === 'gear') {
      const def = GEAR[sub], cur = s.gear[sub];
      return def.tiers.map((t, i) => ({
        key: `gear:${sub}:${i}`, kind: 'gear', cat: sub, tier: i, name: t.name, price: t.price, level: t.level, icon: def.icon,
        state: i === cur ? 'installed' : i < cur ? 'old' : t.level > s.level ? 'locked' : 'buy', next: i === cur + 1,
        spec: { kind: 'gear', cat: sub, tier: i },
      }));
    }
    if (this.tab === 'decor') {
      const list = DECOR.filter((d) => (!d.exclusive || s.decor.includes(d.id)) && (sub === 'all' || (sub === 'shelf' ? ['shelf', 'desk'].includes(d.slot) : sub === 'other' ? ['rug', 'kitchen', 'pet', 'ceiling'].includes(d.slot) : d.slot === sub)));
      return list.map((d) => ({
        key: `decor:${d.id}`, kind: 'decor', id: d.id, name: d.name, price: d.price, spark: d.spark, level: d.level || 1, d,
        state: s.placed.includes(d.id) ? 'placed' : s.decor.includes(d.id) ? 'owned' : (d.level || 1) > s.level ? 'locked' : 'buy',
        spec: { kind: 'decor', id: d.id, slot: d.slot },
      }));
    }
    if (this.tab === 'fashion') {
      const list = CLOTHES.filter((c) => c.slot === sub && !c.basic && (!c.exclusive || s.wardrobe.includes(c.id)));
      return list.map((c) => ({
        key: `fashion:${c.id}:${s.profile.gender}`, kind: 'fashion', id: c.id, name: c.name, brand: c.brand, price: c.price, level: c.level, c,
        state: s.profile.wear[c.slot] === c.id ? 'equipped' : s.wardrobe.includes(c.id) ? 'owned' : c.level > s.level ? 'locked' : 'buy',
        spec: { kind: 'fashion', slot: c.slot, profile: this.tryOn(c), clip: 'idle' },
      }));
    }
    if (this.tab === 'games') {
      const ev = G.game.currentEvent();
      const list = GAMES.filter((g) => (!g.exclusive || s.games.includes(g.id)) && (sub === 'all' || g.tags.includes(sub)));
      return list.map((g) => {
        const sale = ev.fx.sale && g.tags.includes(ev.fx.sale.tag) ? ev.fx.sale.pct : 0;
        return { key: `game:${g.id}`, kind: 'game', id: g.id, g, name: g.name, price: Math.round(g.price * (1 - sale / 100)), sale, level: g.level, cover: gameCover(g),
          state: s.games.includes(g.id) ? 'owned' : g.level > s.level ? 'locked' : 'buy' };
      });
    }
    return [];
  },
  tryOn(c) {
    const p = JSON.parse(JSON.stringify(G.s.profile));
    p.wear[c.slot] = c.id;
    return p;
  },

  // ---------------------------------------------------------------- rendering
  render() {
    const body = this.body, s = G.s;
    this.money();
    const subsEl = $('.sh-subs', body), grid = $('.sh-grid', body), main = $('.sh-main', body);
    const subs = this.subs();
    if (!this.sub && subs.length) this.sub = subs[0][0];
    subsEl.innerHTML = subs.map(([k, n, i]) => `<button class="subb ${k === this.sub ? 'on' : ''}" data-a="sub" data-k="${k}">${i ? ic(i) : ''}${n}</button>`).join('');
    subsEl.style.display = subs.length ? '' : 'none';
    this.pv.cancelQueue();
    if (this.tab === 'style' || this.tab === 'homes') {
      main.classList.add('wide');
      grid.innerHTML = this[this.tab]();
      this.pv.live = null; this.pv.clear();
      return;
    }
    main.classList.remove('wide');
    const items = this.items();
    this.list = items;
    grid.innerHTML = items.length ? items.map((it) => this.card(it)).join('') : `<div class="muted" style="padding:20px;font-weight:600">Nothing here yet.</div>`;
    // thumbnails
    const ctx = this.ctx();
    for (const it of items) {
      if (it.cover) continue;
      this.pv.request(it.key, it.spec, ctx, (key, url) => { const im = grid.querySelector(`[data-key="${CSS.escape(key)}"] .th img`); if (im) { im.src = url; im.classList.add('on'); } });
    }
    // default selection: focus > next upgrade > first buyable > first
    let sel = items.find((x) => x.key === this.sel) || (this.focus ? items.find((x) => x.next) : null) || items.find((x) => x.next) || items.find((x) => x.state === 'buy') || items.find((x) => x.state === 'equipped' || x.state === 'installed') || items[0];
    if (sel) this.select(sel.key, true);
    if (this.focus) { const f = grid.querySelector('.hl'); if (f) f.scrollIntoView({ block: 'nearest' }); this.focus = null; }
  },
  card(it) {
    const s = G.s;
    let badge = '';
    if (it.state === 'installed') badge = `<span class="sb ok">${ic('check')}Installed</span>`;
    else if (it.state === 'equipped') badge = `<span class="sb ok">${ic('check')}Wearing</span>`;
    else if (it.state === 'placed') badge = `<span class="sb ok">${ic('check')}Placed</span>`;
    else if (it.state === 'owned') badge = `<span class="sb">${ic('check')}Owned</span>`;
    else if (it.state === 'old') badge = `<span class="sb dim">Older</span>`;
    else if (it.state === 'locked') badge = `<span class="sb lock">${ic('lock')}Lv ${it.level}</span>`;
    const price = it.state === 'buy' || it.state === 'locked' ? (it.spark ? `${ic('spark')}${it.spark}` : it.price ? fmtMoney(it.price) : 'Free') : '';
    const afford = it.spark ? s.sparks >= it.spark : s.money >= it.price;
    const tierDots = it.kind === 'gear' ? `<span class="tdots">${GEAR[it.cat].tiers.map((_, i) => `<i class="${i <= it.tier ? 'on' : ''}"></i>`).join('')}</span>` : '';
    return `<button class="item ${it.state} ${it.key === this.sel ? 'sel' : ''} ${it.next && this.focus === it.cat ? 'hl' : ''}" data-a="pick" data-key="${esc(it.key)}" ${it.next ? `data-focus="${it.cat}"` : ''}>
      <span class="th">${it.cover ? `<img class="on cov" src="${it.cover}">` : `<img alt="">`}${it.sale ? `<span class="sale">-${it.sale}%</span>` : ''}${badge}</span>
      <span class="in">${it.brand ? `<small>${esc(it.brand)}</small>` : it.kind === 'gear' ? `<small>Tier ${it.tier + 1}</small>` : ''}<b>${esc(it.name)}</b>
        <span class="pr ${price && !afford && it.state === 'buy' ? 'no' : ''}">${price}${tierDots}</span></span></button>`;
  },
  select(key, silent) {
    const it = (this.list || []).find((x) => x.key === key);
    if (!it) return;
    this.sel = key; this.cur = it;
    $$('.sh-grid .item', this.body).forEach((b) => b.classList.toggle('sel', b.dataset.key === key));
    if (!silent) G.audio.sfx('tab');
    const view = $('.sh-view', this.body), cov = $('.sh-cover', view);
    if (it.cover) { cov.src = it.cover; view.classList.add('cover'); this.pv.live = null; this.pv.clear(); }
    else { view.classList.remove('cover'); this.pv.show(it.spec, this.ctx()); }
    $('.sh-info', this.body).innerHTML = this.info(it);
  },
  info(it) {
    const s = G.s;
    let head = '', body = '', act = '';
    const afford = it.spark ? s.sparks >= it.spark : s.money >= it.price;
    const priceTxt = it.spark ? `${ic('spark')}${it.spark}` : fmtMoney(it.price);
    const buyBtn = (label) => it.state === 'locked' ? `<button class="btn ghost big" data-a="lock">${ic('lock')}Unlocks at level ${it.level}</button>`
      : `<button class="btn ${afford ? 'go' : 'ghost'} big" data-a="${afford ? 'buy' : 'lock'}">${afford ? ic('cart') : ic('dollar')}${afford ? label : 'Not enough cash'}<span class="price">${priceTxt}</span></button>`;
    if (it.kind === 'gear') {
      const def = GEAR[it.cat], curT = def.tiers[s.gear[it.cat]], t = def.tiers[it.tier];
      head = `<small>${def.name} · Tier ${it.tier + 1}/${def.tiers.length}</small><h3>${esc(it.name)}</h3><p>${GEAR_DESC[it.cat] || ''}</p>`;
      const keys = Object.keys(STAT_N).filter((k) => (t[k] || 0) || (curT[k] || 0));
      body = `<div class="cmp">${keys.map((k) => {
        const a = curT[k] || 0, b = t[k] || 0, mx = Math.max(STAT_MAX[k], a, b);
        return `<div class="cr"><span>${STAT_N[k]}</span><span class="cb"><i class="a" style="width:${(Math.min(a, b) / mx) * 100}%"></i><i class="${b >= a ? 'up' : 'down'}" style="left:${(Math.min(a, b) / mx) * 100}%;width:${(Math.abs(b - a) / mx) * 100}%"></i></span><b class="${b > a ? 'pos' : b < a ? 'neg' : ''}">${b > a ? '+' + (b - a) : b < a ? b - a : '='}</b></div>`;
      }).join('')}</div><div class="tiny muted" style="font-weight:600">Installed now: <b style="color:#fff">${esc(curT.name)}</b></div>`;
      act = it.state === 'installed' ? `<span class="chip good big-chip">${ic('check')}Installed in your room</span>` : it.state === 'old' ? `<span class="chip big-chip">You already have something better</span>` : buyBtn('Buy & install');
    } else if (it.kind === 'decor') {
      const d = it.d;
      head = `<small>Decor · ${d.slot === 'desk' ? 'shelf' : d.slot}</small><h3>${esc(d.name)}</h3><p>${d.glow ? 'Glowing piece — looks amazing at night and on stream.' : 'Makes your room feel like yours.'}</p>`;
      body = `<div class="kv"><span>${ic('sparkle')}Room vibe</span><b class="pos">+${d.vibe}</b></div>${d.aq ? `<div class="kv"><span>${ic('mic')}Audio</span><b class="pos">+1</b></div>` : ''}${d.unlockFood ? `<div class="kv"><span>${ic('food')}Unlocks</span><b>Espresso</b></div>` : ''}${d.exclusive ? `<div class="kv"><span>${ic('trophy')}Exclusive</span><b>${esc(d.exclusive)}</b></div>` : ''}`;
      act = it.state === 'placed' ? `<button class="btn ghost big" data-a="place">${ic('x')}Put in storage</button>` : it.state === 'owned' ? `<button class="btn cyan big" data-a="place">${ic('check')}Place in room</button>` : buyBtn('Buy & place');
    } else if (it.kind === 'fashion') {
      const c = it.c;
      head = `<small>${esc(c.brand || 'Exclusive')} · ${SLOT_NAMES[c.slot]}</small><h3>${esc(c.name)}</h3><p>${c.brand ? 'Try it on — this is exactly how it will look on you.' : 'A rare reward piece.'}</p>`;
      const now = dripOf(s.profile), after = dripOf(it.spec.profile);
      body = `<div class="kv"><span>${ic('sparkle')}Style score</span><b>${now} → <span class="${after >= now ? 'pos' : 'neg'}">${after}</span></b></div><div class="kv"><span>${ic('shirt')}Fit Check posts</span><b class="pos">+${Math.round((c.drip || 0) * 1.5)}% reach</b></div>`;
      act = it.state === 'equipped' ? `<button class="btn ghost big" data-a="unequip">${ic('x')}Take off</button>` : it.state === 'owned' ? `<button class="btn cyan big" data-a="equip">${ic('shirt')}Wear it</button>` : buyBtn('Buy & wear');
    } else if (it.kind === 'game') {
      const g = it.g;
      head = `<small>Game</small><h3>${esc(g.name)}</h3><div class="row" style="flex-wrap:wrap;gap:5px;margin:6px 0">${genreTags(g)}${trendRibbon(g)}</div>`;
      body = `<div class="kv"><span>${ic('star')}Audience hype</span><b>${Math.round(g.appeal * 50)}</b></div><div class="kv"><span>${ic('film')}Great for</span><b>${g.tags.map((t) => GENRES[t].name).join(', ')}</b></div>`;
      act = it.state === 'owned' ? `<span class="chip good big-chip">${ic('check')}In your library</span>` : buyBtn('Buy game');
    }
    return `<div class="si-h">${head}</div><div class="si-b">${body}</div><div class="si-a">${act}</div>`;
  },

  // ---------------------------------------------------------------- non-3D tabs
  style() {
    const s = G.s;
    const themes = Object.entries(THEMES).filter(([k, t]) => !t.exclusive || s.themes.includes(k));
    const cos = s.cosmetics.map((id) => [id, COSMETICS[id]]).filter(([, c]) => c && ['overlay', 'skin'].includes(c.type));
    const btn = (price, can, act, data) => `<button class="btn ${can ? 'go' : 'ghost'} small" data-a="${can ? act : 'lock'}" ${data}>Buy <span class="price">${fmtMoney(price)}</span></button>`;
    return `<div class="pl" style="margin-bottom:8px">Room style</div>
      <div class="grid">${themes.map(([k, t]) => {
        const owned = s.themes.includes(k), on = s.theme === k, locked = t.level > s.level;
        const sw = `<div class="swatch-board" style="--w:${t.wall};--w2:${t.wall2};--f:${t.floorTint};--fa:${t.fabric};--tr:${t.trim}"><i class="wl"></i><i class="fl"></i><i class="bd"></i></div>`;
        const foot = on ? `<span class="chip good">${ic('check')}Active</span>` : owned ? `<button class="btn cyan small" data-a="useTheme" data-id="${k}">Apply</button>` : locked ? `<span class="chip">${ic('lock')}Level ${t.level}</span>` : btn(t.price, s.money >= t.price, 'buyTheme', `data-id="${k}"`);
        return `<div class="card">${sw}<div class="ttl">${t.name}</div><div class="foot">${foot}</div></div>`;
      }).join('')}</div>
      <div class="pl" style="margin:16px 0 8px">Signature glow</div>
      <div class="row" style="gap:10px">${ACCENTS.map((c) => `<button class="sw ${s.profile.accent === c ? 'on' : ''}" style="background:${c}" data-a="accent" data-c="${c}"></button>`).join('')}</div>
      <div class="pl" style="margin:16px 0 8px">Cosmetics</div>
      ${cos.length ? `<div class="grid">${cos.map(([id, c]) => { const on = s.overlay === id || s.micSkin === id || s.camSkin === id; return `<div class="card"><div class="row"><div class="big-ic" style="color:var(--amber)">${ic(c.type === 'overlay' ? 'layers' : 'sparkle')}</div><div class="ttl grow">${c.name}</div></div><div class="foot"><button class="btn ${on ? 'ghost' : 'cyan'} small" data-a="equipCos" data-id="${id}">${on ? 'Unequip' : 'Equip'}</button></div></div>`; }).join('')}</div>` : `<div class="muted tiny" style="font-weight:600">Earn overlays and skins from Daily Rewards and Events.</div>`}`;
  },
  homes() {
    const s = G.s;
    return `<div class="grid">${HOMES.map((hm) => `<div class="card"><div class="row"><div class="big-ic" style="color:var(--amber)">${ic('home')}</div><div class="grow"><div class="ttl">${hm.name}</div><div class="tiny muted" style="font-weight:600">${hm.size[0]}×${hm.size[1]} m · ×${hm.viewMult} reach</div></div></div><div class="foot">${s.home === hm.id ? `<span class="chip good">${ic('check')}Home</span>` : s.homes.includes(hm.id) ? `<span class="chip">Owned</span>` : hm.level > s.level ? `<span class="chip">${ic('lock')}Level ${hm.level}</span>` : `<span class="chip gold">${fmtMoney(hm.price)}</span>`}<button class="btn amber small" data-a="homes">View ${ic('chevron')}</button></div></div>`).join('')}</div>`;
  },

  // ---------------------------------------------------------------- purchases
  buy(it) {
    if (!it || it.state !== 'buy') return;
    if (it.kind === 'gear') return this.buyGear(it.cat, it.tier);
    if (it.kind === 'decor') return this.buyDecor(it.id);
    if (it.kind === 'fashion') return this.buyCloth(it.c);
    if (it.kind === 'game') return this.buyGame(it.id);
  },
  async buyGear(cat, tier) {
    const s = G.s, def = GEAR[cat], t = def.tiers[tier];
    if (tier <= s.gear[cat] || t.level > s.level || !G.game.spend(t.price)) return;
    this.close();
    await G.game.run('install', async () => {
      const W = G.world, A = G.audio;
      G.ui.hud.show(false);
      s.gear[cat] = tier;
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
      toast(`Installed: <b>${t.name}</b>`, { icon: def.icon, color: 'var(--cyan)', sub: `Setup score ${setupStats(s).score}` });
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
    G.audio.sfx('buy');
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
    else this.grantDecor(id, true);
    this.render();
  },
  buyCloth(c) {
    const s = G.s;
    if (!G.game.spend(c.price)) return;
    if (!s.wardrobe.includes(c.id)) s.wardrobe.push(c.id);
    G.audio.sfx('buy');
    bus.emit('q', { evt: 'buy', n: 1 });
    toast(`<b>${esc(c.brand || '')}</b> ${esc(c.name)}`, { icon: 'shirt', color: 'var(--pink)', sub: 'Added to your wardrobe' });
    this.equip({ c, kind: 'fashion' });
  },
  equip(it) {
    if (it.kind !== 'fashion') return;
    const s = G.s;
    s.profile.wear[it.c.slot] = it.c.id;
    this.applyLook();
  },
  unequip(it) {
    if (it.kind !== 'fashion') return;
    const s = G.s, slot = it.c.slot;
    s.profile.wear[slot] = ['top', 'bottom', 'shoes'].includes(slot) ? { top: 'hoodie', bottom: 'jeans', shoes: 'sneakers' }[slot] : null;
    this.applyLook();
  },
  applyLook() {
    const s = G.s;
    G.world.setProfile(s.profile);
    G.ui.hud.setPortrait();
    s.stats.outfitChanges = (s.stats.outfitChanges || 0) + 1;
    G.audio.sfx('pop');
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
    if (this.inline) setTimeout(() => this.close(), 500);
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
    this.close();
    G.game.run('restyle', async () => {
      G.ui.hud.show(false);
      const fade = h(`<div style="position:absolute;inset:0;background:#0b0c10;opacity:0;transition:opacity .4s;pointer-events:none"></div>`);
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
  equipCos(id) {
    const s = G.s, c = COSMETICS[id];
    if (c.type === 'overlay') s.overlay = s.overlay === id ? null : id;
    if (id === 'golden_mic') { s.micSkin = s.micSkin === id ? null : id; G.world.rebuildDesk('mic'); }
    if (id === 'crt_cam') { s.camSkin = s.camSkin === id ? null : id; G.world.rebuildDesk('camera'); }
    G.audio.sfx('pop');
    this.render();
  },
};
