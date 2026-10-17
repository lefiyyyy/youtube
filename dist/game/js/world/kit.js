// Mesh-building helpers with geometry/material caching.
import * as THREE from '../../vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from '../../vendor/three/addons/geometries/RoundedBoxGeometry.js';

const geoCache = new Map();
const matCache = new Map();
const cachedGeos = new Set(), cachedMats = new Set();
const g = (key, make) => { let v = geoCache.get(key); if (!v) { v = make(); geoCache.set(key, v); cachedGeos.add(v); } return v; };
// Dispose GPU resources of a removed subtree, keeping shared cached geometry/materials alive.
export function disposeObj(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.geometry && !cachedGeos.has(o.geometry)) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) {
      if (!m || cachedMats.has(m)) continue;
      // its canvas textures too (venue banners, labels...): three re-uploads one that is still used elsewhere
      for (const k in m) if (m[k] && m[k].isTexture && !m[k].isRenderTargetTexture) m[k].dispose();
      m.dispose();
    }
  });
}

export function mat(color, o = {}) {
  const key = JSON.stringify([color, o.rough, o.metal, o.emissive, o.ei, o.transparent, o.opacity, o.flat, o.side, o.env, o.map ? o.map.uuid : 0]);
  let m = matCache.get(key);
  if (m) return m;
  m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: o.rough ?? 0.7,
    metalness: o.metal ?? 0,
    emissive: o.emissive ? new THREE.Color(o.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: o.ei ?? 1,
    transparent: !!o.transparent,
    opacity: o.opacity ?? 1,
    flatShading: !!o.flat,
    side: o.side ?? THREE.FrontSide,
    envMapIntensity: o.env ?? 1,
    map: o.map || null,
  });
  matCache.set(key, m);
  cachedMats.add(m);
  return m;
}
// Uncached material for things that animate their own properties.
export function umat(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), roughness: o.rough ?? 0.6, metalness: o.metal ?? 0,
    emissive: new THREE.Color(o.emissive ?? 0x000000), emissiveIntensity: o.ei ?? 1,
    transparent: !!o.transparent, opacity: o.opacity ?? 1, map: o.map || null, emissiveMap: o.emissiveMap || null,
    side: o.side ?? THREE.FrontSide, toneMapped: o.toneMapped ?? true, depthWrite: o.depthWrite ?? true,
  });
}
export function glow(color, intensity = 2.2) {
  return mat(color, { emissive: color, ei: intensity, rough: 0.4 });
}

export function rbox(w, h, d, r, material, seg = 3) {
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const geo = g(`rb${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)},${r.toFixed(3)},${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, Math.max(0.0005, r)));
  return new THREE.Mesh(geo, material);
}
export function box(w, h, d, material) {
  return new THREE.Mesh(g(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), material);
}
export function cyl(rt, rb, h, material, seg = 24, open = false) {
  return new THREE.Mesh(g(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), material);
}
export function sph(r, material, ws = 24, hs = 16) {
  return new THREE.Mesh(g(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)), material);
}
export function sphPart(r, material, phiStart, phiLen, thStart, thLen, ws = 32, hs = 16) {
  return new THREE.Mesh(g(`sp${r},${phiStart},${phiLen},${thStart},${thLen},${ws}`, () => new THREE.SphereGeometry(r, ws, hs, phiStart, phiLen, thStart, thLen)), material);
}
export function capsule(r, len, material, cs = 6, rs = 14) {
  return new THREE.Mesh(g(`cap${r},${len},${cs},${rs}`, () => new THREE.CapsuleGeometry(r, len, cs, rs)), material);
}
export function torus(r, tube, material, arc = Math.PI * 2, rs = 10, ts = 32) {
  return new THREE.Mesh(g(`t${r},${tube},${arc},${rs},${ts}`, () => new THREE.TorusGeometry(r, tube, rs, ts, arc)), material);
}
export function cone(r, h, material, seg = 16) {
  return new THREE.Mesh(g(`co${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), material);
}
export function plane(w, h, material) {
  return new THREE.Mesh(g(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h)), material);
}
export function circle(r, material, seg = 32) {
  return new THREE.Mesh(g(`ci${r},${seg}`, () => new THREE.CircleGeometry(r, seg)), material);
}
export function lathe(points, material, seg = 28, key) {
  return new THREE.Mesh(g(`la${key || JSON.stringify(points)},${seg}`, () => new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), seg)), material);
}
export function tube(pts, r, material, key, seg = 20) {
  return new THREE.Mesh(g(`tu${key}`, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 8, false)), material);
}

// place(child, parent, x,y,z, rx,ry,rz, sx,sy,sz)
export function at(mesh, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  if (parent) parent.add(mesh);
  return mesh;
}
export function scl(mesh, x, y = x, z = x) { mesh.scale.set(x, y, z); return mesh; }
export function group(parent, x = 0, y = 0, z = 0, ry = 0) {
  const gp = new THREE.Group();
  gp.position.set(x, y, z); gp.rotation.y = ry;
  if (parent) parent.add(gp);
  return gp;
}
export function shadows(obj, cast = true, receive = true) {
  obj.traverse((o) => { if (o.isMesh) { if (o.userData.noShadow) return; o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
}
export function noShadow(obj) { obj.traverse((o) => { o.userData.noShadow = true; o.castShadow = false; }); return obj; }

// Canvas texture helper
export function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.linear ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  t.anisotropy = 4;
  t.userData.canvas = c;
  return t;
}
export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.isMesh && o.userData.ownGeo) o.geometry.dispose();
    if (o.isMesh && o.userData.ownMat) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { x.map?.dispose(); x.dispose(); }); }
  });
}
