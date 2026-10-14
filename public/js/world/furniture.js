// Procedural furniture, gear tiers and decor. Every gear tier is visibly distinct.
import * as THREE from 'three';
import { mat, umat, glow, rbox, box, cyl, sph, sphPart, capsule, torus, cone, plane, circle, lathe, tube, at, scl, group, canvasTex } from './kit.js';
import { fabric, rugTex, marble } from './textures.js';

export const DESK_H = 0.75;
const black = () => mat('#16161d', { rough: 0.45, metal: 0.2 });
const plastic = (c) => mat(c, { rough: 0.45 });
const metal = (c = '#b8bcc8') => mat(c, { rough: 0.3, metal: 0.8 });
const shade = (c, f) => '#' + new THREE.Color(c).multiplyScalar(f).getHexString();

// Screen surface; the room registers it with the screen manager.
function screen(parent, w, h, x, y, z, ry = 0, key = 'main') {
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const s = plane(w, h, m);
  s.userData.screenKey = key; s.userData.noShadow = true;
  at(s, parent, x, y, z, 0, ry, 0);
  s.userData.ownMat = true;
  return s;
}

// ---------------------------------------------------------------- DESKS
export function buildDesk(tier, th) {
  const g = new THREE.Group();
  const H = DESK_H;
  const woodM = mat(th.wood, { rough: 0.55 });
  let w = 1.3, d = 0.66;
  if (tier === 0) {
    w = 1.1; d = 0.6;
    at(rbox(w, 0.035, d, 0.012, mat('#a89d8f', { rough: 0.7 })), g, 0, H - 0.018, 0);
    const lm = metal('#8a8f9c');
    for (const s of [-1, 1]) {
      at(cyl(0.012, 0.012, 0.86, lm, 8), g, s * (w / 2 - 0.08), H / 2, 0, 0.75, 0, 0);
      at(cyl(0.012, 0.012, 0.86, lm, 8), g, s * (w / 2 - 0.08), H / 2, 0, -0.75, 0, 0);
    }
  } else if (tier === 1) {
    w = 1.35; d = 0.66;
    at(rbox(w, 0.05, d, 0.015, woodM), g, 0, H - 0.025, 0);
    at(rbox(0.4, H - 0.05, d - 0.04, 0.01, woodM), g, w / 2 - 0.22, (H - 0.05) / 2, 0);
    for (let i = 0; i < 3; i++) {
      at(rbox(0.36, 0.18, 0.01, 0.005, mat(shade(th.wood, 1.08), { rough: 0.5 })), g, w / 2 - 0.22, 0.12 + i * 0.21, d / 2 - 0.015);
      at(rbox(0.1, 0.012, 0.015, 0.005, metal()), g, w / 2 - 0.22, 0.18 + i * 0.21, d / 2 - 0.005);
    }
    at(rbox(0.04, H - 0.05, d - 0.06, 0.01, woodM), g, -w / 2 + 0.03, (H - 0.05) / 2, 0);
  } else if (tier === 2) {
    w = 1.7; d = 0.72;
    const top = mat('#2a2b35', { rough: 0.5 });
    at(rbox(w, 0.045, d, 0.015, top), g, 0, H - 0.022, 0);
    at(rbox(0.6, 0.045, 0.62, 0.015, top), g, -w / 2 - 0.27, H - 0.022, -d / 2 + 0.31 + 0.0);
    const lm = black();
    for (const [x, z] of [[w / 2 - 0.05, 0], [-w / 2 - 0.5, -d / 2 + 0.31]]) at(rbox(0.06, H - 0.045, 0.6, 0.01, lm), g, x, (H - 0.045) / 2, z);
    at(rbox(0.06, H - 0.045, 0.06, 0.01, lm), g, -w / 2 + 0.05, (H - 0.045) / 2, d / 2 - 0.06);
    at(rbox(w + 0.5, 0.006, 0.01, 0.002, glow(th.accent || '#ff4f8b', 2)), g, -0.25, H - 0.045, d / 2 - 0.005);
  } else if (tier === 3) {
    w = 1.8; d = 0.78;
    at(rbox(w, 0.06, d, 0.02, mat('#1c1d26', { rough: 0.35 })), g, 0, H - 0.03, 0);
    at(rbox(w - 0.04, 0.008, d - 0.04, 0.003, mat('#3a3c52', { rough: 0.9 })), g, 0, H + 0.002, 0.0); // desk mat
    const lm = metal('#2b2d38');
    for (const s of [-1, 1]) {
      at(rbox(0.09, H - 0.06, 0.09, 0.02, lm), g, s * (w / 2 - 0.2), (H - 0.06) / 2, -0.05);
      at(rbox(0.1, 0.03, d - 0.1, 0.012, lm), g, s * (w / 2 - 0.2), 0.015, -0.05);
    }
    at(rbox(w - 0.1, 0.01, 0.01, 0.003, glow(th.accent || '#ff4f8b', 3)), g, 0, H - 0.065, d / 2 - 0.03);
    at(rbox(0.01, 0.01, d - 0.1, 0.003, glow(th.accent || '#ff4f8b', 3)), g, -w / 2 + 0.03, H - 0.065, 0);
    at(rbox(0.01, 0.01, d - 0.1, 0.003, glow(th.accent || '#ff4f8b', 3)), g, w / 2 - 0.03, H - 0.065, 0);
    at(rbox(0.4, 0.04, 0.05, 0.01, plastic('#2a2b35')), g, 0.3, H - 0.08, d / 2 - 0.05); // control pad
  } else {
    w = 2.3; d = 0.85;
    const top = mat('#15161d', { rough: 0.3, metal: 0.2 });
    // curved command desk built from segments
    const seg = 7;
    for (let i = 0; i < seg; i++) {
      const a = (i - (seg - 1) / 2) * 0.09;
      const x = Math.sin(a) * 3.2, z = -(1 - Math.cos(a)) * 3.2;
      at(rbox(w / seg + 0.02, 0.06, d, 0.02, top), g, x, H - 0.03, z, 0, -a, 0);
      at(rbox(w / seg + 0.02, 0.01, 0.012, 0.003, glow(th.accent || '#ff4f8b', 3)), g, x + Math.sin(-a) * 0, H - 0.065, z + d / 2 - 0.006, 0, -a, 0);
    }
    for (const s of [-1, 1]) {
      at(rbox(0.5, H - 0.06, d - 0.08, 0.03, mat('#20212b', { rough: 0.4 })), g, s * (w / 2 - 0.2), (H - 0.06) / 2, -0.12);
      at(rbox(0.012, H - 0.12, 0.012, 0.004, glow(th.accent || '#ff4f8b', 2.5)), g, s * (w / 2 - 0.2 - 0.25 * s * -1), (H - 0.06) / 2, d / 2 - 0.08);
    }
    at(rbox(w * 0.7, 0.008, d - 0.12, 0.003, mat('#2c2e40', { rough: 0.95 })), g, 0, H + 0.003, 0.0);
  }
  g.userData = { w, d, H };
  return g;
}

// ---------------------------------------------------------------- CHAIRS
export function buildChair(tier, th, accent) {
  const g = new THREE.Group();
  const seatH = 0.5;
  if (tier === 0) {
    const wm = mat(th.wood, { rough: 0.6 });
    at(rbox(0.44, 0.04, 0.42, 0.015, wm), g, 0, seatH - 0.02, 0);
    for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) at(cyl(0.018, 0.016, seatH - 0.04, wm, 8), g, x, (seatH - 0.04) / 2, z);
    for (const x of [-0.19, 0.19]) at(cyl(0.016, 0.016, 0.45, wm, 8), g, x, seatH + 0.22, 0.19);
    at(rbox(0.42, 0.12, 0.025, 0.01, wm), g, 0, seatH + 0.36, 0.19);
    at(rbox(0.42, 0.04, 0.02, 0.01, wm), g, 0, seatH + 0.18, 0.19);
    return g;
  }
  // swivel base
  const baseM = tier >= 3 ? metal('#2a2b33') : black();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = at(rbox(0.3, 0.03, 0.05, 0.015, baseM), g, Math.cos(a) * 0.14, 0.07, Math.sin(a) * 0.14, 0, -a, 0);
    at(sph(0.03, black(), 10, 8), g, Math.cos(a) * 0.28, 0.03, Math.sin(a) * 0.28);
  }
  at(cyl(0.025, 0.03, 0.32, metal(), 12), g, 0, 0.24, 0);
  const seatCol = tier === 1 ? '#2b2d3b' : tier === 4 ? '#1a1a22' : '#1e1f2a';
  const seatM = mat(seatCol, { rough: tier >= 3 ? 0.5 : 0.85, map: tier === 1 ? fabric('#ffffff') : null });
  const acc = mat(accent, { rough: 0.5 });
  if (tier === 1) {
    at(rbox(0.5, 0.08, 0.48, 0.035, seatM), g, 0, seatH, 0);
    at(rbox(0.04, 0.3, 0.04, 0.01, black()), g, 0, seatH + 0.15, 0.24);
    at(rbox(0.46, 0.5, 0.07, 0.04, seatM), g, 0, seatH + 0.42, 0.26, 0.08, 0, 0);
    for (const s of [-1, 1]) {
      at(rbox(0.03, 0.2, 0.03, 0.01, black()), g, s * 0.25, seatH + 0.1, 0.0);
      at(rbox(0.06, 0.025, 0.22, 0.01, black()), g, s * 0.25, seatH + 0.2, 0.0);
    }
  } else {
    // bucket gaming chair
    const backH = tier === 2 ? 0.75 : tier === 3 ? 0.88 : 0.98;
    at(rbox(0.54, 0.1, 0.5, 0.04, seatM), g, 0, seatH, 0);
    for (const s of [-1, 1]) at(rbox(0.08, 0.1, 0.48, 0.04, tier === 4 ? mat('#2a2a33', { rough: 0.45 }) : acc), g, s * 0.25, seatH + 0.06, 0, 0, 0, s * -0.2);
    const back = group(g, 0, seatH + 0.05, 0.25);
    back.rotation.x = 0.12;
    at(rbox(0.56, backH, 0.1, 0.05, seatM), back, 0, backH / 2, 0);
    for (const s of [-1, 1]) at(rbox(0.09, backH * 0.92, 0.12, 0.04, tier === 4 ? mat('#2a2a33', { rough: 0.45 }) : acc), back, s * 0.25, backH / 2, -0.01, 0, s * 0.15, 0);
    at(rbox(0.3, 0.14, 0.08, 0.05, tier === 4 ? acc : mat('#f4f4f6', { rough: 0.8 })), back, 0, backH - 0.15, -0.07);
    at(rbox(0.32, 0.18, 0.07, 0.06, mat('#2a2b38', { rough: 0.9 })), back, 0, 0.25, -0.07);
    // logo
    at(circle(0.04, glow(accent, tier >= 3 ? 2.5 : 1.2), 16), back, 0, backH * 0.62, 0.052);
    if (tier >= 4) {
      for (const s of [-1, 1]) at(rbox(0.012, backH * 0.9, 0.012, 0.004, glow(accent, 3)), back, s * 0.3, backH / 2, 0.0);
    }
    for (const s of [-1, 1]) {
      at(rbox(0.035, 0.22, 0.04, 0.01, black()), g, s * 0.3, seatH + 0.12, -0.02);
      at(rbox(0.08, 0.035, 0.26, 0.015, mat('#2a2b38', { rough: 0.7 })), g, s * 0.3, seatH + 0.24, -0.02);
    }
  }
  return g;
}

// ---------------------------------------------------------------- PC
export function buildPC(tier, accent, screens) {
  const g = new THREE.Group();
  g.userData.place = tier === 0 ? 'laptop' : 'tower';
  if (tier === 0) {
    const body = mat('#b9bcc7', { rough: 0.35, metal: 0.6 });
    at(rbox(0.36, 0.02, 0.25, 0.008, body), g, 0, 0.01, 0);
    at(rbox(0.3, 0.003, 0.12, 0.002, mat('#2b2c33', { rough: 0.8 })), g, 0, 0.021, -0.03);
    const lid = group(g, 0, 0.02, -0.12);
    lid.rotation.x = -0.25;
    at(rbox(0.36, 0.24, 0.012, 0.008, body), lid, 0, 0.12, 0);
    const s = screen(lid, 0.32, 0.2, 0, 0.125, 0.0065, 0, 'laptop');
    screens.push(s);
    g.userData.lid = lid;
    return g;
  }
  const accM = glow(accent, 2.6);
  const fan = (p, x, y, z, r = 0.05, ry = 0) => {
    const f = group(p, x, y, z, ry);
    at(torus(r, 0.006, accM, Math.PI * 2, 6, 24), f, 0, 0, 0);
    at(cyl(r * 0.9, r * 0.9, 0.006, mat('#20212a', { rough: 0.6, transparent: true, opacity: 0.85 }), 18), f, 0, 0, -0.004, Math.PI / 2, 0, 0);
    const hub = at(cyl(r * 0.3, r * 0.3, 0.01, mat('#2b2d38'), 12), f, 0, 0, 0, Math.PI / 2, 0, 0);
    f.userData.spin = true;
    return f;
  };
  if (tier === 1) {
    const cm = mat('#c9ccd4', { rough: 0.4, metal: 0.3 });
    at(rbox(0.2, 0.42, 0.42, 0.015, cm), g, 0, 0.21, 0);
    at(rbox(0.006, 0.3, 0.32, 0.004, mat('#9ea2ad')), g, 0.101, 0.23, 0);
    at(rbox(0.16, 0.01, 0.004, 0.002, glow('#59b7ff', 2)), g, 0, 0.38, 0.211);
    at(cyl(0.012, 0.012, 0.005, glow('#59b7ff', 3), 12), g, 0.06, 0.35, 0.212, Math.PI / 2, 0, 0);
  } else if (tier === 2 || tier === 3) {
    const big = tier === 3;
    const W = big ? 0.24 : 0.21, Hh = big ? 0.52 : 0.46, D = big ? 0.48 : 0.44;
    const cm = mat('#17181f', { rough: 0.35, metal: 0.3 });
    at(rbox(W, Hh, D, 0.02, cm), g, 0, Hh / 2, 0);
    // glass side panel (faces -x = toward character/camera when placed on the right)
    const glass = mat('#1a1d2e', { rough: 0.05, transparent: true, opacity: 0.12, env: 0.4 });
    at(box(0.004, Hh - 0.04, D - 0.04, glass), g, -W / 2 - 0.003, Hh / 2, 0);
    at(box(0.004, Hh - 0.1, D - 0.1, mat(accent, { emissive: accent, ei: 0.35, rough: 0.8 })), g, W / 2 - 0.04, Hh / 2, 0);
    // internals
    at(rbox(0.01, Hh - 0.08, D - 0.08, 0.005, mat('#22232c')), g, W / 2 - 0.03, Hh / 2, 0);
    at(rbox(0.04, 0.05, 0.25, 0.01, mat('#3b3d4d', { metal: 0.6, rough: 0.3 })), g, 0, Hh * 0.45, -0.02); // GPU
    at(rbox(0.005, 0.008, 0.24, 0.002, accM), g, -0.022, Hh * 0.45, -0.02);
    for (let i = 0; i < (big ? 3 : 2); i++) fan(g, -0.02, Hh * 0.25 + i * 0.14, D / 2 - 0.02, 0.05, 0).rotation.set(0, 0, 0);
    fan(g, -0.02, Hh - 0.05, 0, 0.05).rotation.set(Math.PI / 2, 0, 0);
    if (big) {
      // AIO cooler + RGB strips
      at(rbox(0.05, 0.05, 0.05, 0.01, mat('#22232c')), g, 0, Hh * 0.66, -0.06);
      at(cyl(0.022, 0.022, 0.01, accM, 16), g, -0.026, Hh * 0.66, -0.06, 0, 0, Math.PI / 2);
      at(tube([[0, Hh * 0.66, -0.03], [0, Hh * 0.8, 0.02], [0, Hh - 0.05, 0.05]], 0.008, black(), 'aio1'), g);
      at(rbox(0.006, Hh - 0.06, 0.006, 0.002, accM), g, -W / 2 + 0.01, Hh / 2, D / 2 - 0.01);
      at(rbox(0.006, 0.006, D - 0.06, 0.002, accM), g, -W / 2 + 0.01, 0.015, 0);
    }
    at(rbox(0.006, 0.006, D - 0.08, 0.002, accM), g, -W / 2 + 0.012, Hh - 0.015, 0);
  } else if (tier === 4) {
    const cm = mat('#eef0f4', { rough: 0.25, metal: 0.1 });
    at(rbox(0.25, 0.56, 0.5, 0.04, cm), g, 0, 0.28, 0);
    at(rbox(0.012, 0.42, 0.012, 0.004, accM), g, -0.126, 0.3, 0.2);
    at(rbox(0.004, 0.46, 0.42, 0.004, mat('#0f1018', { rough: 0.05, transparent: true, opacity: 0.55 })), g, -0.127, 0.3, -0.02);
    for (let i = 0; i < 3; i++) fan(g, -0.11, 0.15 + i * 0.13, -0.02, 0.055, Math.PI / 2);
  } else {
    // Prototype X: glass cube with glowing coolant loops
    const glass = mat('#c7e7ff', { rough: 0.02, transparent: true, opacity: 0.16 });
    at(rbox(0.34, 0.5, 0.5, 0.03, glass), g, 0, 0.25, 0);
    const frame = metal('#22232b');
    for (const [x, z] of [[-0.17, -0.25], [0.17, -0.25], [-0.17, 0.25], [0.17, 0.25]]) at(rbox(0.02, 0.5, 0.02, 0.005, frame), g, x, 0.25, z);
    at(rbox(0.32, 0.03, 0.48, 0.01, frame), g, 0, 0.015, 0);
    at(rbox(0.32, 0.03, 0.48, 0.01, frame), g, 0, 0.485, 0);
    const cool = glow(accent, 3);
    at(tube([[-0.1, 0.08, -0.15], [-0.1, 0.42, -0.15], [0.08, 0.42, 0.0], [0.08, 0.1, 0.15], [-0.1, 0.1, 0.15]], 0.012, cool, 'loop1', 40), g);
    at(tube([[0.1, 0.1, -0.18], [0.0, 0.3, -0.05], [0.1, 0.44, 0.1], [-0.05, 0.25, 0.2]], 0.01, glow('#2fd6ff', 3), 'loop2', 40), g);
    at(cyl(0.05, 0.05, 0.16, mat('#c7e7ff', { transparent: true, opacity: 0.35, rough: 0.05 }), 16), g, 0.06, 0.2, 0.12);
    at(cyl(0.045, 0.045, 0.14, glow(accent, 1.6), 16), g, 0.06, 0.2, 0.12);
    for (let i = 0; i < 3; i++) fan(g, 0, 0.12 + i * 0.13, -0.23, 0.05);
  }
  return g;
}

// ---------------------------------------------------------------- MONITORS
function monitorUnit(parent, w, h, x, y, z, ry, key, screens, opts = {}) {
  const g = group(parent, x, y, z, ry);
  const bez = opts.bezel ?? 0.015;
  const cm = opts.white ? mat('#e9ebf0', { rough: 0.35 }) : black();
  const curve = opts.curve;
  at(rbox(w + bez * 2, h + bez * 2, 0.025, 0.008, cm), g, 0, opts.lift + h / 2, 0);
  const s = screen(g, w, h, 0, opts.lift + h / 2, 0.0135, 0, key);
  screens.push(s);
  if (!opts.noStand) {
    at(rbox(0.05, opts.lift + 0.02, 0.03, 0.01, cm), g, 0, (opts.lift) / 2, -0.04);
    at(rbox(opts.baseW || 0.22, 0.012, 0.16, 0.006, cm), g, 0, 0.006, -0.03);
  }
  if (opts.glowBack) at(rbox(w * 0.8, h * 0.6, 0.004, 0.002, glow(opts.glowBack, 2.2)), g, 0, opts.lift + h / 2, -0.016);
  return g;
}
export function buildMonitors(tier, accent, screens) {
  const g = new THREE.Group();
  if (tier === 0) return g; // laptop only
  if (tier === 1) monitorUnit(g, 0.48, 0.27, 0, 0, 0, 0, 'main', screens, { lift: 0.12 });
  else if (tier === 2) monitorUnit(g, 0.6, 0.34, 0, 0, 0, 0, 'main', screens, { lift: 0.13, bezel: 0.008, glowBack: accent });
  else if (tier === 3) {
    monitorUnit(g, 0.58, 0.33, -0.31, 0, 0.02, 0.18, 'main', screens, { lift: 0.13, bezel: 0.008, glowBack: accent });
    monitorUnit(g, 0.58, 0.33, 0.31, 0, 0.02, -0.18, 'side', screens, { lift: 0.13, bezel: 0.008, glowBack: accent });
  } else if (tier === 4) {
    monitorUnit(g, 0.9, 0.36, -0.1, 0, 0, 0, 'main', screens, { lift: 0.15, bezel: 0.006, glowBack: accent, baseW: 0.32 });
    const side = monitorUnit(g, 0.3, 0.53, 0.62, 0, 0.06, -0.35, 'side', screens, { lift: 0.1, bezel: 0.006 });
  } else {
    monitorUnit(g, 0.62, 0.36, 0, 0, -0.02, 0, 'main', screens, { lift: 0.14, bezel: 0.005, glowBack: accent, baseW: 0.34 });
    monitorUnit(g, 0.62, 0.36, -0.64, 0, 0.1, 0.35, 'side', screens, { lift: 0.14, bezel: 0.005, glowBack: accent, noStand: true });
    monitorUnit(g, 0.62, 0.36, 0.64, 0, 0.1, -0.35, 'side2', screens, { lift: 0.14, bezel: 0.005, glowBack: accent, noStand: true });
    at(rbox(1.6, 0.03, 0.04, 0.01, metal('#2b2d38')), g, 0, 0.3, -0.06);
    at(rbox(0.05, 0.3, 0.05, 0.01, metal('#2b2d38')), g, 0, 0.15, -0.06);
  }
  return g;
}

// ---------------------------------------------------------------- KEYBOARD/MOUSE
export function buildKeys(tier, accent) {
  const g = new THREE.Group();
  const kbW = tier >= 3 ? 0.36 : 0.42;
  const base = tier === 0 ? mat('#e4e5ea', { rough: 0.6 }) : mat('#1b1c24', { rough: 0.4 });
  if (tier >= 2) at(rbox(0.9, 0.004, 0.36, 0.003, mat('#202230', { rough: 0.95 })), g, 0.1, 0.002, 0.0);
  if (tier >= 3) at(rbox(0.9, 0.002, 0.004, 0.001, glow(accent, 3)), g, 0.1, 0.004, 0.18);
  at(rbox(kbW, 0.022, 0.14, 0.008, base), g, 0, 0.012, 0);
  const rows = 5, cols = tier >= 3 ? 14 : 16;
  const kw = (kbW - 0.02) / cols;
  const keyGeo = new THREE.BoxGeometry(kw * 0.82, 0.008, 0.019);
  const inst = new THREE.InstancedMesh(keyGeo, tier >= 2 ? new THREE.MeshStandardMaterial({ roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.0 }) : mat(tier === 0 ? '#f6f6f8' : '#2a2b36', { rough: 0.5 }), rows * cols);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  let n = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    m4.makeTranslation(-kbW / 2 + 0.01 + kw * (c + 0.5), 0.027, -0.05 + r * 0.025);
    inst.setMatrixAt(n, m4);
    if (tier >= 2) { col.setHSL((c / cols + r * 0.04) % 1, 0.9, 0.55); inst.setColorAt(n, col); }
    n++;
  }
  if (tier >= 2) { inst.material.emissiveIntensity = 0; inst.material.emissive = new THREE.Color(0x000000); inst.material.color = new THREE.Color(0xffffff); inst.material.emissiveMap = null; inst.instanceColor.needsUpdate = true; inst.userData.rgbKeys = true; inst.material = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }); }
  g.add(inst);
  // mouse
  const mm = tier === 0 ? mat('#e4e5ea', { rough: 0.5 }) : mat('#1b1c24', { rough: 0.35 });
  const mouse = at(scl(sph(0.03, mm, 16, 12), 0.75, 0.45, 1.15), g, kbW / 2 + 0.16, 0.012, 0.02);
  if (tier >= 2) at(scl(sph(0.008, glow(accent, 3), 8, 6), 1, 1, 2), g, kbW / 2 + 0.16, 0.026, 0.04);
  g.userData.mouse = mouse;
  if (tier >= 3) { // controller on desk
    const cg = group(g, -kbW / 2 - 0.16, 0.02, -0.02, 0.4);
    at(scl(capsule(0.03, 0.08, mat('#f2f2f5', { rough: 0.4 }), 4, 10), 1, 1, 0.6), cg, 0, 0, 0, 0, 0, Math.PI / 2);
    at(sph(0.008, glow(accent, 2), 6, 4), cg, 0, 0.02, 0);
  }
  return g;
}

// ---------------------------------------------------------------- MIC
export function buildMic(tier, accent, golden) {
  const g = new THREE.Group();
  if (tier === 0) return g;
  const body = golden ? mat('#e8b94a', { rough: 0.25, metal: 0.9 }) : tier === 4 ? mat('#2a2b33', { rough: 0.35, metal: 0.5 }) : black();
  const grill = golden ? mat('#f6d47a', { rough: 0.3, metal: 0.9 }) : metal('#7a7f8c');
  if (tier === 1) {
    at(cyl(0.06, 0.07, 0.015, body, 20), g, 0, 0.008, 0);
    at(cyl(0.008, 0.008, 0.12, metal(), 8), g, 0, 0.07, 0);
    at(capsule(0.03, 0.08, body, 6, 14), g, 0, 0.18, 0, 0.15, 0, 0);
    at(scl(sph(0.031, grill, 16, 10), 1, 1.2, 1), g, 0, 0.23, 0.01);
    at(sph(0.006, glow('#59ff8f', 3), 6, 4), g, 0, 0.17, 0.03);
    g.userData.place = 'desk';
    return g;
  }
  // boom arm mics: origin is the desk clamp, mic head at end
  const arm = metal('#20212a');
  at(rbox(0.05, 0.06, 0.05, 0.01, arm), g, 0, 0.03, 0);
  at(cyl(0.012, 0.012, 0.35, arm, 8), g, 0, 0.22, 0);
  const a1 = tube([[0, 0.38, 0], [0.08, 0.5, 0.15], [0.18, 0.48, 0.32], [0.22, 0.4, 0.42]], 0.01, arm, 'boomarm' + tier, 24);
  g.add(a1);
  const head = group(g, 0.22, 0.34, 0.44);
  if (tier === 2) {
    at(capsule(0.032, 0.1, body, 6, 14), head, 0, 0, 0, 0.3, 0, 0);
    at(scl(sph(0.034, grill, 16, 10), 1, 1.3, 1), head, 0, 0.05, 0.015);
  } else if (tier === 3) {
    at(torus(0.06, 0.006, metal('#2a2b33'), Math.PI * 2, 6, 24), head, 0, 0, 0, 0.3, 0, 0);
    at(capsule(0.03, 0.11, body, 6, 14), head, 0, 0, 0, 0.3, 0, 0);
    at(scl(sph(0.033, grill, 16, 10), 1, 1.4, 1), head, 0, 0.06, 0.02);
    const pf = at(circle(0.07, mat('#111', { transparent: true, opacity: 0.55, side: THREE.DoubleSide }), 24), head, 0, 0.04, 0.11, -0.3, 0, 0);
    at(torus(0.07, 0.004, black(), Math.PI * 2, 6, 24), head, 0, 0.04, 0.11, -0.3, 0, 0);
  } else {
    at(cyl(0.04, 0.035, 0.2, body, 20), head, 0, 0, 0.02, 1.1, 0, 0);
    at(cyl(0.042, 0.042, 0.06, grill, 20), head, 0, 0.05, 0.1, 1.1, 0, 0);
    at(torus(0.045, 0.006, glow(accent, 3), Math.PI * 2, 6, 24), head, 0, 0.02, 0.06, 1.1 - Math.PI / 2, 0, 0);
  }
  g.userData.place = 'boom';
  return g;
}

// ---------------------------------------------------------------- CAMERA
export function buildCamera(tier, accent, retro) {
  const g = new THREE.Group();
  if (tier === 0) return g;
  const body = retro ? mat('#d9c8a6', { rough: 0.6 }) : black();
  const lens = mat('#0b0c12', { rough: 0.05, metal: 0.4 });
  const tally = umat('#300', { emissive: '#ff2244', ei: 0.0 });
  g.userData.tally = tally;
  if (tier <= 2) {
    const w = tier === 1 ? 0.09 : 0.12;
    at(rbox(w, 0.035, 0.035, 0.015, body), g, 0, 0.02, 0);
    at(cyl(0.013 + tier * 0.003, 0.013 + tier * 0.003, 0.01, lens, 16), g, 0, 0.02, 0.018, Math.PI / 2, 0, 0);
    at(sph(0.004, tally, 6, 4), g, w / 2 - 0.012, 0.03, 0.018);
    at(rbox(0.03, 0.015, 0.05, 0.005, body), g, 0, 0.0, -0.01);
    g.userData.place = 'monitorTop';
  } else {
    // tripod/arm camera
    const tri = metal('#2a2b33');
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      at(cyl(0.006, 0.006, 0.3, tri, 6), g, Math.cos(a) * 0.06, 0.13, Math.sin(a) * 0.06, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
    }
    const head = group(g, 0, 0.27, 0);
    if (tier === 3) {
      at(rbox(0.13, 0.09, 0.07, 0.02, body), head, 0, 0.045, 0);
      at(cyl(0.035, 0.035, 0.08, lens, 20), head, 0, 0.045, 0.07, Math.PI / 2, 0, 0);
      at(torus(0.035, 0.004, metal('#9aa'), Math.PI * 2, 6, 20), head, 0, 0.045, 0.11);
      at(rbox(0.05, 0.03, 0.02, 0.008, body), head, -0.03, 0.1, 0);
    } else {
      at(rbox(0.12, 0.13, 0.22, 0.02, body), head, 0, 0.065, 0);
      at(cyl(0.05, 0.05, 0.14, lens, 24), head, 0, 0.065, 0.17, Math.PI / 2, 0, 0);
      at(rbox(0.11, 0.08, 0.004, 0.004, mat('#000', { rough: 0.1 })), head, 0.0, 0.15, -0.05);
      at(rbox(0.16, 0.03, 0.3, 0.01, metal('#30323d')), head, 0, -0.01, 0.02);
      at(rbox(0.012, 0.012, 0.012, 0.004, glow(accent, 3)), head, 0.05, 0.14, 0.1);
    }
    at(sph(0.006, tally, 6, 4), head, 0.04, 0.1, 0.03);
    g.userData.place = 'tripod';
  }
  return g;
}

// ---------------------------------------------------------------- LIGHTING GEAR
export function buildLightGear(tier, accent) {
  const g = new THREE.Group();
  const parts = {};
  if (tier === 1 || tier === 2) {
    const lamp = group(g, 0, 0, 0);
    at(cyl(0.07, 0.08, 0.02, black(), 20), lamp, 0, 0.01, 0);
    at(cyl(0.008, 0.008, 0.32, metal('#2a2b33'), 8), lamp, 0, 0.17, 0, 0, 0, 0.25);
    at(cyl(0.008, 0.008, 0.26, metal('#2a2b33'), 8), lamp, -0.07, 0.42, 0.0, 0, 0, -0.9);
    const shadeG = group(lamp, 0.03, 0.47, 0);
    at(lathe([[0.02, 0.06], [0.07, -0.02], [0.075, -0.03], [0.001, 0.06]], mat(accent, { rough: 0.5 }), 20, 'lampshade'), shadeG, 0, 0, 0, 0, 0, -0.6);
    at(sph(0.025, glow('#fff1d0', 3), 10, 8), shadeG, 0.012, -0.015, 0);
    parts.lamp = lamp;
  }
  if (tier === 3) {
    const rl = group(g, 0, 0, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      at(cyl(0.008, 0.008, 0.5, black(), 6), rl, Math.cos(a) * 0.12, 0.22, Math.sin(a) * 0.12, Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
    }
    at(cyl(0.012, 0.012, 1.1, black(), 8), rl, 0, 0.9, 0);
    const ring = group(rl, 0, 1.55, 0);
    at(torus(0.2, 0.025, glow('#fff6ea', 1.5), Math.PI * 2, 10, 48), ring, 0, 0, 0);
    at(torus(0.2, 0.03, black(), Math.PI * 2, 8, 48), ring, 0, 0, -0.01);
    at(rbox(0.07, 0.13, 0.008, 0.01, black()), ring, 0, 0, 0.0);
    parts.ring = rl;
  }
  if (tier >= 4) {
    for (const s of [-1, 1]) {
      const sb = group(g, s * 1, 0, 0);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        at(cyl(0.008, 0.008, 0.6, metal('#2a2b33'), 6), sb, Math.cos(a) * 0.14, 0.26, Math.sin(a) * 0.14, Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      }
      at(cyl(0.014, 0.014, 1.3, metal('#2a2b33'), 8), sb, 0, 1.0, 0);
      const box_ = group(sb, 0, 1.7, 0);
      box_.rotation.x = 0.35;
      at(cone(0.32, 0.32, black(), 4), box_, 0, 0, -0.12, -Math.PI / 2, Math.PI / 4, 0);
      at(plane(0.42, 0.42, glow('#fff8ee', 1.3)), box_, 0, 0, 0.045);
      sb.userData.softbox = s;
    }
    parts.softbox = true;
  }
  if (tier >= 5) {
    // ceiling truss with RGB light bars
    const tr = group(g, 0, 2.35, 0.2);
    at(rbox(2.6, 0.06, 0.06, 0.01, metal('#30323d')), tr, 0, 0, 0);
    at(rbox(2.6, 0.06, 0.06, 0.01, metal('#30323d')), tr, 0, 0, 0.5);
    for (let i = 0; i < 4; i++) {
      const lb = group(tr, -0.9 + i * 0.6, -0.08, 0.25);
      at(rbox(0.08, 0.1, 0.12, 0.02, black()), lb, 0, 0, 0);
      at(cyl(0.045, 0.045, 0.01, glow(i % 2 ? accent : '#2fd6ff', 3), 16), lb, 0, -0.055, 0);
    }
    parts.truss = tr;
  }
  g.userData.parts = parts;
  return g;
}

// ---------------------------------------------------------------- ROUTER
export function buildRouter(tier, accent) {
  const g = new THREE.Group();
  const leds = [];
  if (tier === 0) {
    at(rbox(0.16, 0.035, 0.11, 0.012, mat('#f2f2f4', { rough: 0.4 })), g, 0, 0.018, 0);
    for (let i = 0; i < 3; i++) leds.push(at(sph(0.004, glow('#59ff8f', 3), 6, 4), g, -0.03 + i * 0.02, 0.026, 0.056));
  } else if (tier === 1) {
    at(rbox(0.2, 0.04, 0.13, 0.012, black()), g, 0, 0.02, 0);
    for (const s of [-1, 1]) at(cyl(0.006, 0.006, 0.16, black(), 6), g, s * 0.08, 0.11, -0.05, 0, 0, s * 0.2);
    for (let i = 0; i < 4; i++) leds.push(at(sph(0.004, glow('#59b7ff', 3), 6, 4), g, -0.05 + i * 0.03, 0.03, 0.066));
  } else if (tier === 2) {
    at(rbox(0.08, 0.22, 0.08, 0.03, mat('#f4f4f6', { rough: 0.3 })), g, 0, 0.11, 0);
    at(rbox(0.082, 0.01, 0.082, 0.004, glow('#2fd6ff', 3)), g, 0, 0.2, 0);
  } else {
    for (let i = 0; i < 2; i++) {
      const u = group(g, -0.06 + i * 0.12, 0, 0);
      at(cyl(0.045, 0.05, 0.2, mat('#1b1c24', { rough: 0.3 }), 20), u, 0, 0.1, 0);
      at(torus(0.045, 0.004, glow(accent, 3), Math.PI * 2, 6, 24), u, 0, 0.17, 0, Math.PI / 2, 0, 0);
    }
  }
  g.userData.leds = leds;
  return g;
}

// ---------------------------------------------------------------- HOME FURNITURE
export function buildBed(tier, th, accent) {
  const g = new THREE.Group();
  const wide = tier >= 1;
  const W = wide ? 1.55 : 1.0, L = 2.05;
  const frameM = mat(tier === 3 ? '#2a2b33' : th.wood, { rough: 0.55 });
  const sheet = mat(th.fabric, { rough: 0.95, map: fabric('#ffffff') });
  const sheet2 = mat(th.fabric2, { rough: 0.95, map: fabric('#ffffff') });
  at(rbox(W + 0.08, 0.26, L + 0.06, 0.03, frameM), g, 0, 0.13, 0);
  at(rbox(W, 0.2, L - 0.04, 0.07, mat('#f7f5f2', { rough: 0.9 })), g, 0, 0.35, 0.0);
  // duvet with slight drape
  at(rbox(W + 0.04, 0.12, L * 0.68, 0.06, sheet), g, 0, 0.42, L * 0.15);
  at(rbox(W + 0.06, 0.06, 0.35, 0.03, sheet2), g, 0, 0.47, -L * 0.17);
  // pillows
  const pc = wide ? [-W / 4, W / 4] : [0];
  for (const x of pc) at(scl(rbox(wide ? 0.6 : 0.7, 0.14, 0.36, 0.07, sheet2), 1, 1, 1), g, x, 0.52, -L / 2 + 0.26, 0.25, 0, 0);
  if (tier >= 1) at(scl(rbox(0.36, 0.3, 0.12, 0.06, mat(accent, { rough: 0.9 })), 1, 1, 1), g, W / 4 - 0.05, 0.6, -L / 2 + 0.42, -0.25, 0.2, 0);
  // headboard
  const hbH = tier >= 2 ? 1.1 : 0.85;
  if (tier >= 2) {
    at(rbox(W + 0.3, hbH, 0.12, 0.05, mat(th.fabric, { rough: 0.9, map: fabric('#ffffff') })), g, 0, hbH / 2 + 0.05, -L / 2 - 0.02);
    for (let i = 0; i < 4; i++) at(rbox((W + 0.2) / 4 - 0.03, hbH - 0.18, 0.04, 0.03, mat(th.fabric, { rough: 0.95 })), g, -W / 2 - 0.1 + ((W + 0.2) / 4) * (i + 0.5), hbH / 2 + 0.05, -L / 2 + 0.05);
  } else {
    at(rbox(W + 0.08, hbH, 0.06, 0.03, frameM), g, 0, hbH / 2, -L / 2 - 0.0);
  }
  if (tier === 3) at(rbox(W + 0.3, 0.01, 0.01, 0.003, glow(accent, 2.5)), g, 0, 0.02, L / 2 + 0.05);
  g.userData = { W, L };
  return g;
}

export function buildNightstand(th) {
  const g = new THREE.Group();
  const wm = mat(th.wood, { rough: 0.55 });
  at(rbox(0.42, 0.48, 0.38, 0.02, wm), g, 0, 0.24, 0);
  at(rbox(0.36, 0.16, 0.01, 0.005, mat(shade(th.wood, 1.1))), g, 0, 0.32, 0.19);
  at(sph(0.012, metal(), 8, 6), g, 0, 0.32, 0.2);
  // lamp
  const lamp = group(g, 0.06, 0.48, -0.02);
  at(lathe([[0.001, 0], [0.06, 0], [0.065, 0.02], [0.04, 0.1], [0.03, 0.18], [0.001, 0.19]], mat('#e9e2d6', { rough: 0.3 }), 20, 'lampbase'), lamp, 0, 0, 0);
  const sh = at(lathe([[0.07, 0.17], [0.12, 0.33], [0.119, 0.335], [0.069, 0.175]], umat('#fff1dc', { rough: 0.9, emissive: '#ffcf8a', ei: 0.0, side: THREE.DoubleSide }), 24, 'lampshade2'), lamp, 0, 0, 0);
  g.userData.shade = sh;
  // book + phone charger
  at(rbox(0.16, 0.03, 0.22, 0.004, mat('#5b7bd6')), g, -0.1, 0.495, 0.03, 0, 0.2, 0);
  return g;
}

export function buildFridge(tier, th) {
  const g = new THREE.Group();
  const big = tier >= 1;
  const W = tier === 0 ? 0.52 : tier === 1 ? 0.7 : tier === 2 ? 0.82 : 0.95;
  const H = tier === 0 ? 0.86 : 1.85, D = 0.66;
  const body = tier >= 2 ? mat('#c9cdd6', { rough: 0.25, metal: 0.75 }) : mat(tier === 0 ? '#eef0f3' : '#f4f5f7', { rough: 0.35 });
  at(rbox(W, H, D - 0.04, 0.03, body), g, 0, H / 2, -0.02);
  // interior
  const inner = mat('#f6f9ff', { rough: 0.5, emissive: '#dfeaff', ei: 0.0 });
  at(box(W - 0.06, H - 0.08, 0.02, inner), g, 0, H / 2, -D / 2 + 0.05);
  const light = umat('#fff', { emissive: '#eaf4ff', ei: 0 });
  at(box(W - 0.08, 0.02, 0.4, light), g, 0, H - 0.07, -0.05);
  // shelves with food
  const shelfCount = tier === 0 ? 2 : 4;
  const colors = ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#c6ff00', '#ff9f43'];
  for (let i = 0; i < shelfCount; i++) {
    const y = 0.12 + i * (H - 0.2) / shelfCount;
    at(box(W - 0.08, 0.01, D - 0.15, mat('#dfe9f5', { transparent: true, opacity: 0.6, rough: 0.1 })), g, 0, y, -0.04);
    for (let k = 0; k < 3; k++) {
      const c = colors[(i * 3 + k) % colors.length];
      if ((i + k) % 2) at(cyl(0.03, 0.03, 0.12, mat(c, { rough: 0.4 }), 12), g, -W / 2 + 0.12 + k * (W - 0.2) / 2.5, y + 0.065, -0.1);
      else at(rbox(0.1, 0.08, 0.08, 0.01, mat(c, { rough: 0.6 })), g, -W / 2 + 0.12 + k * (W - 0.2) / 2.5, y + 0.045, -0.12);
    }
  }
  // door pivot on left edge
  const door = group(g, -W / 2, 0, D / 2 - 0.04);
  at(rbox(W, H - 0.01, 0.05, 0.03, body), door, W / 2, H / 2, 0.02);
  at(rbox(0.025, tier === 0 ? 0.25 : 0.6, 0.03, 0.01, tier >= 2 ? mat('#2a2b33', { metal: 0.5, rough: 0.3 }) : metal()), door, W - 0.06, H * (tier === 0 ? 0.7 : 0.55), 0.06);
  if (tier >= 1) at(rbox(W - 0.04, 0.008, 0.052, 0.003, mat('#9aa0ab')), door, W / 2, H * 0.62, 0.02);
  if (tier >= 2) at(rbox(0.2, 0.28, 0.01, 0.01, mat('#0d0e14', { rough: 0.1 })), door, W / 2, H * 0.75, 0.047);
  // magnets / stickers on door
  at(circle(0.03, mat('#ff4f8b'), 16), door, W / 2 - 0.1, H * 0.8, 0.046);
  at(rbox(0.07, 0.09, 0.004, 0.004, mat('#fff7d1')), door, W / 2 + 0.08, H * 0.82, 0.046, 0, 0, 0.1);
  g.userData = { door, light, inner, W, H };
  return g;
}

export function buildCounter(tier, th, len) {
  const g = new THREE.Group();
  const cab = mat(tier >= 3 ? '#1f2a2a' : tier === 2 ? '#2b2d3a' : th.trim === '#ffffff' ? '#eef0f2' : '#f2ede6', { rough: 0.5 });
  const top = tier >= 3 ? mat('#f0ece4', { rough: 0.2, map: marble('#f2efe9') }) : tier === 2 ? mat('#1b1c24', { rough: 0.25 }) : mat(th.wood, { rough: 0.45 });
  const H = 0.9, D = 0.6;
  at(rbox(len, H - 0.04, D - 0.04, 0.02, cab), g, 0, (H - 0.04) / 2, 0);
  at(rbox(len + 0.04, 0.04, D, 0.01, top), g, 0, H - 0.02, 0);
  const n = Math.max(1, Math.round(len / 0.5));
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (len / n) * (i + 0.5);
    at(rbox(len / n - 0.03, H - 0.16, 0.01, 0.01, mat(shade(cab.color.getHexString ? '#' + cab.color.getHexString() : '#eee', 1.04), { rough: 0.45 })), g, x, (H - 0.04) / 2, D / 2 - 0.015);
    at(rbox(0.12, 0.012, 0.02, 0.005, metal('#c9ccd4')), g, x, H - 0.14, D / 2);
  }
  // upper cabinets for bigger kitchens
  if (tier >= 1) {
    at(rbox(len, 0.6, 0.34, 0.02, cab), g, 0, 1.75, -D / 2 + 0.17);
    if (tier >= 2) at(rbox(len - 0.1, 0.012, 0.02, 0.004, glow('#fff1d6', 2)), g, 0, 1.44, -D / 2 + 0.3);
  }
  g.userData = { H, D, len };
  return g;
}

export function buildMicrowave() {
  const g = new THREE.Group();
  at(rbox(0.46, 0.27, 0.34, 0.02, mat('#2a2b33', { rough: 0.4 })), g, 0, 0.135, 0);
  at(rbox(0.3, 0.2, 0.005, 0.01, mat('#0d0e14', { rough: 0.1 })), g, -0.05, 0.135, 0.171);
  const disp = umat('#000', { emissive: '#59ff8f', ei: 1.5 });
  at(rbox(0.07, 0.025, 0.004, 0.003, disp), g, 0.16, 0.2, 0.171);
  const inner = umat('#000', { emissive: '#ffcf6b', ei: 0 });
  at(box(0.28, 0.18, 0.004, inner), g, -0.05, 0.135, 0.168);
  g.userData = { inner };
  return g;
}
export function buildStove() {
  const g = new THREE.Group();
  at(rbox(0.6, 0.02, 0.5, 0.01, mat('#0d0e14', { rough: 0.1 })), g, 0, 0.01, 0);
  const rings = [];
  for (const [x, z] of [[-0.14, -0.1], [0.14, -0.1], [-0.14, 0.12], [0.14, 0.12]]) {
    const m = umat('#1a1a1a', { emissive: '#ff4422', ei: 0 });
    rings.push(at(torus(0.07, 0.008, m, Math.PI * 2, 6, 24), g, x, 0.022, z, Math.PI / 2, 0, 0));
  }
  // pot
  const pot = group(g, -0.14, 0.02, 0.12);
  at(cyl(0.1, 0.09, 0.12, metal('#c8ccd6'), 24, false), pot, 0, 0.06, 0);
  at(cyl(0.095, 0.095, 0.005, mat('#f5c46b', { rough: 0.7 }), 20), pot, 0, 0.1, 0);
  at(rbox(0.12, 0.015, 0.02, 0.006, black()), pot, 0.15, 0.1, 0);
  g.userData = { rings, pot };
  return g;
}
export function buildKettle() {
  const g = new THREE.Group();
  at(lathe([[0.001, 0], [0.07, 0], [0.075, 0.03], [0.07, 0.16], [0.05, 0.19], [0.001, 0.2]], mat('#f2f2f4', { rough: 0.3 }), 20, 'kettle'), g, 0, 0.02, 0);
  at(cyl(0.085, 0.085, 0.02, black(), 20), g, 0, 0.01, 0);
  at(torus(0.05, 0.012, black(), Math.PI, 6, 12), g, -0.07, 0.13, 0, 0, 0, Math.PI / 2);
  return g;
}

export function buildMirror(th) {
  const g = new THREE.Group();
  const fr = mat(th.metal === '#c9a45c' ? '#c9a45c' : th.wood, { rough: 0.4, metal: th.metal === '#c9a45c' ? 0.8 : 0 });
  at(rbox(0.6, 1.6, 0.05, 0.25, fr), g, 0, 0.85, 0);
  const streak = canvasTex(128, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#5d6f8c'); g.addColorStop(0.5, '#9fb2cf'); g.addColorStop(1, '#4a5873');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(60, 0); ctx.lineTo(0, 120); ctx.lineTo(0, 40); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(95, 0); ctx.lineTo(10, 170); ctx.lineTo(0, 170); ctx.fill();
  });
  const glass = new THREE.MeshStandardMaterial({ color: '#ffffff', map: streak, roughness: 0.08, metalness: 0.6, envMapIntensity: 1.2, emissive: '#3a4660', emissiveIntensity: 0.25 });
  at(rbox(0.52, 1.5, 0.01, 0.22, glass), g, 0, 0.85, 0.022);
  at(rbox(0.5, 0.04, 0.3, 0.02, fr), g, 0, 0.02, 0.08);
  // clothes rack hook with hoodie
  return g;
}

export function buildDoor(th, w = 0.92, h = 2.1) {
  const g = new THREE.Group();
  const fr = mat(th.trim, { rough: 0.5 });
  at(rbox(w + 0.12, 0.08, 0.1, 0.01, fr), g, 0, h + 0.04, 0.0);
  for (const s of [-1, 1]) at(rbox(0.06, h, 0.1, 0.01, fr), g, s * (w / 2 + 0.03), h / 2, 0.0);
  const pivot = group(g, -w / 2, 0, 0);
  const dm = mat(th.wood, { rough: 0.5 });
  at(rbox(w, h - 0.01, 0.05, 0.01, dm), pivot, w / 2, h / 2, 0);
  for (const y of [0.55, 1.45]) at(rbox(w - 0.2, 0.6, 0.01, 0.01, mat(shade(th.wood, 0.92))), pivot, w / 2, y, 0.027);
  at(sph(0.03, metal('#d6c28a'), 10, 8), pivot, w - 0.1, 1.02, 0.05);
  g.userData = { pivot };
  return g;
}

export function buildWindow(w, h, th, style = 'classic') {
  const g = new THREE.Group();
  const fr = mat(style === 'industrial' ? '#1d1e24' : th.trim, { rough: 0.45, metal: style === 'industrial' ? 0.5 : 0 });
  const t = style === 'industrial' ? 0.04 : 0.06;
  at(rbox(w + t * 2, t, 0.14, 0.01, fr), g, 0, h + t / 2, 0);
  at(rbox(w + t * 2 + 0.1, t, 0.22, 0.01, fr), g, 0, -t / 2, 0.04);
  for (const s of [-1, 1]) at(rbox(t, h, 0.14, 0.01, fr), g, s * (w / 2 + t / 2), h / 2, 0);
  const mul = style === 'industrial' ? Math.max(2, Math.round(w / 0.6)) : 2;
  for (let i = 1; i < mul; i++) at(rbox(0.025, h, 0.05, 0.005, fr), g, -w / 2 + (w / mul) * i, h / 2, 0.02);
  const rowsM = style === 'industrial' ? 3 : 2;
  for (let i = 1; i < rowsM; i++) at(rbox(w, 0.025, 0.05, 0.005, fr), g, 0, (h / rowsM) * i, 0.02);
  const glass = mat('#aaccff', { transparent: true, opacity: 0.08, rough: 0.05, metal: 0.2 });
  at(plane(w, h, glass), g, 0, h / 2, 0.0).userData.noShadow = true;
  return g;
}
export function buildCurtains(w, h, th) {
  const g = new THREE.Group();
  const cm = mat(th.fabric2, { rough: 0.95, map: fabric('#ffffff'), side: THREE.DoubleSide });
  at(cyl(0.012, 0.012, w + 0.7, metal('#2a2b33'), 8), g, 0, h + 0.18, 0.06, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) {
    const cg = group(g, s * (w / 2 + 0.18), h / 2 + 0.05, 0.07);
    for (let i = 0; i < 4; i++) at(scl(cyl(0.05, 0.06, h + 0.3, cm, 10, true), 1, 1, 0.55), cg, (i - 1.5) * 0.08, 0, 0);
  }
  return g;
}

export function buildSofa(th, accent) {
  const g = new THREE.Group();
  const f = mat(th.fabric, { rough: 0.95, map: fabric('#ffffff') });
  at(rbox(2.0, 0.42, 0.9, 0.08, f), g, 0, 0.25, 0);
  at(rbox(2.0, 0.55, 0.22, 0.09, f), g, 0, 0.55, -0.36);
  for (const s of [-1, 1]) at(rbox(0.22, 0.6, 0.9, 0.09, f), g, s * 0.94, 0.33, 0);
  for (const x of [-0.45, 0.45]) at(rbox(0.86, 0.14, 0.62, 0.06, mat(th.fabric2, { rough: 0.95, map: fabric('#ffffff') })), g, x, 0.5, 0.06);
  at(rbox(0.4, 0.34, 0.12, 0.08, mat(accent, { rough: 0.9 })), g, -0.6, 0.66, -0.2, -0.2, 0.3, 0);
  for (const [x, z] of [[-0.9, -0.38], [0.9, -0.38], [-0.9, 0.38], [0.9, 0.38]]) at(cyl(0.025, 0.02, 0.06, black(), 8), g, x, 0.03, z);
  return g;
}
export function buildCoffeeTable(th) {
  const g = new THREE.Group();
  at(rbox(1.0, 0.05, 0.55, 0.02, mat(th.wood, { rough: 0.4 })), g, 0, 0.4, 0);
  for (const [x, z] of [[-0.43, -0.22], [0.43, -0.22], [-0.43, 0.22], [0.43, 0.22]]) at(cyl(0.02, 0.02, 0.38, black(), 8), g, x, 0.19, z);
  at(rbox(0.25, 0.03, 0.18, 0.005, mat('#ff4f8b')), g, 0.2, 0.44, 0.05, 0, 0.3, 0);
  at(cyl(0.04, 0.035, 0.09, mat('#f4f1ea', { rough: 0.4 }), 14), g, -0.25, 0.47, 0);
  return g;
}
export function buildTV(screens) {
  const g = new THREE.Group();
  at(rbox(1.6, 0.4, 0.42, 0.03, mat('#1b1c24', { rough: 0.4 })), g, 0, 0.2, 0);
  at(rbox(1.46, 0.84, 0.04, 0.01, black()), g, 0, 1.0, -0.12);
  const s = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const p = at(plane(1.42, 0.8, s), g, 0, 1.0, -0.098);
  p.userData.screenKey = 'tv'; p.userData.ownMat = true; p.userData.noShadow = true;
  screens.push(p);
  return g;
}

export function buildShelf(th, w = 0.9) {
  const g = new THREE.Group();
  at(rbox(w, 0.035, 0.24, 0.008, mat(th.wood, { rough: 0.5 })), g, 0, 0, 0.12);
  for (const s of [-1, 1]) at(rbox(0.02, 0.1, 0.18, 0.004, black()), g, s * (w / 2 - 0.1), -0.06, 0.09);
  return g;
}

// Wall plaque (subscriber milestone award)
export function buildPlaque(color, label) {
  const g = new THREE.Group();
  at(rbox(0.36, 0.46, 0.04, 0.02, mat('#16161d', { rough: 0.3 })), g, 0, 0, 0.02);
  const disc = mat(color, { rough: 0.15, metal: 0.95 });
  at(cyl(0.12, 0.12, 0.012, disc, 36), g, 0, 0.04, 0.046, Math.PI / 2, 0, 0);
  const tri = new THREE.Shape(); tri.moveTo(-0.03, 0.04); tri.lineTo(0.05, 0); tri.lineTo(-0.03, -0.04); tri.closePath();
  const tm = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.006, bevelEnabled: false }), mat('#ffffff', { rough: 0.2 }));
  at(tm, g, 0.0, 0.04, 0.052);
  at(rbox(0.22, 0.03, 0.006, 0.003, disc), g, 0, -0.16, 0.042);
  return g;
}

// Rounded decor helpers -------------------------------------------------------
function posterTex(kind, accent) {
  return canvasTex(256, 360, (ctx, w, h) => {
    if (kind === 'pixel') {
      const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2b1b5a'); gr.addColorStop(1, '#ff4f8b');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffe066';
      const px = [[3, 0], [4, 0], [2, 1], [3, 1], [4, 1], [5, 1], [2, 2], [5, 2], [3, 3], [4, 3], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [3, 5], [4, 5], [2, 6], [5, 6]];
      for (const [x, y] of px) ctx.fillRect(56 + x * 20, 90 + y * 20, 19, 19);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PLAYER 1', w / 2, 320);
    } else if (kind === 'game') {
      const gr = ctx.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0e1b3d'); gr.addColorStop(1, '#1fd2ff');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, Math.random() * h * 0.6, 2, 2);
      ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.arc(w / 2, 150, 60, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0e1b3d'; ctx.beginPath(); ctx.moveTo(0, 260); ctx.lineTo(80, 190); ctx.lineTo(140, 240); ctx.lineTo(200, 170); ctx.lineTo(w, 250); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('STARFALL', w / 2, 330);
    } else if (kind === 'canvas') {
      ctx.fillStyle = '#f4efe6'; ctx.fillRect(0, 0, w, h);
      const cs = ['#ff4f8b', '#2fd6ff', '#ffb547', '#1d1b2c', accent];
      for (let i = 0; i < 9; i++) { ctx.fillStyle = cs[i % cs.length]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 20 + Math.random() * 70, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  });
}
function neonTex(text, color) {
  return canvasTex(512, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = '700 86px "Caveat", "Bricolage", cursive';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = color; ctx.shadowBlur = 24; ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2 + 4);
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.85;
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

// Decor builder. Wall items face +z. Returns group.
export function buildDecor(id, th, accent, profile) {
  const g = new THREE.Group();
  g.userData.decorId = id;
  switch (id) {
    case 'poster_pixel': case 'poster_game': case 'art_canvas': {
      const kind = id === 'poster_pixel' ? 'pixel' : id === 'poster_game' ? 'game' : 'canvas';
      const big = id === 'art_canvas';
      const W = big ? 0.9 : 0.5, H = big ? 0.7 : 0.7;
      at(rbox(W + 0.04, H + 0.04, 0.03, 0.006, black()), g, 0, 0, 0.015);
      const m = new THREE.MeshStandardMaterial({ map: posterTex(kind, accent), roughness: 0.6 });
      at(plane(W, H, m), g, 0, 0, 0.032);
      break;
    }
    case 'string_lights': {
      const pts = [];
      for (let i = 0; i <= 10; i++) pts.push([-0.8 + i * 0.16, -Math.sin((i / 10) * Math.PI) * 0.12, 0.02]);
      g.add(tube(pts, 0.004, black(), 'stringl'));
      for (let i = 0; i <= 10; i++) at(sph(0.022, glow(['#ffcf6b', '#ff9fc6', '#9dff5a', '#7ad7ff'][i % 4], 2.6), 8, 6), g, pts[i][0], pts[i][1] - 0.025, 0.03);
      break;
    }
    case 'hex_lights': {
      const hx = new THREE.CylinderGeometry(0.11, 0.11, 0.02, 6);
      const pos = [[0, 0], [0.19, 0.11], [0.19, -0.11], [0.38, 0], [-0.19, 0.11], [0.38, 0.22]];
      pos.forEach(([x, y], i) => {
        const c = new THREE.Color().setHSL(((i * 0.13) + 0.8) % 1, 0.9, 0.6);
        const m = new THREE.Mesh(hx, glow('#' + c.getHexString(), 2.2));
        at(m, g, x - 0.1, y, 0.015, Math.PI / 2, 0, 0);
      });
      g.userData.rgb = true;
      break;
    }
    case 'foam': {
      const fm = mat(accent, { rough: 1 });
      const fm2 = mat('#1d1e26', { rough: 1 });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        const p = group(g, -0.35 + i * 0.35, -0.17 + j * 0.34, 0);
        at(rbox(0.33, 0.33, 0.04, 0.01, (i + j) % 2 ? fm : fm2), p, 0, 0, 0.02);
        for (let k = 0; k < 4; k++) at(rbox(0.07, 0.3, 0.04, 0.02, (i + j) % 2 ? fm : fm2), p, -0.12 + k * 0.08, 0, 0.05);
      }
      break;
    }
    case 'neon_name': case 'neon_cat': case 'onair_sign': {
      const txt = id === 'neon_name' ? (profile?.name || 'LIVE') : id === 'neon_cat' ? 'meow' : 'ON AIR';
      const col = id === 'onair_sign' ? '#ff3b4f' : accent;
      at(rbox(1.05, 0.36, 0.02, 0.04, mat('#0d0e14', { transparent: true, opacity: 0.35, rough: 0.1 })), g, 0, 0, 0.01);
      const m = new THREE.MeshBasicMaterial({ map: neonTex(txt, col), transparent: true, toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6) });
      at(plane(1.0, 0.31, m), g, 0, 0, 0.025);
      if (id === 'neon_cat') {
        const ring = glow('#ff9fc6', 2.4);
        at(torus(0.12, 0.008, ring, Math.PI * 2, 6, 30), g, -0.65, 0.0, 0.03);
        for (const s of [-1, 1]) at(cone(0.04, 0.07, ring, 3), g, -0.65 + s * 0.06, 0.13, 0.03, 0, 0, s * -0.3);
      }
      g.userData.neon = m;
      break;
    }
    case 'guitar': {
      const body = mat('#d1492e', { rough: 0.3 });
      at(scl(cyl(0.16, 0.16, 0.06, body, 28), 1, 1, 1.25), g, 0, -0.2, 0.05, Math.PI / 2, 0, 0);
      at(scl(cyl(0.12, 0.12, 0.06, body, 28), 1, 1, 1.15), g, 0, 0.0, 0.05, Math.PI / 2, 0, 0);
      at(cyl(0.04, 0.04, 0.065, black(), 16), g, 0, -0.12, 0.05, Math.PI / 2, 0, 0);
      at(rbox(0.05, 0.6, 0.025, 0.008, mat('#5a3a22')), g, 0, 0.35, 0.06);
      at(rbox(0.07, 0.12, 0.03, 0.01, mat('#2a2b33')), g, 0, 0.7, 0.06);
      break;
    }
    case 'gold_records': {
      for (let i = 0; i < 3; i++) {
        const p = buildPlaque(i === 1 ? '#e7e9ef' : '#ffcf4a');
        at(p, g, -0.42 + i * 0.42, 0, 0);
      }
      break;
    }
    // ---- shelf / small items (sit on y=0)
    case 'plant_small': {
      at(cyl(0.06, 0.05, 0.08, mat('#f4efe6', { rough: 0.6 }), 16), g, 0, 0.04, 0);
      const lm = mat('#5fb36b', { rough: 0.7 });
      for (let i = 0; i < 6; i++) { const a = i * 1.05; at(scl(sph(0.03, lm, 8, 6), 0.6, 1.4, 0.6), g, Math.cos(a) * 0.025, 0.1, Math.sin(a) * 0.025, Math.sin(a) * 0.4, 0, Math.cos(a) * 0.4); }
      break;
    }
    case 'figures': {
      const cols = ['#ff4f8b', '#2fd6ff', '#ffb547'];
      cols.forEach((c, i) => {
        const f = group(g, -0.14 + i * 0.14, 0, 0);
        at(rbox(0.07, 0.015, 0.07, 0.005, black()), f, 0, 0.008, 0);
        at(capsule(0.025, 0.05, mat(c, { rough: 0.4 })), f, 0, 0.06, 0);
        at(sph(0.03, mat('#f2c7a5', { rough: 0.5 }), 12, 10), f, 0, 0.125, 0);
        at(sphPart(0.032, mat(c === '#ffb547' ? '#2b1d16' : '#f2f0ee', { rough: 0.5 }), 0, Math.PI * 2, 0, Math.PI * 0.45), f, 0, 0.13, 0);
      });
      break;
    }
    case 'holo_plant': {
      at(cyl(0.055, 0.045, 0.07, black(), 16), g, 0, 0.035, 0);
      at(torus(0.05, 0.004, glow('#2fd6ff', 3), Math.PI * 2, 6, 20), g, 0, 0.07, 0, Math.PI / 2, 0, 0);
      const hm = mat('#2fd6ff', { emissive: '#2fd6ff', ei: 1.4, transparent: true, opacity: 0.55 });
      for (let i = 0; i < 5; i++) { const a = i * 1.25; at(scl(sph(0.035, hm, 8, 6), 0.5, 1.6, 0.5), g, Math.cos(a) * 0.03, 0.14, Math.sin(a) * 0.03, Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5); }
      g.userData.spinY = true;
      break;
    }
    case 'lava_lamp': {
      at(cone(0.05, 0.08, mat('#c9ccd4', { metal: 0.8, rough: 0.3 }), 16), g, 0, 0.04, 0);
      at(cyl(0.035, 0.05, 0.18, mat(accent, { transparent: true, opacity: 0.5, emissive: accent, ei: 0.8 }), 16), g, 0, 0.17, 0);
      const blob = at(sph(0.022, glow('#ffcf6b', 2.6), 10, 8), g, 0, 0.15, 0);
      g.userData.lava = blob;
      at(cone(0.035, 0.05, mat('#c9ccd4', { metal: 0.8, rough: 0.3 }), 16), g, 0, 0.285, 0, Math.PI, 0, 0);
      break;
    }
    case 'pumpkin_lamp': {
      const pm = mat('#ff7b1c', { rough: 0.6, emissive: '#ff6a00', ei: 0.5 });
      for (let i = 0; i < 6; i++) at(scl(sph(0.06, pm, 12, 10), 0.6, 0.85, 1), g, Math.cos(i * 1.05) * 0.03, 0.07, Math.sin(i * 1.05) * 0.03, 0, i * 1.05, 0);
      at(cyl(0.01, 0.012, 0.04, mat('#3a6b2a'), 6), g, 0, 0.14, 0);
      for (const s of [-1, 1]) at(cone(0.012, 0.02, glow('#ffe066', 3), 3), g, s * 0.025, 0.09, 0.062, Math.PI / 2, 0, 0);
      at(scl(sph(0.02, glow('#ffe066', 3), 8, 6), 1.5, 0.5, 0.4), g, 0, 0.045, 0.062);
      break;
    }
    case 'trophy_case': {
      const gm = mat('#ffcf4a', { metal: 0.95, rough: 0.2 });
      at(rbox(0.12, 0.04, 0.12, 0.01, black()), g, 0, 0.02, 0);
      at(cyl(0.015, 0.02, 0.08, gm, 12), g, 0, 0.08, 0);
      at(lathe([[0.001, 0], [0.03, 0.0], [0.06, 0.06], [0.065, 0.11], [0.06, 0.11], [0.001, 0.02]], gm, 20, 'cup'), g, 0, 0.12, 0);
      for (const s of [-1, 1]) at(torus(0.025, 0.006, gm, Math.PI, 6, 12), g, s * 0.065, 0.2, 0, 0, 0, s * -Math.PI / 2);
      break;
    }
    case 'gold_plant': {
      at(cyl(0.07, 0.06, 0.06, black(), 16), g, 0, 0.03, 0);
      const gm = mat('#ffcf4a', { metal: 0.9, rough: 0.25 });
      at(cyl(0.01, 0.014, 0.18, mat('#5a3a22'), 6), g, 0, 0.14, 0, 0, 0, 0.2);
      for (let i = 0; i < 5; i++) at(scl(sph(0.045, gm, 10, 8), 1.4, 0.6, 1.2), g, -0.04 + Math.cos(i * 1.3) * 0.05, 0.22 + (i % 2) * 0.04, Math.sin(i * 1.3) * 0.05);
      break;
    }
    // ---- floor items
    case 'plant_big': {
      at(lathe([[0.001, 0], [0.14, 0], [0.17, 0.3], [0.16, 0.31], [0.001, 0.28]], mat('#f1ece4', { rough: 0.5 }), 20, 'pot'), g, 0, 0, 0);
      const lm = mat('#3f9b5a', { rough: 0.6, side: THREE.DoubleSide });
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7, r = 0.1 + (i % 3) * 0.06;
        const leaf = group(g, Math.cos(a) * 0.05, 0.3, Math.sin(a) * 0.05);
        at(cyl(0.006, 0.006, 0.3 + r, mat('#3a7a3a'), 5), leaf, 0, (0.3 + r) / 2, 0);
        at(scl(sph(0.14, lm, 12, 8), 1, 0.12, 0.7), leaf, 0, 0.3 + r, 0.06, 0.5, 0, 0);
        leaf.rotation.set(Math.cos(a) * 0.5, a, Math.sin(a) * 0.5);
      }
      break;
    }
    case 'beanbag': {
      const bm = mat(accent, { rough: 0.95, map: fabric('#ffffff') });
      at(scl(sph(0.42, bm, 24, 16), 1, 0.55, 1), g, 0, 0.22, 0);
      at(scl(sph(0.3, bm, 20, 14), 1, 0.7, 0.6), g, 0, 0.4, -0.2);
      break;
    }
    case 'bookshelf': {
      const wm = mat(th.wood, { rough: 0.5 });
      at(rbox(0.8, 1.6, 0.3, 0.02, wm), g, 0, 0.8, 0);
      at(box(0.74, 1.54, 0.01, mat(shade(th.wood, 0.7))), g, 0, 0.8, -0.13);
      const bc = ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#8f6bff', '#f4f1ea', '#ff9f43'];
      for (let r = 0; r < 4; r++) {
        at(box(0.74, 0.02, 0.27, wm), g, 0, 0.1 + r * 0.38, 0.0);
        let x = -0.34;
        while (x < 0.3) { const bw = 0.03 + Math.random() * 0.03, bh = 0.2 + Math.random() * 0.1; at(box(bw, bh, 0.2, mat(bc[Math.floor(Math.random() * bc.length)], { rough: 0.7 })), g, x + bw / 2, 0.11 + r * 0.38 + bh / 2, 0.01); x += bw + 0.004; }
      }
      break;
    }
    case 'arcade': case 'pixel_cabinet': {
      const body = mat(id === 'arcade' ? '#2b1b5a' : '#1a1033', { rough: 0.4 });
      at(rbox(0.6, 1.7, 0.6, 0.03, body), g, 0, 0.85, 0);
      const col = id === 'arcade' ? accent : '#ff3df2';
      for (const s of [-1, 1]) at(rbox(0.012, 1.6, 0.012, 0.004, glow(col, 3)), g, s * 0.305, 0.85, 0.3);
      at(rbox(0.5, 0.18, 0.02, 0.01, glow(id === 'arcade' ? '#ffe066' : '#3dfcff', 2)), g, 0, 1.55, 0.3);
      const sm = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const sp = at(plane(0.44, 0.36, sm), g, 0, 1.18, 0.29, -0.15, 0, 0);
      sp.userData.screenKey = 'arcade'; sp.userData.ownMat = true; sp.userData.noShadow = true;
      g.userData.screen = sp;
      at(rbox(0.56, 0.06, 0.25, 0.02, mat('#141018')), g, 0, 0.92, 0.38, 0.3, 0, 0);
      at(cyl(0.01, 0.01, 0.06, black(), 6), g, -0.12, 0.98, 0.4);
      at(sph(0.022, mat('#ff4f4f'), 10, 8), g, -0.12, 1.01, 0.4);
      for (let i = 0; i < 3; i++) at(cyl(0.018, 0.018, 0.015, mat(['#ffe066', '#3dfcff', '#9dff5a'][i]), 12), g, 0.04 + i * 0.06, 0.96, 0.4);
      break;
    }
    case 'crt_tv': {
      at(rbox(0.5, 0.42, 0.42, 0.06, mat('#d9c8a6', { rough: 0.6 })), g, 0, 0.21 + 0.4, 0);
      const sm = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const sp = at(plane(0.36, 0.28, sm), g, -0.04, 0.63, 0.212);
      sp.userData.screenKey = 'arcade'; sp.userData.ownMat = true; sp.userData.noShadow = true;
      g.userData.screen = sp;
      at(rbox(0.6, 0.4, 0.45, 0.02, mat(th.wood, { rough: 0.5 })), g, 0, 0.2, 0);
      for (let i = 0; i < 2; i++) at(cyl(0.018, 0.018, 0.02, black(), 10), g, 0.19, 0.55 + i * 0.07, 0.215, Math.PI / 2, 0, 0);
      break;
    }
    case 'fishtank': {
      at(rbox(1.0, 0.6, 0.4, 0.02, mat('#1b1c24')), g, 0, 0.3, 0);
      at(rbox(0.98, 0.5, 0.38, 0.01, mat('#4fd0ff', { transparent: true, opacity: 0.25, rough: 0.05, emissive: '#1a7fbf', ei: 0.6 })), g, 0, 0.86, 0);
      at(rbox(1.0, 0.04, 0.4, 0.01, black()), g, 0, 1.12, 0);
      at(box(0.94, 0.06, 0.34, mat('#e8d6a6', { rough: 1 })), g, 0, 0.64, 0);
      const fish = [];
      for (let i = 0; i < 5; i++) { const f = at(scl(sph(0.025, glow(['#ff9f43', '#ff4f8b', '#ffe066'][i % 3], 1.2), 8, 6), 1.8, 1, 0.6), g, -0.3 + i * 0.15, 0.8 + (i % 3) * 0.08, -0.05 + (i % 2) * 0.1); fish.push(f); }
      for (let i = 0; i < 4; i++) at(scl(cone(0.03, 0.2, mat('#3f9b5a'), 6), 1, 1, 1), g, -0.35 + i * 0.22, 0.75, -0.1);
      g.userData.fish = fish;
      break;
    }
    case 'telescope': {
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; at(cyl(0.012, 0.012, 1.0, mat('#c9a45c', { metal: 0.8, rough: 0.3 }), 6), g, Math.cos(a) * 0.15, 0.45, Math.sin(a) * 0.15, Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.32); }
      at(cyl(0.06, 0.08, 0.9, mat('#f2f0ec', { rough: 0.3 }), 20), g, 0, 1.05, 0.05, 1.0, 0, 0);
      at(cyl(0.085, 0.085, 0.06, black(), 20), g, 0, 1.25, -0.3, 1.0, 0, 0);
      break;
    }
    case 'sculpture': {
      at(rbox(0.4, 0.8, 0.4, 0.02, mat('#f2efe9', { rough: 0.3, map: marble('#f2efe9') })), g, 0, 0.4, 0);
      at(torus(0.2, 0.06, mat('#ffcf4a', { metal: 0.95, rough: 0.15 }), Math.PI * 2, 16, 48), g, 0, 1.08, 0, 0.3, 0.5, 0);
      at(sph(0.08, mat(accent, { metal: 0.6, rough: 0.2 }), 20, 16), g, 0, 1.08, 0);
      break;
    }
    case 'rug_round': {
      const rm = new THREE.MeshStandardMaterial({ map: rugTex(th.fabric2, accent), roughness: 1 });
      const r = at(circle(1.0, rm, 48), g, 0, 0.012, 0, -Math.PI / 2, 0, 0);
      r.receiveShadow = true; r.userData.noShadow = true;
      break;
    }
    case 'disco_ball': {
      at(cyl(0.004, 0.004, 0.5, black(), 4), g, 0, -0.25, 0);
      const db = at(sph(0.16, mat('#e8ecf5', { metal: 1, rough: 0.15, flat: true }), 14, 10), g, 0, -0.6, 0);
      g.userData.spinBall = db;
      break;
    }
    case 'coffee': {
      at(rbox(0.26, 0.34, 0.3, 0.03, mat('#1d1e26', { rough: 0.3, metal: 0.4 })), g, 0, 0.17, 0);
      at(rbox(0.2, 0.05, 0.18, 0.01, metal('#c9ccd4')), g, 0, 0.3, 0.08);
      at(cyl(0.03, 0.03, 0.04, metal('#c9ccd4'), 12), g, 0, 0.22, 0.1);
      at(cyl(0.035, 0.03, 0.06, mat('#f4f1ea'), 14), g, 0, 0.06, 0.1);
      at(sph(0.008, glow('#59ff8f', 3), 6, 4), g, 0.08, 0.28, 0.152);
      break;
    }
    default: {
      at(rbox(0.3, 0.3, 0.3, 0.05, mat(accent)), g, 0, 0.15, 0);
    }
  }
  return g;
}

// Pet cat (animated by room)
export function buildCat(color = '#f2a65a') {
  const g = new THREE.Group();
  const fur = mat(color, { rough: 0.9 });
  const white = mat('#fbf6ee', { rough: 0.9 });
  const body = group(g, 0, 0.16, 0);
  at(scl(sph(0.13, fur, 18, 12), 0.85, 0.75, 1.3), body, 0, 0, 0);
  at(scl(sph(0.08, white, 12, 10), 0.8, 0.7, 1.0), body, 0, -0.03, 0.08);
  const head = group(body, 0, 0.1, 0.17);
  at(scl(sph(0.095, fur, 18, 14), 1.1, 0.95, 0.95), head, 0, 0, 0);
  at(scl(sph(0.05, white, 10, 8), 1.2, 0.8, 0.8), head, 0, -0.03, 0.06);
  for (const s of [-1, 1]) {
    at(cone(0.04, 0.07, fur, 4), head, s * 0.055, 0.085, -0.005, 0, Math.PI / 4, s * -0.25);
    at(scl(sph(0.016, mat('#14141a', { rough: 0.2 }), 8, 6), 1, 1.2, 0.6), head, s * 0.038, 0.012, 0.085);
    at(sph(0.005, glow('#ffffff', 1.5), 6, 4), head, s * 0.034, 0.02, 0.094);
  }
  at(sph(0.01, mat('#ff8fa3'), 6, 4), head, 0, -0.015, 0.095);
  const legs = [];
  for (const [x, z] of [[-0.06, 0.1], [0.06, 0.1], [-0.06, -0.1], [0.06, -0.1]]) {
    const l = group(g, x, 0.11, z);
    at(capsule(0.025, 0.06, fur, 4, 8), l, 0, -0.05, 0);
    legs.push(l);
  }
  const tail = group(body, 0, 0.04, -0.16);
  at(tube([[0, 0, 0], [0, 0.06, -0.06], [0, 0.16, -0.08], [0.02, 0.24, -0.04]], 0.018, fur, 'cattail'), tail, 0, 0, 0);
  g.userData = { body, head, legs, tail };
  return g;
}
