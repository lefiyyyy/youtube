// Stylized creator character: procedural rig, customization, expressions and animation clips.
import * as THREE from 'three';
import { mat, umat, rbox, sph, sphPart, capsule, cyl, torus, cone, lathe, tube, circle, at, scl, group, glow } from './kit.js';
import { knit } from './textures.js';
import { clamp, lerp, damp } from '../core/util.js';

export const HAIRS = ['swoop', 'bob', 'long', 'curly', 'bun', 'spiky', 'buzz'];
export const HAIR_NAMES = { swoop: 'Swoop', bob: 'Bob', long: 'Long', curly: 'Curly', bun: 'Bun', spiky: 'Spiky', buzz: 'Buzz' };
export const OUTFITS = ['hoodie', 'tee', 'jacket', 'sweater', 'tech'];
export const OUTFIT_NAMES = { hoodie: 'Hoodie', tee: 'Tee', jacket: 'Varsity', sweater: 'Knit', tech: 'Techwear', hoodie_ghost: 'Ghost Hoodie', jacket_pixel: 'Pixel Jacket' };
export const ACCESSORIES = ['none', 'headphones', 'glasses', 'cap', 'beanie', 'catears'];
export const ACC_NAMES = { none: 'None', headphones: 'Headset', glasses: 'Glasses', cap: 'Cap', beanie: 'Beanie', catears: 'Cat Headset' };
export const SKINS = ['#f7d7c4', '#e8b48f', '#d39a6a', '#b0764d', '#8a5634', '#5e3a24'];
export const HAIR_COLORS = ['#2b1d16', '#5a3a22', '#a8683a', '#e8c36b', '#f2f0ee', '#ff6fa8', '#7b6bff', '#38d6c5'];
export const TOP_COLORS = ['#8f6bff', '#ff4f8b', '#2fd6ff', '#9dff5a', '#ffb547', '#f4f2ee', '#23253a', '#ff6b4a'];

const R = 0.165; // head radius

// Pose keys used by animation clips
const KEYS = ['by', 'bz', 'hipRx', 'hipRy', 'hipRz', 'spRx', 'spRy', 'spRz', 'nkRx', 'nkRy', 'hdRx', 'hdRy', 'hdRz',
  'lsx', 'lsy', 'lsz', 'rsx', 'rsy', 'rsz', 'lex', 'ley', 'rex', 'rey', 'lwx', 'lwz', 'rwx', 'rwz',
  'ltx', 'ltz', 'rtx', 'rtz', 'lkx', 'rkx', 'lax', 'rax'];
const zeroPose = () => { const p = {}; for (const k of KEYS) p[k] = 0; return p; };

export class Character {
  constructor(profile) {
    this.root = new THREE.Group();
    this.root.name = 'character';
    this.body = group(this.root);
    this.profile = { ...profile };
    this.pose = zeroPose();
    this.target = zeroPose();
    this.clip = 'idle';
    this.clipT = 0;
    this.blendK = 10;
    this.speed = 0;
    this.tired = 0;
    this.talking = false;
    this.talkAmt = 0;
    this.expr = 'neutral';
    this.exprT = 0;
    this.blinkT = 2;
    this.blink = 0;
    this.gaze = new THREE.Vector2();
    this.gazeTarget = new THREE.Vector2();
    this.lookYaw = 0; this.lookPitch = 0;
    this.lookTargetYaw = 0; this.lookTargetPitch = 0;
    this.idleTimer = 0;
    this.lying = 0;
    this.props = {};
    this.time = 0;
    this.buildRig();
    this.dress(profile);
  }

  buildRig() {
    const b = this.body;
    this.hips = group(b, 0, 0.72, 0);
    this.spine = group(this.hips, 0, 0.02, 0);
    this.chest = group(this.spine, 0, 0.2, 0);
    this.neck = group(this.chest, 0, 0.215, 0);
    this.head = group(this.neck, 0, 0.05, 0);
    this.hc = group(this.head, 0, 0.165, 0.008); // head center
    this.hc.scale.setScalar(1.12);
    this.shL = group(this.chest, 0.178, 0.155, 0);
    this.shR = group(this.chest, -0.178, 0.155, 0);
    this.elL = group(this.shL, 0, -0.245, 0);
    this.elR = group(this.shR, 0, -0.245, 0);
    this.wrL = group(this.elL, 0, -0.215, 0);
    this.wrR = group(this.elR, 0, -0.215, 0);
    this.thL = group(this.hips, 0.085, -0.035, 0);
    this.thR = group(this.hips, -0.085, -0.035, 0);
    this.knL = group(this.thL, 0, -0.33, 0);
    this.knR = group(this.thR, 0, -0.33, 0);
    this.anL = group(this.knL, 0, -0.31, 0);
    this.anR = group(this.knR, 0, -0.31, 0);
    this.parts = group(this.root); // dummy container to track built meshes for rebuild
    this.meshes = [];
  }

  // Remove all appearance meshes (keep joint groups) and rebuild
  clearMeshes() {
    for (const m of this.meshes) m.parent && m.parent.remove(m);
    this.meshes = [];
  }
  m(mesh, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    at(mesh, parent, x, y, z, rx, ry, rz);
    this.meshes.push(mesh);
    mesh.castShadow = true;
    return mesh;
  }

  dress(p) {
    this.profile = { ...p };
    this.clearMeshes();
    const skin = mat(p.skin, { rough: 0.62 });
    const skinDark = mat(new THREE.Color(p.skin).multiplyScalar(0.86).getStyle(), { rough: 0.65 });
    const hairM = mat(p.hairColor, { rough: 0.48, env: 0.6 });
    let outfit = p.outfit;
    let topColor = p.top, bottomColor = p.bottom;
    let top = mat(topColor, { rough: 0.85 });
    if (outfit === 'sweater') top = mat(topColor, { rough: 0.95, map: knit('#ffffff') });
    if (outfit === 'hoodie_ghost') { top = mat('#f2f0f7', { rough: 0.85 }); outfit = 'hoodie'; this._ghost = true; } else this._ghost = false;
    let pixelJacket = false;
    if (outfit === 'jacket_pixel') { outfit = 'jacket'; pixelJacket = true; }
    const bottom = mat(bottomColor, { rough: 0.9 });
    const shoeM = mat(outfit === 'tech' ? '#1b1d2a' : '#f4f4f6', { rough: 0.6 });
    const soleM = mat(outfit === 'tech' ? p.accent : '#2a2a35', { rough: 0.5 });
    const accent = mat(p.accent, { rough: 0.5 });
    const dark = mat('#1a1622', { rough: 0.5 });
    const white = mat('#ffffff', { rough: 0.3 });
    const sleeveM = outfit === 'jacket' ? mat(pixelJacket ? '#1d1b2c' : '#f1ece2', { rough: 0.85 }) : top;
    this.mats = { skin, hair: hairM, top, bottom };

    // ---- torso
    const torsoPts = [[0.001, -0.02], [0.128, -0.02], [0.136, 0.04], [0.13, 0.11], [0.142, 0.2], [0.152, 0.28], [0.146, 0.33], [0.118, 0.38], [0.075, 0.405], [0.001, 0.41]];
    const torso = this.m(scl(lathe(torsoPts, top, 32, 'torso'), 1, 1, 0.74), this.spine, 0, 0, 0);
    // pelvis / pants top
    this.m(scl(sph(0.135, bottom, 24, 14), 1.04, 0.66, 0.8), this.hips, 0, -0.02, 0);
    // belt line
    this.m(scl(torus(0.128, 0.012, mat(new THREE.Color(bottomColor).multiplyScalar(0.7).getStyle()), Math.PI * 2, 6, 32), 1, 0.74, 1), this.hips, 0, 0.0, 0, Math.PI / 2, 0, 0);

    // outfit details
    if (outfit === 'hoodie') {
      const hood = this.m(scl(torus(0.095, 0.045, top, Math.PI * 1.15, 10, 24), 1, 1, 1.15), this.chest, 0, 0.17, -0.055, -0.15, 0, 0);
      hood.rotation.z = -Math.PI * 0.075;
      hood.rotation.x = Math.PI / 2 - 0.35;
      this.m(scl(rbox(0.17, 0.08, 0.04, 0.02, top), 1, 1, 1), this.spine, 0, 0.07, 0.092);
      const pocketLine = mat(new THREE.Color(topColor).multiplyScalar(0.78).getStyle(), { rough: 0.9 });
      this.m(rbox(0.172, 0.006, 0.042, 0.002, pocketLine), this.spine, 0, 0.11, 0.093);
      const str = mat('#f4f1ea', { rough: 0.6 });
      this.m(cyl(0.006, 0.006, 0.11, str, 6), this.chest, 0.035, 0.09, 0.108, 0.1, 0, 0);
      this.m(cyl(0.006, 0.006, 0.11, str, 6), this.chest, -0.035, 0.09, 0.108, 0.1, 0, 0);
      this.m(sph(0.011, accent, 8, 6), this.chest, 0.037, 0.03, 0.112);
      this.m(sph(0.011, accent, 8, 6), this.chest, -0.037, 0.03, 0.112);
      if (this._ghost) { // little ghost print
        const gh = this.m(scl(sph(0.035, mat('#a58bff', { rough: 0.8 }), 16, 12), 1, 1.2, 0.25), this.chest, 0, 0.0, 0.107);
        this.m(scl(sph(0.006, dark, 6, 6), 1, 1.4, 0.5), this.chest, 0.012, 0.008, 0.115);
        this.m(scl(sph(0.006, dark, 6, 6), 1, 1.4, 0.5), this.chest, -0.012, 0.008, 0.115);
      }
    } else if (outfit === 'tee') {
      this.m(torus(0.062, 0.012, mat(new THREE.Color(topColor).multiplyScalar(0.8).getStyle()), Math.PI * 2, 6, 24), this.chest, 0, 0.2, 0.0, Math.PI / 2 - 0.15, 0, 0);
      // chest graphic: accent star badge
      const badge = this.m(scl(sph(0.04, accent, 16, 10), 1, 1, 0.18), this.chest, 0, 0.04, 0.105);
      this.m(scl(sph(0.018, white, 10, 8), 1, 1, 0.2), this.chest, 0, 0.04, 0.112);
    } else if (outfit === 'jacket') {
      const inner = mat(pixelJacket ? p.accent : '#f6f3ee', { rough: 0.85 });
      this.m(rbox(0.07, 0.34, 0.02, 0.01, inner), this.spine, 0, 0.2, 0.093, -0.04, 0, 0);
      this.m(torus(0.07, 0.016, sleeveM, Math.PI * 2, 6, 24), this.chest, 0, 0.195, -0.01, Math.PI / 2 - 0.2, 0, 0);
      this.m(scl(torus(0.128, 0.014, sleeveM, Math.PI * 2, 6, 32), 1, 0.74, 1), this.spine, 0, -0.01, 0, Math.PI / 2, 0, 0);
      // letter patch
      this.m(scl(rbox(0.05, 0.06, 0.012, 0.01, accent), 1, 1, 1), this.chest, 0.065, 0.06, 0.1, 0, 0.35, 0);
      if (pixelJacket) {
        for (let i = 0; i < 6; i++) this.m(rbox(0.022, 0.022, 0.01, 0.002, mat(['#ff3df2', '#3dfcff', '#ffe600'][i % 3])), this.chest, -0.08 + (i % 3) * 0.026, -0.02 + Math.floor(i / 3) * 0.026, 0.1, 0, -0.35, 0);
      }
    } else if (outfit === 'sweater') {
      this.m(cyl(0.07, 0.078, 0.06, top, 20), this.chest, 0, 0.205, 0.0);
    } else if (outfit === 'tech') {
      const g1 = glow(p.accent, 2.4);
      this.m(rbox(0.012, 0.25, 0.01, 0.004, g1), this.spine, 0.06, 0.2, 0.094, -0.05, 0, 0);
      this.m(rbox(0.012, 0.25, 0.01, 0.004, g1), this.spine, -0.06, 0.2, 0.094, -0.05, 0, 0);
      this.m(cyl(0.072, 0.08, 0.05, top, 20), this.chest, 0, 0.2, 0.0);
      this.m(rbox(0.2, 0.05, 0.05, 0.02, mat('#2a2c3a', { rough: 0.6 })), this.spine, 0, 0.05, 0.08);
    }

    // ---- neck & head
    this.m(cyl(0.046, 0.05, 0.1, skin, 14), this.neck, 0, 0.03, 0);
    const headM = this.m(scl(sph(R, skin, 40, 28), 1, 1.0, 0.96), this.hc);
    // jaw/cheek volume
    this.m(scl(sph(R * 0.82, skin, 28, 18), 1.05, 0.8, 0.92), this.hc, 0, -0.045, 0.012);
    // ears
    for (const s of [1, -1]) {
      this.m(scl(sph(0.034, skin, 14, 10), 0.5, 1, 0.8), this.hc, s * 0.162, -0.01, -0.005);
      this.m(scl(sph(0.018, skinDark, 10, 8), 0.4, 0.8, 0.6), this.hc, s * 0.17, -0.01, 0.0);
    }
    this.buildFace(p, skin, skinDark, hairM);
    this.buildHair(p, hairM);
    this.buildAccessory(p, accent, dark);

    // ---- arms
    const long = outfit !== 'tee';
    for (const [s, sh, el, wr] of [[1, this.shL, this.elL, this.wrL], [-1, this.shR, this.elR, this.wrR]]) {
      this.m(sph(0.052, sleeveM, 18, 12), sh, -s * 0.006, -0.02, 0);
      this.m(capsule(0.05, 0.17, sleeveM), sh, 0, -0.125, 0);
      if (!long) {
        this.m(capsule(0.044, 0.08, skin), sh, 0, -0.19, 0);
        this.m(torus(0.051, 0.008, sleeveM, Math.PI * 2, 6, 18), sh, 0, -0.17, 0, Math.PI / 2, 0, 0);
      }
      this.m(sph(0.046, long ? sleeveM : skin, 14, 10), el, 0, 0, 0);
      this.m(capsule(0.044, 0.15, long ? sleeveM : skin), el, 0, -0.1, 0);
      if (long) this.m(cyl(0.047, 0.046, 0.035, outfit === 'tech' ? glow(p.accent, 1.8) : mat(new THREE.Color(outfit === 'jacket' ? (pixelJacket ? p.accent : topColor) : topColor).multiplyScalar(0.82).getStyle(), { rough: 0.9 }), 14), el, 0, -0.19, 0);
      // hand: palm + fingers block + thumb
      const hand = group(wr, 0, -0.035, 0);
      this.m(scl(sph(0.047, skin, 16, 12), 0.9, 1.0, 0.62), hand, 0, -0.005, 0);
      this.m(scl(capsule(0.03, 0.03, skin, 4, 10), 1.25, 1, 0.6), hand, 0, -0.045, 0.004);
      this.m(scl(capsule(0.014, 0.03, skin, 4, 8), 1, 1, 1), hand, s * -0.035, -0.012, 0.02, 0.4, 0, s * 0.6);
      if (s === -1) this.handR = hand; else this.handL = hand;
    }

    // ---- legs
    for (const [s, th, kn, an] of [[1, this.thL, this.knL, this.anL], [-1, this.thR, this.knR, this.anR]]) {
      this.m(capsule(0.072, 0.21, bottom), th, 0, -0.165, 0);
      this.m(sph(0.064, bottom, 14, 10), kn, 0, 0, 0);
      this.m(capsule(0.06, 0.22, bottom), kn, 0, -0.15, 0);
      this.m(cyl(0.063, 0.062, 0.03, mat(new THREE.Color(bottomColor).multiplyScalar(0.78).getStyle()), 14), kn, 0, -0.27, 0);
      // sneaker
      this.m(rbox(0.1, 0.075, 0.2, 0.035, shoeM), an, 0, -0.022, 0.035);
      this.m(rbox(0.106, 0.026, 0.21, 0.012, soleM), an, 0, -0.058, 0.035);
      this.m(rbox(0.102, 0.012, 0.06, 0.005, accent), an, 0, 0.0, 0.035);
    }

    this.buildProps();
    this.applyPose();
  }

  buildFace(p, skin, skinDark, hairM) {
    const face = group(this.hc, 0, 0, 0);
    this.meshes.push(face);
    this.face = face;
    const white = mat('#fbfbff', { rough: 0.25 });
    const iris = mat(p.eyes || '#3b2a20', { rough: 0.3 });
    const pupil = mat('#0b0b10', { rough: 0.2 });
    const hl = mat('#ffffff', { emissive: '#ffffff', ei: 1.5 });
    this.eyes = [];
    for (const s of [1, -1]) {
      const eg = group(face, s * 0.06, 0.0, 0.142, 0);
      eg.rotation.y = s * 0.36;
      const ew = scl(sph(0.036, white, 22, 16), 0.86, 1.14, 0.46);
      eg.add(ew);
      const ir = group(eg, 0, 0, 0.0);
      const irm = scl(sph(0.025, iris, 20, 14), 1, 1.12, 0.36); irm.position.z = 0.011; ir.add(irm);
      const pm = scl(sph(0.0135, pupil, 14, 10), 1, 1.12, 0.3); pm.position.z = 0.016; ir.add(pm);
      const h1 = sph(0.0068, hl, 8, 6); h1.position.set(0.008, 0.011, 0.019); ir.add(h1);
      const h2 = sph(0.0035, hl, 6, 4); h2.position.set(-0.008, -0.009, 0.019); ir.add(h2);
      // upper lash line
      const lash = scl(torus(0.031, 0.0045, pupil, Math.PI * 0.9, 5, 16), 1, 1.2, 1);
      lash.position.set(0, 0.002, 0.008); lash.rotation.z = Math.PI * 0.05;
      eg.add(lash);
      this.eyes.push({ g: eg, ir, lash });
    }
    // brows
    this.brows = [];
    for (const s of [1, -1]) {
      const bg = group(face, s * 0.062, 0.058, 0.152, s * 0.34);
      const bm = capsule(0.0085, 0.036, hairM, 3, 8);
      bm.rotation.z = Math.PI / 2;
      bg.add(bm);
      this.brows.push({ g: bg, s });
    }
    // nose
    at(scl(sph(0.018, skinDark, 12, 10), 1.0, 0.8, 0.75), face, 0, -0.03, 0.162);
    // cheeks
    const blush = mat('#ff7c8f', { transparent: true, opacity: 0.32, rough: 1 });
    for (const s of [1, -1]) {
      const c = circle(0.022, blush, 20);
      c.position.set(s * 0.098, -0.042, 0.131);
      c.lookAt(new THREE.Vector3(s * 0.098, -0.042, 0.131).multiplyScalar(3));
      c.position.multiplyScalar(1.004);
      face.add(c);
    }
    // mouth
    const lip = mat('#6b2a2e', { rough: 0.5 });
    const mg = group(face, 0, -0.077, 0.146);
    this.mouth = {
      g: mg,
      smile: tube([[-0.028, 0.006, -0.004], [-0.014, -0.006, 0.002], [0, -0.009, 0.004], [0.014, -0.006, 0.002], [0.028, 0.006, -0.004]], 0.0052, lip, 'smile'),
      flat: tube([[-0.02, 0.0, -0.002], [0, -0.002, 0.003], [0.02, 0.0, -0.002]], 0.005, lip, 'flat'),
      frown: tube([[-0.022, -0.006, -0.003], [0, 0.003, 0.003], [0.022, -0.006, -0.003]], 0.005, lip, 'frown'),
      open: scl(sph(0.026, mat('#4a1520', { rough: 0.6 }), 18, 12), 1, 0.6, 0.38),
      tongue: scl(sph(0.016, mat('#e66a7a', { rough: 0.6 }), 12, 8), 1.1, 0.5, 0.4),
    };
    mg.add(this.mouth.smile, this.mouth.flat, this.mouth.frown, this.mouth.open);
    this.mouth.open.add(this.mouth.tongue); this.mouth.tongue.position.set(0, -0.55, 0.3);
  }

  buildHair(p, hairM) {
    const h = group(this.hc);
    this.meshes.push(h);
    const style = p.hair;
    const capped = p.accessory === 'cap' || p.accessory === 'beanie';
    const top = (r = 0.178, th = 0.44, tilt = 0.32) => {
      const m = sphPart(r, hairM, 0, Math.PI * 2, 0, Math.PI * th, 40, 18);
      m.rotation.x = -tilt;
      h.add(m); return m;
    };
    const back = (r = 0.176, th = 0.74, phiS = Math.PI * 0.95, phiL = Math.PI * 1.1) => {
      const m = sphPart(r, hairM, phiS, phiL, 0, Math.PI * th, 32, 18);
      h.add(m); return m;
    };
    const blob = (x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, r = 0.06) => {
      const m = scl(sph(r, hairM, 18, 12), sx, sy, sz); at(m, h, x, y, z, rx, ry, rz); return m;
    };
    if (style === 'swoop') {
      if (!capped) top(0.18, 0.44, 0.34);
      back(0.177, 0.66);
      blob(0.03, 0.125, 0.115, 1.55, 0.55, 0.85, 0.5, 0, -0.45, 0.065);
      blob(0.085, 0.09, 0.125, 0.9, 0.5, 0.6, 0.6, 0.3, -0.8, 0.05);
      blob(-0.07, 0.135, 0.095, 1.2, 0.55, 0.9, 0.5, 0, 0.3, 0.06);
      blob(0.0, 0.17, 0.04, 1.6, 0.7, 1.4, 0.1, 0, -0.2, 0.08);
      for (const s of [1, -1]) blob(s * 0.158, 0.02, 0.02, 0.35, 1.0, 0.6, 0, 0, 0, 0.05);
    } else if (style === 'bob') {
      if (!capped) top(0.182, 0.42, 0.22);
      const sh = sphPart(0.19, hairM, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI * 0.66, 40, 18);
      h.add(sh);
      blob(0, 0.12, 0.12, 2.3, 0.6, 0.8, 0.45, 0, 0, 0.065);
      for (const s of [1, -1]) blob(s * 0.135, 0.035, 0.1, 0.55, 1.4, 0.7, 0.1, 0, s * 0.05, 0.055);
    } else if (style === 'long') {
      if (!capped) top(0.182, 0.42, 0.22);
      const sh = sphPart(0.188, hairM, Math.PI / 2 + 0.9, Math.PI * 2 - 1.8, 0, Math.PI * 0.62, 40, 18);
      h.add(sh);
      blob(0, -0.12, -0.075, 2.7, 3.6, 1.0, -0.1, 0, 0, 0.065);
      for (const s of [1, -1]) {
        blob(s * 0.135, -0.03, 0.06, 0.6, 2.4, 0.75, 0.15, 0, s * 0.08, 0.05);
        blob(s * 0.11, -0.16, 0.06, 0.6, 1.8, 0.75, 0.25, 0, s * 0.1, 0.05);
      }
      blob(0.04, 0.12, 0.12, 1.9, 0.6, 0.8, 0.45, 0, -0.35, 0.065);
    } else if (style === 'curly') {
      const pts = [];
      for (let i = 0; i < 34; i++) {
        const y = 1 - (i / 33) * 1.25;
        const rr = Math.sqrt(Math.max(0, 1 - y * y));
        const th = i * 2.399;
        const x = Math.cos(th) * rr, z = Math.sin(th) * rr;
        if (z > 0.45 && y < 0.55) continue; // keep face clear
        if (capped && y > 0.25) continue;
        pts.push([x, y, z]);
      }
      for (const [x, y, z] of pts) {
        const s = 0.058 + Math.random() * 0.016;
        const m = sph(s, hairM, 12, 10);
        m.position.set(x * 0.17, y * 0.17 + 0.02, z * 0.17 - 0.01);
        h.add(m);
      }
      if (!capped) top(0.172, 0.5, 0.3);
    } else if (style === 'bun') {
      if (!capped) top(0.18, 0.44, 0.25);
      back(0.178, 0.6);
      blob(0, 0.205, -0.07, 1, 1, 1, 0, 0, 0, 0.07);
      at(torus(0.05, 0.012, mat('#ff4f8b'), Math.PI * 2, 6, 18), h, 0, 0.165, -0.055, -0.9, 0, 0);
      blob(0.02, 0.12, 0.12, 2.0, 0.5, 0.8, 0.5, 0, -0.2, 0.06);
      for (const s of [1, -1]) blob(s * 0.156, 0.0, 0.035, 0.35, 1.3, 0.55, 0, 0, 0, 0.05);
    } else if (style === 'spiky') {
      if (!capped) top(0.178, 0.44, 0.3);
      back(0.176, 0.6);
      if (!capped) for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const c = cone(0.045, 0.13, hairM, 8);
        const dir = new THREE.Vector3(Math.cos(a) * 0.6, 1, Math.sin(a) * 0.6 - 0.3).normalize();
        c.position.copy(dir).multiplyScalar(0.16);
        c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        h.add(c);
      }
      blob(0.0, 0.13, 0.115, 2.0, 0.5, 0.8, 0.5, 0, 0, 0.06);
    } else if (style === 'buzz') {
      if (!capped) top(0.171, 0.47, 0.28);
      back(0.17, 0.62);
    }
  }

  buildAccessory(p, accent, dark) {
    const a = group(this.hc);
    this.meshes.push(a);
    const acc = p.accessory;
    const hpMat = mat('#1d1f2b', { rough: 0.45, metal: 0.2 });
    if (acc === 'headphones' || acc === 'catears') {
      at(torus(0.192, 0.017, hpMat, Math.PI, 8, 40), a, 0, 0.0, -0.01);
      at(torus(0.192, 0.011, accent, Math.PI * 0.6, 6, 24), a, 0, 0.003, -0.01, 0, 0, Math.PI * 0.2);
      for (const s of [1, -1]) {
        const cup = at(cyl(0.062, 0.062, 0.045, hpMat, 24), a, s * 0.183, -0.01, -0.005, 0, 0, Math.PI / 2);
        at(torus(0.05, 0.014, mat('#2c2e3d', { rough: 0.8 }), Math.PI * 2, 8, 24), a, s * 0.162, -0.01, -0.005, 0, Math.PI / 2, 0);
        at(torus(0.045, 0.006, glow(p.accent, 2.6), Math.PI * 2, 6, 24), a, s * 0.207, -0.01, -0.005, 0, Math.PI / 2, 0);
      }
      // mic boom
      const boom = tube([[-0.19, -0.03, 0.02], [-0.17, -0.09, 0.09], [-0.1, -0.11, 0.15], [-0.05, -0.1, 0.165]], 0.0055, hpMat, 'boom');
      a.add(boom);
      at(sph(0.012, dark, 8, 6), a, -0.05, -0.1, 0.165);
      if (acc === 'catears') {
        for (const s of [1, -1]) {
          const c = at(cone(0.05, 0.08, hpMat, 4), a, s * 0.1, 0.16, 0.0, 0, Math.PI / 4, s * -0.4);
          at(cone(0.03, 0.05, glow(p.accent, 2.2), 4), a, s * 0.1, 0.165, 0.018, 0, Math.PI / 4, s * -0.4);
        }
      }
    } else if (acc === 'glasses') {
      const fr = mat('#22222c', { rough: 0.3, metal: 0.4 });
      for (const s of [1, -1]) {
        at(scl(torus(0.034, 0.0055, fr, Math.PI * 2, 6, 24), 1.1, 0.95, 1), a, s * 0.062, 0.0, 0.168, 0, s * 0.3, 0);
        at(rbox(0.006, 0.006, 0.15, 0.002, fr), a, s * 0.152, 0.01, 0.08, 0, s * 0.12, 0);
        const lens = at(scl(circle(0.033, mat('#bfe6ff', { transparent: true, opacity: 0.18, rough: 0.05 }), 20), 1.1, 0.95, 1), a, s * 0.062, 0, 0.169, 0, s * 0.3, 0);
      }
      at(cyl(0.004, 0.004, 0.03, fr, 6), a, 0, 0.005, 0.178, 0, 0, Math.PI / 2);
    } else if (acc === 'cap') {
      const cm = mat(p.accent, { rough: 0.8 });
      const dome = sphPart(0.186, cm, 0, Math.PI * 2, 0, Math.PI * 0.46, 36, 14);
      dome.rotation.x = -0.18; a.add(dome);
      const brim = scl(cyl(0.11, 0.11, 0.012, cm, 28), 1, 1, 1.15);
      at(brim, a, 0, 0.06, 0.17, 0.18, 0, 0);
      at(sph(0.018, cm, 8, 6), a, 0, 0.185, -0.02);
      at(scl(circle(0.035, mat('#ffffff', { rough: 0.6 }), 20), 1, 1, 1), a, 0, 0.11, 0.165, -0.55, 0, 0);
    } else if (acc === 'beanie') {
      const bm = mat(p.accent, { rough: 0.95, map: knit('#ffffff') });
      const dome = sphPart(0.19, bm, 0, Math.PI * 2, 0, Math.PI * 0.48, 36, 14);
      dome.rotation.x = -0.15; a.add(dome);
      at(scl(torus(0.182, 0.026, bm, Math.PI * 2, 8, 36), 1, 1, 1), a, 0, 0.03, 0.0, Math.PI / 2 - 0.15, 0, 0);
      at(sph(0.04, mat('#f4f1ea', { rough: 1 }), 12, 10), a, 0, 0.2, -0.02);
    }
  }

  buildProps() {
    // Phone in right hand
    const ph = group(this.handR, 0, -0.06, 0.03);
    this.meshes.push(ph);
    at(rbox(0.07, 0.13, 0.012, 0.01, mat('#15161f', { rough: 0.3, metal: 0.3 })), ph, 0, 0, 0);
    this.phoneScreen = umat('#000', { emissive: '#7aa2ff', ei: 1.6 });
    at(rbox(0.06, 0.115, 0.002, 0.004, this.phoneScreen), ph, 0, 0, 0.0065);
    ph.rotation.set(-1.2, 0, 0);
    ph.visible = false;
    this.props.phone = ph;
    // Bowl + chopsticks in left hand
    const bw = group(this.handL, 0.0, -0.06, 0.06);
    this.meshes.push(bw);
    at(lathe([[0.001, 0], [0.04, 0.0], [0.07, 0.04], [0.075, 0.07], [0.07, 0.07], [0.001, 0.02]], mat('#f4f1ea', { rough: 0.4 }), 24, 'bowl'), bw, 0, 0, 0);
    at(cyl(0.068, 0.068, 0.005, mat('#f5c46b', { rough: 0.7 }), 20), bw, 0, 0.058, 0);
    bw.rotation.set(0, 0, 0);
    bw.visible = false;
    this.props.bowl = bw;
    const st = group(this.handR, 0, -0.05, 0.02);
    this.meshes.push(st);
    at(cyl(0.004, 0.003, 0.2, mat('#c79a5b'), 6), st, 0.008, 0, 0, 0.8, 0, 0);
    at(cyl(0.004, 0.003, 0.2, mat('#c79a5b'), 6), st, -0.008, 0, 0, 0.8, 0, 0);
    st.visible = false;
    this.props.sticks = st;
    // Energy can
    const can = group(this.handR, 0, -0.06, 0.02);
    this.meshes.push(can);
    at(cyl(0.028, 0.028, 0.1, mat('#c6ff00', { rough: 0.3, metal: 0.6 }), 16), can, 0, 0, 0);
    at(cyl(0.029, 0.029, 0.03, mat('#15161f', { rough: 0.3, metal: 0.6 }), 16), can, 0, 0, 0);
    can.visible = false;
    this.props.can = can;
    // Snack bar
    const sn = group(this.handR, 0, -0.06, 0.02);
    this.meshes.push(sn);
    at(rbox(0.035, 0.11, 0.02, 0.008, mat('#ff4f8b', { rough: 0.4 })), sn, 0, 0, 0);
    sn.visible = false;
    this.props.snack = sn;
    // Mug
    const mug = group(this.handR, 0, -0.06, 0.03);
    this.meshes.push(mug);
    at(cyl(0.035, 0.032, 0.08, mat('#f4f1ea', { rough: 0.4 }), 16), mug, 0, 0, 0);
    at(torus(0.022, 0.007, mat('#f4f1ea'), Math.PI * 2, 6, 12), mug, 0.04, 0, 0, 0, 0, 0);
    mug.visible = false;
    this.props.mug = mug;
    // Pizza slice
    const pz = group(this.handR, 0, -0.06, 0.03);
    this.meshes.push(pz);
    const tri = new THREE.Shape(); tri.moveTo(-0.05, 0.06); tri.lineTo(0.05, 0.06); tri.lineTo(0, -0.07); tri.closePath();
    const pg = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.01, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 }), mat('#f6c453', { rough: 0.7 }));
    pz.add(pg);
    at(rbox(0.11, 0.02, 0.016, 0.007, mat('#c98a3d')), pz, 0, 0.065, 0.005);
    pz.visible = false;
    this.props.pizza = pz;
  }

  showProp(name) {
    for (const [k, v] of Object.entries(this.props)) v.visible = k === name || (name === 'bowl' && k === 'sticks');
    this.propName = name;
  }

  setExpression(e, dur = 0) { this.expr = e; this.exprT = dur; }

  // ------------------------------------------------------------- animation
  play(clip, opts = {}) {
    if (this.clip !== clip || opts.restart) this.clipT = 0;
    this.clip = clip;
    this.clipOpts = opts;
    if (opts.blend) this.blendK = opts.blend; else this.blendK = 10;
  }

  computeTarget(dt) {
    const T = this.target;
    for (const k of KEYS) T[k] = 0;
    const t = this.clipT;
    const tired = this.tired;
    const breathe = Math.sin(this.time * 2.0) * 0.5 + 0.5;
    const fn = CLIPS[this.clip] || CLIPS.idle;
    fn(T, t, this, breathe, tired);
    // tired posture overlay
    if (tired > 0 && !['sleep', 'yawn'].includes(this.clip)) {
      T.spRx += 0.12 * tired; T.hdRx += 0.18 * tired; T.lsz += 0.04 * tired; T.rsz -= 0.04 * tired;
    }
  }

  applyPose() {
    const P = this.pose;
    this.body.position.y = P.by;
    this.body.position.z = P.bz;
    this.hips.rotation.set(P.hipRx, P.hipRy, P.hipRz);
    this.spine.rotation.set(P.spRx, P.spRy, P.spRz);
    this.neck.rotation.set(P.nkRx, P.nkRy, 0);
    this.head.rotation.set(P.hdRx + this.lookPitch, P.hdRy + this.lookYaw, P.hdRz);
    this.shL.rotation.set(P.lsx, P.lsy, P.lsz);
    this.shR.rotation.set(P.rsx, P.rsy, P.rsz);
    this.elL.rotation.set(P.lex, P.ley, 0);
    this.elR.rotation.set(P.rex, P.rey, 0);
    this.wrL.rotation.set(P.lwx, 0, P.lwz);
    this.wrR.rotation.set(P.rwx, 0, P.rwz);
    this.thL.rotation.set(P.ltx, 0, P.ltz);
    this.thR.rotation.set(P.rtx, 0, P.rtz);
    this.knL.rotation.set(P.lkx, 0, 0);
    this.knR.rotation.set(P.rkx, 0, 0);
    this.anL.rotation.set(P.lax, 0, 0);
    this.anR.rotation.set(P.rax, 0, 0);
  }

  update(dt) {
    this.time += dt;
    this.clipT += dt;
    this.computeTarget(dt);
    const k = 1 - Math.exp(-this.blendK * dt);
    for (const key of KEYS) this.pose[key] += (this.target[key] - this.pose[key]) * k;
    // head look
    this.lookYaw = damp(this.lookYaw, this.lookTargetYaw, 5, dt);
    this.lookPitch = damp(this.lookPitch, this.lookTargetPitch, 5, dt);
    this.applyPose();
    // lying (sleep) transform
    const ly = this.clip === 'sleep' ? 1 : 0;
    this.lying = damp(this.lying, ly, 6, dt);
    this.body.rotation.x = -Math.PI / 2 * this.lying;

    // ----- face: blink, gaze, mouth, brows
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 1; this.blinkT = 2 + Math.random() * 3.5; }
    this.blink = Math.max(0, this.blink - dt * 7);
    let open = 1 - Math.sin(Math.min(1, this.blink) * Math.PI);
    const e = this.expr;
    let lidOpen = 1;
    if (e === 'tired' || this.tired > 0.6) lidOpen = 0.55;
    if (e === 'happy') lidOpen = 0.85;
    if (e === 'shocked') lidOpen = 1.2;
    if (e === 'focus') lidOpen = 0.78;
    if (this.clip === 'sleep' || e === 'sleep') lidOpen = 0.06;
    if (e === 'laugh') lidOpen = 0.25;
    const ey = Math.max(0.06, open * lidOpen);
    for (const eye of this.eyes) eye.g.scale.y = damp(eye.g.scale.y, ey, 18, dt);
    // gaze wander
    if (Math.random() < dt * 0.6) this.gazeTarget.set((Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.008);
    this.gaze.lerp(this.gazeTarget, 1 - Math.exp(-8 * dt));
    for (const eye of this.eyes) eye.ir.position.set(this.gaze.x, this.gaze.y, 0);
    // brows
    let bY = 0.058, bRot = 0;
    if (e === 'happy' || e === 'laugh') { bY = 0.064; bRot = 0.1; }
    if (e === 'shocked') { bY = 0.074; bRot = 0.12; }
    if (e === 'focus') { bY = 0.052; bRot = -0.18; }
    if (e === 'sad' || e === 'tired') { bY = 0.054; bRot = 0.28; }
    if (e === 'angry') { bY = 0.05; bRot = -0.35; }
    for (const b of this.brows) {
      b.g.position.y = damp(b.g.position.y, bY, 10, dt);
      b.g.rotation.z = damp(b.g.rotation.z, -b.s * bRot, 10, dt);
    }
    // mouth
    const M = this.mouth;
    this.talkAmt = damp(this.talkAmt, this.talking ? 1 : 0, 12, dt);
    let mouthOpen = 0;
    if (this.talkAmt > 0.05) mouthOpen = this.talkAmt * (0.35 + 0.65 * Math.abs(Math.sin(this.time * 13) * Math.sin(this.time * 7.3)));
    if (e === 'shocked') mouthOpen = Math.max(mouthOpen, 0.9);
    if (e === 'laugh') mouthOpen = Math.max(mouthOpen, 0.55 + 0.25 * Math.abs(Math.sin(this.time * 14)));
    if (this.clip === 'eat') mouthOpen = Math.max(mouthOpen, Math.max(0, Math.sin(this.time * 9)) * 0.35);
    if (this.clip === 'yawn') mouthOpen = Math.max(mouthOpen, 1.0);
    M.open.visible = mouthOpen > 0.08;
    M.open.scale.set(e === 'shocked' ? 0.75 : 1, 0.6 * Math.max(0.15, mouthOpen) * (e === 'shocked' ? 1.6 : 1), 0.38);
    const smileShow = !M.open.visible;
    M.smile.visible = smileShow && (e === 'happy' || e === 'neutral' || e === 'cool' || e === 'laugh');
    M.flat.visible = smileShow && (e === 'focus' || e === 'tired' || e === 'sleep' || e === 'angry');
    M.frown.visible = smileShow && e === 'sad';
    M.g.scale.x = e === 'neutral' ? 0.8 : 1;
    if (this.exprT > 0) { this.exprT -= dt; if (this.exprT <= 0) this.expr = this.tired > 0.6 ? 'tired' : 'neutral'; }
    if (this.phoneScreen) this.phoneScreen.emissiveIntensity = 1.3 + Math.sin(this.time * 3) * 0.2;
  }
}

// ---------------------------------------------------------------- clips
// Each clip writes target joint angles into T. Arms: negative x = forward. Legs: negative x = forward.
const sin = Math.sin, cos = Math.cos;
function armsRelaxed(T, br) {
  T.lsz = 0.1 + br * 0.015; T.rsz = -0.1 - br * 0.015;
  T.lex = -0.12; T.rex = -0.12;
  T.lsx = 0.04; T.rsx = 0.04;
}
function sitBase(T, c) {
  const seat = c.seatDrop ?? -0.25;
  T.by = seat; T.bz = 0.0;
  T.ltx = -1.5; T.rtx = -1.5; T.lkx = 1.45; T.rkx = 1.45; T.lax = 0.05; T.rax = 0.05;
  T.ltz = 0.06; T.rtz = -0.06;
}
function handsOnDesk(T, lean = 0.12) {
  T.spRx = lean;
  T.lsx = -0.62; T.rsx = -0.62; T.lsz = 0.16; T.rsz = -0.16; T.lsy = -0.15; T.rsy = 0.15;
  T.lex = -1.15; T.rex = -1.15; T.ley = 0.2; T.rey = -0.2;
  T.lwx = 0.15; T.rwx = 0.15;
  T.hdRx = 0.08;
}

export const CLIPS = {
  idle(T, t, c, br) {
    armsRelaxed(T, br);
    T.spRx = -0.02 + br * 0.015;
    T.hdRx = -0.03 + br * 0.01;
    T.by = -br * 0.004;
    const sway = sin(t * 0.7) * 0.025;
    T.hipRz = sway; T.spRz = -sway * 0.6;
    T.ltz = 0.03; T.rtz = -0.03;
    // occasional head look around
    T.hdRy = sin(t * 0.37) * 0.25 * Math.max(0, sin(t * 0.13));
  },
  walk(T, t, c) {
    const sp = c.speed || 1.6;
    const f = sp * 4.0;
    const ph = t * f;
    const amp = 0.55 * Math.min(1, sp / 1.6);
    T.ltx = sin(ph) * amp; T.rtx = -sin(ph) * amp;
    T.lkx = Math.max(0, -sin(ph + 0.9)) * 0.95 * amp / 0.55 + 0.05;
    T.rkx = Math.max(0, sin(ph + 0.9)) * 0.95 * amp / 0.55 + 0.05;
    T.lax = -sin(ph) * 0.2; T.rax = sin(ph) * 0.2;
    T.lsx = -sin(ph) * amp * 0.8; T.rsx = sin(ph) * amp * 0.8;
    T.lsz = 0.1; T.rsz = -0.1;
    T.lex = -0.35 - Math.max(0, -sin(ph)) * 0.25; T.rex = -0.35 - Math.max(0, sin(ph)) * 0.25;
    T.by = -Math.abs(cos(ph)) * 0.035 + 0.01;
    T.hipRy = sin(ph) * 0.12; T.spRy = -sin(ph) * 0.16;
    T.hipRz = cos(ph) * 0.03;
    T.spRx = 0.06; T.hdRx = -0.04;
  },
  sit(T, t, c, br) {
    sitBase(T, c);
    T.spRx = -0.06 + br * 0.01;
    T.lsx = -0.35; T.rsx = -0.35; T.lsz = 0.12; T.rsz = -0.12;
    T.lex = -0.9; T.rex = -0.9;
    T.hdRx = 0.02;
  },
  sitType(T, t, c, br) {
    sitBase(T, c); handsOnDesk(T, 0.1);
    T.lwx = 0.15 + Math.max(0, sin(t * 22)) * 0.18;
    T.rwx = 0.15 + Math.max(0, sin(t * 19 + 1.2)) * 0.18;
    T.lsy = -0.15 + sin(t * 3.1) * 0.05; T.rsy = 0.15 + sin(t * 2.7) * 0.05;
    T.hdRy = sin(t * 0.8) * 0.05;
  },
  sitGame(T, t, c, br) {
    sitBase(T, c); handsOnDesk(T, 0.2);
    // left hand WASD, right hand mouse moving
    T.lwx = 0.12 + Math.max(0, sin(t * 11)) * 0.12;
    T.rsy = 0.15 + sin(t * 2.3) * 0.12 + sin(t * 7.1) * 0.04;
    T.rex = -1.15 + sin(t * 3.3) * 0.06;
    T.spRy = sin(t * 1.7) * 0.04;
    T.hdRx = 0.1 + sin(t * 4.2) * 0.02;
    T.hdRy = sin(t * 1.1) * 0.06;
    T.by += sin(t * 2.0) * 0.004;
  },
  sitIntense(T, t, c) {
    sitBase(T, c); handsOnDesk(T, 0.34);
    T.lwx = 0.12 + Math.max(0, sin(t * 16)) * 0.2;
    T.rsy = 0.15 + sin(t * 5.3) * 0.18;
    T.hdRx = 0.18; T.hdRy = sin(t * 3) * 0.05;
    T.spRy = sin(t * 4) * 0.05;
  },
  sitEdit(T, t, c) {
    sitBase(T, c); handsOnDesk(T, 0.14);
    T.lwx = 0.12;
    T.rsy = 0.18 + sin(t * 1.4) * 0.08;
    T.rwx = 0.12 + (sin(t * 6) > 0.85 ? 0.25 : 0);
    T.hdRx = 0.12 + sin(t * 0.9) * 0.03;
    T.hdRz = sin(t * 0.6) * 0.05;
  },
  sitTalk(T, t, c) {
    sitBase(T, c);
    T.spRy = 0.25; T.hdRy = 0.3 + sin(t * 1.3) * 0.08; T.hdRx = -0.05 + sin(t * 2.7) * 0.04;
    T.spRx = -0.02;
    // gesturing right arm
    T.rsx = -0.9 + sin(t * 2.2) * 0.25; T.rsz = -0.35 + sin(t * 1.5) * 0.15; T.rex = -1.3 + sin(t * 3.1) * 0.3;
    T.rwz = sin(t * 4) * 0.3;
    T.lsx = -0.6; T.lsz = 0.16; T.lex = -1.1;
    T.hdRz = sin(t * 1.9) * 0.06;
  },
  sitWave(T, t, c) {
    sitBase(T, c);
    T.spRy = 0.2; T.hdRy = 0.3; T.hdRz = 0.08;
    T.rsx = -0.4; T.rsz = -2.5; T.rex = -0.4 + sin(t * 9) * 0.35; T.rwz = sin(t * 9) * 0.25;
    T.lsx = -0.6; T.lsz = 0.16; T.lex = -1.1;
  },
  sitWin(T, t, c) {
    sitBase(T, c);
    const b = Math.abs(sin(t * 7));
    T.by += b * 0.03;
    T.spRx = -0.15;
    T.lsx = -2.6 + b * 0.2; T.rsx = -2.6 + b * 0.2; T.lsz = 0.3; T.rsz = -0.3;
    T.lex = -0.5; T.rex = -0.5;
    T.hdRx = -0.2;
  },
  sitFail(T, t, c) {
    sitBase(T, c);
    T.spRx = -0.2;
    T.lsx = -2.4; T.rsx = -2.4; T.lsz = 0.55; T.rsz = -0.55;
    T.lex = -2.0; T.rex = -2.0;
    T.hdRx = -0.15; T.hdRy = sin(t * 3) * 0.15;
  },
  sitLaugh(T, t, c) {
    sitBase(T, c);
    const b = Math.abs(sin(t * 10));
    T.spRx = -0.18 + b * 0.08; T.hdRx = -0.25 + b * 0.1;
    T.lsx = -0.5; T.rsx = -0.5; T.lsz = 0.25; T.rsz = -0.25; T.lex = -1.5; T.rex = -1.5;
    T.by += b * 0.01;
  },
  sitPhone(T, t, c) {
    sitBase(T, c);
    T.spRx = 0.12; T.hdRx = 0.35;
    T.rsx = -0.7; T.rsz = 0.18; T.rex = -1.55; T.rwx = 0.1 + Math.max(0, sin(t * 9)) * 0.08;
    T.lsx = -0.7; T.lsz = -0.18; T.lex = -1.55;
  },
  phone(T, t, c, br) {
    T.spRx = 0.08; T.hdRx = 0.38;
    T.rsx = -0.72; T.rsz = 0.2; T.rex = -1.6; T.rwx = 0.1 + Math.max(0, sin(t * 9)) * 0.08;
    T.lsx = -0.72; T.lsz = -0.2; T.lex = -1.6;
    T.ltz = 0.03; T.rtz = -0.03;
    T.hipRz = sin(t * 0.8) * 0.02;
  },
  selfie(T, t) {
    T.rsx = -1.6; T.rsz = -0.5; T.rex = -0.3; T.rsy = 0.3;
    T.lsx = 0.0; T.lsz = 0.5; T.lex = -0.1; T.lwz = 0.3;
    T.hdRz = 0.15; T.hdRy = -0.2; T.spRz = 0.05;
    T.hipRz = 0.05;
  },
  reach(T, t) {
    T.rsx = -1.35; T.rsz = -0.15; T.rex = -0.25; T.spRx = 0.12;
    T.lsz = 0.12; T.lex = -0.2;
    T.hdRx = 0.05;
  },
  pressButton(T, t) {
    T.spRx = 0.35; T.rsx = -1.0 - Math.max(0, sin(t * 6)) * 0.2; T.rsz = -0.1; T.rex = -0.5;
    T.lsz = 0.15; T.hdRx = 0.25;
  },
  eat(T, t, c) {
    // bowl held in left hand, chopsticks to mouth with right
    T.lsx = -0.75; T.lsz = -0.1; T.lex = -1.25; T.ley = 0.6;
    const cyc = Math.max(0, sin(t * 3.2));
    T.rsx = -0.9 - cyc * 0.55; T.rsz = 0.2; T.rex = -1.4 - cyc * 0.6;
    T.hdRx = 0.12 - cyc * 0.12; T.spRx = 0.05;
  },
  eatHand(T, t, c) {
    const cyc = Math.max(0, sin(t * 3.2));
    T.rsx = -0.7 - cyc * 0.75; T.rsz = 0.15 + cyc * 0.1; T.rex = -1.3 - cyc * 0.75;
    T.lsz = 0.12; T.lex = -0.2;
    T.hdRx = 0.05 - cyc * 0.1;
  },
  drink(T, t) {
    const cyc = Math.min(1, t * 1.5);
    T.rsx = -0.8 - cyc * 0.9; T.rsz = 0.2; T.rex = -1.6 - cyc * 0.4;
    T.hdRx = -0.35 * cyc; T.spRx = -0.08 * cyc;
    T.lsz = 0.15; T.lex = -0.2;
  },
  cook(T, t) {
    T.spRx = 0.18; T.hdRx = 0.35;
    T.rsx = -0.9; T.rex = -0.8 + sin(t * 5) * 0.25; T.rsz = 0.1 + sin(t * 5) * 0.15;
    T.lsx = -0.8; T.lex = -0.9; T.lsz = -0.05;
  },
  celebrate(T, t) {
    const j = Math.max(0, sin(t * 6.5));
    T.by = j * 0.16;
    T.lsx = -2.8; T.rsx = -2.8; T.lsz = 0.35 + j * 0.2; T.rsz = -0.35 - j * 0.2;
    T.lex = -0.3 - j * 0.3; T.rex = -0.3 - j * 0.3;
    T.ltx = -j * 0.5; T.rtx = -j * 0.5; T.lkx = j * 0.9; T.rkx = j * 0.9;
    T.spRx = -0.12; T.hdRx = -0.2;
  },
  fistPump(T, t) {
    const p = Math.max(0, sin(t * 8));
    T.rsx = -1.2 - p * 1.2; T.rsz = -0.3; T.rex = -1.8 + p * 0.6;
    T.lsz = 0.2; T.lex = -0.4;
    T.by = p * 0.03; T.spRx = -0.08; T.hdRx = -0.1;
  },
  dance(T, t) {
    const b = sin(t * 7);
    T.by = Math.abs(b) * 0.05;
    T.hipRz = b * 0.12; T.spRz = -b * 0.1; T.hdRz = b * 0.1;
    T.lsx = -1.2 + b * 0.6; T.rsx = -1.2 - b * 0.6; T.lsz = 0.5; T.rsz = -0.5; T.lex = -1.2; T.rex = -1.2;
    T.ltx = Math.max(0, b) * -0.4; T.rtx = Math.max(0, -b) * -0.4; T.lkx = Math.max(0, b) * 0.6; T.rkx = Math.max(0, -b) * 0.6;
  },
  wave(T, t) {
    T.rsx = -0.3; T.rsz = -2.6; T.rex = -0.4 + sin(t * 9) * 0.35; T.rwz = sin(t * 9) * 0.25;
    T.lsz = 0.12; T.lex = -0.15; T.hdRz = 0.08;
  },
  shrug(T, t) {
    T.lsz = 0.5; T.rsz = -0.5; T.lex = -1.4; T.rex = -1.4; T.lsx = -0.3; T.rsx = -0.3;
    T.ley = -0.8; T.rey = 0.8;
    T.hdRz = 0.12; T.by = 0.0;
  },
  yawn(T, t) {
    const p = Math.min(1, t * 1.2);
    T.lsx = -2.7 * p; T.rsx = -2.7 * p; T.lsz = 0.4 * p; T.rsz = -0.4 * p; T.lex = -0.6 * p; T.rex = -0.6 * p;
    T.spRx = -0.2 * p; T.hdRx = -0.3 * p;
  },
  sleep(T, t, c, br) {
    T.lsz = 0.12; T.rsz = -0.12; T.lsx = -0.2; T.rsx = 0.1;
    T.lex = -0.6; T.rex = -1.4;
    T.spRx = br * 0.02;
    T.ltx = -0.08; T.lkx = 0.15; T.rtx = 0.0;
    T.hdRy = 0.25;
  },
  pose(T, t) {
    T.rsx = -0.4; T.rsz = -0.9; T.rex = -2.0; T.rwz = 0.4;
    T.lsz = 0.6; T.lex = -1.8; T.lsx = 0.2;
    T.hipRz = 0.08; T.hdRz = -0.12; T.spRz = -0.04;
  },
  look(T, t) { // look at room / admire
    T.lsz = 0.15; T.rsz = -0.15; T.lex = -0.2; T.rex = -0.2;
    T.hdRy = sin(t * 0.8) * 0.5; T.hdRx = -0.15;
  },
};
