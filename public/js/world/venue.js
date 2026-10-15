// Places you can go out to: a rooftop creator party and a fan-meetup hall. Same interface the World uses for
// rooms (root, W/D/H, nav, interact, camCorner/camTarget, update) plus NPC characters you can walk up to.
import * as THREE from 'three';
import { mat, umat, glow, rbox, box, cyl, sph, plane, circle, at, group, canvasTex, disposeObj, torus } from './kit.js';
import { woodFloor, tiles } from './textures.js';
import * as F from './furniture.js';
import { NavGrid } from './nav.js';
import { Character } from './character.js';

const PI = Math.PI;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function signTex(text, color, w = 512, h = 160, font = '800 92px Bricolage, Outfit, sans-serif') {
  return canvasTex(w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = color; ctx.shadowBlur = 26; ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2 + 4);
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.85; ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

export class Venue {
  constructor(scene, kind, opts = {}) {
    this.scene = scene;
    this.kind = kind;
    this.root = new THREE.Group();
    this.root.name = 'venue-' + kind;
    scene.add(this.root);
    this.interact = [];
    this.npcs = [];
    this.anims = [];
    this.lights = [];
    this.time = 0;
    this.st = {};
    this.obst = [];
    if (kind === 'party') this.buildParty(opts);
    else this.buildMeetup(opts);
    this.buildNav();
    this.root.traverse((o) => { if (o.isMesh && !o.userData.noShadow) { o.receiveShadow = true; } });
  }
  camCorner() { return this.corner.clone(); }
  camTarget() { return this.target.clone(); }

  // ---------------------------------------------------------------- PARTY (rooftop)
  buildParty(opts) {
    const r = this.root;
    const W = (this.W = 12), D = (this.D = 9);
    this.H = 4.2;
    this.corner = V3(W / 2 - 0.4, 3.3, D / 2 - 0.4);
    this.target = V3(-1.2, 0.5, -1.6);
    // deck + border
    const deck = woodFloor('#4a3a35', 'wood'); deck.repeat.set(W / 1.6, D / 1.6);
    at(box(W, 0.08, D, mat('#ffffff', { rough: 0.55, map: deck, env: 0.7 })), r, 0, -0.04, 0).receiveShadow = true;
    at(rbox(W + 0.5, 0.5, D + 0.5, 0.04, mat('#15161c', { rough: 0.8 })), r, 0, -0.33, 0);
    // glass railing on the back and left (skyline views) + low parapet front/right
    const glassM = mat('#9fd0ff', { transparent: true, opacity: 0.14, rough: 0.05, env: 1.4 });
    const railM = mat('#c9ccd6', { rough: 0.25, metal: 0.85 });
    for (const [x, z, w, d] of [[0, -D / 2, W, 0.04], [-W / 2, 0, 0.04, D]]) {
      at(box(w, 1.05, d, glassM), r, x, 0.55, z).userData.noShadow = true;
      at(box(w + 0.02, 0.05, d + 0.04, railM), r, x, 1.1, z);
    }
    for (const [x, z, w, d] of [[0, D / 2, W, 0.25], [W / 2, 0, 0.25, D]]) at(box(w, 0.45, d, mat('#262833', { rough: 0.7 })), r, x, 0.22, z);
    // skyline backdrop (shared skyline texture is assigned by the World)
    this.skyMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false });
    const back = at(plane(46, 17, this.skyMat), r, 0, 4.2, -D / 2 - 12); back.userData.noShadow = true;
    const left = at(plane(40, 17, this.skyMat), r, -W / 2 - 12, 4.2, 0, 0, PI / 2, 0); left.userData.noShadow = true;
    const skyTop = at(plane(80, 80, new THREE.MeshBasicMaterial({ color: '#0a0b22', toneMapped: false })), r, 0, 14, 0, PI / 2, 0, 0); skyTop.userData.noShadow = true;
    // dance floor (animated light tiles)
    this.tiles = [];
    const df = group(r, -1.6, 0.005, -0.4);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      const m = umat('#14141c', { emissive: '#ff4d6d', ei: 0.0, rough: 0.3 });
      const t = at(rbox(0.62, 0.04, 0.62, 0.02, m), df, (i - 2.5) * 0.66, 0.02, (j - 1.5) * 0.66);
      t.userData.noShadow = true;
      this.tiles.push({ m, i, j });
    }
    this.st.dance = { x: -1.6, z: -0.4 };
    // DJ booth
    const dj = group(r, -1.6, 0, -D / 2 + 1.1);
    at(rbox(2.2, 1.0, 0.75, 0.04, mat('#17181f', { rough: 0.4 })), dj, 0, 0.5, 0);
    this.djPanel = umat('#000', { emissive: '#7b5cff', ei: 0.9 });
    at(box(2.1, 0.7, 0.01, this.djPanel), dj, 0, 0.5, 0.38).userData.noShadow = true;
    for (const s of [-1, 1]) {
      const deckM = mat('#2a2b33', { rough: 0.3, metal: 0.4 });
      at(cyl(0.2, 0.2, 0.03, deckM, 28), dj, s * 0.55, 1.02, 0);
      const disc = at(cyl(0.17, 0.17, 0.012, mat('#0d0d10', { rough: 0.2 }), 28), dj, s * 0.55, 1.045, 0);
      at(box(0.06, 0.004, 0.17, mat('#ff4d6d')), disc, 0, 0.008, 0.06);
      this.anims.push((t) => { disc.rotation.y = t * 3.2 * s; });
    }
    at(rbox(0.36, 0.05, 0.28, 0.02, mat('#1c1d24', { rough: 0.4 })), dj, 0, 1.03, 0.05);
    const djSign = at(plane(2.2, 0.7, mat('#ffffff', { map: signTex('PULSE LIVE', '#ff4d6d'), transparent: true, rough: 0.8 })), dj, 0, 2.3, -0.15);
    djSign.userData.noShadow = true;
    // speakers
    for (const s of [-1, 1]) {
      const sp = group(r, -1.6 + s * 1.65, 0, -D / 2 + 1.0);
      at(rbox(0.6, 1.5, 0.55, 0.03, mat('#111218', { rough: 0.5 })), sp, 0, 0.75, 0);
      for (const y of [0.45, 1.05]) { at(cyl(0.2, 0.2, 0.02, mat('#2b2c35', { rough: 0.4 }), 24), sp, 0, y, 0.28, PI / 2, 0, 0); const cone = at(cyl(0.12, 0.12, 0.02, mat('#0a0a0d'), 24), sp, 0, y, 0.295, PI / 2, 0, 0); this.anims.push((t, beat) => { cone.scale.setScalar(1 + beat * 0.12); }); }
      this.obst.push({ x: sp.position.x, z: sp.position.z, hx: 0.32, hz: 0.3 });
    }
    this.obst.push({ x: -1.6, z: -D / 2 + 1.1, hx: 1.1, hz: 0.4 });
    // bar (right side)
    const bar = group(r, W / 2 - 1.3, 0, -1.0);
    at(rbox(0.75, 1.08, 3.4, 0.04, mat('#22232c', { rough: 0.35 })), bar, 0, 0.54, 0);
    at(rbox(0.85, 0.05, 3.5, 0.02, mat('#d9cfc0', { rough: 0.2, env: 1.2 })), bar, 0, 1.1, 0);
    const barGlow = glow('#3cc8ff', 2.2);
    at(box(0.02, 0.03, 3.4, barGlow), bar, -0.39, 0.1, 0).userData.noShadow = true;
    // back shelf with bottles
    const shelf = group(r, W / 2 - 0.25, 0, -1.0);
    at(rbox(0.3, 2.2, 3.4, 0.03, mat('#1a1b22', { rough: 0.5 })), shelf, 0, 1.1, 0);
    const bottleCols = ['#ff4d6d', '#3cc8ff', '#8ee05a', '#ffbe55', '#8f7dff'];
    for (let k = 0; k < 2; k++) {
      at(box(0.32, 0.03, 3.3, mat('#2c2d36')), shelf, -0.05, 1.2 + k * 0.5, 0);
      for (let i = 0; i < 9; i++) at(cyl(0.035, 0.04, 0.28, mat(bottleCols[(i + k) % 5], { rough: 0.1, transparent: true, opacity: 0.85, emissive: bottleCols[(i + k) % 5], ei: 0.5 }), 10), shelf, -0.08, 1.36 + k * 0.5, -1.45 + i * 0.36);
    }
    const barSign = at(plane(1.8, 0.56, mat('#ffffff', { map: signTex('BAR', '#3cc8ff'), transparent: true, rough: 0.8 })), r, W / 2 - 0.12, 2.6, -1.0, 0, -PI / 2, 0);
    barSign.userData.noShadow = true;
    for (let i = 0; i < 4; i++) {
      const sx = W / 2 - 2.05, sz = -2.2 + i * 0.8;
      at(cyl(0.2, 0.2, 0.06, mat('#3a3b46', { rough: 0.5 }), 20), r, sx, 0.78, sz);
      at(cyl(0.03, 0.04, 0.75, mat('#c9ccd6', { rough: 0.25, metal: 0.8 }), 8), r, sx, 0.38, sz);
    }
    this.obst.push({ x: W / 2 - 1.3, z: -1.0, hx: 0.45, hz: 1.75 }, { x: W / 2 - 0.25, z: -1.0, hx: 0.2, hz: 1.75 });
    this.st.bar = { x: W / 2 - 2.35, z: -1.0, ry: PI / 2 };
    // lounge (front-left)
    const th = { fabric: '#4b3f7a', fabric2: '#2a2547', wood: '#3a2c30', metal: '#c9ccd6', trim: '#ffbe55' };
    const so = F.buildSofa(th, '#ff4d6d');
    at(so, r, -W / 2 + 1.0, 0, 2.2, 0, PI / 2, 0);
    this.obst.push({ x: -W / 2 + 1.0, z: 2.2, hx: 0.46, hz: 1.05 });
    const ct = F.buildCoffeeTable(th);
    at(ct, r, -W / 2 + 2.2, 0, 2.2, 0, PI / 2, 0);
    this.obst.push({ x: -W / 2 + 2.2, z: 2.2, hx: 0.28, hz: 0.5 });
    // plants & heaters
    for (const [x, z] of [[-W / 2 + 0.6, -D / 2 + 0.6], [W / 2 - 0.6, D / 2 - 0.8], [-W / 2 + 0.6, D / 2 - 0.6], [2.4, -D / 2 + 0.6]]) {
      const p = F.buildDecor('plant_big', th, '#ff4d6d', {});
      at(p, r, x, 0, z);
      this.obst.push({ x, z, hx: 0.3, hz: 0.3 });
    }
    // string lights overhead (catenaries between poles)
    const poleM = mat('#2b2c35', { rough: 0.5, metal: 0.5 });
    const bulbCols = ['#ffd38a', '#ff9fb2', '#9fe0ff'];
    const poles = [[-W / 2 + 0.3, -D / 2 + 0.3], [W / 2 - 0.3, -D / 2 + 0.3], [W / 2 - 0.3, D / 2 - 0.3], [-W / 2 + 0.3, D / 2 - 0.3]];
    for (const [x, z] of poles) at(cyl(0.04, 0.05, 3.4, poleM, 10), r, x, 1.7, z);
    const mid = (z) => [[-W / 2 + 0.3, z], [W / 2 - 0.3, z]];
    for (const z of [-0.9, 1.6]) for (const [x] of mid(z)) at(cyl(0.04, 0.05, 3.4, poleM, 10), r, x, 1.7, z);
    const strands = [[poles[0], poles[1]], [poles[3], poles[2]], mid(-0.9), mid(1.6)];
    this.bulbs = [];
    for (const [a, b] of strands) {
      const n = 26;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
        const y = 3.3 - Math.sin(t * PI) * 0.55;
        const bm = umat('#fff', { emissive: bulbCols[i % 3], ei: 1.3 });
        const bl = at(sph(0.045, bm, 8, 6), r, x, y, z);
        bl.userData.noShadow = true; bl.castShadow = false;
        this.bulbs.push({ m: bm, k: i });
      }
    }
    // colored lights
    const add = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1.6); l.position.set(x, y, z); r.add(l); this.lights.push(l); return l; };
    this.djLight = add('#8f7dff', 6, 7, -1.6, 2.4, -D / 2 + 2.2);
    this.danceLight = add('#ff4d6d', 3, 6, -1.6, 2.0, 0.2);
    add('#3cc8ff', 4, 6, W / 2 - 1.8, 2.4, -1.0);
    add('#ffcf8a', 3, 7, -W / 2 + 2, 2.6, 2.4);
    add('#ffcf8a', 2.5, 9, 1.5, 3, 1.5);
    // spots for people
    this.spots = [
      { x: W / 2 - 2.6, z: -1.8, ry: PI / 2 + 0.3, clip: 'talk' },
      { x: W / 2 - 2.6, z: -0.2, ry: PI / 2 - 0.2, clip: 'idle' },
      { x: -2.3, z: 0.1, ry: 0.3, clip: 'dance' },
      { x: -0.9, z: -0.8, ry: -0.6, clip: 'dance' },
      { x: -W / 2 + 2.2, z: 3.25, ry: PI, clip: 'phone' },
      { x: 1.4, z: -2.4, ry: 0.4, clip: 'talk' },
      { x: 1.1, z: 1.6, ry: -2.4, clip: 'idle' },
    ];
    this.st.spawn = { x: W / 2 - 1.5, z: D / 2 - 1.2, ry: PI + 0.6 };
  }

  // ---------------------------------------------------------------- FAN MEETUP (convention booth)
  buildMeetup(opts) {
    const r = this.root;
    const W = (this.W = 10), D = (this.D = 8);
    this.H = 4.5;
    this.corner = V3(1.9, 2.7, D / 2 - 0.4);
    this.target = V3(-0.7, 0.75, -1.0);
    const fl = tiles('#2a2d3a', '#3c4152'); fl.repeat.set(W / 2.4, D / 2.4);
    at(box(W, 0.08, D, mat('#ffffff', { rough: 0.35, map: fl, env: 0.9 })), r, 0, -0.04, 0).receiveShadow = true;
    const wallM = mat('#1b1d27', { rough: 0.85 });
    at(box(W, this.H, 0.2, wallM), r, 0, this.H / 2, -D / 2 - 0.1);
    at(box(0.2, this.H, D, wallM), r, -W / 2 - 0.1, this.H / 2, 0);
    for (const [x, z, w, d] of [[0, D / 2 + 0.1, W, 0.2], [W / 2 + 0.1, 0, 0.2, D]]) { const m = at(box(w, this.H, d, wallM), r, x, this.H / 2, z); m.userData.noShadow = true; }
    const ceil = at(box(W, 0.1, D, mat('#111219', { rough: 0.9 })), r, 0, this.H, 0); ceil.userData.noShadow = true;
    // stage backdrop with channel banner
    const accent = opts.accent || '#ff4d6d';
    const banner = canvasTex(1024, 384, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#191b26'); g.addColorStop(1, '#2a1830');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = accent; ctx.fillRect(0, h - 26, w, 26);
      ctx.font = '800 120px Bricolage, Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
      ctx.fillText(opts.name || 'Creator', w / 2, h * 0.42);
      ctx.font = '700 46px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('FAN MEETUP · MEET & GREET', w / 2, h * 0.72);
    });
    at(plane(6, 2.25, mat('#ffffff', { map: banner, rough: 0.7 })), r, -0.6, 2.4, -D / 2 + 0.02).userData.noShadow = true;
    // signing table
    const table = group(r, -0.6, 0, -D / 2 + 1.6);
    at(rbox(2.6, 0.06, 0.8, 0.02, mat('#f2efe9', { rough: 0.5 })), table, 0, 0.76, 0);
    at(rbox(2.6, 0.7, 0.04, 0.01, mat(accent, { rough: 0.6 })), table, 0, 0.4, 0.38);
    for (let i = 0; i < 6; i++) at(rbox(0.16, 0.02, 0.22, 0.004, mat(['#ffffff', '#ffe28a', '#bfe6ff'][i % 3], { rough: 0.6 })), table, -0.9 + i * 0.36, 0.8, 0.05, 0, 0.2 * (i % 2 ? 1 : -1), 0);
    this.obst.push({ x: -0.6, z: -D / 2 + 1.6, hx: 1.35, hz: 0.45 });
    this.st.host = { x: -0.6, z: -D / 2 + 0.95, ry: 0 };
    this.st.front = { x: -0.6, z: -D / 2 + 2.45, ry: PI };
    // queue stanchions
    const postM = mat('#c9ccd6', { rough: 0.25, metal: 0.85 });
    const ropeM = mat('#b0243a', { rough: 0.6 });
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
      const x = -0.6 + s * 0.65, z = -D / 2 + 2.9 + i * 0.85;
      at(cyl(0.03, 0.03, 0.95, postM, 10), r, x, 0.48, z);
      at(cyl(0.13, 0.13, 0.03, postM, 18), r, x, 0.015, z);
      if (i < 4) { const rp = at(cyl(0.012, 0.012, 0.85, ropeM, 6), r, x, 0.86, z + 0.425, PI / 2, 0, 0); }
    }
    // pop-up displays & lights
    for (const [x, c] of [[-W / 2 + 0.8, '#3cc8ff'], [W / 2 - 1.0, '#8f7dff']]) {
      at(rbox(1.0, 2.2, 0.08, 0.02, mat('#20222d', { rough: 0.5 })), r, x, 1.1, -D / 2 + 0.6);
      at(box(0.9, 1.8, 0.01, mat('#ffffff', { emissive: c, ei: 0.6, rough: 0.4 })), r, x, 1.15, -D / 2 + 0.65).userData.noShadow = true;
    }
    const add = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1.5); l.position.set(x, y, z); r.add(l); this.lights.push(l); return l; };
    add('#fff1dc', 4.5, 9, -0.6, 3.6, -1.2);
    add(accent, 4, 6, -0.6, 2.2, -D / 2 + 1.2);
    add('#9fd8ff', 3, 9, 2.5, 3.5, 2);
    this.queueSpots = Array.from({ length: 6 }, (_, i) => ({ x: -0.6, z: -D / 2 + 2.6 + i * 0.75, ry: PI }));
    this.st.spawn = { x: -0.6, z: -D / 2 + 0.95, ry: 0 };
  }

  buildNav() {
    const W = this.W, D = this.D;
    const nav = new NavGrid(-W / 2 + 0.2, -D / 2 + 0.2, W / 2 - 0.2, D / 2 - 0.2, 0.15);
    for (const o of this.obst) nav.addRect(o.x, o.z, o.hx, o.hz, o.ry || 0, 0.22);
    this.nav = nav;
  }
  blockNPC(x, z) { this.nav.addRect(x, z, 0.18, 0.18, 0, 0.12); }

  // ---------------------------------------------------------------- NPCs
  addNPC(id, label, profile, spot, data = {}) {
    const c = new Character(profile);
    c.root.position.set(spot.x, 0, spot.z);
    c.root.rotation.y = spot.ry || 0;
    c.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    this.root.add(c.root);
    const clip = spot.clip === 'talk' ? 'talkStand' : spot.clip || 'idle';
    c.play(clip);
    if (clip === 'phone') c.showProp('phone');
    c.clipT = Math.random() * 10;
    c.setExpression('happy', 999);
    c.root.userData.interact = id;
    const npc = { id, c, spot, data, baseClip: clip, react: 0 };
    this.npcs.push(npc);
    if (label) this.interact.push({ id, obj: c.root, label, icon: 'user' });
    if (spot.block !== false) this.blockNPC(spot.x, spot.z);
    return npc;
  }
  npc(id) { return this.npcs.find((n) => n.id === id); }
  moveNPC(n, x, z, ry, clip) {
    return new Promise((res) => { n.goal = { x, z, ry, clip, res }; n.c.play('walk'); n.c.speed = 1.3; });
  }
  removeNPC(n) {
    this.npcs = this.npcs.filter((x) => x !== n);
    this.interact = this.interact.filter((i) => i.obj !== n.c.root);
    this.root.remove(n.c.root); disposeObj(n.c.root);
  }

  update(dt, player) {
    this.time += dt;
    const t = this.time;
    const beat = Math.pow(Math.max(0, Math.sin(t * PI * 2 * 2.0)), 6);
    for (const a of this.anims) a(t, beat);
    if (this.tiles) for (const tl of this.tiles) {
      const ph = (tl.i * 0.7 + tl.j * 1.3 + Math.floor(t * 2) * 0.9) % 3;
      tl.m.emissive.setHSL(((tl.i + tl.j) * 0.08 + t * 0.07) % 1, 0.9, 0.5);
      tl.m.emissiveIntensity = ph < 1 ? 0.7 + beat * 0.5 : 0.12;
    }
    if (this.bulbs) for (const b of this.bulbs) b.m.emissiveIntensity = 1.0 + Math.sin(t * 2 + b.k) * 0.35;
    if (this.djPanel) this.djPanel.emissive.setHSL((t * 0.08) % 1, 0.8, 0.5);
    if (this.danceLight) { this.danceLight.color.setHSL((t * 0.1) % 1, 0.9, 0.6); this.danceLight.intensity = 2.5 + beat * 2.5; }
    if (this.djLight) this.djLight.position.x = -1.6 + Math.sin(t * 1.3) * 1.2;
    for (const n of this.npcs) {
      const c = n.c;
      // glance at the player when close
      if (player) {
        const dx = player.x - c.root.position.x, dz = player.z - c.root.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 2.2 && n.baseClip !== 'dance') {
          let a = Math.atan2(dx, dz) - c.root.rotation.y;
          while (a > PI) a -= 2 * PI; while (a < -PI) a += 2 * PI;
          c.lookTargetYaw = Math.max(-0.9, Math.min(0.9, a));
        } else c.lookTargetYaw = 0;
      }
      if (n.goal) {
        const g = n.goal, p = c.root.position;
        const dx = g.x - p.x, dz = g.z - p.z, d = Math.hypot(dx, dz);
        if (d < 0.05) { p.x = g.x; p.z = g.z; c.root.rotation.y = g.ry ?? c.root.rotation.y; n.baseClip = g.clip || 'idle'; c.play(n.baseClip); const r = g.res; n.goal = null; r(); }
        else {
          const st = Math.min(d, 1.3 * dt);
          p.x += (dx / d) * st; p.z += (dz / d) * st;
          let a = Math.atan2(dx, dz) - c.root.rotation.y; while (a > PI) a -= 2 * PI; while (a < -PI) a += 2 * PI;
          c.root.rotation.y += a * Math.min(1, dt * 10);
        }
      }
      if (n.react > 0) { n.react -= dt; if (n.react <= 0) c.play(n.baseClip); }
      c.update(dt);
    }
  }
  dispose() {
    for (const n of this.npcs) disposeObj(n.c.root);
    this.scene.remove(this.root);
    disposeObj(this.root);
  }
}
