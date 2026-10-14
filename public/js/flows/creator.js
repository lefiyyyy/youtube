// Character creation (first launch) and wardrobe (mirror).
import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { $, $$, h, bind, ic, esc, toast } from '../ui/ui.js';
import { HAIRS, HAIR_NAMES, OUTFITS, OUTFIT_NAMES, ACCESSORIES, ACC_NAMES, SKINS, HAIR_COLORS, TOP_COLORS } from '../world/character.js';
import { ACCENTS } from '../data/decor.js';
import { COSMETICS } from '../data/rewards.js';
import { overlay, closeOverlay } from './create.js';
import { pick, sleep } from '../core/util.js';
import { save } from '../core/state.js';

const NAMES = ['PixelNova', 'LunaPlays', 'ZenoLive', 'ByteBunny', 'NeoNoodle', 'KiraClips', 'MochiMode', 'RioRise', 'JunoJams', 'AstroAce', 'VexVibes', 'CozyKai', 'GlitchGabi', 'TurboTess', 'NovaNiko'];
const BOTTOMS = ['#2b2f45', '#1d1f2b', '#3a4a6b', '#4a3a32', '#e8e4dc', '#2f3b2c'];

export const Creator = {
  open(mode = 'create') {
    return new Promise((resolve) => {
      G.game.run(mode, async () => {
        const s = G.s, W = G.world;
        const p = s.profile;
        G.ui.hud.show(false);
        if (mode === 'create') {
          W.char.root.position.set(0.55, 0, 0.75);
        } else {
          await W.goTo('mirror');
          W.char.root.rotation.y += Math.PI;
        }
        W.char.root.rotation.y = mode === 'create' ? 0.62 : W.char.root.rotation.y;
        W.char.play('idle');
        W.char.setExpression('happy', 999);
        W.shot('creator', { shift: innerWidth < 900 ? 0.24 : 0.2 });
        const outfits = [...OUTFITS, ...['hoodie_ghost', 'jacket_pixel'].filter((o) => s.cosmetics.includes(o))];
        const sw = (key, list) => `<div class="opts">${list.map((c) => `<button class="sw ${p[key] === c ? 'on' : ''}" style="background:${c}" data-a="set" data-k="${key}" data-v="${c}"></button>`).join('')}</div>`;
        const ch = (key, list, names) => `<div class="opts">${list.map((c) => `<button class="opt ${p[key] === c ? 'on' : ''}" data-a="set" data-k="${key}" data-v="${c}">${names[c] || c}</button>`).join('')}</div>`;
        const el = overlay(`<div class="creator glass">
          <div class="row"><div class="grow"><h2>${mode === 'create' ? 'Create your creator' : 'Style'}</h2><div class="tiny muted" style="font-weight:600">${mode === 'create' ? 'Quick! Your audience is waiting.' : 'Fresh look, fresh content'}</div></div><button class="btn ghost small icon" data-a="rand" title="Randomize">${ic('sparkle')}</button></div>
          <div class="sc">
            <div class="opt-row"><div class="ol">Channel name</div><div class="row"><input class="name-in" maxlength="16" value="${esc(p.name)}"><button class="btn ghost small icon" data-a="rname">${ic('undo')}</button></div></div>
            <div class="opt-row"><div class="ol">Skin</div>${sw('skin', SKINS)}</div>
            <div class="opt-row"><div class="ol">Hair</div>${ch('hair', HAIRS, HAIR_NAMES)}</div>
            <div class="opt-row"><div class="ol">Hair color</div>${sw('hairColor', HAIR_COLORS)}</div>
            <div class="opt-row"><div class="ol">Outfit</div>${ch('outfit', outfits, OUTFIT_NAMES)}</div>
            <div class="opt-row"><div class="ol">Top color</div>${sw('top', TOP_COLORS)}</div>
            <div class="opt-row"><div class="ol">Pants</div>${sw('bottom', BOTTOMS)}</div>
            <div class="opt-row"><div class="ol">Accessory</div>${ch('accessory', ACCESSORIES, ACC_NAMES)}</div>
            <div class="opt-row"><div class="ol">Room glow</div>${sw('accent', ACCENTS)}</div>
          </div>
          <button class="btn primary big shine" data-a="done">${ic(mode === 'create' ? 'play' : 'check')}${mode === 'create' ? "Let's go live!" : 'Looking good'}</button></div>`);
        const nameIn = $('.name-in', el);
        nameIn.addEventListener('keydown', (e) => e.stopPropagation());
        const apply = (rebuildRoom) => {
          W.setProfile(p);
          W.char.setExpression('happy', 999);
          if (rebuildRoom) { const pos = W.char.root.position.clone(), ry = W.char.root.rotation.y; W.rebuildRoom(); W.char.root.position.copy(pos); W.char.root.rotation.y = ry; W.shot('creator', { shift: innerWidth < 900 ? 0.24 : 0.2 }); }
          W.char.play(pick(['pose', 'wave', 'fistPump']), { restart: true });
          clearTimeout(this._t); this._t = setTimeout(() => W.char.play('idle'), 1200);
        };
        await new Promise((done) => bind(el, {
          set: (b) => {
            const k = b.dataset.k, v = b.dataset.v;
            p[k] = v;
            $$(`[data-k="${k}"]`, el).forEach((x) => x.classList.toggle('on', x.dataset.v === v));
            apply(k === 'accent');
          },
          rand: () => {
            Object.assign(p, { skin: pick(SKINS), hair: pick(HAIRS), hairColor: pick(HAIR_COLORS), outfit: pick(OUTFITS), top: pick(TOP_COLORS), bottom: pick(BOTTOMS), accessory: pick(ACCESSORIES) });
            $$('[data-a=set]', el).forEach((x) => x.classList.toggle('on', p[x.dataset.k] === x.dataset.v));
            apply(false);
          },
          rname: () => { nameIn.value = pick(NAMES); },
          done: () => done(),
        }));
        p.name = (nameIn.value || '').trim().replace(/[<>]/g, '').slice(0, 16) || pick(NAMES);
        W.char.setExpression('happy', 2);
        closeOverlay(el);
        G.ui.hud.setPortrait();
        if (mode === 'create') {
          s.created_char = true;
          W.rebuildDecor();
          W.char.play('celebrate', { restart: true });
          G.audio.sfx('levelup');
          W.vfx.confetti(W.char.root.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 120, 2.6);
          await sleep(1100);
        } else {
          if (s.placed.includes('neon_name')) W.rebuildDecor();
          s.stats.outfitChanges = (s.stats.outfitChanges || 0) + 1;
          toast('New look saved', { icon: 'shirt', color: 'var(--pink)', sub: 'Post a Fit Check on Lumo!' });
        }
        W.char.play('idle');
        W.shot('room');
        save(true);
      }).then(resolve);
    });
  },
};
