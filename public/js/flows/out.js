// Going out: rooftop creator party (talk to influencers, make friends, unlock collabs), fan meetups,
// a part-time café job, the Creator Academy (skills) and the mall (fashion brands).
import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { bus } from '../core/bus.js';
import { $, $$, h, bind, ic, esc, modal, toast, fly } from '../ui/ui.js';
import { overlay, closeOverlay } from './create.js';
import { INFLUENCERS, TOPICS, TOPIC_ICONS, LINES, influencerById, npcProfile } from '../data/influencers.js';
import { SKINS, HAIR_COLORS, TOP_COLORS, BOTTOM_COLORS } from '../world/character.js';
import { dripOf } from '../data/clothes.js';
import { npcPortrait } from './thumbs.js';
import { fmt, fmtMoney, clamp, sleep, pick, shuffle } from '../core/util.js';
import { save } from '../core/state.js';

export const SKILLS = {
  gaming: { name: 'Gaming', icon: 'gamepad', color: '#3cc8ff', desc: 'Better recordings and Big Plays' },
  editing: { name: 'Editing', icon: 'scissors', color: '#8f7dff', desc: 'Higher edit quality, Pro edits sooner' },
  charisma: { name: 'Charisma', icon: 'users', color: '#ff4d6d', desc: 'Livelier streams, easier friendships' },
  business: { name: 'Business', icon: 'dollar', color: '#8ee05a', desc: 'Better brand deals and ad revenue' },
};
export const SKILL_MAX = 10;
const coursePrice = (lv) => Math.round((180 * Math.pow(1.75, lv)) / 10) * 10;
const fade = async (title, sub) => {
  const f = h(`<div class="trans"><div><b>${title}</b><span>${sub || ''}</span></div></div>`);
  $('#fx').appendChild(f);
  await sleep(650);
  return () => { f.classList.add('out'); setTimeout(() => f.remove(), 500); };
};
const hearts = (v) => `<span class="hearts">${[0, 1, 2, 3, 4].map((i) => `<i class="${v >= (i + 1) * 2 ? 'f' : v >= i * 2 + 1 ? 'h' : ''}">${ic('heart')}</i>`).join('')}</span>`;
const say = (t, me) => t.replace('{me}', me);

export const Out = {
  // ---------------------------------------------------------------- MAP
  open() {
    const s = G.s, hh = G.game.hour;
    const night = hh >= 19 || hh < 2;
    const partyDone = s.outings.party === s.clock.day;
    const jobDone = s.outings.job === s.clock.day;
    const meetDone = s.outings.meet === s.clock.day;
    const meetLocked = s.fans.vid < 1000;
    const jobOpen = hh >= 7 && hh < 18;
    const places = [
      { id: 'party', name: 'Rooftop Party', icon: 'music', c1: '#7b5cff', c2: '#ff4d6d', desc: 'Meet famous creators, make friends and unlock collabs', meta: [`${ic('clock')}8 PM – 2 AM`, `${ic('bolt')}-15`], state: partyDone ? 'Come back tomorrow night' : null, btn: night ? 'Go now' : 'Skip to 8 PM' },
      { id: 'meet', name: 'Fan Meetup', icon: 'heart', c1: '#ff4d6d', c2: '#ffbe55', desc: 'Sign autographs and take selfies with your fans', meta: [`${ic('clock')}3h`, `${ic('bolt')}-12`], state: meetLocked ? `${ic('lock')}Reach 1,000 subscribers` : meetDone ? 'Next meetup tomorrow' : null, btn: 'Host meetup' },
      { id: 'job', name: 'Café Shift', icon: 'food', c1: '#c98a3c', c2: '#ffbe55', desc: 'Part-time barista job — quick cash for your next upgrade', meta: [`${ic('clock')}4h · 7 AM – 6 PM`, `${ic('bolt')}-15`], state: jobDone ? 'You already worked today' : !jobOpen ? 'Café is closed right now' : null, btn: 'Start shift' },
      { id: 'academy', name: 'Creator Academy', icon: 'trophy', c1: '#3cc8ff', c2: '#8f7dff', desc: 'Train Gaming, Editing, Charisma and Business', meta: [`${ic('star')}${s.skillPts || 0} skill points`], state: null, btn: 'Open' },
      { id: 'mall', name: 'Mall', icon: 'cart', c1: '#ff7d93', c2: '#8f7dff', desc: 'Ralph Lauren, Stüssy, Chrome Hearts, Rick Owens & more', meta: [`${ic('shirt')}Fashion brands`], state: null, btn: 'Go shopping' },
    ];
    const body = h(`<div class="places">${places.map((p) => `<div class="place ${p.state ? 'off' : ''}" style="--c1:${p.c1};--c2:${p.c2}">
      <div class="pl-art">${ic(p.icon)}</div>
      <div class="pl-b"><h3>${p.name}</h3><p>${p.desc}</p><div class="pl-m">${p.meta.map((m) => `<span>${m}</span>`).join('')}</div></div>
      ${p.state ? `<div class="pl-s">${p.state}</div>` : `<button class="btn ${p.id === 'party' ? 'primary' : 'ghost'} small" data-a="go" data-id="${p.id}">${p.btn}${ic('chevron')}</button>`}</div>`).join('')}</div>`);
    const m = modal({ title: 'Go Out', sub: `${ic('map')} Pick where to spend your time`, icon: 'map', iconBg: 'linear-gradient(135deg,#7b5cff,#ff4d6d)', body, size: 'md' });
    bind(body, {
      go: (b) => {
        const id = b.dataset.id;
        if (['party', 'meet', 'job'].includes(id) && s.needs.energy < 18) { G.audio.sfx('error'); toast('Too tired to go out — rest first', { icon: 'bolt', color: 'var(--red)' }); return; }
        m.close(true);
        if (id === 'party') this.party();
        else if (id === 'meet') this.meetup();
        else if (id === 'job') this.job();
        else if (id === 'academy') this.academy();
        else if (id === 'mall') G.shop.open('fashion');
      },
    });
  },

  // ---------------------------------------------------------------- PARTY
  party() {
    return G.game.run('party', async () => {
      const s = G.s, W = G.world;
      G.ui.hud.show(false);
      const hh = G.game.hour;
      if (!(hh >= 19 || hh < 2)) G.game.advance(((20 - hh) + 24) % 24, { noNeeds: false });
      s.outings.party = s.clock.day;
      await W.goTo('door');
      W.room.setDoorOpen(true); G.audio.sfx('door');
      const done = await fade('Rooftop Party', 'Downtown · tonight');
      const v = W.enterVenue('party');
      G.audio.setMusic('party');
      done();
      // guests
      const guests = shuffle([...INFLUENCERS]).slice(0, 5);
      guests.forEach((g, i) => {
        const spot = v.spots[i];
        const n = v.addNPC(g.id, g.name, { name: g.name, ...g.profile }, spot, g);
        n.met = false; n.acts = {};
      });
      // a DJ that just vibes
      v.addNPC('dj', null, { name: 'DJ', gender: 'm', hair: 'buzz', hairColor: '#111', skin: '#8a5634', eyes: '#3b2a20', accent: '#8f7dff', wear: { top: 'tech', bottom: 'joggers', shoes: 'boots', hat: 'headphones', eyes: 'ch_shades', neck: null }, col: { top: '#1b1d2a', bottom: '#1d1f2b' } }, { x: -1.6, z: -v.D / 2 + 0.5, ry: 0, clip: 'dance', block: false });
      W.inputEnabled = true;
      const st = { vibe: 20, selfies: 0, followers: 0, friends: [], collabs: [], heartsGained: 0, startDay: s.clock.day, spent: 0 };
      const ui = overlay(`<div class="party-ui">
        <div class="pt-top glass"><div class="pt-t"><b>Rooftop Party</b><span class="pt-clock"></span></div>
          <div class="pt-v"><small>${ic('sparkle')}Party vibe</small><div class="bar"><i style="width:20%"></i></div></div>
          <button class="btn ghost small" data-a="leave">${ic('door')}Leave</button></div>
        <div class="pt-hint">${ic('user')} Tap a creator to talk · walk anywhere</div>
        <div class="pt-acts"><button class="pt-b" data-a="dance">${ic('music')}<span>Dance</span></button><button class="pt-b" data-a="drink">${ic('food')}<span>Bar · $12</span></button></div>
        <div class="npc-card glass hidden"></div></div>`, 'party');
      const card = $('.npc-card', ui);
      const vibeBar = $('.pt-v .bar i', ui), clockEl = $('.pt-clock', ui);
      const addVibe = (n) => { st.vibe = clamp(st.vibe + n, 0, 100); vibeBar.style.width = st.vibe + '%'; };
      const tick = () => {
        const m = Math.floor(s.clock.min), h24 = Math.floor(m / 60) % 24, mm = m % 60;
        clockEl.textContent = `${((h24 + 11) % 12) + 1}:${String(mm - (mm % 5)).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
      };
      tick();
      let busy = false, cur = null, ended = false;
      const spend = (mins) => { G.game.advance(mins / 60); tick(); const hNow = G.game.hour; if ((hNow >= 2 && hNow < 12 && s.clock.day > st.startDay) || s.needs.energy < 6) endParty(true); };
      let endParty;
      const finished = new Promise((r) => { endParty = (late) => { if (ended) return; ended = true; r(late); }; });
      const closeCard = () => { card.classList.add('hidden'); cur = null; if (W.shotName === 'pair') W.shot('venue'); };
      const talkTo = async (id) => {
        const n = v.npc(id);
        if (!n || busy) return;
        busy = true;
        const np = n.c.root.position, me = W.char.root.position;
        const dir = new THREE.Vector3(me.x - np.x, 0, me.z - np.z); if (dir.length() < 0.01) dir.set(0, 0, 1); dir.normalize();
        const tx = np.x + dir.x * 0.95, tz = np.z + dir.z * 0.95;
        await W.walkTo(tx, tz, Math.atan2(np.x - tx, np.z - tz));
        n.c.root.rotation.y = Math.atan2(tx - np.x, tz - np.z);
        if (n.baseClip === 'dance' || n.baseClip === 'phone') { n.baseClip = 'talkStand'; n.c.showProp(null); }
        n.c.play('talkStand'); W.char.play('talkStand');
        W.shot('pair', { a: W.char.root.position.clone(), b: np.clone(), shift: innerWidth > 900 ? -0.14 : -0.2 });
        if (!n.met) { n.met = true; G.ui.labels.bubble(n.c.root, esc(say(pick(LINES.greet), s.profile.name))); G.audio.sfx('pop'); }
        cur = n; busy = false;
        renderCard();
      };
      const renderCard = (mode = 'main') => {
        const n = cur; if (!n) return;
        const d = n.data, hv = s.friends[d.id] || 0, a = n.acts;
        const isFriend = hv >= 6;
        card.classList.remove('hidden');
        card.innerHTML = `<div class="nc-h"><img src="${npcPortrait(d)}"><div class="grow"><b>${esc(d.name)}</b><small>${esc(d.vibe)} · ${fmt(d.fans)} on ${d.plat}</small>${hearts(hv)}</div><button class="xbtn" data-a="close">${ic('close')}</button></div>
          ${mode === 'topics' ? `<div class="nc-l">What do you want to talk about?</div><div class="topics">${n.topics.map((t) => `<button class="topic" data-a="topic" data-t="${t}">${ic(TOPIC_ICONS[t])}${t}</button>`).join('')}</div>`
          : `<div class="nc-acts">
            <button class="nca" data-a="chat" ${a.chat >= 2 ? 'disabled' : ''}>${ic('message')}<span>Chat</span><small>${a.chat >= 2 ? 'Talked enough' : '15 min'}</small></button>
            <button class="nca" data-a="compliment" ${a.comp ? 'disabled' : ''}>${ic('sparkle')}<span>Compliment</span><small>${a.comp ? 'Done' : 'Style matters'}</small></button>
            <button class="nca" data-a="selfie" ${a.selfie || hv < 3 ? 'disabled' : ''}>${ic('camera')}<span>Selfie</span><small>${a.selfie ? 'Posted' : hv < 3 ? `${ic('heart')}${'2 hearts'}` : '+Blip fans'}</small></button>
            <button class="nca hot" data-a="collab" ${a.collab || (s.collabsUnlocked || []).includes(d.id) ? 'disabled' : ''}>${ic('handshake')}<span>Pitch collab</span><small>${(s.collabsUnlocked || []).includes(d.id) ? 'Partners!' : isFriend ? 'They like you!' : '3 hearts needed'}</small></button></div>`}`;
      };
      const react = (n, good, line) => {
        n.c.play(good ? 'laughStand' : 'shrug', { restart: true }); n.react = 1.4;
        n.c.setExpression(good ? 'laugh' : 'sad', 1.4);
        G.ui.labels.bubble(n.c.root, esc(line));
        W.char.play(good ? 'fistPump' : 'shrug', { restart: true }); setTimeout(() => W.char.clip !== 'walk' && W.char.play('talkStand'), 1200);
      };
      const gainHearts = (d, k) => { const before = s.friends[d.id] || 0; s.friends[d.id] = clamp(before + k, 0, 10); st.heartsGained += Math.max(0, s.friends[d.id] - before); if (before < 6 && s.friends[d.id] >= 6) { st.friends.push(d.name); toast(`<b>${esc(d.name)}</b> is now your friend!`, { icon: 'heart', color: 'var(--pink)' }); } };
      const charisma = s.skills?.charisma || 0;
      const onPick = (id) => { if (ended || busy) return; if (id === 'me') return; if (v.npc(id) && v.npc(id).data?.id) talkTo(id); };
      const onFloor = (p) => { if (ended || busy) return; closeCard(); W.walkTo(p.x, p.z); };
      const offA = bus.on('world:pick', onPick), offB = bus.on('world:floor', onFloor);
      bind(ui, {
        leave: () => endParty(false),
        close: () => { closeCard(); W.char.play('idle'); },
        chat: () => {
          const d = cur.data;
          const pool = shuffle(TOPICS.filter((t) => !d.likes.includes(t)));
          cur.topics = shuffle([pick(d.likes), ...pool.slice(0, 2)]);
          renderCard('topics');
        },
        topic: (b) => {
          const n = cur, d = n.data, t = b.dataset.t;
          n.acts.chat = (n.acts.chat || 0) + 1;
          if (d.likes.includes(t) && Math.random() < 0.8 + charisma * 0.02) { gainHearts(d, 2); addVibe(8); react(n, true, pick(LINES.like)); G.audio.sfx('good'); }
          else if (d.hates.includes(t)) { gainHearts(d, -1); addVibe(-3); react(n, false, pick(LINES.hate)); G.audio.sfx('miss'); }
          else { const ok = Math.random() < 0.45 + charisma * 0.04; if (ok) gainHearts(d, 1); addVibe(3); react(n, ok, pick(LINES.meh)); G.audio.sfx(ok ? 'pop' : 'click'); }
          if (s.skills) s.skills.charismaXp = (s.skills.charismaXp || 0) + 1;
          spend(15); renderCard();
        },
        compliment: () => {
          const n = cur, d = n.data; n.acts.comp = true;
          const drip = dripOf(s.profile);
          const good = drip >= d.drip * 0.6;
          gainHearts(d, good ? 2 : 1); addVibe(good ? 6 : 2);
          react(n, true, pick(good ? LINES.fit : LINES.fitMeh)); G.audio.sfx(good ? 'good' : 'pop');
          spend(10); renderCard();
        },
        selfie: () => {
          const n = cur, d = n.data; n.acts.selfie = true;
          W.char.showProp('phone'); W.char.play('selfie', { restart: true }); n.c.play('pose', { restart: true }); n.react = 1.8;
          G.audio.sfx('shutter'); setTimeout(() => W.char.showProp(null), 1500);
          const f = Math.max(3, Math.round(4 + Math.pow(d.fans, 0.45) * 0.6 * (1 + (s.friends[d.id] || 0) * 0.05)));
          st.followers += f; st.selfies++;
          G.game.addFans('blip', f, null, true);
          G.ui.labels.bubble(n.c.root, esc(pick(LINES.selfie)));
          toast(`Selfie with <b>${esc(d.name)}</b> posted`, { icon: 'camera', color: 'var(--blip)', sub: `+${fmt(f)} Blip followers` });
          gainHearts(d, 1); addVibe(5);
          spend(10); renderCard();
        },
        collab: () => {
          const n = cur, d = n.data; n.acts.collab = true;
          if ((s.friends[d.id] || 0) >= 6) {
            s.collabsUnlocked = [...new Set([...(s.collabsUnlocked || []), d.id])];
            st.collabs.push(d.name);
            react(n, true, pick(LINES.collabYes)); G.audio.sfx('reward'); addVibe(10);
            W.vfx.confetti(n.c.root.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 60, 1.8);
            toast(`Collab unlocked: <b>${esc(d.name)}</b>`, { icon: 'handshake', color: 'var(--lime)', sub: 'Pick them for a Collab video — free' });
          } else { react(n, false, pick(LINES.collabNo)); G.audio.sfx('miss'); }
          spend(10); renderCard();
        },
        dance: async () => {
          if (busy) return; busy = true; closeCard();
          const dsp = v.st.dance;
          await W.walkTo(dsp.x + (Math.random() - 0.5) * 1.2, dsp.z + (Math.random() - 0.5) * 0.8);
          W.char.play('dance', { restart: true }); W.char.setExpression('happy', 4);
          G.audio.sfx('pop');
          for (const n of v.npcs) if (n.baseClip === 'dance') { n.c.setExpression('laugh', 2); }
          await sleep(3200);
          W.char.play('idle');
          s.needs.energy = clamp(s.needs.energy - 3, 0, 100);
          addVibe(10); spend(20);
          busy = false;
        },
        drink: async () => {
          if (busy || !G.game.spend(12)) return; busy = true; closeCard();
          st.spent += 12;
          const b = v.st.bar;
          await W.walkTo(b.x, b.z, b.ry);
          W.char.showProp('can'); W.char.play('drink', { restart: true });
          G.audio.sfx('slurp');
          await sleep(1600);
          W.char.showProp(null); W.char.play('idle');
          s.needs.energy = clamp(s.needs.energy + 8, 0, 100);
          addVibe(4); spend(10);
          busy = false;
        },
      });
      const late = await finished;
      offA(); offB();
      closeOverlay(ui);
      W.inputEnabled = false;
      if (late) toast('The party is winding down…', { icon: 'moon', color: '#8f7dff' });
      // rewards
      const xp = Math.round(30 + st.vibe * 0.8 + st.heartsGained * 6);
      const fansV = Math.round(st.vibe * 0.4 + st.selfies * 6 + st.collabs.length * 25);
      const done2 = await fade('Heading home', '');
      W.exitVenue();
      W.room.setDoorOpen(false);
      G.audio.setMusic('night');
      done2();
      s.stats.parties = (s.stats.parties || 0) + 1;
      bus.emit('q', { evt: 'party', n: 1 });
      await this.summary('Party recap', 'music', [
        [ic('sparkle'), 'Party vibe', `${Math.round(st.vibe)}%`],
        [ic('heart'), 'Hearts earned', `+${st.heartsGained}`],
        [ic('blip'), 'Blip followers', `+${fmt(st.followers)}`],
        [ic('users'), 'Vidora subs', `+${fmt(fansV)}`],
      ], [...st.friends.map((f) => `${ic('heart')} New friend: ${esc(f)}`), ...st.collabs.map((c) => `${ic('handshake')} Collab unlocked: ${esc(c)}`)], (p) => { G.game.addXP(xp, p); if (fansV) G.game.addFans('vid', fansV, p); }, xp);
      save(true);
    });
  },

  // ---------------------------------------------------------------- FAN MEETUP
  meetup() {
    return G.game.run('meetup', async () => {
      const s = G.s, W = G.world;
      G.ui.hud.show(false);
      s.outings.meet = s.clock.day;
      await W.goTo('door');
      W.room.setDoorOpen(true); G.audio.sfx('door');
      const done = await fade('Fan Meetup', `${esc(s.profile.name)} · Meet & Greet`);
      const v = W.enterVenue('meetup', { name: s.profile.name, accent: s.profile.accent });
      done();
      const host = v.st.host;
      W.char.root.position.set(host.x, 0, host.z); W.char.root.rotation.y = 0;
      W.char.play('wave', { restart: true }); W.char.setExpression('happy', 3);
      G.audio.setMusic('chill');
      const WANTS = [['sign', 'star', 'Autograph'], ['selfie', 'camera', 'Selfie'], ['hug', 'heart', 'Hug'], ['five', 'thumb', 'High five']];
      const ui = overlay(`<div class="meet-ui">
        <div class="pt-top glass"><div class="pt-t"><b>Fan Meetup</b><span class="mt-n">Fan 1 / 8</span></div><div class="pt-v"><small>${ic('heart')}Fan happiness</small><div class="bar"><i style="width:0%"></i></div></div></div>
        <div class="mt-acts">${WANTS.map(([k, i, n]) => `<button class="pt-b big" data-a="act" data-k="${k}">${ic(i)}<span>${n}</span></button>`).join('')}</div>
        <div class="pt-hint">${ic('info')} Give each fan what they ask for</div></div>`, 'meet');
      const total = 8;
      const fanProfile = () => { const g = Math.random() < 0.5 ? 'f' : 'm'; return { name: 'Fan', gender: g, hair: pick(g === 'f' ? ['long', 'ponytail', 'bob', 'bun', 'curly'] : ['swoop', 'spiky', 'buzz', 'curly']), hairColor: pick(HAIR_COLORS.slice(0, 5)), skin: pick(SKINS), eyes: '#3b2a20', accent: pick(TOP_COLORS), wear: { top: pick(['hoodie', 'tee', 'longtee', 'sweater', 'jacket']), bottom: pick(['jeans', 'joggers', 'shorts']), shoes: 'sneakers', hat: pick([null, null, 'cap', 'beanie']), eyes: pick([null, null, 'glasses']), neck: null }, col: { top: pick(TOP_COLORS), bottom: pick(BOTTOM_COLORS), shoes: '#f4f4f6' } }; };
      let queue = [], spawned = 0, served = 0, happy = 0, perfect = 0;
      const spawnFan = () => {
        if (spawned >= total) return;
        const i = queue.length;
        const q = v.queueSpots[Math.min(i + 1, v.queueSpots.length - 1)];
        const n = v.addNPC('fan' + spawned, null, fanProfile(), { x: v.W / 2 - 1.2, z: 2.2, ry: -Math.PI / 2, clip: 'idle', block: false });
        n.want = pick(WANTS);
        queue.push(n); spawned++;
        v.moveNPC(n, q.x, q.z, Math.PI, 'idle');
      };
      for (let i = 0; i < 3; i++) spawnFan();
      const advanceQueue = async () => {
        queue.forEach((n, i) => { const q = v.queueSpots[i]; v.moveNPC(n, q.x, q.z + (i === 0 ? -0.25 : 0), Math.PI, i === 0 ? 'idle' : 'idle'); });
      };
      const bar = $('.pt-v .bar i', ui), cnt = $('.mt-n', ui);
      const fin = new Promise((resolve) => {
        let lock = true;
        const nextFan = async () => {
          if (served >= total) { resolve(); return; }
          lock = true;
          await advanceQueue();
          await sleep(900);
          const n = queue[0];
          if (!n) { resolve(); return; }
          cnt.textContent = `Fan ${served + 1} / ${total}`;
          n.c.play('wave', { restart: true }); n.react = 1.2;
          G.ui.labels.bubble(n.c.root, `${ic(n.want[1])} ${n.want[2]}?`, 'want');
          lock = false;
          if (window.__autoplay) setTimeout(() => $(`[data-a=act][data-k=${n.want[0]}]`, ui)?.click(), 600);
        };
        bind(ui, {
          act: async (b) => {
            if (lock) return; lock = true;
            const n = queue.shift(); if (!n) return;
            const good = b.dataset.k === n.want[0];
            if (good) perfect++;
            happy += good ? 1 : 0.4;
            bar.style.width = (happy / total) * 100 + '%';
            const k = b.dataset.k;
            W.char.play(k === 'selfie' ? 'selfie' : k === 'sign' ? 'reach' : k === 'five' ? 'fistPump' : 'wave', { restart: true });
            if (k === 'selfie') { W.char.showProp('phone'); G.audio.sfx('shutter'); setTimeout(() => W.char.showProp(null), 1300); }
            n.c.play(good ? 'celebrate' : 'shrug', { restart: true }); n.c.setExpression(good ? 'laugh' : 'neutral', 2);
            G.audio.sfx(good ? 'good' : 'pop');
            G.ui.labels.bubble(n.c.root, good ? pick(['Best day ever!', 'OMG thank you!!', 'I love your videos!', 'Legend!']) : pick(['Oh… thanks!', 'Haha okay', 'Cool!']));
            served++;
            await sleep(1100);
            v.moveNPC(n, -v.W / 2 + 1.0, n.c.root.position.z + 0.6, -Math.PI / 2, 'idle').then(() => v.removeNPC(n));
            W.char.play('idle');
            spawnFan();
            nextFan();
          },
        });
        nextFan();
      });
      await fin;
      closeOverlay(ui);
      G.game.advance(3);
      const subs = Math.round((12 + Math.pow(s.fans.vid, 0.62) * 0.35) * (0.5 + happy / total));
      const blip = Math.round(subs * 0.5);
      s.mood = clamp(s.mood + 4 + perfect, 0, 100);
      const xp = Math.round(40 + perfect * 8);
      const done2 = await fade('Heading home', '');
      W.exitVenue(); W.room.setDoorOpen(false);
      done2();
      G.game.addFans('blip', blip, null, true);
      bus.emit('q', { evt: 'meetup', n: 1 });
      await this.summary('Meetup recap', 'heart', [
        [ic('users'), 'Fans met', `${total}`],
        [ic('star'), 'Perfect moments', `${perfect}/${total}`],
        [ic('vidora'), 'Vidora subs', `+${fmt(subs)}`],
        [ic('blip'), 'Blip followers', `+${fmt(blip)}`],
      ], [`${ic('heart')} Community mood +${4 + perfect}`], (p) => { G.game.addXP(xp, p); G.game.addFans('vid', subs, p); }, xp);
      save(true);
    });
  },

  // ---------------------------------------------------------------- CAFÉ JOB
  job() {
    return G.game.run('job', async () => {
      const s = G.s, W = G.world;
      G.ui.hud.show(false);
      await W.goTo('door');
      W.room.setDoorOpen(true); G.audio.sfx('door');
      const done = await fade('Café Shift', 'Bean There · part-time');
      W.room.setDoorOpen(false);
      done();
      let res = { pay: 0, orders: 0, perfect: 0, tips: 0 };
      try {
        const { Job } = await import('./job.js');
        res = await Job.shift({ difficulty: clamp(0.2 + s.level * 0.03, 0.2, 0.8), wage: 4 + s.level });
      } catch (e) { console.error(e); }
      s.outings.job = s.clock.day;
      G.game.advance(4);
      s.needs.energy = clamp(s.needs.energy - 6, 0, 100);
      const p = { x: innerWidth / 2, y: innerHeight * 0.6 };
      if (res.pay > 0) G.game.addMoney(res.pay, p);
      G.game.addXP(15 + (res.orders || 0) * 2, p);
      bus.emit('q', { evt: 'job', n: 1 });
      toast(`Shift done: <b>${fmtMoney(res.pay)}</b> earned`, { icon: 'dollar', color: 'var(--lime)', sub: `${res.orders} orders · ${fmtMoney(res.tips || 0)} tips` });
      save(true);
    });
  },

  // ---------------------------------------------------------------- SKILLS / ACADEMY
  academy() {
    const s = G.s;
    const render = () => `<div class="skills">
      <div class="row" style="justify-content:space-between;margin-bottom:10px"><span class="chip gold">${ic('star')}${s.skillPts || 0} skill points</span><span class="tiny muted" style="font-weight:600">+2 points every level up · or take a course</span></div>
      ${Object.entries(SKILLS).map(([k, d]) => {
        const lv = s.skills[k] || 0, max = lv >= SKILL_MAX, price = coursePrice(lv);
        return `<div class="skill" style="--sc:${d.color}"><div class="sk-ic">${ic(d.icon)}</div>
          <div class="grow"><div class="row" style="justify-content:space-between"><b>${d.name}</b><span class="tiny muted">Lv ${lv}/${SKILL_MAX}</span></div><div class="sk-bar">${Array.from({ length: SKILL_MAX }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div><small>${d.desc}</small></div>
          <div class="sk-btns">${max ? `<span class="chip good">${ic('crown')}Max</span>` : `<button class="btn ${s.skillPts > 0 ? 'cyan' : 'ghost'} small" data-a="${s.skillPts > 0 ? 'pt' : 'nopt'}" data-k="${k}">${ic('star')}+1</button><button class="btn ghost small" data-a="course" data-k="${k}">${ic('trophy')}Course <span class="price">${fmtMoney(price)}</span></button>`}</div></div>`;
      }).join('')}</div>`;
    const body = h(`<div>${render()}</div>`);
    const m = modal({ title: 'Creator Academy', sub: `${ic('trophy')} Skills make every video, stream and party better`, icon: 'trophy', iconBg: 'linear-gradient(135deg,#3cc8ff,#8f7dff)', body, size: 'md' });
    const up = (k) => { s.skills[k] = Math.min(SKILL_MAX, (s.skills[k] || 0) + 1); G.audio.sfx('levelup'); toast(`${SKILLS[k].name} is now level ${s.skills[k]}`, { icon: SKILLS[k].icon, color: SKILLS[k].color }); body.innerHTML = render(); save(); };
    bind(body, {
      pt: (b) => { if (s.skillPts <= 0) return; s.skillPts--; up(b.dataset.k); },
      nopt: () => { G.audio.sfx('error'); toast('No skill points — level up or take a course', { icon: 'star', color: 'var(--amber)' }); },
      course: (b) => {
        const k = b.dataset.k, price = coursePrice(s.skills[k] || 0);
        if (G.game.busy) return;
        if (s.needs.energy < 12) { G.audio.sfx('error'); toast('Too tired for class', { icon: 'bolt', color: 'var(--red)' }); return; }
        if (!G.game.spend(price)) return;
        G.game.advance(3);
        up(k);
      },
    });
  },

  // ---------------------------------------------------------------- shared recap
  summary(title, icon, rows, notes, apply, xp) {
    return new Promise((res) => {
      const body = h(`<div class="recap">
        <div class="rc-k">${rows.map(([i, l, v]) => `<div><small>${i}${l}</small><b>${v}</b></div>`).join('')}</div>
        ${notes.length ? `<div class="rc-n">${notes.map((n) => `<span class="chip good">${n}</span>`).join('')}</div>` : ''}
        <button class="btn go big" data-a="ok" style="width:100%;margin-top:14px">${ic('check')}Collect${xp ? ` <span class="price">+${xp} XP</span>` : ''}</button></div>`);
      const m = modal({ title, icon, iconBg: 'linear-gradient(135deg,#7b5cff,#ff4d6d)', body, size: 'sm', noClose: true, onClose: res });
      G.audio.sfx('reward');
      bind(body, { ok: (b) => { const r = b.getBoundingClientRect(); apply({ x: r.left + r.width / 2, y: r.top }); m.close(); } });
    });
  },
};
