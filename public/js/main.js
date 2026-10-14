// STREAMER RISE — bootstrap & main loop.
import { G } from './game/ctx.js';
import { S, load, save } from './core/state.js';
import { bus } from './core/bus.js';
import { injectIcons } from './ui/icons.js';
import { HUD, Labels, $, toast, anyModal } from './ui/ui.js';
import { World } from './world/world.js';
import { AudioEngine } from './audio/audio.js';
import { Game } from './game/game.js';
import { Tutorial } from './game/tutorial.js';
import { Create } from './flows/create.js';
import { Stream } from './flows/stream.js';
import { Social } from './flows/social.js';
import { Life } from './flows/life.js';
import { Shop } from './flows/shop.js';
import { Meta } from './flows/meta.js';
import { Creator } from './flows/creator.js';
import { SDK } from './sdk.js';
import { sleep, dayIndex } from './core/util.js';
import { eventForDay, EVENTS } from './data/events.js';

const bar = (p) => { const b = document.getElementById('loadbar'); if (b) b.style.width = p * 100 + '%'; };

async function boot() {
  bar(0.1);
  const sdkP = SDK.init();
  injectIcons();
  const hadSave = load();
  const s = S.state;
  bar(0.25);
  // world
  let world;
  try {
    world = new World(document.getElementById('world'));
  } catch (e) {
    document.querySelector('#intro .tagl').textContent = 'WebGL is required to play. Please enable hardware acceleration.';
    throw e;
  }
  G.world = world;
  window.__G = G;
  world.state = s;
  const qp = new URLSearchParams(location.search).get('q');
  world.setQuality(qp || s.settings.quality);
  world.build(s);
  bar(0.6);
  // audio
  const audio = new AudioEngine();
  audio.vol = { music: s.settings.music, sfx: s.settings.sfx };
  G.audio = audio;
  let platformMuted = false;
  const applyVol = () => audio.setVolumes(platformMuted ? 0 : s.settings.music, platformMuted ? 0 : s.settings.sfx);
  const unlock = () => { audio.unlock(); applyVol(); };
  sdkP.then(() => SDK.onMute((m) => { platformMuted = m; applyVol(); }));
  addEventListener('pointerdown', unlock, { capture: true });
  addEventListener('keydown', unlock, { capture: true });
  // systems
  G.game = new Game();
  G.create = Create; G.stream = Stream; G.social = Social; G.life = Life; G.shop = Shop; G.meta = Meta; G.creator = Creator; G.tutorial = Tutorial; G.sdk = SDK;
  G.ui = { hud: new HUD(), labels: new Labels() };
  Meta.init();
  Meta.refreshDeals();
  bus.on('world:pick', (id) => G.game.onPick(id));
  bus.on('world:floor', (p) => G.game.onFloor(p));
  bus.on('sfx', (n) => audio.sfx(n));
  world.applyTime(G.game.hour, true);
  world.powerOff();
  bar(0.9);
  await sdkP;
  SDK.loadingStop();
  // first frame
  world.update(0.016); world.render();
  bar(1);
  // main loop
  let last = performance.now(), slow = 0;
  const perf = { frames: 0, time: 0, checks: 0 };
  const loop = (t) => {
    const dt = Math.min(0.1, (t - last) / 1000); last = t;
    if (window.__pauseRender) { requestAnimationFrame(loop); return; }
    world.update(dt);
    G.game.update(dt);
    G.ui.hud.update(dt);
    G.ui.labels.update();
    world.render();
    // adaptive quality on 'auto': step down if the device struggles
    if (s.settings.quality === 'auto' && !qp && perf.checks < 3 && !document.hidden) {
      perf.frames++; perf.time += (t - (perf.lastT || t)) / 1000; perf.lastT = t;
      if (perf.time > 6) {
        const fps = perf.frames / perf.time;
        perf.checks++; perf.frames = 0; perf.time = 0;
        if (fps < 26 && world.quality !== 'low') { world.setQuality(world.quality === 'high' ? 'medium' : 'low'); world.applyTime(G.game.hour, true); console.info('Auto quality ->', world.quality, fps.toFixed(1) + 'fps'); }
      }
    }
    slow += dt;
    if (slow > 0.5) {
      slow = 0;
      G.game.updateGoalCard();
      Meta.updateBadges();
      if (!G.flow || G.flow === 'phone') {
        const hh = G.game.hour;
        if (audio.mode !== 'live') audio.setMusic(hh >= 21 || hh < 6 ? 'night' : 'chill');
      }
      if (Tutorial.active && !G.game.busy && !anyModal()) Tutorial.refresh();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  // intro → gameplay
  await sleep(hadSave ? 500 : 900);
  const intro = document.getElementById('intro');
  intro.classList.add('out');
  setTimeout(() => intro.remove(), 700);
  world.cam.dist *= 2.2; world.cam.pitch = 1.1; world.cam.yaw = 1.2;
  world.inputEnabled = true;
  SDK.gameplayStart();
  await sleep(700);
  if (!s.created_char) {
    await Creator.open('create');
  }
  G.ui.hud.show(true);
  G.ui.hud.setPortrait();
  Tutorial.start();
  if (!Tutorial.active) {
    G.game.refreshObjective();
    const cur = eventForDay(dayIndex());
    if (s.reminders.includes(cur.key)) {
      s.reminders = s.reminders.filter((k) => k !== cur.key);
      toast(`<b>${EVENTS[cur.id].name}</b> is live! Your reminder`, { icon: 'calendar', color: EVENTS[cur.id].colors[0], dur: 4500 });
    }
    if (Meta.dailyAvailable()) setTimeout(() => Meta.daily(true), 500);
    if (hadSave) {
      const awayH = Math.max(0, (Date.now() - (s.lastPlayed || Date.now())) / 3600000);
      if (awayH > 0.05) G.game.tailViews(Math.min(30, awayH * 6));
      setTimeout(() => G.game.flushPassive(true), 1500);
    }
  }
  addEventListener('visibilitychange', () => { if (document.hidden) { save(true); SDK.gameplayStop(); audio.ctx?.suspend(); } else { SDK.gameplayStart(); audio.ctx?.resume(); } });
  addEventListener('pagehide', () => save(true));
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const wrap = [...document.querySelectorAll('.modal-wrap')].pop();
    const x = wrap?.querySelector('[data-x]');
    if (x) { x.click(); return; }
    if (Social.ctx) Social.ctx.close();
  });
  window.__G = G;
}
boot().catch((e) => { console.error(e); });
