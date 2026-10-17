// Lightweight sprite particle system + 3D confetti for celebrations.
import * as THREE from '../../vendor/three/three.module.min.js';

function spriteTex(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  x.translate(32, 32);
  const glowDot = (col) => { const g = x.createRadialGradient(0, 0, 2, 0, 0, 30); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 30, 0, Math.PI * 2); x.fill(); };
  if (kind === 'heart') { x.fillStyle = '#ff4f8b'; x.beginPath(); x.moveTo(0, 18); x.bezierCurveTo(-30, -2, -14, -26, 0, -10); x.bezierCurveTo(14, -26, 30, -2, 0, 18); x.fill(); x.fillStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.arc(-9, -8, 4, 0, 7); x.fill(); }
  else if (kind === 'plus') { x.fillStyle = '#9dff5a'; x.fillRect(-6, -20, 12, 40); x.fillRect(-20, -6, 40, 12); }
  else if (kind === 'star') { x.fillStyle = '#ffd54a'; x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 10 : 24, a = i * Math.PI / 5 - Math.PI / 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.fill(); }
  else if (kind === 'coin') { x.fillStyle = '#ffcc33'; x.beginPath(); x.arc(0, 0, 22, 0, 7); x.fill(); x.fillStyle = '#ffe28a'; x.beginPath(); x.arc(-4, -4, 14, 0, 7); x.fill(); x.fillStyle = '#d99a14'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 1, 2); }
  else if (kind === 'z') { x.fillStyle = '#cfd8ff'; x.font = 'bold 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('z', 0, 2); }
  else if (kind === 'steam') { glowDot('rgba(255,255,255,0.55)'); }
  else if (kind === 'spark') { glowDot('rgba(255,255,255,1)'); x.fillStyle = '#fff'; x.fillRect(-1.5, -26, 3, 52); x.fillRect(-26, -1.5, 52, 3); }
  else if (kind === 'thumb') { x.fillStyle = '#2fd6ff'; x.beginPath(); x.roundRect(-18, -4, 12, 24, 3); x.fill(); x.beginPath(); x.roundRect(-4, -4, 24, 24, 6); x.fill(); x.beginPath(); x.roundRect(-2, -24, 10, 24, 5); x.fill(); }
  else if (kind === 'music') { x.fillStyle = '#b48cff'; x.beginPath(); x.ellipse(-8, 14, 10, 8, -0.4, 0, 7); x.fill(); x.fillRect(0, -22, 4, 36); x.fillRect(0, -22, 16, 6); }
  else glowDot('#fff');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class VFX {
  constructor(scene) {
    this.scene = scene;
    this.tex = {};
    this.parts = [];
    this.pool = [];
    for (const k of ['heart', 'plus', 'star', 'coin', 'z', 'steam', 'spark', 'thumb', 'music']) this.tex[k] = spriteTex(k);
    // confetti
    const N = 260;
    const geo = new THREE.PlaneGeometry(0.05, 0.08);
    this.conf = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), N);
    this.conf.frustumCulled = false;
    this.confData = Array.from({ length: N }, () => ({ alive: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), rv: new THREE.Vector3() }));
    const col = new THREE.Color();
    const pal = ['#ff4f8b', '#2fd6ff', '#9dff5a', '#ffd54a', '#b48cff', '#ffffff'];
    for (let i = 0; i < N; i++) { col.set(pal[i % pal.length]); this.conf.setColorAt(i, col); this.conf.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); }
    scene.add(this.conf);
    this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.s1 = new THREE.Vector3(1, 1, 1);
  }
  sprite(kind) {
    let s = this.pool.pop();
    if (!s) { s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, toneMapped: false })); }
    s.material.map = this.tex[kind] || this.tex.spark;
    s.material.needsUpdate = true;
    s.material.opacity = 1;
    s.material.rotation = 0;
    this.scene.add(s);
    return s;
  }
  emit(kind, pos, opts = {}) {
    const n = opts.count || 1;
    for (let i = 0; i < n; i++) {
      const s = this.sprite(kind);
      s.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * (opts.spread ?? 0.3), (Math.random() - 0.5) * (opts.spreadY ?? 0.1), (Math.random() - 0.5) * (opts.spread ?? 0.3)));
      const size = (opts.size ?? 0.14) * (0.8 + Math.random() * 0.4);
      s.scale.setScalar(size);
      const v = opts.vel ? opts.vel.clone() : new THREE.Vector3(0, 0.5, 0);
      v.x += (Math.random() - 0.5) * (opts.jitter ?? 0.3); v.z += (Math.random() - 0.5) * (opts.jitter ?? 0.3); v.y += Math.random() * (opts.jitterY ?? 0.2);
      this.parts.push({ s, v, life: opts.life ?? 1.4, max: opts.life ?? 1.4, size, grav: opts.grav ?? 0, grow: opts.grow ?? 0, delay: (opts.stagger ?? 0) * i, wobble: opts.wobble ?? 0 });
      if (opts.stagger) s.visible = false;
    }
  }
  confetti(pos, n = 120, power = 2.6) {
    let k = 0;
    for (const c of this.confData) {
      if (c.alive > 0) continue;
      c.alive = 3 + Math.random();
      c.p.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3));
      const a = Math.random() * Math.PI * 2, sp = power * (0.4 + Math.random() * 0.6);
      c.v.set(Math.cos(a) * sp * 0.45, power * (0.8 + Math.random() * 0.6), Math.sin(a) * sp * 0.45);
      c.rv.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
      if (++k >= n) break;
    }
  }
  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      if (p.delay > 0) { p.delay -= dt; if (p.delay <= 0) p.s.visible = true; else continue; }
      p.life -= dt;
      if (p.life <= 0) { this.scene.remove(p.s); this.pool.push(p.s); this.parts.splice(i, 1); continue; }
      p.v.y -= p.grav * dt;
      p.s.position.addScaledVector(p.v, dt);
      if (p.wobble) p.s.position.x += Math.sin(p.life * 8) * p.wobble * dt;
      const k = p.life / p.max;
      p.s.material.opacity = Math.min(1, k * 2.2);
      p.s.scale.setScalar(p.size * (1 + (1 - k) * p.grow));
    }
    let any = false;
    for (let i = 0; i < this.confData.length; i++) {
      const c = this.confData[i];
      if (c.alive <= 0) continue;
      any = true;
      c.alive -= dt;
      c.v.y -= 4.5 * dt; c.v.multiplyScalar(1 - 1.6 * dt);
      if (c.p.y < 0.02) { c.p.y = 0.02; c.v.set(0, 0, 0); c.rv.multiplyScalar(0.5); }
      c.p.addScaledVector(c.v, dt);
      c.r.x += c.rv.x * dt; c.r.y += c.rv.y * dt; c.r.z += c.rv.z * dt;
      this.q.setFromEuler(c.r);
      const sc = c.alive > 0 ? Math.min(1, c.alive * 2) : 0;
      this.m4.compose(c.p, this.q, this.s1.set(sc, sc, sc));
      this.conf.setMatrixAt(i, this.m4);
    }
    if (any || this._confAny) { this.conf.instanceMatrix.needsUpdate = true; }
    this._confAny = any;
  }
}
