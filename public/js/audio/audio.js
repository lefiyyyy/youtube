// Procedural audio: synthesized SFX + generative lo-fi / synthwave music. No external files.
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const CHORDS = {
  chill: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59], [45, 48, 52, 55], [50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59]],
  night: [[45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 53], [40, 43, 47, 50]],
  live: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
};
const PENTA = [72, 74, 76, 79, 81, 84];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.vol = { music: 0.55, sfx: 0.8 };
    this.mode = 'chill';
    this.started = false;
  }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain(); this.master.gain.value = 0.9;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.vol.music * 0.5;
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.vol.sfx;
    this.musicBus.connect(this.master); this.sfxBus.connect(this.master);
    // reverb
    this.verb = c.createConvolver();
    this.verb.buffer = this.impulse(2.2, 2.8);
    this.verbIn = c.createGain(); this.verbIn.gain.value = 0.32;
    this.verbIn.connect(this.verb); this.verb.connect(this.master);
    // music lowpass (muffle when in menus)
    this.musicLP = c.createBiquadFilter(); this.musicLP.type = 'lowpass'; this.musicLP.frequency.value = 18000;
    this.musicLP.connect(this.musicBus);
    this.noiseBuf = this.makeNoise(2);
    this.startMusic();
    this.startAmbience();
  }
  impulse(sec, decay) {
    const c = this.ctx, len = c.sampleRate * sec, b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  makeNoise(sec) {
    const c = this.ctx, b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  setVolumes(music, sfx) {
    this.vol = { music, sfx };
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(music * 0.5, this.ctx.currentTime, 0.1);
    this.sfxBus.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
    this.ambGain?.gain.setTargetAtTime(sfx * 0.05, this.ctx.currentTime, 0.2);
  }
  muffle(on) { if (this.ctx) this.musicLP.frequency.setTargetAtTime(on ? 1100 : 18000, this.ctx.currentTime, 0.25); }

  // ---------------------------------------------------------------- primitives
  osc(type, f0, f1, t0, dur, gain, dest, opts = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + (opts.glide ?? dur));
    if (opts.detune) o.detune.value = opts.detune;
    const a = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = o;
    if (opts.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.lp; o.connect(f); node = f; }
    node.connect(g); g.connect(dest || this.sfxBus);
    if (opts.verb) { const s = c.createGain(); s.gain.value = opts.verb; g.connect(s); s.connect(this.verbIn); }
    o.start(t0); o.stop(t0 + dur + 0.05);
    return o;
  }
  noise(t0, dur, gain, { type = 'bandpass', f = 2000, q = 1, f1, dest, attack = 0.002, verb } = {}) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true;
    fl.type = type; fl.frequency.setValueAtTime(f, t0); fl.Q.value = q;
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfxBus);
    if (verb) { const v = c.createGain(); v.gain.value = verb; g.connect(v); v.connect(this.verbIn); }
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }

  // ---------------------------------------------------------------- SFX
  sfx(name, v = 1) {
    if (!this.ctx || this.vol.sfx <= 0) return;
    const t = this.ctx.currentTime + 0.005;
    const O = (...a) => this.osc(...a);
    switch (name) {
      case 'click': O('sine', 1400, 900, t, 0.06, 0.18 * v); break;
      case 'tab': O('sine', 900, 1300, t, 0.07, 0.12); break;
      case 'open': this.noise(t, 0.22, 0.05, { f: 600, f1: 3000, q: 0.8 }); O('sine', 520, 880, t, 0.16, 0.08); break;
      case 'close': this.noise(t, 0.18, 0.04, { f: 2500, f1: 500, q: 0.8 }); O('sine', 760, 480, t, 0.12, 0.06); break;
      case 'pop': O('sine', 420 + Math.random() * 80, 1200, t, 0.09, 0.16 * v, null, { glide: 0.06 }); break;
      case 'coin': O('triangle', 988, 988, t, 0.08, 0.12 * v); O('triangle', 1319, 1319, t + 0.06, 0.22, 0.12 * v, null, { verb: 0.3 }); break;
      case 'cash': this.noise(t, 0.12, 0.12, { f: 5000, q: 2 }); O('triangle', 1568, 1568, t + 0.04, 0.4, 0.12, null, { verb: 0.4 }); O('triangle', 2093, 2093, t + 0.1, 0.5, 0.1, null, { verb: 0.4 }); break;
      case 'notify': O('triangle', 1319, 1319, t, 0.18, 0.1, null, { verb: 0.4 }); O('triangle', 1976, 1976, t + 0.09, 0.3, 0.09, null, { verb: 0.4 }); break;
      case 'chat': O('sine', 1900 + Math.random() * 400, 2400, t, 0.03, 0.025 * v); break;
      case 'type': for (let i = 0; i < 3; i++) { const tt = t + i * (0.05 + Math.random() * 0.04); this.noise(tt, 0.03, 0.05 * v, { f: 3500 + Math.random() * 2500, q: 1.5 }); this.noise(tt, 0.04, 0.04 * v, { type: 'lowpass', f: 400 }); } break;
      case 'mouse': this.noise(t, 0.02, 0.06, { f: 4500, q: 3 }); break;
      case 'step': this.noise(t, 0.08, 0.035 * v, { type: 'lowpass', f: 180 }); break;
      case 'perfect': O('sine', 1760, 1760, t, 0.25, 0.14, null, { verb: 0.5 }); O('sine', 2637, 2637, t + 0.03, 0.3, 0.08, null, { verb: 0.5 }); break;
      case 'good': O('sine', 1319, 1319, t, 0.18, 0.12, null, { verb: 0.3 }); break;
      case 'miss': O('square', 140, 90, t, 0.16, 0.05, null, { lp: 800 }); break;
      case 'blooper': O('sine', 600, 200, t, 0.25, 0.12); O('sine', 300, 120, t + 0.12, 0.25, 0.1); break;
      case 'cut': this.noise(t, 0.06, 0.12, { f: 3200, q: 4 }); O('sine', 900, 300, t, 0.1, 0.08); break;
      case 'error': O('square', 330, 330, t, 0.1, 0.05, null, { lp: 1200 }); O('square', 247, 247, t + 0.11, 0.16, 0.05, null, { lp: 1200 }); break;
      case 'shutter': this.noise(t, 0.04, 0.25, { f: 3000, q: 0.7 }); this.noise(t + 0.07, 0.05, 0.2, { f: 2200, q: 0.7 }); O('sine', 2400, 1200, t, 0.04, 0.06); break;
      case 'fridge': this.noise(t, 0.3, 0.06, { type: 'lowpass', f: 300 }); this.noise(t + 0.05, 0.4, 0.03, { f: 900, f1: 400, q: 0.6 }); break;
      case 'crunch': for (let i = 0; i < 4; i++) this.noise(t + i * 0.22 + Math.random() * 0.05, 0.08, 0.09, { f: 1800 + Math.random() * 1500, q: 0.8 }); break;
      case 'slurp': for (let i = 0; i < 3; i++) O('sine', 300, 700, t + i * 0.3, 0.18, 0.06, null, { glide: 0.15 }); break;
      case 'gulp': for (let i = 0; i < 3; i++) O('sine', 180, 90, t + i * 0.28, 0.14, 0.12); break;
      case 'can': this.noise(t, 0.12, 0.15, { f: 4000, f1: 1500, q: 1 }); this.noise(t + 0.1, 0.5, 0.05, { f: 6000, q: 0.5 }); break;
      case 'ding': O('sine', 1975, 1975, t, 0.9, 0.12, null, { verb: 0.5 }); O('sine', 2960, 2960, t, 0.6, 0.04, null, { verb: 0.5 }); break;
      case 'doorbell': O('sine', 1318, 1318, t, 0.6, 0.14, null, { verb: 0.5 }); O('sine', 1046, 1046, t + 0.4, 0.9, 0.14, null, { verb: 0.5 }); break;
      case 'door': this.noise(t, 0.4, 0.05, { type: 'lowpass', f: 500 }); O('sine', 180, 120, t, 0.25, 0.05); break;
      case 'buy': this.sfx('cash'); this.sfx('sparkle'); break;
      case 'sparkle': for (let i = 0; i < 6; i++) O('sine', 2000 + i * 300 + Math.random() * 200, 2600 + i * 300, t + i * 0.045, 0.2, 0.04, null, { verb: 0.6 }); break;
      case 'place': this.noise(t, 0.25, 0.05, { f: 500, f1: 2500 }); O('sine', 300, 700, t + 0.15, 0.15, 0.14, null, { glide: 0.08 }); this.sfx('sparkle'); break;
      case 'levelup': [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => O('triangle', NOTE(n), NOTE(n), t + i * 0.07, 0.5, 0.1, null, { verb: 0.5 })); [72, 76, 79].forEach((n) => O('sawtooth', NOTE(n), NOTE(n), t + 0.55, 1.2, 0.03, null, { lp: 2400, verb: 0.6, attack: 0.05 })); this.sfx('sparkle'); break;
      case 'viral': this.noise(t, 0.9, 0.08, { f: 300, f1: 6000, q: 0.7, attack: 0.6 }); [72, 79, 84, 88].forEach((n, i) => O('square', NOTE(n), NOTE(n), t + 0.85 + i * 0.06, 0.6, 0.04, null, { lp: 3500, verb: 0.5 })); this.kick(t + 0.85, 0.5); this.noise(t + 0.85, 1.2, 0.1, { type: 'highpass', f: 4000, verb: 0.5 }); break;
      case 'stinger': this.noise(t, 1.0, 0.07, { f: 400, f1: 7000, q: 0.8, attack: 0.8 }); this.kick(t + 0.95, 0.6); this.noise(t + 0.95, 1.0, 0.09, { type: 'highpass', f: 5000, verb: 0.6 }); [57, 64, 69, 72].forEach((n) => O('sawtooth', NOTE(n), NOTE(n), t + 0.95, 0.9, 0.035, null, { lp: 3000, verb: 0.5 })); break;
      case 'donation': [76, 79, 84].forEach((n, i) => O('triangle', NOTE(n), NOTE(n), t + i * 0.08, 0.35, 0.1, null, { verb: 0.4 })); this.sfx('coin'); break;
      case 'sub': [67, 71, 74, 79].forEach((n, i) => O('triangle', NOTE(n), NOTE(n), t + i * 0.06, 0.3, 0.08, null, { verb: 0.4 })); break;
      case 'crowd': this.noise(t, 1.6, 0.06 * v, { f: 900, q: 0.4, attack: 0.3, verb: 0.3 }); this.noise(t + 0.1, 1.3, 0.04 * v, { f: 2200, q: 0.6, attack: 0.2 }); break;
      case 'boo': this.noise(t, 0.8, 0.05, { f: 300, q: 1.5, attack: 0.2 }); break;
      case 'qte': O('sine', 600, 1200, t, 0.08, 0.08); break;
      case 'whoosh': this.noise(t, 0.35, 0.07, { f: 400, f1: 2500, q: 0.7, attack: 0.15 }); break;
      case 'reward': this.sfx('sparkle'); [72, 76, 79, 84].forEach((n, i) => O('triangle', NOTE(n), NOTE(n), t + i * 0.09, 0.45, 0.1, null, { verb: 0.5 })); break;
      case 'quest': [79, 84].forEach((n, i) => O('triangle', NOTE(n), NOTE(n), t + i * 0.1, 0.4, 0.1, null, { verb: 0.5 })); break;
      case 'sleep': [76, 72, 69, 64, 60].forEach((n, i) => O('sine', NOTE(n), NOTE(n), t + i * 0.3, 0.9, 0.07, null, { verb: 0.7, attack: 0.05 })); break;
      case 'wake': [60, 64, 67, 72].forEach((n, i) => O('sine', NOTE(n), NOTE(n), t + i * 0.12, 0.6, 0.07, null, { verb: 0.5 })); break;
      case 'yawn': O('sine', 300, 180, t, 0.9, 0.03, null, { lp: 600, attack: 0.2 }); break;
      case 'power': O('sine', 200, 900, t, 0.3, 0.07); this.noise(t + 0.1, 0.3, 0.02, { f: 6000, q: 2 }); break;
    }
  }
  kick(t, g = 0.5, dest) { this.osc('sine', 150, 42, t, 0.32, g, dest || this.sfxBus, { glide: 0.12 }); }
  loop(name) {
    // returns stopper for sustained sounds
    if (!this.ctx) return () => {};
    const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(), g = c.createGain();
    if (name === 'sizzle') { f.type = 'bandpass'; f.frequency.value = 3500; f.Q.value = 0.6; g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.06, t + 0.3); }
    else if (name === 'hum') { f.type = 'lowpass'; f.frequency.value = 160; g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.12, t + 0.2); }
    else if (name === 'typing') { return this.typingLoop(); }
    s.connect(f); f.connect(g); g.connect(this.sfxBus);
    s.start();
    let crackle;
    if (name === 'sizzle') crackle = setInterval(() => this.noise(this.ctx.currentTime, 0.02, 0.05, { f: 6000, q: 2 }), 90);
    return () => { clearInterval(crackle); g.gain.setTargetAtTime(0.0001, c.currentTime, 0.08); s.stop(c.currentTime + 0.5); };
  }
  typingLoop() {
    let on = true;
    const tick = () => { if (!on) return; this.noise(this.ctx.currentTime, 0.025, 0.04, { f: 3000 + Math.random() * 3000, q: 1.5 }); if (Math.random() < 0.3) this.noise(this.ctx.currentTime, 0.03, 0.03, { type: 'lowpass', f: 380 }); setTimeout(tick, 60 + Math.random() * 110); };
    tick();
    return () => { on = false; };
  }

  // ---------------------------------------------------------------- AMBIENCE
  startAmbience() {
    const c = this.ctx;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    this.ambGain = c.createGain(); this.ambGain.gain.value = this.vol.sfx * 0.05;
    s.connect(f); f.connect(this.ambGain); this.ambGain.connect(this.master);
    s.start();
  }

  // ---------------------------------------------------------------- MUSIC
  setMusic(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.bar = 0;
  }
  startMusic() {
    this.bar = 0; this.step = 0;
    this.nextT = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 30);
    this.crackleT = setInterval(() => { if (this.mode !== 'live' && this.vol.music > 0) this.noise(this.ctx.currentTime, 0.008, 0.04 * Math.random(), { f: 5000 + Math.random() * 4000, q: 2, dest: this.musicLP }); }, 140);
  }
  schedule() {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    if (this.nextT < c.currentTime - 0.2) this.nextT = c.currentTime + 0.05; // resume without a catch-up burst
    while (this.nextT < c.currentTime + 0.15) {
      const live = this.mode === 'live';
      const bpm = live ? 118 : this.mode === 'night' ? 74 : 82;
      const sixteenth = 60 / bpm / 4;
      this.playStep(this.step, this.nextT, live, sixteenth);
      let dt = sixteenth;
      if (!live) dt *= this.step % 2 === 0 ? 1.14 : 0.86; // swing
      this.nextT += dt;
      this.step = (this.step + 1) % 16;
      if (this.step === 0) this.bar++;
    }
  }
  playStep(st, t, live, sx) {
    const D = this.musicLP;
    const prog = live ? CHORDS.live : this.mode === 'night' ? CHORDS.night : CHORDS.chill;
    const chord = prog[this.bar % prog.length];
    const hat = (g) => this.noise(t, 0.04, g, { type: 'highpass', f: 7000, dest: D });
    if (!live) {
      // lo-fi: kick, rim snare, swung hats, EP chords, bass, sparse melody
      if (st === 0 || st === 10 || (st === 7 && this.bar % 2)) this.kick(t, 0.32, D);
      if (st === 4 || st === 12) { this.noise(t, 0.12, 0.09, { f: 1800, q: 0.9, dest: D }); this.osc('triangle', 220, 160, t, 0.08, 0.05, D); }
      if (st % 2 === 0) hat(st % 4 === 2 ? 0.03 : 0.018);
      if (st === 0 || (st === 11 && this.bar % 2 === 0)) {
        chord.forEach((n, i) => {
          const tt = t + i * 0.022;
          this.osc('sine', NOTE(n + 12), NOTE(n + 12), tt, 2.4, 0.045, D, { attack: 0.01, verb: 0.35 });
          this.osc('triangle', NOTE(n + 12), NOTE(n + 12), tt, 1.2, 0.018, D, { attack: 0.01, detune: 7, lp: 2200 });
        });
      }
      if (st === 0 || st === 6 || (st === 10 && this.bar % 2)) this.osc('triangle', NOTE(chord[0] - 12), NOTE(chord[0] - 12), t, sx * 5, 0.13, D, { lp: 420, attack: 0.01 });
      if (st % 2 === 0 && (this.bar % 4 === 1 || this.bar % 4 === 3) && Math.random() < 0.3) {
        const n = PENTA[Math.floor(Math.random() * PENTA.length)];
        this.osc('sine', NOTE(n), NOTE(n), t, 0.9, 0.035, D, { verb: 0.6, attack: 0.008 });
      }
    } else {
      // synthwave: 4-floor, clap, offbeat hats, saw bass, arp
      if (st % 4 === 0) this.kick(t, 0.45, D);
      if (st === 4 || st === 12) this.noise(t, 0.16, 0.1, { f: 1400, q: 0.7, dest: D, verb: 0.3 });
      if (st % 4 === 2) hat(0.04); else if (st % 2 === 1) hat(0.012);
      const root = chord[0] - 24;
      if (st % 2 === 0) this.osc('sawtooth', NOTE(root + (st % 8 === 6 ? 12 : 0)), NOTE(root), t, sx * 1.8, 0.07, D, { lp: 700, attack: 0.005 });
      const arpN = chord[[0, 1, 2, 1][st % 4]] + (st >= 8 ? 12 : 0);
      this.osc('square', NOTE(arpN + 12), NOTE(arpN + 12), t, sx * 0.9, 0.022, D, { lp: 2600, verb: 0.3 });
      if (st === 0) chord.forEach((n) => this.osc('sawtooth', NOTE(n), NOTE(n), t, sx * 15, 0.015, D, { lp: 1600, attack: 0.3, verb: 0.5, detune: 9 }));
    }
  }
}
