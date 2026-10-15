// World: renderer, post-processing, camera director, lighting/time-of-day, character control, picking.
import * as THREE from 'three';
import { EffectComposer } from '../../vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../../vendor/three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../../vendor/three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../../vendor/three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from '../../vendor/three/addons/environments/RoomEnvironment.js';
import { Room } from './room.js';
import { Venue } from './venue.js';
import { Character } from './character.js';
import { ScreenManager } from './screens.js';
import { Skyline, skyParams } from './sky.js';
import { VFX } from './vfx.js';
import { mat, torus, circle } from './kit.js';
import { clamp, lerp, damp, isTouch } from '../core/util.js';
import { bus } from '../core/bus.js';

const PI = Math.PI;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export class World {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
    this.camera.layers.enable(1);
    this.screens = new ScreenManager();
    this.sky = new Skyline();
    this.vfx = new VFX(this.scene);
    this.clock = 0;
    this.hour = 10;
    this.quality = 'high';
    this.cam = { target: V3(0, 0.9, 0), yaw: 0.65, pitch: 0.52, dist: 9, fov: 32, shift: 0, shiftY: 0, roll: 0 };
    this.camGoal = { ...this.cam, target: this.cam.target.clone() };
    this.camUser = { yaw: 0, pitch: 0, zoom: 1 };
    this.shotName = 'room';
    this.shake = 0;
    this.fixedCam = null;
    this.path = [];
    this.charMode = 'idle';
    this.idleT = 0;
    this.lookAtCam = 0;
    this.setupEnv();
    this.setupLights();
    this.setupPost();
    this.setupPicking();
    this.bgCanvas = document.createElement('canvas'); this.bgCanvas.width = 4; this.bgCanvas.height = 256;
    this.bgTex = new THREE.CanvasTexture(this.bgCanvas); this.bgTex.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = this.bgTex;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  setupEnv() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.42;
  }

  setupLights() {
    const s = this.scene;
    this.hemi = new THREE.HemisphereLight('#dfe7ff', '#3a2f3f', 0.9);
    s.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff1dc', 2.0);
    this.sun.position.set(6, 9, 7);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 4;
    const sc = this.sun.shadow.camera;
    sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 1; sc.far = 30;
    s.add(this.sun); s.add(this.sun.target);
    this.roomLight = new THREE.PointLight('#ffd9a8', 0, 12, 1.6); s.add(this.roomLight);
    this.windowLight = new THREE.PointLight('#bcd6ff', 0, 7, 1.4); s.add(this.windowLight);
    this.accentLight = new THREE.PointLight('#ff4f8b', 0, 4.5, 1.6); s.add(this.accentLight);
    this.screenLight = new THREE.PointLight('#8ab8ff', 0, 2.6, 1.8); s.add(this.screenLight);
    this.keyLight = new THREE.PointLight('#fff4e6', 0, 3.2, 1.6); s.add(this.keyLight);
    this.lampLight = new THREE.PointLight('#ffb866', 0, 3, 1.8); s.add(this.lampLight);
  }

  setupPost() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.5, 0.9);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  setQuality(q) {
    if (q === 'auto') q = isTouch ? 'medium' : 'high';
    this.quality = q;
    const dpr = window.devicePixelRatio || 1;
    const pr = q === 'low' ? Math.min(dpr, 1) * (isTouch ? 0.85 : 1) : q === 'medium' ? Math.min(dpr, 1.5) : Math.min(dpr, 2);
    this.renderer.setPixelRatio(pr);
    this.renderer.shadowMap.enabled = q !== 'low';
    this.sun.castShadow = q !== 'low';
    const ms = q === 'high' ? 2048 : 1024;
    if (this.sun.shadow.mapSize.x !== ms) { this.sun.shadow.mapSize.set(ms, ms); this.sun.shadow.map?.dispose(); this.sun.shadow.map = null; }
    this.bloom.enabled = q !== 'low';
    this.useComposer = q !== 'low';
    this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    this.resize();
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth, h = this.container.clientHeight || window.innerHeight;
    this.W = w; this.H = h;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.room) this.shot(this.shotName, this.shotOpts, true);
  }

  // ---------------------------------------------------------------- BUILD
  build(state) {
    this.state = state;
    this.screens.accent = state.profile.accent;
    if (!this.room) this.room = new Room(this.scene, this.screens);
    this.room.build(state);
    if (this.room.skyPlane) { this.room.skyMat.map = this.sky.tex; this.room.skyMat.needsUpdate = true; this.fitSkyTex(); }
    if (!this.char) {
      this.char = new Character(state.profile);
      this.scene.add(this.char.root);
      this.char.root.position.set(0.4, 0, 0.6);
      this.char.root.rotation.y = 0.5;
      this.char.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
    }
    this.placeLights();
    this.marker = this.marker || this.makeMarker();
    this.applyTime(this.hour, true);
    this.shot(this.shotName, this.shotOpts, true);
  }
  fitSkyTex() {
    const a = this.room.skyAspect || 2;
    const t = this.sky.tex;
    t.wrapS = THREE.ClampToEdgeWrapping;
    const texA = 2;
    if (a < texA) { t.repeat.set(a / texA, 1); t.offset.set((1 - a / texA) / 2, 0); }
    else { t.repeat.set(1, texA / a); t.offset.set(0, 0); }
  }
  rebuildDesk(cat) { this.room.buildDesk(cat); this.placeLights(); }
  rebuildDecor(id) { this.room.buildDecor(id); }
  rebuildRoom() {
    this.room.build(this.state);
    if (this.room.skyPlane) { this.room.skyMat.map = this.sky.tex; this.room.skyMat.needsUpdate = true; this.fitSkyTex(); }
    this.placeLights();
    this.applyTime(this.hour, true);
    const st = this.room.st.desk;
    this.char.root.position.set(st.x, 0, st.z + 0.3);
    this.charMode = 'idle'; this.char.play('idle'); this.path = [];
    this.shot('room', null, true);
  }
  setProfile(p) {
    this.char.dress(p);
    this.char.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    this.screens.accent = p.accent;
    this.portraitChar = null;
  }

  placeLights() {
    const r = this.room;
    const W = r.W, D = r.D, H = r.H;
    this.roomLight.position.set(0.3, H - 0.3, 0.3);
    this.roomLight.distance = Math.max(W, D) * 1.6;
    const win = r.L.windows[0];
    if (win.wall === 'back') this.windowLight.position.set(win.x, win.y + win.h / 2, -D / 2 + 0.8);
    else this.windowLight.position.set(-W / 2 + 0.8, win.y + win.h / 2, win.z);
    const dd = r.deskDims;
    this.accentLight.position.set(dd.x, dd.H + 0.7, dd.z - dd.d / 2 + 0.15);
    this.accentLight.color.set(this.state.profile.accent);
    this.screenLight.position.set(dd.x, dd.H + 0.4, dd.z + 0.05);
    this.keyLight.position.set(dd.x - 0.3, dd.H + 0.9, dd.z + dd.d / 2 + 0.05);
    this.lampLight.position.set(r.L.night.x + 0.06, 0.95, r.L.night.z);
    this.sun.target.position.set(0, 0, 0);
    const ext = Math.max(W, D) * 0.75 + 1;
    const sc = this.sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- TIME OF DAY
  applyTime(hour, force = false) {
    this.hour = hour;
    const redrawn = this.sky.draw(hour);
    if (!redrawn && !force) return;
    const p = skyParams(hour % 24);
    const dayK = clamp((p.lit < 0.2 ? 1 : 1 - (p.lit - 0.2) / 0.45), 0, 1); // 1 = full day
    const g = this.state?.gear || {};
    const isNightish = dayK < 0.55;
    this.sun.intensity = lerp(0.4, 1.9, dayK);
    this.sun.color.copy(new THREE.Color('#9fb0ff').lerp(new THREE.Color(hour > 16 || hour < 8 ? '#ffc58a' : '#fff4e3'), dayK));
    this.hemi.intensity = lerp(0.5, 0.85, dayK);
    this.hemi.color.copy(new THREE.Color('#7f8cff').lerp(new THREE.Color('#e3ebff'), dayK));
    this.roomLight.intensity = lerp(isNightish ? 2.6 : 1.2, 0.25, dayK) * (1 + (g.light || 0) * 0.08) * (1 + (this.state?.home || 0) * 0.25);
    this.windowLight.color.copy(p.bottom.clone().lerp(new THREE.Color('#ffffff'), 0.4));
    this.windowLight.intensity = lerp(0.9, 1.6, dayK);
    this.lampLight.intensity = isNightish ? 1.4 : 0;
    if (this.room?.lampShade) this.room.lampShade.material.emissiveIntensity = isNightish ? 0.9 : 0;
    if (this.room?.ceilLamp) this.room.ceilLamp.material.emissiveIntensity = isNightish ? 1.6 : 0.3;
    this.accentLight.intensity = ((g.light || 0) >= 2 || this.state?.theme === 'gamer') ? lerp(2.6, 1.0, dayK) : 0;
    this.screenLight.intensity = lerp(1.1, 0.35, dayK);
    this.keyLight.intensity = (g.light || 0) >= 3 ? lerp(2.2, 1.2, dayK) * ((g.light || 0) >= 4 ? 1.3 : 1) : (g.light === 1 || g.light === 2 ? 0.6 : 0);
    if (this.quality === 'low') { this.windowLight.intensity *= 0.6; this.keyLight.intensity = 0; this.lampLight.intensity = 0; }
    this.bloom.strength = lerp(0.75, 0.45, dayK);
    for (const m of this.room?.shafts || []) { m.opacity = lerp(0.035, 0.16, dayK); m.color.set(dayK > 0.5 ? (hour > 16 ? '#ffc98f' : '#ffeed2') : '#9fb2ff'); }
    this.renderer.toneMappingExposure = lerp(1.15, 1.02, dayK);
    // background gradient
    const ctx = this.bgCanvas.getContext('2d');
    const gr = ctx.createLinearGradient(0, 0, 0, 256);
    const top = new THREE.Color('#0d0b22').lerp(new THREE.Color('#3b3f78'), dayK * 0.85);
    const bot = new THREE.Color('#2a1a46').lerp(new THREE.Color('#c7b8e8'), dayK * 0.7);
    gr.addColorStop(0, '#' + top.getHexString()); gr.addColorStop(1, '#' + bot.getHexString());
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 4, 256);
    this.bgTex.needsUpdate = true;
    this.dayK = dayK;
    if (this.venue) this.venueLighting();
  }

  // ---------------------------------------------------------------- GOING OUT
  enterVenue(kind, opts = {}) {
    if (this.venue) this.exitVenue();
    this.standUp();
    this.path = []; this.charMode = 'idle'; this.slide = null; this.turnGoal = null;
    this.room.root.visible = false;
    this.marker.visible = false;
    const v = (this.venue = new Venue(this.scene, kind, opts));
    if (v.skyMat) { v.skyMat.map = this.sky.tex; v.skyMat.needsUpdate = true; }
    this._homeHour = this.hour;
    this.applyTime(kind === 'party' ? 22.5 : 15, true);
    const sp = v.st.spawn;
    this.char.root.position.set(sp.x, 0, sp.z);
    this.char.root.rotation.y = sp.ry;
    this.char.play('idle');
    this.shot('venue', null, true);
    return v;
  }
  exitVenue() {
    const v = this.venue;
    if (!v) return;
    this.venue = null;
    v.dispose();
    this.room.root.visible = true;
    this.hovered = null;
    this.path = []; this.charMode = 'idle';
    const st = this.room.st.door;
    this.char.root.position.set(st.x, 0, st.z);
    this.char.root.rotation.y = st.ry + Math.PI;
    this.char.play('idle');
    this.applyTime(this._homeHour ?? this.hour, true);
    this.shot('room', null, true);
  }
  venueLighting() {
    const party = this.venue.kind === 'party';
    this.sun.intensity = party ? 0.35 : 0.9;
    this.sun.color.set(party ? '#8f9cff' : '#fff4e3');
    this.hemi.intensity = party ? 0.55 : 0.75;
    this.hemi.color.set(party ? '#6a5cff' : '#dfe7ff');
    for (const l of [this.roomLight, this.windowLight, this.accentLight, this.screenLight, this.keyLight, this.lampLight]) l.intensity = 0;
    this.bloom.strength = party ? 0.55 : 0.45;
    this.renderer.toneMappingExposure = party ? 1.0 : 1.02;
  }

  // ---------------------------------------------------------------- CAMERA
  // The room is a closed interior: the main view sits in the front-right corner near the ceiling, other shots
  // orbit their subject and are kept inside the walls.
  yawToCorner(T) { const c = this.room.camCorner(); return Math.atan2(c.x - T.x, c.z - T.z); }
  cornerYaw(p = this.char.root.position) { return this.yawToCorner(p); }
  shot(name, opts = {}, snap = false) {
    this.shotName = name; this.shotOpts = opts;
    const r = this.room;
    if (!r) return;
    const G = this.camGoal;
    this.fixedCam = null;
    G.shift = opts?.shift ?? 0; G.shiftY = opts?.shiftY ?? 0;
    G.fov = 34;
    const dd = r.deskDims;
    const aspect = this.W / this.H, mobile = aspect < 1.5;
    switch (name) {
      case 'room': {
        const c = r.camCorner();
        const T = V3(-r.W * 0.07, 0.62, -r.D * 0.17);
        const d = c.clone().sub(T);
        G.target.copy(T); G.dist = d.length(); G.yaw = Math.atan2(d.x, d.z); G.pitch = Math.asin(d.y / G.dist);
        // keep roughly the same horizontal coverage on every aspect ratio
        const hfov = r.W > 9 ? 80 : 84;
        G.fov = clamp((2 * Math.atan(Math.tan((hfov * PI) / 360) / aspect) * 180) / PI, 44, 72);
        break;
      }
      case 'desk': {
        G.target.set(dd.x - 0.05, dd.H + 0.22, dd.z + 0.3);
        G.yaw = 0.98; G.pitch = 0.3; G.dist = mobile ? 3.4 : 3.0; G.fov = 36;
        break;
      }
      case 'deskWide': {
        G.target.set(dd.x + 0.1, dd.H + 0.15, dd.z + 0.35);
        G.yaw = 0.62; G.pitch = 0.36; G.dist = mobile ? 4.6 : 4.0; G.fov = 38;
        break;
      }
      case 'stream': {
        // facecam: from the camera mount looking at the streamer
        const head = this.headWorld();
        const from = r.camPoint.clone();
        from.x += 0.06; from.y += 0.06;
        from.z = Math.min(from.z, -r.D / 2 + 0.02);
        this.fixedCam = { pos: from, look: head.clone().add(V3(0, -0.16, 0)), fov: 72 };
        break;
      }
      case 'kitchen': {
        const st = r.st.fridge;
        G.target.set((st.x + r.st.counter.x) / 2, 1.0, (st.z + r.st.counter.z) / 2);
        G.yaw = this.yawToCorner(G.target) + 0.15; G.pitch = 0.3; G.dist = 3.3; G.fov = 40;
        break;
      }
      case 'bed': {
        const l = r.st.bed.lie;
        G.target.set(l.x, 0.62, l.z - 0.75);
        G.yaw = this.yawToCorner(G.target) - 0.1; G.pitch = 0.62; G.dist = 2.9; G.fov = 40;
        break;
      }
      case 'char': {
        const p = this.char.root.position;
        G.target.set(p.x, 1.05, p.z);
        G.yaw = this.cornerYaw() + (opts?.yawAdd || 0); G.pitch = 0.18; G.dist = opts?.dist || 3.0; G.fov = 32;
        break;
      }
      case 'creator': {
        const p = this.char.root.position;
        G.target.set(p.x, 0.92, p.z);
        G.yaw = this.char.root.rotation.y + 0.15; G.pitch = 0.12; G.dist = mobile ? 3.9 : 3.5; G.fov = 30;
        break;
      }
      case 'face': {
        const head = this.headWorld();
        G.target.copy(head);
        G.yaw = this.char.root.rotation.y + 0.25; G.pitch = 0.08; G.dist = 1.2; G.fov = 30;
        break;
      }
      case 'pair': {
        // two people talking: frame both from the side that faces the open room
        const a = opts.a, b = opts.b;
        G.target.set((a.x + b.x) / 2, 1.2, (a.z + b.z) / 2);
        const base = Math.atan2(b.x - a.x, b.z - a.z);
        const area = this.venue || r, c = area.camCorner();
        const cand = [base + PI / 2, base - PI / 2].map((y) => ({ y, d: Math.hypot(G.target.x + Math.sin(y) * 2.6 - c.x, G.target.z + Math.cos(y) * 2.6 - c.z) }));
        cand.sort((p, q) => p.d - q.d);
        G.yaw = cand[0].y + 0.25; G.pitch = 0.16; G.dist = mobile ? 3.0 : 2.7; G.fov = 36;
        break;
      }
      case 'venue': {
        const v = this.venue;
        if (!v) break;
        const c = v.camCorner(), T = v.camTarget();
        const d = c.clone().sub(T);
        G.target.copy(T); G.dist = d.length(); G.yaw = Math.atan2(d.x, d.z); G.pitch = Math.asin(d.y / G.dist);
        G.fov = clamp((2 * Math.atan(Math.tan((78 * PI) / 360) / aspect) * 180) / PI, 40, 68);
        break;
      }
    }
    if (snap) {
      Object.assign(this.cam, { yaw: G.yaw, pitch: G.pitch, dist: G.dist, fov: G.fov, shift: G.shift, shiftY: G.shiftY });
      this.cam.target.copy(G.target);
    }
    if (name !== 'room' && name !== 'venue') { this.camUser.yaw = 0; this.camUser.pitch = 0; this.camUser.zoom = 1; }
  }
  headWorld() {
    const v = new THREE.Vector3();
    this.char.hc.getWorldPosition(v);
    return v;
  }
  // bounds the camera must stay within (current interior)
  camBounds() {
    const a = this.venue || this.room;
    const m = 0.14;
    return { x0: -a.W / 2 + m, x1: a.W / 2 - m, z0: -a.D / 2 + m, z1: a.D / 2 - m, y0: 0.25, y1: a.H - 0.1 };
  }
  updateCamera(dt) {
    const C = this.cam, G = this.camGoal;
    const k = 4.5;
    const cam = this.camera;
    if (this.fixedCam) {
      const f = this.fixedCam;
      const tpos = f.pos;
      if (!this._fixedInit) { cam.position.copy(tpos); this._fixedInit = true; }
      cam.position.lerp(tpos, 1 - Math.exp(-6 * dt));
      // subtle handheld drift
      const t = this.clock;
      const look = f.look.clone().add(V3(Math.sin(t * 0.7) * 0.01, Math.sin(t * 0.9) * 0.008, 0));
      cam.lookAt(look);
      cam.fov = damp(cam.fov, f.fov, 6, dt);
      cam.clearViewOffset();
      cam.layers.disable(1);
    } else {
      this._fixedInit = false;
      cam.layers.enable(1);
      C.target.lerp(G.target, 1 - Math.exp(-k * dt));
      const look = this.shotName === 'room' || this.shotName === 'venue';
      C.uy = damp(C.uy || 0, look ? this.camUser.yaw : 0, 7, dt);
      C.up = damp(C.up || 0, look ? this.camUser.pitch : 0, 7, dt);
      C.uz = damp(C.uz || 1, look ? this.camUser.zoom : 1, 7, dt);
      C.yaw = damp(C.yaw, G.yaw, k, dt);
      C.pitch = damp(C.pitch, clamp(G.pitch, 0.02, 1.3), k, dt);
      C.dist = damp(C.dist, G.dist, k, dt);
      C.fov = damp(C.fov, G.fov, k, dt);
      C.shift = damp(C.shift, G.shift, k, dt);
      C.shiftY = damp(C.shiftY, G.shiftY, k, dt);
      const cp = Math.cos(C.pitch);
      cam.position.set(C.target.x + Math.sin(C.yaw) * cp * C.dist, C.target.y + Math.sin(C.pitch) * C.dist, C.target.z + Math.cos(C.yaw) * cp * C.dist);
      // stay inside the walls: pull the camera toward its target along the view ray
      if (this.room) {
        const b = this.camBounds(), T = C.target, P = cam.position;
        let kk = 1;
        const lim = (p, t, lo, hi) => { if (p > hi && p !== t) kk = Math.min(kk, (hi - t) / (p - t)); if (p < lo && p !== t) kk = Math.min(kk, (lo - t) / (p - t)); };
        lim(P.x, T.x, b.x0, b.x1); lim(P.z, T.z, b.z0, b.z1); lim(P.y, T.y, b.y0, b.y1);
        if (kk < 1) P.lerpVectors(T, P, Math.max(0.08, kk));
      }
      // look-around (room view): rotate the view direction around the camera, zoom narrows the lens
      const dir = C.target.clone().sub(cam.position);
      const len = dir.length();
      const yaw = Math.atan2(dir.x, dir.z) + C.uy, pitch = Math.asin(clamp(dir.y / len, -1, 1)) + C.up;
      cam.lookAt(cam.position.x + Math.sin(yaw) * Math.cos(pitch) * len, cam.position.y + Math.sin(pitch) * len, cam.position.z + Math.cos(yaw) * Math.cos(pitch) * len);
      cam.fov = C.fov * C.uz;
      if (Math.abs(C.shift) > 0.001 || Math.abs(C.shiftY) > 0.001) cam.setViewOffset(this.W, this.H, -C.shift * this.W, -C.shiftY * this.H, this.W, this.H);
      else cam.clearViewOffset();
    }
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2.5);
      const s = this.shake * 0.03;
      cam.position.x += (Math.random() - 0.5) * s; cam.position.y += (Math.random() - 0.5) * s;
    }
    cam.updateProjectionMatrix();
  }
  addShake(v = 1) { if (this.state?.settings.shake !== false) this.shake = Math.max(this.shake, v); }

  // ---------------------------------------------------------------- CHARACTER CONTROL
  stationOf(id) { return this.room.st[id]; }
  walkTo(x, z, ry) {
    return new Promise((res) => {
      if (this.charMode === 'sit' || this.charMode === 'lie') this.standUp();
      const p = this.char.root.position;
      this.path = (this.venue || this.room).nav.find(p.x, p.z, x, z).slice(1);
      this.pathRy = ry;
      this.pathDone = res;
      this.charMode = 'walk';
      this.char.play('walk');
      this.showMarker(x, z);
      if (!this.path.length) this.arrive();
    });
  }
  async goTo(id) {
    const st = this.stationOf(id);
    if (!st) return;
    await this.walkTo(st.x, st.z, st.ry);
  }
  arrive() {
    this.charMode = 'idle';
    this.char.play('idle');
    this.hideMarker();
    const done = this.pathDone; this.pathDone = null;
    if (done) {
      if (this.pathRy !== undefined) this.turnTo(this.pathRy).then(done);
      else done();
    }
  }
  turnTo(ry) {
    return new Promise((res) => { this.turnGoal = { ry, res }; });
  }
  async sitAtDesk() {
    if (this.charMode === 'sit') return;
    await this.goTo('desk');
    if (this.screens.surface('main').mode === 'off') {
      this.char.play('pressButton', { restart: true });
      bus.emit('sfx', 'power');
      await new Promise((r) => setTimeout(r, 650));
      this.powerOn();
    }
    const seat = this.room.st.desk.seat;
    const p = this.slideTo(seat.x, seat.z, seat.ry, 0.45);
    this.char.seatDrop = -0.24;
    this.char.play('sit', { blend: 7 });
    this.charMode = 'sit';
    if (this.room.chair) this.room.chair.rotation.y = 0;
    await p;
  }
  async lieDown() {
    await this.goTo('bed');
    const l = this.room.st.bed.lie;
    const p = this.slideTo(l.x, l.z, l.ry, 0.6, l.y);
    this.char.play('sleep', { blend: 5 });
    this.charMode = 'lie';
    await p;
    if (this.charMode === 'lie' && this.room.blanket) this.room.blanket.visible = true;
  }
  async sitSofa() {
    const st = this.room.st.sofa;
    if (!st) return;
    await this.goTo('sofa');
    this.slideTo(st.seat.x, st.seat.z, st.seat.ry, 0.45);
    this.char.seatDrop = -0.3;
    this.char.play('sit', { blend: 7 });
    this.charMode = 'sit';
  }
  powerOff() { for (const k of ['main', 'side', 'side2', 'laptop']) this.screens.setMode(k, 'off'); }
  powerOn() { this.screens.setMode('main', 'desktop'); this.screens.setMode('laptop', 'desktop'); this.screens.setMode('side', 'chat'); this.screens.setMode('side2', 'analytics'); }
  standUp() {
    if (this.slide) { const r = this.slide.res; this.slide = null; r && r(); }
    if (this.room?.blanket) this.room.blanket.visible = false;
    if (this.charMode === 'sit' || this.charMode === 'lie') {
      const p = this.char.root.position;
      const back = this.charMode === 'lie' ? this.room.st.bed : null;
      if (back) this.char.root.position.set(back.x, 0, back.z);
      else {
        const ry = this.char.root.rotation.y;
        p.x -= Math.sin(ry) * 0.35; p.z -= Math.cos(ry) * 0.35;
      }
      this.char.root.position.y = 0;
      this.charMode = 'idle';
      this.char.play('idle');
    }
  }
  slideTo(x, z, ry, dur, y = 0) {
    if (this.slide?.res) this.slide.res();
    return new Promise((res) => { this.slide = { from: this.char.root.position.clone(), to: V3(x, y, z), fromRy: this.char.root.rotation.y, ry, t: 0, dur, res }; });
  }
  updateChar(dt) {
    const c = this.char, root = c.root;
    const s = this.state;
    const tired = clamp((35 - s.needs.energy) / 35, 0, 1);
    c.tired = damp(c.tired, tired, 2, dt);
    if (this.slide) {
      const sl = this.slide;
      sl.t += dt / sl.dur;
      const k = Math.min(1, sl.t);
      const e = k * k * (3 - 2 * k);
      root.position.lerpVectors(sl.from, sl.to, e);
      root.rotation.y = lerpAngle(sl.fromRy, sl.ry, e);
      if (k >= 1) { const r = sl.res; this.slide = null; r && r(); }
    }
    if (this.charMode === 'walk') {
      const target = this.path[0];
      if (!target) { this.arrive(); }
      else {
        const dx = target[0] - root.position.x, dz = target[1] - root.position.z;
        const d = Math.hypot(dx, dz);
        const speed = lerp(1.65, 1.0, c.tired);
        c.speed = speed;
        if (d < 0.06) { this.path.shift(); if (!this.path.length) { root.position.x = target[0]; root.position.z = target[1]; this.arrive(); } }
        else {
          const step = Math.min(d, speed * dt);
          root.position.x += (dx / d) * step; root.position.z += (dz / d) * step;
          const yaw = Math.atan2(dx, dz);
          root.rotation.y = dampAngle(root.rotation.y, yaw, 10, dt);
          this.stepT = (this.stepT || 0) + dt * speed;
          if (this.stepT > 0.42) { this.stepT = 0; bus.emit('sfx', 'step'); }
        }
      }
    }
    if (this.turnGoal) {
      root.rotation.y = dampAngle(root.rotation.y, this.turnGoal.ry, 9, dt);
      if (Math.abs(angDiff(root.rotation.y, this.turnGoal.ry)) < 0.05) { const r = this.turnGoal.res; this.turnGoal = null; r(); }
    }
    // idle life
    if (this.charMode === 'idle' && !this.busy) {
      this.idleT += dt;
      if (this.idleT > 7) {
        this.idleT = 0;
        const roll = Math.random();
        if (c.tired > 0.6) this.playOnce('yawn', 2.2);
        else if (roll < 0.3) this.playOnce('look', 3);
        else if (roll < 0.45) { c.showProp('phone'); this.playOnce('phone', 3, () => c.showProp(null)); }
        else if (roll < 0.55 && s.needs.energy > 70) this.playOnce('dance', 2.5);
      }
    } else this.idleT = 0;
    if (this.charMode === 'sit' && !this.busy) {
      this.idleT += dt;
      if (this.idleT > 8 && c.clip === 'sit') { this.idleT = 0; this.playOnce(c.tired > 0.6 ? 'sitPhone' : 'sitType', 3); }
    }
    c.update(dt);
  }
  playOnce(clip, dur, done) {
    const prev = this.char.clip;
    this.char.play(clip, { restart: true });
    clearTimeout(this._once);
    this._once = setTimeout(() => {
      if (this.char.clip === clip) this.char.play(this.charMode === 'sit' ? 'sit' : this.charMode === 'walk' ? 'walk' : 'idle');
      done && done();
    }, dur * 1000);
  }

  makeMarker() {
    const g = new THREE.Group();
    const m = mat(this.state.profile.accent, { emissive: this.state.profile.accent, ei: 1.5, transparent: true, opacity: 0.85 });
    const r = torus(0.18, 0.015, m, PI * 2, 6, 40);
    r.rotation.x = -PI / 2;
    g.add(r);
    g.visible = false;
    this.scene.add(g);
    return g;
  }
  showMarker(x, z) { this.marker.position.set(x, 0.02, z); this.marker.visible = true; this.marker.userData.t = 0; }
  hideMarker() { this.marker.visible = false; }

  // ---------------------------------------------------------------- PICKING
  setupPicking() {
    this.ray = new THREE.Raycaster();
    this.ptr = new THREE.Vector2();
    this.floorPlane = new THREE.Plane(V3(0, 1, 0), 0);
    let down = null;
    const el = this.canvas;
    const pointers = new Map();
    let pinch0 = 0, zoom0 = 1;
    el.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = this.camUser.zoom; down = null; return; }
      down = { x: e.clientX, y: e.clientY, t: performance.now(), yaw: this.camUser.yaw, pitch: this.camUser.pitch, moved: false };
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0 > 0 && this.lookable()) this.camUser.zoom = clamp(zoom0 * (pinch0 / d), 0.6, 1.12);
        return;
      }
      if (down) {
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        if (Math.hypot(dx, dy) > 8) down.moved = true;
        if (down.moved && this.lookable() && this.inputEnabled) {
          this.camUser.yaw = clamp(down.yaw + dx * 0.0032, -0.62, 0.62);
          this.camUser.pitch = clamp(down.pitch + dy * 0.0026, -0.28, 0.32);
        }
      } else if (e.pointerType === 'mouse') this.hover(e);
    });
    const up = (e) => {
      pointers.delete(e.pointerId);
      if (down && !down.moved && performance.now() - down.t < 600) this.click(e);
      down = null;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); down = null; });
    el.addEventListener('wheel', (e) => {
      if (!this.lookable() || !this.inputEnabled) return;
      this.camUser.zoom = clamp(this.camUser.zoom * (1 + Math.sign(e.deltaY) * 0.07), 0.6, 1.12);
      e.preventDefault();
    }, { passive: false });
  }
  lookable() { return this.shotName === 'room' || this.shotName === 'venue'; }
  setPtr(e) {
    const r = this.canvas.getBoundingClientRect();
    this.ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ptr, this.camera);
  }
  pickInteract() {
    if (!this._meInteract) { this.char.root.userData.interact = 'me'; this._meInteract = { id: 'me', obj: this.char.root, label: 'You', icon: 'user' }; }
    const area = this.venue || this.room;
    const objs = [...area.interact.map((i) => i.obj), this.char.root];
    const hits = this.ray.intersectObjects(objs, true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.interact) o = o.parent;
      if (o) return o === this.char.root ? this._meInteract : area.interact.find((i) => i.obj === o);
    }
    return null;
  }
  hover(e) {
    if (!this.inputEnabled) { this.canvas.style.cursor = ''; bus.emit('world:hover', null); return; }
    this.setPtr(e);
    const it = this.pickInteract();
    this.canvas.style.cursor = it ? 'pointer' : '';
    if (it !== this.hovered) { this.hovered = it; bus.emit('world:hover', it); }
  }
  click(e) {
    if (!this.inputEnabled) return;
    this.setPtr(e);
    const it = this.pickInteract();
    if (it) { bus.emit('world:pick', it.id); return; }
    const p = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(this.floorPlane, p)) {
      const r = this.venue || this.room;
      if (Math.abs(p.x) < r.W / 2 - 0.2 && Math.abs(p.z) < r.D / 2 - 0.2) bus.emit('world:floor', { x: p.x, z: p.z });
    }
  }
  toScreen(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.W, y: (-p.y * 0.5 + 0.5) * this.H, visible: p.z < 1 && p.z > -1 };
  }
  objTop(obj, add = 0.25) {
    // cached for a short time: Box3 over big groups is costly to recompute every frame
    const c = obj.userData._top, now = this.clock;
    if (!c || now - c.t > 0.3) {
      const box = new THREE.Box3().setFromObject(obj);
      obj.userData._top = { t: now, v: V3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2) };
    }
    const v = obj.userData._top.v;
    return V3(v.x, v.y + add, v.z);
  }

  // ---------------------------------------------------------------- PORTRAIT / SNAPSHOT
  readRT(rt, w, h, exposure = 1.1) {
    const buf = new Uint16Array(w * h * 4);
    this.renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const half = THREE.DataUtils.fromHalfFloat;
    const tm = (x) => { x *= exposure; x = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); x = Math.min(1, Math.max(0, x)); return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; };
    for (let y = 0; y < h; y++) {
      const src = (h - 1 - y) * w * 4, dst = y * w * 4;
      for (let x = 0; x < w * 4; x += 4) {
        const a = Math.min(1, Math.max(0, half(buf[src + x + 3])));
        const inv = a > 0.001 ? 1 / a : 0;
        d[dst + x] = tm(half(buf[src + x]) * inv) * 255;
        d[dst + x + 1] = tm(half(buf[src + x + 1]) * inv) * 255;
        d[dst + x + 2] = tm(half(buf[src + x + 2]) * inv) * 255;
        d[dst + x + 3] = a * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  rt(w, h) {
    this._rts = this._rts || {};
    const k = w + 'x' + h;
    if (!this._rts[k]) this._rts[k] = new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.HalfFloatType });
    return this._rts[k];
  }
  portrait(expr = 'happy', size = 256, clip = 'idle', profile = null) {
    if (!this.portraitScene) {
      this.portraitScene = new THREE.Scene();
      this.portraitScene.environment = this.scene.environment;
      this.portraitScene.environmentIntensity = 0.5;
      this.portraitScene.add(new THREE.HemisphereLight('#ffffff', '#6a5a8a', 1.3));
      const d = new THREE.DirectionalLight('#fff4e8', 2.6); d.position.set(1.5, 2, 3); this.portraitScene.add(d);
      const rim = new THREE.DirectionalLight('#9fb8ff', 2.0); rim.position.set(-2, 1.5, -1.5); this.portraitScene.add(rim);
      this.portraitCam = new THREE.PerspectiveCamera(24, 1, 0.05, 20);
    }
    const prof = profile || this.state.profile;
    const key = JSON.stringify(prof);
    if (!this.portraitChar || this.portraitChar._key !== key) {
      if (this.portraitChar) this.portraitScene.remove(this.portraitChar.root);
      this.portraitChar = new Character(prof);
      this.portraitChar._key = key;
      this.portraitScene.add(this.portraitChar.root);
    }
    const pc = this.portraitChar;
    pc.play(clip, { restart: true });
    pc.setExpression(expr);
    pc.blendK = 1000;
    for (let i = 0; i < 4; i++) pc.update(0.05);
    pc.blink = 0; pc.blinkT = 99;
    pc.eyes.forEach((e) => (e.g.scale.y = expr === 'laugh' ? 0.25 : expr === 'happy' ? 0.85 : expr === 'shocked' ? 1.2 : 1));
    pc.root.rotation.y = expr === 'cool' ? -0.35 : 0.3;
    pc.root.updateMatrixWorld(true);
    const hc = new THREE.Vector3(); pc.hc.getWorldPosition(hc);
    const full = clip !== 'idle';
    this.portraitCam.fov = full ? 34 : 24;
    this.portraitCam.updateProjectionMatrix();
    if (full) { this.portraitCam.position.set(hc.x + 0.3, hc.y - 0.3, hc.z + 3.2); this.portraitCam.lookAt(hc.x, hc.y - 0.55, hc.z); }
    else { this.portraitCam.position.set(hc.x + 0.12, hc.y + 0.02, hc.z + 1.6); this.portraitCam.lookAt(hc.x, hc.y - 0.1, hc.z); }
    const r = this.renderer, rt = this.rt(size, size);
    const prevT = r.getRenderTarget();
    r.setRenderTarget(rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(this.portraitScene, this.portraitCam);
    r.setRenderTarget(prevT);
    r.setClearColor(0x000000, 1);
    return this.readRT(rt, size, size, 1.0);
  }
  snapshot(kind = 'desk', w = 384, h = 288) {
    const cam = new THREE.PerspectiveCamera(42, w / h, 0.05, 100);
    cam.layers.enable(1);
    const dd = this.room.deskDims;
    if (kind === 'desk') { cam.position.set(dd.x + 1.3, dd.H + 0.85, dd.z + 1.9); cam.lookAt(dd.x - 0.1, dd.H + 0.35, dd.z); }
    else { const r = this.room; cam.position.set(r.W * 0.42, 2.4, r.D * 0.55); cam.lookAt(-r.W * 0.1, 0.8, -r.D * 0.15); }
    const r = this.renderer, rt = this.rt(w, h);
    const prevT = r.getRenderTarget();
    r.setRenderTarget(rt); r.clear(); r.render(this.scene, cam); r.setRenderTarget(prevT);
    return this.readRT(rt, w, h, this.renderer.toneMappingExposure);
  }

  // ---------------------------------------------------------------- LOOP
  update(dt) {
    this.clock += dt;
    this.updateChar(dt);
    if (this.venue) this.venue.update(dt, this.char.root.position);
    else this.room.update(dt);
    this.screens.update(dt);
    this.vfx.update(dt);
    if (this.marker.visible) { this.marker.userData.t += dt; const s = 1 + Math.sin(this.marker.userData.t * 6) * 0.1; this.marker.scale.set(s, 1, s); }
    // monitor light flicker follows content
    const scrOn = this.screens.surfaces.get('main')?.mode !== 'off';
    this.screenLight.visible = scrOn;
    if (this.screens.data.fx.hit > 0) this.screenLight.intensity = 1.2 + this.screens.data.fx.hit * 2;
    if (this.shotName === 'stream' && this.fixedCam) this.fixedCam.look.copy(this.headWorld().add(V3(0, -0.12, 0)));
    this.updateCamera(dt);
  }
  render() {
    if (this.useComposer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}

function angDiff(a, b) { let d = b - a; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; return d; }
function dampAngle(a, b, k, dt) { return a + angDiff(a, b) * (1 - Math.exp(-k * dt)); }
function lerpAngle(a, b, t) { return a + angDiff(a, b) * t; }
