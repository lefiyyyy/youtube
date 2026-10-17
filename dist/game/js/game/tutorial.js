// Fast in-world tutorial: desk -> first video -> reward -> snack -> first upgrade -> first stream.
import * as THREE from '../../vendor/three/three.module.min.js';
import { G } from './ctx.js';
import { bus } from '../core/bus.js';
import { $, $$, h, bind, ic, modal, toast, pointAt } from '../ui/ui.js';
import { save } from '../core/state.js';
import { sleep, fmtMoney } from '../core/util.js';

const STEPS = [
  { id: 'desk', icon: 'play', text: 'Sit at your desk & record a video', target: 'desk', dock: '[data-a=create]' },
  { id: 'eat', icon: 'food', text: "You're hungry — grab a snack", target: 'fridge', dock: '[data-a=kitchen]' },
  { id: 'buy', icon: 'cart', text: 'Buy your first upgrade', dock: '[data-a=shop]' },
  { id: 'live', icon: 'live', text: 'Go live for the first time!', target: 'desk', dock: '[data-a=create]' },
];

export const Tutorial = {
  get active() { return !G.s.tutorial.done; },
  get step() { return STEPS[G.s.tutorial.step]; },
  start() {
    if (!this.active) return;
    bus.on('video:done', () => this.after('video'));
    bus.on('q', (e) => { if (e.evt === 'eat') this.after('eat'); if (e.evt === 'buy') this.after('buy'); });
    bus.on('stream:done', () => this.after('live'));
    bus.on('ui:modalClosed', () => setTimeout(() => this.refresh(), 60));
    this.refresh();
  },
  refresh() {
    if (!this.active) { G.ui.labels.clearMarkers(); G.ui.hud.highlight(null); pointAt(null); return; }
    const st = this.step;
    G.ui.hud.setObjective({ icon: st.icon, text: st.text, tut: true, progress: `${G.s.tutorial.step + 1}/${STEPS.length}` });
    G.ui.labels.clearMarkers();
    if (G.game.busy) { G.ui.hud.highlight(null); pointAt(null); return; }
    if (st.target) {
      const obj = st.target === 'desk' ? G.world.room.rig : G.world.room.fridge;
      G.ui.labels.marker('tut', obj, 'down');
    }
    G.ui.hud.highlight(st.dock);
    const dockEl = st.dock && $(`#hud ${st.dock}`);
    pointAt(dockEl && !document.querySelector('.modal-wrap') ? dockEl : null);
  },
  after(id) {
    if (!this.active) return;
    const s = G.s, cur = this.step.id;
    if (id === 'video' && cur === 'desk') { s.tutorial.step = 1; G.game.queue(() => this.firstVideoReward()); }
    else if (id === 'eat' && cur === 'eat') { s.tutorial.step = 2; G.game.queue(() => this.nudgeShop()); }
    else if (id === 'buy' && cur === 'buy') { s.tutorial.step = 3; }
    else if (id === 'live' && cur === 'live') { s.tutorial.step = 4; s.tutorial.done = true; G.game.queue(() => this.finish()); }
    else return;
    save(true);
    this.refresh();
  },
  firstVideoReward() {
    return new Promise((res) => {
      const s = G.s;
      const body = h(`<div class="lvlup"><div class="burst"></div><div class="ln" style="font-size:48px;background:radial-gradient(circle at 35% 30%,#fff,#ff5a5f 60%,#b8202a)">${ic('vidora')}</div>
        <h2>First upload!</h2><div class="muted" style="position:relative;font-weight:700">Vidora sent you a <b style="color:#fff">New Creator Grant</b></div>
        <div class="row" style="position:relative;justify-content:center;margin:14px 0"><span class="chip good" style="font-size:16px;padding:8px 14px">${ic('dollar')}${fmtMoney(120)}</span><span class="chip info" style="font-size:16px;padding:8px 14px">${ic('spark')}10</span><span class="chip gold" style="font-size:16px;padding:8px 14px">${ic('star')}30 XP</span></div>
        <button class="btn go big shine" data-a="ok" style="position:relative">${ic('check')}Collect</button></div>`);
      const m = modal({ body, size: 'sm', noClose: true, onClose: res });
      G.audio.sfx('reward');
      bind(body, { ok: (b) => { const r = b.getBoundingClientRect(), p = { x: r.left + r.width / 2, y: r.top }; G.game.addMoney(120, p); G.game.addSparks(10, p); G.game.addXP(30, p); s.needs.hunger = Math.min(s.needs.hunger, 22); m.close(); G.world.char.setExpression('sad', 2); G.ui.labels.bubble(G.world.char.root, `${ic('food')} So hungry...`); } });
    });
  },
  nudgeShop() { toast('Upgrades boost views & chat. Try a <b>USB Mic</b>!', { icon: 'mic', color: 'var(--cyan)', dur: 3500 }); },
  finish() {
    return new Promise((res) => {
      const s = G.s;
      const body = h(`<div class="lvlup"><div class="burst"></div><div class="ln" style="font-size:52px">${ic('crown')}</div>
        <h2>You're a creator now!</h2><div class="muted" style="position:relative;font-weight:700;max-width:380px;margin:0 auto">Grow your channel, upgrade your room, finish daily quests and events. Next up: <b style="color:#fff">100 subscribers</b>.</div>
        <div class="row" style="position:relative;justify-content:center;margin:14px 0"><span class="chip info" style="font-size:15px;padding:8px 14px">${ic('spark')}15</span><span class="chip gold" style="font-size:15px;padding:8px 14px">${ic('bolt')}Double XP x3</span></div>
        <button class="btn primary big shine" data-a="ok" style="position:relative">${ic('rocket')}Let's grow</button></div>`);
      const m = modal({ body, size: 'sm', noClose: true, onClose: res });
      G.audio.sfx('levelup');
      G.world.vfx.confetti(G.world.char.root.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 160, 3);
      bind(body, { ok: (b) => { const r = b.getBoundingClientRect(); G.game.addSparks(15, { x: r.left + r.width / 2, y: r.top }); G.game.addBuff('xp2', 3); m.close(); G.ui.labels.clearMarkers(); G.ui.hud.highlight(null); pointAt(null); G.game.refreshObjective(); G.game.queue(() => G.meta.dailyAvailable() && G.meta.daily(true)); } }); // after any level-up / reward modals
    });
  },
  // ---- hooks from flows (highlight the right choice)
  onPicker(kind, el) {
    if (!this.active) return;
    pointAt(null);
    const st = this.step.id;
    if (kind === 'game') { const c = $('[data-a=g]', el); c?.classList.add('hl'); }
    if (kind === 'content') { const c = $('[data-id=gameplay]', el); c?.classList.add('hl'); }
    if (kind === 'publish') { $('[data-a=pub]', el)?.classList.add('hl'); }
  },
  onHub(el) {
    if (!this.active) return;
    pointAt(null);
    const st = this.step.id;
    const t = st === 'live' ? $('[data-a=stream]', el) : st === 'desk' ? $('[data-a=video]', el) : null;
    t?.classList.add('hl');
    if (t) $$('.hub-card', el).forEach((c) => { if (c !== t) c.style.opacity = 0.45; });
  },
  onRecord(el) {
    if (!this.active || G.s.stats.videos > 0) return;
    const tip = h(`<div class="glass" style="position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);padding:14px 20px;border-radius:16px;text-align:center;pointer-events:none;animation:modalIn .4s;z-index:5"><div class="display" style="font-size:20px">Your creator is recording!</div><div style="font-weight:600;font-size:13.5px;margin-top:6px;color:var(--muted)">${ic('target')} Tap the highlights that pop up to capture the best moments</div></div>`);
    el.appendChild(tip);
    setTimeout(() => tip.remove(), 2800);
  },
  onEdit() {},
  onResults(el) { if (this.active) { $('[data-a=ok]', el)?.classList.add('hl'); } },
  onKitchen(body) { if (this.active && this.step.id === 'eat') { $('[data-id=noodles]', body)?.classList.add('hl'); pointAt(null); } },
  onShop(body) {
    if (!this.active || this.step.id !== 'buy') return;
    pointAt(null);
    const card = $('[data-focus=mic]', body);
    card?.classList.add('hl');
    card?.scrollIntoView({ block: 'center' });
  },
  onStream(el) {
    if (!this.active || G.s.stats.streams > 0) return;
    const tip = h(`<div class="glass" style="position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);padding:16px 22px;border-radius:20px;text-align:center;pointer-events:none;animation:modalIn .4s;z-index:5;max-width:80vw"><div class="display" style="font-size:22px">You're LIVE!</div><div style="font-weight:700;font-size:14px;margin-top:6px;color:var(--muted)">Talk to chat, hit Big Plays, thank donations &amp; ban trolls to build hype</div></div>`);
    el.appendChild(tip);
    setTimeout(() => tip.remove(), 3200);
    $$('.s-act', el).slice(0, 2).forEach((b) => b.classList.add('hl'));
    setTimeout(() => $$('.s-act', el).forEach((b) => b.classList.remove('hl')), 5000);
  },
  onPhone() {},
};
