// Item preview renderer for the shop: its own small WebGL canvas with studio lighting.
// Renders cached thumbnails (gear tiers, decor, fashion try-ons) and a live, rotatable detail view.
import * as THREE from 'three';
import { RoomEnvironment } from '../../vendor/three/addons/environments/RoomEnvironment.js';
import * as F from './furniture.js';
import { Character } from './character.js';
import { canvasTex, disposeObj, mat, sph, cyl, at } from './kit.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// Where to look on a character for each clothing slot: [center y, frame size]
const SLOT_FRAME = { top: [1.12, 0.78], bottom: [0.5, 1.05], shoes: [0.07, 0.42], hat: [1.48, 0.5], eyes: [1.43, 0.36], neck: [1.2, 0.42], body: [0.88, 1.95] };

export class ItemPreview {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'pv-canvas';
    this.r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    this.r.outputColorSpace = THREE.SRGBColorSpace;
    this.r.toneMapping = THREE.ACESFilmicToneMapping;
    this.r.toneMappingExposure = 1.08;
    this.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.r.setClearColor(0x000000, 0);
    const sc = (this.scene = new THREE.Scene());
    const pm = new THREE.PMREMGenerator(this.r);
    sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    sc.environmentIntensity = 0.55;
    sc.add(new THREE.HemisphereLight('#ffffff', '#3a3550', 1.05));
    const key = new THREE.DirectionalLight('#fff3e6', 2.4); key.position.set(2.5, 4, 3.5); sc.add(key);
    const rim = new THREE.DirectionalLight('#a9c4ff', 1.6); rim.position.set(-3, 2.5, -2.5); sc.add(rim);
    // soft contact shadow
    const sh = canvasTex(128, 128, (ctx, w, h) => { const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    sc.add(this.shadow);
    this.cam = new THREE.PerspectiveCamera(28, 1, 0.02, 60);
    this.holder = new THREE.Group();
    sc.add(this.holder);
    this.cache = new Map();
    this.queue = [];
    this.screenMat = new THREE.MeshBasicMaterial({ map: wallpaper(), toneMapped: false });
    this.yaw = 0.5; this.spin = true;
  }

  // ---- object construction
  make(spec, ctx) {
    const th = ctx.theme, accent = ctx.accent;
    let obj = null, frame = null, char = null;
    if (spec.kind === 'gear') {
      const scr = [];
      const t = spec.tier, c = spec.cat;
      if (c === 'pc') { obj = F.buildPC(t, accent, scr); if (t > 0) obj.rotation.y = Math.PI / 2; }
      else if (c === 'monitor') obj = t === 0 ? F.buildPC(0, accent, scr) : F.buildMonitors(t, accent, scr);
      else if (c === 'camera') obj = t === 0 ? F.buildPC(0, accent, scr) : F.buildCamera(t, accent, false);
      else if (c === 'mic') obj = F.buildMic(t, accent, false);
      else if (c === 'light') obj = F.buildLightGear(t, accent);
      else if (c === 'chair') obj = F.buildChair(t, th, accent);
      else if (c === 'desk') obj = F.buildDesk(t, th);
      else if (c === 'keys') obj = F.buildKeys(t, accent);
      else if (c === 'net') obj = F.buildRouter(t, accent);
      if (obj && c === 'light' && t >= 4) obj.children.forEach((ch) => { if (ch.userData.softbox) { const sg = ch.userData.softbox; ch.position.set(sg * 0.55, 0, 0); ch.rotation.y = sg * 0.5; } });
      scr.forEach((m) => { m.material = this.screenMat; });
      if (obj) obj.traverse((o) => { if (o.userData.screenKey) o.material = this.screenMat; });
      if (obj && isEmpty(obj)) obj = placeholder(c, accent);
    } else if (spec.kind === 'decor') {
      obj = spec.id === 'cat' ? F.buildCat('#f2a65a') : F.buildDecor(spec.id, th, accent, ctx.profile);
      obj.traverse((o) => { if (o.userData.screenKey) o.material = this.screenMat; });
    } else if (spec.kind === 'fashion' || spec.kind === 'char') {
      char = new Character(spec.profile);
      char.play(spec.clip || 'idle', { restart: true });
      char.blendK = 1000;
      for (let i = 0; i < 3; i++) char.update(0.05);
      char.blendK = 10;
      obj = char.root;
      frame = SLOT_FRAME[spec.slot || 'body'];
    }
    return { obj, frame, char };
  }
  frameCam(obj, frame, spec, aspect) {
    obj.updateMatrixWorld(true);
    let center, size;
    if (frame) { center = V3(0, frame[0], 0); size = frame[1]; }
    else {
      const b = new THREE.Box3().setFromObject(obj);
      center = b.getCenter(V3()); const s = b.getSize(V3());
      size = Math.max(s.x, s.y * 1.1, s.z * 0.9);
      this.shadow.position.set(center.x, b.min.y + 0.002, center.z);
      this.shadow.scale.setScalar(Math.max(s.x, s.z) * 1.6);
    }
    if (frame) { this.shadow.position.set(0, 0.002, 0); this.shadow.scale.setScalar(0.9); }
    this.shadow.visible = spec.kind !== 'decor' || !['wall'].includes(spec.slot);
    const pitch = spec.pitch ?? (spec.slot === 'rug' ? 0.85 : spec.kind === 'fashion' ? 0.12 : 0.32);
    const fov = (this.cam.fov * Math.PI) / 180;
    let dist = (size * 0.62) / Math.tan(fov / 2);
    if (aspect < 1) dist /= aspect;
    this.target = center;
    this.dist = dist; this.pitch = pitch;
  }
  place(yaw) {
    const c = this.target, d = this.dist, p = this.pitch;
    this.cam.position.set(c.x + Math.sin(yaw) * Math.cos(p) * d, c.y + Math.sin(p) * d, c.z + Math.cos(yaw) * Math.cos(p) * d);
    this.cam.lookAt(c);
  }
  clear() {
    for (const o of [...this.holder.children]) { this.holder.remove(o); disposeObj(o); }
    this.char = null;
  }

  // ---- cached thumbnail (data URL)
  thumb(key, spec, ctx, w = 220, h = 220) {
    if (this.cache.has(key)) return this.cache.get(key);
    const live = this.live;
    this.clear();
    const { obj, frame } = this.make(spec, ctx);
    if (!obj) return null;
    this.holder.add(obj);
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    this.frameCam(obj, frame, spec, w / h);
    this.place(spec.yaw ?? (spec.kind === 'fashion' ? 0.35 : spec.slot === 'wall' ? 0.25 : 0.6));
    this.r.render(this.scene, this.cam);
    const url = this.canvas.toDataURL('image/png');
    this.cache.set(key, url);
    this.clear();
    if (live) this.show(live.spec, live.ctx, true);
    return url;
  }
  // Generate thumbnails progressively (one per frame) and hand them to `done(key, url)`.
  request(key, spec, ctx, done) {
    if (this.cache.has(key)) { done(key, this.cache.get(key)); return; }
    this.queue.push({ key, spec, ctx, done });
    if (!this._pumping) this.pump();
  }
  pump() {
    this._pumping = true;
    const step = () => {
      const j = this.queue.shift();
      if (!j) { this._pumping = false; return; }
      try { const url = this.thumb(j.key, j.spec, j.ctx); if (url) j.done(j.key, url); } catch (e) { console.warn('preview', e); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  cancelQueue() { this.queue = []; }

  // ---- live detail view
  attach(container) {
    this.container = container;
    container.appendChild(this.canvas);
    this.running = true;
    let last = performance.now();
    let drag = null;
    this.canvas.onpointerdown = (e) => { drag = { x: e.clientX, yaw: this.yaw }; this.spin = false; this.canvas.setPointerCapture?.(e.pointerId); };
    this.canvas.onpointermove = (e) => { if (drag) this.yaw = drag.yaw - (e.clientX - drag.x) * 0.012; };
    this.canvas.onpointerup = this.canvas.onpointercancel = () => { drag = null; };
    const loop = (t) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (this.live) {
        const w = Math.max(10, container.clientWidth), h = Math.max(10, container.clientHeight);
        if (this._w !== w || this._h !== h) { this._w = w; this._h = h; this.r.setSize(w, h, false); this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px'; this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.frameCam(this.liveObj, this.liveFrame, this.live.spec, w / h); }
        if (this.spin) this.yaw += dt * 0.45;
        if (this.char) this.char.update(dt);
        this.place(this.yaw);
        this.r.render(this.scene, this.cam);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  show(spec, ctx, keepYaw = false) {
    this.clear();
    this.live = { spec, ctx };
    const { obj, frame, char } = this.make(spec, ctx);
    if (!obj) return;
    this.holder.add(obj);
    this.char = char;
    this.liveObj = obj; this.liveFrame = spec.kind === 'fashion' ? SLOT_FRAME.body : frame;
    this._w = 0; // force resize + reframe
    if (!keepYaw) { this.yaw = spec.kind === 'fashion' ? 0.25 : 0.6; this.spin = true; }
  }
  detach() {
    this.running = false;
    this.live = null;
    this.clear();
    this.canvas.remove();
  }
}

function isEmpty(obj) { let n = 0; obj.traverse((o) => { if (o.isMesh) n++; }); return n === 0; }
function placeholder(cat, accent) {
  const g = new THREE.Group();
  if (cat === 'light') {
    at(sph(0.08, mat('#fff4d6', { emissive: '#ffd79a', ei: 1.6 }), 20, 14), g, 0, 0.12, 0);
    at(cyl(0.035, 0.03, 0.06, mat('#9aa0ad', { metal: 0.8, rough: 0.3 }), 16), g, 0, 0.03, 0);
  } else if (cat === 'mic') {
    // wired earbuds with an inline mic
    const w = mat('#f2f2f4', { rough: 0.35 }), cable = mat('#e6e6ea', { rough: 0.5 });
    for (const s of [1, -1]) { at(sph(0.022, w, 16, 12), g, s * 0.05, 0.12, 0); at(cyl(0.006, 0.006, 0.04, w, 8), g, s * 0.05, 0.095, 0); }
    const pts = [V3(0.05, 0.08, 0), V3(0.03, 0.03, 0.01), V3(0, 0.0, 0.01), V3(-0.03, 0.03, 0.01), V3(-0.05, 0.08, 0)];
    const tm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.003, 6), cable); tm.userData.ownGeo = true; g.add(tm);
    at(cyl(0.008, 0.008, 0.03, mat('#2a2a33', { rough: 0.4 }), 10), g, 0.035, 0.035, 0.01, 0, 0, 0.7);
  } else { at(sph(0.08, mat(accent, { rough: 0.4 }), 20, 14), g, 0, 0.08, 0); }
  return g;
}
function wallpaper() {
  return canvasTex(256, 160, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2b2f6b'); g.addColorStop(0.55, '#7a3fa0'); g.addColorStop(1, '#ff6a7a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.moveTo(w * 0.45, h * 0.35); ctx.lineTo(w * 0.45, h * 0.65); ctx.lineTo(w * 0.6, h * 0.5); ctx.fill();
  });
}
