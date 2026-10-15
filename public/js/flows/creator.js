// Character creation (first launch) and wardrobe (mirror): boy/girl body, look, and outfit slots.
import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { $, $$, h, bind, ic, esc, toast } from '../ui/ui.js';
import { HAIRS, HAIR_NAMES, SKINS, HAIR_COLORS, TOP_COLORS, BOTTOM_COLORS, SHOE_COLORS } from '../world/character.js';
import { ACCENTS } from '../data/decor.js';
import { CLOTHES, SLOTS, SLOT_NAMES, clothById, dripOf, dripLabel } from '../data/clothes.js';
import { overlay, closeOverlay } from './create.js';
import { pick, sleep } from '../core/util.js';
import { save } from '../core/state.js';

const NAMES = ['PixelNova', 'LunaPlays', 'ZenoLive', 'ByteBunny', 'NeoNoodle', 'KiraClips', 'MochiMode', 'RioRise', 'JunoJams', 'AstroAce', 'VexVibes', 'CozyKai', 'GlitchGabi', 'TurboTess', 'NovaNiko'];
const GIRL_HAIR = ['long', 'ponytail', 'bob', 'bun', 'curly'];
const BOY_HAIR = ['swoop', 'spiky', 'buzz', 'curly', 'bob'];

export function ownedClothes(s, slot) {
  return CLOTHES.filter((c) => c.slot === slot && (c.basic || s.wardrobe.includes(c.id)));
}

export const Creator = {
  open(mode = 'create') {
    return new Promise((resolve) => {
      G.game.run(mode, async () => {
        const s = G.s, W = G.world;
        const p = s.profile;
        G.ui.hud.show(false);
        if (mode === 'create') W.char.root.position.copy(W.room.creatorSpot());
        else await W.goTo('mirror');
        W.char.root.rotation.y = W.cornerYaw();
        W.char.play('idle');
        W.char.setExpression('happy', 999);
        const shift = innerWidth < 900 ? 0.24 : 0.2;
        W.shot('creator', { shift });
        let tab = mode === 'create' ? 'look' : 'outfit';
        const el = overlay(`<div class="creator glass">
          <div class="row"><div class="grow"><h2>${mode === 'create' ? 'Create your creator' : 'Wardrobe'}</h2><div class="tiny muted cr-sub" style="font-weight:600"></div></div><button class="btn ghost small icon" data-a="rand" title="Randomize">${ic('sparkle')}</button></div>
          <div class="seg gender"><button data-a="gender" data-v="m">${ic('user')}Boy</button><button data-a="gender" data-v="f">${ic('user')}Girl</button></div>
          <div class="seg tabs2"><button data-a="tab" data-v="look">${ic('user')}Look</button><button data-a="tab" data-v="outfit">${ic('shirt')}Outfit</button></div>
          <div class="sc"></div>
          <button class="btn primary big" data-a="done">${ic(mode === 'create' ? 'play' : 'check')}${mode === 'create' ? "Let's go!" : 'Looking good'}</button></div>`);
        const sc = $('.sc', el);
        let nameVal = p.name;
        const sw = (key, list, cur) => `<div class="opts">${list.map((c) => `<button class="sw ${cur === c ? 'on' : ''}" style="background:${c}" data-a="set" data-k="${key}" data-v="${c}"></button>`).join('')}</div>`;
        const render = () => {
          $$('.gender button', el).forEach((b) => b.classList.toggle('on', b.dataset.v === (p.gender || 'm')));
          $$('.tabs2 button', el).forEach((b) => b.classList.toggle('on', b.dataset.v === tab));
          const d = dripOf(p);
          $('.cr-sub', el).innerHTML = mode === 'create' ? 'Your audience is waiting.' : `${ic('sparkle')} Style ${d} · ${dripLabel(d)}`;
          if (tab === 'look') {
            const hairs = [...(p.gender === 'f' ? GIRL_HAIR : BOY_HAIR), ...HAIRS.filter((x) => !(p.gender === 'f' ? GIRL_HAIR : BOY_HAIR).includes(x))];
            sc.innerHTML = `
              <div class="opt-row"><div class="ol">Channel name</div><div class="row"><input class="name-in" maxlength="16" value="${esc(nameVal)}"><button class="btn ghost small icon" data-a="rname">${ic('undo')}</button></div></div>
              <div class="opt-row"><div class="ol">Skin</div>${sw('skin', SKINS, p.skin)}</div>
              <div class="opt-row"><div class="ol">Hair</div><div class="opts">${hairs.map((x) => `<button class="opt ${p.hair === x ? 'on' : ''}" data-a="set" data-k="hair" data-v="${x}">${HAIR_NAMES[x]}</button>`).join('')}</div></div>
              <div class="opt-row"><div class="ol">Hair color</div>${sw('hairColor', HAIR_COLORS, p.hairColor)}</div>
              <div class="opt-row"><div class="ol">Signature color</div>${sw('accent', ACCENTS, p.accent)}</div>`;
            const nameIn = $('.name-in', sc);
            nameIn.addEventListener('keydown', (e) => e.stopPropagation());
            nameIn.addEventListener('input', () => { nameVal = nameIn.value; });
          } else {
            sc.innerHTML = SLOTS.map((slot) => {
              const items = ownedClothes(s, slot);
              const cur = p.wear[slot];
              const optional = !['top', 'bottom', 'shoes'].includes(slot);
              const curIt = cur && clothById(cur);
              const colKey = slot === 'top' ? 'top' : slot === 'bottom' ? 'bottom' : slot === 'shoes' ? 'shoes' : null;
              const colList = slot === 'top' ? TOP_COLORS : slot === 'bottom' ? BOTTOM_COLORS : SHOE_COLORS;
              return `<div class="opt-row"><div class="ol">${SLOT_NAMES[slot]}</div><div class="opts">
                ${optional ? `<button class="opt ${!cur ? 'on' : ''}" data-a="wear" data-slot="${slot}" data-v="">None</button>` : ''}
                ${items.map((it) => `<button class="opt ${cur === it.id ? 'on' : ''} ${it.brand ? 'brand' : ''}" data-a="wear" data-slot="${slot}" data-v="${it.id}">${it.brand ? `<small>${esc(it.brand)}</small>` : ''}${esc(it.name)}</button>`).join('')}</div>
                ${colKey && curIt?.basic && curIt.style !== 'boot' ? `<div style="margin-top:8px">${sw('col.' + colKey, colList, p.col[colKey])}</div>` : ''}</div>`;
            }).join('') + `<button class="btn ghost small" data-a="fashion" style="align-self:flex-start">${ic('cart')}Shop fashion brands</button>`;
          }
        };
        render();
        const apply = () => {
          W.setProfile(p);
          W.char.setExpression('happy', 999);
          W.char.play(pick(['pose', 'wave', 'fistPump']), { restart: true });
          clearTimeout(this._t); this._t = setTimeout(() => W.char.play('idle'), 1200);
        };
        const result = await new Promise((done) => bind(el, {
          gender: (b) => {
            if (p.gender === b.dataset.v) return;
            p.gender = b.dataset.v;
            const pref = p.gender === 'f' ? GIRL_HAIR : BOY_HAIR;
            if (!pref.slice(0, 3).includes(p.hair)) p.hair = pref[0];
            apply(); render();
          },
          tab: (b) => { tab = b.dataset.v; render(); G.audio.sfx('tab'); },
          set: (b) => {
            const k = b.dataset.k, v = b.dataset.v;
            if (k.startsWith('col.')) p.col[k.slice(4)] = v; else p[k] = v;
            if (k === 'accent') { const pos = W.char.root.position.clone(), ry = W.char.root.rotation.y; W.rebuildRoom(); W.char.root.position.copy(pos); W.char.root.rotation.y = ry; W.shot('creator', { shift }); }
            apply(); render();
          },
          wear: (b) => { p.wear[b.dataset.slot] = b.dataset.v || null; apply(); render(); },
          rand: () => {
            const g = p.gender || 'm';
            Object.assign(p, { skin: pick(SKINS), hair: pick((g === 'f' ? GIRL_HAIR : BOY_HAIR).slice(0, 4)), hairColor: pick(HAIR_COLORS) });
            p.col = { top: pick(TOP_COLORS), bottom: pick(BOTTOM_COLORS), shoes: pick(SHOE_COLORS) };
            const basic = (slot) => ownedClothes(s, slot).filter((c) => c.basic && (g === 'f' || c.id !== 'skirt' && c.id !== 'crop'));
            p.wear.top = pick(basic('top')).id; p.wear.bottom = pick(basic('bottom')).id;
            p.wear.hat = pick([null, null, 'headphones', 'cap', 'beanie']);
            apply(); render();
          },
          rname: () => { nameVal = pick(NAMES); const i = $('.name-in', sc); if (i) i.value = nameVal; },
          fashion: () => done('shop'),
          done: () => done('ok'),
        }));
        p.name = (nameVal || '').trim().replace(/[<>]/g, '').slice(0, 16) || pick(NAMES);
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
          if (result !== 'shop') toast('New look saved', { icon: 'shirt', color: 'var(--pink)', sub: 'Post a Fit Check on Lumo!' });
        }
        W.char.play('idle');
        W.shot('room');
        save(true);
        this._afterShop = result === 'shop';
      }).then(() => { if (this._afterShop) { this._afterShop = false; G.shop.open('fashion'); } resolve(); });
    });
  },
};
