// Room / home builder: walls, windows, furniture, gear rig, decor slots, stations and nav.
import * as THREE from 'three';
import { mat, umat, glow, rbox, box, cyl, sph, plane, circle, at, group, shadows, canvasTex } from './kit.js';
import { woodFloor, marble, tiles, brick, paint } from './textures.js';
import * as F from './furniture.js';
import { NavGrid } from './nav.js';
import { THEMES, HOMES, decorById } from '../data/decor.js';
import { MILESTONES } from '../data/progression.js';
import { easeOutBack, clamp } from '../core/util.js';

const PI = Math.PI;
// Per home-tier layout. Back wall at z=-D/2, left wall at x=-W/2. Camera looks from +x,+z.
export const LAYOUTS = [
  { // Tiny Bedroom 6x5
    backWall: 'paint',
    windows: [{ wall: 'back', x: -1.9, y: 1.0, w: 1.3, h: 1.25, style: 'classic' }],
    door: { wall: 'back', x: 2.35 },
    desk: { x: 0.1 },
    bed: { x: -2.44, z: -1.42, ry: 0 },
    night: { x: -1.62, z: -2.24 },
    fridge: { x: -2.68, z: 1.98, ry: PI / 2 },
    counter: { x: -2.68, z: 0.98, len: 1.0, ry: PI / 2, items: ['microwave', 'kettle'] },
    mirror: { wall: 'left', z: 0.02 },
    shelves: [{ wall: 'back', x: 0.1, y: 1.5, w: 1.0 }],
    slots: {
      wall: [{ wall: 'back', x: 0.1, y: 2.1 }, { wall: 'left', z: -1.4, y: 1.8 }, { wall: 'back', x: -0.95, y: 1.75 }, { wall: 'back', x: 1.45, y: 1.75 }],
      floor: [{ x: 2.55, z: -0.85, ry: -PI / 2 }, { x: 2.55, z: 0.55, ry: -PI / 2 }, { x: -1.25, z: 2.1, ry: 0.4, small: true }],
      rug: [{ x: 0.5, z: 0.55 }],
      ceiling: [{ x: 0.6, z: 0.6 }],
      plaque: [{ wall: 'left', z: 1.1, y: 2.05 }, { wall: 'left', z: 1.55, y: 2.05 }, { wall: 'left', z: 0.65, y: 2.05 }, { wall: 'left', z: -0.5, y: 2.3 }, { wall: 'left', z: 2.0, y: 2.05 }],
      kitchen: [{ along: 0.25 }],
    },
  },
  { // City Apartment 8x6
    backWall: 'paint',
    windows: [{ wall: 'back', x: -2.55, y: 0.9, w: 2.2, h: 1.45, style: 'classic' }],
    door: { wall: 'left', z: 2.25 },
    desk: { x: 0.35 },
    bed: { x: -3.15, z: -1.95, ry: 0 },
    night: { x: -2.05, z: -2.76 },
    fridge: { x: 3.55, z: -2.62, ry: 0 },
    counter: { x: 2.35, z: -2.68, len: 1.6, ry: 0, items: ['stove', 'kettle'] },
    mirror: { wall: 'left', z: -0.25 },
    shelves: [{ wall: 'back', x: 0.35, y: 1.55, w: 1.1 }, { wall: 'left', z: -2.0, y: 1.6, w: 0.9 }],
    slots: {
      wall: [{ wall: 'back', x: 0.35, y: 2.15 }, { wall: 'left', z: 0.9, y: 1.7 }, { wall: 'back', x: -1.0, y: 1.8 }, { wall: 'left', z: -1.25, y: 1.85 }, { wall: 'back', x: 1.55, y: 2.0 }, { wall: 'left', z: 1.45, y: 2.15 }],
      floor: [{ x: -3.55, z: 0.8, ry: PI / 2 }, { x: 3.55, z: -0.6, ry: -PI / 2 }, { x: 3.55, z: 1.0, ry: -PI / 2 }, { x: -1.6, z: 2.55, ry: 0.4, small: true }, { x: 1.2, z: 2.6, ry: 0, small: true }],
      rug: [{ x: 0.6, z: 0.7 }],
      ceiling: [{ x: 0.6, z: 0.6 }],
      plaque: [{ wall: 'left', z: 0.3, y: 2.25 }, { wall: 'left', z: 0.75, y: 2.25 }, { wall: 'left', z: -0.2, y: 2.4 }, { wall: 'left', z: 1.2, y: 2.4 }, { wall: 'left', z: 1.65, y: 1.8 }],
      kitchen: [{ along: -0.5 }],
    },
  },
  { // Creator Loft 10x7
    backWall: 'brick',
    windows: [{ wall: 'back', x: -2.5, y: 0.55, w: 3.4, h: 2.3, style: 'industrial' }],
    door: { wall: 'left', z: 2.7 },
    desk: { x: 0.9 },
    bed: { x: -4.05, z: -2.4, ry: 0 },
    night: { x: -2.95, z: -3.26 },
    fridge: { x: 4.52, z: -3.12, ry: 0 },
    counter: { x: 3.33, z: -3.18, len: 1.5, ry: 0, items: ['stove', 'microwave'] },
    mirror: { wall: 'left', z: -0.75 },
    lounge: { sofa: { x: -2.75, z: 1.0, ry: -PI / 2 }, table: { x: -3.75, z: 1.0, ry: PI / 2 }, tv: { x: -4.72, z: 1.0, ry: PI / 2 } },
    shelves: [{ wall: 'back', x: 0.9, y: 1.6, w: 1.2 }, { wall: 'left', z: -0.1, y: 1.95, w: 0.8 }],
    slots: {
      wall: [{ wall: 'back', x: 0.9, y: 2.35 }, { wall: 'back', x: 2.45, y: 2.1 }, { wall: 'left', z: -2.1, y: 1.95 }, { wall: 'left', z: 1.0, y: 2.55 }, { wall: 'back', x: -0.35, y: 1.6 }, { wall: 'left', z: 2.0, y: 2.55 }, { wall: 'back', x: 3.6, y: 2.75 }, { wall: 'left', z: -1.4, y: 2.75 }],
      floor: [{ x: 4.5, z: -1.2, ry: -PI / 2 }, { x: 4.5, z: 0.8, ry: -PI / 2 }, { x: -2.3, z: -0.55, ry: 0.5 }, { x: -1.7, z: -3.05, ry: 0, small: true }, { x: 4.4, z: 2.9, ry: -0.6, small: true }, { x: 2.0, z: 3.0, ry: 0, small: true }, { x: -0.8, z: 3.0, ry: 0.4, small: true }],
      rug: [{ x: 0.9, z: 0.9 }, { x: -3.2, z: 1.0 }],
      ceiling: [{ x: 1.0, z: 0.6 }],
      plaque: [{ wall: 'left', z: -0.1, y: 2.4 }, { wall: 'left', z: 0.3, y: 2.95 }, { wall: 'left', z: -0.55, y: 2.95 }, { wall: 'left', z: -1.0, y: 2.0 }, { wall: 'left', z: 0.75, y: 2.95 }],
      kitchen: [{ along: -0.75 }],
    },
  },
  { // Skyline Penthouse 12x8
    backWall: 'glass',
    windows: [{ wall: 'back', x: -3.05, y: 0.15, w: 5.3, h: 3.1, style: 'industrial' }, { wall: 'back', x: 1.35, y: 0.15, w: 3.1, h: 3.1, style: 'industrial' }],
    door: { wall: 'left', z: 3.2 },
    desk: { x: 1.35 },
    bed: { x: -5.0, z: -2.85, ry: 0 },
    night: { x: -3.88, z: -3.72 },
    fridge: { x: 5.5, z: -3.62, ry: 0 },
    counter: { x: 4.07, z: -3.68, len: 1.85, ry: 0, items: ['stove', 'microwave', 'kettle'] },
    mirror: { wall: 'left', z: -0.95 },
    lounge: { sofa: { x: -3.6, z: 1.3, ry: -PI / 2 }, table: { x: -4.6, z: 1.3, ry: PI / 2 }, tv: { x: -5.72, z: 1.3, ry: PI / 2 } },
    shelves: [{ wall: 'left', z: -2.3, y: 1.75, w: 1.2 }, { wall: 'left', z: 2.3, y: 1.5, w: 1.0 }],
    slots: {
      wall: [{ wall: 'left', z: 0.0, y: 2.6 }, { wall: 'left', z: -2.3, y: 2.55 }, { wall: 'left', z: 1.3, y: 2.7 }, { wall: 'left', z: 2.3, y: 2.3 }, { wall: 'back', x: 4.2, y: 2.9 }, { wall: 'left', z: -1.6, y: 2.95 }, { wall: 'left', z: 3.6, y: 2.6 }, { wall: 'back', x: 5.4, y: 2.85 }, { wall: 'left', z: 0.7, y: 1.6 }, { wall: 'left', z: -0.6, y: 3.1 }],
      floor: [{ x: 5.5, z: -1.4, ry: -PI / 2 }, { x: 5.5, z: 0.6, ry: -PI / 2 }, { x: -2.0, z: -0.7, ry: 0.5 }, { x: 5.45, z: 2.4, ry: -PI / 2 }, { x: -1.0, z: -3.45, ry: 0, small: true }, { x: -2.6, z: -3.5, ry: 0, small: true }, { x: -1.6, z: 3.4, ry: 0.4, small: true }, { x: 2.4, z: 3.4, ry: 0, small: true }, { x: 5.3, z: 3.4, ry: -0.6, small: true }],
      rug: [{ x: 1.4, z: 1.0 }, { x: -4.1, z: 1.3 }],
      ceiling: [{ x: 1.2, z: 0.8 }],
      plaque: [{ wall: 'left', z: -0.3, y: 2.0 }, { wall: 'left', z: 0.15, y: 2.0 }, { wall: 'left', z: -0.75, y: 2.45 }, { wall: 'left', z: 0.6, y: 2.0 }, { wall: 'left', z: 1.05, y: 2.0 }],
      kitchen: [{ along: -1.0 }],
    },
  },
];

export class Room {
  constructor(scene, screens) {
    this.scene = scene;
    this.screens = screens;
    this.root = new THREE.Group();
    this.root.name = 'room';
    scene.add(this.root);
    this.anims = [];
    this.interact = [];
    this.st = {};
    this.time = 0;
    this.pop = [];
  }

  get theme() { return THEMES[this.s.theme] || THEMES.gamer; }

  build(s) {
    this.s = s;
    // clear
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.screens.clearMeshes();
    this.interact = [];
    this.anims = [];
    const L = LAYOUTS[s.home];
    const home = HOMES[s.home];
    this.L = L; this.home = home;
    const [W, D] = home.size, H = home.height;
    this.W = W; this.D = D; this.H = H;
    const th = { ...this.theme, accent: s.profile.accent };
    this.th = th;
    this.buildShell(W, D, H, L, th);
    this.buildFurniture(L, th);
    this.deskRoot = group(this.root);
    this.buildDesk(null);
    this.decorRoot = group(this.root);
    this.buildDecor(null);
    this.buildPlaques();
    this.buildNav();
    shadows(this.root);
  }

  // ------------------------------------------------------------ SHELL
  buildShell(W, D, H, L, th) {
    const r = this.root;
    const t = 0.16;
    // floor
    let fmap;
    if (th.floor === 'marble') fmap = marble(th.floorTint);
    else if (th.floor === 'tile') fmap = tiles(th.floorTint);
    else fmap = woodFloor(th.floorTint, th.floor);
    const fm = mat('#ffffff', { rough: th.floor === 'marble' ? 0.25 : th.floor === 'tile' ? 0.35 : 0.55, map: fmap, env: th.floor === 'marble' ? 1.2 : 0.8 });
    fmap.repeat.set(W / (th.floor === 'tile' ? 1.6 : th.floor === 'marble' ? 2.4 : 1.7), D / (th.floor === 'tile' ? 1.6 : th.floor === 'marble' ? 2.4 : 1.7));
    const floor = at(box(W, 0.06, D, fm), r, 0, -0.03, 0);
    floor.receiveShadow = true;
    // slab
    const slabM = mat('#1b1c2b', { rough: 0.8 });
    at(rbox(W + t + 0.06, 0.3, D + t + 0.06, 0.03, slabM), r, -t / 2, -0.21, -t / 2);
    at(box(W + t + 0.07, 0.012, 0.012, glow(th.accent, 2.2)), r, -t / 2, -0.07, D / 2 + 0.03).userData.noShadow = true;
    at(box(0.012, 0.012, D + t + 0.07, glow(th.accent, 2.2)), r, W / 2 + 0.03, -0.07, -t / 2).userData.noShadow = true;
    // walls
    const wallMap = paint(th.wall);
    const wm = mat('#ffffff', { rough: 0.92, map: wallMap });
    let backM = wm;
    if (L.backWall === 'brick') { const b = brick(); b.repeat.set(W / 2.2, H / 2.2); backM = mat('#ffffff', { rough: 0.95, map: b }); }
    const capM = mat('#262838', { rough: 0.7 });
    const holesBack = L.windows.filter((w) => w.wall === 'back').map((w) => ({ c: w.x, w: w.w, y: w.y, h: w.h }));
    if (L.door.wall === 'back') holesBack.push({ c: L.door.x, w: 0.94, y: 0, h: 2.12 });
    const holesLeft = L.windows.filter((w) => w.wall === 'left').map((w) => ({ c: w.z, w: w.w, y: w.y, h: w.h }));
    if (L.door.wall === 'left') holesLeft.push({ c: L.door.z, w: 0.94, y: 0, h: 2.12 });
    this.wallBack = this.wall(-W / 2 - t, W / 2, H, t, holesBack, backM, capM, 'x', -D / 2 - t / 2);
    this.wallLeft = this.wall(-D / 2, D / 2, H, t, holesLeft, wm, capM, 'z', -W / 2 - t / 2);
    // baseboards
    const trimM = mat(th.trim, { rough: 0.5 });
    at(box(W, 0.1, 0.025, trimM), r, 0, 0.05, -D / 2 + 0.012);
    at(box(0.025, 0.1, D, trimM), r, -W / 2 + 0.012, 0.05, 0);
    // accent paint band on back wall (two-tone)
    if (L.backWall === 'paint') {
      const band = mat('#ffffff', { rough: 0.92, map: paint(th.wall2) });
      for (const seg of this.solidSegments(-W / 2, W / 2, holesBack.filter((h) => h.y < 1.0))) at(box(seg[1] - seg[0], 1.0, 0.012, band), r, (seg[0] + seg[1]) / 2, 0.5, -D / 2 + 0.006);
      at(box(W, 0.035, 0.03, trimM), r, 0, 1.0, -D / 2 + 0.015);
    }
    // windows + skyline backdrop
    this.windowMeshes = [];
    for (const wdef of L.windows) {
      const win = F.buildWindow(wdef.w, wdef.h, th, wdef.style);
      if (wdef.wall === 'back') at(win, r, wdef.x, wdef.y, -D / 2 - t / 2);
      else at(win, r, -W / 2 - t / 2, wdef.y, wdef.z, 0, PI / 2, 0);
      if (wdef.style === 'classic') {
        const c = F.buildCurtains(wdef.w, wdef.h, th);
        if (wdef.wall === 'back') at(c, r, wdef.x, wdef.y, -D / 2);
        else at(c, r, -W / 2, wdef.y, wdef.z, 0, PI / 2, 0);
      }
      this.windowMeshes.push(wdef);
    }
    // backdrop plane behind back windows (sky texture assigned by Scene)
    this.skyMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false });
    const back = L.windows.filter((w) => w.wall === 'back');
    if (back.length) {
      const minX = Math.min(...back.map((w) => w.x - w.w / 2)) - 1.2, maxX = Math.max(...back.map((w) => w.x + w.w / 2)) + 1.2;
      const minY = Math.max(-0.2, Math.min(...back.map((w) => w.y)) - 0.45), maxY = Math.min(H - 0.32, Math.max(...back.map((w) => w.y + w.h)) + 0.12);
      const sp = at(plane(maxX - minX, maxY - minY, this.skyMat), r, (minX + maxX) / 2, (minY + maxY) / 2, -D / 2 - t - 0.3);
      sp.userData.noShadow = true; sp.receiveShadow = false;
      this.skyPlane = sp;
      this.skyAspect = (maxX - minX) / (maxY - minY);
    }
    // door
    const door = F.buildDoor(th);
    if (L.door.wall === 'back') at(door, r, L.door.x, 0, -D / 2 - t / 2);
    else at(door, r, -W / 2 - t / 2, 0, L.door.z, 0, PI / 2, 0);
    const hall = at(plane(0.95, 2.12, mat('#0d0e16', { rough: 1 })), door, 0, 1.06, -0.12);
    this.door = door;
    this.addInteract('door', door, 'Front Door', 'door');
    const dz = L.door.wall === 'back' ? [L.door.x, -D / 2 + 0.75, PI] : [-W / 2 + 0.75, L.door.z, -PI / 2];
    this.st.door = { x: dz[0], z: dz[1], ry: dz[2] };
  }

  solidSegments(a, b, holes) {
    const segs = [];
    let cur = a;
    for (const h of [...holes].sort((p, q) => p.c - q.c)) {
      const h0 = h.c - h.w / 2, h1 = h.c + h.w / 2;
      if (h0 > cur) segs.push([cur, h0]);
      cur = Math.max(cur, h1);
    }
    if (cur < b) segs.push([cur, b]);
    return segs;
  }
  wall(a, b, H, t, holes, m, capM, axis, fixed) {
    const g = group(this.root);
    const put = (c0, c1, y0, y1) => {
      if (c1 - c0 < 0.001 || y1 - y0 < 0.001) return;
      const len = c1 - c0, hh = y1 - y0, mid = (c0 + c1) / 2;
      const mm = box(axis === 'x' ? len : t, hh, axis === 'x' ? t : len, m);
      if (axis === 'x') at(mm, g, mid, y0 + hh / 2, fixed); else at(mm, g, fixed, y0 + hh / 2, mid);
      mm.receiveShadow = true;
    };
    const sorted = [...holes].sort((p, q) => p.c - q.c);
    let cur = a;
    for (const h of sorted) {
      const h0 = h.c - h.w / 2, h1 = h.c + h.w / 2;
      put(cur, h0, 0, H);
      put(h0, h1, 0, h.y);
      put(h0, h1, h.y + h.h, H);
      cur = h1;
    }
    put(cur, b, 0, H);
    // top cap
    const len = b - a;
    const cap = box(axis === 'x' ? len + 0.002 : t + 0.004, 0.02, axis === 'x' ? t + 0.004 : len + 0.002, capM);
    if (axis === 'x') at(cap, g, (a + b) / 2, H + 0.01, fixed); else at(cap, g, fixed, H + 0.01, (a + b) / 2);
    return g;
  }

  // place something on a wall at given coord; returns world-space group
  wallAnchor(def, out = 0.0) {
    const g = new THREE.Group();
    if (def.wall === 'back') { g.position.set(def.x, def.y, -this.D / 2 + out); g.rotation.y = 0; }
    else { g.position.set(-this.W / 2 + out, def.y, def.z); g.rotation.y = PI / 2; }
    this.root.add(g);
    return g;
  }

  addInteract(id, obj, label, icon) {
    obj.userData.interact = id;
    this.interact.push({ id, obj, label, icon });
  }

  // ------------------------------------------------------------ FURNITURE
  buildFurniture(L, th) {
    const r = this.root;
    const tier = this.s.home;
    const W = this.W, D = this.D;
    // bed
    const bed = F.buildBed(tier, th, th.accent);
    at(bed, r, L.bed.x, 0, L.bed.z, 0, L.bed.ry, 0);
    this.addInteract('bed', bed, 'Bed', 'bed');
    const bW = bed.userData.W, bL = bed.userData.L;
    this.st.bed = { x: L.bed.x + bW / 2 + 0.45, z: L.bed.z + 0.1, ry: -PI / 2, lie: { x: L.bed.x - (bW > 1.2 ? bW / 4 : 0), y: 0.5, z: L.bed.z - bL / 2 + 0.45 + 0.65, ry: PI } };
    this.obst = [{ x: L.bed.x, z: L.bed.z, hx: bW / 2 + 0.04, hz: bL / 2 + 0.03 }];
    // nightstand
    const ns = F.buildNightstand(th);
    at(ns, r, L.night.x, 0, L.night.z);
    this.lampShade = ns.userData.shade;
    this.obst.push({ x: L.night.x, z: L.night.z, hx: 0.21, hz: 0.19 });
    // kitchen
    const fr = F.buildFridge(tier, th);
    at(fr, r, L.fridge.x, 0, L.fridge.z, 0, L.fridge.ry, 0);
    this.fridge = fr;
    this.addInteract('fridge', fr, 'Fridge', 'food');
    const fw = fr.userData.W;
    this.obst.push({ x: L.fridge.x, z: L.fridge.z, hx: fw / 2, hz: 0.33, ry: L.fridge.ry });
    const fdir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), L.fridge.ry);
    this.st.fridge = { x: L.fridge.x + fdir.x * 0.95 + (L.fridge.ry === 0 ? 0.25 : 0), z: L.fridge.z + fdir.z * 0.95 + (L.fridge.ry !== 0 ? 0.25 : 0), ry: Math.atan2(-fdir.x, -fdir.z) };
    const ct = F.buildCounter(tier, th, L.counter.len);
    at(ct, r, L.counter.x, 0, L.counter.z, 0, L.counter.ry, 0);
    this.addInteract('counter', ct, 'Kitchen', 'food');
    this.obst.push({ x: L.counter.x, z: L.counter.z, hx: L.counter.len / 2 + 0.02, hz: 0.3, ry: L.counter.ry });
    const cdir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), L.counter.ry);
    this.st.counter = { x: L.counter.x + cdir.x * 0.72, z: L.counter.z + cdir.z * 0.72, ry: Math.atan2(-cdir.x, -cdir.z) };
    // counter appliances
    this.appliances = {};
    const items = L.counter.items;
    items.forEach((it, i) => {
      const along = -L.counter.len / 2 + (L.counter.len / items.length) * (i + 0.5);
      let m;
      if (it === 'microwave') m = F.buildMicrowave();
      else if (it === 'stove') m = F.buildStove();
      else m = F.buildKettle();
      at(m, ct, along, 0.9, -0.02);
      this.appliances[it] = m;
    });
    this.counter = ct;
    // mirror
    const mr = F.buildMirror(th);
    if (L.mirror.wall === 'left') at(mr, r, -W / 2 + 0.06, 0, L.mirror.z, 0, PI / 2, 0);
    else at(mr, r, L.mirror.x, 0, -D / 2 + 0.06);
    this.addInteract('mirror', mr, 'Mirror', 'shirt');
    this.st.mirror = L.mirror.wall === 'left' ? { x: -W / 2 + 1.0, z: L.mirror.z, ry: -PI / 2 } : { x: L.mirror.x, z: -D / 2 + 1.0, ry: PI };
    this.obst.push(L.mirror.wall === 'left' ? { x: -W / 2 + 0.12, z: L.mirror.z, hx: 0.12, hz: 0.32 } : { x: L.mirror.x, z: -D / 2 + 0.12, hx: 0.32, hz: 0.12 });
    // shelves
    this.shelfSlots = [];
    for (const sd of L.shelves) {
      const sh = F.buildShelf(th, sd.w);
      const anchor = this.wallAnchor(sd);
      anchor.add(sh);
      const n = Math.max(2, Math.round(sd.w / 0.33));
      for (let i = 0; i < n; i++) this.shelfSlots.push({ anchor, x: -sd.w / 2 + (sd.w / n) * (i + 0.5), y: 0.018, z: 0.13 });
    }
    // lounge
    if (L.lounge) {
      const so = F.buildSofa(th, th.accent);
      at(so, r, L.lounge.sofa.x, 0, L.lounge.sofa.z, 0, L.lounge.sofa.ry, 0);
      this.addInteract('sofa', so, 'Sofa', 'sofa');
      this.obst.push({ x: L.lounge.sofa.x, z: L.lounge.sofa.z, hx: 1.05, hz: 0.46, ry: L.lounge.sofa.ry });
      const sdir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), L.lounge.sofa.ry);
      this.st.sofa = { x: L.lounge.sofa.x + sdir.x * 0.85, z: L.lounge.sofa.z + sdir.z * 0.85, ry: L.lounge.sofa.ry + PI, seat: { x: L.lounge.sofa.x + sdir.x * 0.12, z: L.lounge.sofa.z + sdir.z * 0.12, ry: L.lounge.sofa.ry } };
      const ctb = F.buildCoffeeTable(th);
      at(ctb, r, L.lounge.table.x, 0, L.lounge.table.z, 0, L.lounge.table.ry, 0);
      this.obst.push({ x: L.lounge.table.x, z: L.lounge.table.z, hx: 0.5, hz: 0.28, ry: L.lounge.table.ry });
      const scr = [];
      const tv = F.buildTV(scr);
      at(tv, r, L.lounge.tv.x, 0, L.lounge.tv.z, 0, L.lounge.tv.ry, 0);
      scr.forEach((m) => this.screens.register(m));
      this.obst.push({ x: L.lounge.tv.x, z: L.lounge.tv.z, hx: 0.8, hz: 0.22, ry: L.lounge.tv.ry });
    }
  }

  // ------------------------------------------------------------ DESK RIG
  buildDesk(popCat) {
    const s = this.s, th = this.th, L = this.L;
    const old = this.deskRoot;
    while (old.children.length) old.remove(old.children[0]);
    this.screens.surfaces.forEach((sf, k) => { if (k !== 'tv' && k !== 'arcade') sf.meshes = []; });
    const g = s.gear;
    const desk = F.buildDesk(g.desk, th);
    const { w, d, H } = desk.userData;
    const dz = -this.D / 2 + d / 2 + 0.03;
    const rig = group(this.deskRoot, L.desk.x, 0, dz);
    this.rig = rig;
    rig.add(desk);
    this.deskDims = { w, d, H, x: L.desk.x, z: dz };
    const parts = {};
    parts.desk = desk;
    const screens = [];
    // monitors
    const mons = F.buildMonitors(g.monitor, th.accent, screens);
    at(mons, rig, 0, H, -d / 2 + 0.2);
    parts.monitor = mons;
    // laptop (pc tier 0)
    if (g.pc === 0) {
      const lp = F.buildPC(0, th.accent, screens);
      if (g.monitor === 0) at(lp, rig, 0, H, -d / 2 + 0.24);
      else { at(lp, rig, -w / 2 + 0.25, H, -0.02, 0, 0.35, 0); screens[screens.length - 1].userData.screenKey = 'laptop'; }
      parts.pc = lp;
      this.laptopLid = lp.userData.lid;
    } else {
      const pc = F.buildPC(g.pc, th.accent, screens);
      at(pc, rig, w / 2 + 0.2, 0, -d / 2 + 0.28, 0, PI / 2, 0);
      parts.pc = pc;
      this.laptopLid = null;
    }
    if (g.monitor === 0) screens.forEach((m) => { if (m.userData.screenKey === 'laptop') m.userData.screenKey = 'main'; });
    screens.forEach((m) => this.screens.register(m));
    // keyboard
    const keys = F.buildKeys(g.keys, th.accent);
    at(keys, rig, -0.05, H, d / 2 - 0.2);
    parts.keys = keys;
    this.rgbKeys = keys.children.find((c) => c.userData.rgbKeys) || null;
    // mic
    const mic = F.buildMic(g.mic, th.accent, s.micSkin === 'golden_mic');
    if (g.mic === 1) at(mic, rig, -0.36, H, 0.0);
    else if (g.mic >= 2) at(mic, rig, -w / 2 + 0.12, H, -d / 2 + 0.1);
    parts.mic = mic;
    // camera
    const cam = F.buildCamera(g.camera, th.accent, s.camSkin === 'crt_cam');
    const monTop = [0.25, 0.42, 0.49, 0.49, 0.52, 0.51][g.monitor];
    const monX = g.monitor === 3 ? -0.31 : g.monitor === 4 ? -0.1 : 0;
    if (g.camera >= 1 && g.camera <= 2) at(cam, rig, monX, H + monTop, -d / 2 + 0.19);
    else if (g.camera >= 3) at(cam, rig, w / 2 - 0.2, H, -d / 2 + 0.16, 0, -0.3, 0);
    parts.camera = cam;
    this.tally = cam.userData.tally || null;
    // stream camera viewpoint (where the facecam looks from)
    this.camPoint = new THREE.Vector3(L.desk.x + monX, H + monTop + 0.06, dz - d / 2 + 0.26);
    // lighting gear
    const lg = F.buildLightGear(g.light, th.accent);
    lg.userData.parts = lg.userData.parts || {};
    if (g.light === 1 || g.light === 2) { at(lg, rig, w / 2 - 0.15, H, -d / 2 + 0.14); }
    else if (g.light === 3) { at(lg, rig, -w / 2 - 0.32, 0, d / 2 - 0.05, 0, 0.5, 0); }
    else if (g.light >= 4) {
      at(lg, rig, 0, 0, 0);
      lg.children.forEach((c) => {
        if (c.userData.softbox) { const sgn = c.userData.softbox; c.position.set(sgn * (w / 2 + 0.42), 0, d / 2 + 0.15); c.rotation.y = sgn * 0.75; }
      });
    }
    parts.light = lg;
    // LED strip on wall behind desk (light tier >= 2)
    this.ledStrip = null;
    if (g.light >= 2 || this.s.theme === 'gamer') {
      const sm = umat('#000', { emissive: th.accent, ei: 2.6 });
      const strip = at(box(w + 0.5, 0.025, 0.02, sm), rig, 0, H + 0.62, -d / 2 - 0.01);
      strip.userData.noShadow = true;
      const strip2 = at(box(w + 0.5, 0.02, 0.02, sm), rig, 0, 2.35 - 0.0, -d / 2 - 0.01);
      strip2.visible = this.H > 2.5 && g.light >= 2;
      this.ledStrip = sm;
    }
    // router on shelf above desk (or desk corner)
    const rt = F.buildRouter(g.net, th.accent);
    at(rt, rig, w / 2 - 0.2, 1.52 + 0.02, -d / 2 + 0.03);
    if (this.L.shelves[0]?.wall === 'back' && Math.abs(this.L.shelves[0].x - L.desk.x) < 0.1) rt.position.set(this.L.shelves[0].w / 2 - 0.16, this.L.shelves[0].y + 0.02, -d / 2 + 0.1);
    else rt.position.set(w / 2 - 0.3, H, -d / 2 + 0.12);
    parts.net = rt;
    this.routerLeds = rt.userData.leds;
    // chair
    const chair = F.buildChair(g.chair, th, th.accent);
    at(chair, rig, 0, 0, d / 2 + 0.3);
    parts.chair = chair;
    this.chair = chair;
    this.deskParts = parts;
    rig.userData.labelPoint = new THREE.Vector3(L.desk.x, H + 0.95, dz);
    this.addInteract('desk', rig, 'Creator Desk', 'play');
    // fans spin
    this.fans = [];
    parts.pc.traverse((o) => { if (o.userData.spin) this.fans.push(o); });
    // station
    const cx = L.desk.x, cz = dz + d / 2 + 0.3;
    this.st.desk = { x: cx + 0.6, z: cz + 0.35, ry: PI, seat: { x: cx, z: cz + 0.02, ry: PI } };
    this.st.monitor = new THREE.Vector3(L.desk.x, H + 0.35, dz - d / 2 + 0.2);
    if (popCat && parts[popCat]) this.popIn(parts[popCat]);
    shadows(this.deskRoot);
    if (this.nav) this.buildNav();
  }

  // ------------------------------------------------------------ DECOR
  buildDecor(newId) {
    const s = this.s, th = this.th, L = this.L;
    const root = this.decorRoot;
    while (root.children.length) root.remove(root.children[0]);
    this.decorObst = [];
    this.cat = null;
    this.decorAnims = [];
    const used = { wall: 0, floor: 0, shelf: 0, rug: 0, ceiling: 0, kitchen: 0, pet: 0 };
    const caps = this.home.slots;
    this.slotOverflow = [];
    // floor: big items take wall-side slots first, small items fill the rest
    const SMALL = ['plant_big', 'beanbag', 'telescope'];
    const floorIds = s.placed.filter((id) => decorById(id)?.slot === 'floor');
    const big = floorIds.filter((id) => !SMALL.includes(id)), small = floorIds.filter((id) => SMALL.includes(id));
    const fslots = L.slots.floor.slice(0, caps.floor);
    const assign = new Map();
    const free = fslots.map((d, i) => i);
    for (const id of big) { const k = free.findIndex((i) => !fslots[i].small); if (k >= 0) { assign.set(id, fslots[free[k]]); free.splice(k, 1); } }
    for (const id of small) { if (free.length) { assign.set(id, fslots[free.shift()]); } }
    for (const id of s.placed) {
      const d = decorById(id);
      if (!d) continue;
      let slot = d.slot === 'desk' ? 'shelf' : d.slot;
      if (slot === 'floor') {
        if (!assign.has(id)) { this.slotOverflow.push(id); continue; }
        this.floorDefs = this.floorDefs || [];
      } else if (used[slot] >= caps[slot] || (slot === 'shelf' && used[slot] >= this.shelfSlots.length)) { this.slotOverflow.push(id); continue; }
      const idx = slot === 'floor' ? 0 : used[slot]++;
      if (slot === 'floor') this.floorDefs = [assign.get(id)];
      let obj;
      if (slot === 'pet') {
        obj = F.buildCat(['#f2a65a', '#2b2b30', '#e9e4dc'][hashId(s.profile.name) % 3]);
        root.add(obj);
        obj.position.set(0.8, 0, 1.2);
        this.cat = { obj, target: new THREE.Vector3(0.8, 0, 1.2), state: 'idle', t: 2 };
        this.addInteract('cat', obj, 'Cat', 'heart');
      } else {
        obj = F.buildDecor(id, th, th.accent, s.profile);
        if (slot === 'wall') {
          const def = L.slots.wall[idx];
          const a = this.wallAnchor(def, 0.01);
          root.add(a); a.add(obj);
        } else if (slot === 'floor') {
          const def = this.floorDefs[idx];
          at(obj, root, def.x, 0, def.z, 0, def.ry, 0);
          const sz = { plant_big: 0.25, beanbag: 0.4, bookshelf: [0.4, 0.15], arcade: 0.3, pixel_cabinet: 0.3, fishtank: [0.5, 0.2], telescope: 0.25, sculpture: 0.22, crt_tv: 0.3 }[id] || 0.25;
          const [hx, hz] = Array.isArray(sz) ? sz : [sz, sz];
          this.decorObst.push({ x: def.x, z: def.z, hx, hz, ry: def.ry });
        } else if (slot === 'shelf') {
          const def = this.shelfSlots[idx];
          if (!def) continue;
          at(obj, def.anchor, def.x, def.y, def.z);
        } else if (slot === 'rug') {
          const def = L.slots.rug[idx];
          at(obj, root, def.x, 0, def.z);
        } else if (slot === 'ceiling') {
          const def = L.slots.ceiling[idx];
          at(obj, root, def.x, this.H, def.z);
        } else if (slot === 'kitchen') {
          const def = L.slots.kitchen[idx];
          at(obj, this.counter, def.along * (this.L.counter.len / 2) / 0.5 * 0 + (-this.L.counter.len / 2 + 0.2), 0.9, -0.05);
        }
        if (obj.userData.screen) this.screens.register(obj.userData.screen);
        if (obj.userData.rgb || obj.userData.lava || obj.userData.fish || obj.userData.spinBall || obj.userData.spinY) this.decorAnims.push(obj);
      }
      if (id === newId) this.popIn(obj);
    }
    shadows(this.decorRoot);
    if (this.nav) this.buildNav();
  }

  buildPlaques(newId) {
    const L = this.L;
    (this.plaqueAnchors || []).forEach((a) => a.parent && a.parent.remove(a));
    this.plaqueAnchors = [];
    const got = MILESTONES.filter((m) => m.plaque && this.s.milestones.includes(m.id));
    got.forEach((m, i) => {
      const def = L.slots.plaque[i];
      if (!def) return;
      const a = this.wallAnchor(def, 0.01);
      const p = F.buildPlaque(m.plaque, m.name);
      a.add(p);
      shadows(a);
      this.plaqueAnchors.push(a);
      if (m.id === newId) this.popIn(p);
    });
  }

  popIn(obj) {
    obj.userData.popT = 0;
    obj.userData.popScale = obj.scale.clone();
    obj.scale.setScalar(0.001);
    this.pop.push(obj);
  }

  // ------------------------------------------------------------ NAV
  buildNav() {
    const W = this.W, D = this.D;
    const nav = new NavGrid(-W / 2 + 0.05, -D / 2 + 0.05, W / 2 - 0.05, D / 2 - 0.05, 0.12);
    const pad = 0.2;
    for (const o of this.obst) nav.addRect(o.x, o.z, o.hx, o.hz, o.ry || 0, pad);
    for (const o of this.decorObst || []) nav.addRect(o.x, o.z, o.hx, o.hz, o.ry || 0, pad);
    const dd = this.deskDims;
    nav.addRect(dd.x, dd.z, dd.w / 2 + (this.s.gear.desk === 2 ? 0.3 : 0), dd.d / 2, 0, pad);
    if (this.s.gear.desk === 2) nav.addRect(dd.x - dd.w / 2 - 0.27, -D / 2 + 0.33, 0.3, 0.33, 0, pad);
    if (this.s.gear.pc > 0) nav.addRect(dd.x + dd.w / 2 + 0.2, dd.z - dd.d / 2 + 0.28, 0.26, 0.13, 0, pad);
    if (this.s.gear.light === 3) nav.addRect(dd.x - dd.w / 2 - 0.32, dd.z + dd.d / 2 - 0.05, 0.15, 0.15, 0, pad);
    if (this.s.gear.light >= 4) for (const sg of [-1, 1]) nav.addRect(dd.x + sg * (dd.w / 2 + 0.42), dd.z + dd.d / 2 + 0.15, 0.17, 0.17, 0, pad);
    // chair
    nav.addRect(dd.x, dd.z + dd.d / 2 + 0.3, 0.27, 0.27, 0, 0.1);
    // keep station points free
    for (const k of ['desk', 'fridge', 'counter', 'bed', 'mirror', 'door', 'sofa']) if (this.st[k]) nav.clearCircle(this.st[k].x, this.st[k].z, 0.22);
    this.nav = nav;
  }

  randomFreePoint() {
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * (this.W - 1.2), z = (Math.random() - 0.5) * (this.D - 1.2);
      const [ci, cj] = this.nav.toCell(x, z);
      if (!this.nav.blocked(ci, cj)) return new THREE.Vector3(x, 0, z);
    }
    return new THREE.Vector3(0.5, 0, 0.8);
  }

  // ------------------------------------------------------------ RUNTIME
  setFridgeOpen(v) { this.fridgeOpen = v; }
  setDoorOpen(v) { this.doorOpen = v; }
  setLive(v) { this.live = v; }
  setCooking(v, kind) { this.cooking = v ? kind : null; }

  update(dt) {
    this.time += dt;
    const t = this.time;
    for (const f of this.fans || []) f.rotation.z += dt * 12;
    if (this.rgbKeys) {
      const c = new THREE.Color();
      const n = this.rgbKeys.count;
      for (let i = 0; i < n; i++) { c.setHSL(((i % 16) / 16 + t * 0.15) % 1, 0.85, 0.55); this.rgbKeys.setColorAt(i, c); }
      this.rgbKeys.instanceColor.needsUpdate = true;
    }
    if (this.ledStrip && (this.s.theme === 'gamer' || this.s.gear.light >= 5)) {
      this.ledStrip.emissive.setHSL((t * 0.05) % 1, 0.9, 0.55);
    }
    // fridge door
    if (this.fridge) {
      const d = this.fridge.userData.door;
      const target = this.fridgeOpen ? -1.9 : 0;
      d.rotation.y += (target - d.rotation.y) * (1 - Math.exp(-6 * dt));
      this.fridge.userData.light.emissiveIntensity = this.fridgeOpen ? 1.6 : 0;
    }
    if (this.door) {
      const p = this.door.userData.pivot;
      const target = this.doorOpen ? -1.4 : 0;
      p.rotation.y += (target - p.rotation.y) * (1 - Math.exp(-5 * dt));
    }
    if (this.tally) this.tally.emissiveIntensity = this.live ? (Math.sin(t * 6) > -0.3 ? 3 : 0.5) : 0;
    // appliances
    const mw = this.appliances?.microwave;
    if (mw) mw.userData.inner.emissiveIntensity = this.cooking === 'microwave' ? 1.5 + Math.sin(t * 8) * 0.3 : 0;
    const stv = this.appliances?.stove;
    if (stv) stv.userData.rings.forEach((r, i) => (r.material.emissiveIntensity = this.cooking === 'stove' && i === 2 ? 1.6 + Math.sin(t * 5) * 0.4 : 0));
    // decor anims
    for (const o of this.decorAnims || []) {
      if (o.userData.lava) o.userData.lava.position.y = 0.17 + Math.sin(t * 0.8) * 0.06;
      if (o.userData.fish) o.userData.fish.forEach((f, i) => { f.position.x = Math.sin(t * 0.4 + i * 1.7) * 0.38; f.rotation.y = Math.cos(t * 0.4 + i * 1.7) > 0 ? 0 : PI; });
      if (o.userData.spinBall) o.userData.spinBall.rotation.y += dt * 0.6;
      if (o.userData.spinY) o.rotation.y += dt * 0.5;
      if (o.userData.rgb) o.children.forEach((c, i) => c.material && c.material.emissive && c.material.emissive.setHSL(((i * 0.13) + t * 0.08) % 1, 0.9, 0.55));
    }
    // pop-in
    for (let i = this.pop.length - 1; i >= 0; i--) {
      const o = this.pop[i];
      o.userData.popT += dt * 1.6;
      const k = easeOutBack(clamp(o.userData.popT, 0, 1));
      o.scale.copy(o.userData.popScale).multiplyScalar(Math.max(0.001, k));
      if (o.userData.popT >= 1) { o.scale.copy(o.userData.popScale); this.pop.splice(i, 1); }
    }
    this.updateCat(dt);
  }

  updateCat(dt) {
    const c = this.cat;
    if (!c) return;
    const o = c.obj, ud = o.userData;
    c.t -= dt;
    if (c.state === 'idle' && c.t <= 0) {
      c.target = this.randomFreePoint();
      c.state = 'walk';
    }
    if (c.state === 'walk') {
      const dx = c.target.x - o.position.x, dz = c.target.z - o.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.05) { c.state = 'idle'; c.t = 3 + Math.random() * 6; }
      else {
        const sp = 0.45;
        o.position.x += (dx / dist) * Math.min(dist, sp * dt);
        o.position.z += (dz / dist) * Math.min(dist, sp * dt);
        const yaw = Math.atan2(dx, dz);
        let dy = yaw - o.rotation.y; while (dy > PI) dy -= 2 * PI; while (dy < -PI) dy += 2 * PI;
        o.rotation.y += dy * Math.min(1, dt * 6);
        ud.legs.forEach((l, i) => (l.rotation.x = Math.sin(this.time * 10 + (i % 2 ? PI : 0) + (i > 1 ? PI / 2 : 0)) * 0.5));
      }
    } else ud.legs.forEach((l) => (l.rotation.x *= 0.9));
    ud.tail.rotation.z = Math.sin(this.time * 2) * 0.3;
    ud.head.rotation.y = Math.sin(this.time * 0.7) * 0.3;
    ud.body.position.y = 0.16 + Math.sin(this.time * 3) * 0.003;
  }
}
function hashId(s) { let h = 0; for (const ch of s || 'x') h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); }
