// Life sim: kitchen & food, sleep/naps, delivery, pet cat, sofa, moving home, wardrobe.
import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { bus } from '../core/bus.js';
import { $, $$, h, bind, ic, esc, modal, toast, floatText, countUp } from '../ui/ui.js';
import { FOODS, foodById, BUFFS } from '../data/food.js';
import { HOMES } from '../data/decor.js';
import { overlay, closeOverlay } from './create.js';
import { clamp, fmt, fmtMoney, sleep } from '../core/util.js';
import { totalFans } from '../game/economy.js';

function needPop(kind, v) {
  const W = G.world;
  const p = W.toScreen(W.headWorld().add(new THREE.Vector3(0, 0.35, 0)));
  floatText(p.x + (kind === 'energy' ? 50 : -40), p.y, `${ic(kind === 'energy' ? 'bolt' : 'burger')} +${Math.round(v)}`, kind === 'energy' ? '#35dcff' : '#ffb547');
}

export const Life = {
  // ---------------------------------------------------------------- KITCHEN
  kitchen() {
    if (G.game.busy) return;
    const s = G.s;
    const avail = FOODS.filter((f) => !f.delivery && (!f.needs || s.placed.includes(f.needs) || s.decor.includes(f.needs)));
    const body = h(`<div class="col" style="gap:8px">${avail.map((f) => {
      const locked = s.level < f.level;
      return `<button class="post-type ${locked ? 'locked' : ''}" data-a="${locked ? 'no' : 'eat'}" data-id="${f.id}" style="margin:0">
        <div class="pi" style="background:${f.energy > f.hunger ? 'linear-gradient(135deg,#35dcff,#1f7fe0)' : 'linear-gradient(135deg,#ffb547,#ff7a2f)'}">${ic(f.icon)}</div>
        <div class="grow"><div class="pn">${f.name}</div><div class="pd"><span style="color:#ffb547">${ic('burger')} +${f.hunger}</span> &nbsp; <span style="color:#35dcff">${ic('bolt')} +${f.energy}</span>${f.buff ? ` &nbsp; <span style="color:var(--lime)">${ic(BUFFS[f.buff.id].icon)} ${BUFFS[f.buff.id].name}</span>` : ''}</div></div>
        ${locked ? `<span class="chip">${ic('lock')}Lv ${f.level}</span>` : `<span class="chip good">${fmtMoney(f.price)}</span>`}</button>`;
    }).join('')}
      <button class="post-type" data-a="order" style="margin:0"><div class="pi" style="background:linear-gradient(135deg,#ff9f43,#e0601f)">${ic('bag')}</div><div class="grow"><div class="pn">Order delivery</div><div class="pd">Takeout, sushi &amp; more on Crumbs</div></div>${ic('chevron')}</button></div>`);
    const m = modal({ title: 'Kitchen', sub: `${ic('burger')} ${Math.round(s.needs.hunger)} hunger · ${ic('bolt')} ${Math.round(s.needs.energy)} energy`, icon: 'food', iconBg: 'linear-gradient(135deg,#ffb547,#ff7a2f)', body, size: 'sm' });
    bind(body, {
      no: () => G.audio.sfx('error'),
      eat: (b) => { const f = foodById(b.dataset.id); if (!G.game.spend(f.price)) return; m.close(true); this.eat(f); },
      order: () => { m.close(true); G.social.open('delivery'); },
    });
    G.tutorial?.onKitchen?.(body);
  },
  async eat(f, delivered = false) {
    await G.game.run('eat', async () => {
      const s = G.s, W = G.world, A = G.audio;
      G.ui.hud.show(false);
      W.shot('kitchen');
      if (!delivered) {
        await W.goTo('fridge');
        W.room.setFridgeOpen(true); A.sfx('fridge');
        W.char.play('reach', { restart: true });
        await sleep(800);
        W.char.showProp(f.id === 'volt' ? 'can' : f.id === 'snack' ? 'snack' : f.id === 'pizza' ? 'pizza' : f.id === 'espresso' ? 'mug' : null);
        W.room.setFridgeOpen(false);
        await sleep(300);
      }
      if (f.prep === 'cook' || f.prep === 'coffee') {
        W.char.showProp(null);
        await W.goTo('counter');
        const app = W.room.appliances;
        const kind = app.microwave && (f.id === 'pizza' || !app.stove) ? 'microwave' : app.stove ? 'stove' : 'microwave';
        W.room.setCooking(true, kind);
        const stop = A.loop(kind === 'stove' ? 'sizzle' : 'hum');
        W.char.play('cook');
        const steamAt = new THREE.Vector3();
        (app[kind] || W.room.counter).getWorldPosition(steamAt);
        steamAt.y += 0.3;
        for (let i = 0; i < 6; i++) { W.vfx.emit('steam', steamAt, { count: 2, size: 0.2, life: 1.6, vel: new THREE.Vector3(0, 0.35, 0), grow: 1.5, spread: 0.15 }); await sleep(330); }
        stop(); W.room.setCooking(false); A.sfx('ding');
        W.char.showProp(f.id === 'espresso' ? 'mug' : f.id === 'pizza' ? 'pizza' : 'bowl');
      } else if (!W.char.propName) W.char.showProp(f.icon === 'bowl' || f.id === 'bowl' || f.id === 'sushi' || f.id === 'chef' || f.id === 'takeout' ? 'bowl' : 'snack');
      // eat
      const clip = W.char.propName === 'bowl' ? 'eat' : W.char.propName === 'can' || W.char.propName === 'mug' ? 'drink' : 'eatHand';
      W.char.play(clip, { restart: true });
      W.char.setExpression('happy', 3);
      if (clip === 'drink') { A.sfx(f.id === 'volt' ? 'can' : 'pop'); await sleep(300); A.sfx('gulp'); }
      else A.sfx(clip === 'eat' ? 'slurp' : 'crunch');
      await sleep(clip === 'drink' ? 1300 : 2300);
      W.char.showProp(null);
      W.char.play('idle');
      s.needs.hunger = clamp(s.needs.hunger + f.hunger, 0, 100);
      s.needs.energy = clamp(s.needs.energy + f.energy, 0, 100);
      if (f.hunger >= 10) needPop('hunger', f.hunger);
      if (f.energy >= 10) setTimeout(() => needPop('energy', f.energy), 250);
      if (f.buff) { G.game.addBuff(f.buff.id, f.buff.uses); toast(`${BUFFS[f.buff.id].name}: ${BUFFS[f.buff.id].desc}`, { icon: BUFFS[f.buff.id].icon, color: 'var(--lime)', sub: `${f.buff.uses} creations` }); }
      s.stats.meals++;
      s.lastMeal = { id: f.id, day: s.clock.day, premium: f.price >= 24 };
      bus.emit('q', { evt: 'eat', n: 1 });
      W.char.play('fistPump', { restart: true });
      A.sfx('reward');
      G.game.advance(f.time / 60);
      await sleep(700);
      W.char.play('idle');
      W.shot('room');
    });
  },
  async delivery(f) {
    await G.game.run('delivery', async () => {
      const W = G.world, A = G.audio;
      G.ui.hud.show(false);
      W.shot('room');
      await sleep(1500);
      A.sfx('doorbell');
      G.ui.labels.bubble(W.room.door, `${ic('bag')} Delivery!`);
      await W.goTo('door');
      W.room.setDoorOpen(true); A.sfx('door');
      W.char.play('reach', { restart: true });
      await sleep(900);
      W.char.showProp('bowl');
      W.char.play('wave', { restart: true });
      await sleep(600);
      W.room.setDoorOpen(false); A.sfx('door');
      W.char.play('idle');
    });
    await this.eat(f, true);
  },

  // ---------------------------------------------------------------- REST
  rest() {
    if (G.game.busy) return;
    const s = G.s;
    const hr = G.game.hour;
    const body = h(`<div class="col" style="gap:8px">
      <button class="post-type" data-a="sleep" style="margin:0"><div class="pi" style="background:linear-gradient(135deg,#6d6bff,#2a1b5a)">${ic('moon')}</div><div class="grow"><div class="pn">Sleep until morning</div><div class="pd">Full energy · new day &amp; new trends · videos earn overnight</div></div>${ic('chevron')}</button>
      <button class="post-type" data-a="nap" style="margin:0"><div class="pi" style="background:linear-gradient(135deg,#35dcff,#1f7fe0)">${ic('zzz')}</div><div class="grow"><div class="pn">Quick nap</div><div class="pd">${ic('bolt')} +35 energy · 2 hours</div></div>${ic('chevron')}</button>
      ${s.home >= 2 ? `<button class="post-type" data-a="sofa" style="margin:0"><div class="pi" style="background:linear-gradient(135deg,#ff7aa8,#ff3f7f)">${ic('sofa')}</div><div class="grow"><div class="pn">Chill on the sofa</div><div class="pd">${ic('bolt')} +15 energy · 1 hour</div></div>${ic('chevron')}</button>` : ''}</div>`);
    const m = modal({ title: 'Rest', sub: `${ic('bolt')} ${Math.round(s.needs.energy)} energy · ${hr >= 20 || hr < 6 ? 'It\'s getting late' : 'Daytime'}`, icon: 'bed', iconBg: 'linear-gradient(135deg,#6d6bff,#2a1b5a)', body, size: 'sm' });
    bind(body, { sleep: () => { m.close(true); this.sleep(); }, nap: () => { m.close(true); this.nap(); }, sofa: () => { m.close(true); this.sofa(); } });
    G.tutorial?.onRest?.(body);
  },
  async sleep() {
    let summary = null;
    await G.game.run('sleep', async () => {
      const s = G.s, W = G.world, A = G.audio;
      G.ui.hud.show(false);
      W.shot('bed');
      await W.lieDown();
      A.sfx('sleep');
      A.setMusic('night');
      const dim = h(`<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(10,10,40,.3),rgba(5,5,20,.85));opacity:0;transition:opacity 1.2s;pointer-events:none"></div>`);
      $('#fx').appendChild(dim);
      requestAnimationFrame(() => (dim.style.opacity = 1));
      const startFans = s.fans.vid, startMoney = s.money, startViews = s.stats.views;
      const toMorning = ((24 - G.game.hour) + 8) % 24 || 24;
      const zz = setInterval(() => W.vfx.emit('z', W.headWorld().add(new THREE.Vector3(0, 0.2, 0)), { count: 1, size: 0.16, life: 2, vel: new THREE.Vector3(0.15, 0.4, 0.1), wobble: 0.3 }), 450);
      // time-lapse
      const steps = 24;
      for (let i = 0; i < steps; i++) { G.game.advance(toMorning / steps, { noNeeds: true }); await sleep(2600 / steps); }
      clearInterval(zz);
      s.needs.energy = 100;
      s.needs.hunger = clamp(s.needs.hunger - 12, 0, 100);
      s.stats.sleeps++;
      bus.emit('q', { evt: 'sleep', n: 1 });
      dim.style.opacity = 0; setTimeout(() => dim.remove(), 1200);
      A.sfx('wake'); A.setMusic('chill');
      W.standUp();
      W.char.play('yawn', { restart: true });
      W.char.setExpression('happy', 2);
      await sleep(1500);
      W.char.play('celebrate', { restart: true });
      await sleep(900);
      W.char.play('idle');
      W.shot('room');
      summary = { fans: s.fans.vid - startFans, money: s.money - startMoney, views: s.stats.views - startViews };
      G.game.passive.views = 0;
    });
    if (summary && (summary.views > 0 || summary.fans > 0)) {
      const s = G.s;
      const tr = G.game.trend();
      const body = h(`<div class="col" style="gap:12px;text-align:center">
        <div class="display" style="font-size:26px">Good morning, ${esc(s.profile.name)}!</div>
        <div class="muted" style="font-weight:600">While you slept, your videos kept working:</div>
        <div class="res-stats"><div class="stat"><div class="sl">${ic('eye')}Views</div><div class="sv">+${fmt(summary.views)}</div></div><div class="stat subs"><div class="sl">${ic('users')}Subs</div><div class="sv">+${fmt(summary.fans)}</div></div><div class="stat money"><div class="sl">${ic('dollar')}Earned</div><div class="sv">+${fmtMoney(summary.money)}</div></div></div>
        <div class="chip hot" style="align-self:center;font-size:14px;padding:8px 14px">${ic('flame')}Today's trend: ${tr.hot[0].toUpperCase() + tr.hot.slice(1)} · Rising: ${tr.rising}</div>
        <button class="btn primary big" data-a="ok">${ic('sun')}Let's go</button></div>`);
      const m = modal({ title: `Day ${s.clock.day}`, icon: 'sun', iconBg: 'linear-gradient(135deg,#ffd577,#ff7a2f)', body, size: 'sm' });
      bind(body, { ok: () => m.close() });
      G.audio.sfx('reward');
    }
  },
  async nap() {
    await G.game.run('nap', async () => {
      const s = G.s, W = G.world;
      G.ui.hud.show(false);
      W.shot('bed');
      await W.lieDown();
      G.audio.sfx('sleep');
      for (let i = 0; i < 4; i++) { W.vfx.emit('z', W.headWorld().add(new THREE.Vector3(0, 0.2, 0)), { count: 1, size: 0.15, life: 2, vel: new THREE.Vector3(0.15, 0.4, 0.1), wobble: 0.3 }); G.game.advance(0.5, { noNeeds: true }); await sleep(450); }
      s.needs.energy = clamp(s.needs.energy + 35, 0, 100);
      s.needs.hunger = clamp(s.needs.hunger - 5, 0, 100);
      W.standUp();
      W.char.play('yawn', { restart: true });
      needPop('energy', 35);
      G.audio.sfx('wake');
      await sleep(1300);
      W.char.play('idle');
      W.shot('room');
    });
  },
  async sofa() {
    if (!G.world.room.st.sofa) return;
    await G.game.run('sofa', async () => {
      const s = G.s, W = G.world;
      G.ui.hud.show(false);
      await W.sitSofa();
      W.screens.data.tvGame = { scene: ['cozy', 'racing', 'space'][s.clock.day % 3], pal: ['#8fd26b', '#ffd1a6', '#e86f6f', '#fff4d6'] };
      W.shot('char', { dist: 4.2, yawAdd: 0.6 });
      W.char.setExpression('happy', 3);
      for (let i = 0; i < 4; i++) { G.game.advance(0.25, { noNeeds: true }); await sleep(500); }
      s.needs.energy = clamp(s.needs.energy + 15, 0, 100);
      needPop('energy', 15);
      W.standUp(); W.char.play('idle'); W.shot('room');
    });
  },
  async petCat() {
    await G.game.run('cat', async () => {
      const W = G.world, cat = W.room.cat;
      if (!cat) return;
      const p = cat.obj.position;
      cat.state = 'idle'; cat.t = 6;
      await W.walkTo(p.x + 0.45, p.z + 0.35, Math.atan2(-0.45, -0.35));
      W.char.play('reach', { restart: true });
      W.char.setExpression('happy', 2);
      for (let i = 0; i < 3; i++) { W.vfx.emit('heart', p.clone().add(new THREE.Vector3(0, 0.4, 0)), { count: 2, size: 0.12, life: 1.4, vel: new THREE.Vector3(0, 0.5, 0) }); G.audio.sfx('pop'); await sleep(350); }
      G.s.needs.energy = clamp(G.s.needs.energy + 3, 0, 100);
      W.char.play('idle');
    });
  },
  door() {
    if (G.game.busy) return;
    const body = h(`<div class="col" style="gap:8px">
      <button class="post-type" data-a="homes" style="margin:0"><div class="pi" style="background:linear-gradient(135deg,#ffd577,#e0920b)">${ic('home')}</div><div class="grow"><div class="pn">Find a new home</div><div class="pd">Bigger rooms, better views, more decor</div></div>${ic('chevron')}</button>
      <button class="post-type" data-a="order" style="margin:0"><div class="pi" style="background:linear-gradient(135deg,#ff9f43,#e0601f)">${ic('bag')}</div><div class="grow"><div class="pn">Order food</div><div class="pd">Delivered to your door</div></div>${ic('chevron')}</button></div>`);
    const m = modal({ title: 'Front Door', icon: 'door', iconBg: 'linear-gradient(135deg,#9b7bff,#4f36b8)', body, size: 'sm' });
    bind(body, { homes: () => { m.close(true); G.social.open('homes'); }, order: () => { m.close(true); G.social.open('delivery'); } });
  },
  async moveHome(id, isNew) {
    await G.game.run('move', async () => {
      const s = G.s, W = G.world, A = G.audio;
      const fade = h(`<div style="position:absolute;inset:0;background:#fff;opacity:0;transition:opacity .6s;pointer-events:none;z-index:2"></div>`);
      $('#fx').appendChild(fade);
      A.sfx('whoosh');
      requestAnimationFrame(() => (fade.style.opacity = 1));
      await sleep(700);
      s.home = id;
      W.rebuildRoom();
      W.cam.dist *= 1.8; W.cam.pitch = 1.0;
      fade.style.opacity = 0;
      await sleep(600); fade.remove();
      if (isNew) {
        A.sfx('levelup');
        W.char.play('celebrate', { restart: true });
        W.vfx.confetti(new THREE.Vector3(0, 1.5, 0), 200, 3.2);
        await sleep(1600);
        W.char.play('idle');
        const hm = HOMES[id];
        toast(`Welcome to your <b>${hm.name}</b>!`, { icon: 'home', color: 'var(--amber)', sub: `x${hm.viewMult} reach · more decor slots`, dur: 4000 });
        G.sdk?.happy();
      }
    });
  },
  wardrobe() { if (G.game.busy) return; G.creator.open('wardrobe'); },
};
